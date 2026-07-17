import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { initializeApp, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import { initDB } from './db';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import bannerRoutes from './routes/banners';
import footerRoutes from './routes/footer';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';
import contactRoutes from './routes/contact';

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully via FIREBASE_SERVICE_ACCOUNT_JSON.');
  } else {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    const fullPath = path.resolve(__dirname, '..', serviceAccountPath);
    if (fs.existsSync(fullPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('Firebase service account file not found. Running in offline fallback mode.');
    }
  }
} catch (err) {
  console.warn('Firebase Admin SDK initialization failed. Running in offline fallback mode:', err);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

async function start() {
  await initDB();

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/banners', bannerRoutes);
  app.use('/api/footer', footerRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/contact', contactRoutes);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/', (_req, res) => res.json({ name: 'Comfort Studio API', version: '1.0.0', status: 'online', health: '/api/health' }));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
