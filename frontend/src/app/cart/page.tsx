'use client';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const { items, updateQty, remove, total, count } = useCart();
  const { user } = useAuth();
  const shipping = total >= 500 ? 0 : 49.99;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="font-display text-3xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6">Looks like you haven't added any furniture yet.</p>
        <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition">
          Start Shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart ({count} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.productId} className="flex gap-4 bg-white p-4 rounded-xl border">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                <img src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.slug}`} className="font-medium hover:text-accent transition line-clamp-1">{item.name || 'Product'}</Link>
                <p className="text-accent font-bold mt-1">${item.price}</p>
                {item.stock !== undefined && item.stock <= 5 && item.stock > 0 && <p className="text-xs text-orange-500 mt-1">Only {item.stock} left</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-2 hover:bg-gray-100 transition"><Minus size={14} /></button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-2 hover:bg-gray-100 transition"><Plus size={14} /></button>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => remove(item.productId)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">${total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-medium">{shipping === 0 ? 'Free' : `$${shipping}`}</span></div>
              {shipping > 0 && <p className="text-xs text-green-600">Add ${(500 - total).toFixed(2)} more for free shipping</p>}
              <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg">${(total + shipping).toFixed(2)}</span></div>
            </div>
            <Link href="/checkout" className="mt-6 block w-full py-3 bg-accent text-white rounded-lg font-medium text-center hover:bg-accent-hover transition">Proceed to Checkout</Link>
            {!user && (
              <p className="text-xs text-gray-400 text-center mt-2">Checking out as Guest. You can also <Link href="/auth?redirect=checkout" className="text-accent hover:underline">Sign In</Link> to save orders.</p>
            )}
            <Link href="/shop" className="block mt-4 text-center text-accent text-sm hover:underline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
