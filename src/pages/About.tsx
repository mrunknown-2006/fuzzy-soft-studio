import { useState, useEffect } from 'react';
import { Heart, Sparkles, ShieldCheck, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function About() {
  const [heroTitle, setHeroTitle] = useState('Our Story');
  const [heroSubtitle, setHeroSubtitle] = useState('Born from a love of blooms — Fuzzy Soft Studio is where flowers become feelings.');
  const [block1Title, setBlock1Title] = useState('Founder\'s Journey');
  const [block1Image, setBlock1Image] = useState('');
  const [block1Text1, setBlock1Text1] = useState('Fuzzy Soft Studio is a new handmade floral studio based in Lucknow, founded by Warisha Shariq in 2026. What started as a personal love for flowers and crochet has grown into a small studio that crafts made-to-order arrangements for life\'s quiet and grand moments.');
  const [block1Text2, setBlock1Text2] = useState('Every piece is handmade with care, and no two are exactly alike.');
  
  const [block2Title, setBlock2Title] = useState('Crafted with Care');
  const [block2Image, setBlock2Image] = useState('');
  const [block2Text1, setBlock2Text1] = useState('We believe that flowers should hold more than just a temporary place in our lives. Our crochet arrangements are hand-threaded to order, ensuring each set of petals carries custom character and enduring warmth.');
  const [block2Text2, setBlock2Text2] = useState('By creating made-to-order floral statements, we ensure nothing is wasted, and every box is a custom work of art.');
  const [founderImage, setFounderImage] = useState('');
  const [founderName, setFounderName] = useState('Warisha Shariq');
  const [founderRole, setFounderRole] = useState('Founder');
  const [founderBio, setFounderBio] = useState('Every bouquet, arrangement, and custom card is personally designed and handcrafted by Warisha. Her passion for blending organic textures with high-quality yarn brings the studio\'s cozy and romantic vision to life.');
  const [isLoading, setIsLoading] = useState(true);
  const [img1Error, setImg1Error] = useState(false);
  const [img2Error, setImg2Error] = useState(false);
  const [founderImgError, setFounderImgError] = useState(false);

  const getImageUrl = (filename: string) => {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    const { data } = supabase.storage
      .from('content')
      .getPublicUrl(filename);
    return data.publicUrl;
  };

  useEffect(() => {
    const loadAboutContent = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('site_content').select('*').eq('id', 'about').single();
        if (error) throw error;
        if (data && data.content) {
          const loaded = data.content;
          if (loaded.about_hero_title) setHeroTitle(loaded.about_hero_title);
          if (loaded.about_hero_subtitle) setHeroSubtitle(loaded.about_hero_subtitle);
          if (loaded.about_block1_title) setBlock1Title(loaded.about_block1_title);
          if (loaded.about_block1_image) setBlock1Image(loaded.about_block1_image);
          else if (loaded.block1_image) setBlock1Image(loaded.block1_image);
          if (loaded.about_block1_text1) setBlock1Text1(loaded.about_block1_text1);
          if (loaded.about_block1_text2) setBlock1Text2(loaded.about_block1_text2);
          if (loaded.about_block2_title) setBlock2Title(loaded.about_block2_title);
          if (loaded.about_block2_image) setBlock2Image(loaded.about_block2_image);
          else if (loaded.block2_image) setBlock2Image(loaded.block2_image);
          if (loaded.about_block2_text1) setBlock2Text1(loaded.about_block2_text1);
          if (loaded.about_block2_text2) setBlock2Text2(loaded.about_block2_text2);
          if (loaded.about_founder_image) setFounderImage(loaded.about_founder_image);
          else if (loaded.founder_image) setFounderImage(loaded.founder_image);
          if (loaded.founder_name) setFounderName(loaded.founder_name);
          if (loaded.founder_role) setFounderRole(loaded.founder_role);
          if (loaded.founder_bio) setFounderBio(loaded.founder_bio);
        }
      } catch (err) {
        console.warn('Failed to load about page settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAboutContent();
  }, []);

  const renderPlaceholder = (type: 'flower' | 'heart' | 'user', title: string) => {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#FAF7F2] to-[#EADFD5] flex flex-col items-center justify-center p-6 text-center select-none border border-brand-border/20 rounded-3xl">
        <div className="w-12 h-12 rounded-full bg-white/65 flex items-center justify-center text-brand-accent/60 shadow-2xs mb-3">
          {type === 'flower' && <Sparkles size={22} />}
          {type === 'heart' && <Heart size={22} />}
          {type === 'user' && <User size={22} />}
        </div>
        <p className="font-serif text-sm text-brand-heading/70 font-semibold">{title}</p>
        <span className="text-[10px] uppercase tracking-wider text-brand-body/45 mt-1 font-sans">Artisanal Craftsmanship</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-body/60 font-sans tracking-wide">
            Entering the Studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 lg:px-10 max-w-6xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Hero Banner Section */}
      <div className="text-center mb-20 select-none max-w-2xl mx-auto">
        <span className="font-script text-3xl sm:text-4xl text-brand-accent block mb-2 leading-none">Our Story</span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-heading tracking-tight mb-5 leading-tight font-light font-medium">
          {heroTitle}
        </h1>
        <p className="text-xs md:text-sm uppercase tracking-[0.18em] text-brand-body/70 font-sans leading-relaxed">
          {heroSubtitle}
        </p>
        <div className="h-[1px] w-24 bg-brand-accent/35 mt-6 mx-auto"></div>
      </div>

      <div className="space-y-24">
        
        {/* Brand Story block 1 - Z-Pattern: Image Left, Text Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="md:col-span-6 relative rounded-3xl overflow-hidden aspect-[4/5] bg-brand-cream border border-brand-border/40 shadow-xs select-none">
            {!block1Image || img1Error ? (
              renderPlaceholder('flower', block1Title)
            ) : (
              <img
                src={getImageUrl(block1Image)}
                alt={block1Title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                onError={() => setImg1Error(true)}
              />
            )}
          </div>
          <div className="md:col-span-6 space-y-6 font-sans text-brand-body/80 leading-relaxed text-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#8FA088] font-bold">Chapter I</span>
            <h2 className="font-serif text-3xl text-brand-heading leading-tight font-medium">{block1Title}</h2>
            <div className="h-[1px] w-12 bg-brand-border/60"></div>
            {block1Text1 && <p className="text-brand-body/85 leading-relaxed">{block1Text1}</p>}
            {block1Text2 && <p className="text-brand-body/75 italic">{block1Text2}</p>}
          </div>
        </div>

        {/* Brand Story block 2 - Z-Pattern: Text Left, Image Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="md:col-span-6 md:order-last relative rounded-3xl overflow-hidden aspect-[4/5] bg-brand-cream border border-brand-border/40 shadow-xs select-none">
            {!block2Image || img2Error ? (
              renderPlaceholder('heart', block2Title)
            ) : (
              <img
                src={getImageUrl(block2Image)}
                alt={block2Title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                onError={() => setImg2Error(true)}
              />
            )}
          </div>
          <div className="md:col-span-6 space-y-6 font-sans text-brand-body/80 leading-relaxed text-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#8FA088] font-bold">Chapter II</span>
            <h2 className="font-serif text-3xl text-brand-heading leading-tight font-medium">{block2Title}</h2>
            <div className="h-[1px] w-12 bg-brand-border/60"></div>
            {block2Text1 && <p className="text-brand-body/85 leading-relaxed">{block2Text1}</p>}
            {block2Text2 && <p className="text-brand-body/75 italic">{block2Text2}</p>}
          </div>
        </div>

        {/* Meet the Maker (Founder) Section - Spotlight Card centerpiece */}
        <div className="bg-[#FAF7F2]/90 border border-brand-border/30 rounded-3xl p-8 md:p-14 shadow-2xs backdrop-blur-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center">
            <div className="md:col-span-5 relative rounded-2xl overflow-hidden aspect-[3/4] bg-brand-cream border border-brand-border/40 shadow-sm select-none">
              {!founderImage || founderImgError ? (
                renderPlaceholder('user', founderName)
              ) : (
                <img
                  src={getImageUrl(founderImage)}
                  alt={founderName}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  onError={() => setFounderImgError(true)}
                />
              )}
            </div>
            <div className="md:col-span-7 space-y-6 text-brand-body/80 leading-relaxed text-sm relative">
              <span className="inline-block bg-[#8FA088]/15 text-[#5C6D54] text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full select-none">
                {founderRole}
              </span>
              
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-light text-brand-heading tracking-tight">{founderName}</h3>
                <div className="h-[1px] w-16 bg-brand-accent/20"></div>
              </div>

              <div className="relative pt-2">
                <span className="absolute -left-5 -top-6 text-7xl text-brand-accent/15 font-serif select-none">“</span>
                <p className="font-serif italic text-base md:text-lg text-brand-heading leading-relaxed relative z-10 pl-2">
                  {founderBio}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand values card grid */}
        <div className="pt-10">
          <div className="text-center mb-14 max-w-md mx-auto">
            <h2 className="font-serif text-3xl font-light text-brand-heading tracking-tight mb-2 select-none">
              Our Core Values
            </h2>
            <div className="h-0.5 w-12 bg-brand-accent/30 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white/70 border border-brand-border/30 rounded-2xl p-8 shadow-xs backdrop-blur-xs text-center space-y-4 transition-all duration-300 hover:shadow-sm hover:border-brand-border/60">
              <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto select-none shadow-2xs">
                <Heart size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-brand-heading font-medium">Thoughtful Artistry</h3>
              <p className="text-xs text-brand-body/75 font-sans leading-relaxed">
                Slow crafting with precision, using curated, harmonious tones that spark romance and warmth.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white/70 border border-brand-border/30 rounded-2xl p-8 shadow-xs backdrop-blur-xs text-center space-y-4 transition-all duration-300 hover:shadow-sm hover:border-brand-border/60">
              <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto select-none shadow-2xs">
                <Sparkles size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-brand-heading font-medium">Timeless Beauty</h3>
              <p className="text-xs text-brand-body/75 font-sans leading-relaxed">
                Creating heirloom arrangements built to last, providing sustainable elegance that never wilts.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white/70 border border-brand-border/30 rounded-2xl p-8 shadow-xs backdrop-blur-xs text-center space-y-4 transition-all duration-300 hover:shadow-sm hover:border-brand-border/60">
              <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto select-none shadow-2xs">
                <ShieldCheck size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-brand-heading font-medium">Pet-Safe & Allergen-Free</h3>
              <p className="text-xs text-brand-body/75 font-sans leading-relaxed">
                Ensuring all materials are fully non-toxic, safe for allergy sufferers, children, and household pets.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
