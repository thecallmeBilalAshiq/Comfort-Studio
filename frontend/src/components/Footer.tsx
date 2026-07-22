'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowRight, Facebook, Instagram } from 'lucide-react';
import { api } from '@/lib/api';
import { FooterData } from '@/types';

export default function Footer() {
  const [footer, setFooter] = useState<FooterData | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.getFooter().then(data => {
      if (data) {
        setFooter({
          tagline: data.tagline || 'Transforming houses into homes with premium furniture that combines style, comfort, and quality craftsmanship.',
          copyright: data.copyright || `© ${new Date().getFullYear()} Comfort Studio. All rights reserved.`,
          contact: {
            address: data.address || '',
            phone: data.phone || '+44 7983 630088',
            email: data.email || 'comfortstudiouk@gmail.com',
            hours: data.hours || ' ',
          },
          socialLinks: [
            { icon: 'Facebook', url: 'https://www.facebook.com/comfortstudiouk' },
            { icon: 'Instagram', url: 'https://www.instagram.com/comfortstudiouk' }
          ],
          quickLinks: data.quickLinks ? (typeof data.quickLinks === 'string' ? JSON.parse(data.quickLinks) : data.quickLinks) : [],
          customerService: data.customerServiceLinks ? (typeof data.customerServiceLinks === 'string' ? JSON.parse(data.customerServiceLinks) : data.customerServiceLinks) : (data.customerService ? (typeof data.customerService === 'string' ? JSON.parse(data.customerService) : data.customerService) : []),
          paymentIcons: data.paymentIcons ? (typeof data.paymentIcons === 'string' ? JSON.parse(data.paymentIcons) : data.paymentIcons) : [],
        });
      }
    }).catch(() => {
      // Fallback
      setFooter({
        tagline: 'Transforming houses into homes with premium furniture that combines style, comfort, and quality craftsmanship.',
        copyright: `© ${new Date().getFullYear()} Comfort Studio. All rights reserved.`,
        contact: {
          address: '',
          phone: '+44 7983 630088',
          email: 'comfortstudiouk@gmail.com',
          hours: ' ',
        },
        socialLinks: [
          { icon: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61561167710692' },
          { icon: 'Instagram', url: 'https://www.instagram.com/official.comfortstudio' }
        ],
        quickLinks: [],
        customerService: [],
        paymentIcons: []
      });
    });
  }, []);

  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-display text-2xl font-bold">
              <img 
                src="https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg" 
                alt="Comfort Studio Logo" 
                className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
              />
              <span><span className="text-comfort-accent">Comfort</span> <span className="text-white">Studio</span></span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              {footer?.tagline}
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
              {footer?.contact?.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>{footer.contact.address}</span>
                </div>
              )}
              {footer?.contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" />
                  <a href={`tel:${footer.contact.phone.replace(/\s+/g, '')}`} className="hover:text-accent transition-colors">
                    {footer.contact.phone}
                  </a>
                </div>
              )}
              {footer?.contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="shrink-0" />
                  <a href={`mailto:${footer.contact.email}`} className="hover:text-accent transition-colors break-all">
                    {footer.contact.email}
                  </a>
                </div>
              )}
            </div>
            
            {/* Connect With Us */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="font-semibold mb-3">Connect With Us</h3>
              <div className="flex items-center gap-3">
                <a 
                  href="https://www.facebook.com/profile.php?id=61561167710692" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:bg-accent hover:text-white transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a 
                  href="https://www.instagram.com/official.comfortstudio" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:bg-accent hover:text-white transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{footer?.copyright}</p>
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
