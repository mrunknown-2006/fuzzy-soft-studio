import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft, ShieldCheck, Tag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useStore((state) => state.cart);
  const clearCart = useStore((state) => state.clearCart);

  // Retrieve discount applied in Cart page
  const appliedDiscount = location.state?.appliedDiscount || null;

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Settings states loaded from database
  const [whatsappNumber, setWhatsappNumber] = useState('916386422660');
  const [orderIdPrefix, setOrderIdPrefix] = useState('FSS-');
  const [shippingFee, setShippingFee] = useState(99);
  const [freeThreshold, setFreeThreshold] = useState(999);

  // Load store settings
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const { data } = await supabase.from('store_settings').select('*');
        if (data) {
          const generalSetting = data.find(s => s.key === 'general');
          if (generalSetting && generalSetting.value) {
            const val = generalSetting.value;
            if (val.whatsapp_number) setWhatsappNumber(String(val.whatsapp_number));
            if (val.order_id_prefix) setOrderIdPrefix(String(val.order_id_prefix));
            if (val.shipping_charges !== undefined) setShippingFee(Number(val.shipping_charges));
            if (val.free_delivery_threshold !== undefined) setFreeThreshold(Number(val.free_delivery_threshold));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch checkout settings:', err);
      }
    };
    loadStoreConfig();
  }, []);

  // Compute subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // Compute shipping delivery fee
  const finalShipping = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= freeThreshold ? 0 : shippingFee;
  }, [subtotal, freeThreshold, shippingFee]);

  // Compute discount amount
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.min_order_value && subtotal < appliedDiscount.min_order_value) {
      return 0;
    }
    if (appliedDiscount.discount_type === 'fixed') {
      return Math.min(subtotal, appliedDiscount.value);
    }
    return Math.round(subtotal * appliedDiscount.value / 100);
  }, [subtotal, appliedDiscount]);

  // Gifting Add-On States
  const [giftWrapped, setGiftWrapped] = useState(false);
  const [ribbonColor, setRibbonColor] = useState('Classic Gold');
  const [giftMessage, setGiftMessage] = useState('');

  // Compute total including gift wrapping if enabled
  const total = subtotal + finalShipping - discountAmount + (giftWrapped ? 49 : 0);

  // Form validator
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,12}$/.test(phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Enter a valid 10-12 digit phone number';
    }
    if (!address.trim()) newErrors.address = 'Delivery address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }
    
    setErrors(newErrors);
    return newErrors;
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const firstKey = Object.keys(validationErrors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (cart.length === 0) return;

    setLoading(true);

    const orderNumber = `${orderIdPrefix}${Date.now().toString().slice(-6)}`;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'guest';

      // 1. Insert order to database with robust schema column fallback retry
      const orderPayload: any = {
        order_id: orderNumber,
        user_id: userId,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || null,
        shipping_address: `${address.trim()}, ${city.trim()} - ${pincode.trim()}`,
        items: cart, // JSONB array of items
        total_amount: total,
        payment_method: 'whatsapp',
        status: 'Pending',
        created_at: new Date().toISOString(),
        gifting_info: giftWrapped ? {
          gift_wrapped: true,
          ribbon_color: ribbonColor,
          gift_message: giftMessage.trim()
        } : null
      };

      let { error: insertError } = await supabase
        .from('orders')
        .insert(orderPayload);

      if (insertError && insertError.message.includes('gifting_info')) {
        // Fallback retry: serialize gifting details into internal_notes or items payload
        const { gifting_info, ...retryPayload } = orderPayload;
        retryPayload.internal_notes = giftWrapped 
          ? `[Gift Wrapped] Ribbon: ${ribbonColor}. Message: ${giftMessage.trim()}`
          : '';
        const retryRes = await supabase.from('orders').insert(retryPayload);
        insertError = retryRes.error;
      }

      if (insertError) throw insertError;

      // 2. Increment discount coupon count if applied
      if (appliedDiscount && appliedDiscount.code) {
        try {
          const { data: couponData } = await supabase
            .from('discounts')
            .select('used_count')
            .eq('code', appliedDiscount.code)
            .single();
          const currentCount = couponData?.used_count || 0;
          await supabase
            .from('discounts')
            .update({ used_count: currentCount + 1 })
            .eq('code', appliedDiscount.code);
        } catch (couponErr) {
          console.warn('Coupon usage count increment failed:', couponErr);
        }
      }

      // 3. Format WhatsApp message
      const itemsList = cart.map(item => `- ${item.name} (x${item.quantity}) — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n');
      const message = `*New Order — Fuzzy Soft Studio*\n\n` +
        `*Order ID:* ${orderNumber}\n` +
        `*Name:* ${name.trim()}\n` +
        `*Phone:* ${phone.trim()}\n` +
        `*Address:* ${address.trim()}, ${city.trim()} - ${pincode.trim()}\n` +
        `*Email:* ${email.trim() || 'N/A'}\n\n` +
        `*Items Ordered:*\n${itemsList}\n\n` +
        (giftWrapped ? `*Gifting Add-On (₹49):* YES\n*Ribbon Color:* ${ribbonColor}\n*Gift Message:* ${giftMessage.trim() || 'None'}\n\n` : '') +
        `*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n` +
        `*Shipping:* ${finalShipping === 0 ? 'FREE' : '₹' + finalShipping}\n` +
        (giftWrapped ? `*Gift Wrapping:* ₹49\n` : '') +
        (discountAmount > 0 ? `*Discount Applied:* -₹${discountAmount.toLocaleString('en-IN')} (${appliedDiscount?.code})\n` : '') +
        `*Total Amount (COD):* ₹${total.toLocaleString('en-IN')}*`;

      const cleanPhone = (num: string) => {
        const digits = num.replace(/[^0-9]/g, '');
        return digits.length === 10 ? '91' + digits : digits || '916386422660';
      };
      const cleanedHelpline = cleanPhone(whatsappNumber);

      // 4. Clear local cart
      clearCart();

      // 5. Open WhatsApp
      window.open(`https://wa.me/${cleanedHelpline}?text=${encodeURIComponent(message)}`, '_blank');

      // 6. Navigate to receipt confirmation
      navigate('/order-confirmation', {
        state: {
          orderDetails: {
            orderId: orderNumber,
            items: cart,
            pricing: {
              subtotal: subtotal,
              deliveryCharge: finalShipping,
              discountAmount: discountAmount,
              giftWrappingCharge: giftWrapped ? 49 : 0,
              total: total
            },
            shippingDetails: {
              fullName: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              address: address.trim(),
              city: city.trim(),
              state: 'Uttar Pradesh',
              pincode: pincode.trim()
            },
            deliveryEstimation: {
              range: city.trim().toLowerCase() === 'lucknow' ? '3–5 Business Days' : '5–10 Business Days',
              isLucknow: city.trim().toLowerCase() === 'lucknow'
            }
          }
        }
      });
      
    } catch (err: any) {
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="font-serif text-2xl text-brand-heading mb-4">Your Cart is Empty</h2>
        <Link to="/shop" className="text-brand-accent hover:underline text-sm font-semibold uppercase tracking-wider">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col animate-fade-in-up">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-2">Checkout</h1>
          <div className="h-0.5 w-16 bg-[#C9A84C] mt-2"></div>
        </div>
        <Link to="/cart" className="flex items-center gap-1.5 text-xs text-brand-body/60 hover:text-brand-heading font-semibold uppercase tracking-wider">
          <ArrowLeft size={13} />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left column: Delivery Form (7 cols) */}
        <form onSubmit={handleWhatsAppCheckout} className="lg:col-span-7 space-y-6">
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-5">
            <h2 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/20 pb-2 flex items-center gap-2">
              <span>Delivery Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5" id="name">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({...errors, name: ''}); }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full h-11 px-4 bg-white rounded-xl border ${errors.name ? 'border-red-400' : 'border-brand-border/70'} text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs`}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
              </div>

              <div className="space-y-1.5" id="phone">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({...errors, phone: ''}); }}
                  placeholder="e.g. 9876543210"
                  className={`w-full h-11 px-4 bg-white rounded-xl border ${errors.phone ? 'border-red-400' : 'border-brand-border/70'} text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs`}
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-1.5" id="address">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Street Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (errors.address) setErrors({...errors, address: ''}); }}
                placeholder="House No, Building, Street Name, Area"
                className={`w-full h-11 px-4 bg-white rounded-xl border ${errors.address ? 'border-red-400' : 'border-brand-border/70'} text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs`}
              />
              {errors.address && <p className="text-[10px] text-red-500 font-semibold">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5" id="city">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors({...errors, city: ''}); }}
                  placeholder="e.g. Lucknow"
                  className={`w-full h-11 px-4 bg-white rounded-xl border ${errors.city ? 'border-red-400' : 'border-brand-border/70'} text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs`}
                />
                {errors.city && <p className="text-[10px] text-red-500 font-semibold">{errors.city}</p>}
              </div>

              <div className="space-y-1.5" id="pincode">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Pincode *</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value); if (errors.pincode) setErrors({...errors, pincode: ''}); }}
                  placeholder="e.g. 226010"
                  className={`w-full h-11 px-4 bg-white rounded-xl border ${errors.pincode ? 'border-red-400' : 'border-brand-border/70'} text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs`}
                />
                {errors.pincode && <p className="text-[10px] text-red-500 font-semibold">{errors.pincode}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Rahul@example.com"
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs"
              />
            </div>
          </div>

          {/* Secure details reminder */}
          <div className="bg-[#8FA088]/10 border border-[#8FA088]/30 rounded-2xl p-4 flex gap-3 items-center">
            <ShieldCheck className="text-[#8FA088] shrink-0" size={20} />
            <p className="text-[11px] font-sans text-[#2C1810]/80">
              Orders are paid via <strong>Cash on Delivery (COD)</strong>. Once you submit details, a confirmation draft will be generated for direct dispatch via WhatsApp helpline.
            </p>
          </div>
        </form>

        {/* Right column: Order Summary (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="bg-white/65 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
            <h2 className="font-serif text-xl font-bold text-brand-heading">Order Summary</h2>

            {/* Items display list */}
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1 divide-y divide-brand-border/10">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-center pt-3 first:pt-0">
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-brand-cream border border-brand-border/20 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-serif text-xs font-bold text-brand-heading truncate">{item.name}</h4>
                    <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">
                      Qty: {item.quantity} &times; ₹{item.price}
                    </span>
                  </div>
                  <span className="text-xs font-semibold font-sans text-brand-heading shrink-0 text-right">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Global Gift Add-on Card */}
            <div className="bg-[#FCFAF8] border border-brand-border/40 rounded-xl p-4 space-y-3 select-none shadow-3xs transition duration-200 hover:border-brand-accent/25">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={giftWrapped}
                  onChange={(e) => setGiftWrapped(e.target.checked)}
                  className="w-4 h-4 accent-brand-accent cursor-pointer rounded border-brand-border/50"
                />
                <div>
                  <span className="block text-xs font-bold text-brand-heading">🎁 Add Luxury Gift Wrapping (+₹49)</span>
                  <span className="block text-[9px] text-brand-body/50 mt-0.5">Satin ribbon tie, designer wrapping, and a handwritten card.</span>
                </div>
              </label>

              {giftWrapped && (
                <div className="space-y-3 pt-3 border-t border-brand-border/25 animate-fade-in">
                  {/* Ribbon Color Select */}
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-brand-heading">Ribbon Color Choice</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Satin Red', 'Blush Pink', 'Classic Gold', 'Cream White', 'Surprise Me'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRibbonColor(color)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition cursor-pointer select-none ${
                            ribbonColor === color 
                              ? 'bg-brand-heading text-white border-brand-heading'
                              : 'bg-white text-brand-body/75 border-brand-border/60 hover:bg-brand-cream/35'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gift Message Textarea */}
                  <div className="space-y-1">
                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-brand-heading">Custom Gift Message</span>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write a heartfelt message for the recipient..."
                      rows={3}
                      maxLength={200}
                      className="w-full p-2.5 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Details */}
            <div className="space-y-3 pt-4 border-t border-brand-border/20 text-xs font-sans text-brand-body/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-heading">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-brand-heading">
                  {finalShipping === 0 ? <span className="text-green-700 font-bold uppercase text-[10px]">Free</span> : `₹${finalShipping}`}
                </span>
              </div>
              {giftWrapped && (
                <div className="flex justify-between">
                  <span>Gift Wrapping</span>
                  <span className="font-semibold text-brand-heading">₹49</span>
                </div>
              )}
              {appliedDiscount && (
                <div className="flex justify-between text-green-700">
                  <span className="flex items-center gap-1">
                    <Tag size={11} />
                    <span>Coupon ({appliedDiscount.code})</span>
                  </span>
                  <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-brand-border/30 pt-3 text-sm text-brand-heading font-bold">
                <span>Amount Payable (COD)</span>
                <span className="text-base text-brand-heading">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleWhatsAppCheckout}
              disabled={loading}
              className="w-full h-12 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 select-none min-h-[44px]"
            >
              <MessageCircle size={15} />
              <span>{loading ? 'Processing...' : 'Order via WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
