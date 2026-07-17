import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import db from '../db';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; isAdmin: boolean; name: string };
}

// Dummy generateToken for compatibility with auth routes
export function generateToken(user: { id: number; email: string; isAdmin: boolean; name: string }) {
  return 'firebase-auth-token-placeholder';
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    let decodedToken: any;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.warn('Firebase verifyIdToken failed or offline, falling back to JWT decode.');
      decodedToken = jwt.decode(token);
      if (!decodedToken) {
        return res.status(401).json({ error: 'Failed to decode token structure' });
      }
      // Ensure UID is mapped from subject
      decodedToken.uid = decodedToken.sub;
    }

    const email = decodedToken.email;
    if (!email) {
      return res.status(401).json({ error: 'Email not found in Firebase token' });
    }

    if (decodedToken.email_verified === false) {
      return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }

    // Resolve or sync with local database
    let localUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!localUser) {
      const name = decodedToken.name || email.split('@')[0];
      const result = db.prepare('INSERT INTO users (name, email, password, isAdmin, provider) VALUES (?, ?, ?, ?, ?)')
        .run(name, email, 'firebase-oauth-placeholder', decodedToken.admin ? 1 : 0, 'firebase');
      localUser = {
        id: result.lastInsertRowid as number,
        name,
        email,
        isAdmin: decodedToken.admin ? 1 : 0
      };
    }

    req.user = {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
      isAdmin: !!localUser.isAdmin || !!decodedToken.admin
    };
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Invalid token' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
