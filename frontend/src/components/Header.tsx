'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Search, Menu, X, ChevronDown, LogOut, Package, Shield, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import { Category } from '@/types';

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatExpanded, setMobileCatExpanded] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const catTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleCatEnter = () => {
    if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current);
    setCatOpen(true);
  };
  const handleCatLeave = () => {
    catTimeoutRef.current = setTimeout(() => setCatOpen(false), 200);
  };

  const closeMobileMenu = () => setMenuOpen(false);

  const toggleMobileCat = (catId: number) => {
    setMobileCatExpanded(prev => prev === catId ? null : catId);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#faf7f4]/95 backdrop-blur-xl shadow-lg shadow-brand/5 border-b border-accent/10' : 'bg-[#faf7f4]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="font-display text-2xl lg:text-3xl font-bold text-brand tracking-tight">
            Comfort <span className="gradient-text">Studio</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${pathname === '/' ? 'text-accent bg-accent/10' : 'text-brand hover:text-accent hover:bg-accent/5'}`}>Home</Link>
            <div className="relative" onMouseEnter={handleCatEnter} onMouseLeave={handleCatLeave}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-brand hover:text-accent hover:bg-accent/5 transition-all duration-300">
                Shop <ChevronDown size={14} className={`transition-transform duration-300 ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 pt-3">
                  <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-3 min-w-[260px]">
                    <Link href="/shop" className="block px-4 py-2.5 text-sm font-medium text-brand hover:bg-accent/10 hover:text-accent rounded-xl transition-all">All Products</Link>
                    {categories.map(cat => (
                      <div key={cat.id}>
                        <Link href={`/shop?category=${cat.slug}`} className="block px-4 py-2.5 text-sm text-brand hover:bg-accent/10 hover:text-accent rounded-xl transition-all font-bold">
                          {cat.name}
                        </Link>
                        {cat.subcategories?.length > 0 && (
                          <div className="ml-4 mb-1">
                            {cat.subcategories.map(sub => (
                              <Link key={sub.id} href={`/shop?category=${cat.slug}&subcategory=${sub.slug}`} className="block px-4 py-1.5 text-xs text-gray-600 hover:text-accent transition-all font-medium">
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/shop" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${pathname === '/shop' ? 'text-accent bg-accent/10' : 'text-brand hover:text-accent hover:bg-accent/5'}`}>Shop</Link>
            <Link href="/shop?badge=best-seller" className="px-4 py-2 rounded-xl text-sm font-bold text-brand hover:text-accent hover:bg-accent/5 transition-all duration-300">Best Sellers</Link>
            <Link href="/contact" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${pathname === '/contact' ? 'text-accent bg-accent/10' : 'text-brand hover:text-accent hover:bg-accent/5'}`}>Contact</Link>
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300">
              <Search size={20} />
            </button>

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300">
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 py-2 min-w-[220px] z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {user.isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/10 hover:text-accent transition-all" onClick={() => setUserMenuOpen(false)}>
                        <Shield size={16} /> Admin Dashboard
                      </Link>
                    )}
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/10 hover:text-accent transition-all" onClick={() => setUserMenuOpen(false)}>
                      <Package size={16} /> My Orders
                    </Link>
                    <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 text-left transition-all">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth" className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300">
                <User size={20} />
              </Link>
            )}

            <Link href="/cart" className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300 relative">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 animate-fade-in">
            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
              <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search furniture..." className="input-modern pr-10" />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition"><Search size={18} /></button>
            </form>
          </div>
        )}

        {menuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-1">
              <Link href="/" onClick={closeMobileMenu} className="block py-2.5 px-3 text-sm font-bold rounded-xl hover:bg-accent/5 hover:text-accent transition">Home</Link>
              <Link href="/shop" onClick={closeMobileMenu} className="block py-2.5 px-3 text-sm font-bold rounded-xl hover:bg-accent/5 hover:text-accent transition">Shop</Link>
              <Link href="/shop?badge=best-seller" onClick={closeMobileMenu} className="block py-2.5 px-3 text-sm font-bold rounded-xl hover:bg-accent/5 hover:text-accent transition">Best Sellers</Link>
              <Link href="/contact" onClick={closeMobileMenu} className="block py-2.5 px-3 text-sm font-bold rounded-xl hover:bg-accent/5 hover:text-accent transition">Contact</Link>
              {categories.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center">
                    <Link href={`/shop?category=${cat.slug}`} onClick={closeMobileMenu} className="flex-1 py-2.5 px-3 text-sm text-brand rounded-xl hover:bg-accent/5 hover:text-accent font-bold transition">{cat.name}</Link>
                    {cat.subcategories?.length > 0 && (
                      <button onClick={() => toggleMobileCat(cat.id)} className="p-2 mr-1 hover:bg-gray-100 rounded-lg transition">
                        <ChevronDown size={16} className={`transition-transform duration-200 ${mobileCatExpanded === cat.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {mobileCatExpanded === cat.id && cat.subcategories?.length > 0 && (
                    <div className="ml-4 mb-1">
                      {cat.subcategories.map(sub => (
                        <Link key={sub.id} href={`/shop?category=${cat.slug}&subcategory=${sub.slug}`} onClick={closeMobileMenu} className="block py-2 px-4 text-sm text-gray-600 hover:text-accent hover:bg-accent/5 rounded-lg font-medium transition">{sub.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
