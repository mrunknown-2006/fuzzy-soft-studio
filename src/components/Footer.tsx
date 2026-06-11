import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Footer() {
  const [footerTagline, setFooterTagline] = useState('"Where Every Petal Tells a Story"');
  const [footerAbout, setFooterAbout] = useState('A handmade crochet & floral studio crafting soft, romantic blooms for life\'s quiet and grand moments.');
  const [footerInstagram, setFooterInstagram] = useState('');
  const [footerFacebook, setFooterFacebook] = useState('');
  const [footerPinterest, setFooterPinterest] = useState('');
  const [footerWhatsapp, setFooterWhatsapp] = useState('');
  const [footerEmail, setFooterEmail] = useState('hello@fuzzysoftstudio.com');
  const [footerCopyright, setFooterCopyright] = useState('© 2026 Fuzzy Soft Studio. All rights reserved.');
  const [footerNote, setFooterNote] = useState('Made with love in Lucknow 🌸');

  useEffect(() => {
    const loadFooterData = async () => {
      // Fetch footer site content
      try {
        const { data } = await supabase
          .from('site_content')
          .select('*')
          .eq('id', 'footer')
          .single();
        if (data && data.content) {
          const s = data.content;
          if (s.footer_tagline) setFooterTagline(s.footer_tagline);
          if (s.footer_about_text) setFooterAbout(s.footer_about_text);
          if (s.footer_instagram) setFooterInstagram(s.footer_instagram);
          if (s.footer_facebook) setFooterFacebook(s.footer_facebook);
          if (s.footer_pinterest) setFooterPinterest(s.footer_pinterest);
          if (s.footer_whatsapp_url) setFooterWhatsapp(s.footer_whatsapp_url);
          if (s.footer_copyright) setFooterCopyright(s.footer_copyright);
          if (s.footer_note) setFooterNote(s.footer_note);
        }
      } catch (err) {
        console.warn('Failed to load footer site content:', err);
      }

      // Fetch contact email from store_settings
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('*');
        if (data) {
          const generalSetting = data.find(s => s.key === 'general');
          if (generalSetting && generalSetting.value && generalSetting.value.contact_email) {
            setFooterEmail(String(generalSetting.value.contact_email));
          } else {
            const emailSetting = data.find(s => s.key === 'contact_email');
            if (emailSetting && emailSetting.value) {
              setFooterEmail(String(emailSetting.value));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load store settings for footer email:', err);
      }
    };
    loadFooterData();
  }, []);

  return (
    <footer className="bg-[#EADFD5] text-brand-body pt-20 border-t border-brand-border/30 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        
        {/* Top: Logo & Tagline Centered */}
        <div className="flex flex-col items-center justify-center text-center mb-16 select-none">
          <Link to="/" className="inline-flex flex-col items-center leading-none transition-transform duration-300 hover:scale-[1.02]">
            <span className="font-script text-4.5xl text-brand-heading leading-none">
              Fuzzy
            </span>
            <span className="text-[10px] tracking-[0.35em] text-brand-heading/90 mt-1 font-sans">
              SOFT STUDIO
            </span>
          </Link>
          <p className="mt-4 text-xs font-serif italic text-brand-body/75 max-w-sm">
            {footerTagline}
          </p>

          {/* Dynamic Social Icons Row */}
          {(footerInstagram || footerFacebook || footerPinterest || footerWhatsapp) && (
            <div className="flex items-center gap-3 mt-5">
              {footerInstagram && (
                <a href={footerInstagram} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105"
                  aria-label="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051c-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
              )}
              {footerFacebook && (
                <a href={footerFacebook} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105"
                  aria-label="Facebook">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {footerPinterest && (
                <a href={footerPinterest} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105"
                  aria-label="Pinterest">
                  <ExternalLink size={15} strokeWidth={1.5} />
                </a>
              )}
              {footerWhatsapp && (
                <a href={footerWhatsapp} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105"
                  aria-label="WhatsApp">
                  <MessageCircle size={15} strokeWidth={1.5} />
                </a>
              )}
            </div>
          )}

          <div className="w-12 h-[1px] bg-[#C9A84C]/50 mt-6"></div>
        </div>

        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16 text-left">
          
          {/* Column 1: About */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-heading">
              About Us
            </h3>
            <p className="font-sans text-[13px] text-brand-body/80 leading-relaxed">
              {footerAbout}
            </p>
            <div className="pt-1.5">
              <span className="inline-block px-3 py-1 bg-white/50 border border-brand-border/30 text-[10px] font-semibold text-brand-heading tracking-wide uppercase rounded-full select-none shadow-xs">
                500+ happy arrangements across India
              </span>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-heading">
              Shop Blooms
            </h3>
            <ul className="flex flex-col space-y-2.5 text-[13px] font-sans text-brand-body/75">
              <li>
                <Link to="/shop" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=best-sellers" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=new-arrivals" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?collection=gift-bouquets" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  Gift Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-heading">
              Customer Help
            </h3>
            <ul className="flex flex-col space-y-2.5 text-[13px] font-sans text-brand-body/75">
              <li>
                <Link to="/faqs" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  Returns &amp; Refunds
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-accent hover:translate-x-0.5 transition-all duration-300 inline-block">
                  Our Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-heading">
              Connect With Us
            </h3>
            <p className="font-sans text-[13px] text-brand-body/80 leading-relaxed">
              Follow our growth, see custom work, or write directly to our studio.
            </p>
            <div className="flex items-center space-x-3 pt-1 select-none">

              {/* Instagram — always show with default fallback */}
              <a
                href={footerInstagram || 'https://instagram.com/fuzzysoftstudio'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105 active:scale-95"
                aria-label="Instagram"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051c-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={footerWhatsapp || 'https://wa.me/919506228972'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105 active:scale-95"
                aria-label="WhatsApp"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.395 0 9.784-4.382 9.788-9.771.002-2.611-1.01-5.067-2.853-6.912-1.842-1.844-4.29-2.858-6.902-2.859-5.399 0-9.788 4.382-9.792 9.772-.001 1.733.456 3.424 1.32 4.922L1.923 20.8l4.724-1.238z" />
                </svg>
              </a>

              {/* Email */}
              <a
                href={`mailto:${footerEmail}`}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 border border-brand-border/40 hover:border-brand-accent/50 text-brand-body/80 hover:text-brand-accent hover:bg-white transition-all duration-300 shadow-xs hover:scale-105 active:scale-95"
                aria-label="Email"
              >
                <Mail size={16} strokeWidth={1.5} />
              </a>

            </div>
          </div>
        </div>

        {/* Bottom copyright info block */}
        <div className="bg-[#DFD1C7] -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 py-6 mt-12 flex flex-col sm:flex-row items-center justify-between text-[11px] tracking-wide text-brand-body/85 font-sans space-y-3 sm:space-y-0 select-none">
          <p>{footerCopyright}</p>
          {footerNote && <span className="text-brand-body/60">· {footerNote}</span>}
          <div className="flex space-x-5 font-medium">
            <Link to="/privacy" className="hover:text-brand-accent transition-colors duration-300">
              Privacy Policy
            </Link>
            <span className="text-brand-body/30">·</span>
            <Link to="/terms" className="hover:text-brand-accent transition-colors duration-300">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
