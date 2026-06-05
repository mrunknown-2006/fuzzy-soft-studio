import { Link } from 'react-router-dom';
import { HeartCrack, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { WishlistItem as WishlistItemType } from '../store/useStore';

export default function Wishlist() {
  const wishlist = useStore((state) => state.wishlist);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const addToCart = useStore((state) => state.addToCart);
  const showToast = useStore((state) => state.showToast);

  const handleAddToCart = (item: WishlistItemType) => {
    // Add to cart only — item stays in wishlist
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description
    }, 1);

    showToast(`${item.name} added to cart!`, 'success');
  };

  const handleRemove = (item: WishlistItemType) => {
    toggleWishlist(item);
    showToast(`${item.name} removed from wishlist.`, 'success');
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen pt-16 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full select-none animate-fade-in-up">
        <div className="bg-white border border-brand-border/40 p-6 rounded-full text-brand-accent shadow-xs mb-6 bloom">
          <HeartCrack className="w-12 h-12" strokeWidth={1.2} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-4 leading-tight">
          Your Wishlist is Empty
        </h1>
        <p className="text-sm text-brand-body/75 mb-8 max-w-md font-sans">
          You haven't favorited any luxury arrangements yet. Add items to your wishlist while shopping to save them here.
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
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-2">My Wishlist</h1>
        <div className="h-0.5 w-16 bg-[#C9A84C] mt-2 mx-auto lg:mx-0"></div>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start w-full">
        {wishlist.map((item) => (
          <div 
            key={item.id} 
            className="bg-white/60 border border-brand-border/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full group"
          >
            {/* Image link */}
            <div className="relative aspect-[3/4] bg-brand-cream overflow-hidden border-b border-brand-border/25 shrink-0 select-none">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
              />
            </div>

            {/* Info and Actions */}
            <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-sm sm:text-base font-bold text-brand-heading truncate">
                  {item.name}
                </h3>
                <div className="font-sans font-semibold text-xs sm:text-sm text-brand-heading">
                  ₹{item.price.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 select-none">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full h-9 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-[10px] tracking-wider font-semibold transition duration-300 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={12} />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="w-full h-9 border border-brand-border bg-white hover:bg-brand-cream text-brand-body/70 hover:text-red-500 rounded-full uppercase text-[10px] tracking-wider font-semibold transition duration-300 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
