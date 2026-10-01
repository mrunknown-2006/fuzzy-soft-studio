import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { 
  User, LogOut, Package, Sparkles, 
  Heart, Truck, MapPin, Plus, Edit3, Trash2, X, Check
} from 'lucide-react';
import { products as staticProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

interface Order {
  orderId: string;
  created_at?: string;
  total_amount: number;
  status: string;
  cancellation_reason?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  items: any[];
}

export default function Account() {
  const navigate = useNavigate();
  const showToast = useStore((state) => state.showToast);
  const wishlist = useStore((state) => state.wishlist);

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [productsList, setProductsList] = useState<any[]>(staticProducts);

  // Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'track' | 'wishlist' | 'addresses'>('orders');

  // Profile Settings Form State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // My Addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrHouseNo, setAddrHouseNo] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('id, slug, name, price, image, description, category, stock');
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

  // Check auth session & load addresses
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/login', { replace: true });
      } else {
        const meta = session.user?.user_metadata || {};
        setProfileName(meta.full_name || meta.name || '');
        setProfilePhone(meta.phone || '');

        fetchOrders(session.user.id);
        fetchAddresses(session.user.id); // pass uid directly — session state may not be set yet
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

  // Refetch live data whenever customer switches tabs
  useEffect(() => {
    if (!session?.user?.id) return;
    if (activeTab === 'orders' || activeTab === 'track') {
      fetchOrders(session.user.id);
    }
    if (activeTab === 'addresses') {
      fetchAddresses(session.user.id);
    }
  }, [activeTab]);

  // Fetch orders directly from Supabase database with zero stale caching
  const fetchOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedOrders = data.map((o: any) => ({
          orderId: o.order_id || `FSS-${o.id.toString().slice(0, 6).toUpperCase()}`,
          created_at: o.created_at,
          total_amount: typeof o.total_amount === 'number' ? o.total_amount : Number(o.total_amount) || 0,
          status: o.status || 'Processing',
          cancellation_reason: o.cancellation_reason || null,
          carrier: o.carrier || null,
          tracking_number: o.tracking_number || null,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
        }));
        setOrders(mappedOrders);
      } else {
        // Strict database sync: if row was deleted in database, show zero orders
        setOrders([]);
      }
    } catch (err: any) {
      console.warn('Supabase orders query warning:', err.message);
      setOrders([]);
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

  // Profile Update Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileName.trim(),
          phone: profilePhone.trim()
        }
      });
      if (error) throw error;
      showToast('Profile settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry'];

  const fetchAddresses = async (userId?: string) => {
    const uid = userId || session?.user?.id;
    if (!uid) return;
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', uid)
        .order('is_default', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch (err: any) {
      console.warn('fetchAddresses error:', err.message);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const resetAddressForm = () => {
    setAddrLabel('Home');
    setAddrHouseNo(''); setAddrArea(''); setAddrLandmark('');
    setAddrCity(''); setAddrState(''); setAddrPincode('');
    setAddrPhone(session?.user?.user_metadata?.phone || '');
    setAddrIsDefault(false);
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const openEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddrLabel(addr.label || 'Home');
    setAddrHouseNo(addr.house_no || '');
    setAddrArea(addr.area || '');
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || '');
    setAddrPincode(addr.pincode || '');
    setAddrPhone(addr.phone || '');
    setAddrIsDefault(addr.is_default || false);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    if (!addrHouseNo.trim() || !addrArea.trim() || !addrCity.trim() || !addrState.trim() || !addrPincode.trim()) {
      showToast('Please fill all required address fields.', 'error');
      return;
    }
    setSavingAddress(true);
    try {
      const payload = {
        user_id: session.user.id,
        label: addrLabel,
        full_name: profileName || session.user.user_metadata?.full_name || '',
        phone: addrPhone.trim(),
        house_no: addrHouseNo.trim(),
        area: addrArea.trim(),
        landmark: addrLandmark.trim() || null,
        city: addrCity.trim(),
        state: addrState.trim(),
        pincode: addrPincode.trim(),
        is_default: addrIsDefault,
        updated_at: new Date().toISOString()
      };
      if (editingAddress) {
        const { error } = await supabase.from('addresses').update(payload).eq('id', editingAddress.id);
        if (error) throw error;
        showToast('Address updated!', 'success');
      } else {
        const { error } = await supabase.from('addresses').insert(payload);
        if (error) throw error;
        showToast('Address saved!', 'success');
      }
      resetAddressForm();
      fetchAddresses();
    } catch (err: any) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) { showToast('Failed to delete address', 'error'); return; }
    showToast('Address removed.', 'success');
    fetchAddresses();
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
  const fullName = profileName || user.user_metadata?.full_name || user.user_metadata?.name || 'Valued Guest';

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Header Bar */}
      <div className="mb-8 text-center lg:text-left flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-brand-border/30 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-accent/15 text-brand-heading flex items-center justify-center shadow-xs text-xl font-serif font-bold">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-brand-heading font-bold">{fullName}</h1>
            <p className="text-xs text-brand-body/60 font-sans tracking-wide">
              {user.email} &bull; Member since {new Date(user.created_at).getFullYear()}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="h-10 px-5 border border-brand-border bg-white hover:bg-brand-cream text-brand-heading hover:text-red-500 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs select-none"
        >
          <LogOut size={13} strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Tabbed Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column: Navigation Tabs (3 cols) */}
        <div className="lg:col-span-3 space-y-2 bg-white/65 border border-brand-border/40 rounded-2xl p-3 shadow-xs backdrop-blur-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-brand-heading text-white shadow-xs'
                : 'text-brand-body/75 hover:bg-brand-cream/80 hover:text-brand-heading'
            }`}
          >
            <Package size={16} />
            <span>Order History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-brand-heading text-white shadow-xs'
                : 'text-brand-body/75 hover:bg-brand-cream/80 hover:text-brand-heading'
            }`}
          >
            <User size={16} />
            <span>Profile Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'track'
                ? 'bg-brand-heading text-white shadow-xs'
                : 'text-brand-body/75 hover:bg-brand-cream/80 hover:text-brand-heading'
            }`}
          >
            <Truck size={16} />
            <span>Track My Order</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-brand-heading text-white shadow-xs'
                : 'text-brand-body/75 hover:bg-brand-cream/80 hover:text-brand-heading'
            }`}
          >
            <MapPin size={16} />
            <span>My Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-brand-heading text-white shadow-xs'
                : 'text-brand-body/75 hover:bg-brand-cream/80 hover:text-brand-heading'
            }`}
          >
            <Heart size={16} />
            <span>Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* Right Column: Tab Content Panel (9 cols) */}
        <div className="lg:col-span-9 bg-white/60 border border-brand-border/40 rounded-2xl p-6 sm:p-8 shadow-xs backdrop-blur-xs min-h-[420px]">
          
          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-heading flex items-center gap-2 select-none">
                <Package size={20} className="text-[#C9A84C]" />
                <span>Order History</span>
              </h2>

              {loadingOrders ? (
                <div className="py-16 flex justify-center">
                  <div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center select-none space-y-3">
                  <div className="bg-brand-cream inline-flex p-4 rounded-full text-brand-accent mb-2">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-heading">No orders placed yet</h3>
                  <p className="text-xs text-brand-body/70 max-w-xs mx-auto">
                    Bring handcrafted soft luxury floral creations into your room. Explore our fresh bouquets.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block mt-4 bg-[#DCA29A] hover:bg-[#D4938A] text-white px-7 py-3 rounded-full font-sans font-semibold tracking-widest text-xs uppercase transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Shop Collection
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile View: Vertical Stacked Cards (Zero horizontal scroll) */}
                  <div className="block md:hidden space-y-4">
                    {orders.map((order) => (
                      <div key={order.orderId} className="bg-white/80 border border-brand-border/40 rounded-2xl p-4 space-y-3.5 shadow-3xs">
                        <div className="flex items-center justify-between border-b border-brand-border/20 pb-2.5">
                          <div>
                            <span className="font-mono text-xs font-bold text-brand-heading block">#{order.orderId}</span>
                            <span className="text-[10px] text-brand-body/60 font-sans">
                              {new Date(order.created_at || '').toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            String(order.status).toUpperCase() === 'CANCELLED' || String(order.status).toUpperCase() === 'CANCELED'
                              ? 'bg-red-100 text-red-700 border border-red-200 font-extrabold'
                              : String(order.status).toUpperCase() === 'DELIVERED' 
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : String(order.status).toUpperCase() === 'SHIPPED'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : String(order.status).toUpperCase() === 'PROCESSING' || String(order.status).toUpperCase() === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {order.items.map((item, idx) => {
                            const productSlug = getProductSlug(item.id);
                            return (
                              <div key={idx} className="flex items-center justify-between gap-2 text-xs font-sans">
                                <div className="truncate text-brand-body/85">
                                  {productSlug ? (
                                    <Link to={`/product/${productSlug}`} className="text-[#8FA088] hover:text-brand-accent font-semibold">
                                      {item.name}
                                    </Link>
                                  ) : (
                                    <span className="text-brand-heading font-semibold">{item.name}</span>
                                  )}
                                  <span className="text-brand-body/50 text-[10px] ml-1">(&times;{item.quantity})</span>
                                </div>
                                {productSlug && (
                                  <Link
                                    to={`/product/${productSlug}?write_review=true`}
                                    className="px-2.5 py-0.5 bg-white border border-[#C9A84C]/60 text-[#C9A84C] rounded-full text-[9px] uppercase tracking-wider font-semibold shrink-0"
                                  >
                                    Review
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Cancellation Reason if cancelled */}
                        {(String(order.status).toUpperCase() === 'CANCELLED' || String(order.status).toUpperCase() === 'CANCELED') && (order as any).cancellation_reason && (
                          <div className="bg-red-50 border border-red-200/70 p-2.5 rounded-xl text-[10px] text-red-700 font-sans">
                            <span className="font-bold">Reason:</span> {(order as any).cancellation_reason}
                          </div>
                        )}

                        {/* Footer Total */}
                        <div className="flex justify-between items-center pt-2 border-t border-brand-border/20 text-xs">
                          <span className="text-brand-body/60 font-semibold uppercase tracking-wider text-[10px]">Total Amount</span>
                          <span className="font-bold text-brand-heading text-sm">₹{(order.total_amount ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
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
                      <tbody className="divide-y divide-brand-border/20 text-brand-body/85">
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
                              <div className="flex flex-col gap-2 max-w-[280px]">
                                {order.items.map((item, idx) => {
                                  const productSlug = getProductSlug(item.id);
                                  return (
                                    <div key={idx} className="flex items-center justify-between gap-3 py-1 border-b border-brand-border/10 last:border-b-0">
                                      <div className="truncate text-brand-body/85 font-medium text-xs">
                                        {productSlug ? (
                                          <Link 
                                            to={`/product/${productSlug}`} 
                                            className="text-[#8FA088] hover:text-brand-accent font-semibold transition"
                                          >
                                            {item.name}
                                          </Link>
                                        ) : (
                                          <span className="text-brand-heading font-semibold">{item.name}</span>
                                        )}
                                        <span className="text-brand-body/50 text-[10px] ml-1.5 font-normal select-none">
                                          (&times;{item.quantity})
                                        </span>
                                      </div>
                                      {productSlug && (
                                        <Link
                                          to={`/product/${productSlug}?write_review=true`}
                                          className="px-2.5 py-0.5 bg-white hover:bg-brand-cream border border-[#C9A84C]/60 text-[#C9A84C] rounded-full text-[9px] uppercase tracking-wider font-semibold transition shrink-0"
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
                              <div className="flex flex-col items-end">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                                  String(order.status).toUpperCase() === 'CANCELLED' || String(order.status).toUpperCase() === 'CANCELED'
                                    ? 'bg-red-100 text-red-700 border border-red-200 font-extrabold'
                                    : String(order.status).toUpperCase() === 'DELIVERED' 
                                      ? 'bg-green-100 text-green-700 border border-green-200'
                                      : String(order.status).toUpperCase() === 'SHIPPED'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : String(order.status).toUpperCase() === 'PROCESSING' || String(order.status).toUpperCase() === 'VERIFIED'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {order.status}
                                </span>
                                {(String(order.status).toUpperCase() === 'CANCELLED' || String(order.status).toUpperCase() === 'CANCELED') && (order as any).cancellation_reason && (
                                  <div className="text-[10px] text-red-600 font-sans mt-1 text-right max-w-[180px] leading-tight font-medium">
                                    <span className="font-semibold">Reason:</span> {(order as any).cancellation_reason}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in space-y-6 max-w-xl">
              <h2 className="font-serif text-xl font-bold text-brand-heading flex items-center gap-2 select-none">
                <User size={20} className="text-[#C9A84C]" />
                <span>Profile Settings</span>
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5 opacity-70">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full h-11 px-4 bg-stone-100 rounded-xl border border-brand-border/50 text-sm font-sans cursor-not-allowed text-brand-body/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="mt-4 px-8 py-3 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>

              {/* Security & Password Section */}
              <div className="pt-6 border-t border-brand-border/20 space-y-4">
                <div>
                  <h3 className="font-serif text-sm font-bold text-brand-heading">Security & Password</h3>
                  <p className="text-xs text-brand-body/60 font-sans">
                    Need to change or forgot your password? Trigger a secure reset link.
                  </p>
                </div>

                <div className="bg-brand-cream/40 border border-brand-border/50 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs font-bold text-brand-heading">Reset Password via Email</span>
                    <span className="block text-[11px] text-brand-body/60 mt-0.5">
                      Sends a recovery link to <strong>{user.email}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const redirectUrl = `${window.location.origin}/update-password`;
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: redirectUrl,
                        });
                        if (error) throw error;
                        showToast('Password reset link sent to your email!', 'success');
                      } catch (err: any) {
                        showToast(err.message || 'Failed to send reset email.', 'error');
                      }
                    }}
                    className="px-4 py-2 bg-white border border-brand-border text-brand-heading hover:bg-brand-cream text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRACK MY ORDER */}
          {activeTab === 'track' && (
            <div className="animate-fade-in space-y-6">
              <div className="border-b border-brand-border/20 pb-4">
                <h2 className="font-serif text-xl font-bold text-brand-heading flex items-center gap-2 select-none">
                  <Truck size={20} className="text-[#C9A84C]" />
                  <span>Track My Order</span>
                </h2>
                <p className="text-xs text-brand-body/65 font-sans mt-1">
                  View live courier dispatch, carrier partners, and consignment tracking numbers for your orders.
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center select-none space-y-3">
                  <div className="bg-brand-cream inline-flex p-4 rounded-full text-brand-accent mb-2">
                    <Truck size={28} />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-heading">No Active Consignments</h3>
                  <p className="text-xs text-brand-body/70 max-w-xs mx-auto">
                    You don't have any placed orders yet. Place an order to track live delivery.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.orderId} className="bg-white border border-brand-border/40 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border/20 pb-3">
                        <div>
                          <span className="text-[10px] text-brand-body/55 uppercase tracking-wider block font-semibold">Order ID</span>
                          <span className="font-mono text-sm font-bold text-brand-heading">#{order.orderId}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                          String(order.status).toUpperCase() === 'CANCELLED'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : String(order.status).toUpperCase() === 'DELIVERED'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : String(order.status).toUpperCase() === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {order.tracking_number ? (
                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 space-y-2.5">
                          <p className="text-xs text-brand-body/70 font-sans leading-relaxed">
                            Please visit the official website of the courier partner below and enter your AWB Tracking Number for live updates.
                          </p>
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 pt-1 border-t border-blue-200/60">
                            <Truck size={14} className="text-blue-600" />
                            <span>Courier Partner: {order.carrier || 'Express Logistics'}</span>
                          </div>
                          <div className="flex flex-wrap justify-between items-center text-xs font-sans text-blue-950 pt-1">
                            <span>AWB Tracking No: <strong className="font-mono text-sm">{order.tracking_number}</strong></span>
                            <a
                              href={`https://t.17track.net/en#nums=${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider transition hover:bg-blue-100/50 shadow-2xs mt-1 sm:mt-0"
                            >
                              Track Live →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-4 text-xs text-brand-body/70 font-sans space-y-1">
                          <p className="font-semibold text-brand-heading">Processing & Quality Inspection</p>
                          <p className="text-[11px]">
                            {String(order.status).toUpperCase() === 'CANCELLED' 
                              ? 'This consignment was cancelled.' 
                              : 'Your handcrafted floral arrangement is being package-sealed. Tracking number will be assigned upon carrier pickup.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-heading flex items-center gap-2 select-none">
                <Heart size={20} className="text-[#C9A84C] fill-current" />
                <span>My Wishlist</span>
              </h2>

              {wishlist.length === 0 ? (
                <div className="py-16 text-center select-none space-y-3">
                  <div className="bg-brand-cream inline-flex p-4 rounded-full text-brand-accent mb-2">
                    <Heart size={28} />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-heading">Your wishlist is currently empty</h3>
                  <p className="text-xs text-brand-body/70 max-w-xs mx-auto">
                    Save your favourite blooms to keep track of arrangements you love.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block mt-4 bg-[#DCA29A] hover:bg-[#D4938A] text-white px-7 py-3 rounded-full font-sans font-semibold tracking-widest text-xs uppercase transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map((item) => {
                    const fullProd = productsList.find(p => p.id === item.id) || {
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      description: item.description,
                      slug: (item as any).slug || getProductSlug(item.id) || item.id,
                      stock: 10
                    };
                    return <ProductCard key={item.id} product={fullProd as any} />;
                  })}
                </div>
              )}
            </div>
          )}

          {/* MY ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-serif text-brand-heading font-bold">My Addresses</h2>
                <button
                  onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                  className="h-9 px-4 bg-brand-heading text-white rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-brand-heading/90 transition cursor-pointer select-none"
                >
                  <Plus size={13} /> Add New
                </button>
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <div className="bg-white/70 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs animate-fade-in">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-brand-heading">{editingAddress ? 'Edit Address' : 'New Address'}</h3>
                    <button type="button" onClick={resetAddressForm} className="text-brand-body/50 hover:text-brand-heading cursor-pointer"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleSaveAddress} className="grid grid-cols-2 gap-4">
                    {/* Label */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Label</label>
                      <div className="flex gap-2">
                        {['Home', 'Office', 'Other'].map(l => (
                          <button key={l} type="button" onClick={() => setAddrLabel(l)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${ addrLabel === l ? 'bg-brand-heading text-white border-brand-heading' : 'border-brand-border/60 text-brand-body/70 hover:border-brand-heading' }`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Phone */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Phone *</label>
                      <input type="tel" value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="e.g. 9876543210" required className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                    </div>
                    {/* House No */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">House / Flat No *</label>
                      <input type="text" value={addrHouseNo} onChange={e => setAddrHouseNo(e.target.value)} placeholder="e.g. 4B, Tower C" required className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                    </div>
                    {/* Area */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Area / Street / Sector *</label>
                      <input type="text" value={addrArea} onChange={e => setAddrArea(e.target.value)} placeholder="e.g. Sector 12, Indira Nagar" required className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                    </div>
                    {/* Landmark */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Landmark <span className="normal-case font-normal text-brand-body/40">(Optional)</span></label>
                      <input type="text" value={addrLandmark} onChange={e => setAddrLandmark(e.target.value)} placeholder="e.g. Near City Mall" className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                    </div>
                    {/* City */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">City *</label>
                      <input type="text" value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="e.g. Lucknow" required className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                    </div>
                    {/* State */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">State *</label>
                      <select value={addrState} onChange={e => setAddrState(e.target.value)} required className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all">
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {/* Pincode */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading/80 mb-1.5">Pincode *</label>
                      <input type="text" value={addrPincode} onChange={e => setAddrPincode(e.target.value.replace(/\D/g,''))} placeholder="226010" maxLength={6} required className="w-full h-10 px-3 rounded-xl border border-brand-border/70 bg-white/95 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                    </div>
                    {/* Default toggle */}
                    <div className="col-span-2 flex items-center gap-3">
                      <input type="checkbox" id="addrDefault" checked={addrIsDefault} onChange={e => setAddrIsDefault(e.target.checked)} className="w-4 h-4 accent-brand-accent cursor-pointer" />
                      <label htmlFor="addrDefault" className="text-xs text-brand-body/80 cursor-pointer">Set as default delivery address</label>
                    </div>
                    {/* Buttons */}
                    <div className="col-span-2 flex gap-3 pt-2">
                      <button type="submit" disabled={savingAddress} className="h-10 px-6 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer disabled:opacity-60">
                        {savingAddress ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                      </button>
                      <button type="button" onClick={resetAddressForm} className="h-10 px-5 border border-brand-border/60 text-brand-body/70 rounded-full text-xs font-semibold hover:bg-brand-cream/60 transition cursor-pointer">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Address Cards */}
              {loadingAddresses ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" /></div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-14 bg-white/50 border border-brand-border/30 rounded-3xl">
                  <MapPin size={32} className="text-brand-body/25 mx-auto mb-3" />
                  <p className="text-sm font-serif text-brand-heading">No saved addresses yet.</p>
                  <p className="text-xs text-brand-body/55 font-sans mt-1">Add an address for 1-click checkout.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="bg-white/70 border border-brand-border/40 rounded-2xl p-5 shadow-xs relative">
                      {addr.is_default && (
                        <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Check size={9} /> Default
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={13} className="text-brand-accent shrink-0" />
                        <span className="text-xs font-bold text-brand-heading uppercase tracking-wider">{addr.label}</span>
                      </div>
                      <p className="text-xs text-brand-body/75 font-sans leading-relaxed">
                        {addr.house_no}, {addr.area}{addr.landmark ? `, Near ${addr.landmark}` : ''}<br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      {addr.phone && <p className="text-[11px] text-brand-body/55 mt-1.5">{addr.phone}</p>}
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => openEditAddress(addr)} className="h-8 px-3 border border-brand-border/50 rounded-full text-[10px] font-semibold flex items-center gap-1.5 hover:bg-brand-cream/60 transition cursor-pointer">
                          <Edit3 size={10} /> Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="h-8 px-3 border border-red-200 text-red-500 rounded-full text-[10px] font-semibold flex items-center gap-1.5 hover:bg-red-50 transition cursor-pointer">
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
