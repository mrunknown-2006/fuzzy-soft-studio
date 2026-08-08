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



  const handleCardClick = () => {
    navigate(`/product/${product.slug}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-[#FAF7F2] p-1.5 sm:p-2 rounded-[1.5rem] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-[#EAE3DA] hover:border-[#C9A84C]/40 transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
    >
      <div>
        {/* Product Image Box - Maximized Warm Ivory Canvas */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[4/5] bg-brand-cream select-none">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Out of Stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="text-white text-xs font-semibold tracking-wider uppercase">Out of Stock</span>
            </div>
          )}

          {/* Wishlist Toggle Heart inside Image */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-8 h-8 sm:w-8.5 sm:h-8.5 grid place-items-center rounded-full shadow-sm bg-white/95 text-brand-heading hover:text-brand-accent cursor-pointer hover:scale-105 transition-all duration-300 z-10"
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
        <div className="px-1.5 sm:px-2 pb-1 pt-2.5">
          <h3 className="font-serif text-sm md:text-base text-brand-heading font-medium line-clamp-2">
            {product.name}
          </h3>
          <p className="hidden md:block text-[11px] text-brand-body/60 line-clamp-2 leading-relaxed mt-0.5">
            {product.short_summary || product.description}
          </p>
        </div>
      </div>
      
      {/* Price and Cart Row — responsive side-by-side / icon on mobile, elegant pill on desktop */}
      <div className="px-1.5 sm:px-2 pb-1.5 mt-2 flex items-center justify-between gap-2 select-none">
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
