'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Star, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
    if (!isAuthorized) return;
    api.admin.getReviews().then(setReviews);
  }, [user]);

  const reply = async (id: number) => {
    if (!replyText.trim()) return;
    try { await api.admin.replyReview(id, replyText); setReviews(prev => prev.map(r => r.id === id ? { ...r, adminReply: replyText } : r)); setReplyId(null); setReplyText(''); toast.success('Reply sent'); } catch { toast.error('Failed'); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete review?')) return;
    try { await api.admin.deleteReview(id); setReviews(prev => prev.filter(r => r.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3"><Star size={28} /> Reviews ({reviews.length})</h1>
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{r.userName}</p>
                  <span className="text-xs text-gray-400">on</span>
                  <p className="text-sm text-accent">{r.productName}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />)}
                  <span className="text-xs text-gray-400 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setReplyId(r.id); setReplyText(r.adminReply || ''); }} className="p-1 hover:bg-blue-100 rounded text-blue-500"><MessageCircle size={14} /></button>
                <button onClick={() => remove(r.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            {r.adminReply && <div className="mt-3 ml-4 p-3 bg-accent/5 rounded border-l-2 border-accent"><p className="text-xs font-medium text-accent mb-1">Your Reply</p><p className="text-sm text-gray-600">{r.adminReply}</p></div>}
            {replyId === r.id && (
              <div className="mt-3 flex gap-2">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" onKeyDown={e => e.key === 'Enter' && reply(r.id)} />
                <button onClick={() => reply(r.id)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition">Reply</button>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center text-gray-500 py-10">No reviews yet</p>}
      </div>
    </div>
  );
}
