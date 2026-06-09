import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings as SettingsIcon, Truck, Bell, Activity } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';
import Toggle from '../../components/ui/Toggle';

export default function Settings() {
  const { 
    showToast,
    storeOpen,
    setStoreOpen,
    storeClosedMessage,
    setStoreClosedMessage,
    lowStockThreshold,
    setLowStockThreshold,
    codAvailable,
    setCodAvailable,
    codCharge,
    setCodCharge,
    expressCharge,
    setExpressCharge,
    settings,
    setSettings
  } = useOutletContext<AdminContext>();

  // State local to settings page
  const [freeThreshold, setFreeThreshold] = useState(999);
  const [shippingFee, setShippingFee] = useState(99);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [orderIdPrefix, setOrderIdPrefix] = useState('FSS-');

  // Notifications
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const [saving, setSaving] = useState(false);

  // Sync settings when loaded
  useEffect(() => {
    setFreeThreshold(settings.free_delivery_threshold);
    setShippingFee(settings.shipping_charges);
    setWhatsapp(settings.whatsapp_number);
    setEmail(settings.contact_email);

    // Fetch extra custom settings keys
    const fetchExtraSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*');
        console.log('Settings page fetchExtraSettings:', data, error);
        
        if (data) {
          const generalSetting = data.find((s: any) => s.key === 'general');
          if (generalSetting && generalSetting.value) {
            const val = generalSetting.value;
            if (val.whatsapp_alerts !== undefined) setWhatsappAlerts(val.whatsapp_alerts === true || val.whatsapp_alerts === 'true');
            if (val.email_alerts !== undefined) setEmailAlerts(val.email_alerts === true || val.email_alerts === 'true');
            if (val.order_id_prefix !== undefined) setOrderIdPrefix(String(val.order_id_prefix || 'FSS-'));
          }
          
          // Fallback check of individual keys
          data.forEach((s: any) => {
            if (s.key === 'whatsapp_alerts') setWhatsappAlerts(s.value === true || s.value === 'true');
            if (s.key === 'email_alerts') setEmailAlerts(s.value === true || s.value === 'true');
            if (s.key === 'order_id_prefix') setOrderIdPrefix(String(s.value || 'FSS-'));
          });
        }
      } catch (err) {
        console.warn('Could not load extra settings values:', err);
      }
    };
    fetchExtraSettings();
  }, [settings]);

  // Combined Save Settings Handler
  const handleSaveAllSettings = async () => {
    console.log("Supabase client:", supabase);
    setSaving(true);

    const updatedSettings = {
      free_delivery_threshold: freeThreshold,
      shipping_charges: shippingFee,
      whatsapp_number: whatsapp.trim(),
      contact_email: email.trim(),
      offer_line: settings.offer_line,
      banner_url: settings.banner_url
    };

    const payload = {
      free_delivery_threshold: freeThreshold,
      shipping_charges: shippingFee,
      whatsapp_number: whatsapp.trim(),
      contact_email: email.trim(),
      
      store_open: storeOpen,
      store_closed_message: storeClosedMessage.trim(),
      low_stock_threshold: lowStockThreshold,

      cod_available: codAvailable,
      cod_charge: codCharge,
      express_charge: expressCharge,

      whatsapp_alerts: whatsappAlerts,
      email_alerts: emailAlerts,
      order_id_prefix: orderIdPrefix.trim()
    };

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .upsert({
          key: 'general',
          value: payload,
          updated_at: new Date().toISOString()
        })
        .select();
      
      console.log('Settings saved:', data, error);
      if (error) {
        alert(JSON.stringify(error));
        throw error;
      }

      setSettings(updatedSettings);
      localStorage.setItem('fuzzy-soft-studio-settings', JSON.stringify(payload));
      showToast('Saved successfully!', 'success');
    } catch (err: any) {
      alert(JSON.stringify(err));
      showToast(err.message || 'Failed to save settings', 'error');
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

        {!storeOpen && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Closed Message</label>
            <input 
              type="text" 
              value={storeClosedMessage} 
              onChange={e => setStoreClosedMessage(e.target.value)}
              className="w-full h-11 px-4 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none" 
            />
          </div>
        )}

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

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Express Delivery Charge (₹)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={expressCharge}
                min={0}
                onChange={(e) => setExpressCharge(Number(e.target.value))}
                className="w-48 h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
              />
              <span className="text-xs text-brand-body/55 font-sans">
                {expressCharge === 0 ? 'Disabled (Express option hidden)' : `₹${expressCharge} surcharge`}
              </span>
            </div>
          </div>
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
