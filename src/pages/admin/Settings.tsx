import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Truck, Activity, Upload, Trash2, Shield, LogOut, Key, Eye, EyeOff, Globe } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';
import Toggle from '../../components/ui/Toggle';

export default function Settings() {
  const { 
    storeOpen,
    setStoreOpen,
    lowStockThreshold,
    codAvailable,
    setCodAvailable,
    codCharge,
    setCodCharge,
    settings,
    setSettings,
    showToast
  } = useOutletContext<AdminContext>();

  // Operational form state
  const [freeThreshold, setFreeThreshold] = useState(999);
  const [shippingFee, setShippingFee] = useState(99);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoHideOutOfStock, setAutoHideOutOfStock] = useState(false);

  // Initial DB settings snapshot for dirty-checking
  const [initialState, setInitialState] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Tab control
  const [activeTab, setActiveTab] = useState<'brand' | 'checkout' | 'operations' | 'security'>('brand');

  // Security Credentials state
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);

  // Load Auth Email
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setCurrentUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  // Synchronize values from context and DB
  useEffect(() => {
    const fetchSettingsFromDB = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*');
        
        if (data && !error) {
          const generalSetting = data.find((s: any) => s.key === 'general');
          if (generalSetting && generalSetting.value) {
            const val = generalSetting.value;
            const openVal = val.store_open === true || val.store_open === 'true';
            const ft = Number(val.free_delivery_threshold) || 999;
            const sf = Number(val.shipping_charges) || 99;
            const wa = String(val.whatsapp_number || '');
            const em = String(val.contact_email || '');
            const cod = val.cod_available === true || val.cod_available === 'true';
            const cc = Number(val.cod_charge) || 0;
            const waAlert = val.whatsapp_alerts === true || val.whatsapp_alerts === 'true';
            const emAlert = val.email_alerts === true || val.email_alerts === 'true';
            const autoHide = val.auto_hide_out_of_stock === true || val.auto_hide_out_of_stock === 'true';
            const logo = String(val.store_logo_url || '');
            const fav = String(val.favicon_url || '');

            setStoreOpen(openVal);
            setFreeThreshold(ft);
            setShippingFee(sf);
            setWhatsapp(wa);
            setEmail(em);
            setCodAvailable(cod);
            setCodCharge(cc);
            setWhatsappAlerts(waAlert);
            setEmailAlerts(emAlert);
            setAutoHideOutOfStock(autoHide);
            setStoreLogoUrl(logo);
            setFaviconUrl(fav);

            setInitialState({
              storeOpen: openVal,
              freeThreshold: ft,
              shippingFee: sf,
              whatsapp: wa,
              email: em,
              codAvailable: cod,
              codCharge: cc,
              whatsappAlerts: waAlert,
              emailAlerts: emAlert,
              autoHideOutOfStock: autoHide,
              storeLogoUrl: logo,
              faviconUrl: fav
            });
          }
        }
      } catch (err) {
        console.warn('Could not load settings values:', err);
      }
    };
    fetchSettingsFromDB();
  }, [settings]);

  // Dirty checking logic
  const isDirty = (() => {
    if (!initialState) return false;
    return (
      storeOpen !== initialState.storeOpen ||
      freeThreshold !== initialState.freeThreshold ||
      shippingFee !== initialState.shippingFee ||
      whatsapp !== initialState.whatsapp ||
      email !== initialState.email ||
      codAvailable !== initialState.codAvailable ||
      codCharge !== initialState.codCharge ||
      whatsappAlerts !== initialState.whatsappAlerts ||
      emailAlerts !== initialState.emailAlerts ||
      autoHideOutOfStock !== initialState.autoHideOutOfStock ||
      storeLogoUrl !== initialState.storeLogoUrl ||
      faviconUrl !== initialState.faviconUrl
    );
  })();

  const handleDiscard = () => {
    if (!initialState) return;
    setStoreOpen(initialState.storeOpen);
    setFreeThreshold(initialState.freeThreshold);
    setShippingFee(initialState.shippingFee);
    setWhatsapp(initialState.whatsapp);
    setEmail(initialState.email);
    setCodAvailable(initialState.codAvailable);
    setCodCharge(initialState.codCharge);
    setWhatsappAlerts(initialState.whatsappAlerts);
    setEmailAlerts(initialState.emailAlerts);
    setAutoHideOutOfStock(initialState.autoHideOutOfStock);
    setStoreLogoUrl(initialState.storeLogoUrl);
    setFaviconUrl(initialState.faviconUrl);
    showToast('Changes discarded.', 'success');
  };

  const handleSaveAllSettings = async () => {
    setSaving(true);
    const payloadObject = {
      store_open: storeOpen,
      free_delivery_threshold: freeThreshold,
      shipping_charges: shippingFee,
      whatsapp_number: whatsapp.trim(),
      contact_email: email.trim(),
      cod_available: codAvailable,
      cod_charge: codCharge,
      whatsapp_alerts: whatsappAlerts,
      email_alerts: emailAlerts,
      auto_hide_out_of_stock: autoHideOutOfStock,
      store_logo_url: storeLogoUrl || null,
      favicon_url: faviconUrl || null,
      low_stock_threshold: lowStockThreshold || 5,
      order_id_prefix: 'FSS-'
    };

    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert(
          { key: 'general', value: payloadObject, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw error;

      setSettings({
        free_delivery_threshold: freeThreshold,
        shipping_charges: shippingFee,
        whatsapp_number: whatsapp.trim(),
        contact_email: email.trim(),
        offer_line: settings.offer_line,
        banner_url: settings.banner_url,
        store_logo_url: storeLogoUrl || '',
        favicon_url: faviconUrl || ''
      });

      setInitialState({
        storeOpen,
        freeThreshold,
        shippingFee,
        whatsapp,
        email,
        codAvailable,
        codCharge,
        whatsappAlerts,
        emailAlerts,
        autoHideOutOfStock,
        storeLogoUrl,
        faviconUrl
      });

      showToast('Settings saved successfully!', 'success');
    } catch (err: any) {
      console.error('SAVE SETTINGS ERROR:', err);
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Logo Upload pipeline
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { error: uploadErr } = await supabase.storage
        .from('content')
        .upload('store-logo.webp', file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage
        .from('content')
        .getPublicUrl('store-logo.webp');
      
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      setStoreLogoUrl(publicUrl);
      showToast('Logo uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleLogoDelete = () => {
    setStoreLogoUrl('');
    showToast('Logo removed. Save changes to persist.', 'success');
  };

  // Favicon Upload pipeline
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const { error: uploadErr } = await supabase.storage
        .from('content')
        .upload('store-favicon.png', file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage
        .from('content')
        .getPublicUrl('store-favicon.png');
      
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      setFaviconUrl(publicUrl);
      showToast('Favicon uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Favicon upload error:', err);
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  const handleFaviconDelete = () => {
    setFaviconUrl('');
    showToast('Favicon removed. Save changes to persist.', 'success');
  };

  // Credential update security logic
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Current Password is required.', 'error');
      return;
    }
    if (!newEmail && !newPassword) {
      showToast('Please enter a new email or password to update.', 'error');
      return;
    }

    setUpdatingCredentials(true);
    try {
      // 1. Re-authenticate
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: currentUserEmail,
        password: currentPassword
      });

      if (signInErr) {
        throw new Error(`Current password verification failed: ${signInErr.message}`);
      }

      // 2. Update user
      const updateData: any = {};
      if (newEmail.trim()) updateData.email = newEmail.trim();
      if (newPassword.trim()) updateData.password = newPassword.trim();

      const { error: updateErr } = await supabase.auth.updateUser(updateData);
      if (updateErr) throw updateErr;

      showToast('Credentials updated successfully!', 'success');
      setSecurityModalOpen(false);
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Credential update error:', err);
      showToast(err.message, 'error');
    } finally {
      setUpdatingCredentials(false);
    }
  };

  // Terminate stale remote sessions
  const handleLogOutOthers = async () => {
    if (!window.confirm('Are you sure you want to log out of all other devices? This will terminate all active administrative sessions except this one.')) return;
    setLoggingOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      showToast('Successfully logged out of all other devices.', 'success');
    } catch (err: any) {
      console.error('Sign out others failed:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoggingOutOthers(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-up pb-24 relative select-none">
      
      {/* Horizontal Tabs */}
      <div className="flex border-b border-brand-border/30 pb-px">
        {[
          { id: 'brand', label: 'Brand Assets', icon: <Globe size={14} /> },
          { id: 'checkout', label: 'Checkout & Fees', icon: <Truck size={14} /> },
          { id: 'operations', label: 'Operations', icon: <Activity size={14} /> },
          { id: 'security', label: 'Security & Access', icon: <Shield size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold tracking-wider uppercase transition-all duration-200 border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#B07870] text-[#B07870]'
                : 'border-transparent text-brand-body/60 hover:text-brand-heading'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* TAB 1: BRAND ASSETS */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            
            {/* Logo Card */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Store Logo</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Upload your main brand logo used in headers, invoices, and website layouts.</p>
              </div>
              <div className="flex items-center gap-6">
                {storeLogoUrl ? (
                  <div className="h-16 w-32 bg-brand-cream/20 border border-brand-border/30 rounded-xl flex items-center justify-center p-2">
                    <img 
                      src={storeLogoUrl} 
                      alt="Logo Preview" 
                      className="max-h-12 w-auto object-contain" 
                    />
                  </div>
                ) : (
                  <div className="h-16 w-32 bg-brand-cream/35 border border-brand-border/60 rounded-xl flex items-center justify-center text-[10px] text-brand-body/50 font-sans uppercase tracking-wider">
                    No Logo
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="h-10 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition">
                    <Upload size={14} />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      disabled={uploadingLogo} 
                    />
                  </label>
                  {storeLogoUrl && (
                    <button
                      type="button"
                      onClick={handleLogoDelete}
                      className="h-10 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Favicon Card */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Browser Favicon</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Upload a small favicon image displayed in browser tabs and bookmark bars.</p>
              </div>
              <div className="flex items-center gap-6">
                {faviconUrl ? (
                  <div className="h-16 w-16 bg-brand-cream/20 border border-brand-border/30 rounded-xl flex items-center justify-center p-2">
                    <img 
                      src={faviconUrl} 
                      alt="Favicon Preview" 
                      className="h-8 w-8 object-contain" 
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-brand-cream/35 border border-brand-border/60 rounded-xl flex items-center justify-center text-[10px] text-brand-body/50 font-sans uppercase tracking-wider">
                    None
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="h-10 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition">
                    <Upload size={14} />
                    <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}</span>
                    <input 
                      type="file" 
                      accept="image/png, image/x-icon, image/gif, image/jpeg" 
                      onChange={handleFaviconUpload} 
                      className="hidden" 
                      disabled={uploadingFavicon} 
                    />
                  </label>
                  {faviconUrl && (
                    <button
                      type="button"
                      onClick={handleFaviconDelete}
                      className="h-10 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CHECKOUT & FEES */}
        {activeTab === 'checkout' && (
          <div className="space-y-6">
            
            {/* Fees Configuration */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Free Delivery & Shipping Charges</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Control pricing rules for standard delivery charges on order checkout.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Standard Shipping Fee (₹)</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Payment Options</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Toggle and configure Convenience Fee for Cash On Delivery transactions.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-brand-heading">Cash On Delivery (COD)</span>
                    <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5 font-normal">Allow users to pay with cash upon receiving flowers</span>
                  </div>
                  <Toggle checked={codAvailable} onChange={setCodAvailable} />
                </div>
                {codAvailable && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-[#B07870]/30 animate-fade-in">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">COD Convenience Fee (₹)</label>
                    <input
                      type="number"
                      value={codCharge}
                      min={0}
                      onChange={(e) => setCodCharge(Number(e.target.value))}
                      className="w-full sm:w-64 h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: OPERATIONS */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            
            {/* Store Maintenance */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Store Maintenance Mode</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Toggle catalog locking for database updates or off-season periods.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-[#B07870]">Enable Maintenance Page</span>
                  <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5 font-normal">Locks client store checkout and shows standard banner message</span>
                </div>
                <Toggle checked={!storeOpen} onChange={(checked) => setStoreOpen(!checked)} />
              </div>
            </div>

            {/* Notification Services */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Transactional Alerts</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Manage automated delivery and confirmation communications.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-brand-heading">WhatsApp Order Alerts</span>
                    <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5 font-normal">Push notification alerts immediately after purchase</span>
                  </div>
                  <Toggle checked={whatsappAlerts} onChange={setWhatsappAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-brand-heading">Email Receipts</span>
                    <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5 font-normal">Send automated digital invoice copies to customer emails</span>
                  </div>
                  <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
                </div>
              </div>
            </div>

            {/* Store Catalog Behavior */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Catalog Visibility</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Control how out-of-stock items are presented inside public catalog galleries.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-brand-heading">Auto-Hide Out of Stock Items</span>
                  <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5 font-normal">When active, products with stock = 0 will be hidden from client listing</span>
                </div>
                <Toggle checked={autoHideOutOfStock} onChange={setAutoHideOutOfStock} />
              </div>
            </div>

            {/* Store Helplines */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Transactional Contact Information</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Setup helpline coordinates printed on client emails and order pages.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Support Helpline WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 916386422660"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Support Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@fuzzysoftstudio.com"
                    className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: SECURITY & ACCESS */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Identity card */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading flex items-center gap-2">
                  <Shield size={16} className="text-green-600" />
                  <span>Admin Identity Profile</span>
                </h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Currently active Supabase administrator credentials and access levels.</p>
              </div>
              <div className="flex items-center gap-4 bg-brand-cream/15 border border-brand-border/20 p-4 rounded-2xl">
                <div className="flex-1">
                  <p className="text-xs font-sans text-brand-body/50 uppercase tracking-wider font-bold">Email Username</p>
                  <p className="text-sm font-semibold text-brand-heading mt-0.5">{currentUserEmail || 'Loading username...'}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full select-none">
                  Super Admin
                </span>
              </div>
            </div>

            {/* Credential settings */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Credential Operations</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Safely update your login email or password. Requires active security verification.</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(true)}
                  className="h-11 px-5 bg-white border border-brand-border hover:bg-brand-cream text-brand-heading rounded-full flex items-center gap-2 text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <Key size={14} />
                  <span>Change Admin Credentials</span>
                </button>
              </div>
            </div>

            {/* Terminate active sessions */}
            <div className="bg-white/60 border border-brand-border/40 rounded-3xl p-6 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-heading">Remote Sessions Management</h4>
                <p className="text-xs text-brand-body/60 font-sans mt-0.5">Terminate all stale login tokens and active sessions on other browser devices.</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleLogOutOthers}
                  disabled={loggingOutOthers}
                  className="h-11 px-5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-full flex items-center gap-2 text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={14} />
                  <span>{loggingOutOthers ? 'Terminating sessions...' : 'Log out of all other devices'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating unsaved changes bar */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#1e1e1e] text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-6 border border-white/10 animate-fade-in-up">
          <span className="text-xs font-medium tracking-wide font-sans">You have unsaved changes</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="text-xs font-semibold hover:text-gray-300 transition-colors uppercase px-3 py-1.5 cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAllSettings}
              disabled={saving}
              className="bg-[#DCA29A] hover:bg-[#D4938A] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition active:scale-95 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Security Verification Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border/50 max-w-md w-full rounded-3xl p-8 shadow-2xl relative space-y-6 animate-scale-up">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-brand-heading">Security Verification Required</h3>
              <p className="text-xs text-brand-body/65 font-sans">Confirm your current password to execute administrative credential changes.</p>
            </div>
            
            <form onSubmit={handleUpdateCredentials} className="space-y-4 font-sans">
              
              {/* Current Password (Mandatory) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Current Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3 text-brand-body/60 hover:text-brand-heading"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="border-t border-brand-border/20 my-2 pt-2">
                <p className="text-[10px] text-brand-body/50 uppercase font-bold tracking-wider mb-2">New Security Coordinates (Optional)</p>
              </div>

              {/* New Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">New Email Username</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none"
                  placeholder="e.g. admin@fuzzysoftstudio.com"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 bg-white rounded-xl border border-brand-border/70 text-xs focus:outline-none"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-brand-body/60 hover:text-brand-heading"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 text-xs font-semibold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => {
                    setSecurityModalOpen(false);
                    setCurrentPassword('');
                    setNewEmail('');
                    setNewPassword('');
                  }}
                  className="h-11 px-5 border border-brand-border rounded-full hover:bg-brand-cream transition select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCredentials}
                  className="h-11 px-5 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full transition select-none cursor-pointer disabled:opacity-50"
                >
                  {updatingCredentials ? 'Updating...' : 'Update credentials'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
