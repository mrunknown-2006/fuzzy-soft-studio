import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Percent, Plus, Trash2, Calendar } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';
import Toggle from '../../components/ui/Toggle';

interface Coupon {
  id?: string;
  code: string;
  percent: number;
  expiry?: string;
  limit?: number;
  active?: boolean;
  min_order_value?: number;
}

export default function Discounts() {
  const { discountCodes, setDiscountCodes, showToast } = useOutletContext<AdminContext>();

  // State
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);
  const [newDiscountExpiry, setNewDiscountExpiry] = useState('');
  const [newDiscountLimit, setNewDiscountLimit] = useState('');
  const [newDiscountMinOrderValue, setNewDiscountMinOrderValue] = useState('');
  const [newDiscountActive, setNewDiscountActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Cast discountCodes safely
  const coupons = useMemo<Coupon[]>(() => {
    return (discountCodes || []).map(d => ({
      ...d,
      active: d.active !== undefined ? d.active : true
    }));
  }, [discountCodes]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newDiscountCode.replace(/\s/g, '').toUpperCase();
    if (!cleanCode) return showToast('Enter a valid discount code', 'error');
    if (newDiscountPercent < 1 || newDiscountPercent > 100) {
      return showToast('Percent must be between 1 and 100', 'error');
    }

    const exists = coupons.some(d => d.code.toLowerCase() === cleanCode.toLowerCase());
    if (exists) return showToast('Discount code already exists', 'error');

    setLoading(true);
    
    const newCouponDb = {
      code: cleanCode,
      value: newDiscountPercent,
      expiry_date: newDiscountExpiry || null,
      max_uses: newDiscountLimit ? parseInt(newDiscountLimit) : null,
      is_active: newDiscountActive,
      min_order_value: newDiscountMinOrderValue ? parseFloat(newDiscountMinOrderValue) : null,
      discount_type: 'percentage'
    };

    try {
      const { data, error } = await supabase
        .from('discounts')
        .insert(newCouponDb)
        .select()
        .single();
      console.log('Discount CRUD result (create):', data, error);
      
      if (error) throw error;

      if (data) {
        const newCoupon: Coupon = {
          id: data.id,
          code: data.code,
          percent: data.value,
          expiry: data.expiry_date,
          limit: data.max_uses,
          active: data.is_active,
          min_order_value: data.min_order_value
        };
        setDiscountCodes([newCoupon, ...discountCodes]);
      }

      setNewDiscountCode('');
      setNewDiscountPercent(10);
      setNewDiscountExpiry('');
      setNewDiscountLimit('');
      setNewDiscountMinOrderValue('');
      setNewDiscountActive(true);
      showToast('Discount code created successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to create coupon: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCouponActive = async (index: number) => {
    const target = coupons[index];
    try {
      const { data, error } = await supabase
        .from('discounts')
        .update({ is_active: !target.active })
        .eq('code', target.code)
        .select();
      console.log('Discount CRUD result (toggle):', data, error);
      if (error) throw error;

      const updated = discountCodes.map((c, idx) => {
        if (idx === index) {
          return { ...c, active: !c.active };
        }
        return c;
      });
      setDiscountCodes(updated);
      showToast('Coupon status updated', 'success');
    } catch (err: any) {
      showToast(`Failed to update coupon status: ${err.message}`, 'error');
    }
  };

  const handleDeleteDiscount = async (code: string) => {
    if (!window.confirm(`Delete discount code ${code}?`)) return;
    try {
      const { data, error } = await supabase
        .from('discounts')
        .delete()
        .eq('code', code)
        .select();
      console.log('Discount CRUD result (delete):', data, error);
      if (error) throw error;

      const updated = discountCodes.filter(d => d.code !== code);
      setDiscountCodes(updated);
      showToast('Discount code deleted', 'success');
    } catch (err: any) {
      showToast(`Failed to delete coupon: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create New Coupon (5 Columns) */}
        <div className="lg:col-span-5 bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4 sticky top-6">
          <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
            <Percent size={16} className="text-[#C9A84C]" />
            <span>Create Coupon</span>
          </h3>

          <form onSubmit={handleCreateDiscount} className="space-y-4">
            {/* Code Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Code *</label>
              <input
                type="text"
                required
                value={newDiscountCode}
                onChange={(e) => setNewDiscountCode(e.target.value.replace(/\s/g,'').toUpperCase())}
                placeholder="e.g. BLOOM20"
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs"
              />
            </div>

            {/* Discount % */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Discount Percentage *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={newDiscountPercent}
                  onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                  className="w-full h-11 pl-4 pr-8 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs"
                />
                <span className="absolute right-3 top-3 text-brand-body/60 text-sm font-bold">%</span>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Expiry Date (Optional)</label>
              <div className="relative">
                <input
                  type="date"
                  value={newDiscountExpiry}
                  onChange={(e) => setNewDiscountExpiry(e.target.value)}
                  className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition cursor-pointer shadow-xs"
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Usage Limit (Optional)</label>
              <input
                type="number"
                min={1}
                value={newDiscountLimit}
                onChange={(e) => setNewDiscountLimit(e.target.value)}
                placeholder="e.g. 50 total uses"
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs"
              />
            </div>

            {/* Minimum Order Value */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Min Order Value (Optional)</label>
              <input
                type="number"
                min={0}
                value={newDiscountMinOrderValue}
                onChange={(e) => setNewDiscountMinOrderValue(e.target.value)}
                placeholder="e.g. 499 (leaves empty if none)"
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-xs"
              />
            </div>

            {/* Active Switcher */}
            <div className="flex items-center justify-between bg-brand-cream/15 p-3 rounded-xl border border-brand-border/10 select-none">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-heading">Coupon Active</span>
                <span className="text-[9px] text-brand-body/50 block font-sans">Enable code usage immediately</span>
              </div>
              <Toggle checked={newDiscountActive} onChange={setNewDiscountActive} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs hover:shadow-sm cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>{loading ? 'Creating...' : 'Create Code'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Coupons Listing Table (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center select-none pl-1">
            <h3 className="font-serif text-lg font-bold text-brand-heading">Active Coupons</h3>
            <span className="text-xs text-brand-body/60 font-sans font-semibold">
              Total {coupons.length} codes
            </span>
          </div>

          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                    <th className="pb-3 pr-2">Code</th>
                    <th className="pb-3 px-2 text-right">Discount</th>
                    <th className="pb-3 px-2 text-center">Expiry</th>
                    <th className="pb-3 px-2 text-center">Limit</th>
                    <th className="pb-3 px-2 text-right">Min Order</th>
                    <th className="pb-3 px-2 text-center">Status</th>
                    <th className="pb-3 pl-2 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                  {coupons.map((coupon, idx) => {
                    const isExpired = coupon.expiry && new Date(coupon.expiry) < new Date();
                    const statusText = isExpired ? 'Expired' : coupon.active ? 'Active' : 'Inactive';
                    
                    return (
                      <tr key={idx} className="hover:bg-brand-cream/35 transition-colors">
                        <td className="py-4 pr-2 font-mono font-bold text-brand-heading tracking-widest text-sm uppercase">
                          {coupon.code}
                        </td>
                        <td className="py-4 px-2 text-right font-semibold text-brand-heading">
                          {coupon.percent}% Off
                        </td>
                        <td className="py-4 px-2 text-center text-brand-body/60 font-sans">
                          {coupon.expiry ? (
                            <span className="flex items-center justify-center gap-1">
                              <Calendar size={11} className="opacity-60" />
                              {new Date(coupon.expiry).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          ) : (
                            <span className="text-brand-body/40 italic">Never</span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center font-mono text-brand-body/60">
                          {coupon.limit ? `${coupon.limit} uses` : 'Unlimited'}
                        </td>
                        <td className="py-4 px-2 text-right font-semibold text-brand-heading">
                          {coupon.min_order_value ? `₹${coupon.min_order_value.toLocaleString('en-IN')}` : 'None'}
                        </td>
                        <td className="py-4 px-2 text-center select-none" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[7px] border ${
                              isExpired 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : coupon.active 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-gray-100 text-gray-500 border-gray-300'
                            }`}>
                              {statusText}
                            </span>
                            {!isExpired && (
                              <div className="scale-75 mt-0.5">
                                <Toggle checked={!!coupon.active} onChange={() => handleToggleCouponActive(idx)} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pl-2 text-right select-none">
                          <button
                            onClick={() => handleDeleteDiscount(coupon.code)}
                            className="text-brand-body/40 hover:text-red-500 p-1.5 hover:scale-105 transition cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={13} strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-brand-body/55 italic">
                        No coupons defined yet. Add one on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
