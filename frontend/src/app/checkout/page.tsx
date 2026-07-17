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
  const [orderComplete, setOrderComplete] = useState<any>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
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

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">No Items to Checkout</h1>
        <Link href="/shop" className="text-accent hover:underline">Go to Shop</Link>
      </div>
    );
  }

  if (orderComplete) {
    const handleUpload = async () => {
      if (!screenshotFile) {
        toast.error('Please select an image file first');
        return;
      }
      setUploadingScreenshot(true);
      try {
        await api.uploadPaymentScreenshot(orderComplete.id, screenshotFile);
        toast.success('Screenshot uploaded successfully!');
        setScreenshotUploaded(true);
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload screenshot');
      }
      setUploadingScreenshot(false);
    };

    const whatsappMessage = encodeURIComponent(
      `Hello Comfort Studio, I just placed order *${orderComplete.orderNumber || `#${orderComplete.id}`}* totaling *$${Number(orderComplete.total).toFixed(2)}*. Here is my payment receipt.`
    );

    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="glass-card p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Order Placed!</h1>
            <p className="text-gray-500 mt-1">Thank you for your purchase.</p>
          </div>

          <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Order Number</p>
            <p className="text-3xl font-bold font-mono text-accent">{orderComplete.orderNumber || `#${orderComplete.id}`}</p>
            <p className="text-lg font-semibold text-[#8d6e63]">Total: ${Number(orderComplete.total).toFixed(2)}</p>
          </div>

          {/* Bank Transfer Instructions */}
          <div className="glass-card bg-[#faf7f4] border border-accent/10 p-6 text-left space-y-4">
            <h3 className="font-bold text-[#5d4037] text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Bank Transfer Instructions
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Please transfer the total amount of <strong>${Number(orderComplete.total).toFixed(2)}</strong> to the following bank account to process your order:
            </p>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Bank Name:</span>
                <span className="font-bold text-brand flex items-center gap-1">
                  Allied Bank Limited (ABL)
                  <button type="button" onClick={() => { navigator.clipboard.writeText('Allied Bank Limited'); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={12} /></button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Account Number:</span>
                <span className="font-bold text-brand font-mono flex items-center gap-1">
                  0123-4567-8910-1112
                  <button type="button" onClick={() => { navigator.clipboard.writeText('0123456789101112'); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={12} /></button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Account Holder:</span>
                <span className="font-bold text-brand flex items-center gap-1">
                  Comfort Studio
                  <button type="button" onClick={() => { navigator.clipboard.writeText('Comfort Studio'); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={12} /></button>
                </span>
              </div>
            </div>
          </div>

          {/* Proof Options */}
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-[#5d4037] text-sm">Send Payment Proof:</h4>
            
            {screenshotUploaded ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl flex items-center gap-2.5 font-medium">
                <CheckCircle size={18} />
                <span>Payment screenshot has been uploaded successfully! Our sales team is verifying.</span>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 p-5 rounded-2xl space-y-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Upload Payment Screenshot</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 text-xs text-gray-500 cursor-pointer w-full"
                  />
                  <button 
                    type="button"
                    onClick={handleUpload}
                    disabled={uploadingScreenshot || !screenshotFile}
                    className="btn-primary py-2 px-6 text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingScreenshot ? 'Uploading...' : 'Upload Receipt'}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center py-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">— OR —</span>
            </div>

            <a 
              href={`https://wa.me/447983630088?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008 0c3.202.001 6.212 1.244 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 12.003-2.002-.001-3.973-.5-5.739-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436-.005 9.858-4.427 9.862-9.864.002-2.63-1.023-5.102-2.89-6.972C16.578 1.899 14.108.879 11.998.88c-5.44.005-9.862 4.427-9.866 9.869-.001 1.636.452 3.23 1.312 4.636l-.993 3.627 3.72-.975zm11.167-7.9c-.29-.145-1.716-.848-1.978-.942-.262-.096-.453-.145-.644.145-.19.29-.738.942-.905 1.135-.167.19-.333.212-.623.067-.29-.145-1.22-.448-2.324-1.432-.86-.767-1.44-1.716-1.607-2.007-.167-.29-.018-.447.128-.591.13-.13.29-.338.436-.508.145-.17.19-.29.29-.483.096-.19.048-.363-.024-.508-.073-.145-.644-1.55-.882-2.124-.23-.556-.464-.48-.644-.49-.167-.008-.358-.01-.55-.01-.19 0-.5.07-.762.363-.263.29-1.003.98-1.003 2.392 0 1.41 1.026 2.775 1.17 2.968.143.193 2.017 3.08 4.887 4.316.682.294 1.216.47 1.63.602.687.218 1.312.187 1.808.113.553-.082 1.716-.701 1.958-1.378.243-.677.243-1.256.17-1.378-.072-.122-.263-.195-.554-.34z"/>
              </svg>
              Send Proof via WhatsApp
            </a>
          </div>

          <div className="pt-4 border-t flex justify-center gap-4">
            <Link href="/orders" className="btn-secondary text-xs">View My Orders</Link>
            <Link href="/shop" className="btn-secondary text-xs">Continue Shopping</Link>
          </div>
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
