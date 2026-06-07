import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Flower2, Sparkles, Leaf } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products as staticProducts } from '../data/products';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [products, setProducts] = useState<any[]>(staticProducts);
  const [isLoading, setIsLoading] = useState(false);

  // Announcement state from Settings
  const [offerText, setOfferText] = useState("Mother's Day Special: Use code BLOOM20 for 20% off all bouquets!");
  const [bannerUrl, setBannerUrl] = useState('/hero-banner.jpg');

  // Hero content state (dynamic via Supabase settings)
  const [heroBadge, setHeroBadge] = useState('FLORAL LIFESTYLE · EST. 2026');
  const [heroTitle1, setHeroTitle1] = useState('Fuzzy');
  const [heroTitle2, setHeroTitle2] = useState('Soft');
  const [heroTitle3, setHeroTitle3] = useState('Studio');
  const [heroTagline, setHeroTagline] = useState('Where Every Petal Tells a Story');
  const [heroCta, setHeroCta] = useState('SHOP NOW');
  const [marqueeVisible, setMarqueeVisible] = useState(true);

  // Featured section state
  const [featuredSectionTitle, setFeaturedSectionTitle] = useState('Most Loved Arrangements');
  const [featuredSectionSubtitle, setFeaturedSectionSubtitle] = useState('Handpicked, just for you');
  const [featuredCount, setFeaturedCount] = useState(4);

  // Collections section state
  const [collectionsTitle, setCollectionsTitle] = useState('Our Collections');
  const [collectionBanners, setCollectionBanners] = useState([
    {
      name: 'Bridal Blooms',
      slug: 'bridal-blooms',
      image: 'https://hbzmkpeirngvbsdawcld.supabase.co/storage/v1/object/public/product-images/collection-bridal-blooms.png'
    },
    {
      name: 'Everyday Luxury',
      slug: 'everyday-luxury',
      image: 'https://hbzmkpeirngvbsdawcld.supabase.co/storage/v1/object/public/product-images/collection-everyday-luxury.png'
    },
    {
      name: 'Seasonal Picks',
      slug: 'seasonal-picks',
      image: 'https://hbzmkpeirngvbsdawcld.supabase.co/storage/v1/object/public/product-images/collection-seasonal-picks.png'
    },
    {
      name: 'Gift Bouquets',
      slug: 'gift-bouquets',
      image: 'https://hbzmkpeirngvbsdawcld.supabase.co/storage/v1/object/public/product-images/collection-gift-bouquets.png'
    }
  ]);

  // Testimonials state
  const [dynamicTestimonials, setDynamicTestimonials] = useState<Array<{ name: string; quote: string; rating: number; location?: string }>>([]);

  // Falling Petals State
  const [petals, setPetals] = useState<Array<{ id: number; left: number; duration: number; delay: number; size: number; color: string }>>([]);

  // Garden images state
  const [gardenImages, setGardenImages] = useState([
    'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=500&q=80',
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&q=80',
    'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=500&q=80',
    'https://images.unsplash.com/photo-1487530811015-780780a87cc2?w=500&q=80',
    'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=500&q=80',
    'https://images.unsplash.com/photo-1490750967868-88df5691cc17?w=500&q=80'
  ]);
  const [instagramUrl, setInstagramUrl] = useState('https://instagram.com/fuzzysoftstudio');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const { data: siteData } = await supabase.from('site_content').select('*');
        const s: Record<string, any> = {};
        if (siteData) {
          siteData.forEach((row: any) => {
            if (row.content) {
              Object.entries(row.content).forEach(([k, v]) => {
                s[k] = v;
              });
            }
          });
        }

        if (s.garden_images) {
          try {
            if (Array.isArray(s.garden_images)) {
              setGardenImages(s.garden_images);
            } else {
              setGardenImages(JSON.parse(s.garden_images));
            }
          } catch {}
        }
        if (s.footer_instagram) setInstagramUrl(s.footer_instagram);

        // Offer line / banner
        if (s.offer_line) setOfferText(s.offer_line);
        if (s.banner_url) setBannerUrl(s.banner_url);

        // Featured section
        if (s.featured_section_title) setFeaturedSectionTitle(s.featured_section_title);
        if (s.featured_section_subtitle) setFeaturedSectionSubtitle(s.featured_section_subtitle);
        if (s.featured_section_count) setFeaturedCount(Number(s.featured_section_count));

        // Collections section
        if (s.collections_section_title) setCollectionsTitle(s.collections_section_title);
        if (s.collection_banners) {
          try {
            if (Array.isArray(s.collection_banners)) {
              setCollectionBanners(s.collection_banners);
            } else {
              setCollectionBanners(JSON.parse(s.collection_banners));
            }
          } catch {}
        }

        // Dynamic testimonials from reviews table (status = approved)
        try {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
          if (reviewsData && reviewsData.length > 0) {
            const mappedReviews = reviewsData.map((r: any) => ({
              name: r.customer_name,
              quote: r.review_text,
              rating: Number(r.rating) || 5,
              location: 'Verified Buyer',
              verified: true
            }));
            setDynamicTestimonials(mappedReviews);
          }
        } catch (revErr) {
          console.warn('Failed to load testimonials from reviews table:', revErr);
        }

        // Apply hero content (either loaded from site_content or default fallback values)
        setHeroBadge(s.hero_badge || 'FLORAL LIFESTYLE · EST. 2026');
        setHeroTitle1(s.hero_title_1 || 'Fuzzy');
        setHeroTitle2(s.hero_title_2 || 'Soft');
        setHeroTitle3(s.hero_title_3 || 'Studio');
        setHeroTagline(s.hero_tagline || 'Where Every Petal Tells a Story');
        setHeroCta(s.hero_cta_text || 'SHOP NOW');
        if (s.hero_banner_url) setBannerUrl(s.hero_banner_url);
        if (s.marquee_visible === false || s.marquee_visible === 'false') setMarqueeVisible(false);

      } catch (err) {
        loadLocalSettings();
        // Apply default hero values on fetch error
        setHeroBadge('FLORAL LIFESTYLE · EST. 2026');
        setHeroTitle1('Fuzzy');
        setHeroTitle2('Soft');
        setHeroTitle3('Studio');
        setHeroTagline('Where Every Petal Tells a Story');
        setHeroCta('SHOP NOW');
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('active', true);
        if (error) throw error;
        if (data) {
          const dbIds = new Set(data.map(p => p.id));
          const dbSlugs = new Set(data.map(p => p.slug));
          const filteredStatic = staticProducts.filter(p => !dbIds.has(p.id) && !dbSlugs.has(p.slug));
          const merged = [...data, ...filteredStatic];
          setProducts(merged.slice(0, 8));
        } else {
          setProducts(staticProducts.slice(0, 8));
        }
      } catch (err) {
        console.warn('Failed to load products from Supabase, using local fallback:', err);
        setProducts(staticProducts.slice(0, 8));
      }
    };

    const loadLocalSettings = () => {
      const local = localStorage.getItem('fuzzy-soft-studio-settings');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.offer_line) setOfferText(parsed.offer_line);
        if (parsed.banner_url) setBannerUrl(parsed.banner_url);
      }
    };

    loadHomeData();
  }, []);

  useEffect(() => {
    const colors = ['#C4A0A0', '#F9E8E8', '#FCFAF8', '#F5EDE3', '#B08888'];
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 8,
      size: 12 + Math.random() * 14,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setPetals(generated);
    if (isLoading) {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setNewsletterSubscribed(true);
      setEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 3000);
    }
  };

  // gardenImages constant removed, loaded from state instead

  const testimonials = [
    {
      name: 'Ananya R.',
      quote: "The most exquisite bouquet I've ever received. It felt like a poem in petals.",
      rating: 5
    },
    {
      name: 'Riya & Karan',
      quote: 'Fuzzy Soft made our wedding feel like a garden dream. Pure magic.',
      rating: 5
    },
    {
      name: 'Meera S.',
      quote: 'Their preserved roses sit on my desk and still make me smile months later.',
      rating: 5
    }
  ];

  const badges = [
    {
      title: 'Hand-Tied Bouquets',
      icon: <Flower2 className="w-4 h-4 text-[#B28A8A]" strokeWidth={1.5} />
    },
    {
      title: 'Sustainably Sourced',
      icon: <Leaf className="w-4 h-4 text-[#8FA088]" strokeWidth={1.5} />
    },
    {
      title: 'Same-Day Delivery',
      icon: <Sparkles className="w-4 h-4 text-[#B28A8A]" strokeWidth={1.5} />
    }
  ];

  return (
    <div className="flex flex-col pb-16">

      {/* Ticker & Hero Container to avoid space-y gaps */}
      <div className="flex flex-col -mt-24">
        
        {/* 1. HERO SECTION */}
        <section 
          className="relative w-full min-h-screen md:min-h-[90vh] lg:min-h-screen overflow-hidden bg-brand-cream"
        >
          {/* Beautiful Soft Romantic Flower Bouquet Background */}
          <img
            src={bannerUrl}
            alt="Fuzzy Soft Studio Hero"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ objectPosition: 'center 30%' }}
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40" />

          {/* Falling Petals Effect */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {petals.map((p) => (
              <span
                key={p.id}
                className="petal"
                style={{
                  left: `${p.left}%`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`
                }}
              >
                <svg width={p.size} height={p.size} viewBox="0 0 32 32" fill="none">
                  <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z" fill={p.color} opacity="0.8"></path>
                </svg>
              </span>
            ))}
          </div>

          {/* Elegant Botanical Flowers — Full Width Hero Bottom */}
          <svg viewBox="0 0 1000 620" className="absolute inset-x-0 bottom-0 w-full h-[55vh] md:h-[65vh] pointer-events-none opacity-35 md:opacity-45" preserveAspectRatio="xMidYEnd meet" aria-hidden="true">
            <defs>
              {/* Petal gradients for depth */}
              <radialGradient id="pg1" cx="50%" cy="70%" r="60%">
                <stop offset="0%" stopColor="#E8C4C4" stopOpacity="1"/>
                <stop offset="100%" stopColor="#C4899A" stopOpacity="0.9"/>
              </radialGradient>
              <radialGradient id="pg2" cx="50%" cy="60%" r="55%">
                <stop offset="0%" stopColor="#FBF0F0" stopOpacity="1"/>
                <stop offset="100%" stopColor="#DCA29A" stopOpacity="0.85"/>
              </radialGradient>
              <radialGradient id="pg3" cx="40%" cy="65%" r="60%">
                <stop offset="0%" stopColor="#F5E8D5" stopOpacity="1"/>
                <stop offset="100%" stopColor="#C9A07A" stopOpacity="0.8"/>
              </radialGradient>
              <radialGradient id="pg4" cx="50%" cy="55%" r="65%">
                <stop offset="0%" stopColor="#F9F0F8" stopOpacity="1"/>
                <stop offset="100%" stopColor="#C4A0C8" stopOpacity="0.85"/>
              </radialGradient>
              <radialGradient id="pg5" cx="50%" cy="70%" r="55%">
                <stop offset="0%" stopColor="#FDECEA" stopOpacity="1"/>
                <stop offset="100%" stopColor="#D4888A" stopOpacity="0.9"/>
              </radialGradient>
              <radialGradient id="pg6" cx="45%" cy="60%" r="60%">
                <stop offset="0%" stopColor="#EDF5E8" stopOpacity="1"/>
                <stop offset="100%" stopColor="#8FB899" stopOpacity="0.8"/>
              </radialGradient>
              <radialGradient id="center1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F9E8B0" stopOpacity="1"/>
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.9"/>
              </radialGradient>
              <radialGradient id="center2" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FFF8D0" stopOpacity="1"/>
                <stop offset="100%" stopColor="#D4A840" stopOpacity="0.9"/>
              </radialGradient>
              <filter id="soft">
                <feGaussianBlur stdDeviation="0.8"/>
              </filter>
            </defs>

            {/* ─── FLOWER 1: Rose (left) ─── */}
            <g transform="translate(90 590) scale(1.05)" className="bloom" style={{ animationDelay: '0s' }}>
              {/* Stem */}
              <path d="M0 0 C -3 -55 5 -120 2 -195" stroke="#7A9E7E" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              {/* Leaves */}
              <path d="M2 -80 C 18 -95 32 -88 22 -72 C 14 -68 4 -75 2 -80 Z" fill="#8FB48A" opacity="0.85"/>
              <path d="M2 -80 C -15 -92 -28 -84 -18 -70 C -10 -66 -2 -73 2 -80 Z" fill="#7A9E7E" opacity="0.75"/>
              <path d="M1 -80 L 22 -73" stroke="#618A65" strokeWidth="0.8" opacity="0.6"/>
              <path d="M1 -140 C 14 -153 26 -146 18 -132 C 11 -128 3 -135 1 -140 Z" fill="#8FB48A" opacity="0.7"/>
              {/* Rose blossom - outer petals */}
              <g transform="translate(2 -215)" className="sway" style={{ animationDelay: '0.3s' }}>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.9" transform="rotate(0)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.85" transform="rotate(45)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.9" transform="rotate(90)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.85" transform="rotate(135)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.9" transform="rotate(180)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.85" transform="rotate(225)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.9" transform="rotate(270)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-22" rx="14" ry="28" fill="url(#pg1)" opacity="0.85" transform="rotate(315)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                {/* Inner petals */}
                <ellipse cx="0" cy="-14" rx="9" ry="18" fill="#D4899A" opacity="0.95" transform="rotate(22)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-14" rx="9" ry="18" fill="#D4899A" opacity="0.9" transform="rotate(112)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-14" rx="9" ry="18" fill="#D4899A" opacity="0.95" transform="rotate(202)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                <ellipse cx="0" cy="-14" rx="9" ry="18" fill="#C47888" opacity="0.9" transform="rotate(292)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                {/* Spiral centre */}
                <path d="M0 -5 C 3 -10 7 -8 5 -3 C 3 0 -1 -2 0 -5 Z" fill="#B86878" opacity="0.9"/>
                <circle r="5" fill="url(#center1)"/>
              </g>
            </g>

            {/* ─── FLOWER 2: Daisy (second from left) ─── */}
            <g transform="translate(235 600) scale(1.2)" className="bloom" style={{ animationDelay: '0.35s' }}>
              <path d="M0 0 C 4 -60 -2 -130 1 -205" stroke="#8AAE8A" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M1 -90 C 20 -108 34 -98 24 -80 C 16 -74 3 -83 1 -90 Z" fill="#9EC49E" opacity="0.85"/>
              <path d="M1 -90 C -17 -106 -30 -97 -21 -80 C -13 -74 -2 -82 1 -90 Z" fill="#8AAE8A" opacity="0.75"/>
              <path d="M0 -90 L 24 -80" stroke="#6A9670" strokeWidth="0.8" opacity="0.55"/>
              <path d="M0 -140 C 16 -155 28 -146 20 -132 C 13 -127 2 -134 0 -140 Z" fill="#9EC49E" opacity="0.7"/>
              {/* Daisy petals — long narrow */}
              <g transform="translate(1 -225)" className="sway-slow" style={{ animationDelay: '0.8s' }}>
                {[0,22,44,66,88,110,132,154,176,198,220,242,264,286,308,330].map((angle, i) => (
                  <ellipse key={i} cx="0" cy="-26" rx="7" ry="30" fill={i % 3 === 0 ? "url(#pg2)" : "#F5DEDE"} opacity="0.9" transform={`rotate(${angle})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Yellow centre disc */}
                <circle r="12" fill="url(#center2)"/>
                <circle r="8" fill="#E8C040" opacity="0.95"/>
                {/* Texture dots on centre */}
                {[-4,-2,0,2,4].map(x => [-4,-2,0,2,4].map(y => (
                  Math.sqrt(x*x+y*y) <= 4.5 ? <circle key={`${x}${y}`} cx={x*1.8} cy={y*1.8} r="0.7" fill="#B08820" opacity="0.5"/> : null
                )))}
              </g>
            </g>

            {/* ─── FLOWER 3: Tulip (centre-left) ─── */}
            <g transform="translate(390 595) scale(1.0)" className="bloom" style={{ animationDelay: '0.7s' }}>
              <path d="M0 0 C -4 -55 3 -115 0 -190" stroke="#7A9E7E" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M0 -95 C 22 -112 36 -100 26 -84 C 18 -78 2 -87 0 -95 Z" fill="#8FB48A" opacity="0.8"/>
              <path d="M0 -95 C -20 -110 -34 -100 -24 -84 C -16 -78 -2 -87 0 -95 Z" fill="#7A9E7E" opacity="0.7"/>
              {/* Tulip cup */}
              <g transform="translate(0 -200)" className="sway" style={{ animationDelay: '1.2s' }}>
                {/* Outer petals */}
                <path d="M0 0 C -22 -20 -26 -58 -16 -82 C -8 -98 0 -102 0 -102 C 0 -102 8 -98 16 -82 C 26 -58 22 -20 0 0 Z" fill="url(#pg5)" opacity="0.9"/>
                <path d="M0 0 C -28 -15 -35 -55 -22 -82 C -14 -98 -4 -104 0 -104 C 0 -104 -4 -104 0 -104 C 4 -104 14 -98 22 -82 C 35 -55 28 -15 0 0 Z" fill="url(#pg5)" opacity="0.75" transform="rotate(-40)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}/>
                <path d="M0 0 C -28 -15 -35 -55 -22 -82 C -14 -98 -4 -104 0 -104 C 4 -104 14 -98 22 -82 C 35 -55 28 -15 0 0 Z" fill="url(#pg5)" opacity="0.75" transform="rotate(40)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}/>
                {/* Inner highlights */}
                <path d="M0 -10 C -10 -30 -12 -65 -6 -90 C -2 -100 0 -102 0 -102 C 2 -100 6 -90 12 -65 C 18 -40 10 -20 0 -10 Z" fill="#FDECEA" opacity="0.5"/>
                {/* Stamens */}
                <line x1="-6" y1="-20" x2="-8" y2="-72" stroke="#D4889A" strokeWidth="1" opacity="0.7"/>
                <line x1="0" y1="-20" x2="0" y2="-78" stroke="#C87888" strokeWidth="1" opacity="0.7"/>
                <line x1="6" y1="-20" x2="8" y2="-72" stroke="#D4889A" strokeWidth="1" opacity="0.7"/>
                <circle cx="-8" cy="-72" r="2.5" fill="#C9A84C" opacity="0.9"/>
                <circle cx="0" cy="-78" r="2.5" fill="#C9A84C" opacity="0.9"/>
                <circle cx="8" cy="-72" r="2.5" fill="#C9A84C" opacity="0.9"/>
              </g>
            </g>

            {/* ─── FLOWER 4: Peony (centre-right) ─── */}
            <g transform="translate(550 592) scale(1.15)" className="bloom" style={{ animationDelay: '1.0s' }}>
              <path d="M0 0 C 3 -58 -4 -125 1 -200" stroke="#8AAE8A" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M1 -85 C 20 -100 34 -90 24 -74 C 16 -68 3 -77 1 -85 Z" fill="#9EC49E" opacity="0.8"/>
              <path d="M1 -85 C -18 -100 -30 -90 -21 -74 C -13 -68 -1 -77 1 -85 Z" fill="#8AAE8A" opacity="0.7"/>
              <path d="M1 -145 C 16 -158 28 -150 20 -136 C 14 -131 3 -138 1 -145 Z" fill="#9EC49E" opacity="0.65"/>
              {/* Peony full globe */}
              <g transform="translate(1 -220)" className="sway" style={{ animationDelay: '0.5s' }}>
                {/* Back outer ring */}
                {[0,36,72,108,144,180,216,252,288,324].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-24" rx="16" ry="30" fill={i%2===0?"url(#pg4)":"#D8C0DC"} opacity="0.7" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Mid ring */}
                {[18,54,90,126,162,198,234,270,306,342].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-18" rx="13" ry="23" fill="url(#pg4)" opacity="0.85" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Inner ruffled petals */}
                {[0,60,120,180,240,300].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-10" rx="9" ry="15" fill="#C8A0CC" opacity="0.95" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Innermost */}
                {[30,90,150,210,270,330].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-6" rx="6" ry="10" fill="#B888BC" opacity="0.95" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                <circle r="6" fill="url(#center1)" opacity="0.9"/>
                <circle r="3" fill="#C9A84C"/>
              </g>
            </g>

            {/* ─── FLOWER 5: Anemone (second from right) ─── */}
            <g transform="translate(710 598) scale(0.98)" className="bloom" style={{ animationDelay: '1.4s' }}>
              <path d="M0 0 C -3 -52 4 -118 2 -192" stroke="#7A9E7E" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
              <path d="M2 -88 C 19 -104 32 -94 23 -78 C 15 -72 4 -80 2 -88 Z" fill="#8FB48A" opacity="0.8"/>
              <path d="M2 -88 C -16 -102 -28 -93 -19 -78 C -11 -72 -1 -80 2 -88 Z" fill="#7A9E7E" opacity="0.7"/>
              <path d="M2 -142 C 15 -155 26 -147 18 -133 C 11 -128 3 -135 2 -142 Z" fill="#8FB48A" opacity="0.65"/>
              <g transform="translate(2 -212)" className="sway-slow" style={{ animationDelay: '1.8s' }}>
                {/* Large flat petals */}
                {[0,45,90,135,180,225,270,315].map((a,i) => (
                  <path key={i} d={`M0 0 C ${-10} ${-28} ${-8} ${-58} 0 ${-70} C ${8} ${-58} ${10} ${-28} 0 0 Z`}
                    fill={i%2===0?"url(#pg2)":"url(#pg3)"} opacity="0.88"
                    transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}/>
                ))}
                {/* Vein lines */}
                {[0,45,90,135,180,225,270,315].map((a,i) => (
                  <line key={i} x1="0" y1="-5" x2="0" y2="-60" stroke="#D4A898" strokeWidth="0.6" opacity="0.4"
                    transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}/>
                ))}
                {/* Dark centre disc */}
                <circle r="13" fill="#2A1A24" opacity="0.85"/>
                <circle r="9" fill="#3A2230" opacity="0.9"/>
                {/* Stamen dots ring */}
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
                  <circle key={i} cx={Math.sin(a*Math.PI/180)*9} cy={-Math.cos(a*Math.PI/180)*9} r="1.5" fill="#C9A84C" opacity="0.9"/>
                ))}
                <circle r="4" fill="#C9A84C" opacity="0.7"/>
              </g>
            </g>

            {/* ─── FLOWER 6: Ranunculus (right) ─── */}
            <g transform="translate(875 593) scale(1.08)" className="bloom" style={{ animationDelay: '1.8s' }}>
              <path d="M0 0 C 4 -55 -3 -120 1 -198" stroke="#8AAE8A" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M1 -92 C 22 -108 35 -98 25 -82 C 17 -76 3 -85 1 -92 Z" fill="#9EC49E" opacity="0.8"/>
              <path d="M1 -92 C -19 -107 -32 -97 -22 -82 C -14 -76 -1 -85 1 -92 Z" fill="#8AAE8A" opacity="0.7"/>
              <path d="M1 -148 C 16 -162 29 -153 21 -138 C 14 -133 3 -141 1 -148 Z" fill="#9EC49E" opacity="0.65"/>
              {/* Ranunculus — layered concentric rings */}
              <g transform="translate(1 -218)" className="sway" style={{ animationDelay: '2.1s' }}>
                {/* Outermost ring */}
                {[0,40,80,120,160,200,240,280,320].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-26" rx="14" ry="28" fill={i%2===0?"url(#pg3)":"#F0E0C8"} opacity="0.75" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Second ring */}
                {[20,60,100,140,180,220,260,300,340].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-20" rx="11" ry="21" fill="url(#pg3)" opacity="0.85" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Third ring */}
                {[0,51,102,153,204,255,306].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-13" rx="8" ry="15" fill="#D4A878" opacity="0.9" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                {/* Innermost */}
                {[0,72,144,216,288].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-8" rx="6" ry="10" fill="#C49060" opacity="0.95" transform={`rotate(${a})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}/>
                ))}
                <circle r="6" fill="url(#center1)"/>
                <circle r="3.5" fill="#B08030"/>
              </g>
            </g>
          </svg>

          {/* Centered Hero Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen md:min-h-[90vh] lg:min-h-screen px-4">
            <p 
              className="text-xs tracking-[0.55em] uppercase text-white/95 mb-4 select-none"
              style={{ 
                animation: 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              {heroBadge}
            </p>
            
            <h1 
              className="text-5xl md:text-7xl lg:text-[10rem] leading-none tracking-tight text-brand-heading font-serif"
              style={{ 
                animation: 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
                opacity: 0
              }}
            >
              {heroTitle1} <span className="font-script text-[1.2em] text-brand-accent block md:inline-block md:-ml-3 mt-1 md:mt-0 font-normal">{heroTitle2}</span> {heroTitle3}
            </h1>
            
            <p 
              className="text-sm md:text-base lg:text-lg italic text-white/90 mt-4 mb-8 px-4 font-serif select-none"
              style={{ 
                animation: 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards', 
                opacity: 0 
              }}
            >
              "{heroTagline}"
            </p>
            
            <div 
              className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center"
              style={{ 
                animation: 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards', 
                opacity: 0 
              }}
            >
              <button
                onClick={() => navigate('/shop')}
                className="group relative overflow-hidden inline-flex items-center gap-3 bg-brand-accent hover:bg-brand-accent-hover text-white min-h-[44px] px-8 md:px-12 py-4.5 rounded-full text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-accent/20 animate-none cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {heroCta}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
                <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>

          {/* 2. MARQUEE TICKER (Repositioned below the button, above the scroll indicator) */}
          {marqueeVisible && (
            <div 
              className="relative z-20 w-full bg-[#F5EDE6]/60 backdrop-blur-sm border-y border-[#C9A84C]/35 py-2.5 overflow-hidden select-none mt-12 md:absolute md:bottom-24 md:mt-0"
              style={{ 
                animation: 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards',
                opacity: 0
              }}
            >
              <div className="marquee-track flex whitespace-nowrap text-brand-heading text-xs tracking-wider">
                <div className="flex shrink-0">
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>{offerText}</span>
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>Handcrafted with Love</span>
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>Fresh Blooms, Preserved Memories</span>
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>New Arrivals Every Week</span>
                </div>
                <div className="flex shrink-0">
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>{offerText}</span>
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>Handcrafted with Love</span>
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>Fresh Blooms, Preserved Memories</span>
                  <span className="px-8 inline-flex items-center gap-8"><span className="text-[#C9A84C]">✦</span>New Arrivals Every Week</span>
                </div>
              </div>
            </div>
          )}

          {/* Luxury Scroll-down Indicator */}
          <div 
            className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-brand-heading/45 select-none"
            style={{ 
              animation: 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards', 
              opacity: 0 
            }}
          >
            <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-medium">Scroll</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </section>
      </div>

      {/* 3. OUR COLLECTIONS */}
      <section id="collections" className="pt-16 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-[42px] font-serif text-brand-heading text-center">
            {collectionsTitle}
          </h2>
          <span className="section-underline" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {collectionBanners.map((col) => (
            <Link
              key={col.slug}
              to={`/shop?collection=${col.slug}`}
              className="collection-card group relative overflow-hidden rounded-2xl aspect-square ring-1 ring-transparent hover:ring-[#C9A84C] transition-all duration-500"
            >
              {/* Image */}
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Bottom Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-cream via-brand-cream/60 to-transparent" />
              {/* Centered Collection Name */}
              <h3 className="absolute bottom-5 inset-x-0 text-center font-serif text-xl text-brand-heading">
                {col.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. MOST LOVED ARRANGEMENTS */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif text-brand-heading text-center">
            {featuredSectionTitle}
          </h2>
          <p className="mt-3 text-2xl text-brand-body font-script">
            {featuredSectionSubtitle}
          </p>
        </div>

        {/* Displaying first 4 products */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.slice(0, featuredCount).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 5. TRUST BADGES */}
      <section className="py-20 bg-[#F3ECE3] relative overflow-hidden w-full flex items-center justify-center">
        {/* Floating background SVGs rotated on left and right */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none hidden md:block -rotate-12">
          <svg width="35" height="45" viewBox="0 0 32 32" fill="none">
            <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z" fill="#E2C8C4"></path>
          </svg>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none hidden md:block rotate-12">
          <svg width="45" height="55" viewBox="0 0 32 32" fill="none">
            <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z" fill="#C6D2BE"></path>
          </svg>
        </div>

        <div className="text-center max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-[42px] font-serif text-brand-heading mb-6 leading-tight">
            Every Arrangement is a Work of<br />Art.
          </h2>
          
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {badges.map((badge, idx) => (
              <div 
                key={idx} 
                className="inline-flex items-center gap-2 bg-[#FCFAF8] border border-brand-border/40 rounded-full px-5 py-2.5 text-xs font-normal tracking-wide text-brand-heading shadow-sm"
              >
                {badge.icon}
                <span>{badge.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FROM OUR GARDEN (Corrected floral Images) */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-4xl text-brand-heading font-script">
            From Our Garden
          </p>
        </div>

        {/* Masonry mixed grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Card 1: Tall on Desktop */}
          <div className="md:row-span-2 col-span-1 rounded-2xl overflow-hidden shadow-sm group relative">
            <img
              src={gardenImages[0]}
              alt="Garden Floral 1"
              className="w-full h-full object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-accent/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </div>
          </div>
          {/* Card 2 */}
          <div className="rounded-2xl overflow-hidden shadow-sm group relative">
            <img
              src={gardenImages[1]}
              alt="Garden Floral 2"
              className="w-full h-full object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-accent/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </div>
          </div>
          {/* Card 3 */}
          <div className="rounded-2xl overflow-hidden shadow-sm group relative">
            <img
              src={gardenImages[2]}
              alt="Garden Floral 3"
              className="w-full h-full object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-accent/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </div>
          </div>
          {/* Card 4 */}
          <div className="rounded-2xl overflow-hidden shadow-sm group relative">
            <img
              src={gardenImages[3]}
              alt="Garden Floral 4"
              className="w-full h-full object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-accent/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </div>
          </div>
          {/* Card 5 */}
          <div className="rounded-2xl overflow-hidden shadow-sm group relative">
            <img
              src={gardenImages[4]}
              alt="Garden Floral 5"
              className="w-full h-full object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-accent/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </div>
          </div>
          {/* Card 6 */}
          <div className="rounded-2xl overflow-hidden shadow-sm group relative">
            <img
              src={gardenImages[5]}
              alt="Garden Floral 6"
              className="w-full h-full object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-accent/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-brand-heading text-brand-heading rounded-full px-6 py-3 text-sm hover:bg-brand-heading hover:text-white transition"
          >
            Follow us @fuzzysoftstudio
            {/* Arrow Right SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </a>
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="py-20 bg-[#F3ECE3] w-full relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-heading text-center">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(dynamicTestimonials.length > 0 ? dynamicTestimonials : testimonials).map((t, idx) => (
              <div
                key={idx}
                className="bg-[#F6EBE2] border-l-4 border-[#74876E] rounded-r-2xl p-7 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1 text-[#C9A84C] mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-current" />
                    ))}
                  </div>
                  <p className="font-serif text-base text-brand-heading/90 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <p className="font-sans text-[11px] font-semibold tracking-widest text-brand-heading/70 uppercase mt-auto">
                  — {t.name.toUpperCase()}{(t as any).location ? `, ${(t as any).location}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER (Full-width custom sage green section) */}
      <section className="py-20 bg-[#4E5E47] relative overflow-hidden w-full text-center">
        {/* Floating background leaves */}
        <svg className="absolute top-10 left-12 opacity-10 pointer-events-none fill-white" width="50" height="50" viewBox="0 0 32 32">
          <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z"></path>
        </svg>
        <svg className="absolute bottom-10 right-20 opacity-10 pointer-events-none fill-white" width="70" height="70" viewBox="0 0 32 32">
          <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z"></path>
        </svg>
        <svg className="absolute top-24 right-1/4 opacity-10 pointer-events-none fill-white" width="40" height="40" viewBox="0 0 32 32">
          <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z"></path>
        </svg>
        <svg className="absolute bottom-16 left-1/4 opacity-10 pointer-events-none fill-white" width="40" height="40" viewBox="0 0 32 32">
          <path d="M16 2 C 22 8, 28 14, 16 30 C 4 14, 10 8, 16 2 Z"></path>
        </svg>

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl sm:text-[45px] font-script text-white mb-4">
            Join the Garden
          </h2>
          <p className="font-sans text-sm text-white/90 mb-8 max-w-md mx-auto leading-relaxed">
            Get exclusive offers, new arrivals & floral inspiration straight to your inbox.
          </p>

          {newsletterSubscribed ? (
            <div className="bg-[#F5EDE6]/10 text-white border border-white/20 rounded-full py-3.5 px-8 inline-block font-sans font-medium text-sm animate-fade-in">
              Thank you for subscribing! Welcome to our studio.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-grow px-5 py-3.5 rounded-full bg-[#F5EDE6] border-none focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm font-sans text-brand-heading placeholder-brand-heading/50"
              />
               <button
                type="submit"
                className="bg-[#C9A84C] hover:bg-[#B5944A] text-white transition-all duration-300 font-sans text-xs tracking-wider uppercase font-semibold py-3.5 px-8 rounded-full active:scale-95 whitespace-nowrap shadow-md hover:shadow-lg"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
