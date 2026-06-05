import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';

interface AdminProductFormProps {
  mode: 'add' | 'edit';
  initialData?: any;
  categories: string[];
  onSubmit: (productData: any) => Promise<void>;
  onCancel: () => void;
  uploadingIndex: number | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number) => Promise<void>;
}

export default function AdminProductForm({
  mode,
  initialData,
  categories,
  onSubmit,
  onCancel,
  uploadingIndex,
  onImageUpload
}: AdminProductFormProps) {
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodCategory, setProdCategory] = useState(categories[0] || 'Bouquets');
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

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setProdName(initialData.name || '');
      setProdPrice(initialData.price?.toString() || '');
      setProdStock(initialData.stock?.toString() || '10');
      setProdCategory(initialData.category || categories[0] || 'Bouquets');
      setProdCollection(initialData.collection || 'everyday-luxury');
      setProdImage(initialData.image || '');
      setProdImage2(initialData.images && initialData.images[1] ? initialData.images[1] : '');
      setProdImage3(initialData.images && initialData.images[2] ? initialData.images[2] : '');
      setProdImage4(initialData.images && initialData.images[3] ? initialData.images[3] : '');
      setProdBullet1(initialData.bullet_points && initialData.bullet_points[0] ? initialData.bullet_points[0] : '100% Handcrafted');
      setProdBullet2(initialData.bullet_points && initialData.bullet_points[1] ? initialData.bullet_points[1] : 'Long-lasting Bloom');
      setProdBullet3(initialData.bullet_points && initialData.bullet_points[2] ? initialData.bullet_points[2] : 'Customizable Order');
      setProdBullet4(initialData.bullet_points && initialData.bullet_points[3] ? initialData.bullet_points[3] : 'Allergen & Pet Safe');
      setProdCareInstructions(initialData.care_instructions || 'Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.');
      setProdDeliveryInfo(initialData.delivery_info || 'Lucknow: 5–10 business days. Rest of India: 7–14 business days.');
      setProdDescription(initialData.description || '');
      setProdActive(initialData.active !== undefined ? initialData.active : true);
    }
  }, [mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: prodName.trim(),
      price: parseFloat(prodPrice),
      stock: parseInt(prodStock),
      category: prodCategory,
      collection: prodCollection,
      image: prodImage,
      images: [prodImage, prodImage2, prodImage3, prodImage4].filter(Boolean),
      bullet_points: [prodBullet1, prodBullet2, prodBullet3, prodBullet4].filter(Boolean),
      care_instructions: prodCareInstructions,
      delivery_info: prodDeliveryInfo,
      description: prodDescription,
      active: prodActive
    };
    await onSubmit(productData);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center select-none">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold tracking-wide text-brand-body/60 hover:text-brand-accent flex items-center gap-1.5 cursor-pointer uppercase transition-colors"
        >
          &larr; Back to Catalog
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 sm:p-8 shadow-xs backdrop-blur-xs space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left side: Basic Details (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">
              {mode === 'edit' && initialData ? `Edit Product: ${initialData.name}` : 'Arrangement Details'}
            </h3>

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
                  onChange={(e) => setProdPrice(e.target.value)}
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
                  onChange={(e) => setProdStock(e.target.value)}
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
                id="prodActiveForm"
                checked={prodActive}
                onChange={(e) => setProdActive(e.target.checked)}
                className="w-4 h-4 accent-brand-accent cursor-pointer"
              />
              <label htmlFor="prodActiveForm" className="text-xs font-semibold uppercase tracking-wider text-brand-heading cursor-pointer">
                {mode === 'add' ? 'Publish to Catalog immediately' : 'Catalog visibility active'}
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
                      onChange={(e) => onImageUpload(e, 1)}
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
                      onChange={(e) => onImageUpload(e, 2)}
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
                      onChange={(e) => onImageUpload(e, 3)}
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
                      onChange={(e) => onImageUpload(e, 4)}
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
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                  <img src={prodImage} className="w-full h-full object-cover" alt="Preview 1" />
                </div>
              )}
              {prodImage2 && (
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                  <img src={prodImage2} className="w-full h-full object-cover" alt="Preview 2" />
                </div>
              )}
              {prodImage3 && (
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                  <img src={prodImage3} className="w-full h-full object-cover" alt="Preview 3" />
                </div>
              )}
              {prodImage4 && (
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-cream/35">
                  <img src={prodImage4} className="w-full h-full object-cover" alt="Preview 4" />
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
            onClick={onCancel}
            className="px-8 h-11 bg-white hover:bg-brand-cream/40 text-brand-heading border border-brand-border rounded-full cursor-pointer transition active:scale-95 text-center flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full cursor-pointer shadow-xs transition active:scale-95 text-center flex items-center justify-center"
          >
            {mode === 'add' ? 'Create Product Entry' : 'Save Product Edits'}
          </button>
        </div>
      </form>
    </div>
  );
}
