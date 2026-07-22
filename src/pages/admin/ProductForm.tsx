import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Check } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';
import Toggle from '../../components/ui/Toggle';

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { products, setProducts, categories, showToast, loadProducts } = useOutletContext<AdminContext>();
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const mode = id ? 'edit' : 'add';

  useEffect(() => {
    const fetchDbCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        setDbCategories(data || []);
      } catch (err) {
        console.warn('Failed to load categories table:', err);
      }
    };
    fetchDbCategories();
  }, []);

  // Basic Information
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [category, setCategory] = useState('');
  const [collection, setCollection] = useState('everyday-luxury');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [craftingTime, setCraftingTime] = useState('2-3 Days to handcraft');

  // SEO & URL Slug
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);

  // Descriptions & Texts
  const [description, setDescription] = useState('');
  const [careInstructions, setCareInstructions] = useState('Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.');
  const [deliveryInfo, setDeliveryInfo] = useState('Lucknow: 5–10 business days. Rest of India: 7–14 business days.');

  // Badges & Tags
  const [badges, setBadges] = useState<string[]>([]);
  const [customBadge, setCustomBadge] = useState('');

  // Image Uploads (6 Slots)
  const [imageUrls, setImageUrls] = useState<string[]>(Array(6).fill(''));
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [originalProduct, setOriginalProduct] = useState<any>(null);

  const presetBadges = ['100% Handcrafted', 'Long-lasting Bloom', 'Customizable Order', 'Allergen & Pet Safe', 'Best Seller', 'New Arrival'];

  // Initialize Category
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Load existing product details on Edit Mode
  useEffect(() => {
    let active = true;
    if (mode === 'edit' && id) {
      const loadProduct = async () => {
        // Try finding locally first
        let product = products.find(p => p.id === id);
        
        // Fallback: fetch from Supabase
        if (!product) {
          try {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', id)
              .single();
            if (data && !error) {
              product = data;
            }
          } catch (err) {
            console.error('Failed to fetch product directly:', err);
          }
        }
        
        if (product && active) {
          setOriginalProduct(product);
          setName(product.name || '');
          setPrice(product.price?.toString() || '');
          setCompareAtPrice(product.compare_at_price?.toString() || '');
          setCategory(product.category || categories[0] || '');
          setCollection(product.collection || 'everyday-luxury');
          setStock(product.stock?.toString() || '0');
          setSku(product.sku || '');
          setCraftingTime(product.crafting_time || '2-3 Days to handcraft');
          
          setIsActive(product.active);
          setIsFeatured(product.is_featured || false);

          setSlug(product.slug || '');
          setMetaTitle(product.meta_title || '');
          setMetaDescription(product.meta_description || '');
          setDescription(product.description || '');
          setCareInstructions(product.care_instructions || 'Dust with soft dry cloth. Keep away from direct sunlight. Do not wash or wet. Store in cool dry place.');
          setDeliveryInfo(product.delivery_info || 'Lucknow: 5–10 business days. Rest of India: 7–14 business days.');
          setBadges(product.badges || []);

          const urls = Array(6).fill('');
          if (product.image) urls[0] = product.image;
          if (product.images) {
            product.images.forEach((img, idx) => {
              if (idx < 6) urls[idx] = img;
            });
          }
          setImageUrls(urls);
        }
      };
      loadProduct();
    }
    return () => {
      active = false;
    };
  }, [mode, id, products, categories]);

  // Handle URL slug generation
  const handleGenerateSlugAndSEO = () => {
    if (!name) return;
    const computedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug(computedSlug);
    setMetaTitle(`${name} | Fuzzy Soft Studio`);
    setMetaDescription(`Shop ${name} at Fuzzy Soft Studio. Premium handcrafted crochet flowers and customized collections.`);
  };

  const handleGenerateSku = () => {
    const prefix = category?.substring(0, 3)?.toUpperCase() || 'FSS';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  // WebP conversion logic
  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          }, 'image/webp', 0.85); // 0.85 WebP quality
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Image upload logic
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!name) {
      showToast('Please enter a product name first to generate a stable URL.', 'error');
      return;
    }

    setUploadingSlot(slotIndex);
    showToast('Compressing and uploading image...', 'success');

    try {
      const webpBlob = await convertToWebP(file);
      const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const fixedName = slotIndex === 0 
        ? `product-${productSlug}-hero.webp` 
        : `product-${productSlug}-${slotIndex + 1}.webp`;
      const filePath = `products/${fixedName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fixedName}`);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      setImageUrls(prev => {
        const updated = [...prev];
        updated[slotIndex] = publicUrl;
        return updated;
      });

      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!name) {
      showToast('Please enter a product name first to generate a stable URL.', 'error');
      return;
    }

    setUploadingSlot(slotIndex);
    showToast('Compressing and uploading dropped image...', 'success');

    try {
      const webpBlob = await convertToWebP(file);
      const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const fixedName = slotIndex === 0 
        ? `product-${productSlug}-hero.webp` 
        : `product-${productSlug}-${slotIndex + 1}.webp`;
      const filePath = `products/${fixedName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fixedName}`);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      setImageUrls(prev => {
        const updated = [...prev];
        updated[slotIndex] = publicUrl;
        return updated;
      });

      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Image drop upload failed:', err);
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeleteImage = (slotIndex: number) => {
    setImageUrls(prev => {
      const updated = [...prev];
      updated[slotIndex] = '';
      return updated;
    });
  };

  // Badge list modifiers
  const handleToggleBadge = (badge: string) => {
    if (badges.includes(badge)) {
      setBadges(badges.filter(b => b !== badge));
    } else {
      setBadges([...badges, badge]);
    }
  };

  const handleAddCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customBadge.trim();
    if (trimmed && !badges.includes(trimmed)) {
      setBadges([...badges, trimmed]);
      setCustomBadge('');
    }
  };

  // Form Submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return showToast('Product Name is required', 'error');
    if (!price || parseFloat(price) <= 0) return showToast('Price must be greater than 0', 'error');
    if (!imageUrls[0]) return showToast('Hero image (Slot 1) is required', 'error');

    const matchedCategory = dbCategories.find(c => c.name === category);
    const categoryId = matchedCategory ? matchedCategory.id : null;

    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let productData: any = {};
    if (mode === 'add') {
      productData = {
        name: name.trim(),
        slug: productSlug,
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        category,
        category_id: categoryId,
        collection,
        stock: parseInt(stock) || 0,
        sku: sku.trim() || null,
        low_stock_threshold: 5,
        active: isActive,
        is_active: isActive,
        is_featured: isFeatured,
        show_in_related: true,
        image: imageUrls[0],
        image_url: imageUrls[0],
        images: imageUrls.filter(Boolean),
        bullet_points: badges.slice(0, 4),
        badges,
        care_instructions: careInstructions.trim(),
        delivery_info: deliveryInfo.trim(),
        description: description.trim() || 'Handcrafted luxury arrangement.',
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        crafting_time: craftingTime.trim() || '2-3 Days to handcraft'
      };
    } else {
      productData = {
        name: name.trim() || originalProduct?.name || '',
        slug: productSlug || originalProduct?.slug || '',
        price: !isNaN(parseFloat(price)) ? parseFloat(price) : (originalProduct?.price || 0),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        category: category || originalProduct?.category || '',
        category_id: categoryId || originalProduct?.category_id || null,
        collection: collection || originalProduct?.collection || 'everyday-luxury',
        stock: !isNaN(parseInt(stock)) ? parseInt(stock) : (originalProduct?.stock || 0),
        sku: sku.trim() || null,
        low_stock_threshold: 5,
        active: isActive,
        is_active: isActive,
        is_featured: isFeatured,
        show_in_related: true,
        image: imageUrls[0] || originalProduct?.image || '',
        image_url: imageUrls[0] || originalProduct?.image_url || '',
        images: imageUrls.filter(Boolean).length > 0 ? imageUrls.filter(Boolean) : (originalProduct?.images || []),
        bullet_points: badges.length > 0 ? badges.slice(0, 4) : (originalProduct?.bullet_points || []),
        badges: badges.length > 0 ? badges : (originalProduct?.badges || []),
        care_instructions: careInstructions.trim() || originalProduct?.care_instructions || '',
        delivery_info: deliveryInfo.trim() || originalProduct?.delivery_info || '',
        description: description.trim() || originalProduct?.description || 'Handcrafted luxury arrangement.',
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        crafting_time: craftingTime.trim() || '2-3 Days to handcraft'
      };
    }

    try {
      if (mode === 'add') {
        const newId = `p-${Date.now()}`;
        const finalProduct = { id: newId, ...productData };
        let { error } = await supabase.from('products').insert(finalProduct);
        
        if (error && (error.message.includes('image_url') || error.message.includes('crafting_time'))) {
          // Retry without missing columns
          const { image_url, crafting_time, ...retryData } = finalProduct;
          const retryRes = await supabase.from('products').insert(retryData);
          error = retryRes.error;
        }
        
        if (error) throw error;

        setProducts([finalProduct, ...products]);
        loadProducts().catch(err => console.warn('Background refetch failed:', err));
        showToast('Saved successfully!', 'success');
      } else {
        let { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
          
        if (error && (error.message.includes('image_url') || error.message.includes('crafting_time'))) {
          // Retry without missing columns
          const { image_url, crafting_time, ...retryData } = productData;
          const retryRes = await supabase
            .from('products')
            .update(retryData)
            .eq('id', id);
          error = retryRes.error;
        }
        
        if (error) throw error;

        setProducts(products.map(p => p.id === id ? { ...p, ...productData } : p));
        loadProducts().catch(err => console.warn('Background refetch failed:', err));
        showToast('Saved successfully!', 'success');
      }
      navigate('/admin/products');
    } catch (err: any) {
      console.error('SUPABASE SAVE PRODUCT FAILURE:', err);
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center select-none">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="text-xs font-semibold tracking-wide text-brand-body/60 hover:text-brand-accent flex items-center gap-1.5 cursor-pointer uppercase transition-colors"
        >
          &larr; Back to Catalog
        </button>
      </div>

      <form onSubmit={handleSaveProduct} className="space-y-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: General Information & Details (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* A: Basic Information */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-5">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">
                Basic Information
              </h3>

              {/* Product Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Product Name *</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateSlugAndSEO} 
                    className="text-[10px] text-brand-accent hover:underline uppercase font-bold"
                  >
                    Auto Generate SEO / Slug
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lavender Lullaby"
                  className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                />
              </div>

              {/* Price & Compare-at Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Compare-At Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="Original price for discount"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                  />
                </div>
              </div>

              {/* Categories & Collections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Collection *</label>
                  <select
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer"
                  >
                    <option value="bridal-blooms">Bridal Blooms</option>
                    <option value="everyday-luxury">Everyday Luxury</option>
                    <option value="seasonal-picks">Seasonal Picks</option>
                    <option value="gift-bouquets">Gift Bouquets</option>
                  </select>
                </div>
              </div>

              {/* Stock, SKU & Crafting Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">SKU</label>
                    <button 
                      type="button" 
                      onClick={handleGenerateSku} 
                      className="text-[10px] text-brand-accent hover:underline uppercase font-bold"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. BOU-4310"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Crafting Time</label>
                  <input
                    type="text"
                    value={craftingTime}
                    onChange={(e) => setCraftingTime(e.target.value)}
                    placeholder="e.g. 2-3 Days to handcraft"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition"
                  />
                </div>
              </div>
            </div>

            {/* C: Description */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Description</h3>
              <div className="space-y-1.5">
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the arrangement, materials used (soft acrylic yarn, wire support), style details..."
                  rows={6}
                  className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition resize-none"
                />
              </div>
            </div>

            {/* D: Care Instructions */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Care Instructions</h3>
              <div className="space-y-1.5">
                <textarea
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="Dust with soft dry cloth..."
                  rows={3}
                  className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition resize-none"
                />
              </div>
            </div>

            {/* E: Delivery Info */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">Delivery Info</h3>
              <div className="space-y-1.5">
                <textarea
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  placeholder="Standard shipping rates, timelines..."
                  rows={3}
                  className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Media, Badges, Features & SEO (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* B: Images */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">
                Images (6 Slots)
              </h3>
              <p className="text-[10px] text-brand-body/50 uppercase tracking-widest font-sans font-bold">
                Slot 1 is the primary listing hero. Drag & Drop supported.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {imageUrls.map((url, idx) => (
                  <div 
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`relative aspect-[3/4] border rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all bg-white/40 ${
                      url ? 'border-brand-border' : 'border-dashed border-brand-border/80 hover:border-brand-accent/60'
                    }`}
                  >
                    {url ? (
                      <>
                        <img src={url} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute top-1 right-1 bg-red-150 text-red-650 p-1 rounded-full shadow-xs active:scale-95 transition cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center text-brand-body/50 hover:text-brand-accent">
                        <Upload size={16} className="mb-1 opacity-70" />
                        <span className="text-[8px] font-sans font-bold uppercase tracking-wider block">
                          {uploadingSlot === idx ? 'Uploading...' : `Slot ${idx + 1}`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, idx)}
                          className="hidden"
                          disabled={uploadingSlot !== null}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* F: Badges */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">
                Highlights & Badges
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {presetBadges.map((badge) => {
                  const selected = badges.includes(badge);
                  return (
                    <button
                      type="button"
                      key={badge}
                      onClick={() => handleToggleBadge(badge)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-pointer transition active:scale-95 flex items-center gap-1 ${
                        selected 
                          ? 'bg-brand-accent text-white border-brand-accent' 
                          : 'bg-white border-brand-border/50 text-brand-body/70 hover:bg-brand-cream'
                      }`}
                    >
                      {selected && <Check size={10} />}
                      <span>{badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Tag */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  placeholder="Custom Tag"
                  className="flex-1 h-9 px-3 bg-white rounded-xl border border-brand-border/60 text-xs font-sans focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomBadge}
                  className="h-9 px-4 bg-brand-cream border border-brand-border text-brand-heading hover:bg-brand-border/20 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center shrink-0"
                >
                  Add
                </button>
              </div>

              {/* Custom Badges Render */}
              {badges.filter(b => !presetBadges.includes(b)).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-brand-border/20">
                  <span className="text-[9px] font-sans font-semibold uppercase tracking-wider block text-brand-body/60">Custom Badges:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {badges.filter(b => !presetBadges.includes(b)).map(badge => (
                      <span key={badge} className="px-2 py-0.5 bg-brand-cream/80 text-brand-heading border border-brand-border rounded-md text-[9px] font-medium flex items-center gap-1">
                        <span>{badge}</span>
                        <button type="button" onClick={() => handleToggleBadge(badge)} className="text-red-500 hover:text-red-700">
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* G: Visibility & Features */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">
                Visibility & Features
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-brand-heading">Catalog Visibility</span>
                    <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">Publish immediately to the store</span>
                  </div>
                  <Toggle checked={isActive} onChange={setIsActive} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-brand-heading">Featured Bouquet</span>
                    <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">Show in the homepage featured slider</span>
                  </div>
                  <Toggle checked={isFeatured} onChange={setIsFeatured} />
                </div>
              </div>
            </div>



            {/* H: SEO Details Accordion */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl shadow-xs backdrop-blur-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setSeoOpen(!seoOpen)}
                className="w-full px-6 py-4 flex justify-between items-center bg-white/40 border-b border-brand-border/10 cursor-pointer font-serif text-sm font-bold text-brand-heading"
              >
                <span>SEO & URL Configurations</span>
                <span>{seoOpen ? '▲' : '▼'}</span>
              </button>

              {seoOpen && (
                <div className="p-6 space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">URL Slug</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      placeholder="lavender-lullaby"
                      className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/60 text-xs font-sans font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Meta Title</label>
                      <span className="text-[9px] text-brand-body/50 font-mono">{metaTitle.length} / 60</span>
                    </div>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value.slice(0, 60))}
                      placeholder="Lavender Lullaby - Handcrafted Crochet Flower | FSS"
                      className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/60 text-xs font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Meta Description</label>
                      <span className="text-[9px] text-brand-body/50 font-mono">{metaDescription.length} / 160</span>
                    </div>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                      placeholder="Shop this beautiful hand-knitted lavender flower arrangement today."
                      rows={3}
                      className="w-full p-3 bg-white rounded-xl border border-brand-border/60 text-xs font-sans resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Submit Footer Row */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-brand-border/25 text-xs font-semibold uppercase tracking-wider select-none">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
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
