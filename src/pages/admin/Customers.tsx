import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FileText, Search, X } from 'lucide-react';
import type { AdminContext } from './types';

export default function Customers() {
  const navigate = useNavigate();
  const { orders } = useOutletContext<AdminContext>();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Group orders into a customers list
  const customersList = useMemo(() => {
    const registry: { [key: string]: { name: string; email: string; phone: string; ordersCount: number; spentTotal: number; ordersList: any[] } } = {};
    
    orders.forEach(o => {
      // Look for email in shipping address or mock one
      let email = 'N/A';
      const emailMatch = o.shipping_address.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        email = emailMatch[0];
      }

      // Group by phone (standard index) or name
      const key = o.customer_phone || o.customer_name;
      if (!registry[key]) {
        registry[key] = {
          name: o.customer_name,
          email,
          phone: o.customer_phone || 'N/A',
          ordersCount: 0,
          spentTotal: 0,
          ordersList: []
        };
      }
      registry[key].ordersCount += 1;
      registry[key].spentTotal += o.total_amount;
      registry[key].ordersList.push(o);
    });

    return Object.values(registry);
  }, [orders]);

  // Filter list by search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customersList;
    const q = searchQuery.toLowerCase();
    return customersList.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [customersList, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Email', 'Phone', 'Orders Count', 'Total Spent (₹)'];
    const rows = filteredCustomers.map(c => [
      c.name, c.email, c.phone, c.ordersCount, c.spentTotal
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Search & Export bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-body/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or email..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent shadow-xs" 
          />
        </div>
        <button 
          onClick={handleExportCSV}
          className="px-4 h-10 bg-white border border-brand-border/60 rounded-xl text-xs font-semibold text-brand-heading hover:bg-brand-cream cursor-pointer transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <FileText size={13} />
          Export CSV
        </button>
      </div>

      <div className="flex justify-between items-center select-none pt-2">
        <h3 className="font-serif text-lg font-bold text-brand-heading">Customer Registry</h3>
        <span className="text-xs text-brand-body/65 font-sans font-semibold">
          Found {filteredCustomers.length} unique customers
        </span>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 text-center">
          <p className="text-sm text-brand-body/55 italic">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main customers list */}
          <div className={`space-y-4 transition-all ${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            
            {/* Desktop Table */}
            <div className="hidden md:block bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                      <th className="pb-3 pr-2">Customer Name</th>
                      <th className="pb-3 px-2">Unique Address Email</th>
                      <th className="pb-3 px-2">Phone</th>
                      <th className="pb-3 px-2 text-center">Orders Placed</th>
                      <th className="pb-3 px-2 text-right">Total Spent</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
                    {filteredCustomers.map((cust, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-brand-cream/35 transition-colors cursor-pointer ${
                          selectedCustomer?.phone === cust.phone ? 'bg-[#DCA29A]/10' : ''
                        }`}
                        onClick={() => setSelectedCustomer(cust)}
                      >
                        <td className="py-4 pr-2 font-semibold text-brand-heading">{cust.name}</td>
                        <td className="py-4 px-2 text-brand-body/60 font-mono">{cust.email}</td>
                        <td className="py-4 px-2 text-brand-body/70 font-mono">{cust.phone}</td>
                        <td className="py-4 px-2 text-center font-semibold text-brand-heading">{cust.ordersCount}</td>
                        <td className="py-4 px-2 text-right font-semibold text-brand-heading">
                          ₹{cust.spentTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 pl-2 text-right select-none" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="text-brand-accent hover:text-brand-accent-hover font-bold uppercase text-[9px] tracking-wider border border-brand-border bg-white hover:bg-brand-cream py-1 px-3.5 rounded-full transition cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards Layout */}
            <div className="block md:hidden space-y-3">
              {filteredCustomers.map((cust, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`bg-white border rounded-2xl p-4 shadow-sm flex justify-between items-end cursor-pointer transition active:scale-98 ${
                    selectedCustomer?.phone === cust.phone ? 'border-brand-accent bg-[#DCA29A]/5' : 'border-brand-border/40'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-brand-heading">{cust.name}</h4>
                    <p className="text-[10px] text-brand-body/50 font-mono">Email: {cust.email}</p>
                    <p className="text-[10px] text-brand-body/50 font-mono">Phone: {cust.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-brand-heading">₹{cust.spentTotal.toLocaleString('en-IN')}</span>
                    <span className="block text-[9px] text-brand-body/55 mt-0.5">{cust.ordersCount} orders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right customer history details drawer */}
          {selectedCustomer && (
            <div className="fixed inset-0 z-50 bg-[#FDFBF9] overflow-y-auto p-6 lg:static lg:block lg:col-span-5 lg:bg-white lg:border lg:border-brand-border/40 lg:rounded-2xl lg:shadow-md lg:backdrop-blur-xs space-y-5 lg:animate-fade-in lg:sticky lg:top-6">
              <div className="flex justify-between items-start border-b border-brand-border/20 pb-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-widest text-brand-body/55 font-bold block">Customer Account</span>
                  <h3 className="font-serif font-bold text-brand-heading text-lg">{selectedCustomer.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-brand-cream rounded-full transition text-brand-body/50 hover:text-brand-heading cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-cream/40 rounded-xl p-3 text-center">
                  <span className="text-[9px] text-brand-body/60 uppercase block">Total Spent</span>
                  <span className="font-sans font-bold text-brand-heading text-base mt-1 block">₹{selectedCustomer.spentTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-brand-cream/40 rounded-xl p-3 text-center">
                  <span className="text-[9px] text-brand-body/60 uppercase block">Orders Placed</span>
                  <span className="font-sans font-bold text-brand-heading text-base mt-1 block">{selectedCustomer.ordersCount}</span>
                </div>
              </div>

              {/* Order List */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-body/60 block">Order History</span>
                
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {selectedCustomer.ordersList.map((order: any) => {
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
                    return (
                      <div 
                        key={order.id} 
                        className="bg-brand-cream/15 border border-brand-border/20 rounded-xl p-3 text-xs space-y-2 hover:border-brand-accent/30 transition cursor-pointer"
                        onClick={() => navigate('/admin/orders', { state: { selectOrderId: order.order_id } })}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-brand-heading">#{order.order_id}</span>
                          <span className={`px-2 py-0.2 rounded-full font-bold uppercase tracking-wider text-[7px] border ${
                            order.status === 'Delivered' 
                              ? 'bg-green-150 text-green-700 border-green-200'
                              : order.status === 'Shipped'
                                ? 'bg-blue-150 text-blue-700 border-blue-200'
                                : order.status === 'Processing'
                                  ? 'bg-amber-150 text-amber-700 border-amber-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="text-brand-body/70 text-[11px] truncate">
                          {items.map((i: any) => i.name).join(', ')}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-brand-body/50 pt-1 border-t border-brand-border/5">
                          <span>{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                          <span className="font-bold text-brand-heading">₹{order.total_amount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
