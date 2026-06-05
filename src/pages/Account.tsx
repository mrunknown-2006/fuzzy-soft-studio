import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { User, LogOut, Package, Mail, Calendar, Sparkles } from 'lucide-react';
import { products as staticProducts } from '../data/products';


interface Order {
  orderId: string;
  created_at?: string;
  total_amount: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  items: any[];
}

export default function Account() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [productsList, setProductsList] = useState<any[]>(staticProducts);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('id, slug, name');
        if (data && data.length > 0) {
          setProductsList(data);
        }
      } catch (err) {
        console.warn('Failed to load products list for slug lookup:', err);
      }
    };
    loadProducts();
  }, []);

  const getProductSlug = (id: string) => {
    const found = productsList.find((p) => p.id === id);
    return found ? found.slug : '';
  };


  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/login', { replace: true });
      } else {
        fetchOrders(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      // Fetch from Supabase orders table
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map database fields to our React model
        const mappedOrders = data.map((o: any) => ({
          orderId: o.order_id || `FSS-${o.id.toString().slice(0, 6).toUpperCase()}`,
          created_at: o.created_at,
          total_amount: typeof o.total_amount === 'number' ? o.total_amount : Number(o.total_amount) || 0,
          status: o.status || 'Processing',
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
        }));
        setOrders(mappedOrders);
      } else {
        // Fallback to local storage orders if empty in database but exists locally
        const local = localStorage.getItem('fuzzy-soft-studio-local-orders');
        if (local) {
          const parsed = JSON.parse(local);
          setOrders(parsed.map((item: any) => ({
            orderId: item.orderId,
            created_at: item.date || new Date().toISOString(),
            total_amount: typeof item.pricing?.total === 'number' ? item.pricing.total : Number(item.pricing?.total) || 0,
            status: 'Processing',
            items: item.items
          })));
        }
      }
    } catch (err: any) {
      console.warn('Supabase database orders query warning (checking local cache):', err.message);
      // Failover to local storage cache if table is missing or has RLS error
      const local = localStorage.getItem('fuzzy-soft-studio-local-orders');
      if (local) {
        const parsed = JSON.parse(local);
        setOrders(parsed.map((item: any) => ({
          orderId: item.orderId,
          created_at: item.date || new Date().toISOString(),
          total_amount: typeof item.pricing?.total === 'number' ? item.pricing.total : Number(item.pricing?.total) || 0,
          status: 'Processing',
          items: item.items
        })));
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast('Signed out successfully', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const fullName = user.user_metadata?.full_name || 'Guest User';

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Page Title */}
      <div className="mb-10 text-center lg:text-left flex flex-col lg:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-heading">My Account</h1>
          <div className="h-0.5 w-16 bg-[#C9A84C] mt-2 mx-auto lg:mx-0"></div>
        </div>

        <button
          onClick={handleSignOut}
          className="h-10 px-5 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading hover:text-red-500 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs select-none"
        >
          <LogOut size={13} strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
        {/* Left Side: Profile Information (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-6 border-b border-brand-border/20">
              <div className="w-14 h-14 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shadow-xs select-none">
                <User size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-heading">{fullName}</h2>
                <p className="text-xs text-brand-body/50 font-sans tracking-wide">Registered Member</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-brand-body/80 font-sans">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Mail size={16} className="text-brand-accent shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Calendar size={16} className="text-brand-accent shrink-0" />
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order History (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
            <h2 className="font-serif text-xl font-bold text-brand-heading mb-6 flex items-center gap-2 select-none">
              <Package size={18} strokeWidth={1.5} className="text-[#C9A84C]" />
              <span>Order History</span>
            </h2>

            {loadingOrders ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center select-none">
                <div className="bg-brand-cream inline-flex p-4 rounded-full text-brand-accent mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-serif text-base font-bold text-brand-heading mb-2">No orders yet</h3>
                <p className="text-xs text-brand-body/70 mb-6 max-w-xs mx-auto">
                  Bring romantic soft luxury arrangements into your space. Let's find your first bouquet.
                </p>
                <Link
                  to="/shop"
                  className="bg-[#DCA29A] hover:bg-[#D4938A] text-white px-6 py-2.5 rounded-full font-sans font-semibold tracking-wider text-[10px] uppercase transition-all duration-300 inline-block shadow-xs"
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto pr-1">
                <table className="w-full border-collapse text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-brand-border/30 text-brand-body/55 uppercase font-semibold tracking-wider select-none">
                      <th className="pb-3 pr-2">Order ID</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Items</th>
                      <th className="pb-3 px-2 text-right">Total</th>
                      <th className="pb-3 pl-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20 text-brand-body/85 font-sans">
                    {orders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-brand-cream/35 transition-colors">
                        <td className="py-4 pr-2 font-semibold text-brand-heading font-mono">{order.orderId}</td>
                        <td className="py-4 px-2 text-brand-body/70 select-none">
                          {new Date(order.created_at || '').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col gap-2.5 max-w-[280px]">
                            {order.items.map((item, idx) => {
                              const productSlug = getProductSlug(item.id);
                              return (
                                <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-brand-border/10 last:border-b-0">
                                  <div className="truncate text-brand-body/85 font-sans font-medium text-xs">
                                    {productSlug ? (
                                      <Link 
                                        to={`/product/${productSlug}`} 
                                        className="text-[#8FA088] hover:text-brand-accent font-semibold transition duration-200"
                                      >
                                        {item.name}
                                      </Link>
                                    ) : (
                                      <span className="text-brand-heading font-semibold">{item.name}</span>
                                    )}
                                    <span className="text-brand-body/50 text-[10px] ml-1.5 font-normal select-none">
                                      ({item.quantity} &times;)
                                    </span>
                                  </div>
                                  {productSlug && (
                                    <Link
                                      to={`/product/${productSlug}?write_review=true`}
                                      className="px-2.5 py-0.5 bg-white hover:bg-brand-cream border border-[#C9A84C]/60 hover:border-[#C9A84C] text-[#C9A84C] hover:text-brand-heading rounded-full text-[9px] uppercase tracking-wider font-semibold transition-all duration-300 shadow-xs hover:shadow-sm shrink-0"
                                    >
                                      Review
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-4 px-2 text-right font-semibold text-brand-heading select-none">
                          ₹{(order.total_amount ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 pl-2 text-right select-none">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            order.status === 'Delivered' 
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : order.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
