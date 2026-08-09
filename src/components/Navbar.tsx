import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Menu, X, Search, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png?v=2');
  const [mobileLogoUrl, setMobileLogoUrl] = useState<string>('');
  const navigate = useNavigate();

  const cart = useStore((state) => state.cart);
  const wishlist = useStore((state) => state.wishlist);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'general')
          .single();
        if (data?.value) {
          if (data.value.mobile_logo_url || data.value.mobile_logo) {
            setMobileLogoUrl(data.value.mobile_logo_url || data.value.mobile_logo);
          }
          if (data.value.store_logo_url || data.value.footer_logo_url) {
            setLogoUrl(data.value.store_logo_url || data.value.footer_logo_url);
          }
        }
      } catch (err) {
        console.warn('Navbar could not load logo from DB:', err);
      }
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape key closes search overlay
  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate('/shop?search=' + encodeURIComponent(searchQuery.trim()));
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-150 ease-out border-b ${
          isScrolled 
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md shadow-sm py-1.5 border-brand-border/40' 
            : 'bg-transparent backdrop-blur-[2px] py-2 border-transparent'
        }`}
      >
        <div className="mx-auto max-w-[90rem] px-3 sm:px-6 lg:px-8 flex items-center justify-between min-h-[5.5rem] lg:min-h-[6rem] py-2">
          
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start items-center pl-0 ml-0 shrink-0">
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center select-none shrink-0 justify-start h-16 sm:h-20 lg:h-24 w-auto max-w-[280px] sm:max-w-[360px] py-1"
            >
              {/* Desktop Version */}
              <img 
                src={logoUrl || "/logo.png?v=2"} 
                alt="Fuzzy Soft Studio" 
                decoding="async"
                loading="eager"
                fetchPriority="high"
                className="hidden md:block h-full w-auto object-contain mix-blend-multiply contrast-125 brightness-95 drop-shadow-sm [image-rendering:_crisp-edges] [image-rendering:_-webkit-optimize-contrast]" 
              />
              {/* Mobile Version — Dedicated Admin Mobile Image Only (Maximized Size & Impact) */}
              <img 
                src={mobileLogoUrl || logoUrl || "/logo.png?v=2"} 
                alt="Fuzzy Soft Studio" 
                decoding="async"
                loading="eager"
                fetchPriority="high"
                className="block md:hidden h-16 sm:h-18 max-h-20 w-auto object-contain scale-110 origin-left mix-blend-multiply contrast-125 brightness-95 drop-shadow-sm [image-rendering:_crisp-edges] [image-rendering:_-webkit-optimize-contrast] py-0 my-0" 
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10 text-[13px] tracking-wide uppercase text-brand-heading font-sans font-normal">
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="nav-link"
            >
              Home
            </Link>
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/about" className="nav-link">Our Story</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </nav>

          {/* Right: Desktop Icons */}
          <div className="flex-1 flex items-center gap-5 justify-end text-brand-heading">
            <button 
              onClick={() => setSearchOpen(true)} 
              className="hover:text-brand-accent transition p-1"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <Link
              to="/wishlist"
              className="relative hover:text-brand-accent transition p-1"
              aria-label="Wishlist"
            >
              <Heart size={18} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative hover:text-brand-accent transition p-1"
              aria-label="Cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              className="relative hover:text-brand-accent transition p-1"
              aria-label="Account"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1"
              aria-label="Menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center pt-24 animate-fade-in"
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery('');
          }}
          style={{ animation: 'fadeOverlay 0.2s ease forwards' }}
        >
          <div
            className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl px-6 py-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-4 right-4 text-brand-body/60 hover:text-brand-accent transition p-1"
              aria-label="Close Search"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            <label className="block text-[10px] uppercase tracking-widest font-semibold text-brand-body/60 mb-3 font-sans">
              Search Arrangements
            </label>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search arrangements..."
              className="w-full h-12 px-4 pr-12 bg-brand-cream border border-brand-border/60 rounded-xl text-sm font-sans text-brand-heading focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
            />
            <p className="text-[10px] text-brand-body/40 mt-3 font-sans">
              Press Enter to search · Esc to close
            </p>
          </div>
        </div>
      )}

      {/* Mobile Menu Side-drawer overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Side-drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[360px] bg-[#FAF7F2] border-l border-[#EAE3DA] z-50 shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EAE3DA] pb-4 mb-6">
            <img 
              src={mobileLogoUrl || logoUrl || "/logo.png?v=2"} 
              alt="Fuzzy Soft Studio" 
              className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply contrast-125 brightness-95" 
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-[#EFE8DD] flex items-center justify-center text-brand-heading hover:text-brand-accent transition-all duration-300 cursor-pointer"
              aria-label="Close Menu"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col space-y-3.5">
            <Link
              to="/"
              className="font-serif text-base font-medium tracking-wide text-brand-heading hover:text-brand-accent transition-colors duration-300 py-1.5 border-b border-[#EAE3DA]/50"
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </Link>

            <Link
              to="/shop"
              className="font-serif text-base font-medium tracking-wide text-brand-heading hover:text-brand-accent transition-colors duration-300 py-1.5 border-b border-[#EAE3DA]/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Shop
            </Link>

            <Link
              to="/about"
              className="font-serif text-base font-medium tracking-wide text-brand-heading hover:text-brand-accent transition-colors duration-300 py-1.5 border-b border-[#EAE3DA]/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Story
            </Link>

            <Link
              to="/contact"
              className="font-serif text-base font-medium tracking-wide text-brand-heading hover:text-brand-accent transition-colors duration-300 py-1.5 border-b border-[#EAE3DA]/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>

            <Link
              to="/wishlist"
              className="font-serif text-base font-medium tracking-wide text-brand-heading hover:text-brand-accent transition-colors duration-300 py-1.5 border-b border-[#EAE3DA]/50 flex items-center justify-between"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="bg-[#EFE8DD] text-[#8C7A6B] text-[11px] font-bold px-2 py-0.5 rounded-full font-sans">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              className="font-serif text-base font-medium tracking-wide text-brand-heading hover:text-brand-accent transition-colors duration-300 py-1.5 border-b border-[#EAE3DA]/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Account
            </Link>
          </nav>
        </div>

        {/* Footer Micro-Copy */}
        <div className="pt-4 border-t border-[#EAE3DA] text-center select-none">
          <p className="font-serif text-xs italic text-brand-body/60">
            Handcrafted with love — Fuzzy Soft Studio
          </p>
        </div>
      </div>
    </>
  );
}
