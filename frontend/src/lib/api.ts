import { auth } from '@/lib/firebase';

const API = process.env.NEXT_PUBLIC_API_URL || (typeof window === 'undefined' ? 'http://localhost:3000' : '');

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      localStorage.setItem('cs_token', token);
      return token;
    } catch (err) {
      console.warn('Failed to refresh Firebase token:', err);
    }
  }
  return localStorage.getItem('cs_token');
}

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) => fetcher<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => fetcher<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getMe: () => fetcher<any>('/api/auth/me'),

  getProducts: (params?: Record<string, string>) => fetcher<any[]>(`/api/products${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getFeatured: () => fetcher<any[]>('/api/products/featured'),
  getBestSellers: () => fetcher<any[]>('/api/products/best-sellers'),
  getProduct: (slug: string) => fetcher<any>(`/api/products/${slug}`),

  getCategories: () => fetcher<any[]>('/api/categories'),

  getCart: () => fetcher<any[]>('/api/cart'),
  addToCart: (productId: number, quantity = 1) => fetcher<any[]>('/api/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCart: (productId: number, quantity: number) => fetcher<any[]>(`/api/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeFromCart: (productId: number) => fetcher<any[]>(`/api/cart/${productId}`, { method: 'DELETE' }),

  getOrders: () => fetcher<any[]>('/api/orders'),
  createOrder: (items: { productId: number; quantity: number }[], shipping: any) => fetcher<any>('/api/orders', { method: 'POST', body: JSON.stringify({ items, shipping }) }),
  trackOrder: (orderNumber: string) => fetcher<any>(`/api/orders/track/${orderNumber}`),
  uploadPaymentScreenshot: async (orderId: number, file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API}/api/orders/${orderId}/screenshot`, {
      method: 'POST',
      headers,
      body: formData
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }
      return res.json();
    });
  },

  getReviews: (productId: number) => fetcher<any>(`/api/reviews/${productId}`),
  submitReview: (productId: number, rating: number, comment: string) => fetcher<any>(`/api/reviews/${productId}`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),

  getBanners: () => fetcher<any[]>('/api/banners'),
  getScrollBanners: () => fetcher<any[]>('/api/banners/scroll'),

  getFooter: () => fetcher<any>('/api/footer'),

  submitContact: (data: { name: string; email: string; subject: string; message: string }) => fetcher<any>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),

  admin: {
    getStats: () => fetcher<any>('/api/admin/stats'),
    getProducts: () => fetcher<any[]>('/api/admin/products'),
    createProduct: (data: any) => fetcher<any>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: number, data: any) => fetcher<any>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id: number) => fetcher<any>(`/api/admin/products/${id}`, { method: 'DELETE' }),
    getCategories: () => fetcher<any[]>('/api/admin/categories'),
    createCategory: (data: any) => fetcher<any>('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id: number, data: any) => fetcher<any>(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id: number) => fetcher<any>(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    getOrders: () => fetcher<any[]>('/api/admin/orders'),
    updateOrderStatus: (id: number, status: string) => fetcher<any>(`/api/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getReviews: () => fetcher<any[]>('/api/admin/reviews'),
    replyReview: (id: number, adminReply: string) => fetcher<any>(`/api/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ adminReply }) }),
    deleteReview: (id: number) => fetcher<any>(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
    getUsers: () => fetcher<any[]>('/api/admin/users'),
    deleteUser: (id: number) => fetcher<any>(`/api/admin/users/${id}`, { method: 'DELETE' }),
    getBanners: () => fetcher<any[]>('/api/admin/banners'),
    createBanner: (data: any) => fetcher<any>('/api/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
    updateBanner: (id: number, data: any) => fetcher<any>(`/api/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBanner: (id: number) => fetcher<any>(`/api/admin/banners/${id}`, { method: 'DELETE' }),
    getScrollBanners: () => fetcher<any[]>('/api/admin/scroll-banners'),
    createScrollBanner: (data: any) => fetcher<any>('/api/admin/scroll-banners', { method: 'POST', body: JSON.stringify(data) }),
    updateScrollBanner: (id: number, data: any) => fetcher<any>(`/api/admin/scroll-banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteScrollBanner: (id: number) => fetcher<any>(`/api/admin/scroll-banners/${id}`, { method: 'DELETE' }),
    getContactMessages: () => fetcher<any[]>('/api/admin/contact-messages'),
    markMessageRead: (id: number) => fetcher<any>(`/api/admin/contact-messages/${id}/read`, { method: 'PUT' }),
    deleteMessage: (id: number) => fetcher<any>(`/api/admin/contact-messages/${id}`, { method: 'DELETE' }),
    getFooter: () => fetcher<any>('/api/admin/footer'),
    updateFooter: (data: any) => fetcher<any>('/api/admin/footer', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
