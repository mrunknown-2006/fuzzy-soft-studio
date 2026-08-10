import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, Calendar, CreditCard, ShoppingBag, Printer, MessageCircle } from 'lucide-react';

export default function OrderConfirmation() {
  const location = useLocation();
  const stateDetails = location.state?.orderDetails;

  // Safe order data resolution with try/catch and localStorage fallback
  const order = useMemo(() => {
    try {
      if (stateDetails) return stateDetails;

      const localData = localStorage.getItem('fuzzy-soft-studio-local-orders');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const latest = parsed[0];
          return {
            orderId: latest.orderId || 'FSS-ORDER',
            items: latest.items || [],
            pricing: latest.pricing || { subtotal: 0, deliveryCharge: 0, total: 0 },
            shippingDetails: latest.shippingDetails || { fullName: 'Valued Customer', address: '', city: 'Lucknow', state: 'UP', pincode: '', phone: '' },
            deliveryEstimation: { range: '3–5 Business Days', isLucknow: true }
          };
        }
      }
    } catch (err) {
      console.warn('OrderConfirmation fallback data error:', err);
    }

    // Default safe preview object
    return {
      orderId: 'FSS-293847',
      items: [
        {
          id: 'p2',
          name: 'Rosy Reverie',
          price: 1899,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=80',
          description: 'Garden roses in deep rose & dusty mauve.'
        }
      ],
      pricing: {
        subtotal: 1899,
        deliveryCharge: 0,
        total: 1899
      },
      shippingDetails: {
        fullName: 'Valued Customer',
        email: 'customer@example.com',
        phone: '9876543210',
        address: 'Main Street',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226001'
      },
      deliveryEstimation: {
        range: '3–5 Business Days',
        isLucknow: true
      }
    };
  }, [stateDetails]);

  const items = order?.items || [];
  const fullName = order?.shippingDetails?.fullName || order?.shippingDetails?.name || 'Valued Customer';
  const address = order?.shippingDetails?.address || '';
  const city = order?.shippingDetails?.city || '';
  const state = order?.shippingDetails?.state || '';
  const pincode = order?.shippingDetails?.pincode || '';
  const phone = order?.shippingDetails?.phone || '';
  const orderId = order?.orderId || 'FSS-ORDER';
  const deliveryRange = order?.deliveryEstimation?.range || '3–5 Business Days';
  const subtotal = order?.pricing?.subtotal || 0;
  const deliveryCharge = order?.pricing?.deliveryCharge || 0;
  const total = order?.pricing?.total || subtotal + deliveryCharge;
  const discountAmount = order?.pricing?.discountAmount || 0;
  const currentStatus = String(order?.status || 'PENDING').toUpperCase();

  const statusInfo = useMemo(() => {
    if (currentStatus === 'VERIFIED' || currentStatus === 'PROCESSING') {
      return {
        title: 'UPI Payment Verified',
        sub: 'Payment verified! Scheduled for hand-crafting & dispatch.',
        badge: 'Payment Verified',
        badgeBg: 'bg-green-50 text-green-700 border-green-200'
      };
    }
    if (currentStatus === 'SHIPPED') {
      return {
        title: 'Order Shipped',
        sub: 'Your arrangement is package-sealed and out for delivery.',
        badge: 'Shipped',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    if (currentStatus === 'DELIVERED') {
      return {
        title: 'Order Delivered',
        sub: 'Delivered with care to recipient address.',
        badge: 'Delivered',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      };
    }
    if (currentStatus === 'CANCELLED') {
      return {
        title: 'Order Cancelled',
        sub: 'This order has been cancelled.',
        badge: 'Cancelled',
        badgeBg: 'bg-red-50 text-red-700 border-red-200'
      };
    }
    // Default PENDING
    return {
      title: 'UPI Payment Submitted',
      sub: 'Order Received. Awaiting Payment Verification.',
      badge: 'Awaiting Verification',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }, [currentStatus]);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center animate-fade-in-up">
      
      {/* Header Success Section */}
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center justify-center bg-[#8FA088]/15 text-[#8FA088] p-5 rounded-full mb-6 shadow-sm select-none bloom">
          <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-3">Order Received</h1>
        <p className="text-sm text-brand-body/75 font-sans leading-relaxed">
          Thank you for choosing Fuzzy Soft Studio, <span className="font-semibold text-brand-heading">{fullName}</span>. {statusInfo.sub}
        </p>
      </div>

      {/* Main Order Details Card */}
      <div className="w-full bg-white/60 border border-brand-border/40 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs space-y-8 print-receipt">
        
        {/* Order Meta row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-brand-border/30">
          <div className="text-center sm:text-left select-none">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-body/50">Order Reference</span>
            <div className="text-xl font-bold text-brand-heading mt-0.5 tracking-wider font-sans">
              {orderId}
            </div>
          </div>
          
          <div className="text-center sm:text-right select-none">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-body/50 font-sans">Estimated Delivery</span>
            <div className="text-sm font-semibold text-brand-heading mt-0.5 flex items-center justify-center sm:justify-end gap-1.5">
              <Calendar size={14} className="text-[#C9A84C]" />
              <span>{deliveryRange}</span>
            </div>
          </div>
        </div>

        {/* Info Grid (Address + Payment Summary) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-brand-border/30">
          
          {/* Shipping Address info */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-brand-body/60 flex items-center gap-1.5 select-none">
              <MapPin size={13} className="text-brand-accent" />
              <span>Shipping Address</span>
            </h3>
            <div className="text-sm font-sans text-brand-body/90 space-y-1">
              <div className="font-semibold text-brand-heading">{fullName}</div>
              {address && <div>{address}</div>}
              <div>{city}{state ? `, ${state}` : ''}{pincode ? ` - ${pincode}` : ''}</div>
              {phone && <div className="text-xs text-brand-body/70 mt-1 select-none">Phone: {phone}</div>}
            </div>
          </div>

          {/* Payment Method & Status info */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-brand-body/60 flex items-center gap-1.5 select-none">
              <CreditCard size={13} className="text-brand-accent" />
              <span>Payment & Order Status</span>
            </h3>
            <div className="text-sm font-sans text-brand-body/90 space-y-1">
              <div className="font-semibold text-brand-heading">{statusInfo.title}</div>
              <div className="text-xs text-brand-body/70 select-none">{statusInfo.sub}</div>
              <div className="pt-2 select-none">
                <span className={`text-[10px] uppercase tracking-wider font-semibold border px-2.5 py-0.5 rounded-full ${statusInfo.badgeBg}`}>
                  {statusInfo.badge}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Item Summaries & Calculation details */}
        <div>
          <h3 className="text-xs uppercase tracking-widest font-semibold text-brand-body/60 flex items-center gap-1.5 mb-4 select-none">
            <Package size={13} className="text-brand-accent" />
            <span>Items Ordered</span>
          </h3>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 border-b border-brand-border/20 pb-5 no-scrollbar">
            {items.map((item: any, idx: number) => (
              <div key={item.id || idx} className="flex gap-4 items-center">
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-brand-cream border border-brand-border/30 shrink-0 select-none">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-serif text-sm font-bold text-brand-heading truncate">
                    {item.name}
                  </h4>
                  <div className="text-xs text-brand-body/65 mt-0.5">
                    Qty: {item.quantity || 1} &times; ₹{(item.price || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="font-sans font-semibold text-sm text-brand-heading shrink-0 text-right">
                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="pt-5 space-y-3 font-sans text-xs text-brand-body/80 max-w-sm ml-auto text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-brand-heading">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges:</span>
              <span className="font-semibold text-brand-heading">
                {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount Applied:</span>
                <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-brand-border/40 pt-3 text-sm text-brand-heading font-bold select-none">
              <span>Total Amount:</span>
              <span className="text-base text-brand-heading">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Navigation buttons */}
      <div className="mt-10 select-none flex flex-col sm:flex-row items-center gap-3 no-print">
        <Link
          to="/shop"
          className="bg-[#DCA29A] hover:bg-[#D4938A] text-white px-7 py-3 rounded-full font-sans font-semibold tracking-widest text-xs uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
        >
          <ShoppingBag size={14} />
          <span>Continue Shopping</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
        >
          <Printer size={13} strokeWidth={1.5} />
          <span>Print Receipt</span>
        </button>

        <a
          href={`https://wa.me/916386422660?text=${encodeURIComponent(`Hi Fuzzy Soft Studio! I have a question regarding my order ${orderId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="no-print flex items-center gap-2 border border-[#8FA088]/40 bg-[#8FA088]/10 hover:bg-[#8FA088]/20 text-[#2C1810] rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
        >
          <MessageCircle size={13} strokeWidth={1.5} className="text-[#8FA088]" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>

    </div>
  );
}
