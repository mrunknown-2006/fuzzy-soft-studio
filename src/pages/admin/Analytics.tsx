import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, ShoppingBag, Award } from 'lucide-react';
import type { AdminContext } from './types';

export default function Analytics() {
  const { orders } = useOutletContext<AdminContext>();
  const [period, setPeriod] = useState<'7d' | '14d' | '30d' | 'this_month' | '90d' | 'all'>('14d');

  // Filter orders by selected period
  const periodOrders = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    if (period === '7d') cutoff.setDate(now.getDate() - 7);
    else if (period === '14d') cutoff.setDate(now.getDate() - 14);
    else if (period === '30d') cutoff.setDate(now.getDate() - 30);
    else if (period === '90d') cutoff.setDate(now.getDate() - 90);
    else if (period === 'this_month') cutoff.setDate(new Date(now.getFullYear(), now.getMonth(), 1).getDate());
    else return orders; // 'all'

    return orders.filter(o => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalOrders = periodOrders.length;
    const totalRevenue = periodOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    let totalItems = 0;
    periodOrders.forEach(o => {
      const itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
      itemsList.forEach((i: any) => {
        totalItems += i.quantity || 0;
      });
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalItems
    };
  }, [periodOrders]);

  // Chart 1: Revenue over time
  const revenueChartData = useMemo(() => {
    const dailyMap: { [date: string]: { revenue: number; ordersCount: number } } = {};
    
    periodOrders.forEach(o => {
      const dateStr = o.created_at ? o.created_at.split('T')[0] : '';
      if (dateStr) {
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { revenue: 0, ordersCount: 0 };
        dailyMap[dateStr].revenue += o.total_amount || 0;
        dailyMap[dateStr].ordersCount += 1;
      }
    });

    // Sort by date ascending
    return Object.entries(dailyMap)
      .map(([date, val]) => ({
        date: date.slice(5), // MM-DD
        revenue: val.revenue,
        orders: val.ordersCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [periodOrders]);

  // Chart 2: Top 5 Products sold
  const topProductsData = useMemo(() => {
    const itemMap: { [name: string]: number } = {};
    
    periodOrders.forEach(o => {
      const itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
      itemsList.forEach((i: any) => {
        if (i.name) {
          itemMap[i.name] = (itemMap[i.name] || 0) + (i.quantity || 1);
        }
      });
    });

    return Object.entries(itemMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [periodOrders]);

  // Chart 3: Orders by status (pie/donut)
  const statusPieData = useMemo(() => {
    const statusMap: { [status: string]: number } = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0
    };

    periodOrders.forEach(o => {
      if (o.status) {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      }
    });

    return Object.entries(statusMap)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [periodOrders]);

  // Colors for donut cell items
  const COLORS = ['#d1d5db', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      {/* Date selector and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none pb-2">
        <h3 className="font-serif text-xl font-bold text-brand-heading">Store Analytics</h3>
        
        <div className="flex items-center gap-2 bg-white border border-brand-border/60 rounded-xl px-3 py-1.5 shadow-2xs">
          <Calendar size={13} className="text-brand-body/55" />
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value as any)}
            className="text-xs font-sans text-brand-body/75 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="this_month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Revenue</span>
            <div className="text-lg md:text-xl font-bold text-brand-heading font-sans truncate">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-150 text-green-600 flex items-center justify-center shrink-0">
            <DollarSign size={16} />
          </div>
        </div>

        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Orders Count</span>
            <div className="text-lg md:text-xl font-bold text-brand-heading font-sans truncate">
              {stats.totalOrders}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-150 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={16} />
          </div>
        </div>

        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Average Order</span>
            <div className="text-lg md:text-xl font-bold text-brand-heading font-sans truncate">
              ₹{stats.averageOrderValue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-150 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp size={16} />
          </div>
        </div>

        <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-4 md:p-5 shadow-xs backdrop-blur-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] text-brand-body/55 uppercase tracking-widest font-sans font-semibold block truncate">Items Sold</span>
            <div className="text-lg md:text-xl font-bold text-brand-heading font-sans truncate">
              {stats.totalItems} units
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-150 text-amber-600 flex items-center justify-center shrink-0">
            <Award size={16} />
          </div>
        </div>
      </div>

      {/* Chart Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Over Time Chart (Line / Area) */}
        <div className="lg:col-span-8 bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs space-y-4">
          <h4 className="font-serif text-base font-bold text-brand-heading select-none">Revenue Growth & Trend</h4>
          
          {revenueChartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-brand-body/50 italic">No data to display.</div>
          ) : (
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => '₹' + v.toLocaleString('en-IN')} />
                  <Tooltip formatter={(value: any) => ['\u20b9' + Number(value).toLocaleString('en-IN'), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#DCA29A" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Orders Status Donut Chart */}
        <div className="lg:col-span-4 bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs space-y-4">
          <h4 className="font-serif text-base font-bold text-brand-heading select-none">Order status share</h4>
          
          {statusPieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-brand-body/50 italic">No orders in this period.</div>
          ) : (
            <div className="w-full h-[220px] flex flex-col justify-center items-center">
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => {
                        const name = entry.name;
                        let colorIdx = 0;
                        if (name === 'Pending') colorIdx = 0;
                        else if (name === 'Processing') colorIdx = 1;
                        else if (name === 'Shipped') colorIdx = 2;
                        else if (name === 'Delivered') colorIdx = 3;
                        return <Cell key={`cell-${index}`} fill={COLORS[colorIdx]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Orders']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Legend keys */}
              <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider justify-center pt-2">
                {statusPieData.map((entry, idx) => {
                  let colorIdx = 0;
                  if (entry.name === 'Pending') colorIdx = 0;
                  else if (entry.name === 'Processing') colorIdx = 1;
                  else if (entry.name === 'Shipped') colorIdx = 2;
                  else if (entry.name === 'Delivered') colorIdx = 3;
                  return (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[colorIdx] }} />
                      <span className="text-brand-heading">{entry.name} ({entry.value})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Products bar chart */}
        <div className="lg:col-span-12 bg-white/60 border border-brand-border/40 rounded-2xl p-5 shadow-xs backdrop-blur-xs space-y-4">
          <h4 className="font-serif text-base font-bold text-brand-heading select-none">Top 5 Best-Selling Arrangements</h4>
          
          {topProductsData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-brand-body/50 italic">No products sold in this period.</div>
          ) : (
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip formatter={(v) => [v, 'Qty Sold']} />
                  <Bar dataKey="qty" fill="#DCA29A" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
