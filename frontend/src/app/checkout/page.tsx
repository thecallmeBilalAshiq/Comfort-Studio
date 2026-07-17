'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, Copy, Package } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  });

  const shipping = total >= 500 ? 0 : 49.99;
  const grandTotal = total + shipping;

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">No Items to Checkout</h1>
        <Link href="/shop" className="text-accent hover:underline">Go to Shop</Link>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Thank you for your order.</p>
        <div className="bg-gray-50 rounded-2xl p-6 mb-6 inline-block">
          <p className="text-sm text-gray-500 mb-1">Order Number</p>
          <p className="text-2xl font-bold font-mono text-accent">{orderComplete.orderNumber || `#${orderComplete.id}`}</p>
        </div>
        <p className="text-gray-500 mb-6">Total: <span className="font-bold">${Number(orderComplete.total).toFixed(2)}</span></p>
        <p className="text-sm text-gray-400 mb-8">A confirmation email has been sent to your email address.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/orders" className="btn-primary flex items-center gap-2"><Package size={16} /> View My Orders</Link>
          <Link href="/shop" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in'); return; }
    setLoading(true);
    try {
      const result = await api.createOrder(
        items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        form
      );
      clear();
      setOrderComplete(result);
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input required type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input required type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-modern" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input required type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input required type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input required type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                <input required type="text" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input required type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="input-modern" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3 text-sm">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    <img src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.name || 'Product'}</p>
                    <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping}`}</span></div>
              <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg">${grandTotal.toFixed(2)}</span></div>
            </div>
            <button type="submit" disabled={loading} className="mt-6 w-full btn-primary disabled:opacity-50">
              {loading ? 'Placing Order...' : `Place Order — $${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
