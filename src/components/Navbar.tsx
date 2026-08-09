import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Menu, X, Search, User } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const cart = useStore((state) => state.cart);
  const wishlist = useStore((state) => state.wishlist);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

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
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 border-b ${
          isScrolled 
            ? 'bg-brand-bg/95 backdrop-blur-md shadow-sm py-2 border-brand-border/40' 
            : 'bg-transparent backdrop-blur-none py-4 border-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-between h-20">
          
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start">
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 py-1 select-none"
            >
              <img 
                src="/logo.png?v=2" 
                alt="Fuzzy Soft Studio" 
                className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply" 
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
            <span className="font-script text-3xl text-brand-heading leading-none">
              Fuzzy Soft Studio
            </span>
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
