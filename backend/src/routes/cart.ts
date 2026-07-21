import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const getCartItems = (userId: number) => {
  const items = db.prepare(`
    SELECT c.*, p.name, p.image, p.price as basePrice, p.slug 
    FROM cart c 
    JOIN products p ON c.productId = p.id 
    WHERE c.userId = ?
  `).all(userId) as any[];

  return items.map((item: any) => ({
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    quantity: item.quantity,
    name: item.name,
    image: item.image,
    price: item.price ? Number(item.price) : Number(item.basePrice),
    slug: item.slug,
    selectedSize: item.selectedSize || '',
    selectedColor: item.selectedColor || '',
    selectedStorage: item.selectedStorage || '',
    selectedMattress: item.selectedMattress || ''
  }));
};

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  res.json(getCartItems(req.user!.id));
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { productId, quantity = 1, size = '', color = '', storage = '', mattress = '', price } = req.body;
  const existing = db.prepare(`
    SELECT * FROM cart 
    WHERE userId = ? 
      AND productId = ? 
      AND COALESCE(selectedSize, '') = ? 
      AND COALESCE(selectedColor, '') = ? 
      AND COALESCE(selectedStorage, '') = ? 
      AND COALESCE(selectedMattress, '') = ?
  `).get(req.user!.id, productId, size, color, storage, mattress) as any;

  if (existing) {
    db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare(`
      INSERT INTO cart (userId, productId, quantity, selectedSize, selectedColor, selectedStorage, selectedMattress, price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user!.id, productId, quantity, size, color, storage, mattress, price ? Number(price) : null);
  }
  res.json(getCartItems(req.user!.id));
});

router.put('/:cartItemId', authMiddleware, (req: AuthRequest, res) => {
  const { quantity } = req.body;
  const cartItemId = Number(req.params.cartItemId);
  if (quantity <= 0) {
    db.prepare('DELETE FROM cart WHERE userId = ? AND id = ?').run(req.user!.id, cartItemId);
  } else {
    db.prepare('UPDATE cart SET quantity = ? WHERE userId = ? AND id = ?').run(quantity, req.user!.id, cartItemId);
  }
  res.json(getCartItems(req.user!.id));
});

router.delete('/:cartItemId', authMiddleware, (req: AuthRequest, res) => {
  const cartItemId = Number(req.params.cartItemId);
  db.prepare('DELETE FROM cart WHERE userId = ? AND id = ?').run(req.user!.id, cartItemId);
  res.json(getCartItems(req.user!.id));
});

export default router;
