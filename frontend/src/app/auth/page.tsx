'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Suspense } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, resetPassword, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(searchParams.get('redirect') || '/');
    }
  }, [user, router, searchParams]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Signed in!');
        router.push(searchParams.get('redirect') || '/');
      } else if (mode === 'register') {
        await register(form.name, form.email, form.password);
        toast.success('Account created!');
        router.push(searchParams.get('redirect') || '/');
      } else if (mode === 'forgot-password') {
        await resetPassword(form.email);
        toast.success('Password reset email sent!');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-gray-500 mt-2">
              {mode === 'login' ? 'Sign in to continue shopping' : mode === 'register' ? 'Join Comfort Studio today' : 'Enter your email to receive a reset link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-modern" placeholder="John Doe" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-modern" placeholder="you@example.com" />
            </div>
            {mode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot-password')} className="text-xs text-accent hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-modern pr-12" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setMode(mode === 'forgot-password' ? 'login' : mode === 'login' ? 'register' : 'login')} className="text-accent text-sm font-medium hover:underline">
              {mode === 'forgot-password' ? 'Back to Sign In' : mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <a href="/admin/login" className="text-xs text-gray-400 hover:text-accent transition"></a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}><AuthContent /></Suspense>;
}
