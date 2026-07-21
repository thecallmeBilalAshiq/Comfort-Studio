'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Copy, CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentScreenshotUpload } from '@/components/PaymentScreenshotFlow';

function PaymentUploadContent() {
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get('orderId') || '0');
  const orderNumber = searchParams.get('orderNumber') || '';
  const total = Number(searchParams.get('total') || '0');

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleSuccess = (url: string) => {
    setUploadedUrl(url);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Comfort Studio, I just placed order *${orderNumber || `#${orderId}`}* totaling *£${total.toFixed(2)}*. Here is my payment receipt.`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="glass-card p-8 text-center space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-brand">Order Initiated</h1>
          <p className="text-gray-500 text-sm">Please submit your payment receipt to complete and confirm your order.</p>
        </div>

        <div className="bg-[#faf7f4] rounded-2xl p-5 border border-accent/10 space-y-2 max-w-md mx-auto">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Order Number</p>
          <p className="text-2xl font-bold font-mono text-accent">{orderNumber}</p>
          <p className="text-sm font-semibold text-gray-700">Total Amount: £{total.toFixed(2)}</p>
        </div>

        {/* Bank Transfer Instructions */}
        <div className="glass-card bg-[#faf7f4] border border-accent/10 p-6 text-left space-y-4 shadow-sm">
          <h3 className="font-bold text-[#5d4037] text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Bank Transfer Instructions
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Transfer <strong>£{total.toFixed(2)}</strong> to the following bank account, then upload a screenshot of your transfer proof below:
          </p>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Bank Name:</span>
              <span className="font-bold text-brand flex items-center gap-1.5">
                TVP Platforms Ltd
                <button type="button" onClick={() => { navigator.clipboard.writeText('TVP Platforms Ltd'); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={12} /></button>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Account Number:</span>
              <span className="font-bold text-brand font-mono flex items-center gap-1.5">
                77526174 
                <button type="button" onClick={() => { navigator.clipboard.writeText('77526174'); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={12} /></button>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Account Holder:</span>
              <span className="font-bold text-brand flex items-center gap-1.5">
                Comfort Studio
                <button type="button" onClick={() => { navigator.clipboard.writeText('Comfort Studio'); toast.success('Copied!'); }} className="text-gray-400 hover:text-accent transition"><Copy size={12} /></button>
              </span>
            </div>
          </div>
        </div>

        {/* Proof Options */}
        <div className="space-y-4 text-left">
          <h4 className="font-bold text-[#5d4037] text-sm">Send Payment Proof:</h4>
          
          {uploadedUrl ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl flex items-center gap-2.5 font-medium shadow-sm">
              <CheckCircle size={18} />
              <span>Payment proof uploaded successfully! We have sent a confirmation email.</span>
            </div>
          ) : (
            <PaymentScreenshotUpload 
              orderId={orderId} 
              orderNumber={orderNumber} 
              total={total} 
              onSuccess={handleSuccess} 
            />
          )}

          <div className="text-center py-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">— OR —</span>
          </div>

          <a 
            href={`https://wa.me/447983630088?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008 0c3.202.001 6.212 1.244 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 12.003-2.002-.001-3.973-.5-5.739-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436-.005 9.858-4.427 9.862-9.864.002-2.63-1.023-5.102-2.89-6.972C16.578 1.899 14.108.879 11.998.88c-5.44.005-9.862 4.427-9.866 9.869-.001 1.636.452 3.23 1.312 4.636l-.993 3.627 3.72-.975zm11.167-7.9c-.29-.145-1.716-.848-1.978-.942-.262-.096-.453-.145-.644.145-.19.29-.738.942-.905 1.135-.167.19-.333.212-.623.067-.29-.145-1.22-.448-2.324-1.432-.86-.767-1.44-1.716-1.607-2.007-.167-.29-.018-.447.128-.591.13-.13.29-.338.436-.508.145-.17.19-.29.29-.483.096-.19.048-.363-.024-.508-.073-.145-.644-1.55-.882-2.124-.23-.556-.464-.48-.644-.49-.167-.008-.358-.01-.55-.01-.19 0-.5.07-.762.363-.263.29-1.003.98-1.003 2.392 0 1.41 1.026 2.775 1.17 2.968.143.193 2.017 3.08 4.887 4.316.682.294 1.216.47 1.63.602.687.218 1.312.187 1.808.113.553-.082 1.716-.701 1.958-1.378.243-.677.243-1.256.17-1.378-.072-.122-.263-.195-.554-.34z"/>
            </svg>
            Send Proof via WhatsApp
          </a>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/orders" className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2.5 px-6">
            Track Order <ArrowRight size={14} />
          </Link>
          <Link href="/shop" className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2.5 px-6">
            <ShoppingBag size={14} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <PaymentUploadContent />
    </Suspense>
  );
}
