'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Users, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const isAuthorized = user && (user.isAdmin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com');
    if (!isAuthorized) return;
    api.admin.getUsers().then(setUsers);
  }, [user]);

  const remove = async (id: number) => {
    if (!confirm('Delete user?')) return;
    try { await api.admin.deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3"><Users size={28} /> Customers ({users.length})</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b bg-gray-50"><th className="p-3">Name</th><th>Email</th><th>Orders</th><th>Reviews</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="text-gray-500">{u.email}</td>
                  <td>{u.orderCount}</td>
                  <td>{u.reviewCount}</td>
                  <td className="text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><button onClick={() => remove(u.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
