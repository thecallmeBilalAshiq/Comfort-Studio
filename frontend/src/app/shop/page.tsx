'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Suspense } from 'react';

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    sort: searchParams.get('sort') || '',
    badge: searchParams.get('badge') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') || '',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      subcategory: searchParams.get('subcategory') || '',
      sort: searchParams.get('sort') || '',
      badge: searchParams.get('badge') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStock: searchParams.get('inStock') || '',
    });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.getProducts(params).then(setProducts).finally(() => setLoading(false));
  }, [filters]);

  const activeFilters = Object.entries(filters).filter(([_, v]) => v);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {filters.search ? `Results for "${filters.search}"` :
             filters.category ? categories.find(c => c.slug === filters.category)?.name || 'Shop' :
             filters.badge ? `${filters.badge.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : 'Shop All'}
          </h1>
          <p className="text-gray-500 mt-1">{products.length} products found</p>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 border rounded-lg">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {activeFilters.map(([key, val]) => (
            <button key={key} onClick={() => setFilters(f => ({ ...f, [key]: '' }))} className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
              {key === 'category' ? categories.find(c => c.slug === val)?.name || val :
               key === 'inStock' ? 'In Stock' :
               key === 'badge' ? val.replace('-', ' ') : `${key}: ${val}`}
              <X size={14} />
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className={`w-64 shrink-0 space-y-6 ${sidebarOpen ? 'fixed inset-0 bg-white z-50 p-6 overflow-auto lg:static lg:block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between lg:hidden">
            <h3 className="font-semibold">Filters</h3>
            <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>

          {/* Search */}
          <div>
            <h4 className="font-medium mb-3">Search</h4>
            <div className="relative">
              <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search..." className="w-full px-3 py-2 border rounded-lg text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-accent" />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-medium mb-3">Category</h4>
            <div className="space-y-2">
              <button onClick={() => setFilters(f => ({ ...f, category: '', subcategory: '' }))} className={`block text-sm w-full text-left ${!filters.category ? 'text-accent font-bold' : 'text-gray-700 font-semibold hover:text-accent'}`}>All Categories</button>
              {categories.map(cat => (
                <div key={cat.id}>
                  <button onClick={() => setFilters(f => ({ ...f, category: cat.slug, subcategory: '' }))} className={`block text-sm w-full text-left ${filters.category === cat.slug && !filters.subcategory ? 'text-accent font-bold' : 'text-gray-700 font-semibold hover:text-accent'}`}>{cat.name}</button>
                  {filters.category === cat.slug && cat.subcategories?.map(sub => (
                    <button key={sub.id} onClick={() => setFilters(f => ({ ...f, subcategory: sub.slug }))} className={`block text-xs pl-4 w-full text-left ${filters.subcategory === sub.slug ? 'text-accent font-bold' : 'text-gray-600 font-medium hover:text-accent'}`}>{sub.name}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Badge */}
          <div>
            <h4 className="font-medium mb-3">Type</h4>
            <div className="space-y-2">
              {[['', 'All'], ['best-seller', 'Best Sellers'], ['new', 'New Arrivals'], ['sale', 'On Sale'], ['featured', 'Featured']].map(([val, label]) => (
                <button key={val} onClick={() => setFilters(f => ({ ...f, badge: val }))} className={`block text-sm w-full text-left ${filters.badge === val ? 'text-accent font-medium' : 'text-gray-600 hover:text-accent'}`}>{label}</button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <h4 className="font-medium mb-3">Price Range</h4>
            <div className="flex gap-2">
              <input type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} placeholder="Min" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <input type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} placeholder="Max" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.inStock === '1'} onChange={e => setFilters(f => ({ ...f, inStock: e.target.checked ? '1' : '' }))} className="rounded accent-accent" />
              <span className="text-sm">In Stock Only</span>
            </label>
          </div>

          {/* Sort */}
          <div>
            <h4 className="font-medium mb-3">Sort By</h4>
            <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found</p>
              <button onClick={() => setFilters({ search: '', category: '', subcategory: '', sort: '', badge: '', minPrice: '', maxPrice: '', inStock: '' })} className="mt-4 text-accent hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading...</div>}><ShopContent /></Suspense>;
}
