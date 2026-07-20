'use client';
import Link from 'next/link';
import { ShoppingBag, Star } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product, dark }: { product: Product; dark?: boolean }) {
  const { addToCart } = useCart();

  const price = Number(product.price) || 0;
  const origPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const stock = Number(product.stock) || 0;
  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.reviewCount) || 0;
  const name = String(product.name || 'Product');
  const badge = String(product.badge || '');

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stock <= 0) { toast.error('Out of stock'); return; }
    addToCart(product.id);
    toast.success('Added to cart!');
  };

  return (
    <Link href={`/product/${product.slug}`} className={`group overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 ${dark ? 'bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15' : 'glass-card hover:shadow-2xl'}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img src={String(product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500')} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        {badge && (
          <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-lg ${
            badge === 'new' ? 'bg-green-500 text-white' :
            badge === 'sale' ? 'bg-red-500 text-white' :
            badge === 'best-seller' ? 'bg-accent text-white' :
            badge === 'top rated' ? 'bg-purple-500 text-white' :
            'bg-brand text-white'
          }`}>
            {badge === 'best-seller' ? 'Best Seller' : badge.charAt(0).toUpperCase() + badge.slice(1)}
          </span>
        )}
        {stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-brand px-4 py-2 rounded-xl text-sm font-semibold">Out of Stock</span>
          </div>
        )}
        {stock > 0 && stock <= 5 && (
          <span className="absolute top-3 right-3 bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-lg font-medium">Only {stock} left</span>
        )}
        {stock > 0 && (
          <button onClick={handleAdd} className={`absolute bottom-3 right-3 p-3 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg ${dark ? 'bg-white text-brand hover:bg-accent hover:text-white' : 'bg-white/90 backdrop-blur-sm text-brand hover:bg-accent hover:text-white'}`}>
            <ShoppingBag size={18} />
          </button>
        )}
      </div>
      <div className="p-4">
        {product.categoryName && <p className={`text-xs font-medium mb-1 ${dark ? 'text-accent' : 'text-accent'}`}>{String(product.categoryName)}</p>}
        <h3 className={`font-bold line-clamp-1 group-hover:text-accent transition-colors ${dark ? 'text-white' : 'text-brand'}`}>{name}</h3>
        <p className={`text-sm line-clamp-2 mt-1 ${dark ? 'text-gray-300' : 'text-gray-500'}`}>{String(product.description || '')}</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center">
            {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : dark ? 'text-gray-600' : 'text-gray-300'} />)}
          </div>
          <span className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-400'}`}>({reviewCount})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${dark ? 'text-white' : 'text-brand'}`}>£{price}</span>
            {origPrice && <span className={`text-sm line-through ${dark ? 'text-gray-500' : 'text-gray-400'}`}>£{origPrice}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
