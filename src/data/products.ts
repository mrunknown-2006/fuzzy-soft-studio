export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  collection: 'bridal-blooms' | 'everyday-luxury' | 'seasonal-picks' | 'gift-bouquets';
  image: string;
  images: string[]; // 4 images for the details page gallery
  description: string;
  dateAdded: string; // ISO date format for newest sorting (YYYY-MM-DD)
  stock?: number; // optional — Supabase products have this field
  bullet_points?: string[];
  care_instructions?: string;
  delivery_info?: string;
  active?: boolean;
}

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Bridal Whisper',
    slug: 'bridal-whisper',
    price: 2999,
    category: 'Bouquets',
    collection: 'bridal-blooms',
    image: 'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=600&q=80',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&q=80',
      'https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?w=600&q=80',
      'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80'
    ],
    description: 'White peonies & blush roses tied in silk.',
    dateAdded: '2026-05-10'
  },
  {
    id: 'p2',
    name: 'Rosy Reverie',
    slug: 'rosy-reverie',
    price: 1899,
    category: 'Bouquets',
    collection: 'gift-bouquets',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=80',
      'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=600&q=80',
      'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=600&q=80',
      'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&q=80'
    ],
    description: 'Garden roses in deep rose & dusty mauve.',
    dateAdded: '2026-05-14'
  },
  {
    id: 'p3',
    name: 'Peach Sonnet',
    slug: 'peach-sonnet',
    price: 1599,
    category: 'Bouquets',
    collection: 'everyday-luxury',
    image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc17?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1490750967868-88df5691cc17?w=600&q=80',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80',
      'https://images.unsplash.com/photo-1470509682226-c89ac2d76028?w=600&q=80',
      'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=600&q=80'
    ],
    description: 'Ranunculus and lisianthus, hand-tied softness.',
    dateAdded: '2026-05-08'
  },
  {
    id: 'p4',
    name: 'Preserved Dream',
    slug: 'preserved-dream',
    price: 2499,
    category: 'Dried Flowers',
    collection: 'seasonal-picks',
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&q=80',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80',
      'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=600&q=80',
      'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&q=80'
    ],
    description: 'Pampas and preserved blooms — timeless.',
    dateAdded: '2026-05-12'
  },
  {
    id: 'p5',
    name: 'Wild Meadow',
    slug: 'wild-meadow',
    price: 1299,
    category: 'Bouquets',
    collection: 'gift-bouquets',
    image: 'https://images.unsplash.com/photo-1553322378-eb2e8be65f52?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1553322378-eb2e8be65f52?w=600&q=80',
      'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&q=80',
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=80',
      'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=600&q=80'
    ],
    description: 'Cosmos, daisies, and sage from the garden.',
    dateAdded: '2026-05-06'
  },
  {
    id: 'p6',
    name: 'Velvet Keepsake',
    slug: 'velvet-keepsake',
    price: 2799,
    category: 'Gift Boxes',
    collection: 'bridal-blooms',
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&q=80',
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=80',
      'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=600&q=80',
      'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=600&q=80'
    ],
    description: 'A blush box of preserved roses, made to last.',
    dateAdded: '2026-05-15'
  },
  {
    id: 'p7',
    name: 'Tulip Letter',
    slug: 'tulip-letter',
    price: 999,
    category: 'Bouquets',
    collection: 'seasonal-picks',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&q=80',
      'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&q=80',
      'https://images.unsplash.com/photo-1490750967868-88df5691cc17?w=600&q=80',
      'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=600&q=80'
    ],
    description: 'Pastel tulips wrapped in kraft & ribbon.',
    dateAdded: '2026-05-05'
  },
  {
    id: 'p8',
    name: 'Ivory Grace',
    slug: 'ivory-grace',
    price: 1799,
    category: 'Arrangements',
    collection: 'everyday-luxury',
    image: 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=600&q=80',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&q=80',
      'https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?w=600&q=80',
      'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&q=80'
    ],
    description: 'An ivory rose centerpiece for the home.',
    dateAdded: '2026-05-18'
  }
];

export const collections = [
  {
    name: 'Bridal Blooms',
    slug: 'bridal-blooms',
    image: 'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=800&q=80'
  },
  {
    name: 'Everyday Luxury',
    slug: 'everyday-luxury',
    image: 'https://images.unsplash.com/photo-1487530811015-780780a87cc2?w=800&q=80'
  },
  {
    name: 'Seasonal Picks',
    slug: 'seasonal-picks',
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&q=80'
  },
  {
    name: 'Gift Bouquets',
    slug: 'gift-bouquets',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&q=80'
  }
];
