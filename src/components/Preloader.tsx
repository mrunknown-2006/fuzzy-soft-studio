import { useState, useEffect } from 'react';

export default function Preloader() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let progressTimer: any;
    let isFinished = false;

    // Simulate smooth progress ticker while waiting for assets
    progressTimer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 80);

    const verifyAssets = async () => {
      // 1. Wait for document fonts if supported
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          // ignore font load errors
        }
      }

      // 2. Wait for document images to be fully loaded and decoded
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

      // 3. Ensure minimum curtain display time for smooth luxury transition
      setTimeout(() => {
        setLoadingProgress(100);
        isFinished = true;
        clearInterval(progressTimer);
        setTimeout(() => {
          setIsLoaded(true);
        }, 400);
      }, 500);
    };

    if (document.readyState === 'complete') {
      verifyAssets();
    } else {
      window.addEventListener('load', verifyAssets, { once: true });
    }

    // Safety timeout fallback
    const fallbackTimer = setTimeout(() => {
      if (!isFinished) {
        setLoadingProgress(100);
        setIsLoaded(true);
        clearInterval(progressTimer);
      }
    }, 2500);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener('load', verifyAssets);
    };
  }, []);

  if (isLoaded) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#FAF7F2] flex flex-col items-center justify-center px-6 transition-opacity duration-700 ease-out select-none ${
        loadingProgress === 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm text-center space-y-6">
        {/* Brand Logo with Pulsing Glow */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 bg-[#C9A84C]/15 rounded-full blur-xl animate-pulse" />
          <img
            src="/logo.png?v=2"
            alt="Fuzzy Soft Studio"
            className="h-24 sm:h-28 w-auto object-contain relative z-10 mix-blend-multiply contrast-125 brightness-95 animate-pulse"
          />
        </div>

        {/* Brand Tagline */}
        <div className="space-y-1">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#C9A84C]">
            Handcrafted Luxury
          </span>
          <p className="text-xs font-serif italic text-[#5C4F45]/75">
            Pipe Cleaner Floral Art & Studio
          </p>
        </div>

        {/* Progress Bar & Counter */}
        <div className="w-44 space-y-2 pt-2">
          <div className="w-full h-[2px] bg-[#EAE3DA] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#DCA29A] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-semibold tracking-widest text-[#5C4F45]/50 block">
            {loadingProgress}%
          </span>
        </div>
      </div>
    </div>
  );
}
