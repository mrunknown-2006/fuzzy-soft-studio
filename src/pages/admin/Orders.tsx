import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { FileText, Search, X, Truck, User, DollarSign, Edit2, Printer } from 'lucide-react';
import type { AdminContext } from './types';
import type { SupabaseOrder } from '../../types/database';
import { supabase } from '../../lib/supabaseClient';

export default function Orders() {
  const { orders, setOrders, showToast } = useOutletContext<AdminContext>();
  const location = useLocation();

  // State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered'>('All');
  const [viewingOrder, setViewingOrder] = useState<SupabaseOrder | null>(null);
  
  // Drawer edits
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [updatingTracking, setUpdatingTracking] = useState(false);

  // Handle route state redirection (from Dashboard "Manage" link)
  useEffect(() => {
    if (location.state && (location.state as any).selectOrderId) {
      const selectId = (location.state as any).selectOrderId;
      const match = orders.find(o => o.order_id === selectId);
      if (match) {
        setViewingOrder(match);
        setOrderFilter('All');
      }
    }
  }, [location.state, orders]);

  // Load tracking & notes when viewingOrder changes
  useEffect(() => {
    if (viewingOrder) {
      setTrackingNumber(viewingOrder.tracking_number || '');
      setCarrier(viewingOrder.carrier || '');
      setInternalNotes(viewingOrder.internal_notes || '');
    }
  }, [viewingOrder]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      All: orders.length,
      Pending: orders.filter(o => o.status === 'Pending').length,
      Processing: orders.filter(o => o.status === 'Processing').length,
      Shipped: orders.filter(o => o.status === 'Shipped').length,
      Delivered: orders.filter(o => o.status === 'Delivered').length,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderFilter !== 'All') {
      result = result.filter(o => o.status === orderFilter);
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      result = result.filter(o =>
        o.order_id?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q)
      );
    }
    return result;
  }, [orders, orderFilter, orderSearch]);

  // Status updates mapping confirmed/shipped/delivered timestamps
  const handleUpdateOrderStatus = async (orderId: string, status: SupabaseOrder['status']) => {
    try {
      const updatePayload: Partial<SupabaseOrder> = { status };
      const nowString = new Date().toISOString();

      if (status === 'Processing') {
        updatePayload.confirmed_at = nowString;
      } else if (status === 'Shipped') {
        updatePayload.shipped_at = nowString;
      } else if (status === 'Delivered') {
        updatePayload.delivered_at = nowString;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('order_id', orderId);
      
      if (error) throw error;

      // Update locally
      const updatedOrders = orders.map(o => o.order_id === orderId ? { ...o, ...updatePayload } : o);
      setOrders(updatedOrders);

      if (viewingOrder && viewingOrder.order_id === orderId) {
        setViewingOrder({ ...viewingOrder, ...updatePayload });
      }

      showToast(`Order status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  // Save tracking details
  const handleSaveTracking = async () => {
    if (!viewingOrder) return;
    setUpdatingTracking(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber.trim(),
          carrier: carrier.trim()
        })
        .eq('order_id', viewingOrder.order_id);
      
      if (error) throw error;

      // Update locally
      setOrders(orders.map(o => o.order_id === viewingOrder.order_id ? { 
        ...o, 
        tracking_number: trackingNumber.trim(), 
        carrier: carrier.trim() 
      } : o));
      
      setViewingOrder({ 
        ...viewingOrder, 
        tracking_number: trackingNumber.trim(), 
        carrier: carrier.trim() 
      });

      showToast('Tracking details saved', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setUpdatingTracking(false);
    }
  };

  // Save internal notes
  const handleSaveNotes = async () => {
    if (!viewingOrder) return;
    setUpdatingNotes(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ internal_notes: internalNotes.trim() })
        .eq('order_id', viewingOrder.order_id);
      
      if (error) throw error;

      setOrders(orders.map(o => o.order_id === viewingOrder.order_id ? { 
        ...o, 
        internal_notes: internalNotes.trim() 
      } : o));
      
      setViewingOrder({ 
        ...viewingOrder, 
        internal_notes: internalNotes.trim() 
      });

      showToast('Internal notes saved', 'success');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setUpdatingNotes(false);
    }
  };

  // Export CSV
  const handleExportOrdersCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Date', 'Carrier', 'Tracking #'];
    const rows = filteredOrders.map(o => {
      const itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
      return [
        o.order_id, 
        o.customer_name, 
        o.customer_phone,
        itemsList.map((i: any) => `${i.name} x${i.quantity}`).join('; '),
        o.total_amount, 
        o.status,
        new Date(o.created_at).toLocaleDateString('en-IN'),
        o.carrier || '',
        o.tracking_number || ''
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `orders-export-${Date.now()}.csv`; 
    a.click();
    URL.revokeObjectURL(url);
  };

  // Trigger print logic
  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in-up relative">
      {/* Printable Invoice Block (Hidden in standard screen via CSS classes, visible in @media print) */}
      {viewingOrder && (
        <div id="printable-invoice" className="hidden print:block p-8 bg-white text-black font-sans text-xs">
          <div className="text-center space-y-2 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-serif font-bold text-gray-800">FUZZY SOFT STUDIO</h1>
            <p className="text-[10px] tracking-widest text-gray-500 uppercase">Handcrafted Crochet Luxury Blooms</p>
            <p className="text-[9px]">Lucknow, Uttar Pradesh | hello@fuzzysoftstudio.com</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 text-[10px]">
            <div>
              <p className="font-semibold text-gray-700 uppercase">Bill To:</p>
              <p className="font-bold text-sm mt-1">{viewingOrder.customer_name}</p>
              <p className="text-gray-650 mt-1 whitespace-pre-wrap">{viewingOrder.shipping_address}</p>
              <p className="mt-1">Phone: {viewingOrder.customer_phone}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-700 uppercase">Invoice Details:</p>
              <p className="font-bold text-sm mt-1 font-mono text-gray-800">#{viewingOrder.order_id}</p>
              <p className="mt-1">Date: {new Date(viewingOrder.created_at).toLocaleDateString('en-IN')}</p>
              <p className="mt-1">Payment Status: <span className="font-bold">PAID</span></p>
            </div>
          </div>

          <table className="w-full border-collapse mt-4 text-[10px]">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left font-bold text-gray-700">
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(typeof viewingOrder.items === 'string' ? JSON.parse(viewingOrder.items) : viewingOrder.items || []).map((item: any, idx: number) => (
                <tr key={idx} className="py-2">
                  <td className="py-2 font-medium">{item.name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.price}</td>
                  <td className="py-2 text-right">₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-gray-300 mt-6 pt-4 text-right space-y-1.5 text-[10px]">
            <p>Subtotal: <span className="font-semibold">₹{viewingOrder.total_amount}</span></p>
            <p>Shipping: <span className="font-semibold">₹0</span></p>
            <p className="text-sm font-bold border-t border-gray-200 pt-1.5">Grand Total: ₹{viewingOrder.total_amount}</p>
          </div>

          <div className="text-center mt-12 pt-6 border-t border-gray-100 text-[9px] text-gray-500">
            <p>Thank you for supporting handcrafted luxury art! 🌸</p>
            <p className="mt-1">Fuzzy Soft Studio © 2026</p>
          </div>
        </div>
      )}

      {/* Screen View Content */}
      <div className="print:hidden space-y-6">
        {/* Search + Export */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-body/40" />
            <input 
              type="text" 
              value={orderSearch} 
              onChange={e => setOrderSearch(e.target.value)}
              placeholder="Search by order ID, customer name, or phone..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent shadow-xs" 
            />
          </div>
          <button 
            onClick={handleExportOrdersCSV}
            className="px-4 h-10 bg-white border border-brand-border/60 rounded-xl text-xs font-semibold text-brand-heading hover:bg-brand-cream cursor-pointer transition flex items-center gap-2 shadow-xs shrink-0"
          >
            <FileText size={13} />
            Export CSV
          </button>
        </div>

        {/* Filter Tabs and Counts */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-widest font-sans">
            {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setOrderFilter(tab);
                  setViewingOrder(null);
                }}
                className={`px-3.5 h-8 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  orderFilter === tab 
                    ? 'bg-brand-heading text-white border-brand-heading shadow-xs' 
                    : 'bg-white border-brand-border/60 hover:bg-brand-cream text-brand-body/70'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono ${
                  orderFilter === tab ? 'bg-white/20 text-white' : 'bg-brand-cream text-brand-body/70'
                }`}>{tabCounts[tab]}</span>
              </button>
            ))}
          </div>

          <span className="text-xs text-brand-body/65 font-sans font-semibold shrink-0">
            Showing {filteredOrders.length} orders
          </span>
        </div>

        {/* Orders List Content */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 text-center space-y-2.5">
            <p className="text-sm text-brand-body/55 italic">No orders found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left list container (Full-width on list, col-span-8 if drawer is active) */}
            <div className={`space-y-4 transition-all duration-300 ${viewingOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                        <th className="pb-3 pr-2">Order ID</th>
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2">Customer</th>
                        <th className="pb-3 px-2 text-right">Amount</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                        <th className="pb-3 pl-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                      {filteredOrders.map((o) => (
                        <tr 
                          key={o.id} 
                          className={`hover:bg-brand-cream/35 transition-colors cursor-pointer ${
                            viewingOrder?.order_id === o.order_id ? 'bg-[#DCA29A]/10 font-medium' : ''
                          }`}
                          onClick={() => setViewingOrder(o)}
                        >
                          <td className="py-4 pr-2 font-semibold text-brand-heading font-mono">{o.order_id}</td>
                          <td className="py-4 px-2 text-brand-body/60">
                            {new Date(o.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </td>
                          <td className="py-4 px-2">
                            <div className="font-semibold text-brand-heading">{o.customer_name}</div>
                            <div className="text-[9px] text-brand-body/50 mt-0.5">{o.customer_phone}</div>
                          </td>
                          <td className="py-4 px-2 text-right font-semibold text-brand-heading">
                            ₹{o.total_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-2 text-center" onClick={e => e.stopPropagation()}>
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.order_id, e.target.value as any)}
                              className={`px-2.5 h-6 rounded-full font-bold uppercase tracking-wider text-[8px] border text-center cursor-pointer focus:outline-none ${
                                o.status === 'Delivered' 
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : o.status === 'Shipped'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : o.status === 'Processing'
                                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="py-4 pl-2 text-right select-none">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingOrder(o);
                              }}
                              className="text-brand-accent hover:text-brand-accent-hover font-bold uppercase text-[9px] tracking-wider transition"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card-layout list */}
              <div className="block md:hidden space-y-3">
                {filteredOrders.map((o) => (
                  <div 
                    key={o.id}
                    onClick={() => setViewingOrder(o)}
                    className={`bg-white border rounded-2xl p-4 shadow-sm space-y-2 cursor-pointer transition active:scale-98 ${
                      viewingOrder?.order_id === o.order_id ? 'border-brand-accent bg-[#DCA29A]/5' : 'border-brand-border/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-brand-heading text-xs">#{o.order_id}</span>
                      <span className="text-[10px] text-brand-body/55">
                        {new Date(o.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-bold text-sm text-brand-heading">{o.customer_name}</p>
                        <p className="text-[10px] text-brand-body/50 font-mono mt-0.5">{o.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-bold text-brand-heading">₹{o.total_amount}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[7px] border mt-1 ${
                          o.status === 'Delivered' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : o.status === 'Shipped'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : o.status === 'Processing'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right details sidebar drawer */}
            {viewingOrder && (
              <div className="fixed inset-0 z-50 bg-[#FDFBF9] overflow-y-auto p-6 lg:static lg:block lg:col-span-5 lg:bg-white lg:border lg:border-brand-border/40 lg:rounded-2xl lg:shadow-md lg:backdrop-blur-xs space-y-6 lg:animate-fade-in lg:sticky lg:top-6">
                
                {/* Drawer Header */}
                <div className="flex justify-between items-start border-b border-brand-border/20 pb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-brand-body/55 font-bold block">Transaction Details</span>
                    <h3 className="font-mono font-bold text-brand-heading text-lg mt-0.5">#{viewingOrder.order_id}</h3>
                  </div>
                  <button 
                    onClick={() => setViewingOrder(null)} 
                    className="p-2 hover:bg-brand-cream rounded-full transition text-brand-body/50 hover:text-brand-heading cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Status Switcher & Print Button */}
                <div className="grid grid-cols-2 gap-3 items-center bg-brand-cream/35 border border-brand-border/20 p-3 rounded-xl">
                  <div>
                    <label className="text-[9px] font-sans font-bold uppercase tracking-wider text-brand-body/60 block mb-1">Status</label>
                    <select
                      value={viewingOrder.status}
                      onChange={(e) => handleUpdateOrderStatus(viewingOrder.order_id, e.target.value as any)}
                      className="h-8 w-full bg-white border border-brand-border/50 rounded-lg text-xs font-sans px-2 focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <div className="text-right pt-4">
                    <button
                      onClick={handlePrintInvoice}
                      className="h-8 px-3.5 bg-brand-heading hover:bg-brand-heading-hover text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ml-auto"
                    >
                      <Printer size={12} />
                      <span>Print Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Customer Info Card */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-brand-heading flex items-center gap-1.5 select-none">
                    <User size={14} className="text-[#C9A84C]" />
                    <span>Customer Details</span>
                  </h4>
                  <div className="text-xs space-y-1 bg-brand-cream/15 border border-brand-border/20 p-3.5 rounded-xl font-sans text-brand-body/80">
                    <p><strong className="text-brand-heading font-medium">Name:</strong> {viewingOrder.customer_name}</p>
                    <p><strong className="text-brand-heading font-medium">Phone:</strong> {viewingOrder.customer_phone}</p>
                    <p className="whitespace-pre-wrap"><strong className="text-brand-heading font-medium">Delivery Address:</strong><br />{viewingOrder.shipping_address}</p>
                  </div>
                </div>

                {/* Gifting details */}
                {((viewingOrder as any).gifting_info || (viewingOrder.internal_notes && viewingOrder.internal_notes.includes('[Gift Wrapped]'))) && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-sm font-bold text-brand-heading flex items-center gap-1.5 select-none">
                      <span className="text-brand-accent">🎁</span>
                      <span>Gifting Information</span>
                    </h4>
                    <div className="bg-[#FAF7F2] border border-[#EBE3D5] p-3.5 rounded-xl text-xs space-y-2 text-brand-body/80 font-sans shadow-3xs">
                      {(() => {
                        const gift = (viewingOrder as any).gifting_info;
                        if (gift && gift.gift_wrapped) {
                          return (
                            <>
                              <p><strong className="text-brand-heading font-medium">Ribbon Color:</strong> {gift.ribbon_color || 'N/A'}</p>
                              {gift.gift_message && (
                                <div className="mt-1 p-2.5 bg-white border border-[#EBE3D5]/60 rounded-lg italic font-serif text-brand-heading/90 select-all relative">
                                  {gift.gift_message}
                                </div>
                              )}
                            </>
                          );
                        } else if (viewingOrder.internal_notes && viewingOrder.internal_notes.includes('[Gift Wrapped]')) {
                          const notes = viewingOrder.internal_notes;
                          const ribbonMatch = notes.match(/Ribbon:\s*([^.]+)/);
                          const messageMatch = notes.match(/Message:\s*(.+)/);
                          return (
                            <>
                              <p><strong className="text-brand-heading font-medium">Ribbon Color:</strong> {ribbonMatch ? ribbonMatch[1].trim() : 'N/A'}</p>
                              {messageMatch && (
                                <div className="mt-1 p-2.5 bg-white border border-[#EBE3D5]/60 rounded-lg italic font-serif text-brand-heading/90 select-all relative">
                                  {messageMatch[1].trim()}
                                </div>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Payment & UTR details */}
                {((viewingOrder as any).utr_number || (viewingOrder.internal_notes && viewingOrder.internal_notes.includes('UTR:'))) && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-sm font-bold text-brand-heading flex items-center gap-1.5 select-none">
                      <span className="text-[#8FA088]">🛡️</span>
                      <span>Payment Verification (UPI)</span>
                    </h4>
                    <div className="bg-green-50/25 border border-green-200/50 p-3.5 rounded-xl text-xs space-y-2 text-brand-body/80 font-sans shadow-3xs">
                      <p>
                        <strong className="text-brand-heading font-medium">Payment Mode:</strong> Direct UPI
                      </p>
                      <p className="flex items-center gap-1.5">
                        <strong className="text-brand-heading font-medium">Transaction UTR:</strong> 
                        <span className="font-mono font-bold text-[#2C1810] bg-white border border-brand-border/40 px-2 py-0.5 rounded text-[11px] select-all">
                          {(viewingOrder as any).utr_number || (() => {
                            const match = viewingOrder.internal_notes?.match(/UTR:\s*([0-9a-zA-Z]+)/);
                            return match ? match[1].trim() : 'N/A';
                          })()}
                        </span>
                      </p>
                      <p className="text-[9px] text-[#8FA088] font-semibold italic">
                        * Please verify this UTR in your bank account statement before approving.
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Summary */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-brand-heading flex items-center gap-1.5 select-none">
                    <DollarSign size={14} className="text-[#C9A84C]" />
                    <span>Items Ordered</span>
                  </h4>
                  <div className="divide-y divide-brand-border/10 bg-brand-cream/15 border border-brand-border/20 p-3.5 rounded-xl text-xs space-y-2.5">
                    {(typeof viewingOrder.items === 'string' ? JSON.parse(viewingOrder.items) : viewingOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center pt-2.5 first:pt-0">
                        <div className="min-w-0 pr-2">
                          <p className="font-medium text-brand-heading truncate">{item.name}</p>
                          <p className="text-[9px] text-brand-body/55 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-brand-heading shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-brand-border/20 flex justify-between font-bold text-brand-heading text-sm">
                      <span>Total Amount:</span>
                      <span>₹{viewingOrder.total_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping & Carrier details */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-brand-heading flex items-center gap-1.5 select-none">
                    <Truck size={14} className="text-[#C9A84C]" />
                    <span>Courier Tracking</span>
                  </h4>
                  <div className="bg-brand-cream/15 border border-brand-border/20 p-3.5 rounded-xl space-y-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] uppercase tracking-wider block text-brand-body/60 mb-1">Carrier</label>
                        <input 
                          type="text" 
                          value={carrier}
                          onChange={e => setCarrier(e.target.value)}
                          placeholder="e.g. Delhivery, Bluedart" 
                          className="h-8 w-full bg-white border border-brand-border/50 rounded-lg text-xs px-2 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-wider block text-brand-body/60 mb-1">Tracking Number</label>
                        <input 
                          type="text" 
                          value={trackingNumber}
                          onChange={e => setTrackingNumber(e.target.value)}
                          placeholder="e.g. 1774391209" 
                          className="h-8 w-full bg-white border border-brand-border/50 rounded-lg text-xs px-2 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveTracking}
                      disabled={updatingTracking}
                      className="w-full h-8 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center"
                    >
                      {updatingTracking ? 'Saving...' : 'Save Tracking Info'}
                    </button>
                  </div>
                </div>

                {/* Internal notes */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-brand-heading flex items-center gap-1.5 select-none">
                    <Edit2 size={14} className="text-[#C9A84C]" />
                    <span>Internal Staff Notes</span>
                  </h4>
                  <div className="space-y-2">
                    <textarea 
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      placeholder="Add custom notes (e.g. gift card text: 'Happy Anniversary', customized rose color requested)..." 
                      rows={3}
                      className="w-full p-3 bg-white border border-brand-border/50 rounded-xl text-xs font-sans focus:outline-none resize-none"
                    />
                    <button
                      onClick={handleSaveNotes}
                      disabled={updatingNotes}
                      className="w-full h-8 bg-brand-cream border border-brand-border text-brand-heading hover:bg-brand-border/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center"
                    >
                      {updatingNotes ? 'Saving...' : 'Save Staff Notes'}
                    </button>
                  </div>
                </div>

                {/* Timestamps */}
                {(viewingOrder.confirmed_at || viewingOrder.shipped_at || viewingOrder.delivered_at) && (
                  <div className="pt-3 border-t border-brand-border/15 text-[9px] font-sans text-brand-body/50 space-y-1">
                    <span className="block uppercase tracking-wider font-semibold mb-1">Activity Log:</span>
                    {viewingOrder.confirmed_at && (
                      <p>Confirmed: {new Date(viewingOrder.confirmed_at).toLocaleString('en-IN')}</p>
                    )}
                    {viewingOrder.shipped_at && (
                      <p>Shipped: {new Date(viewingOrder.shipped_at).toLocaleString('en-IN')}</p>
                    )}
                    {viewingOrder.delivered_at && (
                      <p>Delivered: {new Date(viewingOrder.delivered_at).toLocaleString('en-IN')}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
