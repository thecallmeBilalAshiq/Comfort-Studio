import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:productId', (req, res) => {
  const reviews = db.prepare(`SELECT r.*, u.name as userName FROM reviews r JOIN users u ON r.userId = u.id WHERE r.productId = ? ORDER BY r.createdAt DESC`).all(req.params.productId);
  const stats = db.prepare(`SELECT COUNT(*) as count, AVG(rating) as avgRating FROM reviews WHERE productId = ?`).get(req.params.productId) as any;
  res.json({ reviews, count: stats.count, avgRating: stats.avgRating ? parseFloat(stats.avgRating.toFixed(1)) : 0 });
});

router.post('/:productId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });

    const existing = db.prepare('SELECT id FROM reviews WHERE productId = ? AND userId = ?').get(req.params.productId, req.user!.id);
    if (existing) return res.status(400).json({ error: 'You already reviewed this product' });

    db.prepare('INSERT INTO reviews (productId, userId, rating, comment) VALUES (?, ?, ?, ?)').run(req.params.productId, req.user!.id, rating, comment || '');

    // Update product rating
    const stats = db.prepare('SELECT COUNT(*) as count, AVG(rating) as avg FROM reviews WHERE productId = ?').get(req.params.productId) as any;
    db.prepare('UPDATE products SET rating = ?, reviewCount = ? WHERE id = ?').run(stats.avg ? parseFloat(stats.avg.toFixed(1)) : 0, stats.count, req.params.productId);

    const reviews = db.prepare(`SELECT r.*, u.name as userName FROM reviews r JOIN users u ON r.userId = u.id WHERE r.productId = ? ORDER BY r.createdAt DESC`).all(req.params.productId);
    res.json({ reviews, count: stats.count, avgRating: stats.avg ? parseFloat(stats.avg.toFixed(1)) : 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
