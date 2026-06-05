import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Tag, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';
import { products as staticProducts } from '../data/products';

export default function Cart() {
  const navigate = useNavigate();
  const cart = useStore((state) => state.cart);
  const updateCartQuantity = useStore((state) => state.updateCartQuantity);
  const removeFromCart = useStore((state) => state.removeFromCart);

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('products').select('id, slug').then(({ data }) => {
      if (data) setDbProducts(data);
    });
  }, []);

  const getProductSlug = (itemId: string, itemSlug?: string): string => {
    // Check dbProducts first
    const dbProd = dbProducts.find(p => p.id === itemId);
    if (dbProd?.slug) return dbProd.slug;
    // Check static products
    const staticProd = staticProducts.find(p => p.id === itemId);
    if (staticProd?.slug) return staticProd.slug;
    // Fallback to itemSlug or item.id
    return itemSlug || itemId;
  };

  const [freeThreshold, setFreeThreshold] = useState(999);
  const [shippingFee, setShippingFee] = useState(99);

  // Discount code state
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);

  useEffect(() => {
    const loadCartSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('*');
        if (data && data.length > 0) {
          const thresholdSetting = data.find(s => s.key === 'free_delivery_threshold');
          if (thresholdSetting) {
            setFreeThreshold(Number(thresholdSetting.value) || 999);
          }
          const shippingSetting = data.find(s => s.key === 'shipping_charges');
          if (shippingSetting) {
            setShippingFee(Number(shippingSetting.value) || 99);
          }
        } else {
          loadLocalSettings();
        }
      } catch (err) {
        loadLocalSettings();
      }
    };

    const loadLocalSettings = () => {
      const local = localStorage.getItem('fuzzy-soft-studio-settings');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.free_delivery_threshold !== undefined) {
          setFreeThreshold(Number(parsed.free_delivery_threshold));
        }
        if (parsed.shipping_charges !== undefined) {
          setShippingFee(Number(parsed.shipping_charges));
        }
      }
    };

    loadCartSettings();
  }, []);

  // Apply discount code handler
  const handleApplyCode = async () => {
    setDiscountError('');
    if (!discountCodeInput.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }
    setApplyingCode(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'discount_codes')
        .single();
      if (error) throw error;
      const codes: Array<{ code: string; percent: number; expiry?: string }> = JSON.parse(data.value);
      const found = codes.find(
        (c) => c.code.toLowerCase() === discountCodeInput.trim().toLowerCase()
      );
      if (!found) {
        setDiscountError('Invalid discount code. Please try again.');
      } else if (found.expiry && new Date(found.expiry) < new Date()) {
        setDiscountError('This code has expired.');
      } else {
        setAppliedDiscount({ code: found.code, percent: found.percent });
        setDiscountCodeInput('');
        setShowDiscountInput(false);
      }
    } catch {
      setDiscountError('Could not validate code. Please try again.');
    } finally {
      setApplyingCode(false);
    }
  };

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // Delivery calculation
  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= freeThreshold ? 0 : shippingFee;
  }, [subtotal, freeThreshold, shippingFee]);

  // Discount amount
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    return Math.round(subtotal * appliedDiscount.percent / 100);
  }, [subtotal, appliedDiscount]);

  const total = subtotal + deliveryCharge - discountAmount;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-16 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full select-none">
        <div className="bg-white border border-brand-border/40 p-6 rounded-full text-brand-accent shadow-xs mb-6 bloom">
          <ShoppingBag className="w-12 h-12" strokeWidth={1.2} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-4 leading-tight">
          Your Garden Cart is Empty
        </h1>
        <p className="text-sm text-brand-body/75 mb-8 max-w-md font-sans">
          It looks like you haven't added any arrangements to your cart yet. Let's find something beautiful for your space.
        </p>
        <Link
          to="/shop"
          className="bg-[#DCA29A] hover:bg-[#D4938A] text-white px-8 py-3.5 rounded-full font-sans font-semibold tracking-widest text-xs uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          <span>Shop Our Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Page Title */}
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-2">Shopping Cart</h1>
        <div className="h-0.5 w-16 bg-[#C9A84C] mt-2 mx-auto lg:mx-0"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
        {/* Left Side: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 py-6 first:pt-0 last:pb-0 border-b border-brand-border/30 last:border-0"
              >
                {/* Product Image */}
                <div className="w-24 h-32 shrink-0 rounded-xl overflow-hidden bg-brand-cream border border-brand-border/30 shadow-xs select-none">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info & Adjusters */}
                <div className="flex-grow flex flex-col justify-between text-center sm:text-left py-1 w-full sm:w-auto">
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-lg font-bold text-brand-heading hover:text-brand-accent transition-colors">
                      <Link to={`/product/${getProductSlug(item.id, item.slug)}`}>
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-brand-body/60 font-sans line-clamp-1">
                      {item.description || 'Hand-crafted luxury arrangement'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-0 select-none">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between border border-brand-border bg-white rounded-full h-9 w-28 px-2.5 shadow-xs">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-brand-cream text-brand-heading transition ${
                          item.quantity <= 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-90'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-sans font-semibold text-xs text-brand-heading">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-brand-cream text-brand-heading cursor-pointer transition active:scale-90"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-brand-body/40 hover:text-red-500 hover:scale-105 transition-all p-1.5 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtotal for Item */}
                <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1.5 shrink-0 py-1 font-sans font-semibold text-brand-heading w-full sm:w-auto border-t sm:border-0 border-brand-border/20 pt-4 sm:pt-1">
                  <span className="text-xs text-brand-body/55 sm:hidden font-normal uppercase tracking-wider">Total</span>
                  <div className="text-right">
                    <span className="text-base">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-brand-body/50 font-normal">
                        ₹{item.price.toLocaleString('en-IN')} each
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping Action */}
          <div className="flex justify-start">
            <Link
              to="/shop"
              className="text-brand-accent hover:text-brand-accent-hover text-xs font-semibold tracking-wider uppercase flex items-center gap-2 select-none"
            >
              <ArrowLeft size={14} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Order Summary (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <div className="bg-white/65 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
            <h2 className="font-serif text-xl font-bold text-brand-heading mb-6">Order Summary</h2>

            {/* Price Breakdown */}
            <div className="space-y-4 font-sans text-sm text-brand-body/85 border-b border-brand-border/30 pb-5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-heading">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span>Delivery Charges</span>
                  <span className="text-[10px] text-brand-body/50">Free above ₹{freeThreshold}</span>
                </div>
                <span className="font-semibold text-brand-heading">
                  {deliveryCharge === 0 ? (
                    <span className="text-brand-accent uppercase tracking-wider text-xs">Free</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              {/* Applied Discount Row */}
              {appliedDiscount && (
                <div className="flex justify-between items-center text-green-700">
                  <div className="flex items-center gap-1.5">
                    <Check size={12} className="shrink-0" />
                    <span className="font-semibold">{appliedDiscount.code} ({appliedDiscount.percent}% off)</span>
                  </div>
                  <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Promo Code Section */}
            <div className="py-5 border-b border-brand-border/30">
              {appliedDiscount ? (
                /* Code successfully applied — show green confirmation */
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <Tag size={13} />
                    <span className="text-xs font-semibold font-sans">
                      Code <strong>{appliedDiscount.code}</strong> applied!
                    </span>
                  </div>
                  <button
                    onClick={() => { setAppliedDiscount(null); }}
                    className="text-xs text-green-600 hover:text-red-500 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                /* No code applied — show toggle link */
                <>
                  <button
                    onClick={() => { setShowDiscountInput(v => !v); setDiscountError(''); }}
                    className="flex items-center gap-2 text-xs text-brand-accent font-semibold font-sans underline underline-offset-2 cursor-pointer hover:text-brand-accent-hover transition-colors"
                  >
                    <Tag size={13} />
                    Have a promo code? Click to apply
                  </button>

                  {showDiscountInput && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCodeInput}
                          onChange={(e) => {
                            setDiscountCodeInput(e.target.value.toUpperCase());
                            setDiscountError('');
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCode(); }}
                          placeholder="Enter promo code"
                          autoFocus
                          className="flex-1 h-10 px-3 bg-white border border-brand-border/70 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all uppercase tracking-wider"
                        />
                        <button
                          onClick={handleApplyCode}
                          disabled={applyingCode}
                          className="px-4 h-10 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {applyingCode ? '…' : 'Apply'}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-[11px] text-red-500 font-sans font-medium">{discountError}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Order Total */}
            <div className="flex justify-between items-center py-5 font-sans text-brand-heading">
              <span className="text-base font-semibold">Order Total</span>
              <span className="text-xl font-bold">₹{total.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full h-12 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 select-none"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} />
            </button>

            <p className="text-center text-[10px] text-brand-body/45 font-sans mt-4 select-none">
              Promo codes can also be applied at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
