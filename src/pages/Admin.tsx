import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AdminProductForm from '../components/AdminProductForm';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { products as defaultProducts } from '../data/products';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  X, 
  Truck, 
  User,
  Activity,
  FileText,
  Upload,
  Tag,
  Percent,
  Menu,
  Layout,
  Home as HomeIcon,
  Sparkles,
  BookOpen,
  Phone,
  Megaphone,
  Star
} from 'lucide-react';

interface Order {
  id: string;
  order_id: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  items: any[];
  shipping_address: string;
  customer_name: string;
  customer_phone: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  collection: string;
  image: string;
  images: string[];
  bullet_points: string[];
  care_instructions?: string;
  delivery_info?: string;
  description: string;
  stock: number;
  active: boolean;
}

interface SiteSettings {
  free_delivery_threshold: number;
  shipping_charges: number;
  whatsapp_number: string;
  contact_email: string;
  offer_line: string;
  banner_url?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);
  const toast = useStore((state) => state.toast);
  const hideToast = useStore((state) => state.hideToast);

  // Authentication State
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [bypassAuth] = useState(false); // Disable helper toggle for secure admin check

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  // Page Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'customers' | 'settings' | 'categories' | 'content-manager' | 'content-homepage' | 'content-featured' | 'content-about' | 'content-contact' | 'content-footer' | 'content-announcements' | 'add-product' | 'edit-product' | 'discounts' | 'reviews'>('dashboard');

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loaded database state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    free_delivery_threshold: 999,
    shipping_charges: 99,
    whatsapp_number: '+91-XXXXX-XXXXX',
    contact_email: 'hello@fuzzysoftstudio.com',
    offer_line: '🌸 Mother\'s Day Special: Use code BLOOM20 for 20% off all bouquets! 🌸'
  });


  // Modals & form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered'>('All');
  const [customerFilter, setCustomerFilter] = useState<string | null>(null); // To filter customer specific orders

  // Form Fields - Product Add/Edit
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(10);
  const [prodCategory, setProdCategory] = useState('Bouquets');
  const [prodCollection, setProdCollection] = useState('everyday-luxury');
  const [prodImage, setProdImage] = useState('');
  const [prodImage2, setProdImage2] = useState('');
  const [prodImage3, setProdImage3] = useState('');
  const [prodImage4, setProdImage4] = useState('');
  const [prodBullet1, setProdBullet1] = useState('100% Handcrafted');
  const [prodBullet2, setProdBullet2] = useState('Long-lasting Bloom');
  const [prodBullet3, setProdBullet3] = useState('Customizable Order');
  const [prodBullet4, setProdBullet4] = useState('Allergen & Pet Safe');
  const [prodCareInstructions, setProdCareInstructions] = useState('Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.');
  const [prodDeliveryInfo, setProdDeliveryInfo] = useState('Lucknow: 5–10 business days. Rest of India: 7–14 business days.');
  const [prodDescription, setProdDescription] = useState('');
  const [prodActive, setProdActive] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Discount codes state
  const [discountCodes, setDiscountCodes] = useState<Array<{code: string, percent: number, expiry?: string}>>([]);
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);
  const [newDiscountExpiry, setNewDiscountExpiry] = useState('');
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  // Dashboard chart period
  const [chartPeriod, setChartPeriod] = useState<'today' | '7d' | '14d' | '30d' | 'this_month' | 'last_month' | '90d'>('14d');

  // Orders tab state
  const [orderSearch, setOrderSearch] = useState('');

  // Products tab state
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'newest'>('newest');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [inlineEditStock, setInlineEditStock] = useState<{ id: string; value: string } | null>(null);
  const [inlineEditPrice, setInlineEditPrice] = useState<{ id: string; value: string } | null>(null);

  // Reviews tab state
  const [reviews, setReviews] = useState<Array<{name: string; quote: string; rating: number; location?: string; verified?: boolean}>>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewLocation, setNewReviewLocation] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewQuote, setNewReviewQuote] = useState('');
  const [newReviewVerified, setNewReviewVerified] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Store status (Settings tab)
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeClosedMessage, setStoreClosedMessage] = useState("We'll be back soon! 🌸");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Collection banners editor (Announcements tab)
  const [adminCollectionBanners, setAdminCollectionBanners] = useState([
    { name: 'Bridal Blooms', slug: 'bridal-blooms', image: '' },
    { name: 'Everyday Luxury', slug: 'everyday-luxury', image: '' },
    { name: 'Seasonal Picks', slug: 'seasonal-picks', image: '' },
    { name: 'Gift Bouquets', slug: 'gift-bouquets', image: '' }
  ]);

  const [gardenImages, setGardenImages] = useState<string[]>(Array(6).fill(''));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    showToast('Uploading image to Supabase...', 'success');

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      let fileName = '';
      if (index === 10 || index === 20) {
        fileName = `hero-banner`;
      } else if (index === 11) {
        fileName = `about-block1-image`;
      } else if (index === 12) {
        fileName = `about-block2-image`;
      } else if (index >= 30 && index <= 35) {
        fileName = `garden-image-${index}`;
      } else if (index >= 1 && index <= 4) {
        fileName = `product-image-${index}`;
      } else {
        fileName = `descriptive-image-${index}`;
      }
      const filePath = `products/${fileName}.${fileExt}`;

      // Upload to Supabase Storage bucket 'product-images'
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (index === 1) setProdImage(publicUrl);
      if (index === 2) setProdImage2(publicUrl);
      if (index === 3) setProdImage3(publicUrl);
      if (index === 4) setProdImage4(publicUrl);
      if (index === 10) setSettingsBannerUrl(publicUrl);
      if (index === 11) setContentBlock1Image(publicUrl);
      if (index === 12) setContentBlock2Image(publicUrl);
      if (index === 20) setHeroEditorBannerUrl(publicUrl);
      if (index >= 30 && index <= 35) {
        setGardenImages(prev => {
          const next = [...prev];
          next[index - 30] = publicUrl;
          return next;
        });
      }

      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showToast(`Upload failed: ${err.message}. Make sure a public bucket named 'product-images' exists in Supabase.`, 'error');
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  // Form Fields - Settings
  const [settingsFreeThreshold, setSettingsFreeThreshold] = useState(999);
  const [settingsShippingCharges, setSettingsShippingCharges] = useState(99);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsOfferLine, setSettingsOfferLine] = useState('');
  const [settingsBannerUrl, setSettingsBannerUrl] = useState('');
  const [codAvailable, setCodAvailable] = useState(false);
  const [codCharge, setCodCharge] = useState(0);
  const [expressCharge, setExpressCharge] = useState(0);

  const [categories, setCategories] = useState<string[]>(['Bouquets', 'Arrangements', 'Gift Boxes', 'Dried Flowers']);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form Fields - Page Content (About)
  const [contentHeroTitle, setContentHeroTitle] = useState('Fuzzy Soft Studio');
  const [contentHeroSubtitle, setContentHeroSubtitle] = useState('Founded in 2026 • Handcrafted Luxury Blooms');
  const [contentBlock1Title, setContentBlock1Title] = useState('Poetry in Petals');
  const [contentBlock1Text1, setContentBlock1Text1] = useState('At Fuzzy Soft Studio, we believe that flowers should tell a story that never fades.');
  const [contentBlock1Text2, setContentBlock1Text2] = useState('Every bouquet we create is designed to bring warmth, soft beauty, and a touch of romance into your space.');
  const [contentBlock1Image, setContentBlock1Image] = useState('https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=800&q=80');
  const [contentBlock2Title, setContentBlock2Title] = useState('Handmade With Love');
  const [contentBlock2Text1, setContentBlock2Text1] = useState('Unlike standard arrangements, every petal and stem in Fuzzy Soft Studio is hand-knitted and hand-tied by our expert artisans.');
  const [contentBlock2Text2, setContentBlock2Text2] = useState('By crafting every item to order, we ensure that no two arrangements are exactly alike.');
  const [contentBlock2Image, setContentBlock2Image] = useState('https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&q=80');
  // Note: contact page content is managed via contactTitle/contactIntro/contactWhatsapp/contactEmailEditor/contactLocation/contactHours/contactMapUrl state vars below

  // Form Fields - Homepage Hero Editor
  const [heroEditorBannerUrl, setHeroEditorBannerUrl] = useState('');
  const [heroEditorBadge, setHeroEditorBadge] = useState('');
  const [heroEditorTitle1, setHeroEditorTitle1] = useState('');
  const [heroEditorTitle2, setHeroEditorTitle2] = useState('');
  const [heroEditorTitle3, setHeroEditorTitle3] = useState('');
  const [heroEditorTagline, setHeroEditorTagline] = useState('');
  const [heroEditorCta, setHeroEditorCta] = useState('');

  // Form Fields - Featured Section Editor
  const [featuredSectionTitle, setFeaturedSectionTitle] = useState('');
  const [featuredSectionSubtitle, setFeaturedSectionSubtitle] = useState('');
  const [featuredSectionCount, setFeaturedSectionCount] = useState('4');
  const [featuredSectionVisible, setFeaturedSectionVisible] = useState(true);

  // Form Fields - Contact Editor (extended)
  const [contactTitle, setContactTitle] = useState('');
  const [contactIntro, setContactIntro] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmailEditor, setContactEmailEditor] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [contactHours, setContactHours] = useState('');
  const [contactMapUrl, setContactMapUrl] = useState('');

  // Form Fields - Footer Editor
  const [footerTagline, setFooterTagline] = useState('');
  const [footerAboutText, setFooterAboutText] = useState('');
  const [footerInstagram, setFooterInstagram] = useState('');
  const [footerFacebook, setFooterFacebook] = useState('');
  const [footerPinterest, setFooterPinterest] = useState('');
  const [footerWhatsappUrl, setFooterWhatsappUrl] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');
  const [footerNote, setFooterNote] = useState('');

  // Form Fields - Announcements Editor
  const [offerLineEditor, setOfferLineEditor] = useState('');
  const [marqueeVisibleEditor, setMarqueeVisibleEditor] = useState(true);

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
          .from('product-images')
          .upload(fileName, file, { upsert: true });
          
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        updated.push({
          name: b.name,
          slug: b.slug,
          image: publicUrl
        });
      }
      await supabase.from('settings').upsert(
        { key: 'collection_banners', value: JSON.stringify(updated) },
        { onConflict: 'key' }
      );
      localStorage.setItem('fss_banners_uploaded', 'true');
      showToast('Collection banners auto-uploaded and saved!', 'success');
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
        // Enforce admin validation logic: only angrybird@fuzzysoftstudio.com has admin access
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
        // Redirect to admin login if not logged in
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
    if (session || bypassAuth) {
      loadAllData();
    }
  }, [session, bypassAuth]);

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
      if (error) throw error;
      if (data && data.length > 0) {
        setProducts((data as Product[]) || []);
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
      if (error) throw error;

      const { data: refetched } = await supabase.from('products').select('*');
      if (refetched) {
        setProducts(refetched as Product[]);
      }
    } catch (err: any) {
      console.warn('Auto-seed failed (tables might not exist yet):', err.message);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted = data.map((o: any) => ({
          id: o.id,
          order_id: o.order_id,
          user_id: o.user_id,
          created_at: o.created_at,
          total_amount: o.total_amount,
          status: o.status,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [],
          shipping_address: o.shipping_address || '',
          customer_name: o.customer_name || 'Guest',
          customer_phone: o.customer_phone || ''
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
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const loaded: any = {};
      if (data && data.length > 0) {
        data.forEach((s: any) => {
          loaded[s.key] = s.value;
        });
      }

      const newSettings = {
        free_delivery_threshold: Number(loaded.free_delivery_threshold) || 999,
        shipping_charges: Number(loaded.shipping_charges) || 99,
        whatsapp_number: loaded.whatsapp_number || '+91-XXXXX-XXXXX',
        contact_email: loaded.contact_email || 'hello@fuzzysoftstudio.com',
        offer_line: loaded.offer_line || '🌸 Mother\'s Day Special: Use code BLOOM20 for 20% off all bouquets! 🌸',
        banner_url: loaded.banner_url || ''
      };

      setSettings(newSettings);
      setSettingsFreeThreshold(newSettings.free_delivery_threshold);
      setSettingsShippingCharges(newSettings.shipping_charges);
      setSettingsWhatsapp(newSettings.whatsapp_number);
      setSettingsEmail(newSettings.contact_email);
      setSettingsOfferLine(newSettings.offer_line);
      setSettingsBannerUrl(newSettings.banner_url || '');

      // Load Categories
      if (loaded.store_categories) {
        try {
          const parsed = JSON.parse(loaded.store_categories);
          if (Array.isArray(parsed)) {
            setCategories(parsed);
          } else {
            setCategories(loaded.store_categories.split(',').map((c: string) => c.trim()).filter(Boolean));
          }
        } catch {
          setCategories(loaded.store_categories.split(',').map((c: string) => c.trim()).filter(Boolean));
        }
      }

      // Load Page Content
      setContentHeroTitle(loaded.about_hero_title || 'Fuzzy Soft Studio');
      setContentHeroSubtitle(loaded.about_hero_subtitle || 'Founded in 2026 • Handcrafted Luxury Blooms');
      setContentBlock1Title(loaded.about_block1_title || 'Poetry in Petals');
      setContentBlock1Text1(loaded.about_block1_text1 || 'At Fuzzy Soft Studio, we believe that flowers should tell a story that never fades.');
      setContentBlock1Text2(loaded.about_block1_text2 || 'Every bouquet we create is designed to bring warmth, soft beauty, and a touch of romance into your space.');
      setContentBlock1Image(loaded.about_block1_image || 'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=800&q=80');
      
      setContentBlock2Title(loaded.about_block2_title || 'Handmade With Love');
      setContentBlock2Text1(loaded.about_block2_text1 || 'Unlike standard arrangements, every petal and stem in Fuzzy Soft Studio is hand-knitted and hand-tied by our expert artisans.');
      setContentBlock2Text2(loaded.about_block2_text2 || 'By crafting every item to order, we ensure that no two arrangements are exactly alike.');
      setContentBlock2Image(loaded.about_block2_image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&q=80');
      
      setContactIntro(loaded.contact_intro || 'Have questions about custom crochet orders, shipping timelines, or care tips? Drop us a line and our artisan team will write back to you shortly.');
      setContactWhatsapp(loaded.contact_whatsapp || '+91-XXXXX-XXXXX');
      setContactEmailEditor(loaded.contact_email || 'hello@fuzzysoftstudio.com');
      setContactLocation(loaded.contact_location || 'Kanpur, Uttar Pradesh');

      // Load Homepage Hero Editor
      setHeroEditorBannerUrl(loaded.hero_banner_url || '');
      setHeroEditorBadge(loaded.hero_badge || '');
      setHeroEditorTitle1(loaded.hero_title_1 || '');
      setHeroEditorTitle2(loaded.hero_title_2 || '');
      setHeroEditorTitle3(loaded.hero_title_3 || '');
      setHeroEditorTagline(loaded.hero_tagline || '');
      setHeroEditorCta(loaded.hero_cta_text || '');

      // Load Featured Section Editor
      setFeaturedSectionTitle(loaded.featured_section_title || '');
      setFeaturedSectionSubtitle(loaded.featured_section_subtitle || '');
      setFeaturedSectionCount(loaded.featured_section_count || '4');
      setFeaturedSectionVisible(loaded.featured_section_visible !== 'false');

      // Load Contact Editor (extended)
      setContactTitle(loaded.contact_title || '');
      setContactIntro(loaded.contact_intro || '');
      setContactWhatsapp(loaded.contact_whatsapp || '');
      setContactEmailEditor(loaded.contact_email || '');
      setContactLocation(loaded.contact_location || '');
      setContactHours(loaded.contact_hours || '');
      setContactMapUrl(loaded.contact_map_url || '');

      // Load Footer Editor
      setFooterTagline(loaded.footer_tagline || '');
      setFooterAboutText(loaded.footer_about_text || '');
      setFooterInstagram(loaded.footer_instagram || '');
      setFooterFacebook(loaded.footer_facebook || '');
      setFooterPinterest(loaded.footer_pinterest || '');
      setFooterWhatsappUrl(loaded.footer_whatsapp_url || '');
      setFooterCopyright(loaded.footer_copyright || '');
      setFooterNote(loaded.footer_note || '');

      // Load Announcements Editor
      setOfferLineEditor(loaded.offer_line || '');
      setMarqueeVisibleEditor(loaded.marquee_visible !== 'false');

      // Load Discount Codes
      const dcRow = data && data.find((s: any) => s.key === 'discount_codes');
      if (dcRow) {
        try { setDiscountCodes(JSON.parse(dcRow.value)); } catch {}
      }
      // Load store status
      if (loaded.store_open !== undefined) setStoreOpen(loaded.store_open !== 'false');
      if (loaded.store_closed_message) setStoreClosedMessage(loaded.store_closed_message);
      if (loaded.low_stock_threshold) setLowStockThreshold(Number(loaded.low_stock_threshold) || 5);

      if (loaded.cod_available) setCodAvailable(loaded.cod_available === 'true');
      if (loaded.cod_charge) setCodCharge(Number(loaded.cod_charge));
      if (loaded.express_charge) setExpressCharge(Number(loaded.express_charge));

      if (loaded.collection_banners) {
        try {
          setAdminCollectionBanners(JSON.parse(loaded.collection_banners));
        } catch {}
      }

      // Load Garden Images
      if (loaded.garden_images) {
        try {
          const parsed = JSON.parse(loaded.garden_images);
          if (Array.isArray(parsed)) {
            const padded = [...parsed, ...Array(6).fill('')].slice(0, 6);
            setGardenImages(padded);
          } else {
            setGardenImages(Array(6).fill(''));
          }
        } catch {
          setGardenImages(Array(6).fill(''));
        }
      } else {
        setGardenImages(Array(6).fill(''));
      }

      // Load Reviews
      const rvRow = data && data.find((s: any) => s.key === 'homepage_testimonials');
      if (rvRow) { try { setReviews(JSON.parse(rvRow.value)); } catch {} }
    } catch (e: any) {
      console.warn('Error loading settings from Supabase, applying initial defaults:', e.message);
      setSettingsFreeThreshold(settings.free_delivery_threshold);
      setSettingsShippingCharges(settings.shipping_charges);
      setSettingsWhatsapp(settings.whatsapp_number);
      setSettingsEmail(settings.contact_email);
      setSettingsOfferLine(settings.offer_line);
      setSettingsBannerUrl(settings.banner_url || '');
    }
  };

  // Save handlers for Content Manager editors
  const handleSaveHomepageHero = async () => {
    try {
      const updateData = [
        { key: 'hero_banner_url', value: heroEditorBannerUrl },
        { key: 'hero_badge', value: heroEditorBadge },
        { key: 'hero_title_1', value: heroEditorTitle1 },
        { key: 'hero_title_2', value: heroEditorTitle2 },
        { key: 'hero_title_3', value: heroEditorTitle3 },
        { key: 'hero_tagline', value: heroEditorTagline },
        { key: 'hero_cta_text', value: heroEditorCta },
      ];
      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;
      showToast('Homepage Hero saved!', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleSaveFeatured = async () => {
    try {
      const updateData = [
        { key: 'featured_section_title', value: featuredSectionTitle },
        { key: 'featured_section_subtitle', value: featuredSectionSubtitle },
        { key: 'featured_section_count', value: featuredSectionCount },
        { key: 'featured_section_visible', value: featuredSectionVisible ? 'true' : 'false' },
      ];
      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;
      showToast('Featured section saved!', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleSaveAbout = async () => {
    try {
      const updateData = [
        { key: 'about_hero_title', value: contentHeroTitle },
        { key: 'about_hero_subtitle', value: contentHeroSubtitle },
        { key: 'about_block1_title', value: contentBlock1Title },
        { key: 'about_block1_text1', value: contentBlock1Text1 },
        { key: 'about_block1_text2', value: contentBlock1Text2 },
        { key: 'about_block1_image', value: contentBlock1Image },
        { key: 'about_block2_title', value: contentBlock2Title },
        { key: 'about_block2_text1', value: contentBlock2Text1 },
        { key: 'about_block2_text2', value: contentBlock2Text2 },
        { key: 'about_block2_image', value: contentBlock2Image },
      ];
      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;
      showToast('About page saved!', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleSaveContact = async () => {
    try {
      const updateData = [
        { key: 'contact_title', value: contactTitle },
        { key: 'contact_intro', value: contactIntro },
        { key: 'contact_whatsapp', value: contactWhatsapp },
        { key: 'contact_email', value: contactEmailEditor },
        { key: 'contact_location', value: contactLocation },
        { key: 'contact_hours', value: contactHours },
        { key: 'contact_map_url', value: contactMapUrl },
      ];
      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;
      showToast('Contact page saved!', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleSaveFooter = async () => {
    try {
      const updateData = [
        { key: 'footer_tagline', value: footerTagline },
        { key: 'footer_about_text', value: footerAboutText },
        { key: 'footer_instagram', value: footerInstagram },
        { key: 'footer_facebook', value: footerFacebook },
        { key: 'footer_pinterest', value: footerPinterest },
        { key: 'footer_whatsapp_url', value: footerWhatsappUrl },
        { key: 'footer_copyright', value: footerCopyright },
        { key: 'footer_note', value: footerNote },
      ];
      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;
      showToast('Footer settings saved!', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleSaveAnnouncements = async () => {
    try {
      const updateData = [
        { key: 'offer_line', value: offerLineEditor },
        { key: 'marquee_visible', value: marqueeVisibleEditor ? 'true' : 'false' },
        { key: 'collection_banners', value: JSON.stringify(adminCollectionBanners) },
        { key: 'garden_images', value: JSON.stringify(gardenImages) }
      ];
      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;
      showToast('Announcements saved!', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  // Aggregated calculations for dashboard stats
  const dashboardStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    
    // Unique customer count
    const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
    
    // Low stock count (stock <= lowStockThreshold)
    const lowStockCount = products.filter(p => p.stock <= lowStockThreshold).length;

    return {
      totalOrders,
      totalRevenue,
      totalCustomers: uniqueCustomers,
      lowStockProducts: lowStockCount
    };
  }, [orders, products, lowStockThreshold]);

  // Customers report grid data compilation
  const customersList = useMemo(() => {
    const registry: { [email: string]: { name: string; email: string; ordersCount: number; spentTotal: number } } = {};
    
    orders.forEach(o => {
      const emailKey = o.shipping_address.includes('@') ? o.shipping_address : o.customer_name; // Fallback unique key
      if (!registry[emailKey]) {
        registry[emailKey] = {
          name: o.customer_name,
          email: emailKey.includes('@') ? emailKey : 'N/A',
          ordersCount: 0,
          spentTotal: 0
        };
      }
      registry[emailKey].ordersCount += 1;
      registry[emailKey].spentTotal += o.total_amount;
    });

    return Object.values(registry);
  }, [orders]);

  // Chart data and period stats for revenue bar chart — period-aware
  const chartDataAndStats = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    let dates: string[] = [];
    if (chartPeriod === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      dates = [todayStr];
    } else if (chartPeriod === '7d') {
      dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
    } else if (chartPeriod === '14d') {
      dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split('T')[0];
      });
    } else if (chartPeriod === 'this_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstDay = new Date(y, m, 1);
      const diffTime = Math.abs(now.getTime() - firstDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dates = Array.from({ length: diffDays }, (_, i) => {
        const d = new Date(y, m, 1 + i);
        return d.toISOString().split('T')[0];
      });
    } else if (chartPeriod === 'last_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const lastDayOfLastMonth = new Date(y, m, 0);
      const numDays = lastDayOfLastMonth.getDate();
      dates = Array.from({ length: numDays }, (_, i) => {
        const d = new Date(y, m - 1, 1 + i);
        return d.toISOString().split('T')[0];
      });
    } else { // 90d
      dates = Array.from({ length: 90 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (89 - i));
        return d.toISOString().split('T')[0];
      });
    }

    const data = dates.map(date => {
      const dayOrders = orders.filter(o => o.created_at?.startsWith(date));
      const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      return {
        fullDate: date,
        date: date.slice(5), // MM-DD
        revenue,
        ordersCount: dayOrders.length
      };
    });

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.ordersCount, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      chartData: data,
      stats: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      }
    };
  }, [orders, chartPeriod]);

  // Reviews handlers
  const handleAddReview = async () => {
    if (!newReviewName.trim() || !newReviewQuote.trim()) return showToast('Name and quote required', 'error');
    const newR = { name: newReviewName.trim(), quote: newReviewQuote.trim(), rating: newReviewRating, location: newReviewLocation.trim() || undefined, verified: newReviewVerified };
    const updated = [...reviews, newR];
    setLoadingReviews(true);
    try {
      await supabase.from('settings').upsert({ key: 'homepage_testimonials', value: JSON.stringify(updated) }, { onConflict: 'key' });
      setReviews(updated);
      setNewReviewName(''); setNewReviewLocation(''); setNewReviewRating(5); setNewReviewQuote(''); setNewReviewVerified(false);
      showToast('Review added!', 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
    finally { setLoadingReviews(false); }
  };

  const handleDeleteReview = async (idx: number) => {
    const updated = reviews.filter((_, i) => i !== idx);
    try {
      await supabase.from('settings').upsert({ key: 'homepage_testimonials', value: JSON.stringify(updated) }, { onConflict: 'key' });
      setReviews(updated);
      showToast('Review deleted', 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
  };


  // Store status save
  const handleSaveStoreStatus = async () => {
    try {
      await supabase.from('settings').upsert([
        { key: 'store_open', value: storeOpen ? 'true' : 'false' },
        { key: 'store_closed_message', value: storeClosedMessage },
        { key: 'low_stock_threshold', value: String(lowStockThreshold) },
      ], { onConflict: 'key' });
      showToast('Store settings saved!', 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  // Products bulk actions
  const handleBulkActivate = async () => {
    try {
      for (const id of selectedProducts) { await supabase.from('products').update({ active: true }).eq('id', id); }
      setProducts(products.map(p => selectedProducts.includes(p.id) ? { ...p, active: true } : p));
      setSelectedProducts([]);
      showToast(`Activated ${selectedProducts.length} products`, 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleBulkDeactivate = async () => {
    try {
      for (const id of selectedProducts) { await supabase.from('products').update({ active: false }).eq('id', id); }
      setProducts(products.map(p => selectedProducts.includes(p.id) ? { ...p, active: false } : p));
      setSelectedProducts([]);
      showToast(`Deactivated ${selectedProducts.length} products`, 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProducts.length} products? This cannot be undone.`)) return;
    try {
      for (const id of selectedProducts) { await supabase.from('products').delete().eq('id', id); }
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      showToast(`Deleted ${selectedProducts.length} products`, 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  // Inline price edit save
  const handleSaveInlinePrice = async (product: Product, val: string) => {
    const newPrice = parseFloat(val);
    if (isNaN(newPrice) || newPrice <= 0) { setInlineEditPrice(null); return; }
    try {
      await supabase.from('products').update({ price: newPrice }).eq('id', product.id);
      setProducts(products.map(p => p.id === product.id ? { ...p, price: newPrice } : p));
      showToast(`Price updated to ₹${newPrice}`, 'success');
    } catch (err: any) { showToast(`Failed: ${err.message}`, 'error'); }
    setInlineEditPrice(null);
  };

  // Orders CSV export
  const handleExportOrdersCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Date'];
    const rows = filteredOrders.map(o => [
      o.order_id, o.customer_name, o.customer_phone,
      Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} x${i.quantity}`).join('; ') : '',
      o.total_amount, o.status,
      new Date(o.created_at).toLocaleDateString('en-IN')
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Discount handlers

  const handleCreateDiscount = async () => {
    if (!newDiscountCode.trim()) return showToast('Enter a discount code', 'error');
    if (newDiscountPercent < 1 || newDiscountPercent > 100) return showToast('Percent must be 1-100', 'error');
    const exists = discountCodes.some(d => d.code.toLowerCase() === newDiscountCode.toLowerCase());
    if (exists) return showToast('Code already exists', 'error');
    const updated = [...discountCodes, { code: newDiscountCode, percent: newDiscountPercent, expiry: newDiscountExpiry || undefined }];
    setLoadingDiscounts(true);
    try {
      await supabase.from('settings').upsert({ key: 'discount_codes', value: JSON.stringify(updated) }, { onConflict: 'key' });
      setDiscountCodes(updated);
      setNewDiscountCode('');
      setNewDiscountPercent(10);
      setNewDiscountExpiry('');
      showToast('Discount code created!', 'success');
    } catch (err: any) {
      showToast(`Failed to create discount code: ${err.message}`, 'error');
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleDeleteDiscount = async (code: string) => {
    if (!window.confirm(`Delete discount code ${code}?`)) return;
    const updated = discountCodes.filter(d => d.code !== code);
    try {
      await supabase.from('settings').upsert({ key: 'discount_codes', value: JSON.stringify(updated) }, { onConflict: 'key' });
      setDiscountCodes(updated);
      showToast('Discount code deleted', 'success');
    } catch (err: any) {
      showToast(`Failed to delete discount code: ${err.message}`, 'error');
    }
  };

  // Products CRUD handlers
  const openAddModal = () => {
    setProdName('');
    setProdPrice(0);
    setProdStock(10);
    setProdCategory(categories[0] || 'Bouquets');
    setProdCollection('everyday-luxury');
    setProdImage('');
    setProdImage2('');
    setProdImage3('');
    setProdImage4('');
    setProdBullet1('100% Handcrafted');
    setProdBullet2('Long-lasting Bloom');
    setProdBullet3('Customizable Order');
    setProdBullet4('Allergen & Pet Safe');
    setProdCareInstructions('Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.');
    setProdDeliveryInfo('Lucknow: 5–10 business days. Rest of India: 7–14 business days.');
    setProdDescription('');
    setProdActive(true);
    setActiveTab('add-product');
  };

  const handleAddProduct = async (productData: any) => {
    if (!productData.name || productData.price <= 0 || !productData.image) {
      showToast('Please enter all required product details.', 'error');
      return;
    }

    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      slug,
      ...productData,
      description: productData.description || 'Hand-knitted custom arrangement.',
    };

    // Save to Supabase
    try {
      const { error } = await supabase.from('products').insert(newProduct);
      if (error) throw error;
      
      const updated = [newProduct, ...products];
      setProducts(updated);
      setActiveTab('products');
      showToast('Product added successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to add product: ${err.message}`, 'error');
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdCategory(p.category);
    setProdCollection(p.collection);
    setProdImage(p.image);
    setProdImage2(p.images && p.images[1] ? p.images[1] : '');
    setProdImage3(p.images && p.images[2] ? p.images[2] : '');
    setProdImage4(p.images && p.images[3] ? p.images[3] : '');
    setProdBullet1(p.bullet_points && p.bullet_points[0] ? p.bullet_points[0] : '100% Handcrafted');
    setProdBullet2(p.bullet_points && p.bullet_points[1] ? p.bullet_points[1] : 'Long-lasting Bloom');
    setProdBullet3(p.bullet_points && p.bullet_points[2] ? p.bullet_points[2] : 'Customizable Order');
    setProdBullet4(p.bullet_points && p.bullet_points[3] ? p.bullet_points[3] : 'Allergen & Pet Safe');
    setProdCareInstructions(p.care_instructions || 'Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.');
    setProdDeliveryInfo(p.delivery_info || 'Lucknow: 5–10 business days. Rest of India: 7–14 business days.');
    setProdDescription(p.description);
    setProdActive(p.active);
    setActiveTab('edit-product');
  };

  const handleEditProduct = async (productData: any) => {
    if (!editingProduct) return;

    const updatedProduct: Product = {
      ...editingProduct,
      ...productData,
    };

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', editingProduct.id);
      if (error) throw error;

      // Update local cache
      const updatedList = products.map(p => p.id === editingProduct.id ? updatedProduct : p);
      setProducts(updatedList);
      setActiveTab('products');
      setEditingProduct(null);
      showToast('Product details updated!', 'success');
    } catch (err: any) {
      showToast(`Failed to update product: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    // Delete from Supabase
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      const updatedList = products.filter(p => p.id !== id);
      setProducts(updatedList);
      showToast('Product deleted.', 'success');
    } catch (err: any) {
      showToast(`Failed to delete product: ${err.message}`, 'error');
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    const updated = { ...product, active: !product.active };

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: updated.active })
        .eq('id', product.id);
      if (error) throw error;

      const list = products.map(p => p.id === product.id ? updated : p);
      setProducts(list);
      showToast(`Product visibility ${updated.active ? 'enabled' : 'disabled'}.`, 'success');
    } catch (err: any) {
      showToast(`Failed to update visibility status: ${err.message}`, 'error');
    }
  };

  const handleUpdateProductStock = async (product: Product, newStock: number) => {
    const updated = { ...product, stock: Math.max(0, newStock) };

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: updated.stock })
        .eq('id', product.id);
      if (error) throw error;

      const list = products.map(p => p.id === product.id ? updated : p);
      setProducts(list);
      showToast(`Stock updated to ${updated.stock} items.`, 'success');
    } catch (err: any) {
      showToast(`Failed to update stock: ${err.message}`, 'error');
    }
  };

  // Orders CRUD handlers
  const handleUpdateOrderStatus = async (orderId: string, status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered') => {
    // Update in Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_id', orderId);
      if (error) throw error;

      // Update locally in orders state
      const list = orders.map(o => o.order_id === orderId ? { ...o, status } : o);
      setOrders(list);

      if (viewingOrder && viewingOrder.order_id === orderId) {
         setViewingOrder({ ...viewingOrder, status });
      }

      showToast(`Order status updated to ${status}.`, 'success');
    } catch (err: any) {
      showToast(`Failed to update order status: ${err.message}`, 'error');
    }
  };

  // Settings update handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const newSettings: SiteSettings = {
      free_delivery_threshold: settingsFreeThreshold,
      shipping_charges: settingsShippingCharges,
      whatsapp_number: settingsWhatsapp,
      contact_email: settingsEmail,
      offer_line: settingsOfferLine,
      banner_url: settingsBannerUrl
    };

    // Save to Supabase settings key-value pair
    try {
      const updateData = [
        ...Object.entries(newSettings).map(([key, value]) => ({
          key,
          value: value ? value.toString() : ''
        })),
        { key: 'cod_available', value: String(codAvailable) },
        { key: 'cod_charge', value: String(codCharge) },
        { key: 'express_charge', value: String(expressCharge) }
      ];

      const { error } = await supabase.from('settings').upsert(updateData, { onConflict: 'key' });
      if (error) throw error;

      setSettings(newSettings);
      showToast('Store settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to save settings: ${err.message}`, 'error');
    }
  };

  const handleImportDefaultCatalog = async () => {
    if (products.length > 0) {
      if (!confirm('This will import any default arrangements that do not already exist. Do you want to continue?')) return;
    }
    
    showToast('Importing default catalog...', 'success');
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
      if (error) throw error;

      await loadProducts();
      showToast('Default catalog imported successfully!', 'success');
    } catch (err: any) {
      showToast(`Import failed: ${err.message}. Make sure you ran the SQL setup script to create the public.products table.`, 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('Category already exists!', 'error');
      return;
    }
    const updated = [...categories, trimmed];
    await saveCategoriesToDB(updated);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (!confirm(`Are you sure you want to delete category "${catToDelete}"?`)) return;
    const updated = categories.filter(c => c !== catToDelete);
    await saveCategoriesToDB(updated);
  };

  const saveCategoriesToDB = async (updatedCats: string[]) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'store_categories', value: JSON.stringify(updatedCats) }, { onConflict: 'key' });
      if (error) throw error;
      setCategories(updatedCats);
      showToast('Categories updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to save categories: ${err.message}`, 'error');
    }
  };

  // Filtered orders list mapping
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderFilter !== 'All') result = result.filter(o => o.status === orderFilter);
    if (customerFilter) result = result.filter(o => o.customer_name === customerFilter);
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      result = result.filter(o =>
        o.order_id?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q)
      );
    }
    return result;
  }, [orders, orderFilter, customerFilter, orderSearch]);

  // Filtered + sorted products for admin table
  const filteredAdminProducts = useMemo(() => {
    let result = [...products];
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    switch (productSort) {
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'stock-asc': result.sort((a, b) => a.stock - b.stock); break;
      default: break;
    }
    return result;
  }, [products, productSearch, productSort]);

  const handleSignOut = async () => {
    localStorage.removeItem('fss-admin-demo-bypass');
    await supabase.auth.signOut();
    showToast('Logged out.', 'success');
    navigate('/admin/login');
  };

  // Renders a Lock/Login Guard screen if not logged in and not bypassed
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Access Denied screen for normal logged-in users trying to access admin
  if (isDenied) {
    return (
      <div className="min-h-screen bg-[#F5EDE6] flex items-center justify-center px-6 py-20 select-none animate-fade-in-up">
        <div className="max-w-md w-full bg-white/60 border border-brand-border/45 rounded-3xl p-8 shadow-xs backdrop-blur-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
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
            {/* Return to Account page */}
            <button
              onClick={() => navigate('/account')}
              className="w-full h-11 bg-white hover:bg-brand-cream text-brand-heading border border-brand-border rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to My Account</span>
            </button>

            {/* Switch Accounts / Log out */}
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

  return (
    <div className="h-screen w-screen bg-[#FDFBF9] flex overflow-hidden">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center bg-white border border-brand-border rounded-full shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 md:hidden" />
      )}

      {/* 1. Left Sidebar Section */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 h-full border-r border-brand-border/40 bg-[#F5EDE6] md:bg-[#F5EDE6]/60 flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="p-6 space-y-8">
          {/* Admin title */}
          <div>
            <span className="font-script text-3.5xl text-brand-heading block leading-none">Admin</span>
            <span className="text-[9px] tracking-[0.25em] font-sans font-bold text-brand-heading/70 uppercase">Fuzzy Soft Studio</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold tracking-wider uppercase font-sans text-brand-body/80">
            <button
              onClick={() => { setActiveTab('dashboard'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <LayoutDashboard size={16} strokeWidth={1.8} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('products'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'products' || activeTab === 'add-product' || activeTab === 'edit-product' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <Package size={16} strokeWidth={1.8} />
              <span>Products</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
              <span>Orders</span>
            </button>

            <button
              onClick={() => { setActiveTab('customers'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'customers' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <Users size={16} strokeWidth={1.8} />
              <span>Customers</span>
            </button>

            <button
              onClick={() => { setActiveTab('reviews'); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <Star size={16} strokeWidth={1.8} />
              <span>Reviews</span>
            </button>

            <button
              onClick={() => { setActiveTab('categories'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'categories' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <Tag size={16} strokeWidth={1.8} />
              <span>Categories</span>
            </button>

            <button
              onClick={() => { setActiveTab('discounts'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'discounts' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <Percent size={16} strokeWidth={1.8} />
              <span>Discounts</span>
            </button>

            <button
              onClick={() => { setActiveTab('content-manager'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab.startsWith('content-') ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <Layout size={16} strokeWidth={1.8} />
              <span>Content Manager</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setCustomerFilter(null); setSidebarOpen(false); }}
              className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-[#DCA29A]/15 text-[#B07870] font-bold' : 'hover:bg-brand-cream/60'
              }`}
            >
              <SettingsIcon size={16} strokeWidth={1.8} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Admin Sidebar Footer */}
        <div className="p-6 border-t border-brand-border/25 bg-brand-cream/15 text-center">
          <Link
            to="/"
            className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#B07870] hover:text-[#DCA29A] transition-colors"
          >
            &larr; Visit Website
          </Link>
        </div>
      </aside>

      {/* Main Administrative viewport */}
      <main className="flex-grow h-full p-4 md:p-8 overflow-y-auto space-y-6 md:space-y-8 bg-[#FDFBF9]">
        
        {/* Top Bar showing admin name and logout option */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none pb-6 border-b border-brand-border/30 pl-12 md:pl-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-serif text-3xl text-brand-heading capitalize">
                {activeTab === 'add-product' ? 'Add Arrangement' : activeTab === 'edit-product' ? 'Edit Arrangement' : activeTab === 'content-homepage' ? 'Homepage Hero Editor' : activeTab === 'content-featured' ? 'Featured Section Editor' : activeTab === 'content-about' ? 'Our Story Editor' : activeTab === 'content-contact' ? 'Contact Editor' : activeTab === 'content-footer' ? 'Footer Editor' : activeTab === 'content-announcements' ? 'Announcements Editor' : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h2>
              <p className="text-[10px] text-brand-body/60 uppercase tracking-widest font-sans font-semibold mt-1">
                FSS Management Terminal
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-3 bg-brand-cream/35 border border-brand-border/30 rounded-2xl px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center shrink-0">
                <User size={15} />
              </div>
              <div className="min-w-0 select-text text-left">
                <span className="block text-[9px] text-brand-body/50 uppercase tracking-widest leading-none font-bold">
                  {isAdmin ? 'Verified Admin' : 'Demo Admin'}
                </span>
                <span className="block text-xs font-semibold text-brand-heading max-w-[140px] truncate">
                  {session?.user?.email || 'demo@fuzzysoftstudio.com'}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-brand-border/40 mx-1"></div>
              <button
                onClick={handleSignOut}
                className="text-brand-body/60 hover:text-red-500 transition cursor-pointer p-1"
                title="Log Out"
              >
                <LogOut size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Dashboard Section */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat 1: Revenue */}
              <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold">Total Revenue</span>
                  <div className="text-2xl font-bold text-brand-heading font-sans">
                    ₹{dashboardStats.totalRevenue.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Activity size={18} />
                </div>
              </div>

              {/* Stat 2: Orders */}
              <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold">Total Orders</span>
                  <div className="text-2xl font-bold text-brand-heading font-sans">
                    {dashboardStats.totalOrders}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
              </div>

              {/* Stat 3: Customers */}
              <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold">Total Customers</span>
                  <div className="text-2xl font-bold text-brand-heading font-sans">
                    {dashboardStats.totalCustomers}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>

              {/* Stat 4: Low Stock Alert */}
              <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold">Low Stock Alert</span>
                  <div className={`text-2xl font-bold font-sans ${dashboardStats.lowStockProducts > 0 ? 'text-amber-600' : 'text-brand-heading'}`}>
                    {dashboardStats.lowStockProducts}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dashboardStats.lowStockProducts > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-brand-cream text-brand-body/60'}`}>
                  <AlertTriangle size={18} />
                </div>
              </div>

              {/* Stat 5: Pending Orders */}
              <div className="bg-white/60 border border-orange-200/60 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-orange-600 uppercase tracking-widest font-sans font-semibold">Pending</span>
                  <div className="text-2xl font-bold text-orange-700 font-sans">
                    {orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                  <Truck size={18} />
                </div>
              </div>

            </div>

            {/* Revenue Bar Chart — Period-aware */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-serif text-lg font-bold text-brand-heading select-none">Revenue Overview</h3>
                {/* Period selector pills */}
                <div className="flex flex-wrap gap-1.5">
                  {(['today', '7d', '14d', 'this_month', 'last_month', '90d'] as const).map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition cursor-pointer ${
                        chartPeriod === p ? 'bg-brand-accent text-white border-brand-accent' : 'border-brand-border/40 text-brand-body/65 hover:bg-brand-cream'
                      }`}>
                      {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : p === 'this_month' ? 'This Month' : p === 'last_month' ? 'Last Month' : '90 Days'}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartDataAndStats.chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => '₹' + v.toLocaleString('en-IN')} />
                  <Tooltip formatter={(value: any) => ['\u20b9' + Number(value).toLocaleString('en-IN'), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#DCA29A" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Period summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Orders', value: String(chartDataAndStats.stats.totalOrders) },
                  { label: 'Total Revenue', value: '₹' + chartDataAndStats.stats.totalRevenue.toLocaleString('en-IN') },
                  { label: 'Average Order Value', value: '₹' + chartDataAndStats.stats.averageOrderValue.toLocaleString('en-IN') },
                ].map(stat => (
                  <div key={stat.label} className="bg-brand-cream/60 rounded-xl p-3 text-center">
                    <div className="text-base font-bold text-brand-heading font-sans">{stat.value}</div>
                    <div className="text-[10px] text-brand-body/60 uppercase tracking-wider mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Alert Panel */}
            {products.filter(p => p.stock <= lowStockThreshold).length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5 shadow-xs">
                <h3 className="font-serif text-base font-bold text-amber-800 mb-3">⚠️ Low Stock Alert</h3>
                <div className="space-y-2">
                  {products.filter(p => p.stock <= lowStockThreshold).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs font-sans">
                      <span className="text-brand-heading font-medium truncate max-w-[60%]">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${p.stock <= 2 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock} left</span>
                        <button onClick={() => handleUpdateProductStock(p, p.stock + 10)}
                          className="px-2 py-0.5 bg-amber-600 text-white rounded-full text-[10px] font-semibold cursor-pointer hover:bg-amber-700 transition">+10</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading select-none">Quick Actions</h3>
              <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider select-none font-sans">
                <button
                  onClick={openAddModal}
                  className="px-5 h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition"
                >
                  <Plus size={14} />
                  <span>Add New Product</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-5 h-10 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full flex items-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <ShoppingBag size={14} />
                  <span>Manage Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-5 h-10 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full flex items-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <SettingsIcon size={14} />
                  <span>Shop Settings</span>
                </button>
              </div>
            </div>

            {/* Recent Orders log (last 8 orders) */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-heading select-none">Recent Orders</h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                      <th className="pb-3 pr-2">Order ID</th>
                      <th className="pb-3 px-2">Customer</th>
                      <th className="pb-3 px-2">Items</th>
                      <th className="pb-3 px-2 text-right">Amount</th>
                      <th className="pb-3 px-2 text-center">Status</th>
                      <th className="pb-3 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-brand-cream/35 transition-colors">
                        <td className="py-3 pr-2 font-semibold text-brand-heading font-mono">{order.order_id}</td>
                        <td className="py-3 px-2 font-medium text-brand-heading">{order.customer_name}</td>
                        <td className="py-3 px-2 max-w-[180px] truncate">
                          {order.items.map(i => i.name).join(', ')}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-brand-heading">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
                            order.status === 'Delivered' 
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'Processing'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-right select-none">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="text-brand-accent hover:text-brand-accent-hover font-semibold tracking-wide cursor-pointer text-[10px] uppercase transition p-1"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Products Section */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 h-9 px-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent" />
              <select value={productSort} onChange={e => setProductSort(e.target.value as any)}
                className="h-9 px-3 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="name-asc">Name A→Z</option>
                <option value="name-desc">Name Z→A</option>
                <option value="price-asc">Price Low→High</option>
                <option value="price-desc">Price High→Low</option>
                <option value="stock-asc">Stock Low→High</option>
              </select>
            </div>

            {/* Bulk Action Bar */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-accent/10 border border-brand-accent/30 rounded-xl text-xs font-sans">
                <span className="font-semibold text-brand-heading">{selectedProducts.length} selected</span>
                <button onClick={handleBulkActivate} className="px-3 py-1 bg-green-600 text-white rounded-full font-semibold cursor-pointer hover:bg-green-700 transition">Activate</button>
                <button onClick={handleBulkDeactivate} className="px-3 py-1 bg-gray-500 text-white rounded-full font-semibold cursor-pointer hover:bg-gray-600 transition">Deactivate</button>
                <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-500 text-white rounded-full font-semibold cursor-pointer hover:bg-red-600 transition">Delete</button>
                <button onClick={() => setSelectedProducts([])} className="text-brand-accent underline cursor-pointer">Clear</button>
              </div>
            )}

            {/* Products controls toolbar */}
            <div className="flex justify-between items-center select-none">
              <span className="text-xs text-brand-body/65 font-sans font-semibold">
                Showing {filteredAdminProducts.length} of {products.length} arrangements
              </span>
              <div className="flex gap-3">
                {products.length === 0 && (
                  <button
                    onClick={handleImportDefaultCatalog}
                    className="px-4 h-10 border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white rounded-full flex items-center gap-2 cursor-pointer shadow-xs text-xs font-semibold uppercase tracking-wider transition active:scale-95"
                  >
                    <span>Import Default Catalog</span>
                  </button>
                )}
                <button
                  onClick={openAddModal}
                  className="px-5 h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full flex items-center gap-2 cursor-pointer shadow-xs text-xs font-semibold uppercase tracking-wider transition active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Arrangement</span>
                </button>
              </div>
            </div>

            {products.length === 0 && (
              <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 text-center space-y-4 shadow-xs backdrop-blur-xs select-none">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="font-serif text-lg text-brand-heading">Your Database Catalog is Empty</h4>
                <p className="text-xs text-brand-body/80 max-w-md mx-auto leading-relaxed">
                  It seems there are no arrangements stored in your Supabase database. You can quickly seed your store with the default Arrangements from the storefront.
                </p>
                <button
                  onClick={handleImportDefaultCatalog}
                  className="px-6 h-10 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer shadow-sm transition active:scale-95 inline-flex items-center gap-1.5"
                >
                  <span>Import Default Catalog</span>
                </button>
              </div>
            )}

            {/* Products grid / table */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                      <th className="pb-3 pr-2 w-8">
                        <input type="checkbox" className="cursor-pointer accent-brand-accent"
                          checked={selectedProducts.length === filteredAdminProducts.length && filteredAdminProducts.length > 0}
                          onChange={e => setSelectedProducts(e.target.checked ? filteredAdminProducts.map(p => p.id) : [])}
                        />
                      </th>
                      <th className="pb-3 pr-2">Arrangement</th>
                      <th className="pb-3 px-2">Category</th>
                      <th className="pb-3 px-2 text-right">Price</th>
                      <th className="pb-3 px-3 text-center">Stock</th>
                      <th className="pb-3 px-2 text-center">Status</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                    {filteredAdminProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-brand-cream/35 transition-colors">
                        <td className="py-4 pr-2">
                          <input type="checkbox" className="cursor-pointer accent-brand-accent"
                            checked={selectedProducts.includes(p.id)}
                            onChange={e => setSelectedProducts(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                          />
                        </td>
                        <td className="py-4 pr-2 flex items-center gap-3">
                          <div className="w-9 h-12 rounded-lg bg-brand-cream overflow-hidden border border-brand-border/30 shrink-0 select-none">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-serif text-sm font-bold text-brand-heading">{p.name}</div>
                            <div className="text-[10px] text-brand-body/50 font-mono tracking-tight mt-0.5">{p.slug}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-brand-body/80">{p.category}</td>
                        <td className="py-4 px-2 text-right font-semibold text-brand-heading">
                          {inlineEditPrice?.id === p.id ? (
                            <input type="number" autoFocus value={inlineEditPrice.value}
                              onChange={e => setInlineEditPrice({ id: p.id, value: e.target.value })}
                              onBlur={() => handleSaveInlinePrice(p, inlineEditPrice.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveInlinePrice(p, inlineEditPrice.value); if (e.key === 'Escape') setInlineEditPrice(null); }}
                              className="w-20 px-2 py-1 border border-brand-accent rounded text-xs font-sans focus:outline-none text-right" />
                          ) : (
                            <span className="cursor-pointer hover:text-brand-accent transition group flex items-center justify-end gap-1"
                              onClick={() => setInlineEditPrice({ id: p.id, value: String(p.price) })} title="Click to edit price">
                              ₹{p.price.toLocaleString('en-IN')}
                              <Edit2 size={9} className="opacity-0 group-hover:opacity-50" />
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center select-none">
                          {inlineEditStock?.id === p.id ? (
                            <input type="number" autoFocus value={inlineEditStock.value}
                              onChange={e => setInlineEditStock({ id: p.id, value: e.target.value })}
                              onBlur={() => { const v = parseInt(inlineEditStock.value); if (!isNaN(v) && v >= 0) handleUpdateProductStock(p, v); setInlineEditStock(null); }}
                              onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(inlineEditStock.value); if (!isNaN(v) && v >= 0) handleUpdateProductStock(p, v); setInlineEditStock(null); } if (e.key === 'Escape') setInlineEditStock(null); }}
                              className="w-16 px-2 py-1 border border-brand-accent rounded text-xs font-sans focus:outline-none text-center" />
                          ) : (
                            <span className={`cursor-pointer hover:text-brand-accent transition group flex items-center justify-center gap-1 font-semibold ${ p.stock <= 2 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-600' : 'text-brand-heading' }`}
                              onClick={() => setInlineEditStock({ id: p.id, value: String(p.stock) })} title="Click to edit stock">
                              {p.stock}
                              <Edit2 size={9} className="opacity-0 group-hover:opacity-50" />
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center select-none">
                          <button
                            onClick={() => handleToggleProductActive(p)}
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] cursor-pointer ${
                              p.active 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                          >
                            {p.active ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="py-4 pl-2 text-right select-none">
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="text-brand-accent hover:text-brand-accent-hover p-1.5 hover:scale-105 transition"
                              title="Edit product"
                            >
                              <Edit2 size={13} strokeWidth={1.8} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-brand-body/40 hover:text-red-500 p-1.5 hover:scale-105 transition"
                              title="Delete product"
                            >
                              <Trash2 size={13} strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. Orders Section */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Search + Export */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                placeholder="Search by order ID, customer name, or phone..."
                className="flex-1 h-9 px-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent" />
              <button onClick={handleExportOrdersCSV}
                className="px-4 h-9 bg-white border border-brand-border/60 rounded-xl text-xs font-semibold text-brand-heading hover:bg-brand-cream cursor-pointer transition flex items-center gap-2">
                <FileText size={13} />
                Export CSV
              </button>
            </div>

            {/* Toolbar status filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
              {/* Left filter options */}
              <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest font-sans">
                {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setOrderFilter(tab as any);
                      setViewingOrder(null);
                    }}
                    className={`px-4 h-8 rounded-full border transition-all cursor-pointer ${
                      orderFilter === tab 
                        ? 'bg-brand-heading text-white border-brand-heading' 
                        : 'bg-white border-brand-border/60 hover:bg-brand-cream'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {customerFilter && (
                <button 
                  onClick={() => setCustomerFilter(null)}
                  className="text-xs text-brand-accent hover:underline flex items-center gap-1.5"
                >
                  <X size={12} />
                  <span>Clearing Customer: {customerFilter}</span>
                </button>
              )}

              <span className="text-xs text-brand-body/65 font-sans font-semibold">
                Found {filteredOrders.length} transactions
              </span>
            </div>

            {/* Orders list table */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                      <th className="pb-3 pr-2">Order ID</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Customer</th>
                      <th className="pb-3 px-2">Products</th>
                      <th className="pb-3 px-2 text-right">Amount</th>
                      <th className="pb-3 px-2 text-center">Status</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-brand-cream/35 transition-colors">
                        <td className="py-4 pr-2 font-semibold text-brand-heading font-mono">{o.order_id}</td>
                        <td className="py-4 px-2 text-brand-body/60 select-none">
                          {new Date(o.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-2">
                          <div className="font-semibold text-brand-heading">{o.customer_name}</div>
                          <div className="text-[10px] text-brand-body/50 mt-0.5">{o.customer_phone}</div>
                        </td>
                        <td className="py-4 px-2 max-w-[180px] truncate" title={o.items.map((i: any) => i.name).join(', ')}>
                          {o.items.map((i: any) => i.name).join(', ')}
                        </td>
                        <td className="py-4 px-2 text-right font-semibold text-brand-heading select-none">
                          ₹{o.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-2 text-center select-none">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.order_id, e.target.value as any)}
                            className={`px-2.5 h-6 rounded-full font-bold uppercase tracking-wider text-[8px] border text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent ${
                              o.status === 'Delivered' 
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : o.status === 'Shipped'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : o.status === 'Processing'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value="Pending" className="text-gray-700 bg-white">Pending</option>
                            <option value="Processing" className="text-amber-700 bg-white">Processing</option>
                            <option value="Shipped" className="text-blue-700 bg-white">Shipped</option>
                            <option value="Delivered" className="text-green-700 bg-white">Delivered</option>
                          </select>
                        </td>
                        <td className="py-4 pl-2 text-right select-none">
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="text-brand-accent hover:text-brand-accent-hover font-bold uppercase text-[9px] tracking-wider border border-brand-border bg-white hover:bg-brand-cream py-1 px-3.5 rounded-full shadow-2xs hover:shadow-xs transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. Customers Section */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fade-in-up">
            <span className="text-xs text-brand-body/65 font-sans font-semibold select-none">
              Registry lists {customersList.length} unique buyers
            </span>

            {/* Customers table list */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                      <th className="pb-3 pr-2">Customer Name</th>
                      <th className="pb-3 px-2">Unique Address Email</th>
                      <th className="pb-3 px-2 text-center">Orders Placed</th>
                      <th className="pb-3 px-2 text-right">Total Spent</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                    {customersList.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-brand-cream/35 transition-colors">
                        <td className="py-4 pr-2 font-semibold text-brand-heading">{cust.name}</td>
                        <td className="py-4 px-2 text-brand-body/60 font-mono">{cust.email}</td>
                        <td className="py-4 px-2 text-center font-semibold text-brand-heading select-none">{cust.ordersCount}</td>
                        <td className="py-4 px-2 text-right font-semibold text-brand-heading select-none">
                          ₹{cust.spentTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 pl-2 text-right select-none">
                          <button
                            onClick={() => {
                              setCustomerFilter(cust.name);
                              setOrderFilter('All');
                              setActiveTab('orders');
                              showToast(`Filtering orders for ${cust.name}`, 'success');
                            }}
                            className="text-brand-accent hover:text-brand-accent-hover font-bold uppercase text-[9px] tracking-wider border border-brand-border bg-white hover:bg-brand-cream py-1 px-3.5 rounded-full transition cursor-pointer"
                          >
                            View Orders
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. Settings Section */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl animate-fade-in-up">
            
            {/* Store Status Card */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-5">
              <h3 className="font-serif text-lg font-bold text-brand-heading select-none">Store Status</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-heading">Store is {storeOpen ? 'Open ✅' : 'Closed 🔒'}</p>
                  <p className="text-xs text-brand-body/60 font-sans mt-0.5">Toggle to temporarily close your store for customers</p>
                </div>
                <button type="button" onClick={() => setStoreOpen(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${ storeOpen ? 'bg-green-500' : 'bg-gray-300' }`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ storeOpen ? 'translate-x-6' : 'translate-x-1' }`} />
                </button>
              </div>
              {!storeOpen && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Closed Message Shown to Customers</label>
                  <input type="text" value={storeClosedMessage} onChange={e => setStoreClosedMessage(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Low Stock Alert Threshold</label>
                <div className="flex items-center gap-3">
                  <input type="number" value={lowStockThreshold} min={1} max={50}
                    onChange={e => setLowStockThreshold(Number(e.target.value))}
                    className="w-24 h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent" />
                  <span className="text-xs text-brand-body/55 font-sans">Products at or below this stock show in the Dashboard alert</span>
                </div>
              </div>
              <button type="button" onClick={handleSaveStoreStatus}
                className="px-6 h-10 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer transition">
                Save Store Settings
              </button>
            </div>

            {/* General Settings card */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none">
                <SettingsIcon size={16} className="text-[#C9A84C]" />
                <span>General Store Constants</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Free threshold */}
                <div>
                  <label htmlFor="freeThreshold" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    id="freeThreshold"
                    value={settingsFreeThreshold}
                    onChange={(e) => setSettingsFreeThreshold(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>

                {/* Shipping charges */}
                <div>
                  <label htmlFor="shippingCharges" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                    Standard Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    id="shippingCharges"
                    value={settingsShippingCharges}
                    onChange={(e) => setSettingsShippingCharges(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="whatsappNum" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    id="whatsappNum"
                    value={settingsWhatsapp}
                    onChange={(e) => setSettingsWhatsapp(e.target.value)}
                    placeholder="+91-XXXXX-XXXXX"
                    className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="storeEmail" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                    Support Contact Email
                  </label>
                  <input
                    type="email"
                    id="storeEmail"
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    placeholder="support@example.com"
                    className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>
              </div>

              <button type="submit"
                className="px-6 h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white 
                rounded-full text-xs font-semibold uppercase tracking-wider 
                cursor-pointer transition">
                Save General Settings
              </button>
            </div>

            {/* Shipping & Delivery card */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none">
                <Truck size={16} className="text-[#C9A84C]" />
                <span>Shipping & Delivery</span>
              </h3>

              <div className="space-y-4">
                {/* COD Available toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 select-none">
                      COD Available
                    </label>
                    <p className="text-xs text-brand-body/60 font-sans mt-0.5">Allow Cash on Delivery at checkout</p>
                  </div>
                  <button type="button" onClick={() => setCodAvailable(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${ codAvailable ? 'bg-green-500' : 'bg-gray-300' }`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ codAvailable ? 'translate-x-6' : 'translate-x-1' }`} />
                  </button>
                </div>

                {/* COD Extra Charge */}
                {codAvailable && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="codCharge" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 select-none">
                      COD Extra Charge (₹)
                    </label>
                    <input
                      type="number"
                      id="codCharge"
                      value={codCharge}
                      min={0}
                      onChange={(e) => setCodCharge(Number(e.target.value))}
                      className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    />
                  </div>
                )}

                {/* Express Delivery Charge */}
                <div className="space-y-1.5">
                  <label htmlFor="expressCharge" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 select-none">
                    Express Delivery Charge (₹)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      id="expressCharge"
                      value={expressCharge}
                      min={0}
                      onChange={(e) => setExpressCharge(Number(e.target.value))}
                      className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    />
                    <span className="text-xs text-brand-body/55 font-sans whitespace-nowrap">
                      {expressCharge === 0 ? 'Disabled' : `₹${expressCharge}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit settings button */}
            <button
              type="submit"
              className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs hover:shadow-sm cursor-pointer transition active:scale-95"
            >
              Save Store Settings
            </button>
          </form>
        )}

        {/* Categories Section */}
        {activeTab === 'categories' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none">
                <Tag size={16} className="text-[#C9A84C]" />
                <span>Store Categories</span>
              </h3>
              
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Special Occasions"
                  className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all animate-none"
                />
                <button
                  type="submit"
                  className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs hover:shadow-sm cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Category</span>
                </button>
              </form>

              <hr className="border-brand-border/40" />

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60 select-none">Current Categories</label>
                {categories.length === 0 ? (
                  <p className="text-xs text-brand-body/65 italic">No categories defined yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {categories.map((cat) => (
                      <div key={cat} className="flex items-center justify-between bg-white border border-brand-border/30 rounded-xl px-4 py-3 shadow-2xs animate-none">
                        <span className="font-sans text-sm text-brand-heading font-medium">{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-brand-body/40 hover:text-red-500 transition p-1 hover:scale-105 cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Manager Overview */}
        {activeTab === 'content-manager' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="font-serif text-2xl text-brand-heading">Content Manager</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <HomeIcon size={20} />, title: 'Homepage Hero', desc: 'Banner image, title, tagline, CTA', tab: 'content-homepage' },
                { icon: <Sparkles size={20} />, title: 'Featured Products', desc: 'Section title, subtitle, product count', tab: 'content-featured' },
                { icon: <BookOpen size={20} />, title: 'Our Story Page', desc: 'About page blocks, images, text', tab: 'content-about' },
                { icon: <Phone size={20} />, title: 'Contact Page', desc: 'Info, hours, map embed, intro text', tab: 'content-contact' },
                { icon: <Layout size={20} />, title: 'Footer', desc: 'Tagline, social links, copyright', tab: 'content-footer' },
                { icon: <Megaphone size={20} />, title: 'Announcements', desc: 'Marquee ticker text and visibility', tab: 'content-announcements' },
              ].map(card => (
                <div key={card.tab} className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-brand-accent">{card.icon}</div>
                    <div>
                      <h3 className="font-serif text-lg text-brand-heading">{card.title}</h3>
                      <p className="text-xs text-brand-body/60">{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab(card.tab as any)}
                    className="mt-auto px-4 h-9 bg-white border border-brand-border hover:bg-brand-cream rounded-full text-xs font-semibold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 self-start">
                    Edit →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Manager - Homepage Hero Editor */}
        {activeTab === 'content-homepage' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <button onClick={() => setActiveTab('content-manager')} className="flex items-center gap-2 text-xs text-brand-body/60 hover:text-brand-accent transition">← Back to Content Manager</button>
            <h2 className="font-serif text-2xl text-brand-heading">Homepage Hero</h2>
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Hero Banner Image URL</label>
                <div className="flex gap-2">
                  <input type="text" value={heroEditorBannerUrl} onChange={(e) => setHeroEditorBannerUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                  <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                    <Upload size={14} />
                    <span>{uploadingIndex === 10 ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 10)} className="hidden" disabled={uploadingIndex !== null} />
                  </label>
                </div>
                {heroEditorBannerUrl && (
                  <>
                    <div className="mt-2 aspect-[21/9] w-full rounded-xl overflow-hidden border border-brand-border/40">
                      <img src={heroEditorBannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                    </div>
                    <p className="text-xs text-brand-body/50 mt-1">
                      Upload a new image to replace the current one
                    </p>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Badge Text</label>
                <input type="text" value={heroEditorBadge} onChange={(e) => setHeroEditorBadge(e.target.value)} placeholder="e.g. FLORAL LIFESTYLE · EST. 2026" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Title Word 1</label>
                  <input type="text" value={heroEditorTitle1} onChange={(e) => setHeroEditorTitle1(e.target.value)} placeholder="Fuzzy" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Title Word 2</label>
                  <input type="text" value={heroEditorTitle2} onChange={(e) => setHeroEditorTitle2(e.target.value)} placeholder="Soft" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Title Word 3</label>
                  <input type="text" value={heroEditorTitle3} onChange={(e) => setHeroEditorTitle3(e.target.value)} placeholder="Studio" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Tagline</label>
                <input type="text" value={heroEditorTagline} onChange={(e) => setHeroEditorTagline(e.target.value)} placeholder="Where Every Petal Tells a Story" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">CTA Button Text</label>
                <input type="text" value={heroEditorCta} onChange={(e) => setHeroEditorCta(e.target.value)} placeholder="SHOP NOW" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>
            <button onClick={handleSaveHomepageHero} className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs cursor-pointer transition active:scale-95">Save Homepage Hero</button>
          </div>
        )}

        {/* Content Manager - Featured Products Editor */}
        {activeTab === 'content-featured' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <button onClick={() => setActiveTab('content-manager')} className="flex items-center gap-2 text-xs text-brand-body/60 hover:text-brand-accent transition">← Back to Content Manager</button>
            <h2 className="font-serif text-2xl text-brand-heading">Featured Products Section</h2>
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Section Title</label>
                <input type="text" value={featuredSectionTitle} onChange={(e) => setFeaturedSectionTitle(e.target.value)} placeholder="Most Loved Arrangements" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Section Subtitle</label>
                <input type="text" value={featuredSectionSubtitle} onChange={(e) => setFeaturedSectionSubtitle(e.target.value)} placeholder="Handpicked, just for you" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Products to Show</label>
                <select value={featuredSectionCount} onChange={(e) => setFeaturedSectionCount(e.target.value)} className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none cursor-pointer">
                  <option value="4">4 Products</option>
                  <option value="6">6 Products</option>
                  <option value="8">8 Products</option>
                </select>
              </div>
              <div className="flex items-center justify-between bg-brand-cream/25 border border-brand-border/20 p-4 rounded-xl">
                <div>
                  <label htmlFor="featuredVisible" className="text-xs font-semibold uppercase tracking-wider text-brand-heading cursor-pointer">Show Featured Section on Homepage</label>
                </div>
                <button type="button" id="featuredVisible" onClick={() => setFeaturedSectionVisible(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${ featuredSectionVisible ? 'bg-green-500' : 'bg-gray-300' }`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ featuredSectionVisible ? 'translate-x-6' : 'translate-x-1' }`} />
                </button>
              </div>
            </div>
            <button onClick={handleSaveFeatured} className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs cursor-pointer transition active:scale-95">Save Featured Section</button>
          </div>
        )}

        {/* Content Manager - About / Our Story Editor */}
        {activeTab === 'content-about' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <button onClick={() => setActiveTab('content-manager')} className="flex items-center gap-2 text-xs text-brand-body/60 hover:text-brand-accent transition">← Back to Content Manager</button>
            <h2 className="font-serif text-2xl text-brand-heading">Our Story Page</h2>
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Hero Title</label>
                  <input type="text" value={contentHeroTitle} onChange={(e) => setContentHeroTitle(e.target.value)} className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Hero Subtitle</label>
                  <input type="text" value={contentHeroSubtitle} onChange={(e) => setContentHeroSubtitle(e.target.value)} className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
              </div>
              <hr className="border-brand-border/20" />
              <h4 className="text-xs uppercase tracking-widest text-[#8FA088] font-bold">Story Block 1</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 1 Title</label>
                  <input type="text" value={contentBlock1Title} onChange={(e) => setContentBlock1Title(e.target.value)} className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 1 Image URL</label>
                  <div className="flex gap-2">
                    <input type="text" value={contentBlock1Image} onChange={(e) => setContentBlock1Image(e.target.value)} className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                    <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                      <Upload size={14} />
                      <span>{uploadingIndex === 11 ? '...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 11)} className="hidden" disabled={uploadingIndex !== null} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 1 Paragraph 1</label>
                  <textarea value={contentBlock1Text1} onChange={(e) => setContentBlock1Text1(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 1 Paragraph 2</label>
                  <textarea value={contentBlock1Text2} onChange={(e) => setContentBlock1Text2(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
                </div>
              </div>
              <hr className="border-brand-border/20" />
              <h4 className="text-xs uppercase tracking-widest text-[#8FA088] font-bold">Story Block 2</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 2 Title</label>
                  <input type="text" value={contentBlock2Title} onChange={(e) => setContentBlock2Title(e.target.value)} className="w-full h-11 px-4 bg-white/95 rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 2 Image URL</label>
                  <div className="flex gap-2">
                    <input type="text" value={contentBlock2Image} onChange={(e) => setContentBlock2Image(e.target.value)} className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                    <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                      <Upload size={14} />
                      <span>{uploadingIndex === 12 ? '...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 12)} className="hidden" disabled={uploadingIndex !== null} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 2 Paragraph 1</label>
                  <textarea value={contentBlock2Text1} onChange={(e) => setContentBlock2Text1(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Block 2 Paragraph 2</label>
                  <textarea value={contentBlock2Text2} onChange={(e) => setContentBlock2Text2(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
                </div>
              </div>
            </div>
            <button onClick={handleSaveAbout} className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs cursor-pointer transition active:scale-95">Save About Page</button>
          </div>
        )}

        {/* Content Manager - Contact Page Editor */}
        {activeTab === 'content-contact' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <button onClick={() => setActiveTab('content-manager')} className="flex items-center gap-2 text-xs text-brand-body/60 hover:text-brand-accent transition">← Back to Content Manager</button>
            <h2 className="font-serif text-2xl text-brand-heading">Contact Page</h2>
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Page Title</label>
                <input type="text" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} placeholder="Contact Us" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Intro Text</label>
                <textarea value={contactIntro} onChange={(e) => setContactIntro(e.target.value)} rows={3} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">WhatsApp Number</label>
                  <input type="text" value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="+91-XXXXX-XXXXX" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Support Email</label>
                  <input type="email" value={contactEmailEditor} onChange={(e) => setContactEmailEditor(e.target.value)} placeholder="hello@fuzzysoftstudio.com" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Studio Location</label>
                  <input type="text" value={contactLocation} onChange={(e) => setContactLocation(e.target.value)} placeholder="Kanpur, Uttar Pradesh" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Business Hours</label>
                  <input type="text" value={contactHours} onChange={(e) => setContactHours(e.target.value)} placeholder="Mon–Sat, 10 AM – 7 PM" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Google Maps Embed URL</label>
                <input type="text" value={contactMapUrl} onChange={(e) => setContactMapUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                {contactMapUrl && <iframe src={contactMapUrl} width="100%" height="150" className="rounded-xl border border-brand-border/40 mt-2" title="Map Preview" />}
              </div>
            </div>
            <button onClick={handleSaveContact} className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs cursor-pointer transition active:scale-95">Save Contact Page</button>
          </div>
        )}

        {/* Content Manager - Footer Editor */}
        {activeTab === 'content-footer' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <button onClick={() => setActiveTab('content-manager')} className="flex items-center gap-2 text-xs text-brand-body/60 hover:text-brand-accent transition">← Back to Content Manager</button>
            <h2 className="font-serif text-2xl text-brand-heading">Footer</h2>
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Tagline</label>
                <input type="text" value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} placeholder="Where Every Petal Tells a Story" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">About Text</label>
                <textarea value={footerAboutText} onChange={(e) => setFooterAboutText(e.target.value)} rows={3} placeholder="A handmade crochet & floral studio..." className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Instagram URL</label>
                  <input type="text" value={footerInstagram} onChange={(e) => setFooterInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Facebook URL</label>
                  <input type="text" value={footerFacebook} onChange={(e) => setFooterFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Pinterest URL</label>
                  <input type="text" value={footerPinterest} onChange={(e) => setFooterPinterest(e.target.value)} placeholder="https://pinterest.com/..." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">WhatsApp URL</label>
                  <input type="text" value={footerWhatsappUrl} onChange={(e) => setFooterWhatsappUrl(e.target.value)} placeholder="https://wa.me/91..." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Copyright Text</label>
                <input type="text" value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} placeholder="© 2026 Fuzzy Soft Studio. All rights reserved." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Footer Note</label>
                <input type="text" value={footerNote} onChange={(e) => setFooterNote(e.target.value)} placeholder="Made with love in Kanpur" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>
            <button onClick={handleSaveFooter} className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs cursor-pointer transition active:scale-95">Save Footer Settings</button>
          </div>
        )}

        {/* Content Manager - Announcements Editor */}
        {activeTab === 'content-announcements' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            <button onClick={() => setActiveTab('content-manager')} className="flex items-center gap-2 text-xs text-brand-body/60 hover:text-brand-accent transition">← Back to Content Manager</button>
            <h2 className="font-serif text-2xl text-brand-heading">Announcements</h2>
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Marquee Text</label>
                <input type="text" value={offerLineEditor} onChange={(e) => setOfferLineEditor(e.target.value)} placeholder="🌸 Mother's Day Special: Use code BLOOM20 for 20% off!" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="flex items-center justify-between bg-brand-cream/25 border border-brand-border/20 p-4 rounded-xl">
                <div>
                  <label htmlFor="marqueeVisible" className="text-xs font-semibold uppercase tracking-wider text-brand-heading cursor-pointer">Show Marquee Ticker on Homepage</label>
                </div>
                <button type="button" id="marqueeVisible" onClick={() => setMarqueeVisibleEditor(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${ marqueeVisibleEditor ? 'bg-green-500' : 'bg-gray-300' }`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ marqueeVisibleEditor ? 'translate-x-6' : 'translate-x-1' }`} />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading mb-2">Banner Image URL</label>
                <div className="flex gap-2">
                  <input type="text" value={heroEditorBannerUrl} onChange={(e) => setHeroEditorBannerUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                  <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                    <Upload size={14} />
                    <span>{uploadingIndex === 10 ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 10)} className="hidden" disabled={uploadingIndex !== null} />
                  </label>
                </div>
                {heroEditorBannerUrl && (
                  <>
                    <div className="mt-2 aspect-[21/9] w-full rounded-xl overflow-hidden border border-brand-border/40">
                      <img src={heroEditorBannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                    </div>
                    <p className="text-xs text-brand-body/50 mt-1">
                      Upload a new image to replace the current one
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs">
              <h3 className="font-serif text-lg text-brand-heading mb-4">
                Collection Banners
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminCollectionBanners.map((banner, index) => (
                  <div key={banner.slug} 
                    className="border border-brand-border/40 rounded-xl p-4 bg-white/50">
                    <p className="font-semibold text-sm text-brand-heading mb-3">
                      {banner.name}
                    </p>
                    {banner.image && (
                      <>
                        <img src={banner.image} alt={banner.name}
                          className="w-full h-32 object-cover rounded-lg mb-3" />
                        <p className="text-xs text-brand-body/50 mt-1 mb-3">
                          Upload a new image to replace the current one
                        </p>
                      </>
                    )}
                    <label className="block text-xs text-brand-body/60 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={banner.image}
                      onChange={(e) => {
                        const updated = [...adminCollectionBanners];
                        updated[index] = { ...updated[index], image: e.target.value };
                        setAdminCollectionBanners(updated);
                      }}
                      placeholder="Paste image URL or upload below"
                      className="w-full border border-brand-border/40 rounded-lg px-3 
                        py-2 text-sm bg-white/80 mb-2"
                    />
                    <label className="block text-xs text-brand-body/60 mb-1">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fileName = `collection-${banner.slug}`;
                        const { error } = await supabase.storage
                          .from('product-images')
                          .upload(fileName, file, { upsert: true });
                        if (error) {
                          showToast('Upload failed: ' + error.message, 'error');
                          return;
                        }
                        const { data: { publicUrl } } = supabase.storage
                          .from('product-images')
                          .getPublicUrl(fileName);
                        const updated = [...adminCollectionBanners];
                        updated[index] = { ...updated[index], image: publicUrl };
                        setAdminCollectionBanners(updated);
                        showToast(`${banner.name} image uploaded!`, 'success');
                      }}
                      className="w-full text-xs text-brand-body/60"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  try {
                    await supabase.from('settings').upsert(
                      { key: 'collection_banners', 
                        value: JSON.stringify(adminCollectionBanners) },
                      { onConflict: 'key' }
                    );
                    showToast('Collection banners saved!', 'success');
                  } catch (err: any) {
                    showToast('Save failed: ' + err.message, 'error');
                  }
                }}
                className="mt-4 px-6 h-10 bg-[#DCA29A] text-white rounded-full 
                  text-sm font-semibold uppercase tracking-wider hover:bg-[#C8887F] 
                  transition cursor-pointer"
              >
                Save Collection Banners
              </button>
            </div>

            {/* From Our Garden Editor Section */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-heading">
                  From Our Garden
                </h3>
                <p className="text-xs text-brand-body/60 mt-1">
                  Featured garden slots on the home page (up to 6 slots). Enter image URLs or upload images directly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gardenImages.map((imgUrl, idx) => (
                  <div key={idx} className="border border-brand-border/40 rounded-xl p-3 bg-white/50 space-y-2">
                    <p className="font-semibold text-xs text-brand-heading">Slot {idx + 1}</p>
                    
                    <div className="aspect-square w-full rounded-lg overflow-hidden border border-brand-border/30 bg-brand-cream/35 flex items-center justify-center">
                      {imgUrl ? (
                        <img src={imgUrl} className="w-full h-full object-cover" alt={`Garden Slot ${idx + 1}`} />
                      ) : (
                        <span className="text-[10px] text-brand-body/40">Empty Slot</span>
                      )}
                    </div>
                    {imgUrl && (
                      <p className="text-xs text-brand-body/50 mt-1">
                        Upload a new image to replace the current one
                      </p>
                    )}
                    
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...gardenImages];
                        updated[idx] = e.target.value;
                        setGardenImages(updated);
                      }}
                      placeholder="Image URL"
                      className="w-full border border-brand-border/40 rounded-lg px-2.5 py-1 text-xs bg-white/80"
                    />
                    
                    <label className="h-8 w-full bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-lg flex items-center justify-center gap-1 cursor-pointer text-[10px] font-semibold select-none active:scale-95 transition">
                      <Upload size={10} />
                      <span>{uploadingIndex === 30 + idx ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 30 + idx)}
                        className="hidden"
                        disabled={uploadingIndex !== null}
                      />
                    </label>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { error } = await supabase.from('settings').upsert(
                      { key: 'garden_images', value: JSON.stringify(gardenImages) },
                      { onConflict: 'key' }
                    );
                    if (error) throw error;
                    showToast('Garden images saved!', 'success');
                  } catch (err: any) {
                    showToast('Save failed: ' + err.message, 'error');
                  }
                }}
                className="px-6 h-10 bg-[#DCA29A] text-white rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-[#C8887F] transition cursor-pointer"
              >
                Save Garden Images
              </button>
            </div>

            <button onClick={handleSaveAnnouncements} className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs cursor-pointer transition active:scale-95">Save Announcements</button>
          </div>
        )}

        {/* 7. Add Product Section */}
        {activeTab === 'add-product' && (
          <AdminProductForm
            mode="add"
            categories={categories}
            onSubmit={handleAddProduct}
            onCancel={() => setActiveTab('products')}
            uploadingIndex={uploadingIndex}
            onImageUpload={handleImageUpload}
          />
        )}

        {/* Discounts Section */}
        {activeTab === 'discounts' && (
          <div className="space-y-6 max-w-3xl animate-fade-in-up">
            {/* Create New Code */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none">
                <Percent size={16} className="text-[#C9A84C]" />
                <span>Create Discount Code</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 select-none">Code</label>
                  <input
                    type="text"
                    value={newDiscountCode}
                    onChange={(e) => setNewDiscountCode(e.target.value.replace(/\s/g,'').toUpperCase())}
                    placeholder="e.g. BLOOM20"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition font-mono tracking-widest uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 select-none">Discount %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newDiscountPercent}
                    onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 select-none">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={newDiscountExpiry}
                    onChange={(e) => setNewDiscountExpiry(e.target.value)}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateDiscount}
                disabled={loadingDiscounts}
                className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs hover:shadow-sm cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Plus size={14} />
                <span>Create Code</span>
              </button>
            </div>

            {/* Existing Codes Table */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading select-none">Active Codes</h3>
              {discountCodes.length === 0 ? (
                <p className="text-xs text-brand-body/65 italic">No discount codes yet. Create one above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                        <th className="pb-3 pr-2">Code</th>
                        <th className="pb-3 px-2">Discount</th>
                        <th className="pb-3 px-2">Expiry</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                        <th className="pb-3 pl-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                      {discountCodes.map((dc) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isActive = !dc.expiry || dc.expiry >= today;
                        return (
                          <tr key={dc.code} className="hover:bg-brand-cream/35 transition-colors">
                            <td className="py-3 pr-2 font-mono font-bold text-brand-heading tracking-widest">{dc.code}</td>
                            <td className="py-3 px-2 font-semibold text-brand-heading">{dc.percent}%</td>
                            <td className="py-3 px-2 text-brand-body/60">{dc.expiry || '—'}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
                                isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {isActive ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="py-3 pl-2 text-right">
                              <button
                                onClick={() => handleDeleteDiscount(dc.code)}
                                className="text-brand-body/40 hover:text-red-500 p-1.5 hover:scale-105 transition cursor-pointer"
                                title="Delete discount code"
                              >
                                <Trash2 size={13} strokeWidth={1.8} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="select-none">
              <h2 className="text-2xl font-serif text-brand-heading">Reviews &amp; Testimonials</h2>
              <p className="text-xs text-brand-body/60 font-sans mt-1">Manage customer testimonials shown on the homepage.</p>
            </div>

            {/* Add New Review */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading">Add New Testimonial</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Customer Name *</label>
                  <input type="text" value={newReviewName} onChange={e => setNewReviewName(e.target.value)}
                    placeholder="e.g. Ananya R."
                    className="w-full h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Location</label>
                  <input type="text" value={newReviewLocation} onChange={e => setNewReviewLocation(e.target.value)}
                    placeholder="e.g. Lucknow, UP"
                    className="w-full h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Star Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setNewReviewRating(r)} type="button"
                      className={`text-2xl cursor-pointer transition ${r <= newReviewRating ? 'text-[#C9A84C]' : 'text-brand-border'}`}>
                      ★
                    </button>
                  ))}
                  <span className="text-xs text-brand-body/60 ml-2 self-center">{newReviewRating}/5</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Review Quote *</label>
                <textarea value={newReviewQuote} onChange={e => setNewReviewQuote(e.target.value)}
                  placeholder="Customer's review text..."
                  rows={3}
                  className="w-full p-3 bg-white border border-brand-border/60 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="reviewVerified" checked={newReviewVerified} onChange={e => setNewReviewVerified(e.target.checked)} className="accent-brand-accent cursor-pointer w-4 h-4" />
                <label htmlFor="reviewVerified" className="text-xs font-semibold text-brand-heading cursor-pointer">Mark as Verified Purchase</label>
              </div>
              <button onClick={handleAddReview} disabled={loadingReviews}
                className="px-6 h-10 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer transition disabled:opacity-60">
                {loadingReviews ? 'Adding...' : '+ Add Testimonial'}
              </button>
            </div>

            {/* Existing Reviews */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading">Current Testimonials ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-brand-body/55 font-sans">No testimonials yet. Add one above to display on the homepage.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 p-4 bg-brand-cream/50 rounded-xl border border-brand-border/20">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#C9A84C] text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          {r.verified && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Verified</span>}
                        </div>
                        <p className="text-sm font-serif italic text-brand-heading/85">"{r.quote}"</p>
                        <p className="text-xs font-semibold text-brand-body/60">— {r.name}{r.location ? `, ${r.location}` : ''}</p>
                      </div>
                      <button onClick={() => handleDeleteReview(idx)} type="button"
                        className="text-brand-body/40 hover:text-red-500 transition cursor-pointer shrink-0 p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Old add-product section has been replaced by AdminProductForm component above */}
        {false && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center select-none">
              <button 
                onClick={() => setActiveTab('products')} 
                className="text-xs font-semibold tracking-wide text-brand-body/60 hover:text-brand-accent flex items-center gap-1.5 cursor-pointer uppercase transition-colors"
              >
                &larr; Back to Catalog
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 sm:p-8 shadow-xs backdrop-blur-xs space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Basic Details (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                  <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Arrangement Details</h3>
                  
                  {/* Product Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. Lavender Lullaby"
                      className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                      />
                    </div>

                    {/* Stock */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Stock Qty *</label>
                      <input
                        type="number"
                        required
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Category *</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Collection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Collection *</label>
                      <select
                        value={prodCollection}
                        onChange={(e) => setProdCollection(e.target.value)}
                        className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                      >
                        <option value="bridal-blooms">Bridal Blooms</option>
                        <option value="everyday-luxury">Everyday Luxury</option>
                        <option value="seasonal-picks">Seasonal Picks</option>
                        <option value="gift-bouquets">Gift Bouquets</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Description *</label>
                    <textarea
                      required
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Describe the arrangement, materials, aesthetics..."
                      rows={5}
                      className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition resize-none"
                    />
                  </div>

                  {/* Status checklist */}
                  <div className="flex items-center gap-3.5 bg-brand-cream/25 border border-brand-border/20 p-4 rounded-xl select-none">
                    <input
                      type="checkbox"
                      id="prodActive"
                      checked={prodActive}
                      onChange={(e) => setProdActive(e.target.checked)}
                      className="w-4 h-4 accent-brand-accent cursor-pointer"
                    />
                    <label htmlFor="prodActive" className="text-xs font-semibold uppercase tracking-wider text-brand-heading cursor-pointer">
                      Publish to Catalog immediately
                    </label>
                  </div>
                </div>

                {/* Right side: Gallery & Bullet Points (5 columns) */}
                <div className="lg:col-span-5 space-y-6">
                  <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Media & Gallery</h3>
                  
                  {/* Gallery URLs */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Main Image URL *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 1 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 1)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60">Gallery Image 2 URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodImage2}
                          onChange={(e) => setProdImage2(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 2 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 2)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60">Gallery Image 3 URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodImage3}
                          onChange={(e) => setProdImage3(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 3 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 3)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60">Gallery Image 4 URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodImage4}
                          onChange={(e) => setProdImage4(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 4 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 4)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Previews if URLs are filled */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {prodImage && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage} className="w-full h-full object-cover" alt="Preview 1" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                    {prodImage2 && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage2} className="w-full h-full object-cover" alt="Preview 2" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                    {prodImage3 && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage3} className="w-full h-full object-cover" alt="Preview 3" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                    {prodImage4 && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage4} className="w-full h-full object-cover" alt="Preview 4" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom section: Highlights, Care, Delivery Info (12 columns) */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border/25">
                  <div className="space-y-6">
                    <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Bullet Points & Highlights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 1</label>
                        <input
                          type="text"
                          value={prodBullet1}
                          onChange={(e) => setProdBullet1(e.target.value)}
                          placeholder="e.g. 100% Handcrafted"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 2</label>
                        <input
                          type="text"
                          value={prodBullet2}
                          onChange={(e) => setProdBullet2(e.target.value)}
                          placeholder="e.g. Long-lasting Bloom"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 3</label>
                        <input
                          type="text"
                          value={prodBullet3}
                          onChange={(e) => setProdBullet3(e.target.value)}
                          placeholder="e.g. Customizable Order"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 4</label>
                        <input
                          type="text"
                          value={prodBullet4}
                          onChange={(e) => setProdBullet4(e.target.value)}
                          placeholder="e.g. Allergen & Pet Safe"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Care & Shipping Instructions</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Care Guide Instructions</label>
                        <textarea
                          value={prodCareInstructions}
                          onChange={(e) => setProdCareInstructions(e.target.value)}
                          rows={2}
                          placeholder="Dust with soft dry cloth. Keep away from direct sunlight..."
                          className="w-full p-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Delivery Lead Info Override</label>
                        <textarea
                          value={prodDeliveryInfo}
                          onChange={(e) => setProdDeliveryInfo(e.target.value)}
                          rows={2}
                          placeholder="Lucknow: 5-10 business days..."
                          className="w-full p-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form submit/cancel footer row */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-brand-border/25 text-xs font-semibold uppercase tracking-wider select-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-8 h-11 bg-white hover:bg-brand-cream/40 text-brand-heading border border-brand-border rounded-full cursor-pointer transition active:scale-95 text-center flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full cursor-pointer shadow-xs transition active:scale-95 text-center flex items-center justify-center"
                >
                  Create Product Entry
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 8. Edit Product Section */}
        {activeTab === 'edit-product' && editingProduct && (
          <AdminProductForm
            mode="edit"
            initialData={editingProduct}
            categories={categories}
            onSubmit={handleEditProduct}
            onCancel={() => { setActiveTab('products'); setEditingProduct(null); }}
            uploadingIndex={uploadingIndex}
            onImageUpload={handleImageUpload}
          />
        )}

        {/* Old edit-product section has been replaced by AdminProductForm component above */}
        {false && editingProduct != null && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center select-none">
              <button 
                onClick={() => { setActiveTab('products'); setEditingProduct(null); }} 
                className="text-xs font-semibold tracking-wide text-brand-body/60 hover:text-brand-accent flex items-center gap-1.5 cursor-pointer uppercase transition-colors"
              >
                &larr; Back to Catalog
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 sm:p-8 shadow-xs backdrop-blur-xs space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Basic Details (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                  <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Edit Product: {editingProduct!.name}</h3>
                  
                  {/* Product Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. Lavender Lullaby"
                      className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                      />
                    </div>

                    {/* Stock */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Stock Qty *</label>
                      <input
                        type="number"
                        required
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Category *</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Collection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Collection *</label>
                      <select
                        value={prodCollection}
                        onChange={(e) => setProdCollection(e.target.value)}
                        className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                      >
                        <option value="bridal-blooms">Bridal Blooms</option>
                        <option value="everyday-luxury">Everyday Luxury</option>
                        <option value="seasonal-picks">Seasonal Picks</option>
                        <option value="gift-bouquets">Gift Bouquets</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Description *</label>
                    <textarea
                      required
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Describe the arrangement, materials, aesthetics..."
                      rows={5}
                      className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition resize-none"
                    />
                  </div>

                  {/* Status checklist */}
                  <div className="flex items-center gap-3.5 bg-brand-cream/25 border border-brand-border/20 p-4 rounded-xl select-none">
                    <input
                      type="checkbox"
                      id="prodActive"
                      checked={prodActive}
                      onChange={(e) => setProdActive(e.target.checked)}
                      className="w-4 h-4 accent-brand-accent cursor-pointer"
                    />
                    <label htmlFor="prodActive" className="text-xs font-semibold uppercase tracking-wider text-brand-heading cursor-pointer">
                      Catalog visibility active
                    </label>
                  </div>
                </div>

                {/* Right side: Gallery & Bullet Points (5 columns) */}
                <div className="lg:col-span-5 space-y-6">
                  <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Media & Gallery</h3>
                  
                  {/* Gallery URLs */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Main Image URL *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 1 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 1)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60">Gallery Image 2 URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodImage2}
                          onChange={(e) => setProdImage2(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 2 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 2)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60">Gallery Image 3 URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodImage3}
                          onChange={(e) => setProdImage3(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 3 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 3)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60">Gallery Image 4 URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prodImage4}
                          onChange={(e) => setProdImage4(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-grow h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                        <label className="h-10 px-3 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                          <Upload size={13} />
                          <span>{uploadingIndex === 4 ? '...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 4)}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Previews if URLs are filled */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {prodImage && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage} className="w-full h-full object-cover" alt="Preview 1" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                    {prodImage2 && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage2} className="w-full h-full object-cover" alt="Preview 2" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                    {prodImage3 && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage3} className="w-full h-full object-cover" alt="Preview 3" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                    {prodImage4 && (
                      <div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                          <img src={prodImage4} className="w-full h-full object-cover" alt="Preview 4" />
                        </div>
                        <p className="text-xs text-brand-body/50 mt-1">
                          Upload a new image to replace the current one
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom section: Highlights, Care, Delivery Info (12 columns) */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border/25">
                  <div className="space-y-6">
                    <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Bullet Points & Highlights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 1</label>
                        <input
                          type="text"
                          value={prodBullet1}
                          onChange={(e) => setProdBullet1(e.target.value)}
                          placeholder="e.g. 100% Handcrafted"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 2</label>
                        <input
                          type="text"
                          value={prodBullet2}
                          onChange={(e) => setProdBullet2(e.target.value)}
                          placeholder="e.g. Long-lasting Bloom"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 3</label>
                        <input
                          type="text"
                          value={prodBullet3}
                          onChange={(e) => setProdBullet3(e.target.value)}
                          placeholder="e.g. Customizable Order"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Highlight 4</label>
                        <input
                          type="text"
                          value={prodBullet4}
                          onChange={(e) => setProdBullet4(e.target.value)}
                          placeholder="e.g. Allergen & Pet Safe"
                          className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Care & Shipping Instructions</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Care Guide Instructions</label>
                        <textarea
                          value={prodCareInstructions}
                          onChange={(e) => setProdCareInstructions(e.target.value)}
                          rows={2}
                          placeholder="Dust with soft dry cloth. Keep away from direct sunlight..."
                          className="w-full p-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Delivery Lead Info Override</label>
                        <textarea
                          value={prodDeliveryInfo}
                          onChange={(e) => setProdDeliveryInfo(e.target.value)}
                          rows={2}
                          placeholder="Lucknow: 5-10 business days..."
                          className="w-full p-3 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form submit/cancel footer row */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-brand-border/25 text-xs font-semibold uppercase tracking-wider select-none">
                <button
                  type="button"
                  onClick={() => { setActiveTab('products'); setEditingProduct(null); }}
                  className="px-8 h-11 bg-white hover:bg-brand-cream/40 text-brand-heading border border-brand-border rounded-full cursor-pointer transition active:scale-95 text-center flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full cursor-pointer shadow-xs transition active:scale-95 text-center flex items-center justify-center"
                >
                  Save Product Edits
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* 9. Modal Layer: Order Details Disclosures */}
      {viewingOrder && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-6 bg-black/35 backdrop-blur-xs animate-fade-in-up">
          <div className="max-w-2xl w-full bg-[#F5EDE6] border border-brand-border/40 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-brand-border/30 pb-4 select-none">
              <div>
                <span className="text-[10px] text-brand-body/50 uppercase tracking-widest block font-bold leading-none">Order Reference</span>
                <span className="text-xl font-bold font-mono tracking-wider text-brand-heading mt-1.5 block">
                  {viewingOrder.order_id}
                </span>
              </div>
              <button 
                onClick={() => setViewingOrder(null)} 
                className="text-brand-body/55 hover:text-brand-body cursor-pointer p-1.5 border border-brand-border/60 bg-white/70 hover:bg-white rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-brand-body/90 font-sans border-b border-brand-border/30 pb-6">
              {/* Customer summary */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] flex items-center gap-1.5 select-none">
                  <User size={13} />
                  <span>Customer Details</span>
                </h4>
                <div className="space-y-1">
                  <div className="font-semibold text-brand-heading text-sm">{viewingOrder.customer_name}</div>
                  <div>Phone: {viewingOrder.customer_phone || 'N/A'}</div>
                  <div className="truncate">Email lookup available inside users catalog</div>
                </div>
              </div>

              {/* Shipping address summary */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] flex items-center gap-1.5 select-none">
                  <Truck size={13} />
                  <span>Shipping Address</span>
                </h4>
                <div className="leading-relaxed text-[11px]">
                  {viewingOrder.shipping_address}
                </div>
              </div>
            </div>

            {/* Items Summary list */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-body/60 select-none">
                Items Purchased
              </h4>

              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
                {viewingOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center bg-white/40 border border-brand-border/25 rounded-xl p-2.5">
                    <div className="w-10 h-14 rounded-lg bg-brand-cream overflow-hidden border border-brand-border/30 shrink-0 select-none">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h5 className="font-serif text-sm font-bold text-brand-heading truncate">{item.name}</h5>
                      <div className="text-[10px] text-brand-body/60 mt-0.5 font-sans">
                        Qty: {item.quantity} &times; ₹{item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="font-sans font-semibold text-sm text-brand-heading shrink-0 text-right select-none">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations totals */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-brand-border/30 pt-4">
              {/* Change Status select */}
              <div className="flex items-center gap-2 select-none w-full sm:w-auto">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-body/55">Status:</span>
                <select
                  value={viewingOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(viewingOrder.order_id, e.target.value as any)}
                  className={`px-3 h-8 rounded-full font-bold uppercase tracking-wider text-[9px] border text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent ${
                    viewingOrder.status === 'Delivered' 
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : viewingOrder.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : viewingOrder.status === 'Processing'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Price details summary */}
              <div className="text-right select-none font-sans text-xs text-brand-body/80 space-y-0.5">
                <span className="text-[10px] text-brand-body/45 uppercase tracking-widest block font-bold leading-none mb-1.5">Amount Summary</span>
                <div className="text-sm font-semibold text-brand-heading">
                  Total Paid: <strong className="text-base text-brand-heading ml-1 font-bold">₹{viewingOrder.total_amount.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global custom toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 animate-fade-in-up select-none max-w-sm w-full">
          <div className={`p-4 rounded-2xl border shadow-lg flex items-center justify-between gap-4 backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-[#8FA088]/15 border-[#8FA088]/40 text-[#2C1810]' 
              : 'bg-red-400/15 border-red-400/30 text-[#2C1810]'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-[#8FA088]' : 'bg-red-400'}`} />
              <span className="text-xs font-semibold font-sans tracking-wide leading-tight">{toast.message}</span>
            </div>
            <button 
              onClick={hideToast}
              className="text-brand-body/55 hover:text-brand-body transition text-[10px] uppercase font-bold tracking-widest font-sans cursor-pointer p-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
