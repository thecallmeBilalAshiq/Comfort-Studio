'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { MailOpen, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, sendVerification, checkVerificationStatus, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // If user is not logged in, redirect to auth page
    if (!user) {
      router.replace('/auth');
      return;
    }
    // If email is already verified, redirect to destination
    if (user.emailVerified) {
      router.replace(searchParams.get('redirect') || '/');
    }
  }, [user, router, searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!user || user.emailVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const verified = await checkVerificationStatus();
      if (verified) {
        toast.success('Email verified successfully!');
        router.push(searchParams.get('redirect') || '/');
      } else {
        toast.error('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to check status');
    }
    setChecking(false);
  };

  const handleResendEmail = async () => {
    setSending(true);
    try {
      await sendVerification();
      toast.success('Verification email resent!');
      setCountdown(60); // 60s cooldown
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification email');
    }
    setSending(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (err: any) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-lg">
        <div className="relative glass-card p-10 md:p-12 overflow-hidden shadow-2xl rounded-3xl border border-white/20 dark:border-gray-800 backdrop-blur-xl">
          {/* Subtle design gradients inside card */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-pink-500 to-indigo-500"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>

          <div className="text-center relative z-10">
            {/* Animated Icon container */}
            <div className="w-20 h-20 bg-gradient-to-tr from-accent/20 to-accent/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-accent/30 animate-pulse">
              <MailOpen size={40} className="text-accent" />
            </div>

            <h1 className="font-display text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-3 text-base">
              A verification link was sent to
            </p>
            <p className="text-accent font-semibold text-lg mt-1 select-all">
              {user.email}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-4 leading-relaxed max-w-md mx-auto">
              Please check your inbox (and spam folder) and click the link to activate your Comfort Studio account.
            </p>
          </div>

          <div className="mt-10 space-y-4 relative z-10">
            {/* Check status button */}
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 btn-primary py-4 rounded-2xl font-semibold shadow-lg hover:shadow-accent/20 hover:scale-[1.01] transition-all duration-300 disabled:opacity-75"
            >
              {checking ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
              {checking ? 'Checking status...' : 'I\'ve Verified My Email'}
            </button>

            {/* Resend/Back options */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleResendEmail}
                disabled={sending || countdown > 0}
                className="flex-1 flex items-center justify-center gap-2 btn-secondary py-3.5 rounded-2xl font-medium border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 disabled:opacity-50 text-sm"
              >
                {sending && <RefreshCw className="animate-spin" size={16} />}
                {countdown > 0 ? `Resend email in ${countdown}s` : 'Resend Email'}
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-900/50 transition-all duration-300 text-sm"
              >
                <LogOut size={16} />
                Sign Out / Use Another
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
