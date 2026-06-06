import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Plus, Minus, Truck, ShieldCheck, HeartCrack, Leaf } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { WishlistItem } from '../store/useStore';
import { products as staticProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabaseClient';


export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [products, setProducts] = useState<any[]>(staticProducts);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
        if (error) throw error;
        if (data) {
          const dbIds = new Set(data.map(p => p.id));
          const dbSlugs = new Set(data.map(p => p.slug));
          const filteredStatic = staticProducts.filter(p => !dbIds.has(p.id) && !dbSlugs.has(p.slug));
          setProducts([...data, ...filteredStatic]);
        } else {
          setProducts(staticProducts);
        }
      } catch (err) {
        console.warn('Failed to load products in details view:', err);
        setProducts(staticProducts);
      }
    };
    loadProducts();
  }, []);

  // Find matching product
  const product = useMemo(() => {
    return products.find((p) => p.slug === slug);
  }, [slug, products]);

  // If product not found, show empty state or redirect
  const [activeTab, setActiveTab] = useState<'description' | 'care' | 'delivery'>('description');
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Zustand state
  const addToCart = useStore((state) => state.addToCart);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const wishlist = useStore((state) => state.wishlist);

  // Sync main image when product changes
  useEffect(() => {
    if (product) {
      setMainImage(product.image);
      setQuantity(1);
      window.scrollTo(0, 0);
    }
  }, [product]);

  const wished = product ? wishlist.some((item) => item.id === product.id) : false;

  // Get 4 related products (same category first, excluding current product)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id)
      .sort((a, b) => {
        // Prioritize same category
        if (a.category === product.category && b.category !== product.category) return -1;
        if (b.category === product.category && a.category !== product.category) return 1;
        return 0;
      })
      .slice(0, 4);
  }, [product, products]);

  const handleAddToCart = () => {
    if (!product) return;
    const finalQuantity = product.stock !== undefined ? Math.min(product.stock, quantity) : quantity;
    if (finalQuantity <= 0) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      slug: product.slug
    }, finalQuantity);

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product as WishlistItem);
  };

  const showToast = useStore((state) => state.showToast);

  // Reviews and purchase state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dynamic average ratings and star counts from Supabase reviews
  const reviewsSummary = useMemo(() => {
    if (dbReviews.length === 0) {
      return {
        average: 0,
        count: 0,
        distribution: [
          { stars: 5, percentage: 0 },
          { stars: 4, percentage: 0 },
          { stars: 3, percentage: 0 },
          { stars: 2, percentage: 0 },
          { stars: 1, percentage: 0 }
        ]
      };
    }

    const total = dbReviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((total / dbReviews.length) * 10) / 10;
    
    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = dbReviews.filter(r => r.rating === stars).length;
      const percentage = Math.round((count / dbReviews.length) * 100);
      return { stars, percentage };
    });

    return { average, count: dbReviews.length, distribution };
  }, [dbReviews]);

  const loadReviews = async () => {
    if (!product) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setDbReviews(data);
      }
    } catch (err) {
      console.warn('Failed to load reviews from Supabase:', err);
    }
  };

  const checkPurchaseHistory = async (userId: string, productId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      if (data) {
        const purchased = data.some((order: any) => {
          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
          return items.some((item: any) => item.id === productId);
        });
        setHasPurchased(purchased);
      }
    } catch (err) {
      console.warn('Failed to check purchase history in Supabase, checking local storage:', err);
      // Fallback: check local storage orders
      const local = localStorage.getItem('fuzzy-soft-studio-local-orders');
      if (local) {
        const parsed = JSON.parse(local);
        const purchased = parsed.some((order: any) => {
          const items = order.items || [];
          return items.some((item: any) => item.id === productId);
        });
        setHasPurchased(purchased);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
      }
    });
  }, []);

  useEffect(() => {
    if (product) {
      loadReviews();
      if (currentUser) {
        checkPurchaseHistory(currentUser.id, product.id);
      }
    }
  }, [product?.id, currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('write_review') === 'true') {
      setShowReviewForm(true);
      setTimeout(() => {
        const el = document.getElementById('reviews-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [location.search, product?.id]);


  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Check if authenticated
    if (!currentUser) {
      showToast('Please sign in or sign up to publish your review.', 'error');
      return;
    }

    // 2. Check if purchased (with dynamic check fallback in case hasPurchased state didn't update yet)
    let isBuyer = hasPurchased;
    if (!isBuyer && currentUser) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', currentUser.id);
        if (data) {
          isBuyer = data.some((order: any) => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
            return items.some((item: any) => item.id === product.id);
          });
        }
      } catch (err) {
        console.warn('Supabase database orders query warning during verification:', err);
      }
      
      if (!isBuyer) {
        const local = localStorage.getItem('fuzzy-soft-studio-local-orders');
        if (local) {
          const parsed = JSON.parse(local);
          isBuyer = parsed.some((order: any) => {
            const items = order.items || [];
            return items.some((item: any) => item.id === product.id);
          });
        }
      }
    }

    if (!isBuyer) {
      showToast('Only verified buyers of this arrangement can publish reviews.', 'error');
      return;
    }

    if (!newReviewTitle.trim() || !newReviewComment.trim()) {
      showToast('Please enter a review title and comment.', 'error');
      return;
    }


    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        customer_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Verified Buyer',
        rating: newReviewRating,
        title: newReviewTitle.trim(),
        comment: newReviewComment.trim()
      });
      if (error) throw error;

      showToast('Thank you! Your review has been submitted successfully.', 'success');
      setNewReviewTitle('');
      setNewReviewComment('');
      setNewReviewRating(5);
      setShowReviewForm(false);
      loadReviews();
    } catch (err: any) {
      showToast(`Failed to submit review: ${err.message}`, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const reviewsToDisplay = useMemo(() => {
    if (!product) return [];
    return dbReviews.map(r => ({
      author: r.customer_name.toUpperCase(),
      stars: r.rating,
      date: new Date(r.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      title: r.title,
      comment: r.comment
    }));
  }, [dbReviews, product]);

  if (!product) {
    return (
      <div className="min-h-screen pt-16 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white border border-brand-border p-6 rounded-full text-brand-accent shadow-sm mb-6">
          <HeartCrack className="w-12 h-12" strokeWidth={1.2} />
        </div>
        <h1 className="text-3xl font-serif text-brand-heading mb-3">Product Not Found</h1>
        <p className="text-sm text-brand-body/75 mb-8 max-w-sm">
          The arrangement you are looking for does not exist or has been removed from our catalog.
        </p>
        <Link
          to="/shop"
          className="bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-3 rounded-full font-sans font-semibold tracking-wider text-xs uppercase transition-all"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] text-brand-body/50 font-sans tracking-wide mb-6 select-none animate-fade-in-up">
        <Link to="/" className="hover:text-brand-accent transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-accent transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-brand-heading font-medium truncate max-w-[150px] sm:max-w-none">
          {product.name}
        </span>
      </div>

      {/* Main Layout (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 items-start w-full">
        {/* Left Side: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Selected Image */}
          <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white border border-brand-border/40 shadow-sm select-none group">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Thumbnails Row */}
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((imgUrl: string, index: number) => {
              const isActive = mainImage === imgUrl;
              return (
                <button
                  key={index}
                  onClick={() => setMainImage(imgUrl)}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-white border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'border-[#C9A84C] ring-1 ring-[#C9A84C] scale-[0.98]' 
                      : 'border-brand-border/60 opacity-80 hover:opacity-100 hover:scale-[1.02]'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Product Details & CTA (6 cols) */}
        <div className="lg:col-span-6 space-y-6 lg:pl-4">
          <div className="space-y-2 select-none">
            {/* Category label */}
            <span className="text-[11px] tracking-[0.2em] text-[#8FA088] uppercase font-bold block select-none font-sans">
              {product.category}
            </span>
            {/* Product Name */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-serif text-brand-heading font-normal leading-[1.1] tracking-tight">
              {product.name}
            </h1>
            {/* Price */}
            <div className="text-2xl sm:text-3xl font-serif text-brand-heading font-light pt-2 select-none">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            {/* Out of Stock badge */}
            {product.stock === 0 && (
              <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full">
                Currently Out of Stock
              </div>
            )}
          </div>

          <hr className="border-brand-border/40" />

          {/* Description */}
          <p className="text-sm md:text-base text-brand-body/75 leading-relaxed font-light">
            {product.description} Experience the beauty of hand-selected stems assembled with artistic precision. Perfect as a gift or center attraction.
          </p>

          {/* Highlights Section */}
          <div className="grid grid-cols-2 gap-4 py-6 border-y border-brand-border/30 text-xs sm:text-sm font-sans text-brand-body/80 select-none">
            <div className="flex items-center gap-3 bg-white/45 border border-brand-border/20 px-4 py-3 rounded-2xl shadow-xs hover:border-brand-accent/40 transition duration-300">
              <div className="w-8 h-8 rounded-full bg-[#F6EBE2] flex items-center justify-center shrink-0 shadow-xs">
                <Leaf size={14} className="text-[#8FA088]" />
              </div>
              <span className="font-semibold text-brand-heading tracking-wide">
                {(Array.isArray(product.bullet_points) && product.bullet_points[0]) || '100% Handcrafted'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-white/45 border border-brand-border/20 px-4 py-3 rounded-2xl shadow-xs hover:border-brand-accent/40 transition duration-300">
              <div className="w-8 h-8 rounded-full bg-[#F6EBE2] flex items-center justify-center shrink-0 shadow-xs">
                <Star size={14} className="text-[#C9A84C]" fill="#C9A84C" />
              </div>
              <span className="font-semibold text-brand-heading tracking-wide">
                {(Array.isArray(product.bullet_points) && product.bullet_points[1]) || 'Long-lasting Bloom'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-white/45 border border-brand-border/20 px-4 py-3 rounded-2xl shadow-xs hover:border-brand-accent/40 transition duration-300">
              <div className="w-8 h-8 rounded-full bg-[#F6EBE2] flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={14} className="text-[#8FA088]" />
              </div>
              <span className="font-semibold text-brand-heading tracking-wide">
                {(Array.isArray(product.bullet_points) && product.bullet_points[2]) || 'Customizable Order'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-white/45 border border-brand-border/20 px-4 py-3 rounded-2xl shadow-xs hover:border-brand-accent/40 transition duration-300">
              <div className="w-8 h-8 rounded-full bg-[#F6EBE2] flex items-center justify-center shrink-0 shadow-xs">
                <Heart size={14} className="text-brand-accent" fill="currentColor" />
              </div>
              <span className="font-semibold text-brand-heading tracking-wide">
                {(Array.isArray(product.bullet_points) && product.bullet_points[3]) || 'Allergen & Pet Safe'}
              </span>
            </div>
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium select-none">
            {product.stock === 0 ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="text-red-500">Out of Stock</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-brand-sage animate-pulse"></span>
                {product.stock !== undefined && product.stock <= 3 ? (
                  <span className="text-amber-600 font-semibold">Only {product.stock} left!</span>
                ) : (
                  <span className="text-brand-body/80">In Stock - Hand-tied & shipped to order</span>
                )}
              </>
            )}
          </div>

          {/* Delivery Indicator */}
          <div className="flex items-start gap-2.5 bg-white/40 border border-brand-border/25 rounded-2xl p-4 text-xs text-brand-body/80 select-none shadow-sm">
            <Truck size={16} className="text-brand-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-brand-heading">Delivery Lead Times</div>
              <div>Lucknow: <span className="font-medium text-brand-heading">5–10 business days</span></div>
              <div>Rest of India: <span className="font-medium text-brand-heading">7–14 business days</span></div>
            </div>
          </div>

          {/* Quantity Selector and CTA Grid */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Quantity selector */}
              <div className="flex items-center justify-between border border-brand-border bg-white rounded-full h-12 w-32 px-3 shrink-0 shadow-sm select-none">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock === 0 || quantity <= 1}
                  className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-cream text-brand-heading transition ${
                    (product.stock === 0 || quantity <= 1) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-90'
                  }`}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="font-sans font-semibold text-sm text-brand-heading">
                  {product.stock === 0 ? 0 : quantity}
                </span>
                <button
                  onClick={() => {
                    const maxQty = product.stock !== undefined && product.stock > 0 ? product.stock : 10;
                    setQuantity(Math.min(maxQty, quantity + 1));
                  }}
                  disabled={product.stock === 0 || (product.stock !== undefined && quantity >= product.stock)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-cream text-brand-heading transition ${
                    (product.stock === 0 || (product.stock !== undefined && quantity >= product.stock)) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-90'
                  }`}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart (Full width) */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-grow w-full h-12 rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-white ${
                  product.stock === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isAdded
                    ? 'bg-brand-accent-hover cursor-pointer'
                    : 'bg-[#DCA29A] hover:bg-[#D4938A] cursor-pointer'
                }`}
              >
                <ShoppingBag size={14} />
                <span>{product.stock === 0 ? 'Out of Stock' : isAdded ? 'Added to Cart!' : 'Add to Cart'}</span>
              </button>
            </div>

            {/* Add to Wishlist */}
            <button
              onClick={handleToggleWishlist}
              className={`w-full h-11 rounded-full border border-brand-border text-xs uppercase tracking-widest font-semibold transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                wished 
                  ? 'bg-red-50/40 text-red-600 border-red-200 hover:bg-red-50/70' 
                  : 'bg-white hover:bg-brand-cream text-brand-heading hover:text-brand-accent hover:border-brand-accent'
              }`}
            >
              <Heart size={14} className={wished ? 'fill-red-500 text-red-500' : ''} />
              <span>{wished ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section (Description, Care, Delivery) */}
      <div className="mt-20 border-t border-brand-border/40 pt-10 w-full">
        {/* Tab Selection Row */}
        <div className="flex border-b border-brand-border/30 overflow-x-auto no-scrollbar gap-8 select-none shrink-0 mb-6">
          {(['description', 'care', 'delivery'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs uppercase tracking-widest font-semibold border-b-2 cursor-pointer transition-all duration-300 whitespace-nowrap ${
                  isActive 
                    ? 'border-brand-accent text-brand-accent' 
                    : 'border-transparent text-brand-body/50 hover:text-brand-heading'
                }`}
              >
                {tab === 'description' && 'Description'}
                {tab === 'care' && 'Care Instructions'}
                {tab === 'delivery' && 'Delivery Info'}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[120px] transition-all duration-500 py-2">
          {activeTab === 'description' && (
            <div className="space-y-4 max-w-4xl text-sm text-brand-body/85 leading-relaxed">
              <p>
                Our signature {product.name} arrangement showcases the premium heights of handcrafting. Utilizing selected stems of highest grade flowers, each floral arrangement is composed carefully to bring romantic luxury directly into your spaces.
              </p>
              <p>
                Designed under a neutral aesthetic, it features pastel gradients that blend seamlessly with any decor. Safe for pets, allergen-free, and assembled with details that represent premium luxury.
              </p>
            </div>
          )}
          {activeTab === 'care' && (
            <div className="max-w-4xl text-sm text-brand-body/85 leading-relaxed space-y-3">
              <div className="font-semibold text-brand-heading select-none">Floral Care Guide</div>
              <p>{product.care_instructions || 'Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.'}</p>
            </div>
          )}
          {activeTab === 'delivery' && (
            <div className="max-w-4xl text-sm text-brand-body/85 leading-relaxed space-y-3">
              <div className="font-semibold text-brand-heading select-none">Shipping & Handling Details</div>
              {product.delivery_info ? (
                <p>{product.delivery_info}</p>
              ) : (
                <>
                  <p>
                    Each bouquet is lovingly hand-crafted by our master florist and packaged in a luxury signature box secure enough to prevent shifting during transit. 
                  </p>
                  <p>
                    Lucknow orders take 5–10 business days to deliver. Pan-India shipments deliver in 7–14 business days via express parcel delivery. Tracking details are emailed immediately upon shipping.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="reviews-section" className="mt-20 border-t border-brand-border/40 pt-14 w-full">
        <h2 className="text-2xl font-serif text-brand-heading mb-8">
          Customer Reviews
        </h2>

        {dbReviews.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {showReviewForm ? (
              <div className="lg:col-span-8 lg:col-start-3">
                <form onSubmit={handleSubmitReview} className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 shadow-sm space-y-5 animate-fade-in-up">
                  <h3 className="font-serif text-lg font-bold text-brand-heading">
                    Write Your Review
                  </h3>

                  {/* Rating selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                      Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className="text-2xl hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={star <= newReviewRating ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-brand-body/30'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="reviewTitle" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                      Review Title
                    </label>
                    <input
                      type="text"
                      id="reviewTitle"
                      required
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      placeholder="Summarize your experience (e.g. Exquisite handcrafting!)"
                      className="w-full h-11 px-4 bg-white border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label htmlFor="reviewComment" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                      Your Review
                    </label>
                    <textarea
                      id="reviewComment"
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Tell us what you love about this arrangement, how it looks in your space, etc..."
                      rows={4}
                      className="w-full p-4 bg-white border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 text-xs font-semibold uppercase tracking-wider select-none">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 h-10 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full cursor-pointer transition active:scale-95 text-center flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full cursor-pointer shadow-xs transition active:scale-95 text-center flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="lg:col-span-12 bg-white/40 border border-brand-border/25 rounded-2xl p-12 text-center space-y-6 shadow-sm animate-fade-in">
                <div className="max-w-md mx-auto space-y-4">
                  <span className="text-[10px] tracking-[0.2em] text-[#8FA088] uppercase font-bold block select-none font-sans">
                    No Reviews Yet
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif text-brand-heading">
                    Be the first to review this product
                  </h3>
                  <p className="text-xs text-brand-body/75 leading-relaxed font-light font-sans">
                    We'd love to hear your thoughts! Share your experience with this handcrafted arrangement and help other flower lovers choose their perfect bouquet.
                  </p>
                  
                  <div className="pt-4">
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="h-11 px-8 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition shadow-xs hover:shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer animate-fade-in"
                    >
                      <span>Write a Review</span>
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[9px] text-brand-body/50 italic font-sans leading-relaxed">
                      Everyone can write a review. Reviews are published only for verified buyers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Rating Summary Block (4 cols) */}
            <div className="lg:col-span-4 bg-white/40 border border-brand-border/25 rounded-2xl p-6 shadow-sm space-y-6 select-none animate-fade-in">
              <div>
                <div className="text-4xl font-serif font-semibold text-brand-heading">{reviewsSummary.average}</div>
                <div className="flex items-center gap-1 text-[#C9A84C] mt-1.5">
                  {[...Array(5)].map((_, i) => {
                    const filled = i < Math.round(reviewsSummary.average);
                    return (
                      <Star key={i} size={16} className={filled ? "fill-current" : "text-brand-body/25"} />
                    );
                  })}
                </div>
                <div className="text-xs text-brand-body/60 mt-1.5">Based on {reviewsSummary.count} verified {reviewsSummary.count === 1 ? 'review' : 'reviews'}</div>
              </div>

              {/* Distribution bars */}
              <div className="space-y-2 pt-2">
                {reviewsSummary.distribution.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs text-brand-body/75">
                    <span className="w-3 shrink-0">{row.stars}★</span>
                    <div className="flex-grow h-2 bg-brand-border/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#C9A84C] rounded-full transition-all duration-500" 
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right shrink-0">{row.percentage}%</span>
                  </div>
                ))}
              </div>

              {/* Write a review action checks - always shown to everyone */}
              <div className="pt-4 border-t border-brand-border/25">
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer animate-fade-in"
                >
                  <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
                </button>
              </div>
              
              <div className="pt-3 text-center">
                <p className="text-[10px] text-brand-body/55 italic font-sans leading-relaxed">
                  Everyone can write a review. Reviews are published only for verified buyers.
                </p>
              </div>

            </div>

            {/* Reviews list & Form (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Write a review form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in-up">
                  <h3 className="font-serif text-lg font-bold text-brand-heading">
                    Write Your Review
                  </h3>

                  {/* Rating selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                      Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className="text-2xl hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={star <= newReviewRating ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-brand-body/30'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="reviewTitle" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                      Review Title
                    </label>
                    <input
                      type="text"
                      id="reviewTitle"
                      required
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      placeholder="Summarize your experience (e.g. Exquisite handcrafting!)"
                      className="w-full h-11 px-4 bg-white border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label htmlFor="reviewComment" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85">
                      Your Review
                    </label>
                    <textarea
                      id="reviewComment"
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Tell us what you love about this arrangement, how it looks in your space, etc..."
                      rows={4}
                      className="w-full p-4 bg-white border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 text-xs font-semibold uppercase tracking-wider select-none">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 h-10 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full cursor-pointer transition active:scale-95 text-center flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full cursor-pointer shadow-xs transition active:scale-95 text-center flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}

              {/* List of reviews */}
              {reviewsToDisplay.map((rev, idx) => (
                <div 
                  key={idx} 
                  className="bg-[#F6EBE2] border-l-4 border-[#74876E] rounded-r-2xl p-6 shadow-sm space-y-3 animate-fade-in-up"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-0.5 text-[#C9A84C] mb-1">
                        {[...Array(rev.stars)].map((_, i) => (
                          <Star key={i} size={12} className="fill-current" />
                        ))}
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-brand-heading">
                        {rev.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-brand-body/50 font-sans tracking-wide">
                      {rev.date}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-brand-heading/85 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                  <p className="font-sans text-[10px] font-semibold tracking-widest text-brand-heading/60 uppercase">
                    — {rev.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      <div className="mt-24 border-t border-brand-border/40 pt-16 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-brand-heading text-center">
            You May Also Like
          </h2>
          <p className="text-lg font-script text-[#8FA088] text-2xl select-none mt-1">
            Carefully selected companion pieces
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          {relatedProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </div>
  );
}
