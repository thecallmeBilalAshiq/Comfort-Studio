'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { FadeIn } from '@/components/ScrollAnimations';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});
  const [uploadingOrderIds, setUploadingOrderIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user && !user.emailVerified) {
      router.replace('/verify-email?redirect=orders');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !user.emailVerified) return;
    api.getOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="font-display text-3xl font-bold mb-4">Sign In Required</h1>
        <Link href="/auth?redirect=orders" className="text-accent hover:underline">Sign in to view orders</Link>
      </div>
    );
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <FadeIn>
        <h1 className="font-display text-3xl font-bold mb-8">My Orders</h1>
      </FadeIn>

      {/* Order Tracking */}
      <FadeIn delay={100}>
        <div className="glass-card p-6 mb-8">
          <h2 className="font-semibold mb-4">Track an Order</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const orderNumber = (form.elements.namedItem('trackingNumber') as HTMLInputElement).value.trim();
            if (!orderNumber) return;
            try {
              const order = await api.trackOrder(orderNumber);
              toast.success(`Order ${orderNumber}: ${order.status}`);
            } catch { toast.error('Order not found'); }
          }} className="flex gap-3">
            <input name="trackingNumber" placeholder="Enter order number (e.g., CS-XXXXXXXX)" className="input-modern flex-1" />
            <button type="submit" className="btn-primary">Track</button>
          </form>
        </div>
      </FadeIn>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link href="/shop" className="text-accent hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <FadeIn key={order.id} delay={i * 50}>
              <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-bold text-sm">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{order.orderNumber || `Order #${order.id}`}</p>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.orderNumber || `#${order.id}`); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={14} /></button>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="font-bold text-lg">${Number(order.total).toFixed(2)}</p>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t p-6 bg-gray-50/50 space-y-6">
                    {/* Progress */}
                    <div className="flex items-center justify-between max-w-lg">
                      {statusSteps.map((step, idx) => {
                        const currentIdx = statusSteps.indexOf(order.status);
                        const isActive = idx <= currentIdx;
                        return (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${isActive ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'}`}>
                              {idx + 1}
                            </div>
                            {idx < statusSteps.length - 1 && <div className={`w-12 h-0.5 mx-1 transition-all duration-500 ${idx < currentIdx ? 'bg-accent' : 'bg-gray-200'}`} />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between max-w-lg text-xs text-gray-500">
                      {statusSteps.map(s => <span key={s} className="capitalize">{s}</span>)}
                    </div>

                    {/* Items */}
                    {order.items && (
                      <div className="space-y-3">
                        {order.items.map((item: any) => (
                          <Link href={`/product/${item.slug || ''}`} key={item.id} className="flex items-center gap-3 text-sm p-3 bg-white rounded-xl hover:shadow-md transition">
                            <div className="w-14 h-14 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                              <img src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} x ${Number(item.price).toFixed(2)}</p>
                            </div>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 text-sm">
                        <p className="font-medium mb-1 text-[#5d4037]">Shipping Address</p>
                        <p className="text-gray-600">{order.shippingName}</p>
                        <p className="text-gray-500">{order.shippingAddress}, {order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                        <p className="text-gray-500 mt-1">{order.shippingPhone}</p>
                      </div>

                      <div className="bg-white rounded-xl p-4 text-sm space-y-3">
                        <p className="font-medium text-[#5d4037]">Payment Proof Receipt</p>
                        
                        {order.paymentScreenshot ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 p-2.5 rounded-lg border border-green-200">
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                              Payment Proof Submitted
                            </div>
                            <div className="relative aspect-[4/3] max-w-[200px] border rounded-lg overflow-hidden bg-gray-100 mt-2">
                              <img 
                                src={order.paymentScreenshot.startsWith('http') ? order.paymentScreenshot : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${order.paymentScreenshot}`} 
                                alt="Payment proof receipt" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-yellow-700 text-xs font-bold bg-yellow-50 p-2.5 rounded-lg border border-yellow-200">
                              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                              Awaiting Payment Proof
                            </div>
                            
                            <div className="bg-[#faf7f4] border border-accent/15 p-3 rounded-lg text-xs space-y-1.5">
                              <p className="font-bold text-[#8d6e63]">ABL: 0123-4567-8910-1112</p>
                              <p className="text-gray-400">Holder: Comfort Studio</p>
                            </div>

                            <div className="space-y-2">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setSelectedFiles(prev => ({ ...prev, [order.id]: file }));
                                  }
                                }}
                                className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-accent/10 file:text-accent text-[10px] text-gray-500 cursor-pointer w-full"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const file = selectedFiles[order.id];
                                    if (!file) {
                                      toast.error('Please choose a file first');
                                      return;
                                    }
                                    setUploadingOrderIds(prev => ({ ...prev, [order.id]: true }));
                                    try {
                                      const res = await api.uploadPaymentScreenshot(order.id, file);
                                      toast.success('Payment receipt uploaded successfully!');
                                      setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, paymentScreenshot: res.paymentScreenshot } : o));
                                    } catch (err: any) {
                                      toast.error(err.message || 'Upload failed');
                                    } finally {
                                      setUploadingOrderIds(prev => ({ ...prev, [order.id]: false }));
                                    }
                                  }}
                                  disabled={uploadingOrderIds[order.id] || !selectedFiles[order.id]}
                                  className="btn-primary py-1 px-3 text-[10px] disabled:opacity-50"
                                >
                                  {uploadingOrderIds[order.id] ? 'Uploading...' : 'Submit Screenshot'}
                                </button>
                                
                                <a 
                                  href={`https://wa.me/447983630088?text=${encodeURIComponent(`Hello Comfort Studio, here is my payment proof for order *${order.orderNumber || `#${order.id}`}* totaling *$${Number(order.total).toFixed(2)}*.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 py-1 px-3 rounded bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-[10px]"
                                >
                                  WhatsApp Proof
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
