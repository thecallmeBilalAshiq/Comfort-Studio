import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'comfort-studio-secret-key-2026';

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, provider) VALUES (?, ?, ?, ?)').run(name, email, hash, 'local');
    const user = { id: result.lastInsertRowid as number, name, email, isAdmin: false };
    const token = generateToken(user);
    res.json({ token, user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken({ id: user.id, name: user.name, email: user.email, isAdmin: !!user.isAdmin });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: !!user.isAdmin } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, name, email, isAdmin, provider, avatar FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

export default router;
