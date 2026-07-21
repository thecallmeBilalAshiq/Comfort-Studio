import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, Image as ImageIcon, Eye, ExternalLink } from 'lucide-react';

interface PaymentUploadProps {
  orderId: number;
  orderNumber: string;
  total: number;
  onSuccess?: (url: string) => void;
}

/**
 * CUSTOMER COMPONENT: Allows customers to upload a payment screenshot
 * during checkout, which uploads to Cloudinary and saves to Supabase.
 */
export function PaymentScreenshotUpload({ orderId, orderNumber, total, onSuccess }: PaymentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an image file first.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadPaymentScreenshot(orderId, file);
      toast.success('Payment screenshot verified and saved!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      
      const screenshotUrl = res.paymentScreenshot || res.screenshotUrl;
      if (onSuccess && screenshotUrl) {
        onSuccess(screenshotUrl);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-comfort-secondary/10 p-6 rounded-2xl shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-bold text-comfort-secondary uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-comfort-accent" />
          <span>Upload Payment Proof</span>
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Upload a clear screenshot of your bank transfer/receipt of {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(total)} for order {orderNumber}.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-comfort-accent/10 file:text-comfort-accent hover:file:bg-comfort-accent/20 text-xs text-gray-500 cursor-pointer w-full border border-dashed border-gray-200 p-2 rounded-xl"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className="bg-comfort-primary text-white hover:bg-comfort-accent font-bold py-2.5 px-6 rounded-xl text-xs whitespace-nowrap transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Submit Receipt'}
        </button>
      </div>
    </div>
  );
}

/**
 * ADMIN COMPONENT: Displays the order payment screenshot for verification.
 */
export function AdminPaymentProofViewer({ orderId }: { orderId: number }) {
  const queryClient = useQueryClient();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch the specific order details using TanStack Query
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Mutation to update order status (Approve/Reject)
  const statusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Order status updated to: ${data.status.replace('_', ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (err: any) => {
      toast.error(`Failed to update status: ${err.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-50 border border-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-comfort-accent border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-gray-400 mt-2 font-medium">Loading receipt details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
        Failed to load payment proof: {error?.message || 'Order not found'}
      </div>
    );
  }

  const hasProof = !!order.payment_screenshot;

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-base font-bold text-comfort-secondary">Payment Verification</h4>
          <p className="text-xs text-gray-500 mt-0.5">Order Number: {order.order_number || `#${order.id}`}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
          order.status === 'processing' || order.status === 'completed' || order.status === 'paid' ? 'bg-green-100 text-green-700' :
          order.status === 'pending_proof' ? 'bg-orange-100 text-orange-700' :
          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      {!hasProof ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl flex items-center gap-2">
          <span className="font-semibold">No Payment Screenshot Uploaded Yet.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Screenshot Preview */}
          <div className="relative group aspect-video max-w-sm rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
            <img
              src={order.payment_screenshot}
              alt="Payment Screenshot"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="p-2 bg-white rounded-lg text-comfort-secondary hover:text-comfort-accent shadow transition-all transform scale-90 group-hover:scale-100"
              >
                <Eye size={16} />
              </button>
              <a
                href={order.payment_screenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-lg text-comfort-secondary hover:text-comfort-accent shadow transition-all transform scale-90 group-hover:scale-100"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Action buttons for admin */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => statusMutation.mutate({ status: 'processing' })}
              disabled={statusMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition duration-300 disabled:opacity-50"
            >
              <Check size={14} />
              <span>Approve Payment</span>
            </button>
            <button
              onClick={() => statusMutation.mutate({ status: 'cancelled' })}
              disabled={statusMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs transition duration-300 disabled:opacity-50"
            >
              <X size={14} />
              <span>Decline Payment</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Modal Modal Preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
            >
              <X size={18} />
            </button>
            <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-gray-50 rounded-xl p-2">
              <img
                src={order.payment_screenshot}
                alt="Payment Proof Full View"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 flex justify-between items-center text-xs text-gray-500 px-1">
              <span>Payment Receipt Screenshot</span>
              <a
                href={order.payment_screenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-comfort-accent hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open original image</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
