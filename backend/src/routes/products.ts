import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { category, subcategory, search, sort, minPrice, maxPrice, badge, inStock, name } = req.query;
  let query = `SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug FROM products p LEFT JOIN categories c ON p.categoryId = c.id LEFT JOIN subcategories s ON p.subcategoryId = s.id WHERE 1=1`;
  const params: any[] = [];

  if (category) { query += ' AND c.slug = ?'; params.push(category); }
  if (subcategory) { query += ' AND s.slug = ?'; params.push(subcategory); }
  if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (name) { query += ' AND p.name LIKE ?'; params.push(`%${name}%`); }
  if (minPrice) { query += ' AND p.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { query += ' AND p.price <= ?'; params.push(Number(maxPrice)); }
  if (inStock === '1') { query += ' AND p.stock > 0'; }

  if (badge) {
    switch (badge) {
      case 'best-seller': query += " AND (p.badge LIKE '%Best Seller%' OR p.badge LIKE '%Top Rated%')"; break;
      case 'new': query += " AND p.badge LIKE '%New%'"; break;
      case 'sale': query += " AND p.badge LIKE '%Sale%'"; break;
      case 'featured': query += ' AND p.featured = 1'; break;
      default: query += ' AND p.badge = ?'; params.push(badge); break;
    }
  }

  switch (sort) {
    case 'price_asc': query += ' ORDER BY p.price ASC'; break;
    case 'price_desc': query += ' ORDER BY p.price DESC'; break;
    case 'price-low': query += ' ORDER BY p.price ASC'; break;
    case 'price-high': query += ' ORDER BY p.price DESC'; break;
    case 'rating': query += ' ORDER BY p.rating DESC, p.reviewCount DESC'; break;
    case 'newest': query += ' ORDER BY p.createdAt DESC'; break;
    case 'name': query += ' ORDER BY p.name ASC'; break;
    default: query += ' ORDER BY p.featured DESC, p.name ASC';
  }

  const products = db.prepare(query).all(...params);
  res.json(products);
});

router.get('/featured', (_req, res) => {
  const products = db.prepare(`SELECT p.*, c.name as categoryName, c.slug as categorySlug FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.featured = 1 ORDER BY p.price DESC LIMIT 8`).all();
  res.json(products);
});

router.get('/best-sellers', (_req, res) => {
  const products = db.prepare(`SELECT p.*, c.name as categoryName, c.slug as categorySlug FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.badge LIKE '%Best Seller%' OR p.badge LIKE '%Top Rated%' ORDER BY p.featured DESC, p.price DESC LIMIT 4`).all();
  res.json(products);
});

router.get('/:slug', (req, res) => {
  const product = db.prepare(`SELECT p.*, c.name as categoryName, c.slug as categorySlug, s.name as subcategoryName, s.slug as subcategorySlug FROM products p LEFT JOIN categories c ON p.categoryId = c.id LEFT JOIN subcategories s ON p.subcategoryId = s.id WHERE p.slug = ?`).get(req.params.slug) as any;
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const related = db.prepare(`SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.categoryId = ? AND p.id != ? ORDER BY p.price DESC LIMIT 4`).all(product.categoryId, product.id);
  const reviews = db.prepare(`SELECT r.*, u.name as userName FROM reviews r LEFT JOIN users u ON r.userId = u.id WHERE r.productId = ? ORDER BY r.createdAt DESC`).all(product.id);
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0;

  res.json({ product, related, reviews, reviewCount, avgRating: parseFloat(avgRating.toFixed(1)) });
});

export default router;
