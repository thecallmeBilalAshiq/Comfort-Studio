# Comfort Studio - Firebase Authentication Integration Guide

This step-by-step guide explains how to migrate Comfort Studio from custom JWT authentication to **Firebase Authentication** with role-based access control (Admin vs. Customer).

---

## 🛠️ Step 1: Firebase Console Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**. Name it `Comfort-Studio`.
2. Navigate to **Build > Authentication** and click **Get Started**.
3. Under the **Sign-in method** tab, enable **Email/Password** provider and save.
4. Click the gear icon next to "Project Overview" and select **Project settings**.
5. Scroll down to "Your apps", click the **Web icon (</>)**, and register your app as `Comfort Studio Storefront`.
6. Copy the `firebaseConfig` block provided. You will need these keys for your frontend `.env.local` file:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
7. In the same Settings panel, click the **Service accounts** tab.
8. Click **Generate new private key** to download a service account JSON file. Save this securely on your local computer; you will need it for the Express backend.

---

## 💻 Step 2: Frontend Integration (Next.js)

### 1. Install Dependencies

Navigate to your `frontend/` directory and install the Firebase SDK:

```bash
cd frontend
npm install firebase
```

### 2. Configure Environment Variables

Create or edit your `frontend/.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Initialize Firebase Client

Create a new file `frontend/src/lib/firebase.ts`:

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
```

### 4. Update the `AuthContext`

Replace the logic in `frontend/src/contexts/AuthContext.tsx` with Firebase's auth state listener:

```typescript
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (n: string, e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch ID Token containing claims
        const tokenResult = await fbUser.getIdTokenResult(true);
        // Store Token for outgoing backend fetches
        localStorage.setItem('cs_token', tokenResult.token);

        setUser({
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || '',
          isAdmin: !!tokenResult.claims.admin, // Read custom claims from Firebase
        });
      } else {
        localStorage.removeItem('cs_token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (e: string, p: string) => {
    await signInWithEmailAndPassword(auth, e, p);
  };

  const register = async (n: string, e: string, p: string) => {
    const cred = await createUserWithEmailAndPassword(auth, e, p);
    await updateProfile(cred.user, { displayName: n });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

---

## ⚙️ Step 3: Backend Integration (Express)

### 1. Install Firebase Admin SDK

Navigate to your `backend/` directory:

```bash
cd backend
npm install firebase-admin
```

### 2. Configure Service Account Credentials

Save the service account private key JSON file inside your `backend/` folder (e.g. rename it to `firebase-service-account.json`). Add this file to your `backend/.gitignore` so you do not commit keys to GitHub.

Update `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 3. Initialize Firebase Admin

Update your server initialization in `backend/src/server.ts` or database connection:

```typescript
import admin from "firebase-admin";
import path from "path";

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  "./firebase-service-account.json";
admin.initializeApp({
  credential: admin.credential.cert(
    path.resolve(__dirname, "..", serviceAccountPath),
  ),
});
```

### 4. Rewrite the Authentication Middleware

Update `backend/src/middleware/auth.ts` to verify the Firebase ID Token:

```typescript
import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; isAdmin: boolean; name: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      id: decodedToken.uid, // Firebase UID is a string
      email: decodedToken.email || "",
      name: decodedToken.name || "",
      isAdmin: !!decodedToken.admin, // Reads custom claims
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired Firebase token" });
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
```

---

## 🔑 Step 4: Setting Admin Claims for a User

To make a user an Admin, you must assign the custom claims object `{ admin: true }` to their UID. You can write a temporary script inside your backend workspace to perform this action.

Create a scratch script in your backend workspace `backend/src/make-admin.ts`:

```typescript
import admin from "firebase-admin";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  "./firebase-service-account.json";
admin.initializeApp({
  credential: admin.credential.cert(
    path.resolve(__dirname, "..", serviceAccountPath),
  ),
});

const userEmail = "comfortstudiouk@gmail.com"; // Email of user you want to make admin

async function setAdminRole() {
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(
      `Successfully granted admin privileges to ${userEmail} (UID: ${user.uid})`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin claims:", error);
    process.exit(1);
  }
}

setAdminRole();
```

Run this script using the package runner:

```bash
npx tsx src/make-admin.ts
```

Once executed, the user will be granted the admin claim. When they log in on the client side next, `fbUser.getIdTokenResult(true)` will resolve `claims.admin` to `true`, granting admin access to the storefront and dashboard.
