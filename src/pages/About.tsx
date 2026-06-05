import { useState, useEffect } from 'react';
import { Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function About() {
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [block1Title, setBlock1Title] = useState('');
  const [block1Image, setBlock1Image] = useState('');
  const [block1Text1, setBlock1Text1] = useState('');
  const [block1Text2, setBlock1Text2] = useState('');
  
  const [block2Title, setBlock2Title] = useState('');
  const [block2Image, setBlock2Image] = useState('');
  const [block2Text1, setBlock2Text1] = useState('');
  const [block2Text2, setBlock2Text2] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAboutContent = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const loaded: any = {};
          data.forEach((s: any) => {
            loaded[s.key] = s.value;
          });
          if (loaded.about_hero_title) setHeroTitle(loaded.about_hero_title);
          if (loaded.about_hero_subtitle) setHeroSubtitle(loaded.about_hero_subtitle);
          if (loaded.about_block1_title) setBlock1Title(loaded.about_block1_title);
          if (loaded.about_block1_image) setBlock1Image(loaded.about_block1_image);
          if (loaded.about_block1_text1) setBlock1Text1(loaded.about_block1_text1);
          if (loaded.about_block1_text2) setBlock1Text2(loaded.about_block1_text2);
          if (loaded.about_block2_title) setBlock2Title(loaded.about_block2_title);
          if (loaded.about_block2_image) setBlock2Image(loaded.about_block2_image);
          if (loaded.about_block2_text1) setBlock2Text1(loaded.about_block2_text1);
          if (loaded.about_block2_text2) setBlock2Text2(loaded.about_block2_text2);
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
            <img
              src={block1Image}
              alt="Artisanal blooms background"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4 font-sans text-brand-body/80 leading-relaxed text-sm">
            <h2 className="font-serif text-2xl font-bold text-brand-heading">{block1Title}</h2>
            {block1Text1 && <p>{block1Text1}</p>}
            {block1Text2 && <p>{block1Text2}</p>}
          </div>
        </div>

        {/* Handmade with Love section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:flex-row-reverse">
          <div className="md:order-last relative rounded-3xl overflow-hidden aspect-[4/3] bg-brand-cream border border-brand-border/40 shadow-xs select-none">
            <img
              src={block2Image}
              alt="Hand-tying bouquets"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4 font-sans text-brand-body/80 leading-relaxed text-sm">
            <h2 className="font-serif text-2xl font-bold text-brand-heading">{block2Title}</h2>
            {block2Text1 && <p>{block2Text1}</p>}
            {block2Text2 && <p>{block2Text2}</p>}
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
