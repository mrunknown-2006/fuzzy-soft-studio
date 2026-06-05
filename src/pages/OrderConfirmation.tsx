import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, Calendar, CreditCard, ShoppingBag, Printer } from 'lucide-react';

export default function OrderConfirmation() {
  const location = useLocation();
  const stateDetails = location.state?.orderDetails;

  // Use state details if present, otherwise load mock data for testing/fallback
  const order = useMemo(() => {
    if (stateDetails) return stateDetails;

    // Fallback mock data for developer preview or direct url visits
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
        },
        {
          id: 'p7',
          name: 'Tulip Letter',
          price: 999,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&q=80',
          description: 'Pastel tulips wrapped in kraft & ribbon.'
        }
      ],
      pricing: {
        subtotal: 3897,
        deliveryCharge: 0,
        total: 3897
      },
      shippingDetails: {
        fullName: 'Ananya Roy',
        email: 'ananya@example.com',
        phone: '9876543210',
        address: 'Apartment 5B, Willow Heights, Gomti Nagar',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226010'
      },
      deliveryEstimation: {
        range: '31 May – 5 Jun, 2026',
        isLucknow: true
      }
    };
  }, [stateDetails]);

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center animate-fade-in-up">
      
      {/* Header Success Section */}
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center justify-center bg-[#8FA088]/15 text-[#8FA088] p-5 rounded-full mb-6 shadow-sm select-none bloom">
          <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-3">Order Confirmed</h1>
        <p className="text-sm text-brand-body/75 font-sans leading-relaxed">
          Thank you for choosing Fuzzy Soft Studio, <span className="font-semibold text-brand-heading">{order.shippingDetails.fullName}</span>. Your custom arrangement is now scheduled for hand-crafting.
        </p>
      </div>

      {/* Main Order Details Card */}
      <div className="w-full bg-white/60 border border-brand-border/40 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs space-y-8 print-receipt">
        
        {/* Order Meta row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-brand-border/30">
          <div className="text-center sm:text-left select-none">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-body/50">Order Reference</span>
            <div className="text-xl font-bold text-brand-heading mt-0.5 tracking-wider font-sans">
              {order.orderId}
            </div>
          </div>
          
          <div className="text-center sm:text-right select-none">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-body/50 font-sans">Estimated Delivery</span>
            <div className="text-sm font-semibold text-brand-heading mt-0.5 flex items-center justify-center sm:justify-end gap-1.5">
              <Calendar size={14} className="text-[#C9A84C]" />
              <span>{order.deliveryEstimation.range}</span>
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
              <div className="font-semibold text-brand-heading">{order.shippingDetails.fullName}</div>
              <div>{order.shippingDetails.address}</div>
              <div>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</div>
              <div className="text-xs text-brand-body/70 mt-1 select-none">Phone: {order.shippingDetails.phone}</div>
            </div>
          </div>

          {/* Payment Method info */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-brand-body/60 flex items-center gap-1.5 select-none">
              <CreditCard size={13} className="text-brand-accent" />
              <span>Payment Details</span>
            </h3>
            <div className="text-sm font-sans text-brand-body/90 space-y-1">
              <div className="font-semibold text-brand-heading">Cash on Delivery (COD)</div>
              <div className="text-xs text-brand-body/70 select-none">Please prepare exact cash for receipt verification.</div>
              <div className="pt-2 select-none">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8FA088] border border-[#8FA088]/30 bg-[#8FA088]/5 px-2 py-0.5 rounded-md">
                  Pending Delivery Payment
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
            {order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 items-center">
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
                    Qty: {item.quantity} &times; ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="font-sans font-semibold text-sm text-brand-heading shrink-0 text-right">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="pt-5 space-y-3 font-sans text-xs text-brand-body/80 max-w-sm ml-auto text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-brand-heading">₹{order.pricing.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges:</span>
              <span className="font-semibold text-brand-heading">
                {order.pricing.deliveryCharge === 0 ? 'Free' : `₹${order.pricing.deliveryCharge}`}
              </span>
            </div>
            {order.pricing.discountAmount && (
              <div className="flex justify-between text-green-700">
                <span>Discount Applied:</span>
                <span className="font-semibold">-₹{order.pricing.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-brand-border/40 pt-3 text-sm text-brand-heading font-bold select-none">
              <span>Amount Paid (COD):</span>
              <span className="text-base text-brand-heading">₹{order.pricing.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Navigation buttons */}
      <div className="mt-10 select-none flex flex-col items-center gap-4 no-print">
        <Link
          to="/shop"
          className="bg-[#DCA29A] hover:bg-[#D4938A] text-white px-8 py-3.5 rounded-full font-sans font-semibold tracking-widest text-xs uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
        >
          <ShoppingBag size={14} />
          <span>Continue Shopping</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
        >
          <Printer size={13} strokeWidth={1.5} />
          <span>Download / Print Receipt</span>
        </button>
      </div>

    </div>
  );
}
