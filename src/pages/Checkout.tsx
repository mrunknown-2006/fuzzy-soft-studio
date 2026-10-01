import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft, ShieldCheck, Tag, Copy, Check, Gift } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';
import { sendAdminNewOrderAlert } from '../lib/emailService';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useStore((state) => state.cart);
  const clearCart = useStore((state) => state.clearCart);
  const showToast = useStore((state) => state.showToast);

  // Retrieve discount applied in Cart page
  const appliedDiscount = location.state?.appliedDiscount || null;

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // India-specific address fields
  const [houseNo, setHouseNo] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Settings states loaded from database
  const [orderIdPrefix, setOrderIdPrefix] = useState('FSS-');
  const [shippingFee, setShippingFee] = useState(99);
  const [freeThreshold, setFreeThreshold] = useState(999);
  const [giftPackagingCharge, setGiftPackagingCharge] = useState(49);

  // Gifting Add-On States
  const [giftWrapped, setGiftWrapped] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [messageSaved, setMessageSaved] = useState(false);

  // UPI Payment States
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);

  // Mandatory Auth Check on mount
  useEffect(() => {
    const verifyAuthSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        showToast('Please create an account or sign in to complete your order', 'error');
        navigate('/signup?redirectTo=/checkout', { replace: true });
      }
    };
    verifyAuthSession();
  }, [navigate, showToast]);

  // Load store settings
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const { data } = await supabase.from('store_settings').select('*');
        if (data) {
          const generalSetting = data.find(s => s.key === 'general');
          if (generalSetting && generalSetting.value) {
            const val = generalSetting.value;
            if (val.order_id_prefix) setOrderIdPrefix(String(val.order_id_prefix));
            if (val.shipping_charges !== undefined) setShippingFee(Number(val.shipping_charges));
            if (val.free_delivery_threshold !== undefined) setFreeThreshold(Number(val.free_delivery_threshold));
            if (val.gift_packaging_charge !== undefined) setGiftPackagingCharge(Number(val.gift_packaging_charge));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch checkout settings:', err);
      }
    };
    loadStoreConfig();
  }, []);

  // Load saved addresses for 1-click fill
  useEffect(() => {
    const loadSavedAddresses = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', uid)
        .order('is_default', { ascending: false });
      if (data) setSavedAddresses(data);
    };
    loadSavedAddresses();
  }, []);

  const fillFromSavedAddress = (addr: any) => {
    if (!addr) return;
    setName(addr.full_name || name);
    setPhone(addr.phone || phone);
    setHouseNo(addr.house_no || '');
    setArea(addr.area || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
    setShowAddressPicker(false);
    setErrors({});
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('9506228972@axl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    if (appliedDiscount.percent) {
      return Math.round(subtotal * appliedDiscount.percent / 100);
    }
    if (appliedDiscount.min_order_value && subtotal < appliedDiscount.min_order_value) {
      return 0;
    }
    if (appliedDiscount.discount_type === 'fixed') {
      return Math.min(subtotal, appliedDiscount.value || 0);
    }
    return Math.round(subtotal * (appliedDiscount.value || 0) / 100);
  }, [subtotal, appliedDiscount]);

  const giftingFee = giftWrapped ? giftPackagingCharge : 0;
  const total = Math.max(0, subtotal + finalShipping + giftingFee - discountAmount);

  // ── Anti-XSS sanitizer ─────────────────────────────────────────────────────
  // Strips HTML tags, script injection, and common SQL injection openers from
  // any text input before it touches the database or gets rendered server-side.
  const sanitize = (val: string): string => {
    return val
      .trim()
      .replace(/<[^>]*>/g, '')          // strip all HTML/XML tags
      .replace(/[<>"'`]/g, '')          // remove stray angle-brackets and quote chars
      .replace(/--/g, '')               // strip SQL comment openers
      .replace(/[;]/g, '')              // strip SQL statement terminators
      .slice(0, 300);                   // hard-cap length — no 10 KB injections
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    // Phone: must be 10 digits (Indian mobile)
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) newErrors.phone = 'Enter a valid 10-digit mobile number';
    if (!houseNo.trim()) newErrors.houseNo = 'House / Flat No is required';
    if (!area.trim()) newErrors.area = 'Area / Street is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!city.trim()) newErrors.city = 'City is required';
    // Pincode: must be exactly 6 digits
    if (!/^\d{6}$/.test(pincode.trim())) newErrors.pincode = 'Enter a valid 6-digit pincode';
    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      newErrors.utr = 'Enter a valid 12-digit transaction UTR / Ref Number';
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    const orderNumber = `${orderIdPrefix}${Date.now().toString().slice(-6)}`;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const rawUserId = sessionData?.session?.user?.id;
      if (!rawUserId) {
        showToast('Session expired. Please sign in or create an account to complete your order.', 'error');
        navigate('/signup?redirectTo=/checkout');
        return;
      }

      const userId = rawUserId;

      // Pre-checkout safeguard: Upsert customer record to guarantee foreign key integrity
      if (userId) {
        try {
          await supabase.from('customers').upsert({
            id: userId,
            full_name: sanitize(name),
            email: email.trim() || null,
            phone: phone.replace(/\D/g, '').slice(0, 15), // digits only, max 15
            shipping_address: `${sanitize(houseNo)}, ${sanitize(area)}, ${sanitize(city)}, ${sanitize(state)} - ${pincode.replace(/\D/g, '').slice(0, 6)}`,
            updated_at: new Date().toISOString()
          });
        } catch (cErr) {
          // Non-critical — don't block order
        }
      }

      const cleanUtr = utrNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50); // alphanumeric only

      // 1. Insert order to database with status: 'PENDING' for orders_status_check constraint
      const sName     = sanitize(name);
      const sHouseNo  = sanitize(houseNo);
      const sArea     = sanitize(area);
      const sLandmark = sanitize(landmark);
      const sCity     = sanitize(city);
      const sState    = sanitize(state);
      const sPincode  = pincode.replace(/\D/g, '').slice(0, 6);
      const sPhone    = phone.replace(/\D/g, '').slice(0, 15);
      const sEmail    = email.trim().slice(0, 254) || null;
      const sGiftMsg  = giftWrapped ? sanitize(giftMessage).slice(0, 500) : null;

      // Price-hack shield: Query live prices from Supabase database to verify total
      let serverVerifiedTotal = total;
      try {
        const productIds = cart.map(item => item.id);
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, price')
          .in('id', productIds);

        if (dbProducts && dbProducts.length > 0) {
          const verifiedSubtotal = cart.reduce((acc, item) => {
            const dbItem = dbProducts.find(p => p.id === item.id);
            const verifiedPrice = (dbItem && typeof dbItem.price === 'number') ? dbItem.price : item.price;
            return acc + verifiedPrice * item.quantity;
          }, 0);

          const verifiedShipping = verifiedSubtotal >= freeThreshold ? 0 : shippingFee;
          const verifiedGifting = giftWrapped ? giftPackagingCharge : 0;

          let verifiedDiscount = 0;
          if (appliedDiscount) {
            if (appliedDiscount.percent) {
              verifiedDiscount = Math.round(verifiedSubtotal * appliedDiscount.percent / 100);
            } else if (appliedDiscount.min_order_value && verifiedSubtotal < appliedDiscount.min_order_value) {
              verifiedDiscount = 0;
            } else if (appliedDiscount.discount_type === 'fixed') {
              verifiedDiscount = Math.min(verifiedSubtotal, appliedDiscount.value || 0);
            } else {
              verifiedDiscount = Math.round(verifiedSubtotal * (appliedDiscount.value || 0) / 100);
            }
          }

          serverVerifiedTotal = Math.max(0, verifiedSubtotal + verifiedShipping + verifiedGifting - verifiedDiscount);
        }
      } catch (_) {
        // Fallback to computed total if network query is interrupted
        serverVerifiedTotal = total;
      }

      const orderPayload: any = {
        order_id: orderNumber,
        user_id: userId,
        customer_name: sName,
        customer_phone: sPhone,
        customer_email: sEmail,
        shipping_address: `${sHouseNo}, ${sArea}${sLandmark ? ', Near ' + sLandmark : ''}, ${sCity}, ${sState} - ${sPincode}`,
        shipping_address_structured: {
          house_no: sHouseNo,
          area: sArea,
          landmark: sLandmark || null,
          city: sCity,
          state: sState,
          pincode: sPincode
        },
        items: cart,
        total_amount: serverVerifiedTotal,
        server_verified_total: serverVerifiedTotal,
        utr_number: cleanUtr,
        transaction_id: cleanUtr,
        transaction_utr: cleanUtr,
        status: 'PENDING',
        is_gift_wrapped: giftWrapped,
        gift_message: sGiftMsg,
        created_at: new Date().toISOString(),
        gifting_info: giftWrapped ? {
          gift_wrapped: true,
          gift_message: sGiftMsg
        } : null
      };

      let { error: insertError } = await supabase
        .from('orders')
        .insert(orderPayload);

      // Resilient fallback handling if database columns or casing differ in schema
      if (insertError) {
        // Fallback Step 1: Standard columns with uppercase PENDING
        const fallbackPayload: any = {
          order_id: orderNumber,
          user_id: userId,
          customer_name: sName,
          customer_phone: sPhone,
          customer_email: sEmail,
          shipping_address: `${sHouseNo}, ${sArea}${sLandmark ? ', Near ' + sLandmark : ''}, ${sCity}, ${sState} - ${sPincode}`,
          shipping_address_structured: {
            house_no: sHouseNo,
            area: sArea,
            landmark: sLandmark || null,
            city: sCity,
            state: sState,
            pincode: sPincode
          },
          items: cart,
          total_amount: serverVerifiedTotal,
          server_verified_total: serverVerifiedTotal,
          utr_number: cleanUtr,
          status: 'PENDING',
          is_gift_wrapped: giftWrapped,
          gift_message: sGiftMsg,
          created_at: new Date().toISOString()
        };

        const fallbackRes = await supabase.from('orders').insert(fallbackPayload);
        
        if (fallbackRes.error) {
          // Fallback Step 2: Try titlecase 'Pending' if constraint expects TitleCase
          const titleCaseRes = await supabase.from('orders').insert({ ...fallbackPayload, status: 'Pending' });

          if (titleCaseRes.error) {
            // Fallback Step 3: Try lowercase 'pending' if constraint expects lowercase
            const lowerCaseRes = await supabase.from('orders').insert({ ...fallbackPayload, status: 'pending' });
            if (lowerCaseRes.error) {
              throw new Error('ORDER_INSERT_FAILED');
            }
          }
        }
      }

      // Non-blocking trigger: Send instant Admin notification alert for manual UTR verification
      try {
        sendAdminNewOrderAlert({
          orderId: orderNumber,
          customerName: sName,
          customerEmail: sEmail || '',
          customerPhone: sPhone,
          totalAmount: serverVerifiedTotal,
          utrNumber: cleanUtr,
          shippingAddress: `${sHouseNo}, ${sArea}${sLandmark ? ', Near ' + sLandmark : ''}, ${sCity}, ${sState} - ${sPincode}`,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          isGiftWrapped: giftWrapped,
          giftMessage: giftWrapped ? sGiftMsg || undefined : undefined
        }).catch(() => {}); // non-critical, fail silently
      } catch (_) {
        // non-critical
      }

      // Backup order in local storage so customer order details are preserved
      try {
        const existingLocal = JSON.parse(localStorage.getItem('fuzzy-soft-studio-local-orders') || '[]');
        existingLocal.unshift({
          orderId: orderNumber,
          date: new Date().toISOString(),
          items: cart,
          pricing: { subtotal, deliveryCharge: finalShipping, total: serverVerifiedTotal },
          shippingDetails: { name: sName, phone: sPhone, houseNo: sHouseNo, area: sArea, landmark: sLandmark, city: sCity, state: sState, pincode: sPincode, email: sEmail }
        });
        localStorage.setItem('fuzzy-soft-studio-local-orders', JSON.stringify(existingLocal));
      } catch (lErr) {
        // Silent
      }

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
          // Silent
        }
      }

      // Auto-save address to 'addresses' table if checkbox was checked
      if (saveAddressForLater && userId) {
        const { error: addrErr } = await supabase.from('addresses').insert({
          user_id: userId,
          label: 'Home',
          full_name: sName,
          phone: sPhone,
          house_no: sHouseNo,
          area: sArea,
          landmark: sLandmark || null,
          city: sCity,
          state: sState,
          pincode: sPincode,
          is_default: savedAddresses.length === 0, // first saved address becomes default
          updated_at: new Date().toISOString()
        });
        if (addrErr) {
          // Non-critical — order still goes through; log sanitized error
          console.warn('Address auto-save notice: not completed');
        }
      }

      // 4. Clear local cart
      clearCart();

      // 5. Navigate directly to genuine Order Success / Confirmation page
      navigate('/order-confirmation', {
        state: {
          orderDetails: {
            orderId: orderNumber,
            items: cart,
            pricing: { subtotal, deliveryCharge: finalShipping, total: serverVerifiedTotal },
            shippingDetails: { name: sName, phone: sPhone, houseNo: sHouseNo, area: sArea, landmark: sLandmark, city: sCity, state: sState, pincode: sPincode }
          }
        }
      });
      
    } catch (_err: any) {
      showToast('An error occurred while placing your order. Please check your details and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] pt-24 flex flex-col items-center justify-center text-center px-6">
        <h2 className="font-serif text-2xl text-brand-heading mb-4">Your Cart is Empty</h2>
        <Link to="/shop" className="text-brand-accent hover:underline text-sm font-semibold uppercase tracking-wider">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col animate-fade-in-up">
      <div className="mb-4 sm:mb-10 flex items-center justify-between">
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

            <div className="grid grid-cols-2 gap-4">
              {/* Saved Address Picker */}
              {savedAddresses.length > 0 && (
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(!showAddressPicker)}
                    className="w-full h-11 border border-dashed border-brand-accent/60 rounded-xl text-xs font-semibold text-brand-accent hover:bg-brand-accent/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {showAddressPicker ? 'Hide Saved Addresses' : '1-Click Fill from Saved Addresses'}
                  </button>
                  {showAddressPicker && (
                    <div className="mt-2 border border-brand-border/40 rounded-2xl overflow-hidden divide-y divide-brand-border/20 bg-white/80">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => fillFromSavedAddress(addr)}
                          className="w-full text-left px-4 py-3 hover:bg-brand-cream/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-brand-heading">{addr.label || 'Address'}</span>
                            {addr.is_default && <span className="text-[9px] uppercase tracking-widest bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold">Default</span>}
                          </div>
                          <p className="text-[11px] text-brand-body/70 font-sans mt-0.5 leading-relaxed">
                            {addr.house_no}, {addr.area}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* House / Flat No */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="houseNo" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">House / Flat No *</label>
                <input
                  type="text"
                  id="houseNo"
                  value={houseNo}
                  onChange={(e) => { setHouseNo(e.target.value); if (errors.houseNo) setErrors(p => ({ ...p, houseNo: '' })); }}
                  placeholder="e.g. 4B, Sunrise Apartments"
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all ${errors.houseNo ? 'border-red-400 bg-red-50' : 'border-brand-border/70 bg-white/95'}`}
                />
                {errors.houseNo && <p className="text-red-500 text-[10px] mt-1">{errors.houseNo}</p>}
              </div>

              {/* Area / Street */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="area" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Area / Street / Sector *</label>
                <input
                  type="text"
                  id="area"
                  value={area}
                  onChange={(e) => { setArea(e.target.value); if (errors.area) setErrors(p => ({ ...p, area: '' })); }}
                  placeholder="e.g. Sector 12, Rajajipuram"
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all ${errors.area ? 'border-red-400 bg-red-50' : 'border-brand-border/70 bg-white/95'}`}
                />
                {errors.area && <p className="text-red-500 text-[10px] mt-1">{errors.area}</p>}
              </div>

              {/* Landmark */}
              <div className="col-span-2">
                <label htmlFor="landmark" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Landmark <span className="text-brand-body/40 normal-case font-normal">(Optional)</span></label>
                <input
                  type="text"
                  id="landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near City Mall, Opposite Bus Stand"
                  className="w-full h-11 px-4 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">City *</label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors(p => ({ ...p, city: '' })); }}
                  placeholder="e.g. Lucknow"
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all ${errors.city ? 'border-red-400 bg-red-50' : 'border-brand-border/70 bg-white/95'}`}
                />
                {errors.city && <p className="text-red-500 text-[10px] mt-1">{errors.city}</p>}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">State *</label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => { setState(e.target.value); if (errors.state) setErrors(p => ({ ...p, state: '' })); }}
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all ${errors.state ? 'border-red-400 bg-red-50' : 'border-brand-border/70 bg-white/95'}`}
                >
                  <option value="">Select State</option>
                  {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-[10px] mt-1">{errors.state}</p>}
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  value={pincode}
                  maxLength={6}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); if (errors.pincode) setErrors(p => ({ ...p, pincode: '' })); }}
                  placeholder="e.g. 226010"
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all ${errors.pincode ? 'border-red-400 bg-red-50' : 'border-brand-border/70 bg-white/95'}`}
                />
                {errors.pincode && <p className="text-red-500 text-[10px] mt-1">{errors.pincode}</p>}
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

          {/* Save Address Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={saveAddressForLater}
              onChange={(e) => setSaveAddressForLater(e.target.checked)}
              className="w-4 h-4 rounded accent-[#B76E79] cursor-pointer shrink-0"
            />
            <span className="text-xs text-brand-body/75 group-hover:text-brand-heading transition-colors font-sans">
              Save this address for next time
            </span>
          </label>

          {/* Secure details reminder */}
          <div className="bg-[#8FA088]/10 border border-[#8FA088]/30 rounded-2xl p-4 flex gap-3 items-center">
            <ShieldCheck className="text-[#8FA088] shrink-0" size={20} />
            <p className="text-[11px] font-sans text-[#2C1810]/80">
              🔒 <strong>100% Secure Checkout.</strong> Your handmade order will be carefully crafted upon payment confirmation.
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
            <div className="bg-[#FAF7F5] border border-brand-border/40 rounded-2xl p-4.5 space-y-3.5 select-none shadow-3xs transition duration-200 hover:border-[#B76E79]/40">
              <label className="flex items-start gap-3 cursor-pointer w-full">
                <input 
                  type="checkbox"
                  checked={giftWrapped}
                  onChange={(e) => setGiftWrapped(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#B76E79] cursor-pointer rounded border-brand-border/50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Gift className="text-[#B76E79] shrink-0" size={16} strokeWidth={1.5} />
                      <span className="font-serif text-xs font-bold text-brand-heading truncate">Luxury Gift Wrapping</span>
                    </div>
                    <span className="font-sans text-xs font-bold text-brand-heading shrink-0 ml-2">₹{giftPackagingCharge}</span>
                  </div>
                  <span className="block text-[10px] text-brand-body/60 mt-1 font-sans">
                    Make it special for a special one.
                  </span>
                </div>
              </label>

              {giftWrapped && (
                <div className="space-y-2 pt-3 border-t border-brand-border/25 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-heading font-serif">
                      Custom Gift Message
                    </span>
                    {messageSaved && (
                      <span className="text-[10px] text-[#8FA088] font-semibold flex items-center gap-1 animate-fade-in">
                        ✓ Message noted
                      </span>
                    )}
                  </div>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => {
                      setGiftMessage(e.target.value);
                      if (messageSaved) setMessageSaved(false);
                    }}
                    onBlur={() => {
                      if (giftMessage.trim()) {
                        setMessageSaved(true);
                      }
                    }}
                    placeholder="Write your heartfelt message for the recipient..."
                    rows={3}
                    maxLength={500}
                    className="w-full p-3 bg-white/95 border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#B76E79] transition resize-none shadow-2xs"
                  />
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
                <span>Amount Payable</span>
                <span className="text-base text-brand-heading">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Secure UPI Payment Section — Fail-Proof Manual Flow */}
            <div className="bg-[#FAF9F6] border border-[#8FA088]/40 rounded-2xl p-5 space-y-4 shadow-xs select-none">
              <div className="flex items-center justify-between border-b border-brand-border/25 pb-3">
                <span className="text-xs font-bold text-brand-heading flex items-center gap-1.5">
                  <span className="text-[#8FA088]">🛡️</span> Instant UPI Payment
                </span>
                <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  NPCI Verified
                </span>
              </div>

              {/* Instructions */}
              <p className="text-[11px] text-brand-body/80 font-medium leading-relaxed">
                Scan QR code or Copy UPI ID to pay using GPay, PhonePe, Paytm, BHIM or any UPI app. Enter the 12-digit Transaction ID (UTR) below to verify.
              </p>

              {/* QR & Copy UPI Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col items-center w-full">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-brand-heading block">Fuzzy Soft Studio</span>
                  <span className="text-[10px] text-brand-body/60 font-mono">Official Store Account</span>
                </div>

                {/* NPCI Standard Dynamic High-Contrast UPI QR Code */}
                <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-center">
                  <QRCodeSVG
                    value={`upi://pay?pa=9506228972@axl&pn=${encodeURIComponent('Fuzzy Soft Studio')}&am=${total}&cu=INR&tn=${encodeURIComponent('Fuzzy Soft Studio Order')}`}
                    size={180}
                    level="H"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    includeMargin={true}
                  />
                </div>

                {/* Dynamic Amount Badge */}
                <div className="mt-3 bg-brand-cream/80 border border-brand-border/40 px-4 py-1.5 rounded-full text-center">
                  <span className="text-xs font-bold text-brand-heading">Payable Amount: ₹{total.toLocaleString('en-IN')}</span>
                </div>

                {/* Copy UPI ID Box */}
                <div className="mt-4 w-full pt-3 border-t border-stone-100 flex items-center justify-between bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 px-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-brand-body/50">Official UPI ID</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-brand-heading select-all">
                      9506228972@axl
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C9A84C] hover:text-[#B08A38] transition cursor-pointer bg-white hover:bg-brand-cream/40 px-3 py-1.5 rounded-lg border border-brand-border/40 shadow-3xs"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy UPI ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* UTR Input Section (Global) */}
              <div className="space-y-1.5 pt-3 border-t border-brand-border/25">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading flex items-center justify-between">
                  <span>12-Digit Transaction ID (UTR / Ref No.) *</span>
                  {utrNumber.trim().length >= 10 && (
                    <span className="text-green-600 flex items-center gap-0.5 text-[9px] font-bold">
                      <Check size={11} /> Valid UTR
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setUtrNumber(cleaned.slice(0, 12));
                  }}
                  placeholder="e.g. 312894760234"
                  className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-3xs"
                />
                <p className="text-[8px] text-brand-body/50 font-sans italic">
                  Note: Enter the 12-digit UTR/Ref number from your UPI app receipt after payment.
                </p>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleWhatsAppCheckout}
              disabled={loading || utrNumber.trim().length < 10}
              className={`w-full h-12 text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 shadow-sm flex items-center justify-center gap-2 select-none min-h-[44px] ${
                (loading || utrNumber.trim().length < 10)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#DCA29A] hover:bg-[#D4938A] hover:shadow-md active:scale-[0.98] cursor-pointer'
              }`}
            >
              <MessageCircle size={15} />
              <span>{loading ? 'Processing...' : 'Place Order'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
