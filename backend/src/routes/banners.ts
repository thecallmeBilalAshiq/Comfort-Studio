import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE active = 1 ORDER BY sortOrder ASC').all();
  res.json(banners);
});

router.get('/scroll', (_req, res) => {
  const banners = db.prepare('SELECT * FROM scroll_banners WHERE active = 1 ORDER BY sortOrder ASC').all();
  res.json(banners);
});

export default router;
