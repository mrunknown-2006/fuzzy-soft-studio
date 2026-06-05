import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function Contact() {
  const showToast = useStore((state) => state.showToast);

  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Contact Page Details
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContactContent = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        const loaded: any = {};
        if (data && data.length > 0) {
          data.forEach((s: any) => {
            loaded[s.key] = s.value;
          });
        }
        setTitle(loaded.contact_title || 'Contact Us');
        setIntro(loaded.contact_intro || 'Have questions about custom crochet orders, shipping timelines, or care tips? Drop us a line and our artisan team will write back to you shortly.');
        setWhatsapp(loaded.contact_whatsapp || '+91 95062 28972');
        setEmail(loaded.contact_email || 'hello@fuzzysoftstudio.com');
        setLocation(loaded.contact_location || 'Kanpur, Uttar Pradesh');
        setHours(loaded.contact_hours || 'Mon–Sat: 10am – 7pm');
        setMapUrl(loaded.contact_map_url || '');
      } catch (err) {
        console.warn('Failed to load contact page settings:', err);
        // Fallback to defaults on error
        setTitle('Contact Us');
        setIntro('Have questions about custom crochet orders, shipping timelines, or care tips? Drop us a line and our artisan team will write back to you shortly.');
        setWhatsapp('+91 95062 28972');
        setEmail('hello@fuzzysoftstudio.com');
        setLocation('Kanpur, Uttar Pradesh');
        setHours('Mon–Sat: 10am – 7pm');
        setMapUrl('');
      } finally {
        setIsLoading(false);
      }
    };
    loadContactContent();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim() || !subject.trim() || !message.trim()) {
      showToast('Please fill out all fields of the contact form.', 'error');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      showToast('Thank you! Your query has been submitted successfully.', 'success');
      setName('');
      setContactEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1200);
  };

  const whatsappLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-body/60 font-sans">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-7xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Page Title */}
      <div className="mb-10 text-center lg:text-left select-none">
        <h1 className="text-3xl font-serif text-brand-heading">{title}</h1>
        <div className="h-0.5 w-16 bg-[#C9A84C] mt-2 mx-auto lg:mx-0"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
        {/* Left Side: Contact Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-8">
            <div className="select-none">
              <h2 className="font-serif text-xl font-bold text-brand-heading mb-2">Get in Touch</h2>
              <p className="text-xs text-brand-body/70 font-sans leading-relaxed">
                {intro}
              </p>
            </div>

            <div className="space-y-5 font-sans text-xs text-brand-body/85">
              {/* Phone / Whatsapp */}
              <a 
                href={whatsappLink}
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-4 p-4 rounded-xl border border-brand-border/30 bg-white/50 hover:bg-brand-cream/40 transition duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0 shadow-xs">
                  <Phone size={14} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold text-brand-heading block uppercase tracking-wider text-[10px]">WhatsApp Support</span>
                  <span className="text-sm font-medium text-brand-body block truncate">{whatsapp}</span>
                  <span className="text-[10px] text-brand-body/50 block">Fast responses daily, 10 AM - 7 PM</span>
                </div>
              </a>

              {/* Email */}
              <a 
                href={`mailto:${email}`}
                className="flex items-start gap-4 p-4 rounded-xl border border-brand-border/30 bg-white/50 hover:bg-brand-cream/40 transition duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0 shadow-xs">
                  <Mail size={14} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold text-brand-heading block uppercase tracking-wider text-[10px]">Email Address</span>
                  <span className="text-sm font-medium text-brand-body block truncate">{email}</span>
                  <span className="text-[10px] text-brand-body/50 block">Average response time: 24 hours</span>
                </div>
              </a>

              {/* Location */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-border/30 bg-white/50">
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0 shadow-xs select-none">
                  <MapPin size={14} />
                </div>
                <div className="space-y-0.5 select-text">
                  <span className="font-bold text-brand-heading block uppercase tracking-wider text-[10px] select-none">Our Studio Location</span>
                  <span className="text-sm font-medium text-brand-body block">{location}</span>
                  <span className="text-[10px] text-brand-body/50 block">Handcrafted &amp; shipped with love</span>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-border/30 bg-white/50">
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center shrink-0 shadow-xs select-none">
                  <Clock size={14} />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-brand-heading block uppercase tracking-wider text-[10px]">Business Hours</span>
                  <span className="text-sm font-medium text-brand-body block">{hours}</span>
                  <span className="text-[10px] text-brand-body/50 block">We respond within 24 hours</span>
                </div>
              </div>

              {/* Map Embed */}
              {mapUrl && (
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="180"
                  className="rounded-xl border border-brand-border/30 mt-2"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Studio Location Map"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-5">
            <h2 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none">
              <HelpCircle size={18} strokeWidth={1.5} className="text-[#C9A84C]" />
              <span>Send a Message</span>
            </h2>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-11 px-4 bg-white/95 border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all animate-none"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                Email Address
              </label>
              <input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-4 bg-white/95 border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all animate-none"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Custom Bouquet Quote"
                className="w-full h-11 px-4 bg-white/95 border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all animate-none"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/85 mb-2 select-none">
                Your Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type details of your custom requirements or query here..."
                rows={5}
                className="w-full p-4 bg-white/95 border border-brand-border/70 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all resize-none animate-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold transition duration-300 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 select-none ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting query...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send Message</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
