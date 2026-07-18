import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

let appInitialized = false;

if (getApps().length === 0) {
  try {
    // 1. Check for environment variables (ideal for Vercel deployment)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      appInitialized = true;
      console.log('Firebase Admin SDK initialized successfully via Environment Variables.');
    } 
    // 2. Fall back to local service account file (ideal for local development)
    else {
      const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        initializeApp({
          credential: cert(serviceAccount),
        });
        appInitialized = true;
        console.log('Firebase Admin SDK initialized successfully via local service account file.');
      } else {
        console.error('Firebase admin credentials not found. Please set environment variables or place firebase-service-account.json in the frontend root.');
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
} else {
  appInitialized = true;
}

export const adminDb = appInitialized ? getFirestore() : (null as any);
export const adminAuth = appInitialized ? getAuth() : (null as any);
