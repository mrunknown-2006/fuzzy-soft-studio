import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { 
  User, LogOut, Package, Sparkles, 
  MapPin, Heart, Plus, Edit2, Trash2 
} from 'lucide-react';
import { products as staticProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

interface Order {
  orderId: string;
  created_at?: string;
  total_amount: number;
  status: string;
  items: any[];
}

interface AddressItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  isDefault: boolean;
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
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'wishlist'>('orders');

  // Profile Settings Form State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address Book State
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);

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

        // Load saved addresses from user metadata or local storage
        if (Array.isArray(meta.addresses) && meta.addresses.length > 0) {
          setAddresses(meta.addresses);
        } else {
          try {
            const local = localStorage.getItem(`fss_addresses_${session.user.id}`);
            if (local) setAddresses(JSON.parse(local));
          } catch {}
        }

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
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
        }));
        setOrders(mappedOrders);
      } else {
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
      console.warn('Supabase orders query warning:', err.message);
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

  // Address CRUD Handlers
  const saveAddressesToMeta = async (updated: AddressItem[]) => {
    setAddresses(updated);
    if (session?.user?.id) {
      try {
        localStorage.setItem(`fss_addresses_${session.user.id}`, JSON.stringify(updated));
        await supabase.auth.updateUser({
          data: { addresses: updated }
        });
      } catch (err) {
        console.warn('Sync addresses error:', err);
      }
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrStreet || !addrCity || !addrPincode) {
      showToast('Please fill in all address fields', 'error');
      return;
    }

    let updated: AddressItem[];
    if (editingAddressId) {
      updated = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            id: a.id,
            name: addrName,
            phone: addrPhone,
            address: addrStreet,
            city: addrCity,
            pincode: addrPincode,
            isDefault: addrDefault
          };
        }
        return addrDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const newAddr: AddressItem = {
        id: `addr_${Date.now()}`,
        name: addrName,
        phone: addrPhone,
        address: addrStreet,
        city: addrCity,
        pincode: addrPincode,
        isDefault: !!(addrDefault || addresses.length === 0)
      };
      updated = addrDefault 
        ? [...addresses.map(a => ({ ...a, isDefault: false })), newAddr]
        : [...addresses, newAddr];
    }

    saveAddressesToMeta(updated);
    showToast(editingAddressId ? 'Address updated' : 'New address added', 'success');
    resetAddressForm();
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    saveAddressesToMeta(updated);
    showToast('Address deleted', 'success');
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    saveAddressesToMeta(updated);
    showToast('Default address updated', 'success');
  };

  const startEditAddress = (a: AddressItem) => {
    setEditingAddressId(a.id);
    setAddrName(a.name);
    setAddrPhone(a.phone);
    setAddrStreet(a.address);
    setAddrCity(a.city);
    setAddrPincode(a.pincode);
    setAddrDefault(!!a.isDefault);
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrName('');
    setAddrPhone('');
    setAddrStreet('');
    setAddrCity('');
    setAddrPincode('');
    setAddrDefault(false);
    setShowAddressForm(false);
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
            onClick={() => setActiveTab('addresses')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-brand-heading text-white shadow-xs'
                : 'text-brand-body/75 hover:bg-brand-cream/80 hover:text-brand-heading'
            }`}
          >
            <MapPin size={16} />
            <span>Address Book</span>
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
                <div className="overflow-x-auto">
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
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                              order.status === 'Delivered' 
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : order.status === 'Shipped'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : order.status === 'Crafting'
                                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
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
            </div>
          )}

          {/* TAB 3: ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between border-b border-brand-border/20 pb-4">
                <h2 className="font-serif text-xl font-bold text-brand-heading flex items-center gap-2 select-none">
                  <MapPin size={20} className="text-[#C9A84C]" />
                  <span>Saved Addresses</span>
                </h2>
                {!showAddressForm && (
                  <button
                    onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                    className="px-4 py-2 bg-brand-heading text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer hover:bg-brand-heading-hover shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Address Form */}
              {showAddressForm ? (
                <form onSubmit={handleSaveAddress} className="bg-brand-cream/35 border border-brand-border/40 rounded-2xl p-5 space-y-4 max-w-xl">
                  <h3 className="font-serif text-sm font-bold text-brand-heading">
                    {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={addrName}
                        onChange={(e) => setAddrName(e.target.value)}
                        className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Street Address / House No. *</label>
                    <input
                      type="text"
                      required
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">City *</label>
                      <input
                        type="text"
                        required
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={addrPincode}
                        onChange={(e) => setAddrPincode(e.target.value)}
                        className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={addrDefault}
                      onChange={(e) => setAddrDefault(e.target.checked)}
                      className="w-4 h-4 accent-brand-accent cursor-pointer"
                    />
                    <span className="text-xs text-brand-heading font-medium">Set as Default Delivery Address</span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-brand-heading text-white rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer hover:bg-brand-heading-hover"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={resetAddressForm}
                      className="px-6 py-2.5 bg-white border border-brand-border text-brand-body/75 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer hover:bg-brand-cream"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Address Cards Grid */}
              {addresses.length === 0 && !showAddressForm ? (
                <div className="py-12 text-center select-none space-y-2">
                  <p className="text-xs text-brand-body/60">No saved addresses found in your address book.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                        a.isDefault
                          ? 'bg-white border-[#C9A84C] shadow-xs ring-1 ring-[#C9A84C]/30'
                          : 'bg-white/80 border-brand-border/60 hover:border-brand-border'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif text-sm font-bold text-brand-heading">{a.name}</h4>
                          {a.isDefault && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-body/75 leading-relaxed">{a.address}</p>
                        <p className="text-xs text-brand-body/75">{a.city} - {a.pincode}</p>
                        <p className="text-[11px] text-brand-body/55 font-mono pt-1">Phone: {a.phone}</p>
                      </div>

                      <div className="flex items-center gap-3 pt-4 mt-3 border-t border-brand-border/20 text-xs">
                        <button
                          onClick={() => startEditAddress(a)}
                          className="flex items-center gap-1 text-brand-heading font-semibold hover:text-brand-accent transition cursor-pointer"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(a.id)}
                          className="flex items-center gap-1 text-red-500 font-semibold hover:text-red-700 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                        {!a.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(a.id)}
                            className="ml-auto text-[10px] font-bold text-[#8FA088] uppercase hover:underline cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
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

        </div>
      </div>
    </div>
  );
}
