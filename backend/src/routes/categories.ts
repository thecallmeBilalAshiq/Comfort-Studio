import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  for (const cat of categories as any[]) {
    cat.subcategories = db.prepare('SELECT * FROM subcategories WHERE categoryId = ?').all(cat.id);
    const countRow: any = db.prepare('SELECT COUNT(*) as count FROM products WHERE categoryId = ?').get(cat.id);
    cat.productCount = countRow?.count ?? 0;
  }
  res.json(categories);
});

router.get('/:slug', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug) as any;
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  cat.subcategories = db.prepare('SELECT * FROM subcategories WHERE categoryId = ?').all(cat.id);
  res.json(cat);
});

export default router;
