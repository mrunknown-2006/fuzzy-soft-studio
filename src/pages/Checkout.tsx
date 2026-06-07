import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Checkout() {
  const [whatsappNumber, setWhatsappNumber] = useState('919506228972');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('store_settings').select('*');
        if (data) {
          const whatsappSetting = data.find(
            (s) => s.key === 'contact_whatsapp' || s.key === 'footer_whatsapp' || s.key === 'whatsapp_number'
          );
          if (whatsappSetting && whatsappSetting.value) {
            // Strip everything except digits
            const digits = String(whatsappSetting.value).replace(/[^0-9]/g, '');
            // Only use if it looks like a valid number, otherwise keep the default placeholder
            if (digits && digits.length >= 10 && !digits.includes('X')) {
              setWhatsappNumber(digits);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load WhatsApp settings for Checkout:', err);
      }
    };
    loadSettings();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 animate-fade-in-up">
      <div className="max-w-md w-full text-center space-y-8 bg-white/60 border border-brand-border/40 rounded-2xl p-8 md:p-10 shadow-xs backdrop-blur-xs select-none">
        
        {/* Brand Logo / Header */}
        <div className="space-y-1">
          <span className="font-script text-4xl text-brand-heading block leading-none">
            Fuzzy Soft Studio
          </span>
          <span className="text-[9px] tracking-[0.25em] font-sans font-bold text-brand-heading/70 uppercase">
            Handcrafted Blooms
          </span>
        </div>

        <div className="h-[1px] w-20 bg-brand-border/50 mx-auto"></div>

        {/* Messaging Section */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl md:text-3xl text-brand-heading">
            Payment Coming Soon 🌸
          </h2>
          <p className="text-sm text-brand-body/85 font-sans leading-relaxed">
            We're setting up secure payments. <br className="hidden sm:inline" />
            Meanwhile, you can order your favorite arrangements directly via WhatsApp!
          </p>
        </div>

        {/* WhatsApp Call to Action Button */}
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 w-full bg-[#DCA29A] hover:bg-[#D4938A] text-white px-6 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm active:scale-95 cursor-pointer"
        >
          <MessageCircle size={15} />
          Order via WhatsApp
        </a>
      </div>
    </div>
  );
}
