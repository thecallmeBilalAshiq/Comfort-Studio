'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (n: string, e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerification: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
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

        let dbUser: any = null;
        try {
          dbUser = await api.getMe();
        } catch (err) {
          console.warn('Failed to fetch DB user during state change:', err);
        }

        setUser({
          id: dbUser?.id || fbUser.uid,
          email: dbUser?.email || fbUser.email,
          name: dbUser?.name || fbUser.displayName || '',
          isAdmin: !!dbUser?.isAdmin,
          emailVerified: fbUser.emailVerified,
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
    await sendEmailVerification(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const checkVerificationStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      if (updatedUser) {
        const tokenResult = await updatedUser.getIdTokenResult(true);
        localStorage.setItem('cs_token', tokenResult.token);

        let dbUser: any = null;
        try {
          dbUser = await api.getMe();
        } catch (err) {
          console.warn('Failed to fetch DB user during verification check:', err);
        }

        setUser({
          id: dbUser?.id || updatedUser.uid,
          email: dbUser?.email || updatedUser.email,
          name: dbUser?.name || updatedUser.displayName || '',
          isAdmin: !!dbUser?.isAdmin,
          emailVerified: updatedUser.emailVerified,
        });
        return updatedUser.emailVerified;
      }
    }
    return false;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, sendVerification, checkVerificationStatus, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

