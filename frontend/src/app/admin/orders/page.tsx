'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ShoppingCart, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { FadeIn } from '@/components/ScrollAnimations';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) { router.push('/auth'); return; }
    api.admin.getOrders().then(setOrders);
  }, [user]);

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  const updateStatus = async (id: number, status: string) => {
    try { await api.admin.updateOrderStatus(id, status); setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); toast.success('Updated'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <FadeIn>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3"><ShoppingCart size={28} className="text-accent" /><h1 className="font-display text-3xl font-bold">Orders</h1></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-modern w-auto"><option value="">All Status</option>{statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
        </div>
      </FadeIn>

      <div className="space-y-3">
        {filtered.map(o => (
          <div key={o.id} className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-bold text-sm">#{o.id}</div>
                <div>
                  <p className="font-semibold">{o.orderNumber || `Order #${o.id}`}</p>
                  <p className="text-xs text-gray-500">{o.customerName} · {o.customerEmail} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select value={o.status} onClick={e => e.stopPropagation()} onChange={e => updateStatus(o.id, e.target.value)} className="input-modern w-auto py-1.5 px-3 text-xs">
                  {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <p className="font-bold text-lg">${Number(o.total).toFixed(2)}</p>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${expanded === o.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expanded === o.id && (
              <div className="border-t p-5 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Items</p>
                    {o.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm py-1.5">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden"><img src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=50'} alt="" className="w-full h-full object-cover" /></div>
                        <span className="flex-1">{item.name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                        <span className="font-medium">${Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Shipping</p>
                    <p className="text-sm font-medium">{o.shippingName}</p>
                    <p className="text-sm text-gray-600">{o.shippingAddress}</p>
                    <p className="text-sm text-gray-600">{o.shippingCity}, {o.shippingState} {o.shippingZip}</p>
                    <p className="text-sm text-gray-600">{o.shippingEmail} · {o.shippingPhone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No orders found</p>}
      </div>
    </div>
  );
}
