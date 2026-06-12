import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings as SettingsIcon, Truck, Bell, Activity, Upload, Trash2 } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';
import Toggle from '../../components/ui/Toggle';

export default function Settings() {
  const { 
    storeOpen,
    setStoreOpen,
    lowStockThreshold,
    setLowStockThreshold,
    codAvailable,
    setCodAvailable,
    codCharge,
    setCodCharge,
    settings,
    setSettings
  } = useOutletContext<AdminContext>();

  // State local to settings page
  const [freeThreshold, setFreeThreshold] = useState(999);
  const [shippingFee, setShippingFee] = useState(99);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [orderIdPrefix, setOrderIdPrefix] = useState('FSS-');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Notifications
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const [saving, setSaving] = useState(false);

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
      
      const publicUrl = data.publicUrl;
      setStoreLogoUrl(publicUrl);

      const payloadObject = {
        store_open: storeOpen,
        low_stock_threshold: lowStockThreshold,
        free_delivery_threshold: freeThreshold,
        shipping_charges: shippingFee,
        whatsapp_number: whatsapp.trim(),
        contact_email: email.trim(),
        cod_available: codAvailable,
        cod_charge: codCharge,
        whatsapp_alerts: whatsappAlerts,
        email_alerts: emailAlerts,
        order_id_prefix: orderIdPrefix.trim(),
        store_logo_url: publicUrl
      };

      const { error: saveErr } = await supabase
        .from('store_settings')
        .upsert(
          { key: 'general', value: payloadObject, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (saveErr) throw saveErr;

      setSettings({
        free_delivery_threshold: freeThreshold,
        shipping_charges: shippingFee,
        whatsapp_number: whatsapp.trim(),
        contact_email: email.trim(),
        offer_line: settings.offer_line,
        banner_url: settings.banner_url,
        store_logo_url: publicUrl
      });

      alert('Logo uploaded successfully!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Are you sure you want to remove the store logo?')) return;

    try {
      setStoreLogoUrl('');

      const payloadObject = {
        store_open: storeOpen,
        low_stock_threshold: lowStockThreshold,
        free_delivery_threshold: freeThreshold,
        shipping_charges: shippingFee,
        whatsapp_number: whatsapp.trim(),
        contact_email: email.trim(),
        cod_available: codAvailable,
        cod_charge: codCharge,
        whatsapp_alerts: whatsappAlerts,
        email_alerts: emailAlerts,
        store_logo_url: ''
      };

      const { error: saveErr } = await supabase
        .from('store_settings')
        .upsert(
          { key: 'general', value: payloadObject, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (saveErr) throw saveErr;

      setSettings({
        free_delivery_threshold: freeThreshold,
        shipping_charges: shippingFee,
        whatsapp_number: whatsapp.trim(),
        contact_email: email.trim(),
        offer_line: settings.offer_line,
        banner_url: settings.banner_url,
        store_logo_url: ''
      });

      alert('Logo removed successfully!');
    } catch (err: any) {
      console.error('Logo delete error:', err);
      alert('Delete failed: ' + err.message);
    }
  };

  // Sync settings when loaded
  useEffect(() => {
    setFreeThreshold(settings.free_delivery_threshold);
    setShippingFee(settings.shipping_charges);
    setWhatsapp(settings.whatsapp_number);
    setEmail(settings.contact_email);
    setStoreLogoUrl(settings.store_logo_url || '');

    // Fetch extra custom settings keys
    const fetchSettingsFromDB = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*');
        console.log('Settings page fetchSettingsFromDB:', data, error);
        
        if (data) {
          const generalSetting = data.find((s: any) => s.key === 'general');
          if (generalSetting && generalSetting.value) {
            const val = generalSetting.value;
            if (val.store_open !== undefined) setStoreOpen(val.store_open === true || val.store_open === 'true');
            if (val.low_stock_threshold !== undefined) setLowStockThreshold(Number(val.low_stock_threshold) || 5);
            if (val.free_delivery_threshold !== undefined) setFreeThreshold(Number(val.free_delivery_threshold) || 999);
            if (val.shipping_charges !== undefined) setShippingFee(Number(val.shipping_charges) || 99);
            if (val.whatsapp_number !== undefined) setWhatsapp(String(val.whatsapp_number || ''));
            if (val.contact_email !== undefined) setEmail(String(val.contact_email || ''));
            if (val.cod_available !== undefined) setCodAvailable(val.cod_available === true || val.cod_available === 'true');
            if (val.cod_charge !== undefined) setCodCharge(Number(val.cod_charge) || 0);
            if (val.whatsapp_alerts !== undefined) setWhatsappAlerts(val.whatsapp_alerts === true || val.whatsapp_alerts === 'true');
            if (val.email_alerts !== undefined) setEmailAlerts(val.email_alerts === true || val.email_alerts === 'true');
            if (val.order_id_prefix !== undefined) setOrderIdPrefix(String(val.order_id_prefix || 'FSS-'));
            if (val.store_logo_url !== undefined) setStoreLogoUrl(String(val.store_logo_url || ''));
          }
        }
      } catch (err) {
        console.warn('Could not load settings values:', err);
      }
    };
    fetchSettingsFromDB();
  }, [settings]);

  // Combined Save Settings Handler
  const handleSaveAllSettings = async () => {
    console.log("Supabase client:", supabase);
    setSaving(true);

    const payloadObject = {
      store_open: storeOpen,
      low_stock_threshold: lowStockThreshold,
      free_delivery_threshold: freeThreshold,
      shipping_charges: shippingFee,
      whatsapp_number: whatsapp.trim(),
      contact_email: email.trim(),
      cod_available: codAvailable,
      cod_charge: codCharge,
      whatsapp_alerts: whatsappAlerts,
      email_alerts: emailAlerts,
      order_id_prefix: orderIdPrefix.trim(),
      store_logo_url: storeLogoUrl
    };

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .upsert(
          { key: 'general', value: payloadObject, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .select();

      if (error) {
        console.error('SAVE ERROR:', error);
        alert('Save failed: ' + error.message);
        return;
      }
      console.log('SAVED:', data);
      alert('Saved successfully!');

      setSettings({
        free_delivery_threshold: freeThreshold,
        shipping_charges: shippingFee,
        whatsapp_number: whatsapp.trim(),
        contact_email: email.trim(),
        offer_line: settings.offer_line,
        banner_url: settings.banner_url,
        store_logo_url: storeLogoUrl
      });
      localStorage.setItem('fuzzy-soft-studio-settings', JSON.stringify(payloadObject));
    } catch (err: any) {
      console.error('SAVE EXCEPTION:', err);
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-up pb-12">
      
      {/* 1. Store Status Section */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
          <Activity size={16} className="text-[#C9A84C]" />
          <span>Store Status</span>
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-heading">Temporary Maintenance</p>
            <p className="text-xs text-brand-body/60 font-sans mt-0.5">When disabled, customers see a closed message overlay and cannot place orders</p>
          </div>
          <Toggle checked={storeOpen} onChange={setStoreOpen} />
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Global Low Stock Alert Threshold</label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              value={lowStockThreshold} 
              min={1} 
              max={50}
              onChange={e => setLowStockThreshold(Number(e.target.value))}
              className="w-24 h-11 px-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none" 
            />
            <span className="text-xs text-brand-body/55 font-sans">Threshold at which products trigger a low stock alert on Dashboard</span>
          </div>
        </div>

        <hr className="border-brand-border/20" />

        <div className="space-y-2 pt-2">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Store Logo</label>
          <p className="text-xs text-brand-body/60 font-sans">Upload your brand logo for the header and navigation</p>
          <div className="flex items-center gap-4 pt-1">
            {storeLogoUrl ? (
              <img 
                src={storeLogoUrl} 
                alt="Store Logo" 
                className="w-20 h-20 rounded-full object-cover border border-brand-border/40 shadow-xs" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-cream/40 border border-brand-border/60 flex items-center justify-center text-[10px] text-brand-body/50 font-sans">
                No Logo
              </div>
            )}
            <label className="h-11 px-5 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition">
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
                className="h-11 px-5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition"
              >
                <Trash2 size={14} />
                <span>Remove Logo</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs transition active:scale-95 cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            <span>{saving ? 'Saving...' : 'Save Status'}</span>
          </button>
        </div>
      </div>

      {/* 2. General Constants Section */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-5">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
          <SettingsIcon size={16} className="text-[#C9A84C]" />
          <span>General Store Constants</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Store Helpline WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 916386422660"
              className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Support email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@fuzzysoftstudio.com"
              className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Order ID Prefix</label>
            <input
              type="text"
              value={orderIdPrefix}
              onChange={(e) => setOrderIdPrefix(e.target.value)}
              placeholder="e.g. FSS-"
              className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs transition active:scale-95 cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            <span>{saving ? 'Saving...' : 'Save Constants'}</span>
          </button>
        </div>
      </div>

      {/* 3. Shipping & Delivery Section */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-5">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
          <Truck size={16} className="text-[#C9A84C]" />
          <span>Shipping & Delivery Options</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-brand-heading">Cash On Delivery (COD)</span>
              <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">Allow COD checkout orders</span>
            </div>
            <Toggle checked={codAvailable} onChange={setCodAvailable} />
          </div>

          {codAvailable && (
            <div className="space-y-1.5 animate-fade-in pl-2 border-l-2 border-brand-accent/30">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">COD Convenience Charge (₹)</label>
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

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs transition active:scale-95 cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            <span>{saving ? 'Saving...' : 'Save Shipping'}</span>
          </button>
        </div>
      </div>

      {/* 4. Notification Settings Section */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
          <Bell size={16} className="text-[#C9A84C]" />
          <span>Notification Alerts</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-brand-heading">WhatsApp Order Alerts</span>
              <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">Send transaction details to customer via API</span>
            </div>
            <Toggle checked={whatsappAlerts} onChange={setWhatsappAlerts} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-brand-heading">Email Receipt Alerts</span>
              <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">Email digital PDF copies automatically</span>
            </div>
            <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs transition active:scale-95 cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            <span>{saving ? 'Saving...' : 'Save Notifications'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
