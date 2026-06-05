import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { products as staticProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabaseClient';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState<any[]>(staticProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<string[]>(['Bouquets', 'Arrangements', 'Gift Boxes', 'Dried Flowers']);

  // Fetch shop items and categories
  useEffect(() => {
    const loadShopData = async () => {
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
          setProducts([...data, ...filteredStatic]);
        } else {
          setProducts(staticProducts);
        }
      } catch (err) {
        console.warn('Failed to load products in Shop from Supabase:', err);
        setProducts(staticProducts);
      }

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'store_categories')
          .single();
        if (error) throw error;
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed)) {
            setDbCategories(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load categories list from settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadShopData();
  }, []);

  // Read URL parameters
  const searchQueryParam = searchParams.get('search') || '';
  const categoryQueryParam = searchParams.get('category') || 'all';
  const collectionQueryParam = searchParams.get('collection') || '';
  const maxPriceQueryParam = searchParams.get('maxPrice') || '3000';
  const sortQueryParam = searchParams.get('sort') || 'featured';

  // Local state for the price range slider to prevent rendering lag
  const [localMaxPrice, setLocalMaxPrice] = useState(Number(maxPriceQueryParam));

  // Sync local slider with URL param updates (e.g. resetting)
  useEffect(() => {
    setLocalMaxPrice(Number(maxPriceQueryParam));
  }, [maxPriceQueryParam]);

  // Update URL helper
  const updateURL = (newParams: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    setSearchParams(current, { replace: true });
  };

  // Debounced URL updates for the range slider
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMaxPrice.toString() !== maxPriceQueryParam) {
        updateURL({ maxPrice: localMaxPrice === 3000 ? null : localMaxPrice.toString() });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localMaxPrice, maxPriceQueryParam]);

  // Handle Category Filter Click
  const handleCategoryClick = (categorySlug: string) => {
    updateURL({ 
      category: categorySlug === 'all' ? null : categorySlug,
      // Clear collection param when switching categories to keep things clean
      collection: null 
    });
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Search term filter (from navbar search box if applicable)
        if (searchQueryParam) {
          const query = searchQueryParam.toLowerCase();
          const matchName = prod.name.toLowerCase().includes(query);
          const matchDesc = prod.description.toLowerCase().includes(query);
          if (!matchName && !matchDesc) return false;
        }

        // Category filter (text links list)
        if (categoryQueryParam !== 'all') {
          const formattedCategory = prod.category.toLowerCase().replace(/\s+/g, '-');
          if (formattedCategory !== categoryQueryParam) return false;
        }

        // Collection filter (from navbar dropdowns)
        if (collectionQueryParam) {
          if (prod.collection !== collectionQueryParam) return false;
        }

        // Max Price range filter
        if (maxPriceQueryParam) {
          const max = parseFloat(maxPriceQueryParam);
          if (!isNaN(max) && prod.price > max) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortQueryParam === 'price-low') {
          return a.price - b.price;
        }
        if (sortQueryParam === 'price-high') {
          return b.price - a.price;
        }
        // default: featured (newest)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : (a.dateAdded ? new Date(a.dateAdded).getTime() : 0);
        const dateB = b.created_at ? new Date(b.created_at).getTime() : (b.dateAdded ? new Date(b.dateAdded).getTime() : 0);
        return dateB - dateA;
      });
  }, [searchQueryParam, categoryQueryParam, collectionQueryParam, maxPriceQueryParam, sortQueryParam, products]);

  const categories = useMemo(() => {
    const list = dbCategories.map(catName => ({
      name: catName,
      slug: catName.toLowerCase().replace(/\s+/g, '-')
    }));
    return [{ name: 'All', slug: 'all' }, ...list];
  }, [dbCategories]);

  // Render the Sidebar Filter Layout
  const renderSidebarFilters = () => (
    <div className="space-y-10 pr-2">
      {/* 1. Category list links */}
      <div>
        <h3 className="text-sm uppercase tracking-[0.15em] text-brand-heading font-serif font-bold mb-4 select-none">
          Category
        </h3>
        <div className="flex flex-col space-y-3.5">
          {categories.map((cat) => {
            const isActive = categoryQueryParam === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => {
                  handleCategoryClick(cat.slug);
                  setIsMobileFiltersOpen(false);
                }}
                className={`text-left text-sm font-sans tracking-wide transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'text-brand-accent font-semibold scale-[1.02]' 
                    : 'text-brand-body/80 hover:text-brand-accent hover:pl-1'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1.5. Collections filter */}
      <div>
        <h3 className="text-sm uppercase tracking-[0.15em] text-brand-heading font-serif font-bold mb-4 select-none">
          Collections
        </h3>
        <div className="flex flex-col space-y-3.5">
          {[
            { label: 'All Collections', value: '' },
            { label: 'Bridal Blooms', value: 'bridal-blooms' },
            { label: 'Everyday Luxury', value: 'everyday-luxury' },
            { label: 'Seasonal Picks', value: 'seasonal-picks' },
            { label: 'Gift Bouquets', value: 'gift-bouquets' },
          ].map((col) => {
            const isActive = collectionQueryParam === col.value;
            return (
              <button
                key={col.value || 'all'}
                onClick={() => {
                  updateURL({ collection: col.value || '' });
                  setIsMobileFiltersOpen(false);
                }}
                className={`text-left text-sm font-sans tracking-wide transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-brand-accent font-semibold scale-[1.02]'
                    : 'text-brand-body/80 hover:text-brand-accent hover:pl-1'
                }`}
              >
                {col.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Max Price range slider */}
      <div>
        <h3 className="text-sm uppercase tracking-[0.15em] text-brand-heading font-serif font-bold mb-4 select-none">
          Max Price
        </h3>
        <div className="space-y-3">
          <input
            type="range"
            min="500"
            max="3000"
            step="100"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
            className="w-full accent-brand-accent cursor-pointer h-1.5 bg-brand-border rounded-lg appearance-none"
          />
          <div className="text-xs text-brand-body/75 font-sans font-medium">
            Up to ₹{localMaxPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 3. Sort Select */}
      <div>
        <h3 className="text-sm uppercase tracking-[0.15em] text-brand-heading font-serif font-bold mb-4 select-none">
          Sort
        </h3>
        <div className="relative w-full">
          <select
            value={sortQueryParam}
            onChange={(e) => updateURL({ sort: e.target.value })}
            className="w-full appearance-none bg-transparent border border-brand-border/60 hover:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-heading focus:outline-none transition cursor-pointer font-sans"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-heading">
            <ChevronDown size={14} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] text-brand-body/50 font-sans tracking-wide mb-6 mt-2 select-none animate-fade-in-up">
        <Link to="/" className="hover:text-brand-accent transition-colors">Home</Link>
        <span>/</span>
        <span className="text-brand-heading font-medium">Shop</span>
      </div>

      {/* Page Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-serif text-brand-heading mb-2 font-medium">
          Our Collection
        </h1>
        <p className="text-lg font-script text-[#8FA088] text-2xl select-none italic">
          blooms for every story
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start w-full flex-1">
        {/* Left Sidebar Filter (Desktop) - No background container */}
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-32">
          {renderSidebarFilters()}
        </aside>

        {/* Right Product Grid */}
        <main className="flex-1 w-full">
          {/* Mobile Filter Controls Bar (Visible only on mobile/tablet) */}
          <div className="lg:hidden flex items-center justify-between border-b border-brand-border pb-4 mb-6">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex items-center gap-2 border border-brand-border bg-white rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider text-brand-heading transition cursor-pointer shadow-sm active:scale-95"
            >
              <SlidersHorizontal size={13} />
              <span>Filter & Sort</span>
              {(categoryQueryParam !== 'all' || maxPriceQueryParam !== '3000' || sortQueryParam !== 'featured' || collectionQueryParam) && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent inline-block"></span>
              )}
            </button>
            <span className="text-xs text-brand-body/60 font-sans font-medium select-none">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'arrangement' : 'arrangements'}
            </span>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white/60 border border-brand-border/40 rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] bg-brand-cream/80" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-brand-cream rounded w-3/4" />
                    <div className="h-3 bg-brand-cream rounded w-1/2" />
                    <div className="h-8 bg-brand-cream/60 rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            /* Beautiful Empty State */
            <div className="bg-white/35 backdrop-blur-sm border border-brand-border/20 rounded-3xl p-12 text-center max-w-xl mx-auto mt-12 flex flex-col items-center shadow-sm">
              <div className="mb-6 bg-white border border-brand-border p-6 rounded-full text-brand-accent shadow-sm animate-pulse">
                <SlidersHorizontal className="w-10 h-10" strokeWidth={1.2} />
              </div>
              <h2 className="text-2xl font-serif text-brand-heading mb-3">
                No Arrangements Found
              </h2>
              <p className="text-sm text-brand-body/75 mb-8 max-w-sm leading-relaxed">
                We couldn't find any floral designs matching your selected search or filter settings. Try resetting the filters.
              </p>
              <button
                onClick={() => {
                  setSearchParams(new URLSearchParams(), { replace: true });
                  setLocalMaxPrice(3000);
                }}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white transition-all duration-300 font-sans text-xs tracking-widest uppercase font-semibold py-3 px-8 rounded-full shadow-md active:scale-95 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Side-Drawer */}
      {/* Backdrop */}
      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileFiltersOpen(false)}
        />
      )}

      {/* Sliding Drawer Container */}
      <div
        className={`fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-brand-cream z-50 shadow-2xl p-6 transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-6 shrink-0">
          <span className="font-serif text-lg text-brand-heading font-semibold">
            Filter & Sort
          </span>
          <button
            onClick={() => setIsMobileFiltersOpen(false)}
            className="text-brand-heading hover:text-brand-accent transition p-1 cursor-pointer"
            aria-label="Close Filters"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          {renderSidebarFilters()}
        </div>
      </div>
    </div>
  );
}
