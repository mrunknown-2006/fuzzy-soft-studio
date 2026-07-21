import type { SupabaseProduct, SupabaseOrder } from '../../types/database';

export interface SiteSettings {
  free_delivery_threshold: number;
  shipping_charges: number;
  whatsapp_number: string;
  contact_email: string;
  offer_line: string;
  banner_url?: string;
  store_logo_url?: string;
}

export interface AdminContext {
  products: SupabaseProduct[];
  setProducts: React.Dispatch<React.SetStateAction<SupabaseProduct[]>>;
  orders: SupabaseOrder[];
  setOrders: React.Dispatch<React.SetStateAction<SupabaseOrder[]>>;
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  reviews: any[];
  setReviews: React.Dispatch<React.SetStateAction<any[]>>;
  discountCodes: any[];
  setDiscountCodes: React.Dispatch<React.SetStateAction<any[]>>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadingIndex: number | null;
  setUploadingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number) => Promise<void>;
  lowStockThreshold: number;
  setLowStockThreshold: React.Dispatch<React.SetStateAction<number>>;
  loadAllData: () => Promise<void>;
  loadProducts: () => Promise<void>;
  storeOpen: boolean;
  setStoreOpen: React.Dispatch<React.SetStateAction<boolean>>;
  storeClosedMessage: string;
  setStoreClosedMessage: React.Dispatch<React.SetStateAction<string>>;
  codAvailable: boolean;
  setCodAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  codCharge: number;
  setCodCharge: React.Dispatch<React.SetStateAction<number>>;
  expressCharge: number;
  setExpressCharge: React.Dispatch<React.SetStateAction<number>>;
  adminCollectionBanners: any[];
  setAdminCollectionBanners: React.Dispatch<React.SetStateAction<any[]>>;
  gardenImages: string[];
  setGardenImages: React.Dispatch<React.SetStateAction<string[]>>;
}
