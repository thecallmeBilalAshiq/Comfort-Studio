'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const total = searchParams.get('total') || '0';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="glass-card p-10 text-center space-y-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-inner">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-brand tracking-tight">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Thank you for shopping with Comfort Studio. Your order has been successfully placed under Cash on Delivery.
          </p>
        </div>

        <div className="bg-[#faf7f4] rounded-2xl p-6 border border-accent/10 space-y-3 max-w-md mx-auto shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">Order Number</p>
            <p className="text-2xl font-bold font-mono text-accent">{orderNumber}</p>
          </div>
          <div className="border-t border-accent/5 pt-3">
            <p className="text-sm font-semibold text-gray-700">
              Total to pay: <span className="text-[#8d6e63] font-bold">£{Number(total).toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed border-t border-gray-100 pt-6">
          <p className="font-semibold text-gray-700">What happens next?</p>
          <p>
            A confirmation email has been sent to your email address. We will verify your shipping info and dispatch your order. You can pay in cash when the courier delivers it.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/orders" className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 px-8 text-sm font-semibold">
            Track Order Status <ArrowRight size={16} />
          </Link>
          <Link href="/shop" className="w-full sm:w-auto border-2 border-gray-200 hover:border-accent text-brand hover:text-accent font-semibold py-3 px-8 rounded-xl text-sm flex items-center justify-center gap-2 transition duration-300">
            <ShoppingBag size={16} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
