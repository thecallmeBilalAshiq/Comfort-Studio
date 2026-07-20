'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, Package, ShoppingCart, Users, Star, 
  Layers, MessageSquare, Megaphone, LogOut, LayoutDashboard 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!authLoading) {
      const isAuthorizedAdmin = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
      if (!isLoginPage && !isAuthorizedAdmin) {
        router.replace('/admin/login');
      } else {
        setChecking(false);
      }
    }
  }, [user, authLoading, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">{children}</div>;
  }

  if (authLoading || checking) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
        <p className="text-gray-500">Checking authorization...</p>
      </div>
    );
  }

  const isAuthorizedAdmin = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
  if (!isAuthorizedAdmin) {
    return null;
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/products', label: 'Products', icon: <Package size={18} /> },
    { href: '/admin/categories', label: 'Categories', icon: <Layers size={18} /> },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/admin/reviews', label: 'Reviews', icon: <Star size={18} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { href: '/admin/banners', label: 'Banners', icon: <Megaphone size={18} /> },
    { href: '/admin/footer', label: 'Footer Settings', icon: <BarChart3 size={18} /> },
    { href: '/admin/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="w-full min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2d2d2d] text-white shrink-0 flex flex-col justify-between border-r shadow-xl">
        <div>
          {/* Brand Logo */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link href="/" className="font-display font-bold text-lg tracking-wider text-accent hover:opacity-90 transition">
              COMFORT STUDIO
            </Link>
            <span className="text-[10px] bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded-full border border-accent/20">
              Admin
            </span>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            {menuItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    active 
                      ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              logout().then(() => router.push('/'));
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-300 hover:text-red-100 hover:bg-red-500/10 rounded-xl transition-all duration-300"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0 shadow-sm">
          <h2 className="font-semibold text-gray-800 text-sm">
            Logged in as: <span className="font-bold text-accent">{user.name}</span> ({user.email})
          </h2>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50 transition">
              View Storefront
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
