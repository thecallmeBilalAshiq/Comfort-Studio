import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const items = db.prepare(`
    SELECT w.id, w.productId, p.name, p.image, p.price, p.slug, p.stock 
    FROM wishlist w 
    JOIN products p ON w.productId = p.id 
    WHERE w.userId = ?
  `).all(req.user!.id);
  res.json(items);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check if already in wishlist
  const existing = db.prepare('SELECT id FROM wishlist WHERE userId = ? AND productId = ?').get(req.user!.id, productId);
  if (!existing) {
    db.prepare('INSERT INTO wishlist (userId, productId) VALUES (?, ?)').run(req.user!.id, productId);
  }

  const items = db.prepare(`
    SELECT w.id, w.productId, p.name, p.image, p.price, p.slug, p.stock 
    FROM wishlist w 
    JOIN products p ON w.productId = p.id 
    WHERE w.userId = ?
  `).all(req.user!.id);
  res.json(items);
});

router.delete('/:productId', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM wishlist WHERE userId = ? AND productId = ?').run(req.user!.id, req.params.productId);
  
  const items = db.prepare(`
    SELECT w.id, w.productId, p.name, p.image, p.price, p.slug, p.stock 
    FROM wishlist w 
    JOIN products p ON w.productId = p.id 
    WHERE w.userId = ?
  `).all(req.user!.id);
  res.json(items);
});

export default router;
