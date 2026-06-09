import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { WishlistItem } from '../store/useStore';
import type { Product } from '../data/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const navigate = useNavigate();

  // Zustand state
  const addToCart = useStore((state) => state.addToCart);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const wishlist = useStore((state) => state.wishlist);

  const wished = wishlist.some((item) => item.id === product.id);
  const outOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      slug: product.slug
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product as WishlistItem);
  };

  const handleWhatsAppEnquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let whatsappNum = '916386422660';
    try {
      const local = localStorage.getItem('fuzzy-soft-studio-settings');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.whatsapp_number) {
          const digits = parsed.whatsapp_number.replace(/[^0-9]/g, '');
          whatsappNum = digits.length === 10 ? '91' + digits : digits || '916386422660';
        }
      }
    } catch {}
    const message = `Hello! I'm interested in ${product.name} (₹${product.price}). Is it available?`;
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCardClick = () => {
    navigate(`/product/${product.slug}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative p-3 border border-transparent hover:border-[#C9A84C] hover:bg-white/40 hover:shadow-lg rounded-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
    >
      <div>
        {/* Product Image Box */}
        <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-brand-cream select-none">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Out of Stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="text-white text-xs font-semibold tracking-wider uppercase">Out of Stock</span>
            </div>
          )}

          {/* WhatsApp Enquiry Button */}
          <button
            type="button"
            onClick={handleWhatsAppEnquiry}
            className="absolute bottom-3.5 left-3.5 w-8.5 h-8.5 grid place-items-center rounded-full shadow-sm bg-white/95 text-[#25D366] hover:bg-white cursor-pointer hover:scale-105 transition-all duration-300 z-10"
            aria-label="Enquire on WhatsApp"
            title="Enquire on WhatsApp"
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>

          {/* Wishlist Toggle Heart inside Image */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3.5 right-3.5 w-8.5 h-8.5 grid place-items-center rounded-full shadow-sm bg-white/95 text-brand-heading hover:text-brand-accent cursor-pointer hover:scale-105 transition-all duration-300 z-10"
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={15}
              className={`transition-colors duration-300 ${
                wished ? 'fill-red-500 text-red-500' : 'text-brand-heading'
              }`}
            />
          </button>
        </div>

        {/* Details */}
        <div className="mt-3.5">
          <h3 className="font-serif text-base text-brand-heading font-medium">
            {product.name}
          </h3>
          <p className="text-[11px] text-brand-body/60 line-clamp-2 leading-relaxed mt-0.5">
            {product.description}
          </p>
        </div>
      </div>
      
      {/* Price and Cart Row — responsive side-by-side / icon on mobile, elegant pill on desktop */}
      <div className="mt-3.5 flex items-center justify-between gap-2 select-none">
        {/* Price */}
        <span className="font-serif text-sm sm:text-[15px] font-semibold text-brand-heading tracking-wide shrink-0">
          ₹{product.price.toLocaleString('en-IN')}
        </span>

        {/* Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          aria-label={outOfStock ? 'Out of Stock' : isAdded ? 'Added to cart' : 'Add to cart'}
          className={`flex items-center justify-center transition-all duration-300 active:scale-95 select-none shrink-0 ${
            outOfStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed rounded-full w-8.5 h-8.5 sm:w-auto sm:px-4 sm:py-2 text-[10px] font-bold uppercase tracking-[0.15em]'
              : isAdded
              ? 'bg-[#C9A84C] text-white shadow-md rounded-full w-8.5 h-8.5 sm:w-auto sm:px-4 sm:py-2 text-[10px] font-bold uppercase tracking-[0.15em] scale-[0.98]'
              : 'bg-[#DCA29A] text-white hover:bg-[#C8857C] hover:shadow-md cursor-pointer rounded-full w-8.5 h-8.5 sm:w-auto sm:px-4 sm:py-2 text-[10px] font-bold uppercase tracking-[0.15em]'
          }`}
        >
          {outOfStock ? (
            <>
              <ShoppingBag size={13} className="sm:hidden" />
              <span className="hidden sm:inline">Out of Stock</span>
            </>
          ) : isAdded ? (
            <>
              <span className="text-xs sm:hidden font-bold">✓</span>
              <span className="hidden sm:inline">✓ Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={13} className="sm:hidden" />
              <span className="hidden sm:inline">Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
