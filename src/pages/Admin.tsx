import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { products as defaultProducts } from '../data/products';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Star, 
  Tag, 
  Percent, 
  Layout, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  User, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import type { SiteSettings } from './admin/types';

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useStore((state) => state.showToast);
  const toast = useStore((state) => state.toast);
  const hideToast = useStore((state) => state.hideToast);

  // Authentication State
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  // Loaded database state
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    free_delivery_threshold: 999,
    shipping_charges: 99,
    whatsapp_number: '916386422660',
    contact_email: 'hello@fuzzysoftstudio.com',
    offer_line: '🌸 Mother\'s Day Special: Use code BLOOM20 for 20% off all bouquets! 🌸'
  });

  const [categories, setCategories] = useState<string[]>(['Bouquets', 'Arrangements', 'Gift Boxes', 'Dried Flowers']);
  const [reviews, setReviews] = useState<any[]>([]);
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  
  // Store Settings fields
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeClosedMessage, setStoreClosedMessage] = useState("We'll be back soon! 🌸");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [codAvailable, setCodAvailable] = useState(false);
  const [codCharge, setCodCharge] = useState(0);
  const [expressCharge, setExpressCharge] = useState(0);

  // Announcements fields
  const [adminCollectionBanners, setAdminCollectionBanners] = useState([
    { name: 'Bridal Blooms', slug: 'bridal-blooms', image: '' },
    { name: 'Everyday Luxury', slug: 'everyday-luxury', image: '' },
    { name: 'Seasonal Picks', slug: 'seasonal-picks', image: '' },
    { name: 'Gift Bouquets', slug: 'gift-bouquets', image: '' }
  ]);
  const [gardenImages, setGardenImages] = useState<string[]>(Array(6).fill(''));

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Mobile Layout Drawer state
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  const autoUploadBanners = async () => {
    if (localStorage.getItem('fss_banners_uploaded') === 'true') return;
    const banners = [
      { slug: 'bridal-blooms', path: '/collection-bridal.png', name: 'Bridal Blooms' },
      { slug: 'everyday-luxury', path: '/collection-everyday.png', name: 'Everyday Luxury' },
      { slug: 'seasonal-picks', path: '/collection-seasonal.png', name: 'Seasonal Picks' },
      { slug: 'gift-bouquets', path: '/collection-gift.png', name: 'Gift Bouquets' }
    ];
    try {
      const updated = [];
      for (const b of banners) {
        const res = await fetch(b.path);
        const blob = await res.blob();
        const file = new File([blob], `collection-${b.slug}.png`, { type: 'image/png' });
        const fileName = `collection-${b.slug}.png`;
        
        await supabase.storage
          .from('content')
          .upload(fileName, file, { upsert: true });
          
        const { data: { publicUrl } } = supabase.storage
          .from('content')
          .getPublicUrl(fileName);
          
        updated.push({
          name: b.name,
          slug: b.slug,
          image: publicUrl
        });
      }
      
      const { data: existingAnn } = await supabase.from('site_content').select('*').eq('id', 'announcements').single();
      const existingContent = (existingAnn && existingAnn.content) || {};

      await supabase.from('site_content').upsert(
        { 
          id: 'announcements', 
          content: {
            ...existingContent,
            collection_banners: updated
          },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
      localStorage.setItem('fss_banners_uploaded', 'true');
      showToast('Collection banners auto-uploaded!', 'success');
      setAdminCollectionBanners(updated);
    } catch (err) {
      console.warn('Auto upload of collection banners failed:', err);
    }
  };

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        const email = session.user?.email || '';
        const isAuthorized = email === 'angrybird@fuzzysoftstudio.com';
        
        if (isAuthorized) {
          setIsAdmin(true);
          setIsDenied(false);
          autoUploadBanners();
        } else {
          setIsAdmin(false);
          setIsDenied(true);
        }
        setCheckingAuth(false);
      } else {
        navigate('/admin/login', { replace: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        const email = session.user?.email || '';
        const isAuthorized = email === 'angrybird@fuzzysoftstudio.com';
        
        if (isAuthorized) {
          setIsAdmin(true);
          setIsDenied(false);
          autoUploadBanners();
        } else {
          setIsAdmin(false);
          setIsDenied(true);
        }
        setCheckingAuth(false);
      } else {
        setIsAdmin(false);
        setIsDenied(false);
        navigate('/admin/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch all admin tables
  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session]);

  const loadAllData = async () => {
    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadSettings()
    ]);
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      console.log('loadProducts:', data, error);
      if (error) throw error;
      if (data && data.length > 0) {
        setProducts(data || []);
      } else {
        setProducts([]);
        autoSeedDefaultCatalog();
      }
    } catch (e: any) {
      console.warn('Error loading products from Supabase:', e.message);
      setProducts([]);
    }
  };

  const autoSeedDefaultCatalog = async () => {
    try {
      const toInsert = defaultProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        category: p.category,
        collection: p.collection,
        image: p.image,
        images: p.images,
        bullet_points: ['100% Handcrafted', 'Long-lasting Bloom', 'Customizable Order', 'Allergen & Pet Safe'],
        care_instructions: 'Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.',
        delivery_info: 'Lucknow: 5–10 business days. Rest of India: 7–14 business days.',
        description: p.description,
        stock: 10,
        active: true
      }));

      const { error } = await supabase.from('products').upsert(toInsert);
      console.log('autoSeedDefaultCatalog seed:', error);
      if (error) throw error;

      const { data: refetched, error: refetchErr } = await supabase.from('products').select('*');
      console.log('autoSeedDefaultCatalog refetch:', refetched, refetchErr);
      if (refetched) {
        setProducts(refetched);
      }
    } catch (err: any) {
      console.warn('Auto-seed failed:', err.message);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      console.log('loadOrders:', data, error);
      if (error) throw error;
      if (data) {
        const formatted = data.map((o: any) => ({
          ...o,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
        }));
        setOrders(formatted);
      } else {
        setOrders([]);
      }
    } catch (e: any) {
      console.warn('Error loading orders from Supabase:', e.message);
      setOrders([]);
    }
  };

  const loadSettings = async () => {
    try {
      const { data: settingsData, error: settingsError } = await supabase.from('store_settings').select('*');
      console.log('loadSettings store_settings:', settingsData, settingsError);
      if (settingsError) throw settingsError;
      
      const loaded: any = {};
      if (settingsData && settingsData.length > 0) {
        settingsData.forEach((s: any) => {
          if (s.value && typeof s.value === 'object') {
            Object.assign(loaded, s.value);
          } else {
            loaded[s.key] = s.value;
          }
        });
      }

      // Load Categories from database
      const { data: catsData, error: catsError } = await supabase.from('categories').select('*').order('name', { ascending: true });
      console.log('loadSettings categories:', catsData, catsError);
      if (catsData && catsData.length > 0) {
        setCategories(catsData.map((c: any) => c.name));
      } else {
        const defaults = ['Bouquets', 'Arrangements', 'Gift Boxes', 'Dried Flowers'];
        const toInsert = defaults.map(name => ({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        }));
        try {
          const { error: seedErr } = await supabase.from('categories').insert(toInsert);
          console.log('loadSettings categories seed:', seedErr);
          setCategories(defaults);
        } catch (catSeedErr) {
          console.warn('Auto-seed of categories failed:', catSeedErr);
          setCategories(defaults);
        }
      }

      // Load Discount Codes from database
      const { data: discsData, error: discsError } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
      console.log('loadSettings discounts:', discsData, discsError);
      if (discsData) {
        setDiscountCodes(discsData.map((d: any) => ({
          id: d.id,
          code: d.code,
          percent: Number(d.value) || 0,
          expiry: d.expiry_date || '',
          limit: d.max_uses || undefined,
          active: d.is_active !== undefined ? d.is_active : true,
          min_order_value: d.min_order_value || undefined,
          discount_type: d.discount_type || 'percentage'
        })));
      }

      // Load Reviews from database
      const { data: revsData, error: revsError } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      console.log('loadSettings reviews:', revsData, revsError);
      if (revsData) {
        setReviews(revsData.map((r: any) => ({
          id: r.id,
          product_id: r.product_id,
          name: r.customer_name,
          email: r.customer_email || '',
          quote: r.review_text,
          rating: Number(r.rating) || 5,
          approved: r.status === 'approved',
          status: r.status,
          created_at: r.created_at
        })));
      }

      // Load Site Content from database
      const { data: contentData, error: contentError } = await supabase.from('site_content').select('*');
      console.log('loadSettings site_content:', contentData, contentError);
      const contentLoaded: any = {};
      if (contentData) {
        contentData.forEach((row: any) => {
          if (row.content) {
            Object.entries(row.content).forEach(([k, v]) => {
              contentLoaded[k] = v;
            });
          }
        });

        const announcementsRow = contentData.find((row: any) => row.id === 'announcements');
        if (announcementsRow && announcementsRow.content) {
          const c = announcementsRow.content;
          if (c.collection_banners) {
            setAdminCollectionBanners(c.collection_banners);
          }
          if (c.garden_images) {
            setGardenImages(c.garden_images);
          }
        }
      }

      const newSettings = {
        free_delivery_threshold: loaded.free_delivery_threshold !== undefined ? Number(loaded.free_delivery_threshold) : 999,
        shipping_charges: loaded.shipping_charges !== undefined ? Number(loaded.shipping_charges) : 99,
        whatsapp_number: loaded.whatsapp_number || '916386422660',
        contact_email: loaded.contact_email || 'hello@fuzzysoftstudio.com',
        offer_line: contentLoaded.offer_line || '🌸 Mother\'s Day Special: Use code BLOOM20 for 20% off all bouquets! 🌸',
        banner_url: contentLoaded.banner_url || '',
        store_logo_url: loaded.store_logo_url || ''
      };

      setSettings(newSettings);

      // Load store status
      if (loaded.store_open !== undefined) setStoreOpen(loaded.store_open === true || loaded.store_open === 'true');
      if (loaded.store_closed_message) setStoreClosedMessage(String(loaded.store_closed_message));
      if (loaded.low_stock_threshold !== undefined) setLowStockThreshold(Number(loaded.low_stock_threshold) || 5);

      if (loaded.cod_available !== undefined) setCodAvailable(loaded.cod_available === true || loaded.cod_available === 'true');
      if (loaded.cod_charge !== undefined) setCodCharge(Number(loaded.cod_charge) || 0);
      if (loaded.express_charge !== undefined) setExpressCharge(Number(loaded.express_charge) || 0);

    } catch (e: any) {
      console.warn('Error loading settings from Supabase:', e.message);
    }
  };

  const handleImageUpload = async (_e: React.ChangeEvent<HTMLInputElement>, _index: number) => {
    // Placeholder - sub-pages implement their specific name bindings
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showToast('Logged out.', 'success');
    navigate('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg select-none">
        <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isDenied) {
    return (
      <div className="min-h-screen bg-[#F5EDE6] flex items-center justify-center px-6 py-20 select-none animate-fade-in-up">
        <div className="max-w-md w-full bg-white/60 border border-brand-border/45 rounded-3xl p-8 shadow-xs backdrop-blur-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <X size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif text-brand-heading">Access Denied</h1>
            <p className="text-xs text-brand-body/65 font-sans uppercase tracking-wider">
              Restricted Administrative Workspace
            </p>
            <div className="h-0.5 w-10 bg-[#C9A84C] mt-3 mx-auto"></div>
          </div>
          
          <p className="text-sm text-brand-body/75 leading-relaxed font-sans">
            You are logged in as <strong className="text-brand-heading">{session?.user?.email}</strong>. This account does not have administrator privileges to access the FSS Terminal.
          </p>

          <div className="space-y-3 pt-4 font-sans text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => navigate('/account')}
              className="w-full h-11 bg-white hover:bg-brand-cream text-brand-heading border border-brand-border rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to My Account</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full h-11 bg-white hover:bg-brand-cream text-[#B07870] border border-brand-border rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Navigation config
  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.8} />, path: '/admin' },
    { label: 'Products', icon: <Package size={16} strokeWidth={1.8} />, path: '/admin/products' },
    { label: 'Orders', icon: <ShoppingBag size={16} strokeWidth={1.8} />, path: '/admin/orders' },
    { label: 'Customers', icon: <Users size={16} strokeWidth={1.8} />, path: '/admin/customers' },
    { label: 'Reviews', icon: <Star size={16} strokeWidth={1.8} />, path: '/admin/reviews' },
    { label: 'Categories', icon: <Tag size={16} strokeWidth={1.8} />, path: '/admin/categories' },
    { label: 'Discounts', icon: <Percent size={16} strokeWidth={1.8} />, path: '/admin/discounts' },
    { label: 'Content Manager', icon: <Layout size={16} strokeWidth={1.8} />, path: '/admin/content' },
    { label: 'Analytics', icon: <TrendingUp size={16} strokeWidth={1.8} />, path: '/admin/analytics' },
    { label: 'Settings', icon: <SettingsIcon size={16} strokeWidth={1.8} />, path: '/admin/settings' },
  ];

  const contextValue = {
    products,
    setProducts,
    orders,
    setOrders,
    settings,
    setSettings,
    categories,
    setCategories,
    reviews,
    setReviews,
    discountCodes,
    setDiscountCodes,
    showToast,
    uploadingIndex,
    setUploadingIndex,
    handleImageUpload,
    lowStockThreshold,
    setLowStockThreshold,
    loadAllData,
    loadProducts,
    storeOpen,
    setStoreOpen,
    storeClosedMessage,
    setStoreClosedMessage,
    codAvailable,
    setCodAvailable,
    codCharge,
    setCodCharge,
    expressCharge,
    setExpressCharge,
    adminCollectionBanners,
    setAdminCollectionBanners,
    gardenImages,
    setGardenImages
  };

  // Determine page title based on route
  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/admin') return 'Dashboard';
    if (p.startsWith('/admin/products/new')) return 'Add Arrangement';
    if (p.startsWith('/admin/products/edit')) return 'Edit Arrangement';
    if (p.startsWith('/admin/products')) return 'Product Catalog';
    if (p.startsWith('/admin/orders')) return 'Manage Orders';
    if (p.startsWith('/admin/customers')) return 'Customer Registry';
    if (p.startsWith('/admin/reviews')) return 'Review Moderation';
    if (p.startsWith('/admin/categories')) return 'Store Categories';
    if (p.startsWith('/admin/discounts')) return 'Discount Coupons';
    if (p.startsWith('/admin/content')) return 'Content Manager';
    if (p.startsWith('/admin/analytics')) return 'Store Analytics';
    if (p.startsWith('/admin/settings')) return 'Store Settings';
    return 'FSS Admin';
  };

  return (
    <div className="h-screen w-screen bg-[#FDFBF9] flex overflow-hidden font-sans">
      
      {/* A: Desktop Sidebar Navigation - Hidden on mobile (<768px) */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-full border-r border-brand-border/40 bg-[#F5EDE6]/60 shrink-0 select-none">
        <div className="p-6 space-y-8 overflow-y-auto max-h-[85vh]">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            {settings?.store_logo_url && (
              <img 
                src={settings.store_logo_url} 
                alt="Fuzzy Soft Studio Logo" 
                className="w-10 h-10 object-cover rounded-full border border-brand-border/30 shadow-xs" 
              />
            )}
            <div>
              <span className="font-script text-3.5xl text-brand-heading block leading-none">Admin</span>
              <span className="text-[9px] tracking-[0.25em] font-sans font-bold text-brand-heading/70 uppercase">Fuzzy Soft Studio</span>
            </div>
          </div>

          {/* Links list */}
          <nav className="space-y-1 text-xs font-semibold tracking-wider uppercase text-brand-body/80">
            {navItems.map(item => {
              const active = item.path === '/admin' 
                ? location.pathname === '/admin' 
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors ${
                    active ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & visitor link */}
        <div className="p-6 border-t border-brand-border/25 bg-brand-cream/15 text-center flex flex-col gap-2">
          <Link
            to="/"
            className="text-[10px] font-bold uppercase tracking-widest text-[#B07870] hover:text-[#DCA29A] transition-colors"
          >
            &larr; Visit Website
          </Link>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        
        {/* B: Desktop Top Bar Header */}
        <header className="flex justify-between items-center select-none py-4 px-6 border-b border-brand-border/30 bg-white/40 backdrop-blur-xs shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu toggle */}
            <button 
              onClick={() => setMoreDrawerOpen(true)}
              className="md:hidden w-11 h-11 rounded-full border border-brand-border flex items-center justify-center bg-white hover:bg-brand-cream cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <Menu size={16} />
            </button>
            
            <div>
              <h2 className="font-serif text-lg md:text-2xl text-brand-heading capitalize font-bold leading-tight">
                {getPageTitle()}
              </h2>
              <p className="text-[9px] text-brand-body/50 uppercase tracking-widest font-sans font-bold mt-0.5">
                FSS Terminal Manager
              </p>
            </div>
          </div>

          {/* User profile & quick sign out */}
          <div className="flex items-center gap-3 bg-brand-cream/35 border border-brand-border/30 rounded-2xl px-4 py-2 select-none scale-90 md:scale-100">
            <div className="w-7 h-7 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center shrink-0">
              <User size={14} />
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[8px] text-brand-body/50 uppercase tracking-widest leading-none font-bold">
                {isAdmin ? 'Verified Admin' : 'Staff Member'}
              </span>
              <span className="block text-xs font-semibold text-brand-heading max-w-[130px] truncate">
                {session?.user?.email || 'admin@fuzzysoft.com'}
              </span>
            </div>
            <div className="h-5 w-[1px] bg-brand-border/40 mx-1"></div>
            <button
              onClick={handleSignOut}
              className="text-brand-body/60 hover:text-red-500 transition cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Log Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* C: Core Inner Route Viewport */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-[#FDFBF9] print:p-0 print:bg-white print:overflow-visible">
          <Outlet context={contextValue} />
        </main>

        {/* D: Mobile Fixed Bottom Tab Bar - Visible only on mobile (<768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-brand-border/40 flex items-center justify-around z-40 select-none px-2 shadow-lg print:hidden">
          <Link 
            to="/admin" 
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${
              location.pathname === '/admin' ? 'text-[#B07870] font-bold' : 'text-brand-body/60'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[8px] mt-1 font-bold uppercase tracking-wider">Home</span>
          </Link>

          <Link 
            to="/admin/products" 
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${
              location.pathname.startsWith('/admin/products') ? 'text-[#B07870] font-bold' : 'text-brand-body/60'
            }`}
          >
            <Package size={18} />
            <span className="text-[8px] mt-1 font-bold uppercase tracking-wider">Catalog</span>
          </Link>

          <Link 
            to="/admin/orders" 
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${
              location.pathname.startsWith('/admin/orders') ? 'text-[#B07870] font-bold' : 'text-brand-body/60'
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[8px] mt-1 font-bold uppercase tracking-wider">Orders</span>
          </Link>

          {/* Toggle More bottom drawer */}
          <button 
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl cursor-pointer ${
              ['/admin/customers', '/admin/reviews', '/admin/categories', '/admin/discounts', '/admin/content', '/admin/analytics'].some(p => location.pathname.startsWith(p))
                ? 'text-[#B07870] font-bold'
                : 'text-brand-body/60'
            }`}
          >
            <Menu size={18} />
            <span className="text-[8px] mt-1 font-bold uppercase tracking-wider">More</span>
          </button>

          <Link 
            to="/admin/settings" 
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition ${
              location.pathname.startsWith('/admin/settings') ? 'text-[#B07870] font-bold' : 'text-brand-body/60'
            }`}
          >
            <SettingsIcon size={18} />
            <span className="text-[8px] mt-1 font-bold uppercase tracking-wider">Settings</span>
          </Link>
        </nav>

        {/* F: Mobile "More" Slide-up Drawer Overlay */}
        {moreDrawerOpen && (
          <>
            <div 
              onClick={() => setMoreDrawerOpen(false)} 
              className="md:hidden fixed inset-0 bg-black/40 z-50 transition-opacity animate-fade-in" 
            />
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FDFBF9] border-t border-brand-border/40 rounded-t-3xl p-6 z-50 space-y-4 select-none animate-slide-in-bottom">
              
              <div className="flex justify-between items-center border-b border-brand-border/20 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-body/55">More Actions</span>
                <button 
                  onClick={() => setMoreDrawerOpen(false)} 
                  className="p-2 hover:bg-brand-cream rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Customers', icon: <Users size={16} />, path: '/admin/customers' },
                  { label: 'Reviews', icon: <Star size={16} />, path: '/admin/reviews' },
                  { label: 'Categories', icon: <Tag size={16} />, path: '/admin/categories' },
                  { label: 'Discounts', icon: <Percent size={16} />, path: '/admin/discounts' },
                  { label: 'Content', icon: <Layout size={16} />, path: '/admin/content' },
                  { label: 'Analytics', icon: <TrendingUp size={16} />, path: '/admin/analytics' },
                ].map(item => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMoreDrawerOpen(false)}
                      className={`h-11 px-4 rounded-xl border border-brand-border/30 flex items-center justify-between transition-colors text-xs font-semibold uppercase tracking-wider text-brand-heading min-h-[44px] ${
                        active ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold border-brand-accent' : 'bg-white hover:bg-brand-cream/45'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={12} className="opacity-50" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
