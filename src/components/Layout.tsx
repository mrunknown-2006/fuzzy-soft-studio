import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function Layout() {
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const toast = useStore((state) => state.toast);
  const hideToast = useStore((state) => state.hideToast);
  const [whatsappNumber, setWhatsappNumber] = useState('6386422660');

  useEffect(() => {
    const loadWhatsAppSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('*');
        if (data) {
          const whatsappSetting = data.find(
            (s) => s.key === 'whatsapp_number' || s.key === 'contact_whatsapp'
          );
          if (whatsappSetting && whatsappSetting.value) {
            const digits = whatsappSetting.value.replace(/[^0-9]/g, '');
            if (digits && digits.length >= 10) {
              setWhatsappNumber(digits.slice(-10));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load WhatsApp settings:', err);
      }
    };
    loadWhatsAppSettings();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg select-text selection:bg-brand-accent/30 selection:text-brand-heading relative">
      {/* Trailing Cursor Dot */}
      <div 
        className="cursor-dot hidden md:block" 
        style={{ 
          transform: `translate3d(${cursorPos.x - 7}px, ${cursorPos.y - 7}px, 0)`
        }} 
        aria-hidden="true" 
      />

      {/* Global Navbar */}
      <Navbar />

      {/* Main content wrapper */}
      <main className="flex-grow pt-24">
        <Outlet />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Overhauled WhatsApp Button */}
      <a
        href={`https://wa.me/91${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-brand-accent text-white w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(196,160,160,0.4)] hover:bg-brand-accent-hover transition-all duration-300 group"
        aria-label="Chat on WhatsApp"
      >
        {/* WhatsApp SVG Icon */}
        <svg
          className="w-6 h-6 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>

        {/* Tooltip */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-brand-heading text-brand-bg text-xs font-sans py-1 px-3 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Chat with us!
        </span>
      </a>

      {/* Global custom toast notification */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 animate-fade-in-up select-none max-w-sm w-full">
          <div className={`p-4 rounded-2xl border shadow-lg flex items-center justify-between gap-4 backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-[#8FA088]/15 border-[#8FA088]/40 text-[#2C1810]' 
              : 'bg-red-400/15 border-red-400/30 text-[#2C1810]'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-[#8FA088]' : 'bg-red-400'}`} />
              <span className="text-xs font-semibold font-sans tracking-wide leading-tight">{toast.message}</span>
            </div>
            <button 
              onClick={hideToast}
              className="text-brand-body/50 hover:text-brand-body transition text-[10px] uppercase font-bold tracking-widest font-sans cursor-pointer p-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
