'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Star, Truck, Shield, RotateCcw, MessageCircle, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, ReviewStats } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '@/components/ProductCard';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
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

  // Configuration States
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<{ name: string; priceModifier: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<{ name: string; priceModifier: number } | null>(null);
  const [selectedMattress, setSelectedMattress] = useState<{ name: string; priceModifier: number } | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 5,
    minutes: 45,
    seconds: 38
  });

  useEffect(() => {
    // Ticking timer: end time is 5 hours, 45 minutes, and 38 seconds from visitor entry
    const targetTime = Date.now() + (5 * 3600 + 45 * 60 + 38) * 1000;
    
    const interval = setInterval(() => {
      const difference = targetTime - Date.now();
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!params.slug) return;
    setLoading(true);
    api.getProduct(params.slug as string).then(data => {
      const prod = data.product;
      setProduct(prod);
      setRelated(data.related || []);
      setReviews({ reviews: data.reviews || [], count: data.reviewCount || 0, avgRating: data.avgRating || 0 });
      
      if (prod) {
        setActiveImage(prod.image || '');
        if (prod.sizes && prod.sizes.length > 0) {
          const defaultSize = prod.sizes.find((s: any) => s.priceModifier === 0) || prod.sizes[0];
          setSelectedSize(defaultSize);
        } else {
          setSelectedSize(null);
        }
        if (prod.colors && prod.colors.length > 0) {
          setSelectedColor(prod.colors[0]);
        } else {
          setSelectedColor(null);
        }
        if (prod.storageOptions && prod.storageOptions.length > 0) {
          setSelectedStorage(prod.storageOptions[0]);
        } else {
          setSelectedStorage(null);
        }
        if (prod.mattressOptions && prod.mattressOptions.length > 0) {
          setSelectedMattress(prod.mattressOptions[0]);
        } else {
          setSelectedMattress(null);
        }
      }
    }).catch(() => toast.error('Product not found')).finally(() => setLoading(false));
  }, [params.slug]);

  const getComputedPrice = () => {
    if (!product) return 0;
    let base = Number(product.price);
    if (selectedSize) base += Number(selectedSize.priceModifier || 0);
    if (selectedStorage) base += Number(selectedStorage.priceModifier || 0);
    if (selectedMattress) base += Number(selectedMattress.priceModifier || 0);
    return Math.max(0, base);
  };

  const getComputedOriginalPrice = () => {
    if (!product || !product.originalPrice) return null;
    let base = Number(product.originalPrice);
    if (selectedSize) base += Number(selectedSize.priceModifier || 0);
    if (selectedStorage) base += Number(selectedStorage.priceModifier || 0);
    if (selectedMattress) base += Number(selectedMattress.priceModifier || 0);
    return Math.max(0, base);
  };

  const finalPrice = getComputedPrice();
  const finalOriginalPrice = getComputedOriginalPrice();

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addToCart(
      product.id,
      qty,
      selectedSize?.name,
      selectedColor?.name,
      selectedStorage?.name,
      selectedMattress?.name,
      finalPrice
    );
    toast.success(`Added ${qty} item${qty > 1 ? 's' : ''} to cart!`);
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    addToCart(
      product.id,
      qty,
      selectedSize?.name,
      selectedColor?.name,
      selectedStorage?.name,
      selectedMattress?.name,
      finalPrice
    );
    router.push('/checkout');
  };

  const handleClear = () => {
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedStorage(null);
    setSelectedMattress(null);
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

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500 font-medium">Loading product...</div>;
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500 font-medium">Product not found</div>;

  const gallery = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image];

  // Helper flags to identify product categories
  const isSofa = product.categorySlug === 'sofas' || 
                 product.categorySlug === 'corner-sofas' || 
                 product.categorySlug === 'recliner-sofas' || 
                 product.categorySlug === 'sofa-bed' ||
                 product.slug.includes('sofa') || 
                 product.slug.includes('loveseat') || 
                 product.slug.includes('sectional');

  const isMattress = product.categorySlug === 'mattresses' || 
                     product.slug.includes('mattress');

  const isBed = product.categorySlug === 'beds' || 
                (product.slug.includes('bed') && !product.slug.includes('sofa-bed'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs md:text-sm text-gray-500 mb-6 flex items-center flex-wrap gap-1 font-medium">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        {product.categorySlug && (
          <>
            <span className="text-gray-300">/</span>
            <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-black transition-colors uppercase">
              {product.categoryName}
            </Link>
          </>
        )}
        {product.subcategorySlug && (
          <>
            <span className="text-gray-300">/</span>
            <Link href={`/shop?category=${product.categorySlug}&subcategory=${product.subcategorySlug}`} className="hover:text-black transition-colors">
              {product.subcategoryName}
            </Link>
          </>
        )}
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-semibold">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN: Gallery layout (Thumbnails side-by-side on top, Large active image below) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Row of 3 Thumbnails at the top */}
          <div className="grid grid-cols-3 gap-3">
            {gallery.slice(0, 3).map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(img)}
                className={`aspect-[4/3] rounded-lg overflow-hidden bg-gray-50 border-2 transition-all ${
                  activeImage === img ? 'border-black ring-2 ring-black/10' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img src={img} alt={`${product.name} gallery ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {/* If there are fewer than 3 images, fill the space with branded placeholders */}
            {gallery.length < 3 && Array.from({ length: 3 - gallery.length }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg bg-gray-50 border border-gray-250 flex items-center justify-center text-gray-400 text-xs font-semibold select-none">
                Comfort Studio
              </div>
            ))}
          </div>

          {/* Large active main image at the bottom */}
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm">
            <img src={activeImage || product.image} alt={product.name} className="w-full h-full object-cover transition-all duration-300" />
          </div>

          {/* If there are more than 3 gallery images, show them in a second row of thumbnails */}
          {gallery.length > 3 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(3).map((img, index) => (
                <button
                  key={index + 3}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden bg-gray-50 border-2 transition-all ${
                    activeImage === img ? 'border-black ring-2 ring-black/10' : 'border-gray-250 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt={`${product.name} gallery ${index + 4}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Product Details & Configurator */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold uppercase tracking-wider text-xs bg-red-50 px-2.5 py-1 rounded-full border border-red-100">Sale!</span>
            </div>
            
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-gray-900 mt-3 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} size={15} className={s <= Math.round(reviews.avgRating) ? 'fill-yellow-450 text-yellow-450' : 'text-gray-300'} />)}
              </div>
              <span className="text-xs text-gray-500 font-medium">({reviews.count} Customer Reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-3xl font-black text-gray-950">£{finalPrice.toFixed(2)}</span>
              {finalOriginalPrice && <span className="text-lg text-gray-400 line-through font-medium">£{finalOriginalPrice.toFixed(2)}</span>}
            </div>

            {/* Countdown timer */}
            <div className="my-5 bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md shadow-sm">
              <p className="text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">Last Chance to Save Your Money:</p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-gray-950 bg-white border border-gray-300 rounded-lg px-3 py-1 min-w-[52px] text-center shadow-xs">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">Days</span>
                </div>
                <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-gray-950 bg-white border border-gray-300 rounded-lg px-3 py-1 min-w-[52px] text-center shadow-xs">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">Hours</span>
                </div>
                <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-gray-950 bg-white border border-gray-300 rounded-lg px-3 py-1 min-w-[52px] text-center shadow-xs">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">Mins</span>
                </div>
                <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-gray-950 bg-white border border-gray-300 rounded-lg px-3 py-1 min-w-[52px] text-center shadow-xs">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">Secs</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-650 leading-relaxed font-light">{product.description}</p>

            {/* CONFIGURATOR SYSTEM (Conditional Rendering based on Category) */}
            <div className="space-y-6 mt-6 border-t pt-6">
              
              {/* 1. Size Options */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                    Select a Size: <span className="text-gray-500 font-normal lowercase pl-1">({selectedSize ? selectedSize.name : 'No selection'})</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => {
                      const isSelected = selectedSize?.name === size.name;
                      const diff = size.priceModifier;
                      const diffText = diff > 0 ? ` (+£${diff})` : diff < 0 ? ` (-£${Math.abs(diff)})` : '';
                      return (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2.5 text-xs font-semibold border rounded transition-all ${
                            isSelected
                              ? 'border-black bg-black text-white shadow-sm'
                              : 'border-gray-250 text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white'
                          }`}
                        >
                          {size.name}{diffText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Storage Options */}
              {product.storageOptions && product.storageOptions.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                    Select a Storage: <span className="text-gray-500 font-normal lowercase pl-1">({selectedStorage && selectedStorage.name !== 'No Storage' && selectedStorage.name !== 'No' ? 'Yes' : 'No'})</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const hasStorage = product.storageOptions?.find(opt => opt.name !== 'No Storage' && opt.name !== 'No');
                        setSelectedStorage(hasStorage || product.storageOptions?.[1] || product.storageOptions?.[0] || null);
                      }}
                      className={`px-6 py-2.5 text-xs font-semibold uppercase border rounded transition-all ${
                        selectedStorage && selectedStorage.name !== 'No Storage' && selectedStorage.name !== 'No'
                          ? 'border-black bg-black text-white shadow-sm'
                          : 'border-gray-250 text-gray-700 hover:border-gray-450 bg-white'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => {
                        const noStorage = product.storageOptions?.find(opt => opt.name === 'No Storage' || opt.name === 'No') || { name: 'No Storage', priceModifier: 0 };
                        setSelectedStorage(noStorage);
                      }}
                      className={`px-6 py-2.5 text-xs font-semibold uppercase border rounded transition-all ${
                        (!selectedStorage || selectedStorage.name === 'No Storage' || selectedStorage.name === 'No')
                          ? 'border-black bg-black text-white shadow-sm'
                          : 'border-gray-250 text-gray-700 hover:border-gray-455 bg-white'
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {/* Detailed Storage selection dropdown if Yes is toggled */}
                  {selectedStorage && selectedStorage.name !== 'No Storage' && selectedStorage.name !== 'No' && product.storageOptions.filter(o => o.name !== 'No Storage' && o.name !== 'No').length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      {product.storageOptions.filter(o => o.name !== 'No Storage' && o.name !== 'No').map(opt => {
                        const isSelected = selectedStorage.name === opt.name;
                        return (
                          <button
                            key={opt.name}
                            onClick={() => setSelectedStorage(opt)}
                            className={`px-3 py-1.5 text-xs font-semibold border rounded transition-all ${
                              isSelected
                                ? 'border-gray-900 bg-gray-950 text-white font-semibold'
                                : 'border-gray-250 text-gray-650 hover:border-gray-400 bg-white'
                            }`}
                          >
                            {opt.name} (+£{opt.priceModifier})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Color swatches */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                    Plush Colours: <span className="text-gray-500 font-normal pl-1">({selectedColor ? selectedColor.name : 'No selection'})</span>
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map(color => {
                      const isSelected = selectedColor?.name === color.name;
                      return (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color)}
                          title={color.name}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center shadow-xs ${
                            isSelected
                              ? 'border-black ring-2 ring-black/20 scale-110'
                              : 'border-gray-200 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 bg-white rounded-full mix-blend-difference" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Mattress Options */}
              {product.mattressOptions && product.mattressOptions.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                    Select a Mattress: <span className="text-gray-500 font-normal pl-1">({selectedMattress ? selectedMattress.name : 'None'})</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.mattressOptions.map(opt => {
                      const isSelected = selectedMattress?.name === opt.name || (opt.name === 'None' && !selectedMattress);
                      const isNone = opt.name === 'None' || opt.name === 'No Mattress';
                      return (
                        <button
                          key={opt.name}
                          onClick={() => setSelectedMattress(isNone ? null : opt)}
                          className={`px-4 py-2.5 text-xs font-semibold uppercase border rounded transition-all ${
                            (isSelected || (isNone && !selectedMattress))
                              ? 'border-black bg-black text-white shadow-sm'
                              : 'border-gray-250 text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white'
                          }`}
                        >
                          {opt.name} {opt.priceModifier > 0 ? `(+£${opt.priceModifier})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clear button */}
              <div className="pt-2">
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-500 underline font-semibold hover:text-black transition-colors"
                >
                  Clear Selection
                </button>
              </div>

            </div>
          </div>

          <div>
            {/* Stock status info */}
            <div className="mt-5 border-t border-gray-200 pt-4">
              {product.stock > 0 ? (
                product.stock <= 5 ? (
                  <p className="text-orange-600 font-semibold text-xs">Only {product.stock} left in stock — order soon!</p>
                ) : (
                  <p className="text-green-600 font-semibold text-xs">In Stock ({product.stock} available)</p>
                )
              ) : (
                <p className="text-red-600 font-semibold text-xs">Out of Stock</p>
              )}
            </div>

            {/* Quantity + Add to Basket Button */}
            {product.stock > 0 && (
              <div className="mt-5 flex items-center gap-3">
                {/* Custom Quantity box with Up/Down buttons */}
                <div className="flex items-center border border-gray-300 rounded bg-white h-12 overflow-hidden shadow-xs shrink-0 select-none">
                  <input
                    type="text"
                    readOnly
                    value={qty}
                    className="w-11 text-center font-bold text-gray-900 focus:outline-none h-full text-sm"
                  />
                  <div className="flex flex-col border-l border-gray-300 h-full w-8">
                    <button
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      className="flex-1 flex items-center justify-center hover:bg-gray-50 border-b border-gray-300 transition text-gray-800"
                    >
                      <span className="text-[8px]">▲</span>
                    </button>
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="flex-1 flex items-center justify-center hover:bg-gray-50 transition text-gray-800"
                    >
                      <span className="text-[8px]">▼</span>
                    </button>
                  </div>
                </div>

                {/* Add to Basket beige colored button matching image1 */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center py-3 bg-[#F5E6D3] text-[#8B5A2B] font-bold rounded border border-[#D2B48C] hover:bg-[#EEDC82]/10 hover:border-[#8B5A2B] transition h-12 text-xs uppercase tracking-wider shadow-xs"
                >
                  Add to basket
                </button>

                {/* Buy Now button */}
                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center py-3 bg-black text-white font-bold rounded hover:bg-gray-950 transition h-12 text-xs uppercase tracking-wider shadow-xs"
                >
                  Buy Now
                </button>
              </div>
            )}

            {/* Quality badges */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-600 border-t border-gray-200 pt-6">
              <div className="p-3 bg-gray-50 rounded-lg"><Truck size={18} className="mx-auto mb-1.5 text-gray-700" /><p className="font-semibold">Free Shipping</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><Shield size={18} className="mx-auto mb-1.5 text-gray-700" /><p className="font-semibold">5-Year Warranty</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><RotateCcw size={18} className="mx-auto mb-1.5 text-gray-700" /><p className="font-semibold">30-Day Returns</p></div>
            </div>

          </div>
        </div>

      </div>

      {/* Reviews section */}
      <section className="mt-16 border-t border-gray-200 pt-12">
        <h2 className="font-display text-xl md:text-2xl font-bold text-gray-900 mb-8">Customer Reviews ({reviews.count})</h2>

        {user ? (
          <form onSubmit={handleReview} className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 max-w-xl">
            <h3 className="font-semibold text-sm text-gray-800 mb-4">Write a Review</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-700">Rating:</span>
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star size={18} className={s <= rating ? 'fill-yellow-450 text-yellow-450' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none" />
            <button type="submit" disabled={submittingReview || !comment.trim()} className="mt-3 px-6 py-2.5 bg-black text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 shadow-xs">
              <Send size={12} /> {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-center max-w-xl">
            <MessageCircle size={22} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs text-gray-600">Please <Link href="/auth" className="text-black font-semibold underline">sign in</Link> to leave a review</p>
          </div>
        )}

        <div className="space-y-6 max-w-3xl">
          {reviews.reviews.map(r => (
            <div key={r.id} className="border-b border-gray-250 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold text-xs">
                  {r.userName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{r.userName || 'Anonymous'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.rating ? 'fill-yellow-450 text-yellow-450' : 'text-gray-300'} />)}
                    <span className="text-[10px] text-gray-450 ml-2 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-650 leading-relaxed font-light">{r.comment}</p>
              {r.adminReply && (
                <div className="mt-3 ml-8 p-3.5 bg-gray-50 rounded-lg border-l-2 border-black">
                  <p className="text-[10px] font-bold text-gray-900 mb-1 uppercase tracking-wider">Comfort Studio Response</p>
                  <p className="text-xs text-gray-650 leading-relaxed font-light">{r.adminReply}</p>
                </div>
              )}
            </div>
          ))}
          {reviews.reviews.length === 0 && <p className="text-gray-550 text-xs py-8">No reviews yet. Be the first to review!</p>}
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="font-display text-xl md:text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
