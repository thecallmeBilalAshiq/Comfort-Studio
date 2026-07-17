'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Megaphone, Plus, Trash2, Edit, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { FadeIn } from '@/components/ScrollAnimations';
import { convertGoogleDriveUrl } from '@/lib/driveUrl';

export default function AdminBannersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<any[]>([]);
  const [scrollBanners, setScrollBanners] = useState<any[]>([]);
  const [tab, setTab] = useState<'hero' | 'scroll'>('hero');
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image: '', bgColor: '#1a1a2e', textColor: '#ffffff', active: true, sortOrder: 0, text: '', speed: 20 });

  useEffect(() => {
    if (!user?.isAdmin) { router.push('/auth'); return; }
    api.admin.getBanners().then(setBanners);
    api.admin.getScrollBanners().then(setScrollBanners);
  }, [user]);

  if (!user?.isAdmin) return null;

  const load = () => {
    api.admin.getBanners().then(setBanners);
    api.admin.getScrollBanners().then(setScrollBanners);
  };

  const handleSave = async () => {
    try {
      if (tab === 'hero') {
        const data = { title: form.title, subtitle: form.subtitle, image: convertGoogleDriveUrl(form.image), bgColor: form.bgColor, textColor: form.textColor, active: form.active, sortOrder: form.sortOrder };
        if (editItem) { await api.admin.updateBanner(editItem.id, data); toast.success('Updated'); }
        else { await api.admin.createBanner(data); toast.success('Created'); }
      } else {
        const data = { text: form.text, bgColor: form.bgColor, textColor: form.textColor, speed: form.speed, active: form.active, sortOrder: form.sortOrder };
        if (editItem) { await api.admin.updateScrollBanner(editItem.id, data); toast.success('Updated'); }
        else { await api.admin.createScrollBanner(data); toast.success('Created'); }
      }
      setEditItem(null);
      setForm({ title: '', subtitle: '', image: '', bgColor: '#1a1a2e', textColor: '#ffffff', active: true, sortOrder: 0, text: '', speed: 20 });
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try {
      if (tab === 'hero') await api.admin.deleteBanner(id);
      else await api.admin.deleteScrollBanner(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    if (tab === 'hero') {
      setForm({ title: item.title || '', subtitle: item.subtitle || '', image: item.image || '', bgColor: item.bgColor || '#1a1a2e', textColor: item.textColor || '#ffffff', active: !!item.active, sortOrder: item.sortOrder || 0, text: '', speed: 20 });
    } else {
      setForm({ title: '', subtitle: '', image: '', bgColor: item.bgColor || '#c8956c', textColor: item.textColor || '#ffffff', active: !!item.active, sortOrder: item.sortOrder || 0, text: item.text || '', speed: item.speed || 20 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <FadeIn>
        <div className="flex items-center gap-3 mb-8">
          <Megaphone size={28} className="text-accent" />
          <h1 className="font-display text-3xl font-bold">Banner Management</h1>
        </div>
      </FadeIn>

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setTab('hero'); setEditItem(null); }} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'hero' ? 'bg-accent text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Hero Banners</button>
        <button onClick={() => { setTab('scroll'); setEditItem(null); }} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'scroll' ? 'bg-accent text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Scroll Banner</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4">{editItem ? 'Edit' : 'Add'} {tab === 'hero' ? 'Hero Banner' : 'Scroll Banner'}</h2>
          <div className="space-y-4">
            {tab === 'hero' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-modern" placeholder="Banner title" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="input-modern" placeholder="Banner subtitle" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Background Image URL (optional)</label>
                  <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="input-modern" placeholder="https://example.com/image.jpg or Google Drive share link" />
                  <p className="text-xs text-gray-400 mt-1">Supports direct URLs and Google Drive share links</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Scrolling Text</label>
                <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} className="input-modern resize-none" rows={2} placeholder="Free Shipping on Orders Over $500 | Cash on Delivery Available" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Background Color</label>
                <div className="flex gap-2"><input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><input value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} className="input-modern flex-1" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <div className="flex gap-2"><input type="color" value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><input value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="input-modern flex-1" /></div>
              </div>
            </div>
            {tab === 'scroll' && (
              <div>
                <label className="block text-sm font-medium mb-1">Speed (seconds)</label>
                <input type="number" value={form.speed} onChange={e => setForm(f => ({ ...f, speed: parseInt(e.target.value) || 20 }))} className="input-modern" min={5} max={60} />
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-accent" />
                <span className="text-sm font-medium">Active (show on website)</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="input-modern w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
              {editItem && <button onClick={() => { setEditItem(null); setForm({ title: '', subtitle: '', image: '', bgColor: '#1a1a2e', textColor: '#ffffff', active: true, sortOrder: 0, text: '', speed: 20 }); }} className="btn-secondary">Cancel</button>}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {tab === 'hero' ? banners.map((b: any) => (
            <div key={b.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {b.image && <img src={b.image} alt="" className="w-16 h-10 object-cover rounded-lg" />}
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {b.active ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-gray-400" />}
                <button onClick={() => handleEdit(b)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Edit size={14} /></button>
                <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : scrollBanners.map((b: any) => (
            <div key={b.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium line-clamp-1">{b.text}</p>
                <p className="text-xs text-gray-500">Speed: {b.speed}s</p>
              </div>
              <div className="flex items-center gap-2">
                {b.active ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-gray-400" />}
                <button onClick={() => handleEdit(b)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Edit size={14} /></button>
                <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {((tab === 'hero' && banners.length === 0) || (tab === 'scroll' && scrollBanners.length === 0)) && (
            <p className="text-center text-gray-500 py-10">No banners yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
