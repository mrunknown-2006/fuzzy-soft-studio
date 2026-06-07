import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import type { AdminContext } from './types';
import type { SupabaseProduct } from '../../types/database';
import { supabase } from '../../lib/supabaseClient';

export default function Products() {
  const navigate = useNavigate();
  const { products, setProducts, showToast } = useOutletContext<AdminContext>();

  // State
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'newest'>('newest');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [inlineEditStock, setInlineEditStock] = useState<{ id: string; value: string } | null>(null);
  const [inlineEditPrice, setInlineEditPrice] = useState<{ id: string; value: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  // Filter and sort products
  const filteredAdminProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(p => p.active);
    } else if (statusFilter === 'draft') {
      result = result.filter(p => !p.active);
    }

    // Sort
    switch (productSort) {
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'stock-asc': result.sort((a, b) => a.stock - b.stock); break;
      case 'newest': 
      default:
        // @ts-ignore
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }
    return result;
  }, [products, productSearch, productSort, statusFilter]);

  // Bulk actions
  const handleBulkActivate = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: true, is_active: true })
        .in('id', selectedProducts);
      if (error) throw error;

      setProducts(products.map(p => selectedProducts.includes(p.id) ? { ...p, active: true, is_active: true } : p));
      setSelectedProducts([]);
      showToast(`Activated ${selectedProducts.length} products`, 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: false, is_active: false })
        .in('id', selectedProducts);
      if (error) throw error;

      setProducts(products.map(p => selectedProducts.includes(p.id) ? { ...p, active: false, is_active: false } : p));
      setSelectedProducts([]);
      showToast(`Deactivated ${selectedProducts.length} products`, 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProducts.length} products? This cannot be undone.`)) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);
      if (error) throw error;

      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      showToast(`Deleted ${selectedProducts.length} products`, 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  // Inline edits
  const handleSaveInlinePrice = async (product: SupabaseProduct, val: string) => {
    const newPrice = parseFloat(val);
    if (isNaN(newPrice) || newPrice <= 0) { 
      setInlineEditPrice(null); 
      return; 
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', product.id);
      if (error) throw error;

      setProducts(products.map(p => p.id === product.id ? { ...p, price: newPrice } : p));
      showToast(`Price updated to ₹${newPrice}`, 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setInlineEditPrice(null);
    }
  };

  const handleSaveInlineStock = async (product: SupabaseProduct, val: string) => {
    const newStock = parseInt(val);
    if (isNaN(newStock) || newStock < 0) { 
      setInlineEditStock(null); 
      return; 
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);
      if (error) throw error;

      setProducts(products.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      showToast(`Stock updated to ${newStock} items`, 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setInlineEditStock(null);
    }
  };

  const handleToggleProductActive = async (product: SupabaseProduct) => {
    const newActiveState = !product.active;
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: newActiveState, is_active: newActiveState })
        .eq('id', product.id);
      if (error) throw error;

      setProducts(products.map(p => p.id === product.id ? { ...p, active: newActiveState, is_active: newActiveState } : p));
      showToast(`Product ${newActiveState ? 'activated' : 'deactivated'}`, 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      showToast('Product deleted successfully', 'success');
    } catch (err: any) {
      showToast(`Failed to delete product: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Search + Sort + Status Filter Tabs */}
      <div className="flex flex-col gap-4">
        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={productSearch} 
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="flex-1 h-10 px-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent shadow-xs" 
          />
          <select 
            value={productSort} 
            onChange={e => setProductSort(e.target.value as any)}
            className="h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer shadow-xs shrink-0"
          >
            <option value="newest">Newest First</option>
            <option value="name-asc">Name A→Z</option>
            <option value="name-desc">Name Z→A</option>
            <option value="price-asc">Price Low→High</option>
            <option value="price-desc">Price High→Low</option>
            <option value="stock-asc">Stock Low→High</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex justify-between items-center select-none flex-wrap gap-3">
          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest font-sans">
            {(['all', 'active', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 h-8 rounded-full border transition-all cursor-pointer ${
                  statusFilter === tab 
                    ? 'bg-brand-heading text-white border-brand-heading shadow-xs' 
                    : 'bg-white border-brand-border/60 hover:bg-brand-cream'
                }`}
              >
                {tab === 'all' ? 'All Products' : tab === 'active' ? 'Active / Published' : 'Drafts / Hidden'}
              </button>
            ))}
          </div>
          <span className="text-xs text-brand-body/65 font-sans font-semibold">
            Found {filteredAdminProducts.length} arrangements
          </span>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-accent/15 border border-brand-accent/30 rounded-xl text-xs font-sans animate-fade-in">
          <span className="font-semibold text-brand-heading">{selectedProducts.length} selected</span>
          <button onClick={handleBulkActivate} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold cursor-pointer transition">Activate</button>
          <button onClick={handleBulkDeactivate} className="px-3 py-1 bg-gray-500 hover:bg-gray-650 text-white rounded-full font-semibold cursor-pointer transition">Deactivate</button>
          <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-500 hover:bg-red-650 text-white rounded-full font-semibold cursor-pointer transition">Delete</button>
          <button onClick={() => setSelectedProducts([])} className="text-brand-accent hover:underline font-semibold cursor-pointer ml-auto">Clear Selection</button>
        </div>
      )}

      {/* Header action */}
      <div className="flex justify-between items-center select-none pt-2">
        <h3 className="font-serif text-lg font-bold text-brand-heading">Product Catalog</h3>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="px-5 h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full flex items-center gap-2 cursor-pointer shadow-xs text-xs font-semibold uppercase tracking-wider transition active:scale-95"
        >
          <Plus size={14} />
          <span>Add Arrangement</span>
        </button>
      </div>

      {filteredAdminProducts.length === 0 ? (
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 text-center space-y-4 shadow-xs backdrop-blur-xs select-none">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h4 className="font-serif text-lg text-brand-heading">No Products Found</h4>
          <p className="text-xs text-brand-body/80 max-w-md mx-auto leading-relaxed">
            There are no arrangements matching your filters. Try adjusting your search query, sorting option, or create a new product from scratch.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                    <th className="pb-3 pr-2 w-8">
                      <input 
                        type="checkbox" 
                        className="cursor-pointer accent-brand-accent"
                        checked={selectedProducts.length === filteredAdminProducts.length && filteredAdminProducts.length > 0}
                        onChange={e => setSelectedProducts(e.target.checked ? filteredAdminProducts.map(p => p.id) : [])}
                      />
                    </th>
                    <th className="pb-3 pr-2">Arrangement</th>
                    <th className="pb-3 px-2">SKU</th>
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
                        <input 
                          type="checkbox" 
                          className="cursor-pointer accent-brand-accent"
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
                      <td className="py-4 px-2 font-mono text-[10px] text-brand-body/60">{p.sku || 'N/A'}</td>
                      <td className="py-4 px-2 text-brand-body/80">{p.category}</td>
                      <td className="py-4 px-2 text-right font-semibold text-brand-heading">
                        {inlineEditPrice?.id === p.id ? (
                          <input 
                            type="number" 
                            autoFocus 
                            value={inlineEditPrice.value}
                            onChange={e => setInlineEditPrice({ id: p.id, value: e.target.value })}
                            onBlur={() => handleSaveInlinePrice(p, inlineEditPrice.value)}
                            onKeyDown={e => { 
                              if (e.key === 'Enter') handleSaveInlinePrice(p, inlineEditPrice.value); 
                              if (e.key === 'Escape') setInlineEditPrice(null); 
                            }}
                            className="w-20 px-2 py-1 border border-brand-accent rounded text-xs font-sans focus:outline-none text-right" 
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:text-brand-accent transition group flex items-center justify-end gap-1"
                            onClick={() => setInlineEditPrice({ id: p.id, value: String(p.price) })} 
                            title="Click to edit price"
                          >
                            ₹{p.price.toLocaleString('en-IN')}
                            <Edit2 size={9} className="opacity-0 group-hover:opacity-50" />
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center select-none font-semibold">
                        {inlineEditStock?.id === p.id ? (
                          <input 
                            type="number" 
                            autoFocus 
                            value={inlineEditStock.value}
                            onChange={e => setInlineEditStock({ id: p.id, value: e.target.value })}
                            onBlur={() => handleSaveInlineStock(p, inlineEditStock.value)}
                            onKeyDown={e => { 
                              if (e.key === 'Enter') handleSaveInlineStock(p, inlineEditStock.value); 
                              if (e.key === 'Escape') setInlineEditStock(null); 
                            }}
                            className="w-16 px-2 py-1 border border-brand-accent rounded text-xs font-sans focus:outline-none text-center" 
                          />
                        ) : (
                          <span 
                            className={`cursor-pointer hover:text-brand-accent transition group flex items-center justify-center gap-1 ${
                              p.stock <= (p.low_stock_threshold || 5) ? 'text-red-500 font-bold' : 'text-brand-heading'
                            }`}
                            onClick={() => setInlineEditStock({ id: p.id, value: String(p.stock) })} 
                            title="Click to edit stock"
                          >
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
                      <td className="py-4 pl-2 text-right select-none animate-none">
                        <div className="flex justify-end gap-2.5">
                          <Link
                            to={`/admin/products/edit/${p.id}`}
                            className="text-brand-accent hover:text-brand-accent-hover p-1.5 hover:scale-105 transition"
                            title="Edit product"
                          >
                            <Edit2 size={13} strokeWidth={1.8} />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-brand-body/40 hover:text-red-500 p-1.5 hover:scale-105 transition cursor-pointer"
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

          {/* Mobile Card Layout - <768px */}
          <div className="block md:hidden space-y-4">
            {filteredAdminProducts.map((p) => (
              <div 
                key={p.id} 
                className="bg-white border border-brand-border/40 rounded-2xl p-4 shadow-sm flex gap-4 items-start relative hover:border-brand-accent/35 transition"
              >
                {/* Checkbox */}
                <div className="absolute top-4 left-4 z-10 bg-white/95 rounded p-1 shadow-xs border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    className="cursor-pointer accent-brand-accent w-4 h-4"
                    checked={selectedProducts.includes(p.id)}
                    onChange={e => setSelectedProducts(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                  />
                </div>

                {/* Left: Image */}
                <div className="w-20 h-24 rounded-xl bg-brand-cream overflow-hidden border border-brand-border/30 shrink-0 select-none">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>

                {/* Right: Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-serif text-sm font-bold text-brand-heading truncate">{p.name}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] shrink-0 border ${
                      p.active 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-250'
                    }`}>
                      {p.active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-body/50 font-mono truncate">{p.sku || 'No SKU'}</p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1.5 text-xs">
                    <div>
                      <span className="text-[9px] text-brand-body/50 block font-sans uppercase">Price</span>
                      <span className="font-bold text-brand-heading">₹{p.price}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-brand-body/50 block font-sans uppercase">Stock</span>
                      <span className={`font-semibold ${
                        p.stock <= (p.low_stock_threshold || 5) ? 'text-red-500 font-bold' : 'text-brand-heading'
                      }`}>{p.stock} units</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-2 border-t border-brand-border/10 mt-2">
                    <Link
                      to={`/admin/products/edit/${p.id}`}
                      className="px-3 py-1 bg-brand-cream border border-brand-border text-brand-heading hover:bg-brand-border/20 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Edit2 size={10} />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="px-3 py-1 border border-red-200 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={10} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
