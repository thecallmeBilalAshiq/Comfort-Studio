import { Router } from 'express';
import db from '../db';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req: any, file, cb) => {
    const orderId = req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `order-${orderId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
  }
});

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CS-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const orders = db.prepare(`SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC`).all(req.user!.id);
  for (const order of orders as any[]) {
    order.items = db.prepare(`SELECT oi.*, p.name, p.image, p.slug FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(order.id);
  }
  res.json(orders);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId = ?').get(req.params.id, req.user!.id) as any;
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = db.prepare(`SELECT oi.*, p.name, p.image, p.slug FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(order.id);
  res.json(order);
});

router.get('/track/:orderNumber', (req, res) => {
  const order = db.prepare('SELECT id, orderNumber, status, total, shippingName, shippingCity, shippingZip, createdAt FROM orders WHERE orderNumber = ?').get(req.params.orderNumber) as any;
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = db.prepare(`SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(order.id);
  res.json(order);
});

router.post('/', optionalAuthMiddleware, (req: AuthRequest, res) => {
  try {
    const { items, shipping } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    let total = 0;
    const productIds = items.map((i: any) => i.productId);
    const products = db.prepare(`SELECT * FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`).all(...productIds) as any[];
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      total += product.price * item.quantity;
    }

    const shippingCost = total >= 500 ? 0 : 49;
    let orderNumber = generateOrderNumber();
    while (db.prepare('SELECT id FROM orders WHERE orderNumber = ?').get(orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    const paymentMethod = shipping.paymentMethod || 'Bank Pay';
    const status = paymentMethod === 'Cash on Delivery' ? 'processing' : 'pending_proof';

    const orderResult = db.prepare(`INSERT INTO orders (userId, orderNumber, total, shipping, status, shippingName, shippingEmail, shippingPhone, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user?.id || null, orderNumber, total, shippingCost, status,
      `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(), shipping.email, shipping.phone,
      '', shipping.city || '', '', shipping.postalCode || shipping.zip || '', ''
    );

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      insertItem.run(orderId, item.productId, item.quantity, product.price);
      updateStock.run(item.quantity, item.productId);
    }

    if (req.user) {
      db.prepare('DELETE FROM cart WHERE userId = ?').run(req.user.id);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare(`SELECT oi.*, p.name, p.image, p.slug FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(orderId);
    res.json({ ...order, items: orderItems });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/screenshot', optionalAuthMiddleware, upload.single('screenshot'), (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot file provided' });
    }

    let order: any;
    if (req.user) {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId = ?').get(orderId, req.user.id);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId IS NULL').get(orderId);
    }

    if (!order) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    const relativePath = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE orders SET paymentScreenshot = ?, status = ? WHERE id = ?').run(relativePath, 'processing', orderId);

    res.json({ success: true, paymentScreenshot: relativePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
