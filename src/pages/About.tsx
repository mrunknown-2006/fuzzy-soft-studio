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
    <div className="min-h-screen pt-6 pb-20 px-6 lg:px-10 max-w-5xl mx-auto w-full flex flex-col animate-fade-in-up">
      {/* Hero Banner Section */}
      <div className="text-center mb-16 select-none">
        <span className="font-script text-3xl sm:text-4xl text-[#8FA088] block mb-2">Our Story</span>
        <h1 className="text-4xl sm:text-5xl font-serif text-brand-heading tracking-tight mb-4">
          {heroTitle}
        </h1>
        <p className="text-xs uppercase tracking-widest text-brand-body/55 font-sans font-semibold">
          {heroSubtitle}
        </p>
        <div className="h-0.5 w-16 bg-[#C9A84C] mt-4 mx-auto"></div>
      </div>

      <div className="space-y-16">
        
        {/* Brand Story block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-brand-cream border border-brand-border/40 shadow-xs select-none">
            {!block1Image || img1Error ? (
              <div className="w-full h-full bg-gradient-to-br from-[#F5EDE6] to-[#EADFD5] flex items-center justify-center select-none text-[#8FA088]/60">
                <Sparkles size={36} strokeWidth={1} />
              </div>
            ) : (
              <img
                src={getImageUrl(block1Image)}
                alt="Artisanal blooms background"
                className="w-full h-full object-cover"
                onError={() => setImg1Error(true)}
              />
            )}
          </div>
          <div className="space-y-4 font-sans text-brand-body/80 leading-relaxed text-sm">
            <h2 className="font-serif text-2xl font-bold text-brand-heading">{block1Title}</h2>
            {block1Text1 && <p>{block1Text1}</p>}
            {block1Text2 && <p>{block1Text2}</p>}
          </div>
        </div>

        {/* Handmade with Love section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="md:order-last relative rounded-3xl overflow-hidden aspect-[4/3] bg-brand-cream border border-brand-border/40 shadow-xs select-none">
            {!block2Image || img2Error ? (
              <div className="w-full h-full bg-gradient-to-br from-[#F5EDE6] to-[#EADFD5] flex items-center justify-center select-none text-brand-accent/60">
                <Heart size={36} strokeWidth={1} />
              </div>
            ) : (
              <img
                src={getImageUrl(block2Image)}
                alt="Hand-tying bouquets"
                className="w-full h-full object-cover"
                onError={() => setImg2Error(true)}
              />
            )}
          </div>
          <div className="space-y-4 font-sans text-brand-body/80 leading-relaxed text-sm">
            <h2 className="font-serif text-2xl font-bold text-brand-heading">{block2Title}</h2>
            {block2Text1 && <p>{block2Text1}</p>}
            {block2Text2 && <p>{block2Text2}</p>}
          </div>
        </div>

        {/* Meet the Maker (Founder) Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-brand-cream border border-brand-border/40 shadow-xs select-none">
            {!founderImage || founderImgError ? (
              <div className="w-full h-full bg-gradient-to-br from-[#F5EDE6] to-[#EADFD5] flex items-center justify-center select-none text-brand-accent/60">
                <User size={36} strokeWidth={1} className="text-[#8FA088]/60" />
              </div>
            ) : (
              <img
                src={getImageUrl(founderImage)}
                alt={founderName}
                className="w-full h-full object-cover"
                onError={() => setFounderImgError(true)}
              />
            )}
          </div>
          <div className="space-y-4 font-sans text-brand-body/80 leading-relaxed text-sm">
            <span className="text-xs uppercase tracking-widest text-[#8FA088] font-sans font-semibold">{founderRole}</span>
            <h2 className="font-serif text-2xl font-bold text-brand-heading">{founderName}</h2>
            <p>{founderBio}</p>
          </div>
        </div>

        {/* Brand values card grid */}
        <div className="pt-8">
          <h2 className="font-serif text-2xl font-bold text-brand-heading text-center mb-10 select-none">
            Our Core Values
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Value 1 */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center mx-auto select-none">
                <Heart size={18} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-base font-bold text-brand-heading">Thoughtful Artistry</h3>
              <p className="text-xs text-brand-body/75 font-sans leading-relaxed">
                Slow crafting with precision, using curated, harmonious tones that spark romance and warmth.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center mx-auto select-none">
                <Sparkles size={18} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-base font-bold text-brand-heading">Timeless Beauty</h3>
              <p className="text-xs text-brand-body/75 font-sans leading-relaxed">
                Creating heirloom arrangements built to last, providing sustainable elegance that never wilts.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center mx-auto select-none">
                <ShieldCheck size={18} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-base font-bold text-brand-heading">Pet-Safe & Allergen-Free</h3>
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
