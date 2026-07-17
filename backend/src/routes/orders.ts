import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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
  const order = db.prepare('SELECT id, orderNumber, status, total, shippingName, shippingAddress, shippingCity, shippingState, shippingZip, createdAt FROM orders WHERE orderNumber = ?').get(req.params.orderNumber) as any;
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = db.prepare(`SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(order.id);
  res.json(order);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
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

    const orderResult = db.prepare(`INSERT INTO orders (userId, orderNumber, total, shipping, shippingName, shippingEmail, shippingPhone, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user!.id, orderNumber, total, shippingCost,
      `${shipping.firstName} ${shipping.lastName}`, shipping.email, shipping.phone,
      shipping.address, shipping.city, shipping.state, shipping.zip, shipping.country || 'United States'
    );

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      insertItem.run(orderId, item.productId, item.quantity, product.price);
      updateStock.run(item.quantity, item.productId);
    }

    db.prepare('DELETE FROM cart WHERE userId = ?').run(req.user!.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare(`SELECT oi.*, p.name, p.image, p.slug FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?`).all(orderId);
    res.json({ ...order, items: orderItems });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
