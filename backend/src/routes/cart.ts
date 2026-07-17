import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const items = db.prepare(`SELECT c.*, p.name, p.image, p.price, p.slug FROM cart c JOIN products p ON c.productId = p.id WHERE c.userId = ?`).all(req.user!.id);
  res.json(items);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { productId, quantity = 1 } = req.body;
  const existing = db.prepare('SELECT * FROM cart WHERE userId = ? AND productId = ?').get(req.user!.id, productId) as any;
  if (existing) {
    db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)').run(req.user!.id, productId, quantity);
  }
  const items = db.prepare(`SELECT c.*, p.name, p.image, p.price, p.slug FROM cart c JOIN products p ON c.productId = p.id WHERE c.userId = ?`).all(req.user!.id);
  res.json(items);
});

router.put('/:productId', authMiddleware, (req: AuthRequest, res) => {
  const { quantity } = req.body;
  if (quantity <= 0) {
    db.prepare('DELETE FROM cart WHERE userId = ? AND productId = ?').run(req.user!.id, req.params.productId);
  } else {
    db.prepare('UPDATE cart SET quantity = ? WHERE userId = ? AND productId = ?').run(quantity, req.user!.id, req.params.productId);
  }
  const items = db.prepare(`SELECT c.*, p.name, p.image, p.price, p.slug FROM cart c JOIN products p ON c.productId = p.id WHERE c.userId = ?`).all(req.user!.id);
  res.json(items);
});

router.delete('/:productId', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM cart WHERE userId = ? AND productId = ?').run(req.user!.id, req.params.productId);
  const items = db.prepare(`SELECT c.*, p.name, p.image, p.price, p.slug FROM cart c JOIN products p ON c.productId = p.id WHERE c.userId = ?`).all(req.user!.id);
  res.json(items);
});

export default router;
