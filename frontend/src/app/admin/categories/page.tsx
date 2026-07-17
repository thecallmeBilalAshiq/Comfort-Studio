'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Save, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '@/lib/driveUrl';

interface Cat { id: number; name: string; slug: string; image: string; productCount: number; subcategories: { id: number; name: string; slug: string; }[]; }

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) { router.push('/auth'); return; }
    api.admin.getCategories().then(setCats);
  }, [user]);

  const empty = { name: '', slug: '', image: '', subcategories: [] as { name: string; slug: string; }[] };

  const save = async () => {
    if (!editing) return;
    try {
      const data = { ...editing, image: convertGoogleDriveUrl(editing.image || '') };
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
                <p className="text-xs text-gray-500 mb-2">Subcategories:</p>
                <div className="flex flex-wrap gap-2">
                  {c.subcategories.map(s => <span key={s.id} className="px-3 py-1 bg-white border rounded-full text-sm">{s.name}</span>)}
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
              <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="text" value={editing.image || ''} onChange={e => setEditing({...editing, image: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://... or Google Drive share link" /><p className="text-xs text-gray-400 mt-1">Supports direct URLs and Google Drive share links</p></div>
              <div>
                <label className="block text-sm font-medium mb-1">Subcategories</label>
                {(editing.subcategories || []).map((s: any, i: number) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" value={s.name} onChange={e => { const subs = [...editing.subcategories]; subs[i] = { ...subs[i], name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }; setEditing({...editing, subcategories: subs}); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Subcategory name" />
                    <button onClick={() => { const subs = editing.subcategories.filter((_: any, j: number) => j !== i); setEditing({...editing, subcategories: subs}); }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setEditing({...editing, subcategories: [...(editing.subcategories || []), { name: '', slug: '' }]})} className="text-sm text-accent hover:underline flex items-center gap-1"><Plus size={14} /> Add Subcategory</button>
              </div>
              <button onClick={save} className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition flex items-center justify-center gap-2"><Save size={16} /> {isCreating ? 'Create' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
