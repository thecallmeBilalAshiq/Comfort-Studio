'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { AdminStats } from '@/types';
import { BarChart3, Package, ShoppingCart, Users, Star, TrendingUp, Clock, Layers, MessageSquare, Megaphone } from 'lucide-react';
import { FadeIn, ScaleIn } from '@/components/ScrollAnimations';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
    if (!isAuthorized) return;
    api.admin.getStats().then(setStats).catch(() => {});
  }, [user]);

  const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
  if (!isAuthorized) return null;

  const statCards = stats ? [
    { icon: <TrendingUp size={22} />, label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: 'from-green-500 to-emerald-600' },
    { icon: <Package size={22} />, label: 'Products', value: stats.totalProducts, color: 'from-blue-500 to-indigo-600' },
    { icon: <ShoppingCart size={22} />, label: 'Orders', value: stats.totalOrders, color: 'from-purple-500 to-violet-600' },
    { icon: <Users size={22} />, label: 'Customers', value: stats.totalUsers, color: 'from-orange-500 to-amber-600' },
    { icon: <Clock size={22} />, label: 'Pending', value: stats.pendingOrders, color: 'from-yellow-500 to-orange-500' },
    { icon: <Layers size={22} />, label: 'Categories', value: stats.totalCategories, color: 'from-indigo-500 to-blue-600' },
    { icon: <Star size={22} />, label: 'Reviews', value: stats.totalReviews, color: 'from-pink-500 to-rose-600' },
  ] : [];

  const links = [
    { href: '/admin/products', label: 'Products', desc: 'Manage products & stock', icon: <Package size={22} /> },
    { href: '/admin/categories', label: 'Categories', desc: 'Categories & subcategories', icon: <Layers size={22} /> },
    { href: '/admin/orders', label: 'Orders', desc: 'View & update orders', icon: <ShoppingCart size={22} /> },
    { href: '/admin/reviews', label: 'Reviews', desc: 'Reply to customer reviews', icon: <Star size={22} /> },
    { href: '/admin/users', label: 'Users', desc: 'Manage customers', icon: <Users size={22} /> },
    { href: '/admin/banners', label: 'Banners', desc: 'Hero & scroll banners', icon: <Megaphone size={22} /> },
    { href: '/admin/footer', label: 'Footer', desc: 'Edit footer content', icon: <BarChart3 size={22} /> },
    { href: '/admin/messages', label: 'Messages', desc: 'Contact form submissions', icon: <MessageSquare size={22} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <FadeIn>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user.name}</p>
          </div>
          <Link href="/" className="btn-secondary text-sm">View Store</Link>
        </div>
      </FadeIn>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {statCards.map((s, i) => (
            <ScaleIn key={i} delay={i * 50}>
              <div className="glass-card p-4 hover:shadow-lg transition-all duration-300 group">
                <div className={`bg-gradient-to-br ${s.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>{s.icon}</div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </ScaleIn>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {links.map((l, i) => (
          <ScaleIn key={l.href} delay={i * 50}>
            <Link href={l.href} className="glass-card p-5 hover:shadow-lg transition-all duration-300 group block">
              <div className="flex items-center gap-3">
                <div className="text-accent group-hover:scale-110 transition-transform">{l.icon}</div>
                <div>
                  <h3 className="font-semibold group-hover:text-accent transition">{l.label}</h3>
                  <p className="text-xs text-gray-500">{l.desc}</p>
                </div>
              </div>
            </Link>
          </ScaleIn>
        ))}
      </div>

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <FadeIn>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-accent hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b"><th className="py-3">ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {stats.recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                      <td className="py-3 font-medium">#{o.id}</td>
                      <td>{o.customerName}</td>
                      <td className="font-medium">${Number(o.total).toFixed(2)}</td>
                      <td><span className={`px-2 py-1 rounded-lg text-xs font-medium ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span></td>
                      <td className="text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
