'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, RotateCcw, Headphones, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Category, Banner } from '@/types';
import ProductCard from '@/components/ProductCard';
import ScrollBanner from '@/components/ScrollBanner';
import { FadeIn, FadeInLeft, FadeInRight, ScaleIn } from '@/components/ScrollAnimations';

const features = [
  { icon: <Truck size={28} />, title: 'Free Shipping', desc: 'On orders over $500' },
  { icon: <Shield size={28} />, title: '5-Year Warranty', desc: 'On all products' },
  { icon: <RotateCcw size={28} />, title: '30-Day Returns', desc: 'Hassle-free' },
  { icon: <Headphones size={28} />, title: '24/7 Support', desc: 'Always here for you' },
];

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    Promise.all([
      api.getBanners().then(setBanners).catch(() => setBanners([
        { id: 1, title: 'Premium Furniture Collection', subtitle: 'Transform your space with timeless elegance', image: '', bgColor: '#1a1a2e', textColor: '#ffffff', active: 1, sortOrder: 0 },
      ])),
      api.getFeatured().then(setFeatured).catch(() => setFeatured([])),
      api.getBestSellers().then(setBestSellers).catch(() => setBestSellers([])),
      api.getCategories().then(setCategories).catch(() => setCategories([])),
    ]);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setActiveBanner(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const active = banners[activeBanner] || banners[0];

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[60vh] md:h-[80vh] flex items-center overflow-hidden">
        {active?.image ? (
          <>
            <div className="absolute inset-0">
              <img src={active.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: active?.bgColor || '#1a1a2e' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <FadeInLeft>
            <div className="max-w-xl">
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight" style={{ color: active?.textColor || '#fff' }}>
                {active?.title || 'Premium Furniture Collection'}
              </h1>
              <p className="mt-4 md:mt-6 text-lg md:text-xl opacity-80 leading-relaxed" style={{ color: active?.textColor || '#fff' }}>
                {active?.subtitle || 'Transform your space with timeless elegance'}
              </p>
              <div className="mt-8 md:mt-10 flex gap-4">
                <Link href="/shop" className="px-8 py-4 bg-accent text-white rounded-2xl font-semibold hover:bg-accent-hover transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                  Shop Now <ArrowRight size={18} />
                </Link>
                <Link href="/shop?badge=best-seller" className="px-8 py-4 border-2 rounded-2xl font-semibold transition-all duration-300 hover:bg-white/10" style={{ color: active?.textColor || '#fff', borderColor: `${active?.textColor || '#fff'}40` }}>
                  Best Sellers
                </Link>
              </div>
            </div>
          </FadeInLeft>
        </div>
        {banners.length > 1 && (
          <>
            <button onClick={() => setActiveBanner(p => (p - 1 + banners.length) % banners.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300" style={{ color: active?.textColor }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setActiveBanner(p => (p + 1) % banners.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300" style={{ color: active?.textColor }}>
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setActiveBanner(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeBanner ? 'bg-white w-8' : 'bg-white/40 w-3 hover:bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </section>

      <ScrollBanner />

      {/* Categories */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#faf7f4] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-brand">Shop by Category</h2>
              <p className="text-gray-500 mt-3 text-lg">Find the perfect piece for every room</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <ScaleIn key={cat.id} delay={i * 100}>
                <Link href={`/shop?category=${cat.slug}`} className="group glass-card overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={cat.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-bold text-base text-brand group-hover:text-accent transition-colors">{cat.name}</h3>
                    {cat.productCount !== undefined && <p className="text-xs text-accent font-semibold mt-1">{Number(cat.productCount) || 0} products</p>}
                  </div>
                </Link>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16 md:py-24 bg-[#faf7f4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <FadeIn>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">Featured Products</h2>
                  <p className="text-gray-500 mt-2 text-lg">Handpicked for you</p>
                </div>
                <Link href="/shop" className="btn-primary hidden sm:flex items-center gap-2">View All <ArrowRight size={16} /></Link>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p, i) => (
                <ScaleIn key={p.id} delay={i * 100}>
                  <ProductCard product={p} />
                </ScaleIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-16 md:py-24 bg-brand-dark text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <FadeIn>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">Best Sellers</h2>
                  <p className="text-gray-400 mt-2 text-lg">Our most popular items</p>
                </div>
                <Link href="/shop?badge=best-seller" className="text-accent font-medium flex items-center gap-1 hover:underline">View All <ArrowRight size={16} /></Link>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((p, i) => (
                <ScaleIn key={p.id} delay={i * 100}>
                  <ProductCard product={p} dark />
                </ScaleIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="text-center p-6 glass-card hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto text-accent">{f.icon}</div>
                  <h3 className="font-semibold mt-4 text-lg">{f.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-brand-dark to-brand text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-10 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" /><div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" /></div>
        <div className="relative max-w-3xl mx-auto px-4">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-5xl font-bold">Ready to Transform Your Space?</h2>
            <p className="mt-4 text-gray-300 text-lg">Explore our curated collection of premium furniture designed for modern living.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 mt-8 px-10 py-4 bg-accent rounded-2xl font-semibold hover:bg-accent-hover transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              Start Shopping <ArrowRight size={18} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
