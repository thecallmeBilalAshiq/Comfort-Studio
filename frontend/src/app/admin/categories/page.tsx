'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Save, Layers, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '@/lib/driveUrl';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface Cat { id: number; name: string; slug: string; image: string; productCount: number; subcategories: { id: number; name: string; slug: string; image?: string; }[]; }

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [uploadingSubIndex, setUploadingSubIndex] = useState<number | null>(null);
  const { upload, loading: uploadingImage } = useCloudinaryUpload();

  useEffect(() => {
    const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
    if (!isAuthorized) return;
    api.admin.getCategories().then(setCats);
  }, [user]);

  const empty = { name: '', slug: '', image: '', subcategories: [] as { name: string; slug: string; image: string; }[] };

  const save = async () => {
    if (!editing) return;
    try {
      const data = { 
        ...editing, 
        image: convertGoogleDriveUrl(editing.image || ''),
        subcategories: (editing.subcategories || []).map((s: any) => ({
          ...s,
          image: convertGoogleDriveUrl(s.image || '')
        }))
      };
      if (isCreating) { await api.admin.createCategory(data); toast.success('Created'); }
      else { await api.admin.updateCategory(editing.id, data); toast.success('Updated'); }
      setEditing(null); setIsCreating(false); api.admin.getCategories().then(setCats);
    } catch { toast.error('Failed'); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.admin.deleteCategory(id); toast.success('Deleted'); api.admin.getCategories().then(setCats); } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3"><Layers size={28} /><h1 className="font-display text-3xl font-bold">Categories</h1></div>
        <button onClick={() => { setEditing({...empty}); setIsCreating(true); }} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition"><Plus size={16} /> Add Category</button>
      </div>

      <div className="space-y-3">
        {cats.map(c => (
          <div key={c.id} className="bg-white border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden"><img src={c.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100'} alt="" className="w-full h-full object-cover" /></div>
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.productCount} products · {c.subcategories.length} subcategories</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); setEditing(c); setIsCreating(false); }} className="p-1 hover:bg-gray-200 rounded"><Pencil size={14} /></button>
                <button onClick={e => { e.stopPropagation(); remove(c.id); }} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={14} /></button>
                {expanded === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expanded === c.id && c.subcategories.length > 0 && (
              <div className="border-t p-4 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2 font-medium">Subcategories:</p>
                <div className="flex flex-wrap gap-2">
                  {c.subcategories.map(s => (
                    <span key={s.id || s.slug} className="px-3 py-1.5 bg-white border rounded-full text-sm flex items-center gap-2 shadow-sm">
                      {s.image ? (
                        <img src={s.image} alt="" className="w-5 h-5 rounded-full object-cover border" />
                      ) : null}
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{isCreating ? 'Add Category' : 'Edit Category'}</h2>
              <button onClick={() => { setEditing(null); setIsCreating(false); }} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div>
                <label className="block text-sm font-medium mb-1">Category Image</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={editing.image || ''} 
                    onChange={e => setEditing({...editing, image: e.target.value})} 
                    className="flex-1 px-3 py-2 border rounded-lg text-sm" 
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
                          toast.loading('Uploading image to Cloudinary...', { id: 'cloudinary-cat-upload' });
                          const url = await upload(file, 'comfort_products');
                          setEditing({ ...editing, image: url });
                          toast.success('Uploaded to Cloudinary!', { id: 'cloudinary-cat-upload' });
                        } catch (err: any) {
                          toast.error(err.message || 'Upload failed', { id: 'cloudinary-cat-upload' });
                        }
                      }}
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <button 
                      type="button" 
                      disabled={uploadingImage}
                      className="px-4 py-2 border rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition flex items-center gap-1.5 h-full whitespace-nowrap"
                    >
                      <Upload size={14} />
                      {uploadingImage && uploadingSubIndex === null ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Supports direct URLs, Google Drive share links, or uploading directly to Cloudinary.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subcategories</label>
                <div className="space-y-3 mb-3">
                  {(editing.subcategories || []).map((s: any, i: number) => (
                    <div key={i} className="p-3 border rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center gap-2">
                        {s.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border bg-white shrink-0">
                            <img src={s.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-medium shrink-0">
                            No img
                          </div>
                        )}
                        <input 
                          type="text" 
                          value={s.name} 
                          onChange={e => { 
                            const subs = [...editing.subcategories]; 
                            subs[i] = { ...subs[i], name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }; 
                            setEditing({...editing, subcategories: subs}); 
                          }} 
                          className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white" 
                          placeholder="Subcategory name" 
                        />
                        <button 
                          type="button"
                          onClick={() => { const subs = editing.subcategories.filter((_: any, j: number) => j !== i); setEditing({...editing, subcategories: subs}); }} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete subcategory"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={s.image || ''} 
                          onChange={e => { 
                            const subs = [...editing.subcategories]; 
                            subs[i] = { ...subs[i], image: e.target.value }; 
                            setEditing({...editing, subcategories: subs}); 
                          }} 
                          className="flex-1 px-3 py-1.5 border rounded-lg text-xs bg-white" 
                          placeholder="Subcategory image URL or upload file" 
                        />
                        <div className="relative shrink-0">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setUploadingSubIndex(i);
                                toast.loading('Uploading image to Cloudinary...', { id: `cloudinary-sub-${i}` });
                                const url = await upload(file, 'comfort_products');
                                const subs = [...editing.subcategories];
                                subs[i] = { ...subs[i], image: url };
                                setEditing({ ...editing, subcategories: subs });
                                toast.success('Uploaded to Cloudinary!', { id: `cloudinary-sub-${i}` });
                              } catch (err: any) {
                                toast.error(err.message || 'Upload failed', { id: `cloudinary-sub-${i}` });
                              } finally {
                                setUploadingSubIndex(null);
                              }
                            }}
                            disabled={uploadingImage}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                          />
                          <button 
                            type="button" 
                            disabled={uploadingImage}
                            className="px-3 py-1.5 border rounded-lg text-xs bg-white hover:bg-gray-100 transition flex items-center gap-1.5 h-full whitespace-nowrap font-medium shadow-sm"
                          >
                            <Upload size={13} />
                            {uploadingImage && uploadingSubIndex === i ? 'Uploading...' : 'Upload Image'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => setEditing({...editing, subcategories: [...(editing.subcategories || []), { name: '', slug: '', image: '' }]})} 
                  className="text-sm text-accent hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus size={14} /> Add Subcategory
                </button>
              </div>
              <button onClick={save} className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition flex items-center justify-center gap-2"><Save size={16} /> {isCreating ? 'Create' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
