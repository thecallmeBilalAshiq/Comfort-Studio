'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { FadeIn, FadeInLeft, FadeInRight } from '@/components/ScrollAnimations';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitContact(form);
      setSent(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <FadeIn>
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold">Get in Touch</h1>
          <p className="text-gray-500 mt-3 text-lg">We&apos;d love to hear from you. Send us a message!</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <FadeInLeft>
          <div className="space-y-6">
              <div className="glass-card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0"><Phone size={20} /></div>
              <div><h3 className="font-semibold">Phone</h3><p className="text-gray-500 text-sm mt-1">+44 7983 630088</p></div>
            </div>
            <div className="glass-card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0"><Mail size={20} /></div>
              <div><h3 className="font-semibold">Email</h3><p className="text-gray-500 text-sm mt-1">comfortstudiouk@gmail.com</p></div>
            </div>
            <div className="glass-card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0"><MapPin size={20} /></div>
              <div><h3 className="font-semibold">Address</h3><p className="text-gray-500 text-sm mt-1"> United Kingdom (UK) </p></div>
            </div>
          </div>
        </FadeInLeft>

        <FadeInRight className="lg:col-span-2">
          <div className="glass-card p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Send size={32} className="text-green-500" /></div>
                <h2 className="font-display text-2xl font-bold mb-2">Message Sent!</h2>
                <p className="text-gray-500">We&apos;ll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="mt-6 btn-primary">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-modern" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-modern" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-modern" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="input-modern resize-none" placeholder="Tell us more..." />
                </div>
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 flex items-center gap-2">
                  <Send size={16} /> {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </FadeInRight>
      </div>
    </div>
  );
}
