'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Save, Package, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '@/lib/driveUrl';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number|null;
  image: string;
  categoryId: number;
  subcategoryId: number;
  stock: number;
  badge: string;
  featured: number;
  categoryName: string;
  galleryImages?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: { name: string; priceModifier: number }[];
  storageOptions?: { name: string; priceModifier: number }[];
  mattressOptions?: { name: string; priceModifier: number }[];
}
interface AdminCategory { id: number; name: string; slug: string; subcategories: { id: number; name: string; slug: string; }[]; }

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('');

  const { upload, loading: uploadingImage } = useCloudinaryUpload();
  const empty: AdminProduct = { 
    id: 0, 
    name: '', 
    slug: '', 
    description: '', 
    price: 0, 
    originalPrice: null, 
    image: '', 
    categoryId: 0, 
    subcategoryId: 0, 
    stock: 0, 
    badge: '', 
    featured: 0, 
    categoryName: '',
    galleryImages: [],
    colors: [],
    sizes: [],
    storageOptions: [],
    mattressOptions: []
  };

  useEffect(() => {
    const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
    if (!isAuthorized) return;
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { 
      await api.admin.deleteProduct(id); 
      toast.success('Deleted'); 
      loadData(); 
    } catch (err: any) { 
      toast.error(err.message || 'Failed'); 
    }
  };

  const setFormAndSlug = (name: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    });
  };

  const selectedCat = categories.find(c => c.id === editing?.categoryId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package size={28} className="text-accent" />
          <h1 className="font-display text-3xl font-bold">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            placeholder="Search products..." 
            className="input-modern w-48 sm:w-64" 
          />
          <button 
            onClick={() => { setEditing({...empty}); setIsCreating(true); }} 
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold transition shrink-0 shadow-lg shadow-accent/10"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50/50">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Badge</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium text-gray-800">{p.name}</td>
                  <td className="p-4 text-gray-500">{p.categoryName}</td>
                  <td className="p-4 font-semibold">£{Number(p.price).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      p.stock <= 0 ? 'bg-red-50 text-red-600 border border-red-100' : 
                      p.stock <= 5 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                      'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {p.stock} in stock
                    </span>
                  </td>
                  <td className="p-4">
                    {p.badge && (
                      <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium border border-accent/20">
                        {p.badge}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => { setEditing(p); setIsCreating(false); }} 
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-brand transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button 
                        onClick={() => remove(p.id)} 
                        className="p-2 hover:bg-red-50 rounded-xl text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-400">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in visible">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">{isCreating ? 'Add New Product' : 'Edit Product'}</h2>
              <button 
                onClick={() => { setEditing(null); setIsCreating(false); }} 
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={editing.name} 
                    onChange={e => setFormAndSlug(e.target.value)} 
                    className="input-modern" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description *</label>
                  <textarea 
                    required 
                    value={editing.description} 
                    onChange={e => setEditing({...editing, description: e.target.value})} 
                    rows={4} 
                    className="input-modern resize-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price (£) *</label>
                  <input 
                    type="number" 
                    required 
                    value={editing.price} 
                    onChange={e => setEditing({...editing, price: parseFloat(e.target.value) || 0})} 
                    className="input-modern" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Original Price (£)</label>
                  <input 
                    type="number" 
                    value={editing.originalPrice || ''} 
                    onChange={e => setEditing({...editing, originalPrice: e.target.value ? parseFloat(e.target.value) : null})} 
                    className="input-modern" 
                    placeholder="None" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category *</label>
                  <select 
                    value={editing.categoryId ?? 0} 
                    onChange={e => setEditing({...editing, categoryId: parseInt(e.target.value), subcategoryId: 0})} 
                    className="input-modern"
                  >
                    <option value={0}>Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subcategory</label>
                  <select 
                    value={editing.subcategoryId ?? 0} 
                    onChange={e => setEditing({...editing, subcategoryId: parseInt(e.target.value)})} 
                    className="input-modern"
                  >
                    <option value={0}>None</option>
                    {selectedCat?.subcategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Stock Quantity *</label>
                  <input 
                    type="number" 
                    required 
                    value={editing.stock} 
                    onChange={e => setEditing({...editing, stock: parseInt(e.target.value) || 0})} 
                    className="input-modern" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Badge</label>
                  <select 
                    value={editing.badge ?? ''} 
                    onChange={e => setEditing({...editing, badge: e.target.value})} 
                    className="input-modern"
                  >
                    <option value="">None</option>
                    <option value="new">New</option>
                    <option value="sale">Sale</option>
                    <option value="best-seller">Best Seller</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product Image *</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      required 
                      value={editing.image} 
                      onChange={e => setEditing({...editing, image: e.target.value})} 
                      className="input-modern flex-1" 
                      placeholder="https://... or upload a local file" 
                    />
                    <div className="relative shrink-0">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            toast.loading('Uploading image to Cloudinary...', { id: 'cloudinary-prod-upload' });
                            const url = await upload(file, 'comfort_products');
                            setEditing({ ...editing, image: url });
                            toast.success('Uploaded to Cloudinary!', { id: 'cloudinary-prod-upload' });
                          } catch (err: any) {
                            toast.error(err.message || 'Upload failed', { id: 'cloudinary-prod-upload' });
                          }
                        }}
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full. h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button 
                        type="button" 
                        disabled={uploadingImage}
                        className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 h-full whitespace-nowrap"
                      >
                        <Upload size={14} />
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Supports pasting direct image links or selecting a file to upload directly to Cloudinary.</p>
                </div>

                {/* 1. Gallery Images */}
                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gallery Images (More Images)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {(editing.galleryImages || []).map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editing.galleryImages || [])];
                            updated.splice(idx, 1);
                            setEditing({ ...editing, galleryImages: updated });
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="new-gallery-url"
                      placeholder="Paste image link & press enter..."
                      className="input-modern flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            setEditing({
                              ...editing,
                              galleryImages: [...(editing.galleryImages || []), target.value.trim()]
                            });
                            target.value = '';
                          }
                        }
                      }}
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          try {
                            toast.loading(`Uploading ${files.length} images...`, { id: 'gallery-upload' });
                            const urls: string[] = [];
                            for (let i = 0; i < files.length; i++) {
                              const url = await upload(files[i], 'comfort_products');
                              urls.push(url);
                            }
                            setEditing({
                              ...editing,
                              galleryImages: [...(editing.galleryImages || []), ...urls]
                            });
                            toast.success('Added to gallery!', { id: 'gallery-upload' });
                          } catch (err: any) {
                            toast.error(err.message || 'Upload failed', { id: 'gallery-upload' });
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 h-full"
                      >
                        <Upload size={12} />
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Colors */}
                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plush Colors</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editing.colors || []).map((col, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border rounded-full text-xs font-medium">
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: col.hex }} />
                        <span>{col.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editing.colors || [])];
                            updated.splice(idx, 1);
                            setEditing({ ...editing, colors: updated });
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(editing.colors || []).length === 0 && (
                      <p className="text-xs text-gray-400">No color options defined.</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      id="color-name-input"
                      placeholder="Color Name (e.g. Royal Blue)"
                      className="input-modern flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-color-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <input
                      type="color"
                      id="color-hex-input"
                      className="w-10 h-8 border rounded-lg cursor-pointer shrink-0 p-0"
                      defaultValue="#000000"
                    />
                    <button
                      type="button"
                      id="add-color-btn"
                      onClick={() => {
                        const nameInput = document.getElementById('color-name-input') as HTMLInputElement;
                        const hexInput = document.getElementById('color-hex-input') as HTMLInputElement;
                        if (nameInput && nameInput.value.trim()) {
                          setEditing({
                            ...editing,
                            colors: [...(editing.colors || []), { name: nameInput.value.trim(), hex: hexInput.value }]
                          });
                          nameInput.value = '';
                        } else {
                          toast.error('Please enter a color name');
                        }
                      }}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* 3. Sizes */}
                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sizes</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editing.sizes || []).map((sz, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border rounded-full text-xs font-medium">
                        <span>{sz.name} ({sz.priceModifier >= 0 ? `+£${sz.priceModifier}` : `-£${Math.abs(sz.priceModifier)}`})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editing.sizes || [])];
                            updated.splice(idx, 1);
                            setEditing({ ...editing, sizes: updated });
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(editing.sizes || []).length === 0 && (
                      <p className="text-xs text-gray-400">No size options defined.</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      id="size-name-input"
                      placeholder="Size Name (e.g. 5'0 King)"
                      className="input-modern flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-size-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <input
                      type="number"
                      id="size-price-modifier"
                      placeholder="Price Mod (£)"
                      className="input-modern w-28 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-size-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <button
                      type="button"
                      id="add-size-btn"
                      onClick={() => {
                        const nameInput = document.getElementById('size-name-input') as HTMLInputElement;
                        const modInput = document.getElementById('size-price-modifier') as HTMLInputElement;
                        if (nameInput && nameInput.value.trim()) {
                          setEditing({
                            ...editing,
                            sizes: [...(editing.sizes || []), { name: nameInput.value.trim(), priceModifier: parseFloat(modInput.value) || 0 }]
                          });
                          nameInput.value = '';
                          modInput.value = '';
                        } else {
                          toast.error('Please enter a size name');
                        }
                      }}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* 4. Storage Options */}
                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Storage Options</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editing.storageOptions || []).map((st, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border rounded-full text-xs font-medium">
                        <span>{st.name} ({st.priceModifier >= 0 ? `+£${st.priceModifier}` : `-£${Math.abs(st.priceModifier)}`})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editing.storageOptions || [])];
                            updated.splice(idx, 1);
                            setEditing({ ...editing, storageOptions: updated });
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(editing.storageOptions || []).length === 0 && (
                      <p className="text-xs text-gray-400">No storage options defined.</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      id="storage-name-input"
                      placeholder="Storage Type (e.g. 2 Drawers Same Side)"
                      className="input-modern flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-storage-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <input
                      type="number"
                      id="storage-price-modifier"
                      placeholder="Price Mod (£)"
                      className="input-modern w-28 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-storage-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <button
                      type="button"
                      id="add-storage-btn"
                      onClick={() => {
                        const nameInput = document.getElementById('storage-name-input') as HTMLInputElement;
                        const modInput = document.getElementById('storage-price-modifier') as HTMLInputElement;
                        if (nameInput && nameInput.value.trim()) {
                          setEditing({
                            ...editing,
                            storageOptions: [...(editing.storageOptions || []), { name: nameInput.value.trim(), priceModifier: parseFloat(modInput.value) || 0 }]
                          });
                          nameInput.value = '';
                          modInput.value = '';
                        } else {
                          toast.error('Please enter a storage option name');
                        }
                      }}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* 5. Mattress Options */}
                <div className="sm:col-span-2 border-t border-gray-100 pt-4 mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mattress Options</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editing.mattressOptions || []).map((mt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border rounded-full text-xs font-medium">
                        <span>{mt.name} ({mt.priceModifier >= 0 ? `+£${mt.priceModifier}` : `-£${Math.abs(mt.priceModifier)}`})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editing.mattressOptions || [])];
                            updated.splice(idx, 1);
                            setEditing({ ...editing, mattressOptions: updated });
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(editing.mattressOptions || []).length === 0 && (
                      <p className="text-xs text-gray-400">No mattress options defined.</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      id="mattress-name-input"
                      placeholder="Mattress Type (e.g. 1000 Pocket Sprung)"
                      className="input-modern flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-mattress-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <input
                      type="number"
                      id="mattress-price-modifier"
                      placeholder="Price Mod (£)"
                      className="input-modern w-28 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('add-mattress-btn');
                          if (btn) btn.click();
                        }
                      }}
                    />
                    <button
                      type="button"
                      id="add-mattress-btn"
                      onClick={() => {
                        const nameInput = document.getElementById('mattress-name-input') as HTMLInputElement;
                        const modInput = document.getElementById('mattress-price-modifier') as HTMLInputElement;
                        if (nameInput && nameInput.value.trim()) {
                          setEditing({
                            ...editing,
                            mattressOptions: [...(editing.mattressOptions || []), { name: nameInput.value.trim(), priceModifier: parseFloat(modInput.value) || 0 }]
                          });
                          nameInput.value = '';
                          modInput.value = '';
                        } else {
                          toast.error('Please enter a mattress option name');
                        }
                      }}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Image Preview */}
              {editing.image && (
                <div className="border rounded-xl p-3 bg-gray-50 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border bg-white shrink-0">
                    <img 
                      src={convertGoogleDriveUrl(editing.image)} 
                      alt="Product Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Image Preview</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[300px]">{editing.image}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="featured"
                  checked={!!editing.featured} 
                  onChange={e => setEditing({...editing, featured: e.target.checked ? 1 : 0})} 
                  className="w-4 h-4 rounded text-accent focus:ring-accent border-gray-300 accent-accent" 
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Featured Product</label>
              </div>

              <button 
                onClick={save} 
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-lg shadow-accent/15 transition flex items-center justify-center gap-2"
              >
                <Save size={16} /> {isCreating ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
