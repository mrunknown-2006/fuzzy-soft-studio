import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, ChevronDown, ChevronUp, Clock, Truck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function Privacy() {
  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Back button */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-xs tracking-wider uppercase font-semibold text-brand-body/60 hover:text-brand-accent transition duration-200">
          <ArrowLeft size={14} className="mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 md:p-12 shadow-sm backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-6 border-b border-brand-border/20 pb-4">Privacy Policy</h1>
        
        <div className="space-y-6 text-brand-body/80 font-sans leading-relaxed text-sm">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when placing an order, registering an account, subscribing to our newsletter, or communicating with us. This includes your name, email address, phone number, shipping address, billing address, and payment information (processed securely through our payment gateways).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">How We Use Your Information</h2>
            <p>
              We use the collected information to process and fulfill your orders, provide customer support, send transactional notifications (order confirmations, shipping updates), improve our products and services, and (with your consent) send promotional newsletters and offers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Data Security</h2>
            <p>
              We implement a variety of security measures, including SSL encryption and secure databases, to maintain the safety of your personal information. Your sensitive payment details are processed through PCI-DSS compliant payment processors, and we do not store credit card or net banking credentials on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or how your personal data is handled, please reach out to us at:
            </p>
            <div className="bg-[#F3ECE3]/40 border border-brand-border/30 rounded-xl p-4 mt-2">
              <p className="font-semibold text-brand-heading">Fuzzy Soft Studio Support</p>
              <p>Email: support@fuzzysoftstudio.com</p>
              <p>Location: Lucknow, Uttar Pradesh, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Back button */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-xs tracking-wider uppercase font-semibold text-brand-body/60 hover:text-brand-accent transition duration-200">
          <ArrowLeft size={14} className="mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 md:p-12 shadow-sm backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-6 border-b border-brand-border/20 pb-4">Terms & Conditions</h1>
        
        <div className="space-y-6 text-brand-body/80 font-sans leading-relaxed text-sm">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">All Sales Are Final</h2>
            <p>
              Due to the custom-made, handcrafted nature of our floral arrangements and bouquets, all sales are final. We start hand-tying and crafting your flowers immediately after order verification.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Cancellation Window</h2>
            <p>
              You can cancel your order within 2 hours of placing it. To cancel, please contact us immediately or email support with your order number. Once the 2-hour window has passed, the order will have entered production and cannot be cancelled or refunded.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Representative Images</h2>
            <p>
              Please note that every arrangement is uniquely handmade. The product images on our website are representative of the design and color theme. Slight variations in size, color shade, and arrangement layout are natural characteristics of artisanal products and make each piece uniquely yours.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Governing Law</h2>
            <p>
              These Terms & Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India, with jurisdiction in Lucknow, Uttar Pradesh.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqsList, setFaqsList] = useState<Array<{ q: string; a: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFaqs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('content')
          .eq('id', 'faqs')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data && data.content && Array.isArray(data.content.faqs)) {
          setFaqsList(data.content.faqs);
        } else {
          setFaqsList([]);
        }
      } catch (err) {
        console.warn('Failed to load dynamic FAQs:', err);
        setFaqsList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadFaqs();
  }, []);

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Back button */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-xs tracking-wider uppercase font-semibold text-brand-body/60 hover:text-brand-accent transition duration-200">
          <ArrowLeft size={14} className="mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 md:p-12 shadow-sm backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-6 border-b border-brand-border/20 pb-4 text-center">Frequently Asked Questions</h1>
        
        {isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="border border-brand-border/20 rounded-xl p-5 bg-[#FCFAF8]/40 animate-pulse space-y-3">
                <div className="h-4 bg-brand-cream rounded w-1/3" />
                <div className="h-3 bg-brand-cream rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : faqsList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-brand-body/65 text-sm">No FAQs listed at the moment.</p>
            <span className="text-[10px] uppercase tracking-wider text-brand-body/40">Check back later or contact support.</span>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {faqsList.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="border border-brand-border/30 rounded-xl overflow-hidden transition-all duration-300 bg-[#FCFAF8]/80 hover:bg-white animate-fade-in"
                >
                  <button
                    onClick={() => toggleIndex(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-serif text-base font-medium text-brand-heading focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-brand-accent transition-transform duration-300" />
                    ) : (
                      <ChevronDown size={18} className="text-brand-heading/60 transition-transform duration-300" />
                    )}
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[500px] border-t border-brand-border/20' : 'max-h-0'
                    }`}
                  >
                    <p className="px-6 py-4 font-sans text-sm text-brand-body/80 leading-relaxed bg-brand-cream/20">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function Shipping() {
  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Back button */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-xs tracking-wider uppercase font-semibold text-brand-body/60 hover:text-brand-accent transition duration-200">
          <ArrowLeft size={14} className="mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 md:p-12 shadow-sm backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-6 border-b border-brand-border/20 pb-4">Shipping Policy</h1>
        
        <div className="space-y-8 text-brand-body/80 font-sans leading-relaxed text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F3ECE3]/40 border border-brand-border/30 rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center mx-auto">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-brand-heading">Processing Time</h3>
              <p className="text-xs">
                3-7 business days for hand-crafting and preparation.
              </p>
            </div>

            <div className="bg-[#F3ECE3]/40 border border-brand-border/30 rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#8FA088]/15 text-[#8FA088] flex items-center justify-center mx-auto">
                <Truck size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-brand-heading">Lucknow Delivery</h3>
              <p className="text-xs">
                5-10 business days total transit time for local delivery.
              </p>
            </div>

            <div className="bg-[#F3ECE3]/40 border border-brand-border/30 rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center mx-auto">
                <Truck size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-brand-heading">Pan-India Shipping</h3>
              <p className="text-xs">
                7-14 business days total transit time across all other states.
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Shipping Charges</h2>
            <p>
              We provide free standard shipping for all orders above ₹999 within India. For orders below ₹999, a flat shipping and handling fee is calculated and added during checkout depending on your location.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Courier Partners</h2>
            <p>
              We only ship through reliable national courier services to ensure your beautiful arrangements reach you safely and in pristine condition. A tracking number will be provided as soon as the package leaves our studio.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Returns() {
  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-4xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Back button */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-xs tracking-wider uppercase font-semibold text-brand-body/60 hover:text-brand-accent transition duration-200">
          <ArrowLeft size={14} className="mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 md:p-12 shadow-sm backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-6 border-b border-brand-border/20 pb-4">Returns & Refunds</h1>
        
        <div className="space-y-6 text-brand-body/80 font-sans leading-relaxed text-sm">
          <section className="space-y-2 flex gap-4 items-start bg-[#F3ECE3]/40 border border-brand-border/30 rounded-xl p-5">
            <div className="mt-1 text-brand-accent">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-brand-heading">Custom & Handcrafted Items are Non-Returnable</h2>
              <p className="mt-1">
                Because each flower arrangement is customized and handcrafted to order, we are unable to accept returns, cancellations after 2 hours, or refund requests. We appreciate your understanding of the labor and time invested in our artisanal creation process.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">24-Hour Transit Damage Window</h2>
            <p>
              We pack every item with extreme care using bubble wraps and sturdy custom boxes. However, in the rare event of transit damage, please document it immediately. You must record a continuous unboxing video of the parcel and email it to us or WhatsApp our support team within 24 hours of delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-brand-heading">Replacements for Damage</h2>
            <p>
              If transit damage is verified through the unboxing video, we will happily process a free replacement for you. We will recreate and ship your arrangement as quickly as possible. Refunds are not issued; only replacements for damaged units are provided.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="min-h-screen pt-16 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full select-none animate-fade-in-up">
      <div className="bg-white border border-brand-border/40 p-6 rounded-full text-brand-accent shadow-xs mb-6 bloom">
        <ShieldAlert className="w-12 h-12" strokeWidth={1.2} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-serif text-brand-heading mb-4 leading-tight">
        Page Not Found
      </h1>
      <p className="text-sm text-brand-body/75 mb-8 max-w-md font-sans">
        The page you are looking for does not exist or has been moved. Let's find something beautiful for your space instead.
      </p>
      <Link
        to="/"
        className="bg-[#DCA29A] hover:bg-[#D4938A] text-white px-8 py-3.5 rounded-full font-sans font-semibold tracking-widest text-xs uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
      >
        <ArrowLeft size={14} />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
