import { useState, useEffect } from 'react';

export default function Preloader() {
  const [isReady, setIsReady] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const verifyAssets = async () => {
      // 1. Wait for fonts
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          // ignore font load errors
        }
      }

      // 2. Wait for images to load
      const images = Array.from(document.images);
      const imagePromises = images.map((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });

      await Promise.all(imagePromises);

      // 3. Smooth organic display time (500ms) for cinematic curtain transition
      setTimeout(() => {
        setIsReady(true);
        setTimeout(() => {
          setIsDismissed(true);
        }, 700);
      }, 500);
    };

    if (document.readyState === 'complete') {
      verifyAssets();
    } else {
      window.addEventListener('load', verifyAssets, { once: true });
    }

    const fallbackTimer = setTimeout(() => {
      setIsReady(true);
      setTimeout(() => setIsDismissed(true), 700);
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('load', verifyAssets);
    };
  }, []);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#FAF7F2] flex flex-col items-center justify-center px-6 transition-opacity duration-700 ease-in-out select-none ${
        isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
        {/* Pure SVG Vector Floral Emblem */}
        <div className="relative flex items-center justify-center mb-1">
          <div className="absolute w-28 h-28 bg-[#C9A84C]/15 rounded-full blur-2xl animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-white/80 border border-[#EAE3DA] shadow-xs flex items-center justify-center relative z-10">
            <svg className="w-8 h-8 text-[#C9A84C] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 0 0-5 5c0 3 5 9 5 9s5-6 5-9a5 5 0 0 0-5-5z" />
              <path d="M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              <path d="M12 16v6" />
              <path d="M9 19c2 0 3-1 3-1" />
              <path d="M15 19c-2 0-3-1-3-1" />
            </svg>
          </div>
        </div>

        {/* Cursive Brand Title */}
        <div className="space-y-1">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#4A3F35]">
            Fuzzy Soft Studio
          </h2>
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#C9A84C] block">
            Handcrafted Luxury • Pipe Cleaner Art
          </span>
        </div>

        {/* Minimal Subtle Gold Line */}
        <div className="w-12 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent animate-pulse mt-2" />
      </div>
    </div>
  );
}
