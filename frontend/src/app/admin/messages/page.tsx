'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ContactMessage } from '@/types';
import { MessageSquare, Trash2, CheckCircle, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { FadeIn } from '@/components/ScrollAnimations';

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) { router.push('/auth'); return; }
    api.admin.getContactMessages().then(setMessages);
  }, [user]);

  if (!user?.isAdmin) return null;

  const markRead = async (id: number) => {
    try {
      await api.admin.markMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: 1 } : m));
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try {
      await api.admin.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <FadeIn>
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare size={28} className="text-accent" />
          <h1 className="font-display text-3xl font-bold">Contact Messages</h1>
          <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">{messages.filter(m => !m.read).length} unread</span>
        </div>
      </FadeIn>

      <div className="space-y-3">
        {messages.map((msg) => (
          <FadeIn key={msg.id}>
            <div className={`glass-card overflow-hidden transition-all ${!msg.read ? 'border-l-4 border-accent' : ''}`}>
              <div className="p-5 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => {
                setExpanded(expanded === msg.id ? null : msg.id);
                if (!msg.read) markRead(msg.id);
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{msg.name}</p>
                        {!msg.read && <span className="w-2 h-2 bg-accent rounded-full" />}
                      </div>
                      <p className="text-xs text-gray-500">{msg.email} · {new Date(msg.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {msg.subject && <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{msg.subject}</span>}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
              {expanded === msg.id && (
                <div className="border-t p-5 bg-gray-50/50">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              )}
            </div>
          </FadeIn>
        ))}
        {messages.length === 0 && <p className="text-center text-gray-500 py-10">No messages yet</p>}
      </div>
    </div>
  );
}
