'use client';
import { useState, useEffect } from 'react';
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
  const [paymentMethod, setPaymentMethod] = useState<'Bank Pay' | 'Cash on Delivery'>('Bank Pay');
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    if (user && !user.emailVerified) {
      router.replace('/verify-email?redirect=checkout');
    }
  }, [user, router]);

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const shipping = total >= 500 ? 0 : 49.99;
  const grandTotal = total + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">No Items to Checkout</h1>
        <Link href="/shop" className="text-accent hover:underline">Go to Shop</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderItemsPayload = items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        selectedSize: i.selectedSize || '',
        selectedColor: i.selectedColor || '',
        selectedFabric: i.selectedFabric || '',
        selectedStorage: i.selectedStorage || '',
        selectedMattress: i.selectedMattress || '',
        price: i.price
      }));

      const result = await api.createOrder(
        orderItemsPayload,
        { ...form, paymentMethod }
      );
      clear();
      if (paymentMethod === 'Cash on Delivery') {
        toast.success('Order placed successfully!');
        router.push(`/checkout/success?orderNumber=${result.orderNumber}&total=${result.total}`);
      } else {
        toast.success('Order initiated! Please complete transfer and upload proof.');
        router.push(`/checkout/payment-upload?orderId=${result.id}&orderNumber=${result.orderNumber}&total=${result.total}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address *</label>
                <input required type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Muslim town, house no. 9" className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input required type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input-modern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal code *</label>
                <input required type="text" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="e.g. EC1A 1BB" className="input-modern" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4 text-[#5d4037]">Payment Method *</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'Bank Pay' ? 'border-accent bg-[#faf7f4] shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Bank Pay" 
                  checked={paymentMethod === 'Bank Pay'} 
                  onChange={() => setPaymentMethod('Bank Pay')} 
                  className="mt-1 text-accent focus:ring-accent border-gray-300 h-4 w-4" 
                  id="payment-method-bank"
                />
                <div className="space-y-1">
                  <span className="font-bold text-sm text-[#5d4037] block">Bank Pay</span>
                  <span className="text-xs text-gray-500 leading-relaxed block">Manual bank transfer. Upload receipt screenshot after order placement to verify.</span>
                </div>
              </label>

              <label className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'Cash on Delivery' ? 'border-accent bg-[#faf7f4] shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Cash on Delivery" 
                  checked={paymentMethod === 'Cash on Delivery'} 
                  onChange={() => setPaymentMethod('Cash on Delivery')} 
                  className="mt-1 text-accent focus:ring-accent border-gray-300 h-4 w-4" 
                  id="payment-method-cod"
                />
                <div className="space-y-1">
                  <span className="font-bold text-sm text-[#5d4037] block">Cash on Delivery</span>
                  <span className="text-xs text-gray-500 leading-relaxed block">Pay with cash upon delivery. Your order is processed immediately.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    <img src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.name || 'Product'}</p>
                    
                    {/* Variant selections */}
                    {(item.selectedSize || item.selectedFabric || item.selectedColor || item.selectedStorage || item.selectedMattress) && (
                      <div className="flex flex-wrap gap-x-2 text-[11px] text-gray-500">
                        {item.selectedSize && <span>Size: <strong className="text-gray-700">{item.selectedSize}</strong></span>}
                        {item.selectedFabric && <span>Fabric: <strong className="text-gray-700">{item.selectedFabric}</strong></span>}
                        {item.selectedColor && <span>Color: <strong className="text-gray-700">{item.selectedColor}</strong></span>}
                        {item.selectedStorage && <span>Storage: <strong className="text-gray-700">{item.selectedStorage}</strong></span>}
                        {item.selectedMattress && <span>Mattress: <strong className="text-gray-700">{item.selectedMattress}</strong></span>}
                      </div>
                    )}

                    <p className="text-gray-500 text-xs mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>£{total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? 'Free' : `£${shipping.toFixed(2)}`}</span></div>
              <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg">£{grandTotal.toFixed(2)}</span></div>
            </div>
            <button type="submit" disabled={loading} className="mt-6 w-full btn-primary disabled:opacity-50" id="place-order-btn">
              {loading ? 'Placing Order...' : `Place Order — £${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
