// Shared TypeScript types for Supabase database records

export interface SupabaseProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  category: string;
  collection: string;
  image: string;
  images: string[];
  bullet_points: string[];
  care_instructions?: string;
  delivery_info?: string;
  description: string;
  stock: number;
  active: boolean;
  sku?: string;
  low_stock_threshold?: number;
  meta_title?: string;
  meta_description?: string;
  show_in_related?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  badges?: string[];
  created_at?: string;
}

export interface SupabaseOrder {
  id: string;
  order_id: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: string | any[];
  shipping_address: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  tracking_number?: string;
  carrier?: string;
  internal_notes?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cod_applied?: boolean;
  cod_charge?: number;
}

export interface SupabaseSetting {
  key: string;
  value: string;
}

export interface DiscountCode {
  id?: string;
  code: string;
  percent: number;
  expiry?: string; // ISO date string or empty
  limit?: number;
  active?: boolean;
  min_order_value?: number;
}
