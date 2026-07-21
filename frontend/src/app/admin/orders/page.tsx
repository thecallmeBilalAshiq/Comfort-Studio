'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ShoppingCart, ChevronDown, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { FadeIn } from '@/components/ScrollAnimations';

const statuses = ['pending', 'pending_proof', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors: Record<string, string> = { 
  pending: 'bg-yellow-100 text-yellow-700', 
  pending_proof: 'bg-orange-100 text-orange-700', 
  processing: 'bg-blue-100 text-blue-700', 
  shipped: 'bg-purple-100 text-purple-700', 
  delivered: 'bg-green-100 text-green-700', 
  cancelled: 'bg-red-100 text-red-700' 
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Manual order logging state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingCity: '',
    shippingPostalCode: '',
    status: 'pending',
    items: [] as { productId: number; quantity: number; price: number; name: string }[]
  });

  useEffect(() => {
    const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
    if (!isAuthorized) return;
    api.admin.getOrders().then(setOrders);
    api.admin.getProducts().then(setProducts).catch(() => {});
  }, [user]);

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  const updateStatus = async (id: number, status: string) => {
    try { await api.admin.updateOrderStatus(id, status); setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); toast.success('Updated'); } catch { toast.error('Failed'); }
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === Number(selectedProductId));
    if (!prod) return;
    
    const existingIdx = newOrder.items.findIndex(i => i.productId === prod.id);
    if (existingIdx > -1) {
      const updatedItems = [...newOrder.items];
      updatedItems[existingIdx].quantity += selectedQuantity;
      setNewOrder({ ...newOrder, items: updatedItems });
    } else {
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { productId: prod.id, quantity: selectedQuantity, price: prod.price, name: prod.name }]
      });
    }
    setSelectedProductId('');
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (productId: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(i => i.productId !== productId)
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    try {
      await api.admin.createOrder(newOrder);
      toast.success('Order logged successfully!');
      setShowCreateModal(false);
      api.admin.getOrders().then(setOrders);
      setNewOrder({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        shippingCity: '',
        shippingPostalCode: '',
        status: 'pending',
        items: []
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to log order');
    }
  };

  const downloadExcel = () => {
    if (filtered.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order ID',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Created At',
      'Status',
      'Total Amount (£)',
      'Items Detail',
      'Shipping Recipient',
      'Shipping City',
      'Shipping Postal Code',
      'Shipping Email',
      'Shipping Phone',
      'Payment Screenshot Link'
    ];

    const rows = filtered.map(o => {
      const itemsDetail = o.items ? o.items.map((item: any) => `${item.name} (Qty: ${item.quantity}, Price: £${Number(item.price).toFixed(2)})`).join('; ') : '';
      const screenshotLink = o.paymentScreenshot 
        ? (o.paymentScreenshot.startsWith('http') ? o.paymentScreenshot : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${o.paymentScreenshot}`)
        : '';

      return [
        o.id,
        o.orderNumber || `Order #${o.id}`,
        o.customerName,
        o.customerEmail,
        new Date(o.createdAt).toLocaleString(),
        o.status,
        Number(o.total).toFixed(2),
        itemsDetail,
        o.shippingName,
        o.shippingCity,
        o.shippingPostalCode || o.shippingZip,
        o.shippingEmail,
        o.shippingPhone,
        screenshotLink
      ];
    });

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes(';')) {
        return `"${str}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel sheet downloaded!');
  };

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingCart size={28} className="text-accent" />
            <h1 className="font-display text-3xl font-bold">Orders</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold transition shrink-0 shadow-lg shadow-accent/10"
            >
              Log New Order
            </button>
            <button 
              onClick={downloadExcel} 
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-lg shadow-green-600/10 shrink-0"
            >
              <Download size={16} /> Export to Excel
            </button>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-modern w-auto">
              <option value="">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
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
                <p className="font-bold text-lg">£{Number(o.total).toFixed(2)}</p>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${expanded === o.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expanded === o.id && (
              <div className="border-t p-5 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Items</p>
                    {o.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm py-1.5">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden shrink-0"><img src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=50'} alt="" className="w-full h-full object-cover" /></div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{item.name}</span>
                          {(item.selectedSize || item.selectedColor || item.selectedStorage || item.selectedMattress) && (
                            <span className="block text-[10px] text-gray-500 truncate">
                              {[
                                item.selectedSize && `Size: ${item.selectedSize}`,
                                item.selectedColor && `Color: ${item.selectedColor}`,
                                item.selectedStorage && `Storage: ${item.selectedStorage}`,
                                item.selectedMattress && `Mattress: ${item.selectedMattress}`
                              ].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 shrink-0">x{item.quantity}</span>
                        <span className="font-medium shrink-0">£{Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Shipping</p>
                    <p className="text-sm font-medium">{o.shippingName}</p>
                    <p className="text-sm text-gray-600">{o.shippingCity}, {o.shippingPostalCode || o.shippingZip}</p>
                    <p className="text-sm text-gray-600">{o.shippingEmail} · {o.shippingPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Payment Proof</p>
                    {o.paymentScreenshot ? (
                      <div className="space-y-2">
                        <a 
                          href={o.paymentScreenshot} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-40 h-28 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:opacity-90 transition relative group"
                        >
                          <img 
                            src={o.paymentScreenshot} 
                            alt="Payment Receipt" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            View Receipt
                          </div>
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium italic">No screenshot uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No orders found</p>}
      </div>

      {/* Log New Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">Log Customer Order (Admin)</h2>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shipping info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Customer & Shipping Information</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={newOrder.customerName} 
                      onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })} 
                      className="input-modern" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={newOrder.customerEmail} 
                      onChange={e => setNewOrder({ ...newOrder, customerEmail: e.target.value })} 
                      className="input-modern" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer Phone</label>
                    <input 
                      type="text" 
                      value={newOrder.customerPhone} 
                      onChange={e => setNewOrder({ ...newOrder, customerPhone: e.target.value })} 
                      className="input-modern" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City *</label>
                      <input 
                        type="text" 
                        required 
                        value={newOrder.shippingCity} 
                        onChange={e => setNewOrder({ ...newOrder, shippingCity: e.target.value })} 
                        className="input-modern" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Postal code *</label>
                      <input 
                        type="text" 
                        required 
                        value={newOrder.shippingPostalCode} 
                        onChange={e => setNewOrder({ ...newOrder, shippingPostalCode: e.target.value })} 
                        placeholder="e.g. EC1A 1BB" 
                        className="input-modern" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Initial Order Status *</label>
                    <select 
                      value={newOrder.status} 
                      onChange={e => setNewOrder({ ...newOrder, status: e.target.value })} 
                      className="input-modern"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Items selection */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Select Products</h3>
                  
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Choose Product</label>
                      <select 
                        value={selectedProductId} 
                        onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : '')} 
                        className="input-modern"
                      >
                        <option value="">Select a product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (£{Number(p.price).toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Qty</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={selectedQuantity} 
                        onChange={e => setSelectedQuantity(parseInt(e.target.value) || 1)} 
                        className="input-modern" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddItem} 
                      className="bg-accent text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-accent-hover transition h-[42px]"
                    >
                      Add
                    </button>
                  </div>

                  <div className="border rounded-xl p-3 bg-gray-50/50 min-h-[150px] space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Added Items ({newOrder.items.length})</p>
                    
                    {newOrder.items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-8">No items added yet. Choose products above.</p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {newOrder.items.map(item => (
                          <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded-lg border text-xs">
                            <div className="flex-1 truncate">
                              <span className="font-semibold text-gray-800">{item.name}</span>
                              <span className="text-gray-400 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-semibold text-[#8d6e63] mr-3">£{(item.price * item.quantity).toFixed(2)}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(item.productId)} 
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-accent/5 p-4 rounded-xl border border-accent/10 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Subtotal:</span>
                    <span className="text-xl font-bold text-accent">
                      £{newOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-accent/15"
                >
                  Log Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
