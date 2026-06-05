// Shared TypeScript types for Supabase database records

export interface SupabaseProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
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
  created_at?: string;
}

export interface SupabaseOrder {
  id: string;
  order_id: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  items: string | any[];
  shipping_address: string;
  customer_name: string;
  customer_phone: string;
}

export interface SupabaseSetting {
  key: string;
  value: string;
}

export interface DiscountCode {
  code: string;
  percent: number;
  expiry?: string; // ISO date string or empty
}
