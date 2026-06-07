import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings as SettingsIcon, Truck, DollarSign, Bell, Shield, Activity } from 'lucide-react';
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

  // UPI Payments config
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [upiId, setUpiId] = useState('fuzzysoft@ybl');

  // Order settings config
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [giftWrapCharge, setGiftWrapCharge] = useState(30);

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
        const { data } = await supabase
          .from('settings')
          .select('*')
          .in('key', ['upi_enabled', 'upi_id', 'min_order_value', 'gift_wrap_charge', 'whatsapp_alerts', 'email_alerts']);
        
        if (data) {
          data.forEach((s: any) => {
            if (s.key === 'upi_enabled') setUpiEnabled(s.value === 'true');
            if (s.key === 'upi_id') setUpiId(s.value);
            if (s.key === 'min_order_value') setMinOrderValue(Number(s.value) || 0);
            if (s.key === 'gift_wrap_charge') setGiftWrapCharge(Number(s.value) || 30);
            if (s.key === 'whatsapp_alerts') setWhatsappAlerts(s.value === 'true');
            if (s.key === 'email_alerts') setEmailAlerts(s.value === 'true');
          });
        }
      } catch (err) {
        console.warn('Could not load extra settings values:', err);
      }
    };
    fetchExtraSettings();
  }, [settings]);

  // Combined Save Settings Handler
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedSettings = {
      free_delivery_threshold: freeThreshold,
      shipping_charges: shippingFee,
      whatsapp_number: whatsapp.trim(),
      contact_email: email.trim(),
      offer_line: settings.offer_line,
      banner_url: settings.banner_url
    };

    try {
      const payload = [
        { key: 'free_delivery_threshold', value: String(freeThreshold) },
        { key: 'shipping_charges', value: String(shippingFee) },
        { key: 'whatsapp_number', value: whatsapp.trim() },
        { key: 'contact_email', value: email.trim() },
        
        { key: 'store_open', value: storeOpen ? 'true' : 'false' },
        { key: 'store_closed_message', value: storeClosedMessage.trim() },
        { key: 'low_stock_threshold', value: String(lowStockThreshold) },

        { key: 'cod_available', value: String(codAvailable) },
        { key: 'cod_charge', value: String(codCharge) },
        { key: 'express_charge', value: String(expressCharge) },

        { key: 'upi_enabled', value: String(upiEnabled) },
        { key: 'upi_id', value: upiId.trim() },
        { key: 'min_order_value', value: String(minOrderValue) },
        { key: 'gift_wrap_charge', value: String(giftWrapCharge) },
        { key: 'whatsapp_alerts', value: String(whatsappAlerts) },
        { key: 'email_alerts', value: String(emailAlerts) }
      ];

      const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'key' });
      if (error) throw error;

      setSettings(updatedSettings);
      showToast('All settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to save settings: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAllSettings} className="space-y-6 max-w-4xl animate-fade-in-up pb-12">
      
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
              placeholder="+91-XXXXX-XXXXX"
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
      </div>

      {/* 4. Payment Methods Section */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
          <DollarSign size={16} className="text-[#C9A84C]" />
          <span>Payment Methods</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-brand-heading">UPI / QR Payments</span>
              <span className="text-[10px] text-brand-body/60 font-sans block mt-0.5">Enable direct UPI link payments on checkout</span>
            </div>
            <Toggle checked={upiEnabled} onChange={setUpiEnabled} />
          </div>

          {upiEnabled && (
            <div className="space-y-1.5 animate-fade-in pl-2 border-l-2 border-brand-accent/30">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Merchant UPI ID / VPA</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@vpa"
                className="w-full sm:w-64 h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. Order Settings Section */}
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none border-b border-brand-border/25 pb-2">
          <Shield size={16} className="text-[#C9A84C]" />
          <span>Order Thresholds</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Minimum Checkout Order Value (₹)</label>
            <input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(Number(e.target.value))}
              className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Gift Wrapping surcharge (₹)</label>
            <input
              type="number"
              value={giftWrapCharge}
              onChange={(e) => setGiftWrapCharge(Number(e.target.value))}
              className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-xs font-sans focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 6. Notification Settings Section */}
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
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs hover:shadow-sm cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
      >
        <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
      </button>

    </form>
  );
}
