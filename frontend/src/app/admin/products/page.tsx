'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Save, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '@/lib/driveUrl';

interface AdminProduct { id: number; name: string; slug: string; description: string; price: number; originalPrice: number|null; image: string; categoryId: number; subcategoryId: number; stock: number; badge: string; featured: number; categoryName: string; }
interface AdminCategory { id: number; name: string; slug: string; subcategories: { id: number; name: string; slug: string; }[]; }

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('');

  const empty: AdminProduct = { id: 0, name: '', slug: '', description: '', price: 0, originalPrice: null, image: '', categoryId: 0, subcategoryId: 0, stock: 0, badge: '', featured: 0, categoryName: '' };

  useEffect(() => {
    if (!user?.isAdmin) { router.push('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = () => {
    Promise.all([api.admin.getProducts().then(setProducts), api.admin.getCategories().then(setCategories)]);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  const save = async () => {
    if (!editing) return;
    try {
      const data = { ...editing, image: convertGoogleDriveUrl(editing.image) };
      if (isCreating) {
        await api.admin.createProduct(data);
        toast.success('Product created');
      } else {
        await api.admin.updateProduct(editing.id, data);
        toast.success('Product updated');
      }
      setEditing(null); setIsCreating(false); loadData();
    } catch { toast.error('Failed to save'); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { await api.admin.deleteProduct(id); toast.success('Deleted'); loadData(); } catch { toast.error('Failed'); }
  };

  const selectedCat = categories.find(c => c.id === editing?.categoryId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3"><Package size={28} /><h1 className="font-display text-3xl font-bold">Products</h1></div>
        <div className="flex gap-3">
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search..." className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button onClick={() => { setEditing({...empty}); setIsCreating(true); }} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition"><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b bg-gray-50"><th className="p-3">Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Badge</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="text-gray-500">{p.categoryName}</td>
                  <td>${p.price}</td>
                  <td><span className={`font-medium ${p.stock <= 0 ? 'text-red-500' : p.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>{p.stock}</span></td>
                  <td>{p.badge && <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">{p.badge}</span>}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(p); setIsCreating(false); }} className="p-1 hover:bg-gray-200 rounded"><Pencil size={14} /></button>
                      <button onClick={() => remove(p.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{isCreating ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={() => { setEditing(null); setIsCreating(false); }} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Price ($)</label><input type="number" value={editing.price} onChange={e => setEditing({...editing, price: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Original Price ($)</label><input type="number" value={editing.originalPrice || ''} onChange={e => setEditing({...editing, originalPrice: e.target.value ? parseFloat(e.target.value) : null})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Category</label><select value={editing.categoryId} onChange={e => setEditing({...editing, categoryId: parseInt(e.target.value), subcategoryId: 0})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value={0}>None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Subcategory</label><select value={editing.subcategoryId} onChange={e => setEditing({...editing, subcategoryId: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value={0}>None</option>{selectedCat?.subcategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" value={editing.stock} onChange={e => setEditing({...editing, stock: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Badge</label><select value={editing.badge} onChange={e => setEditing({...editing, badge: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">None</option><option value="new">New</option><option value="sale">Sale</option><option value="best-seller">Best Seller</option><option value="featured">Featured</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="text" value={editing.image} onChange={e => setEditing({...editing, image: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://... or Google Drive share link" /><p className="text-xs text-gray-400 mt-1">Supports direct URLs and Google Drive share links</p></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.featured} onChange={e => setEditing({...editing, featured: e.target.checked ? 1 : 0})} className="accent-accent" /><span className="text-sm">Featured Product</span></label>
              <button onClick={save} className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition flex items-center justify-center gap-2"><Save size={16} /> {isCreating ? 'Create Product' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
