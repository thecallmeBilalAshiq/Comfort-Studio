'use client';

import React, { useState } from 'react';
import { mockCatalog, formatPrice, Category, Product } from '../data/mockCatalog';
import { Grid, ShoppingBag, Star, Tag, Truck, Percent, StarHalf, ArrowRight, Layers } from 'lucide-react';

export default function CatalogShowcase() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(mockCatalog[0].id);

  // Find currently active category
  const activeCategory = mockCatalog.find(cat => cat.id === selectedCategoryId) || mockCatalog[0];

  // Map category slugs to matching icon elements for premium visual cues
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'offers':
      case 'clearance':
        return <Percent className="w-4 h-4" />;
      case 'trending':
        return <Star className="w-4 h-4 text-comfort-accent" />;
      case 'quick-delivery':
        return <Truck className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-comfort-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Showcase Header Section */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-comfort-accent bg-comfort-accent/10 px-3.5 py-1.5 rounded-full border border-comfort-accent/20">
            Exclusive Collection
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold text-comfort-secondary tracking-tight">
            Our Brand <span className="text-comfort-accent">Catalog</span>
          </h1>
          <p className="mt-3 text-lg text-comfort-secondary/70 max-w-2xl mx-auto">
            Redefining home layouts with premium, hand-crafted furniture built for longevity and aesthetic luxury.
          </p>
        </div>

        {/* Catalog Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar / Left Navigation */}
          <aside className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-xl shadow-comfort-secondary/5 border border-comfort-secondary/5">
            <h2 className="text-lg font-bold text-comfort-secondary mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Grid className="w-5 h-5 text-comfort-primary" />
              <span>Categories</span>
            </h2>
            <nav className="space-y-1.5">
              {mockCatalog.map(cat => {
                const isActive = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-comfort-primary text-white shadow-lg shadow-comfort-primary/20 scale-[1.02]'
                        : 'text-comfort-secondary/80 hover:text-comfort-primary hover:bg-comfort-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-comfort-accent' : 'text-comfort-secondary/40'}>
                        {getCategoryIcon(cat.slug)}
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-comfort-accent text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.products.length}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Product Grid / Main Content */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Active Category Meta Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-md border border-comfort-secondary/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-2xl font-bold text-comfort-secondary">{activeCategory.name}</h3>
                <p className="text-sm text-comfort-secondary/60">Showing {activeCategory.products.length} catalog items</p>
              </div>
              <div className="text-xs bg-comfort-primary/10 text-comfort-primary font-bold px-3 py-1.5 rounded-lg border border-comfort-primary/10">
                UK Standard Delivery Available
              </div>
            </div>

            {/* Grid of Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeCategory.products.map(prod => (
                <article
                  key={prod.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-comfort-secondary/5 flex flex-col justify-between"
                >
                  
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Floating badge */}
                    {prod.badge && (
                      <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-comfort-accent text-white px-2.5 py-1 rounded-md shadow-md">
                        {prod.badge}
                      </span>
                    )}

                    {/* Stock level indicators */}
                    <span className="absolute bottom-3 right-3 text-[10px] font-semibold bg-white/95 backdrop-blur-sm text-comfort-secondary px-2.5 py-1 rounded-md shadow">
                      {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Rating details */}
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < Math.floor(prod.rating) ? 'text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-comfort-secondary">{prod.rating}</span>
                        <span className="text-xs text-comfort-secondary/40">({prod.reviewCount})</span>
                      </div>

                      {/* Product Name */}
                      <h4 className="text-lg font-bold text-comfort-secondary group-hover:text-comfort-primary transition-colors line-clamp-1">
                        {prod.name}
                      </h4>

                      {/* Description */}
                      <p className="mt-1 text-sm text-comfort-secondary/60 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Bottom Pricing & CTA */}
                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        {/* Original price display for discounts */}
                        {prod.originalPrice && (
                          <span className="block text-xs text-red-500 line-through font-semibold">
                            {formatPrice(prod.originalPrice)}
                          </span>
                        )}
                        <span className="text-xl font-extrabold text-comfort-primary">
                          {formatPrice(prod.price)}
                        </span>
                      </div>

                      <button className="p-2.5 bg-comfort-secondary text-white hover:bg-comfort-accent hover:text-white rounded-xl shadow-md transition-all duration-300 transform group-hover:scale-105">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
