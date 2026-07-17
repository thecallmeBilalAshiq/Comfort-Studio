'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Minus, Plus, Star, Truck, Shield, RotateCcw, MessageCircle, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, ReviewStats } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '@/components/ProductCard';

export default function ProductPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewStats>({ reviews: [], count: 0, avgRating: 0 });
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    setLoading(true);
    api.getProduct(params.slug as string).then(data => {
      setProduct(data.product);
      setRelated(data.related || []);
      setReviews({ reviews: data.reviews || [], count: data.reviewCount || 0, avgRating: data.avgRating || 0 });
    }).catch(() => toast.error('Product not found')).finally(() => setLoading(false));
  }, [params.slug]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    for (let i = 0; i < qty; i++) addToCart(product.id);
    toast.success(`Added ${qty} item${qty > 1 ? 's' : ''} to cart!`);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    try {
      const result = await api.submitReview(product.id, rating, comment);
      const newReview = result.reviews?.[0] || { id: Date.now(), rating, comment, userName: 'You', createdAt: new Date().toISOString() };
      setReviews(prev => ({ reviews: [newReview, ...prev.reviews], count: result.count ?? prev.count + 1, avgRating: result.avgRating ?? prev.avgRating }));
      setComment(''); setRating(5);
      toast.success('Review submitted!');
    } catch { toast.error('Failed to submit review'); }
    setSubmittingReview(false);
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading...</div>;
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-accent">Home</Link> / <Link href="/shop" className="hover:text-accent">Shop</Link>
        {product.categorySlug && <> / <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-accent">{product.categoryName}</Link></>}
        {product.subcategorySlug && <> / <Link href={`/shop?category=${product.categorySlug}&subcategory=${product.subcategorySlug}`} className="hover:text-accent">{product.subcategoryName}</Link></>}
        <span className="text-brand"> / {product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
          <img src={product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Details */}
        <div>
          {product.categoryName && <p className="text-accent font-medium text-sm mb-2">{product.categoryName}</p>}
          <h1 className="font-display text-3xl md:text-4xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => <Star key={s} size={16} className={s <= Math.round(reviews.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />)}
            </div>
            <span className="text-sm text-gray-500">{reviews.count} reviews</span>
          </div>

          <div className="flex items-baseline gap-3 mt-6">
            <span className="text-3xl font-bold text-brand">${product.price}</span>
            {product.originalPrice && <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>}
            {product.originalPrice && <span className="text-sm font-medium text-red-500">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

          {/* Stock */}
          <div className="mt-6">
            {product.stock > 0 ? (
              product.stock <= 5 ? (
                <p className="text-orange-600 font-medium">Only {product.stock} left in stock — order soon!</p>
              ) : (
                <p className="text-green-600 font-medium">In Stock ({product.stock} available)</p>
              )
            ) : (
              <p className="text-red-600 font-medium">Out of Stock</p>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {product.stock > 0 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-3 hover:bg-gray-100 transition"><Minus size={16} /></button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="p-3 hover:bg-gray-100 transition"><Plus size={16} /></button>
              </div>
              <button onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-lg font-medium hover:bg-accent transition">
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>
          )}

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div className="p-3 bg-gray-50 rounded-lg"><Truck size={20} className="mx-auto mb-1 text-accent" /><p>Free Shipping</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><Shield size={20} className="mx-auto mb-1 text-accent" /><p>5-Year Warranty</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><RotateCcw size={20} className="mx-auto mb-1 text-accent" /><p>30-Day Returns</p></div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold mb-8">Customer Reviews ({reviews.count})</h2>

        {user ? (
          <form onSubmit={handleReview} className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-medium mb-4">Write a Review</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">Rating:</span>
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star size={20} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
            <button type="submit" disabled={submittingReview || !comment.trim()} className="mt-3 px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition disabled:opacity-50 flex items-center gap-2">
              <Send size={14} /> {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-center">
            <MessageCircle size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Please <Link href="/auth" className="text-accent hover:underline">sign in</Link> to leave a review</p>
          </div>
        )}

        <div className="space-y-6">
          {reviews.reviews.map(r => (
            <div key={r.id} className="border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-medium text-sm">
                  {r.userName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sm">{r.userName || 'Anonymous'}</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />)}
                    <span className="text-xs text-gray-400 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-gray-600 text-sm">{r.comment}</p>
              {r.adminReply && (
                <div className="mt-3 ml-8 p-3 bg-accent/5 rounded-lg border-l-2 border-accent">
                  <p className="text-xs font-medium text-accent mb-1">Comfort Studio Response</p>
                  <p className="text-sm text-gray-600">{r.adminReply}</p>
                </div>
              )}
            </div>
          ))}
          {reviews.reviews.length === 0 && <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
