import { useMemo, useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Truck, 
  Plus, 
  Settings as SettingsIcon 
} from 'lucide-react';
import type { AdminContext } from './types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { products, orders, lowStockThreshold } = useOutletContext<AdminContext>();
  const [chartPeriod, setChartPeriod] = useState<'today' | '7d' | '14d' | '30d' | 'this_month' | 'last_month' | '90d'>('14d');

  // Aggregated calculations for dashboard stats
  const dashboardStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    // Unique customer count
    const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
    
    // Low stock count (stock <= product.low_stock_threshold or global lowStockThreshold)
    const lowStockCount = products.filter(p => {
      const threshold = p.low_stock_threshold !== undefined && p.low_stock_threshold !== null
        ? p.low_stock_threshold
        : lowStockThreshold;
      return p.stock <= threshold;
    }).length;

    const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;

    return {
      totalOrders,
      totalRevenue,
      totalCustomers: uniqueCustomers,
      lowStockProducts: lowStockCount,
      pendingOrders: pendingCount
    };
  }, [orders, products, lowStockThreshold]);

  // Chart data and period stats for revenue bar chart — period-aware
  const chartDataAndStats = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    let dates: string[] = [];
    if (chartPeriod === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      dates = [todayStr];
    } else if (chartPeriod === '7d') {
      dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
    } else if (chartPeriod === '14d') {
      dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split('T')[0];
      });
    } else if (chartPeriod === 'this_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstDay = new Date(y, m, 1);
      const diffTime = Math.abs(now.getTime() - firstDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dates = Array.from({ length: diffDays }, (_, i) => {
        const d = new Date(y, m, 1 + i);
        return d.toISOString().split('T')[0];
      });
    } else if (chartPeriod === 'last_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const lastDayOfLastMonth = new Date(y, m, 0);
      const numDays = lastDayOfLastMonth.getDate();
      dates = Array.from({ length: numDays }, (_, i) => {
        const d = new Date(y, m - 1, 1 + i);
        return d.toISOString().split('T')[0];
      });
    } else { // 90d
      dates = Array.from({ length: 90 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (89 - i));
        return d.toISOString().split('T')[0];
      });
    }

    const data = dates.map(date => {
      const dayOrders = orders.filter(o => o.created_at?.startsWith(date));
      const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      return {
        fullDate: date,
        date: date.slice(5), // MM-DD
        revenue,
        ordersCount: dayOrders.length
      };
    });

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.ordersCount, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      chartData: data,
      stats: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      }
    };
  }, [orders, chartPeriod]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up">
      {/* Stat Cards Grid - 4 columns on desktop, 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Stat 1: Revenue */}
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Total Revenue</span>
            <div className="text-lg md:text-2xl font-bold text-brand-heading font-sans truncate">
              ₹{dashboardStats.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
        </div>

        {/* Stat 2: Orders */}
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Total Orders</span>
            <div className="text-lg md:text-2xl font-bold text-brand-heading font-sans truncate">
              {dashboardStats.totalOrders}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={18} />
          </div>
        </div>

        {/* Stat 3: Customers */}
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Total Customers</span>
            <div className="text-lg md:text-2xl font-bold text-brand-heading font-sans truncate">
              {dashboardStats.totalCustomers}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>

        {/* Stat 4: Low Stock Alert */}
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Low Stock Alert</span>
            <div className={`text-lg md:text-2xl font-bold font-sans truncate ${dashboardStats.lowStockProducts > 0 ? 'text-amber-600' : 'text-brand-heading'}`}>
              {dashboardStats.lowStockProducts}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${dashboardStats.lowStockProducts > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-brand-cream text-brand-body/60'}`}>
            <AlertTriangle size={18} />
          </div>
        </div>
      </div>

      {/* Additional Stats: Pending Orders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 border border-orange-200/60 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex items-center justify-between md:col-span-1">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-orange-600 uppercase tracking-widest font-sans font-semibold block truncate">Pending Orders</span>
            <div className="text-2xl font-bold text-orange-700 font-sans truncate">
              {dashboardStats.pendingOrders}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
            <Truck size={18} />
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs flex flex-col justify-center gap-3 md:col-span-2">
          <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block">Quick Actions</span>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider font-sans">
            <button
              onClick={() => navigate('/admin/products/new')}
              className="px-4 h-9 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 h-9 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full flex items-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <ShoppingBag size={14} />
              <span>Manage Orders</span>
            </button>
            <button
              onClick={() => navigate('/admin/content')}
              className="px-4 h-9 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading rounded-full flex items-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <SettingsIcon size={14} />
              <span>Manage Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Bar Chart — Period-aware */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-6 shadow-xs backdrop-blur-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif text-lg font-bold text-brand-heading">Revenue Overview</h3>
          {/* Period selector pills */}
          <div className="flex flex-wrap gap-1.5">
            {(['today', '7d', '14d', 'this_month', 'last_month', '90d'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  chartPeriod === p ? 'bg-brand-accent text-white border-brand-accent' : 'border-brand-border/40 text-brand-body/65 hover:bg-brand-cream'
                }`}>
                {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : p === 'this_month' ? 'This Month' : p === 'last_month' ? 'Last Month' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataAndStats.chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => '₹' + v.toLocaleString('en-IN')} />
              <Tooltip formatter={(value: any) => ['\u20b9' + Number(value).toLocaleString('en-IN'), 'Revenue']} />
              <Bar dataKey="revenue" fill="#DCA29A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Period summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Orders', value: String(chartDataAndStats.stats.totalOrders) },
            { label: 'Total Revenue', value: '₹' + chartDataAndStats.stats.totalRevenue.toLocaleString('en-IN') },
            { label: 'Avg Order Value', value: '₹' + chartDataAndStats.stats.averageOrderValue.toLocaleString('en-IN') },
          ].map(stat => (
            <div key={stat.label} className="bg-brand-cream/60 rounded-xl p-2 md:p-3 text-center">
              <div className="text-xs md:text-base font-bold text-brand-heading font-sans truncate">{stat.value}</div>
              <div className="text-[8px] md:text-[10px] text-brand-body/60 uppercase tracking-wider mt-0.5 truncate">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert Panel */}
      {products.filter(p => {
        const threshold = p.low_stock_threshold !== undefined && p.low_stock_threshold !== null
          ? p.low_stock_threshold
          : lowStockThreshold;
        return p.stock <= threshold;
      }).length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5 shadow-xs">
          <h3 className="font-serif text-base font-bold text-amber-800 mb-3">⚠️ Low Stock Alert</h3>
          <div className="space-y-2">
            {products.filter(p => {
              const threshold = p.low_stock_threshold !== undefined && p.low_stock_threshold !== null
                ? p.low_stock_threshold
                : lowStockThreshold;
              return p.stock <= threshold;
            }).map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs font-sans">
                <span className="text-brand-heading font-medium truncate max-w-[60%]">{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${p.stock <= 2 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock} left</span>
                  <Link to={`/admin/products/edit/${p.id}`} className="text-brand-accent hover:underline font-semibold">
                    Edit Stock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders log (last 5 orders) */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-6 shadow-xs backdrop-blur-xs space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold text-brand-heading select-none">Recent Orders</h3>
          <Link to="/admin/orders" className="text-xs text-brand-accent hover:underline font-semibold uppercase tracking-wider">
            View All &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans min-w-[500px]">
            <thead>
              <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                <th className="pb-3 pr-2">Order ID</th>
                <th className="pb-3 px-2">Customer</th>
                <th className="pb-3 px-2">Items</th>
                <th className="pb-3 px-2 text-right">Amount</th>
                <th className="pb-3 px-2 text-center">Status</th>
                <th className="pb-3 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
              {orders.slice(0, 5).map((order) => {
                const itemsList = typeof order.items === 'string' 
                  ? JSON.parse(order.items) 
                  : order.items || [];
                return (
                  <tr key={order.id} className="hover:bg-brand-cream/35 transition-colors">
                    <td className="py-3 pr-2 font-semibold text-brand-heading font-mono">{order.order_id}</td>
                    <td className="py-3 px-2 font-medium text-brand-heading">{order.customer_name}</td>
                    <td className="py-3 px-2 max-w-[180px] truncate">
                      {itemsList.map((i: any) => i.name).join(', ')}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-brand-heading">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
                        order.status === 'Delivered' 
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'Shipped'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'Processing'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right select-none">
                      <Link
                        to="/admin/orders"
                        state={{ selectOrderId: order.order_id }}
                        className="text-brand-accent hover:text-brand-accent-hover font-semibold tracking-wide text-[10px] uppercase transition p-1"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
