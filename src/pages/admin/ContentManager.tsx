import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Sparkles, 
  BookOpen, 
  Phone, 
  Layout, 
  Megaphone, 
  Upload, 
  ArrowLeft,
  Trash2
} from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';
import Toggle from '../../components/ui/Toggle';

export default function ContentManager() {
  const { 
    showToast,
    adminCollectionBanners,
    setAdminCollectionBanners,
    gardenImages,
    setGardenImages
  } = useOutletContext<AdminContext>();

  // Sub-tabs within Content Manager
  const [subTab, setSubTab] = useState<'menu' | 'homepage' | 'featured' | 'about' | 'contact' | 'footer' | 'announcements'>('menu');
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // 1. Homepage Hero Fields
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle1, setHeroTitle1] = useState('');
  const [heroTitle2, setHeroTitle2] = useState('');
  const [heroTitle3, setHeroTitle3] = useState('');
  const [heroTagline, setHeroTagline] = useState('');
  const [heroCta, setHeroCta] = useState('');

  // 2. Featured Section Fields
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [featuredSubtitle, setFeaturedSubtitle] = useState('');
  const [featuredCount, setFeaturedCount] = useState('4');
  const [featuredVisible, setFeaturedVisible] = useState(true);

  // 3. About/Story Fields
  const [aboutHeroTitle, setAboutHeroTitle] = useState('');
  const [aboutHeroSubtitle, setAboutHeroSubtitle] = useState('');
  const [aboutBlock1Title, setAboutBlock1Title] = useState('');
  const [aboutBlock1Text1, setAboutBlock1Text1] = useState('');
  const [aboutBlock1Text2, setAboutBlock1Text2] = useState('');
  const [aboutBlock1Image, setAboutBlock1Image] = useState('');
  const [aboutBlock2Title, setAboutBlock2Title] = useState('');
  const [aboutBlock2Text1, setAboutBlock2Text1] = useState('');
  const [aboutBlock2Text2, setAboutBlock2Text2] = useState('');
  const [aboutBlock2Image, setAboutBlock2Image] = useState('');
  const [aboutFounderImage, setAboutFounderImage] = useState('');

  // 4. Contact Fields
  const [contactTitle, setContactTitle] = useState('');
  const [contactIntro, setContactIntro] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [contactHours, setContactHours] = useState('');
  const [contactMapUrl, setContactMapUrl] = useState('');

  // 5. Footer Fields
  const [footerTagline, setFooterTagline] = useState('');
  const [footerAboutText, setFooterAboutText] = useState('');
  const [footerInstagram, setFooterInstagram] = useState('');
  const [footerFacebook, setFooterFacebook] = useState('');
  const [footerPinterest, setFooterPinterest] = useState('');
  const [footerWhatsappUrl, setFooterWhatsappUrl] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');
  const [footerNote, setFooterNote] = useState('');

  // 6. Announcements Fields
  const [offerLine, setOfferLine] = useState('');
  const [marqueeVisible, setMarqueeVisible] = useState(true);
  const [homeBannerUrl, setHomeBannerUrl] = useState('');

  // 6.5 Collections & Garden slots states
  const [bridalUrl, setBridalUrl] = useState('');
  const [everydayUrl, setEverydayUrl] = useState('');
  const [seasonalUrl, setSeasonalUrl] = useState('');
  const [giftUrl, setGiftUrl] = useState('');
  const [gardenSlots, setGardenSlots] = useState<Array<{ url: string; caption: string }>>([
    { url: '', caption: '' },
    { url: '', caption: '' },
    { url: '', caption: '' },
    { url: '', caption: '' },
    { url: '', caption: '' },
    { url: '', caption: '' }
  ]);

  // Load all settings directly
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_content').select('*');
        if (error) throw error;
        
        const loaded: any = {};
        if (data) {
          data.forEach((row: any) => {
            if (row.content) {
              Object.entries(row.content).forEach(([k, v]) => {
                loaded[k] = v;
              });
            }
          });
        }

        // Hero
        setHeroBannerUrl(loaded.hero_banner_url || '');
        setHeroBadge(loaded.hero_badge || '');
        setHeroTitle1(loaded.hero_title_1 || '');
        setHeroTitle2(loaded.hero_title_2 || '');
        setHeroTitle3(loaded.hero_title_3 || '');
        setHeroTagline(loaded.hero_tagline || '');
        setHeroCta(loaded.hero_cta_text || '');

        // Featured
        setFeaturedTitle(loaded.featured_section_title || '');
        setFeaturedSubtitle(loaded.featured_section_subtitle || '');
        setFeaturedCount(loaded.featured_section_count || '4');
        setFeaturedVisible(loaded.featured_section_visible !== 'false' && loaded.featured_section_visible !== false);

        // About
        setAboutHeroTitle(loaded.about_hero_title || '');
        setAboutHeroSubtitle(loaded.about_hero_subtitle || '');
        setAboutBlock1Title(loaded.about_block1_title || '');
        setAboutBlock1Text1(loaded.about_block1_text1 || '');
        setAboutBlock1Text2(loaded.about_block1_text2 || '');
        setAboutBlock1Image(loaded.about_block1_image || loaded.block1_image || '');
        setAboutBlock2Title(loaded.about_block2_title || '');
        setAboutBlock2Text1(loaded.about_block2_text1 || '');
        setAboutBlock2Text2(loaded.about_block2_text2 || '');
        setAboutBlock2Image(loaded.about_block2_image || loaded.block2_image || '');
        setAboutFounderImage(loaded.founder_image || loaded.about_founder_image || '');

        // Contact
        setContactTitle(loaded.contact_title || '');
        setContactIntro(loaded.contact_intro || '');
        setContactWhatsapp(loaded.contact_whatsapp || '');
        setContactEmail(loaded.contact_email || '');
        setContactLocation(loaded.contact_location || '');
        setContactHours(loaded.contact_hours || '');
        setContactMapUrl(loaded.contact_map_url || '');

        // Footer
        setFooterTagline(loaded.footer_tagline || '');
        setFooterAboutText(loaded.footer_about_text || '');
        setFooterInstagram(loaded.footer_instagram || '');
        setFooterFacebook(loaded.footer_facebook || '');
        setFooterPinterest(loaded.footer_pinterest || '');
        setFooterWhatsappUrl(loaded.footer_whatsapp_url || '');
        setFooterCopyright(loaded.footer_copyright || '');
        setFooterNote(loaded.footer_note || '');

        // Announcements
        setOfferLine(loaded.offer_line || '');
        setMarqueeVisible(loaded.marquee_visible !== 'false' && loaded.marquee_visible !== false);
        setHomeBannerUrl(loaded.banner_url || '');

        if (loaded.collection_banners) {
          try {
            if (Array.isArray(loaded.collection_banners)) {
              setAdminCollectionBanners(loaded.collection_banners);
            } else {
              setAdminCollectionBanners(JSON.parse(loaded.collection_banners));
            }
          } catch {}
        }
        if (loaded.garden_images) {
          try {
            if (Array.isArray(loaded.garden_images)) {
              setGardenImages(loaded.garden_images);
            } else {
              setGardenImages(JSON.parse(loaded.garden_images));
            }
          } catch {}
        }

        // Load collections row banner URLs
        const collectionsRow = data?.find((row: any) => row.id === 'collections');
        if (collectionsRow && collectionsRow.content) {
          const c = collectionsRow.content;
          setBridalUrl(c.bridal_blooms_url || '');
          setEverydayUrl(c.everyday_luxury_url || '');
          setSeasonalUrl(c.seasonal_picks_url || '');
          setGiftUrl(c.gift_bouquets_url || '');
          
          setAdminCollectionBanners(prev => prev.map(b => {
            if (b.slug === 'bridal-blooms') return { ...b, image: c.bridal_blooms_url || b.image };
            if (b.slug === 'everyday-luxury') return { ...b, image: c.everyday_luxury_url || b.image };
            if (b.slug === 'seasonal-picks') return { ...b, image: c.seasonal_picks_url || b.image };
            if (b.slug === 'gift-bouquets') return { ...b, image: c.gift_bouquets_url || b.image };
            return b;
          }));
        }

        // Load Garden Slots from site_content where id='garden_gallery'
        const galleryRow = data?.find((row: any) => row.id === 'garden_gallery');
        if (galleryRow && galleryRow.content && Array.isArray(galleryRow.content.photos)) {
          const photos = galleryRow.content.photos;
          const slots = Array.from({ length: 6 }, (_, i) => ({
            url: photos[i]?.url || '',
            caption: photos[i]?.caption || ''
          }));
          setGardenSlots(slots);
        } else {
          // Fallback to loaded.garden_images
          let list: string[] = [];
          if (loaded.garden_images) {
            try {
              list = Array.isArray(loaded.garden_images) ? loaded.garden_images : JSON.parse(loaded.garden_images);
            } catch {}
          }
          const slots = Array.from({ length: 6 }, (_, i) => ({
            url: list[i] || '',
            caption: ''
          }));
          setGardenSlots(slots);
        }
      } catch (err: any) {
        showToast(`Error fetching content: ${err.message}`, 'error');
      }
    };

    fetchSettings();
  }, []);

  // WebP Image Conversion
  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas conversion returned null'));
            }
          }, 'image/webp', 0.85);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Single Reusable Upload Helper
  const uploadToContentBucket = async (
    file: File, 
    filename: string
  ): Promise<string | null> => {
    const { error } = await supabase.storage
      .from('content')
      .upload(filename, file, { upsert: true });
    
    if (error) {
      alert('Upload failed: ' + error.message);
      return null;
    }
    
    const { data } = supabase.storage
      .from('content')
      .getPublicUrl(filename);
    
    return data.publicUrl;
  };

  // Upload Asset using Fixed Filename & Upsert
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    showToast('Compressing and uploading image...', 'success');

    try {
      const webpBlob = await convertToWebP(file);
      let fileName = '';
      if (index === 10) fileName = 'hero-banner.webp';
      else if (index === 11) fileName = 'story-image-1.webp';
      else if (index === 12) fileName = 'story-image-2.webp';
      else if (index === 13) fileName = 'home-promo-banner.webp';
      else if (index >= 30 && index <= 35) fileName = `garden-image-${index - 30 + 1}.webp`;
      else fileName = `descriptive-content-${index}.webp`;

      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from('content')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });
      console.log('Content image upload result:', data, error);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      if (index === 10) {
        setHeroBannerUrl(publicUrl);
        const sectionPayload = {
          hero_banner_url: publicUrl,
          hero_badge: heroBadge,
          hero_title_1: heroTitle1,
          hero_title_2: heroTitle2,
          hero_title_3: heroTitle3,
          hero_tagline: heroTagline,
          hero_cta_text: heroCta,
        };
        await supabase.from('site_content').upsert(
          { id: 'hero', content: sectionPayload, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      }
      if (index === 11) {
        setAboutBlock1Image(publicUrl);
        const sectionPayload = {
          about_hero_title: aboutHeroTitle,
          about_hero_subtitle: aboutHeroSubtitle,
          about_block1_title: aboutBlock1Title,
          about_block1_text1: aboutBlock1Text1,
          about_block1_text2: aboutBlock1Text2,
          about_block1_image: publicUrl,
          block1_image: publicUrl,
          about_block2_title: aboutBlock2Title,
          about_block2_text1: aboutBlock2Text1,
          about_block2_text2: aboutBlock2Text2,
          about_block2_image: aboutBlock2Image,
          block2_image: aboutBlock2Image,
          about_founder_image: aboutFounderImage,
          founder_image: aboutFounderImage,
        };
        await supabase.from('site_content').upsert(
          { id: 'about', content: sectionPayload, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      }
      if (index === 12) {
        setAboutBlock2Image(publicUrl);
        const sectionPayload = {
          about_hero_title: aboutHeroTitle,
          about_hero_subtitle: aboutHeroSubtitle,
          about_block1_title: aboutBlock1Title,
          about_block1_text1: aboutBlock1Text1,
          about_block1_text2: aboutBlock1Text2,
          about_block1_image: aboutBlock1Image,
          block1_image: aboutBlock1Image,
          about_block2_title: aboutBlock2Title,
          about_block2_text1: aboutBlock2Text1,
          about_block2_text2: aboutBlock2Text2,
          about_block2_image: publicUrl,
          block2_image: publicUrl,
          about_founder_image: aboutFounderImage,
          founder_image: aboutFounderImage,
        };
        await supabase.from('site_content').upsert(
          { id: 'about', content: sectionPayload, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      }
      if (index === 14) {
        setAboutFounderImage(publicUrl);
        const sectionPayload = {
          about_hero_title: aboutHeroTitle,
          about_hero_subtitle: aboutHeroSubtitle,
          about_block1_title: aboutBlock1Title,
          about_block1_text1: aboutBlock1Text1,
          about_block1_text2: aboutBlock1Text2,
          about_block1_image: aboutBlock1Image,
          block1_image: aboutBlock1Image,
          about_block2_title: aboutBlock2Title,
          about_block2_text1: aboutBlock2Text1,
          about_block2_text2: aboutBlock2Text2,
          about_block2_image: aboutBlock2Image,
          block2_image: aboutBlock2Image,
          about_founder_image: publicUrl,
          founder_image: publicUrl,
        };
        await supabase.from('site_content').upsert(
          { id: 'about', content: sectionPayload, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      }
      if (index === 13) {
        setHomeBannerUrl(publicUrl);
        const sectionPayload = {
          offer_line: offerLine,
          marquee_visible: marqueeVisible,
          banner_url: publicUrl,
          collection_banners: adminCollectionBanners,
          garden_images: gardenImages
        };
        await supabase.from('site_content').upsert(
          { id: 'announcements', content: sectionPayload, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      }

      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Content image upload failed:', err);
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  // Collection banner upload
  const handleCollectionBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, slug: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Uploading collection banner...', 'success');
    try {
      const webpBlob = await convertToWebP(file);
      const webpFile = new File([webpBlob], `collection-${slug}.webp`, { type: 'image/webp' });
      const fileName = `collection-${slug}.webp`;

      const publicUrl = await uploadToContentBucket(webpFile, fileName);
      if (!publicUrl) return;

      const updated = [...adminCollectionBanners];
      updated[index] = { ...updated[index], image: publicUrl };
      setAdminCollectionBanners(updated);

      // Save each banner URL to site_content id='collections'
      let newBridal = bridalUrl;
      let newEveryday = everydayUrl;
      let newSeasonal = seasonalUrl;
      let newGift = giftUrl;

      if (slug === 'bridal-blooms') { newBridal = publicUrl; setBridalUrl(publicUrl); }
      else if (slug === 'everyday-luxury') { newEveryday = publicUrl; setEverydayUrl(publicUrl); }
      else if (slug === 'seasonal-picks') { newSeasonal = publicUrl; setSeasonalUrl(publicUrl); }
      else if (slug === 'gift-bouquets') { newGift = publicUrl; setGiftUrl(publicUrl); }

      await supabase.from('site_content').upsert({
        id: 'collections',
        content: {
          bridal_blooms_url: newBridal,
          everyday_luxury_url: newEveryday,
          seasonal_picks_url: newSeasonal,
          gift_bouquets_url: newGift,
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      alert('Collection banner uploaded!');
    } catch (err: any) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Garden Grid upload and display helper
  const handleGardenImageUpload = async (file: File, slotIndex: number) => {
    const filename = `garden-slot-${slotIndex + 1}.webp`;
    const publicUrl = await uploadToContentBucket(file, filename);
    if (!publicUrl) return;

    // Update local state immediately
    const updatedSlots = [...gardenSlots];
    updatedSlots[slotIndex] = { 
      ...updatedSlots[slotIndex], 
      url: publicUrl 
    };
    setGardenSlots(updatedSlots);

    // Auto-save to site_content immediately
    const { error: saveError } = await supabase
      .from('site_content')
      .upsert({
        id: 'garden_gallery',
        content: { 
          photos: updatedSlots.map(s => ({ 
            url: s.url, 
            caption: s.caption || '' 
          }))
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (saveError) {
      alert('Save failed: ' + saveError.message);
      return;
    }

    alert(`Garden slot ${slotIndex + 1} uploaded successfully!`);
  };

  // Garden Grid image deletion logic
  const handleGardenImageDelete = async (slotIndex: number) => {
    if (!window.confirm(`Are you sure you want to delete the image in Garden Slot ${slotIndex + 1}?`)) return;

    // Update local state immediately
    const updatedSlots = [...gardenSlots];
    updatedSlots[slotIndex] = { 
      ...updatedSlots[slotIndex], 
      url: '' 
    };
    setGardenSlots(updatedSlots);

    // Auto-save to site_content immediately
    const { error: saveError } = await supabase
      .from('site_content')
      .upsert({
        id: 'garden_gallery',
        content: { 
          photos: updatedSlots.map(s => ({ 
            url: s.url, 
            caption: s.caption || '' 
          }))
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (saveError) {
      alert('Delete failed: ' + saveError.message);
      return;
    }

    alert(`Garden slot ${slotIndex + 1} image removed successfully!`);
  };

  // Collection banner image deletion logic
  const handleCollectionBannerDelete = async (index: number, slug: string) => {
    if (!window.confirm(`Are you sure you want to delete the banner for ${adminCollectionBanners[index].name}?`)) return;

    const updated = [...adminCollectionBanners];
    updated[index] = { ...updated[index], image: '' };
    setAdminCollectionBanners(updated);

    // Save each banner URL to site_content id='collections'
    let newBridal = bridalUrl;
    let newEveryday = everydayUrl;
    let newSeasonal = seasonalUrl;
    let newGift = giftUrl;

    if (slug === 'bridal-blooms') { newBridal = ''; setBridalUrl(''); }
    else if (slug === 'everyday-luxury') { newEveryday = ''; setEverydayUrl(''); }
    else if (slug === 'seasonal-picks') { newSeasonal = ''; setSeasonalUrl(''); }
    else if (slug === 'gift-bouquets') { newGift = ''; setGiftUrl(''); }

    await supabase.from('site_content').upsert({
      id: 'collections',
      content: {
        bridal_blooms_url: newBridal,
        everyday_luxury_url: newEveryday,
        seasonal_picks_url: newSeasonal,
        gift_bouquets_url: newGift,
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    alert('Collection banner removed!');
  };

  // 1. Save Hero
  const handleSaveHero = async () => {
    setLoading(true);
    const sectionPayload = {
      hero_banner_url: heroBannerUrl,
      hero_badge: heroBadge,
      hero_title_1: heroTitle1,
      hero_title_2: heroTitle2,
      hero_title_3: heroTitle3,
      hero_tagline: heroTagline,
      hero_cta_text: heroCta,
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'hero', content: sectionPayload, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('CONTENT SAVE ERROR:', error);
      alert('Save failed: ' + error.message);
      setLoading(false);
      return;
    }
    console.log('CONTENT SAVED:', data);
    alert('Saved successfully!');
    setLoading(false);
  };

  // 2. Save Featured
  const handleSaveFeatured = async () => {
    setLoading(true);
    const sectionPayload = {
      featured_section_title: featuredTitle,
      featured_section_subtitle: featuredSubtitle,
      featured_section_count: Number(featuredCount) || 4,
      featured_section_visible: featuredVisible,
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'featured', content: sectionPayload, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('CONTENT SAVE ERROR:', error);
      alert('Save failed: ' + error.message);
      setLoading(false);
      return;
    }
    console.log('CONTENT SAVED:', data);
    alert('Saved successfully!');
    setLoading(false);
  };

  // 3. Save About
  const handleSaveAbout = async () => {
    setLoading(true);
    const sectionPayload = {
      about_hero_title: aboutHeroTitle,
      about_hero_subtitle: aboutHeroSubtitle,
      about_block1_title: aboutBlock1Title,
      about_block1_text1: aboutBlock1Text1,
      about_block1_text2: aboutBlock1Text2,
      about_block1_image: aboutBlock1Image,
      block1_image: aboutBlock1Image,
      about_block2_title: aboutBlock2Title,
      about_block2_text1: aboutBlock2Text1,
      about_block2_text2: aboutBlock2Text2,
      about_block2_image: aboutBlock2Image,
      block2_image: aboutBlock2Image,
      about_founder_image: aboutFounderImage,
      founder_image: aboutFounderImage,
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'about', content: sectionPayload, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('CONTENT SAVE ERROR:', error);
      alert('Save failed: ' + error.message);
      setLoading(false);
      return;
    }
    console.log('CONTENT SAVED:', data);
    alert('Saved successfully!');
    setLoading(false);
  };

  // 4. Save Contact
  const handleSaveContact = async () => {
    setLoading(true);
    const sectionPayload = {
      contact_title: contactTitle,
      contact_intro: contactIntro,
      contact_whatsapp: contactWhatsapp,
      contact_email: contactEmail,
      contact_location: contactLocation,
      contact_hours: contactHours,
      contact_map_url: contactMapUrl,
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'contact', content: sectionPayload, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('CONTENT SAVE ERROR:', error);
      alert('Save failed: ' + error.message);
      setLoading(false);
      return;
    }
    console.log('CONTENT SAVED:', data);
    alert('Saved successfully!');
    setLoading(false);
  };

  // 5. Save Footer
  const handleSaveFooter = async () => {
    setLoading(true);
    const sectionPayload = {
      footer_tagline: footerTagline,
      footer_about_text: footerAboutText,
      footer_instagram: footerInstagram,
      footer_facebook: footerFacebook,
      footer_pinterest: footerPinterest,
      footer_whatsapp_url: footerWhatsappUrl,
      footer_copyright: footerCopyright,
      footer_note: footerNote,
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'footer', content: sectionPayload, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('CONTENT SAVE ERROR:', error);
      alert('Save failed: ' + error.message);
      setLoading(false);
      return;
    }
    console.log('CONTENT SAVED:', data);
    alert('Saved successfully!');
    setLoading(false);
  };

  // 6. Save Announcements, Collection Banners & Garden Images
  const handleSaveAnnouncements = async () => {
    setLoading(true);
    const sectionPayload = {
      offer_line: offerLine,
      marquee_visible: marqueeVisible,
      banner_url: homeBannerUrl,
      collection_banners: adminCollectionBanners,
      garden_images: gardenImages
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'announcements', content: sectionPayload, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('CONTENT SAVE ERROR:', error);
      alert('Save failed: ' + error.message);
      setLoading(false);
      return;
    }
    console.log('CONTENT SAVED:', data);
    alert('Saved successfully!');
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      {subTab !== 'menu' && (
        <button 
          onClick={() => setSubTab('menu')}
          className="flex items-center gap-1.5 text-xs text-brand-body/60 hover:text-brand-accent transition select-none uppercase font-bold"
        >
          <ArrowLeft size={13} />
          <span>Back to Modules</span>
        </button>
      )}

      {/* Menu Sub-Tab: Module selector grid */}
      {subTab === 'menu' && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-brand-heading border-b border-brand-border/25 pb-2">Content Manager</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <HomeIcon size={20} />, title: 'Homepage Hero', desc: 'Cover banner, badge text, header titles & CTA link text', tab: 'homepage' },
              { icon: <Sparkles size={20} />, title: 'Featured Section', desc: 'Configure homepage product layout headers and count limits', tab: 'featured' },
              { icon: <BookOpen size={20} />, title: 'Our Story Page', desc: 'Craft your brand narrative, subtitle hooks and block images', tab: 'about' },
              { icon: <Phone size={20} />, title: 'Contact Page', desc: 'Studio location, maps, operation hours and contact emails', tab: 'contact' },
              { icon: <Layout size={20} />, title: 'Footer settings', desc: 'Copyright line notes, social links, and brand text hooks', tab: 'footer' },
              { icon: <Megaphone size={20} />, title: 'Announcements', desc: 'Running ticker offers, garden slots and collections banner grids', tab: 'announcements' },
            ].map(card => (
              <div 
                key={card.tab} 
                onClick={() => setSubTab(card.tab as any)}
                className="bg-white/60 border border-brand-border/40 hover:border-brand-accent/25 hover:shadow-xs transition duration-300 rounded-2xl p-6 shadow-2xs flex flex-col gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-brand-accent shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-brand-heading">{card.title}</h3>
                    <p className="text-xs text-brand-body/60 mt-1 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubTab(card.tab as any);
                  }}
                  className="mt-auto px-4 h-8 bg-white hover:bg-brand-cream border border-brand-border text-[10px] font-bold uppercase tracking-wider rounded-full transition cursor-pointer self-start"
                >
                  Edit Module &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Homepage Hero Editor */}
      {subTab === 'homepage' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-serif text-xl font-bold text-brand-heading border-b border-brand-border/25 pb-2">Homepage Hero Editor</h3>
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Banner URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Hero Cover Banner Image</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={heroBannerUrl} 
                  onChange={e => setHeroBannerUrl(e.target.value)} 
                  placeholder="Paste banner image URL or upload WebP" 
                  className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" 
                />
                <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                  <Upload size={14} />
                  <span>{uploadingIndex === 10 ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 10)} className="hidden" disabled={uploadingIndex !== null} />
                </label>
                {heroBannerUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear Hero Cover Banner?')) {
                        setHeroBannerUrl('');
                      }
                    }}
                    className="h-11 w-11 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                    title="Clear Image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {heroBannerUrl && (
                <div className="mt-2 aspect-[21/9] w-full rounded-xl overflow-hidden border border-brand-border/30">
                  <img src={heroBannerUrl} className="w-full h-full object-cover" alt="Hero Banner Preview" />
                </div>
              )}
            </div>

            {/* Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Badge Header</label>
              <input 
                type="text" 
                value={heroBadge} 
                onChange={e => setHeroBadge(e.target.value)} 
                placeholder="e.g. FLORAL LIFESTYLE · EST. 2026" 
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" 
              />
            </div>

            {/* Title words */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Title Word 1</label>
                <input type="text" value={heroTitle1} onChange={e => setHeroTitle1(e.target.value)} placeholder="Fuzzy" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Title Word 2</label>
                <input type="text" value={heroTitle2} onChange={e => setHeroTitle2(e.target.value)} placeholder="Soft" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Title Word 3</label>
                <input type="text" value={heroTitle3} onChange={e => setHeroTitle3(e.target.value)} placeholder="Studio" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Tagline</label>
              <input 
                type="text" 
                value={heroTagline} 
                onChange={e => setHeroTagline(e.target.value)} 
                placeholder="Where Every Petal Tells a Story" 
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" 
              />
            </div>

            {/* CTA */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">CTA Button Label</label>
              <input 
                type="text" 
                value={heroCta} 
                onChange={e => setHeroCta(e.target.value)} 
                placeholder="SHOP NOW" 
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" 
              />
            </div>
          </div>

          <button 
            onClick={handleSaveHero}
            disabled={loading}
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Homepage Hero'}
          </button>
        </div>
      )}

      {/* 2. Featured Section Editor */}
      {subTab === 'featured' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-serif text-xl font-bold text-brand-heading border-b border-brand-border/25 pb-2">Featured Products Section</h3>
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Section Title</label>
              <input type="text" value={featuredTitle} onChange={e => setFeaturedTitle(e.target.value)} placeholder="Most Loved Arrangements" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Section Subtitle</label>
              <input type="text" value={featuredSubtitle} onChange={e => setFeaturedSubtitle(e.target.value)} placeholder="Handpicked, just for you" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Products Limit count</label>
              <select value={featuredCount} onChange={e => setFeaturedCount(e.target.value)} className="w-full h-11 px-3 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none cursor-pointer">
                <option value="4">4 Products</option>
                <option value="6">6 Products</option>
                <option value="8">8 Products</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-brand-cream/15 p-4 rounded-xl border border-brand-border/10 select-none">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-brand-heading">Visibility</span>
                <span className="text-[10px] text-brand-body/55 block font-sans">Render featured slider on home page</span>
              </div>
              <Toggle checked={featuredVisible} onChange={setFeaturedVisible} />
            </div>
          </div>

          <button 
            onClick={handleSaveFeatured}
            disabled={loading}
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Featured settings'}
          </button>
        </div>
      )}

      {/* 3. Our Story / About Editor */}
      {subTab === 'about' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-serif text-xl font-bold text-brand-heading border-b border-brand-border/25 pb-2">Our Story Page Editor</h3>
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Hero Title</label>
                <input type="text" value={aboutHeroTitle} onChange={e => setAboutHeroTitle(e.target.value)} className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Hero Subtitle</label>
                <input type="text" value={aboutHeroSubtitle} onChange={e => setAboutHeroSubtitle(e.target.value)} className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>

            <hr className="border-brand-border/20" />
            <h4 className="text-xs uppercase tracking-widest text-brand-accent font-bold">Story Block 1</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Block 1 Title</label>
                <input type="text" value={aboutBlock1Title} onChange={e => setAboutBlock1Title(e.target.value)} className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Block 1 Image</label>
                <div className="flex gap-2">
                  <input type="text" value={aboutBlock1Image} onChange={e => setAboutBlock1Image(e.target.value)} className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                  <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                    <Upload size={14} />
                    <span>{uploadingIndex === 11 ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 11)} className="hidden" disabled={uploadingIndex !== null} />
                  </label>
                  {aboutBlock1Image && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Clear Block 1 Image?')) {
                          setAboutBlock1Image('');
                        }
                      }}
                      className="h-11 w-11 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                      title="Clear Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Paragraph 1</label>
                <textarea value={aboutBlock1Text1} onChange={e => setAboutBlock1Text1(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Paragraph 2</label>
                <textarea value={aboutBlock1Text2} onChange={e => setAboutBlock1Text2(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
              </div>
            </div>

            <hr className="border-brand-border/20" />
            <h4 className="text-xs uppercase tracking-widest text-brand-accent font-bold">Story Block 2</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Block 2 Title</label>
                <input type="text" value={aboutBlock2Title} onChange={e => setAboutBlock2Title(e.target.value)} className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Block 2 Image</label>
                <div className="flex gap-2">
                  <input type="text" value={aboutBlock2Image} onChange={e => setAboutBlock2Image(e.target.value)} className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                  <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                    <Upload size={14} />
                    <span>{uploadingIndex === 12 ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 12)} className="hidden" disabled={uploadingIndex !== null} />
                  </label>
                  {aboutBlock2Image && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Clear Block 2 Image?')) {
                          setAboutBlock2Image('');
                        }
                      }}
                      className="h-11 w-11 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                      title="Clear Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Paragraph 1</label>
                <textarea value={aboutBlock2Text1} onChange={e => setAboutBlock2Text1(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Paragraph 2</label>
                <textarea value={aboutBlock2Text2} onChange={e => setAboutBlock2Text2(e.target.value)} rows={4} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
              </div>
            </div>

            <hr className="border-brand-border/20" />
            <h4 className="text-xs uppercase tracking-widest text-brand-accent font-bold">Founder Section</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Founder Image</label>
                <div className="flex gap-2">
                  <input type="text" value={aboutFounderImage} onChange={e => setAboutFounderImage(e.target.value)} className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
                  <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                    <Upload size={14} />
                    <span>{uploadingIndex === 14 ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 14)} className="hidden" disabled={uploadingIndex !== null} />
                  </label>
                  {aboutFounderImage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Clear Founder Image?')) {
                          setAboutFounderImage('');
                        }
                      }}
                      className="h-11 w-11 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                      title="Clear Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSaveAbout}
            disabled={loading}
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Our Story content'}
          </button>
        </div>
      )}

      {/* 4. Contact Page Editor */}
      {subTab === 'contact' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-serif text-xl font-bold text-brand-heading border-b border-brand-border/25 pb-2">Contact Page Editor</h3>
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Page Title</label>
              <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)} placeholder="Contact Us" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Introductory Text</label>
              <textarea value={contactIntro} onChange={e => setContactIntro(e.target.value)} rows={3} className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">WhatsApp Helpline</label>
                <input type="text" value={contactWhatsapp} onChange={e => setContactWhatsapp(e.target.value)} placeholder="+91-XXXXX-XXXXX" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Support Email</label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hello@fuzzysoftstudio.com" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Physical Studio Location</label>
                <input type="text" value={contactLocation} onChange={e => setContactLocation(e.target.value)} placeholder="Kanpur, Uttar Pradesh" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Working Hours</label>
                <input type="text" value={contactHours} onChange={e => setContactHours(e.target.value)} placeholder="Mon–Sat, 10 AM – 7 PM" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Google Maps Embed URL</label>
              <input type="text" value={contactMapUrl} onChange={e => setContactMapUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="w-full h-10 px-3 bg-white rounded-xl border border-brand-border/60 text-xs font-sans focus:outline-none" />
              {contactMapUrl && (
                <iframe src={contactMapUrl} width="100%" height="150" className="rounded-xl border border-brand-border/40 mt-2 shrink-0" title="Contact Map" />
              )}
            </div>
          </div>

          <button 
            onClick={handleSaveContact}
            disabled={loading}
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Contact settings'}
          </button>
        </div>
      )}

      {/* 5. Footer settings editor */}
      {subTab === 'footer' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-serif text-xl font-bold text-brand-heading border-b border-brand-border/25 pb-2">Footer Settings</h3>
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Brand Tagline</label>
              <input type="text" value={footerTagline} onChange={e => setFooterTagline(e.target.value)} placeholder="Where Every Petal Tells a Story" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">About Block Text</label>
              <textarea value={footerAboutText} onChange={e => setFooterAboutText(e.target.value)} rows={3} placeholder="A handcrafted crochet & floral lifestyle studio..." className="w-full p-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Instagram Handle URL</label>
                <input type="text" value={footerInstagram} onChange={e => setFooterInstagram(e.target.value)} placeholder="https://instagram.com/fuzzysoftstudio" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Facebook URL</label>
                <input type="text" value={footerFacebook} onChange={e => setFooterFacebook(e.target.value)} placeholder="https://facebook.com/fuzzysoftstudio" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Pinterest Board URL</label>
                <input type="text" value={footerPinterest} onChange={e => setFooterPinterest(e.target.value)} placeholder="https://pinterest.com/fuzzysoftstudio" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">WhatsApp URL Link</label>
                <input type="text" value={footerWhatsappUrl} onChange={e => setFooterWhatsappUrl(e.target.value)} placeholder="https://wa.me/91XXXXXXXXXX" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Copyright Text</label>
              <input type="text" value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} placeholder="© 2026 Fuzzy Soft Studio. All rights reserved." className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Footer Footnote</label>
              <input type="text" value={footerNote} onChange={e => setFooterNote(e.target.value)} placeholder="Made with love in Lucknow" className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" />
            </div>
          </div>

          <button 
            onClick={handleSaveFooter}
            disabled={loading}
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Footer Settings'}
          </button>
        </div>
      )}

      {/* 6. Announcements Tickers & Banners Editor */}
      {subTab === 'announcements' && (
        <div className="space-y-6 max-w-4xl">
          <h3 className="font-serif text-xl font-bold text-brand-heading border-b border-brand-border/25 pb-2">Announcements & Media Assets</h3>
          
          {/* Marquee ticker config */}
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Announcements Marquee text</label>
              <input 
                type="text" 
                value={offerLine} 
                onChange={e => setOfferLine(e.target.value)} 
                placeholder="🌸 Mother's Day Special: Use code BLOOM20 for 20% off all bouquets! 🌸" 
                className="w-full h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" 
              />
            </div>
            
            <div className="flex items-center justify-between bg-brand-cream/15 p-4 rounded-xl border border-brand-border/10 select-none">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-brand-heading">Marquee visibility</span>
                <span className="text-[10px] text-brand-body/55 block font-sans">Toggle running announcements marquee visibility</span>
              </div>
              <Toggle checked={marqueeVisible} onChange={setMarqueeVisible} />
            </div>
          </div>

          {/* Promotion Banner Card */}
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading">Homepage Promotion Banner URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={homeBannerUrl} 
                  onChange={e => setHomeBannerUrl(e.target.value)} 
                  placeholder="Paste banner image URL or upload WebP" 
                  className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none" 
                />
                <label className="h-11 px-4 bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold select-none active:scale-95 transition shrink-0">
                  <Upload size={14} />
                  <span>{uploadingIndex === 13 ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 13)} className="hidden" disabled={uploadingIndex !== null} />
                </label>
                {homeBannerUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear Promotion Banner?')) {
                        setHomeBannerUrl('');
                      }
                    }}
                    className="h-11 w-11 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                    title="Clear Image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {homeBannerUrl && (
                <div className="mt-2 aspect-[21/9] w-full rounded-xl overflow-hidden border border-brand-border/30">
                  <img src={homeBannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                </div>
              )}
            </div>
          </div>

          {/* Collection Banners Grid */}
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="font-serif text-lg font-bold text-brand-heading select-none border-b border-brand-border/20 pb-2">Collection Banners</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminCollectionBanners.map((banner, index) => (
                <div key={banner.slug} className="border border-brand-border/40 rounded-xl p-4 bg-white/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm text-brand-heading">{banner.name}</p>
                    <span className="text-[10px] text-brand-body/55 font-mono select-all">/{banner.slug}</span>
                  </div>

                  {banner.image && (
                    <div className="w-full h-32 rounded-lg overflow-hidden border border-brand-border/20 bg-brand-cream/25">
                      <img src={banner.image} alt={banner.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={banner.image || ''}
                      onChange={(e) => {
                        const updated = [...adminCollectionBanners];
                        updated[index] = { ...updated[index], image: e.target.value };
                        setAdminCollectionBanners(updated);
                      }}
                      placeholder="Paste banner image URL"
                      className="w-full border border-brand-border/40 rounded-lg px-3 py-1.5 text-xs bg-white/80"
                    />
                    <div className="flex gap-2">
                      <label className="h-8 flex-grow bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-bold select-none active:scale-95 transition">
                        <Upload size={12} />
                        <span>Upload WebP Banner</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={e => handleCollectionBannerUpload(e, index, banner.slug)}
                          className="hidden"
                        />
                      </label>
                      {banner.image && (
                        <button
                          type="button"
                          onClick={() => handleCollectionBannerDelete(index, banner.slug)}
                          className="h-8 w-8 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-lg flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                          title="Delete Banner"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Garden Slot configuration */}
          <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h4 className="font-serif text-lg font-bold text-brand-heading select-none">From Our Garden Grid (6 Slots)</h4>
              <p className="text-[10px] text-brand-body/50 mt-1 leading-relaxed">
                Featured flower block layouts on the home landing section. WebP upload is supported.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gardenSlots.map((slot, idx) => (
                <div key={idx} className="border border-brand-border/40 rounded-xl p-3 bg-white/50 space-y-2 flex flex-col justify-between">
                  <p className="font-semibold text-xs text-brand-heading">Slot {idx + 1}</p>
                  
                  {/* Show a small image preview (60x60px) after upload / if slot.url exists */}
                  <div className="flex gap-3 items-center">
                    <div className="w-[60px] h-[60px] rounded-lg overflow-hidden border border-brand-border/30 bg-brand-cream/35 flex items-center justify-center relative shrink-0">
                      {slot.url ? (
                        <img src={slot.url} className="w-full h-full object-cover" alt={`Garden Slot ${idx + 1}`} />
                      ) : (
                        <span className="text-[8px] text-brand-body/45 text-center">No Image</span>
                      )}
                    </div>
                    
                    <div className="flex-grow space-y-1.5">
                      {/* Image URL input field is READ-ONLY, does NOT allow manual typing */}
                      <input
                        type="text"
                        value={slot.url || ''}
                        readOnly
                        placeholder="Upload to set URL"
                        className="w-full border border-brand-border/40 rounded-lg px-2.5 py-1 text-[10px] bg-brand-cream/15 text-brand-body/60 font-mono focus:outline-none cursor-default"
                      />
                      
                      <div className="flex gap-2">
                        <label className="h-8 flex-grow bg-brand-cream/80 hover:bg-brand-cream border border-brand-border text-brand-heading rounded-lg flex items-center justify-center gap-1 cursor-pointer text-[10px] font-semibold select-none active:scale-95 transition">
                          <Upload size={10} />
                          <span>{uploadingIndex === 30 + idx ? '...' : 'Upload WebP'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingIndex(30 + idx);
                              try {
                                const webpBlob = await convertToWebP(file);
                                const webpFile = new File([webpBlob], `garden-slot-${idx + 1}.webp`, { type: 'image/webp' });
                                await handleGardenImageUpload(webpFile, idx);
                              } catch (err: any) {
                                alert('Upload failed: ' + err.message);
                              } finally {
                                setUploadingIndex(null);
                              }
                            }}
                            className="hidden"
                            disabled={uploadingIndex !== null}
                          />
                        </label>
                        {slot.url && (
                          <button
                            type="button"
                            onClick={() => handleGardenImageDelete(idx)}
                            className="h-8 w-8 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-lg flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                            title="Delete Image"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSaveAnnouncements}
            disabled={loading}
            className="px-8 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Announcements & Banner Assets'}
          </button>
        </div>
      )}
    </div>
  );
}
