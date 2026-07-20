import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import toast from 'react-hot-toast';
import { Upload, ShoppingBag, Star, ImageIcon, Percent } from 'lucide-react';
import Link from 'next/link';

interface ProductUploadProps {
  productId?: number; // Optional: If updating an existing product
  onUploadSuccess: (url: string) => void;
}

/**
 * ADMIN COMPONENT: Product Image Upload Component
 * Uploads an image to Cloudinary using 'comfort_products' and saves/updates in Supabase.
 */
export function AdminProductImageUpload({ productId, onUploadSuccess }: ProductUploadProps) {
  const { upload, loading: uploading } = useCloudinaryUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Mutation to update an existing product with the new image URL
  const updateProductImageMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!productId) return url;
      const { data, error } = await supabase
        .from('products')
        .update({ image: url }) // Updates the 'image' column in Supabase
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Product image updated successfully in Supabase!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      toast.error(`Database update failed: ${err.message}`);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // 1. Upload to Cloudinary using comfort_products preset
      const secureUrl = await upload(file, 'comfort_products');
      
      // 2. Callback to parent form
      onUploadSuccess(secureUrl);

      // 3. If editing an existing product, persist directly in Supabase
      if (productId) {
        await updateProductImageMutation.mutateAsync(secureUrl);
      }
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed.');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
        Product Image
      </label>
      
      <div className="flex items-center gap-4">
        {/* Image Preview Box */}
        <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
          {previewUrl || updateProductImageMutation.data ? (
            <img
              src={previewUrl || (updateProductImageMutation.data as any)?.image}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>

        {/* Upload Control */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || updateProductImageMutation.isPending}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            id="product-image-file-input"
          />
          <button
            type="button"
            className="flex items-center gap-2 py-2 px-4 border border-gray-300 hover:border-comfort-primary rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition duration-300 shadow-sm"
          >
            <Upload size={14} className="text-gray-400" />
            <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload Product Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    price: number;
    originalPrice?: number | null;
    image: string; // The Cloudinary URL retrieved from Supabase
    badge?: string;
    stock: number;
    rating?: number;
    reviewCount?: number;
    categoryName?: string;
  };
  dark?: boolean;
}

/**
 * PUBLIC COMPONENT: renders a product card featuring the Cloudinary image URL.
 */
export function CloudinaryProductCard({ product, dark }: ProductCardProps) {
  const price = Number(product.price) || 0;
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const rating = Number(product.rating || 0);

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group flex flex-col justify-between overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1 ${
        dark
          ? 'bg-comfort-secondary/40 backdrop-blur-sm border border-white/5 hover:bg-comfort-secondary/50'
          : 'bg-white shadow-md hover:shadow-2xl border border-gray-100'
      }`}
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />

        {/* Sale / Promo Badging */}
        {product.badge && (
          <span className="absolute top-4 left-4 bg-comfort-accent text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md">
            {product.badge}
          </span>
        )}

        {/* Stock Status Indicator */}
        {product.stock <= 0 ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
            <span className="bg-white/95 text-red-600 px-4 py-2 rounded-xl text-xs font-bold shadow-md">
              Sold Out
            </span>
          </div>
        ) : product.stock <= 3 ? (
          <span className="absolute bottom-4 right-4 bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg shadow">
            Only {product.stock} Left
          </span>
        ) : null}
      </div>

      {/* Product Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {product.categoryName && (
            <span className="text-[10px] font-bold text-comfort-accent uppercase tracking-wider block mb-1">
              {product.categoryName}
            </span>
          )}
          <h3 className={`font-bold text-base line-clamp-1 transition-colors ${
            dark ? 'text-white group-hover:text-comfort-accent' : 'text-comfort-secondary group-hover:text-comfort-primary'
          }`}>
            {product.name}
          </h3>
          {product.description && (
            <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
              dark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {product.description}
            </p>
          )}
        </div>

        {/* Pricing & Ratings Row */}
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            {originalPrice && (
              <span className="text-[10px] text-red-500 line-through font-semibold mb-0.5">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(originalPrice)}
              </span>
            )}
            <span className={`text-lg font-extrabold ${dark ? 'text-white' : 'text-comfort-primary'}`}>
              {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price)}
            </span>
          </div>

          {/* Quick Add CTA */}
          {product.stock > 0 && (
            <button
              type="button"
              className="p-2.5 bg-comfort-secondary hover:bg-comfort-accent text-white rounded-xl shadow-md transition-all duration-300 transform group-hover:scale-105"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
