'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFooterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    tagline: '', copyright: '', address: '', phone: '', email: '', hours: '',
    socialLinks: [] as { icon: string; url: string; }[],
    quickLinks: [] as { label: string; href: string; }[],
    customerServiceLinks: [] as { label: string; href: string; }[],
    paymentIcons: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) { router.push('/auth'); return; }
    api.admin.getFooter().then(data => {
      setForm({
        tagline: data.tagline || '', copyright: data.copyright || '', address: data.address || '', phone: data.phone || '', email: data.email || '', hours: data.hours || '',
        socialLinks: data.socialLinks ? (typeof data.socialLinks === 'string' ? JSON.parse(data.socialLinks) : data.socialLinks) : [],
        quickLinks: data.quickLinks ? (typeof data.quickLinks === 'string' ? JSON.parse(data.quickLinks) : data.quickLinks) : [],
        customerServiceLinks: data.customerServiceLinks ? (typeof data.customerServiceLinks === 'string' ? JSON.parse(data.customerServiceLinks) : data.customerServiceLinks) : [],
        paymentIcons: data.paymentIcons ? (typeof data.paymentIcons === 'string' ? JSON.parse(data.paymentIcons) : data.paymentIcons) : [],
      });
    }).finally(() => setLoading(false));
  }, [user]);

  const save = async () => {
    try { await api.admin.updateFooter(form); toast.success('Footer updated'); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold">Edit Footer</h1>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition"><Save size={16} /> Save</button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Brand</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Tagline</label><textarea value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" /></div>
            <div><label className="block text-sm font-medium mb-1">Copyright Text</label><input type="text" value={form.copyright} onChange={e => setForm({...form, copyright: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Address</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Hours</label><input type="text" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Quick Links</h2>
            <button onClick={() => setForm({...form, quickLinks: [...form.quickLinks, { label: '', href: '/' }]})} className="text-sm text-accent hover:underline">+ Add</button>
          </div>
          {form.quickLinks.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={l.label} onChange={e => { const links = [...form.quickLinks]; links[i] = { ...links[i], label: e.target.value }; setForm({...form, quickLinks: links}); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Label" />
              <input type="text" value={l.href} onChange={e => { const links = [...form.quickLinks]; links[i] = { ...links[i], href: e.target.value }; setForm({...form, quickLinks: links}); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="/path" />
              <button onClick={() => setForm({...form, quickLinks: form.quickLinks.filter((_, j) => j !== i)})} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded text-sm">X</button>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Customer Service Links</h2>
            <button onClick={() => setForm({...form, customerServiceLinks: [...form.customerServiceLinks, { label: '', href: '/' }]})} className="text-sm text-accent hover:underline">+ Add</button>
          </div>
          {form.customerServiceLinks.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={l.label} onChange={e => { const links = [...form.customerServiceLinks]; links[i] = { ...links[i], label: e.target.value }; setForm({...form, customerServiceLinks: links}); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Label" />
              <input type="text" value={l.href} onChange={e => { const links = [...form.customerServiceLinks]; links[i] = { ...links[i], href: e.target.value }; setForm({...form, customerServiceLinks: links}); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="/path" />
              <button onClick={() => setForm({...form, customerServiceLinks: form.customerServiceLinks.filter((_, j) => j !== i)})} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded text-sm">X</button>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Payment Icons</h2>
            <button onClick={() => setForm({...form, paymentIcons: [...form.paymentIcons, '']})} className="text-sm text-accent hover:underline">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.paymentIcons.map((icon, i) => (
              <div key={i} className="flex items-center gap-1">
                <input type="text" value={icon} onChange={e => { const icons = [...form.paymentIcons]; icons[i] = e.target.value; setForm({...form, paymentIcons: icons}); }} className="px-3 py-2 border rounded-lg text-sm w-28" placeholder="e.g. Visa" />
                <button onClick={() => setForm({...form, paymentIcons: form.paymentIcons.filter((_, j) => j !== i)})} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm">X</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
