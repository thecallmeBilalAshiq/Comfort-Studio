'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ChevronRight, Layers, SlidersHorizontal, Package, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { FadeIn, ScaleIn } from '@/components/ScrollAnimations';

// Curated high-res fallback cover images for subcategories
const SUBCATEGORY_IMAGES: Record<string, string> = {
  // Beds
  'diwan': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&auto=format&fit=crop&q=80',
  'kamal': 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=700&auto=format&fit=crop&q=80',
  'super': 'https://images.unsplash.com/photo-1540518614846-7ede433c51f3?w=700&auto=format&fit=crop&q=80',
  'nice': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700&auto=format&fit=crop&q=80',
  // Sofas
  'corner-sofas': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&auto=format&fit=crop&q=80',
  '3-seater-sofas': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
  'recliner-sofas': 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=700&auto=format&fit=crop&q=80',
  'sofa-bed': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=700&auto=format&fit=crop&q=80',
  // Mattresses
  'pocket-sprung': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=700&auto=format&fit=crop&q=80',
  'orthopaedic': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&auto=format&fit=crop&q=80',
  'hybrid-gel': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&auto=format&fit=crop&q=80',
  // Chairs
  'accent-chairs': 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=700&auto=format&fit=crop&q=80',
  'wingback-chairs': 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=700&auto=format&fit=crop&q=80',
  // Dining
  'oak-dining': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=700&auto=format&fit=crop&q=80',
  'marble-dining': 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=700&auto=format&fit=crop&q=80',
};

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const unwrappedParams = use(params);
  const categorySlug = unwrappedParams.categorySlug;
  const searchParams = useSearchParams();
  const activeSubSlug = searchParams.get('sub') || '';

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(activeSubSlug);

  useEffect(() => {
    setSelectedSubcategory(activeSubSlug);
  }, [activeSubSlug]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCategories(),
      api.getProducts({ category: categorySlug })
    ]).then(([cats, prods]) => {
      setAllCategories(cats);
      const found = cats.find(c => c.slug === categorySlug || c.slug.toLowerCase() === categorySlug.toLowerCase());
      if (found) {
        setCategory(found);
      } else {
        // Fallback title capitalization
        setCategory({
          id: 0,
          name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: categorySlug,
          image: SUBCATEGORY_IMAGES[categorySlug] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
          subcategories: []
        });
      }
      setProducts(prods || []);
    }).catch(err => {
      console.error('Failed to load category data:', err);
    }).finally(() => setLoading(false));
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const categoryName = category?.name || categorySlug.replace(/-/g, ' ');
  const subcategoriesList = category?.subcategories || [];

  // Filter products by selected subcategory if active
  const filteredProducts = selectedSubcategory
    ? products.filter(p => p.subcategorySlug === selectedSubcategory || (p as any).subcategories?.slug === selectedSubcategory)
    : products;

  return (
    <div className="min-h-screen bg-[#faf7f4] pb-20">
      {/* Category Hero Cover Section */}
      <section className="relative bg-brand-dark text-white overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={category?.image || 'https://images.unsplash.com/photo-1540518614846-7ede433c51f3?w=1200&auto=format&fit=crop&q=80'}
            alt={categoryName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-300 mb-6 font-medium">
            <Link href="/" className="hover:text-accent transition">Home</Link>
            <ChevronRight size={14} className="text-gray-400" />
            <Link href="/shop" className="hover:text-accent transition">Categories</Link>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-accent font-bold capitalize">{categoryName}</span>
            {selectedSubcategory && (
              <>
                <ChevronRight size={14} className="text-gray-400" />
                <span className="text-white font-bold capitalize">
                  {subcategoriesList.find(s => s.slug === selectedSubcategory)?.name || selectedSubcategory.replace(/-/g, ' ')}
                </span>
              </>
            )}
          </nav>

          <div className="max-w-2xl">
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight capitalize mb-4">
              {categoryName}
            </h1>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light mb-6">
              Explore our handcrafted {categoryName.toLowerCase()} collection. Designed for ultimate comfort, durability, and contemporary elegance.
            </p>

            <div className="flex items-center gap-3 text-xs md:text-sm font-semibold">
              <span className="bg-accent/20 border border-accent/40 text-accent px-3 py-1.5 rounded-full">
                {products.length} Designs Available
              </span>
              {subcategoriesList.length > 0 && (
                <span className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/90">
                  {subcategoriesList.length} Collections
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        {/* SCENARIO 1: NO SUBCATEGORY SELECTED -> DISPLAY SUBCATEGORY PICTURE CARDS SHOWCASE */}
        {!selectedSubcategory ? (
          <div className="space-y-12">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">
                  Browse {categoryName} Collections
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-brand">
                  Select a Subcategory
                </h2>
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                  Choose a collection below to view products tailored to your preferences.
                </p>
              </div>
            </FadeIn>

            {/* Subcategory Grid with Representative Pictures */}
            {subcategoriesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {subcategoriesList.map((sub: any, idx: number) => {
                  const subImage = sub.image || SUBCATEGORY_IMAGES[sub.slug] || category?.image || 'https://images.unsplash.com/photo-1540518614846-7ede433c51f3?w=600&auto=format&fit=crop&q=80';
                  const subProductCount = products.filter(p => p.subcategorySlug === sub.slug || (p as any).subcategories?.slug === sub.slug).length;

                  return (
                    <ScaleIn key={sub.id || sub.slug} delay={idx * 100}>
                      <button
                        onClick={() => setSelectedSubcategory(sub.slug)}
                        className="group w-full text-left glass-card overflow-hidden hover:shadow-2xl transition-all duration-500 rounded-3xl border border-gray-100 flex flex-col h-full"
                      >
                        {/* Subcategory Picture */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                          <img
                            src={subImage}
                            alt={sub.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                          
                          <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-brand text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                            {subProductCount > 0 ? `${subProductCount} Items` : 'Explore'}
                          </span>
                        </div>

                        {/* Subcategory Info */}
                        <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                          <div>
                            <h3 className="font-bold text-xl text-brand group-hover:text-accent transition-colors flex items-center justify-between">
                              <span>{sub.name}</span>
                              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform text-accent" />
                            </h3>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                              View our full range of handcrafted {sub.name.toLowerCase()} for luxury comfort.
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-accent">
                            <span>Browse {sub.name}</span>
                            <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                              &rarr;
                            </span>
                          </div>
                        </div>
                      </button>
                    </ScaleIn>
                  );
                })}
              </div>
            ) : (
              /* Fallback if no subcategories exist in DB yet */
              <div className="text-center py-12 glass-card rounded-3xl">
                <p className="text-gray-500">No subcategories defined for {categoryName} yet.</p>
                <button
                  onClick={() => setSelectedSubcategory('all')}
                  className="mt-4 btn-primary py-2.5 px-6"
                >
                  View All {categoryName} Products
                </button>
              </div>
            )}

            {/* Direct Link to View All Products */}
            <div className="text-center pt-8 border-t border-gray-200">
              <button
                onClick={() => setSelectedSubcategory('all')}
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-accent transition"
              >
                Or view all {products.length} {categoryName.toLowerCase()} products together &rarr;
              </button>
            </div>
          </div>
        ) : (
          /* SCENARIO 2: SUBCATEGORY IS SELECTED -> DISPLAY PRODUCTS GRID FOR THIS SUBCATEGORY */
          <div className="space-y-8">
            {/* Subcategory Navigation Header / Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedSubcategory('')}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 hover:border-black bg-white text-gray-700 transition"
                >
                  &larr; All Subcategories
                </button>

                {subcategoriesList.map(sub => {
                  const isActive = selectedSubcategory === sub.slug;
                  return (
                    <button
                      key={sub.id || sub.slug}
                      onClick={() => setSelectedSubcategory(sub.slug)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        isActive
                          ? 'border-accent bg-accent text-white shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-gray-500 font-semibold self-end sm:self-center">
                Showing {filteredProducts.length} products
              </span>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((p, i) => (
                  <ScaleIn key={p.id} delay={i * 50}>
                    <ProductCard product={p} />
                  </ScaleIn>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 glass-card rounded-3xl">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="font-bold text-lg text-brand">No Products Found</h3>
                <p className="text-gray-500 text-sm mt-1">There are no products in this subcategory yet.</p>
                <button
                  onClick={() => setSelectedSubcategory('')}
                  className="mt-4 btn-primary py-2.5 px-6"
                >
                  Back to Subcategories
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
