'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { FooterData } from '@/types';

export default function Footer() {
  const [footer, setFooter] = useState<FooterData | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.getFooter().then(setFooter).catch(() => {});
  }, []);

  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="font-display text-2xl font-bold">
              Comfort <span className="text-accent">Studio</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              {footer?.tagline || 'Transforming houses into homes with premium furniture that combines style, comfort, and quality craftsmanship.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {(footer?.quickLinks?.length ? footer.quickLinks : [
                { label: 'Shop All', href: '/shop' },
                { label: 'Best Sellers', href: '/shop?badge=best-seller' },
                { label: 'New Arrivals', href: '/shop?badge=new' },
                { label: 'Sale', href: '/shop?badge=sale' },
              ]).map((l, i) => (
                <li key={i}><Link href={l.href} className="hover:text-accent transition-colors flex items-center gap-1"><ArrowRight size={12} /> {l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {(footer?.customerService?.length ? footer.customerService : [
                { label: 'My Account', href: '/auth' },
                { label: 'Order Tracking', href: '/orders' },
                { label: 'Shipping Policy', href: '#' },
                { label: 'Returns & Exchanges', href: '#' },
              ]).map((l, i) => (
                <li key={i}><Link href={l.href} className="hover:text-accent transition-colors flex items-center gap-1"><ArrowRight size={12} /> {l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm text-gray-400">
              {footer?.contact?.address && <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> <span>{footer.contact.address}</span></div>}
              {footer?.contact?.phone && <div className="flex items-center gap-2"><Phone size={16} className="shrink-0" /> <span>{footer.contact.phone}</span></div>}
              {footer?.contact?.email && <div className="flex items-center gap-2"><Mail size={16} className="shrink-0" /> <span>{footer.contact.email}</span></div>}
              {footer?.contact?.hours && <div className="flex items-center gap-2"><Clock size={16} className="shrink-0" /> <span>{footer.contact.hours}</span></div>}
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Subscribe for updates</p>
              <div className="flex">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className="flex-1 px-3 py-2 bg-white/10 rounded-l text-sm placeholder:text-gray-500 focus:outline-none" />
                <button className="px-3 py-2 bg-accent rounded-r text-sm font-medium hover:bg-accent-hover transition">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{footer?.copyright || `© ${new Date().getFullYear()} Comfort Studio. All rights reserved.`}</p>
          {footer?.paymentIcons?.length ? (
            <div className="flex items-center gap-2">
              {footer.paymentIcons.map((icon, i) => (
                <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded">{icon}</span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-white/10 px-2 py-1 rounded">Visa</span>
              <span className="bg-white/10 px-2 py-1 rounded">Mastercard</span>
              <span className="bg-white/10 px-2 py-1 rounded">PayPal</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
