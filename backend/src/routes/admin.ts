import { Router } from 'express';
import db from '../db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// Dashboard stats
router.get('/stats', (_req, res) => {
  const totalRevenue = (db.prepare('SELECT COALESCE(SUM(total), 0) as val FROM orders').get() as any).val;
  const totalProducts = (db.prepare('SELECT COUNT(*) as val FROM products').get() as any).val;
  const totalOrders = (db.prepare('SELECT COUNT(*) as val FROM orders').get() as any).val;
  const totalUsers = (db.prepare('SELECT COUNT(*) as val FROM users WHERE isAdmin = 0').get() as any).val;
  const pendingOrders = (db.prepare("SELECT COUNT(*) as val FROM orders WHERE status = 'pending'").get() as any).val;
  const totalCategories = (db.prepare('SELECT COUNT(*) as val FROM categories').get() as any).val;
  const totalReviews = (db.prepare('SELECT COUNT(*) as val FROM reviews').get() as any).val;
  const avgRating = (db.prepare('SELECT COALESCE(AVG(rating), 0) as val FROM reviews').get() as any).val;
  const recentOrders = db.prepare('SELECT o.*, u.name as customerName FROM orders o JOIN users u ON o.userId = u.id ORDER BY o.createdAt DESC LIMIT 5').all();
  res.json({ totalRevenue, totalProducts, totalOrders, totalUsers, pendingOrders, totalCategories, totalReviews, avgRating: parseFloat(avgRating.toFixed(1)), recentOrders });
});

// Products CRUD
router.get('/products', (_req, res) => {
  const products = db.prepare(`SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id ORDER BY p.createdAt DESC`).all();
  res.json(products);
});

router.post('/products', (req, res) => {
  const { name, slug, description, price, originalPrice, image, categoryId, subcategoryId, stock, badge, featured } = req.body;
  const result = db.prepare('INSERT INTO products (name, slug, description, price, originalPrice, image, categoryId, subcategoryId, stock, badge, featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(name, slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description, price, originalPrice || null, image, categoryId || null, subcategoryId || null, stock || 0, badge || '', featured ? 1 : 0);
  res.json({ id: result.lastInsertRowid });
});

router.put('/products/:id', (req, res) => {
  const { name, slug, description, price, originalPrice, image, categoryId, subcategoryId, stock, badge, featured } = req.body;
  db.prepare('UPDATE products SET name=?, slug=?, description=?, price=?, originalPrice=?, image=?, categoryId=?, subcategoryId=?, stock=?, badge=?, featured=? WHERE id=?').run(name, slug, description, price, originalPrice, image, categoryId, subcategoryId, stock, badge, featured ? 1 : 0, req.params.id);
  res.json({ success: true });
});

router.delete('/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Categories CRUD
router.get('/categories', (_req, res) => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY name').all();
  for (const cat of cats as any[]) {
    cat.subcategories = db.prepare('SELECT * FROM subcategories WHERE categoryId = ?').all(cat.id);
    cat.productCount = (db.prepare('SELECT COUNT(*) as val FROM products WHERE categoryId = ?').get(cat.id) as any).val;
  }
  res.json(cats);
});

router.post('/categories', (req, res) => {
  const { name, slug, image, subcategories } = req.body;
  const result = db.prepare('INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)').run(name, slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), image || '');
  const catId = result.lastInsertRowid;
  if (subcategories && subcategories.length) {
    const insert = db.prepare('INSERT INTO subcategories (categoryId, name, slug) VALUES (?, ?, ?)');
    for (const sub of subcategories) {
      insert.run(catId, sub.name, sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  }
  res.json({ id: catId });
});

router.put('/categories/:id', (req, res) => {
  const { name, slug, image, subcategories } = req.body;
  db.prepare('UPDATE categories SET name=?, slug=?, image=? WHERE id=?').run(name, slug, image, req.params.id);
  db.prepare('DELETE FROM subcategories WHERE categoryId = ?').run(req.params.id);
  if (subcategories && subcategories.length) {
    const insert = db.prepare('INSERT INTO subcategories (categoryId, name, slug) VALUES (?, ?, ?)');
    for (const sub of subcategories) {
      insert.run(req.params.id, sub.name, sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  }
  res.json({ success: true });
});

router.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Orders
router.get('/orders', (_req, res) => {
  const orders = db.prepare(`SELECT o.*, u.name as customerName, u.email as customerEmail FROM orders o JOIN users u ON o.userId = u.id ORDER BY o.createdAt DESC`).all();
  for (const order of orders as any[]) {
    order.items = db.prepare(`SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(order.id);
  }
  res.json(orders);
});

router.put('/orders/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Reviews
router.get('/reviews', (_req, res) => {
  const reviews = db.prepare(`SELECT r.*, u.name as userName, u.email as userEmail, p.name as productName FROM reviews r JOIN users u ON r.userId = u.id JOIN products p ON r.productId = p.id ORDER BY r.createdAt DESC`).all();
  res.json(reviews);
});

router.put('/reviews/:id', (req, res) => {
  const { adminReply } = req.body;
  db.prepare('UPDATE reviews SET adminReply = ?, adminReplyDate = date("now") WHERE id = ?').run(adminReply, req.params.id);
  res.json({ success: true });
});

router.delete('/reviews/:id', (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Users
router.get('/users', (_req, res) => {
  const users = db.prepare(`SELECT u.id, u.name, u.email, u.isAdmin, u.provider, u.createdAt,
    (SELECT COUNT(*) FROM orders WHERE userId = u.id) as orderCount,
    (SELECT COUNT(*) FROM reviews WHERE userId = u.id) as reviewCount
    FROM users u WHERE u.isAdmin = 0 ORDER BY u.createdAt DESC`).all();
  res.json(users);
});

router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ? AND isAdmin = 0').run(req.params.id);
  res.json({ success: true });
});

// Banners
router.get('/banners', (_req, res) => {
  const banners = db.prepare('SELECT * FROM banners ORDER BY sortOrder').all();
  res.json(banners);
});

router.post('/banners', (req, res) => {
  const { title, subtitle, image, bgColor, textColor, active, sortOrder } = req.body;
  const result = db.prepare('INSERT INTO banners (title, subtitle, image, bgColor, textColor, active, sortOrder) VALUES (?,?,?,?,?,?,?)').run(title, subtitle, image || '', bgColor || '#1a1a2e', textColor || '#ffffff', active !== false ? 1 : 0, sortOrder || 0);
  res.json({ id: result.lastInsertRowid });
});

router.put('/banners/:id', (req, res) => {
  const { title, subtitle, image, bgColor, textColor, active, sortOrder } = req.body;
  db.prepare('UPDATE banners SET title=?, subtitle=?, image=?, bgColor=?, textColor=?, active=?, sortOrder=? WHERE id=?').run(title, subtitle, image || '', bgColor, textColor, active !== false ? 1 : 0, sortOrder || 0, req.params.id);
  res.json({ success: true });
});

router.delete('/banners/:id', (req, res) => {
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Scroll Banners
router.get('/scroll-banners', (_req, res) => {
  const banners = db.prepare('SELECT * FROM scroll_banners ORDER BY sortOrder').all();
  res.json(banners);
});

router.post('/scroll-banners', (req, res) => {
  const { text, bgColor, textColor, speed, active, sortOrder } = req.body;
  const result = db.prepare('INSERT INTO scroll_banners (text, bgColor, textColor, speed, active, sortOrder) VALUES (?,?,?,?,?,?)').run(text || '', bgColor || '#c8956c', textColor || '#ffffff', speed || 20, active !== false ? 1 : 0, sortOrder || 0);
  res.json({ id: result.lastInsertRowid });
});

router.put('/scroll-banners/:id', (req, res) => {
  const { text, bgColor, textColor, speed, active, sortOrder } = req.body;
  db.prepare('UPDATE scroll_banners SET text=?, bgColor=?, textColor=?, speed=?, active=?, sortOrder=? WHERE id=?').run(text, bgColor, textColor, speed || 20, active !== false ? 1 : 0, sortOrder || 0, req.params.id);
  res.json({ success: true });
});

router.delete('/scroll-banners/:id', (req, res) => {
  db.prepare('DELETE FROM scroll_banners WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Contact Messages
router.get('/contact-messages', (_req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY createdAt DESC').all();
  res.json(messages);
});

router.put('/contact-messages/:id/read', (req, res) => {
  db.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.delete('/contact-messages/:id', (req, res) => {
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Footer
router.get('/footer', (_req, res) => {
  const f = db.prepare('SELECT * FROM footer WHERE id = 1').get() as any;
  res.json(f || {});
});

router.put('/footer', (req, res) => {
  const { tagline, copyright, address, phone, email, hours, socialLinks, quickLinks, customerServiceLinks, paymentIcons } = req.body;
  const existing = db.prepare('SELECT id FROM footer WHERE id = 1').get();
  if (existing) {
    db.prepare('UPDATE footer SET tagline=?,copyright=?,address=?,phone=?,email=?,hours=?,socialLinks=?,quickLinks=?,customerServiceLinks=?,paymentIcons=? WHERE id=1').run(tagline, copyright, address, phone, email, hours, JSON.stringify(socialLinks), JSON.stringify(quickLinks), JSON.stringify(customerServiceLinks), JSON.stringify(paymentIcons));
  } else {
    db.prepare('INSERT INTO footer (id,tagline,copyright,address,phone,email,hours,socialLinks,quickLinks,customerServiceLinks,paymentIcons) VALUES (1,?,?,?,?,?,?,?,?,?,?)').run(tagline, copyright, address, phone, email, hours, JSON.stringify(socialLinks), JSON.stringify(quickLinks), JSON.stringify(customerServiceLinks), JSON.stringify(paymentIcons));
  }
  res.json({ success: true });
});

export default router;
