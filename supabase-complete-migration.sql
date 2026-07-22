-- ====================================================================
-- FUZZY SOFT STUDIO - COMPLETE SUPABASE SETUP & SCHEMA ALIGNMENT SCRIPT
-- ====================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- to create or update all tables, add columns, configure storage,
-- establish RLS policies, and seed default values.
-- ====================================================================

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. Create and Align Database Tables
-- ==========================================

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    collection TEXT NOT NULL,
    image TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    bullet_points TEXT[] NOT NULL DEFAULT '{}',
    care_instructions TEXT,
    delivery_info TEXT,
    description TEXT NOT NULL,
    short_summary TEXT,
    full_description TEXT,
    stock INT NOT NULL DEFAULT 10,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    customization_options JSONB DEFAULT '{"allow_ribbon_selection": false, "allow_gift_note": false}'::jsonb,
    crafting_time TEXT DEFAULT '2-3 Days to handcraft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Site Content Table
CREATE TABLE IF NOT EXISTS public.site_content (
    id TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Discounts Table
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    value NUMERIC NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    max_uses INT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    min_order_value NUMERIC,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    shipping_address TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    gifting_info JSONB,
    utr_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    rating INT,
    title TEXT,
    comment TEXT,
    review_text TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. Perform Column Migrations (Add Missing Columns Safely)
-- ==========================================

-- Products Columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '{"allow_ribbon_selection": false, "allow_gift_note": false}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS crafting_time TEXT DEFAULT '2-3 Days to handcraft';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_summary TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_description TEXT;

-- Orders Columns & Constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_applied BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_charge NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gifting_info JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utr_number TEXT;

-- Discounts Columns
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS min_order_value NUMERIC;

-- Reviews Columns & Constraints
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);

-- ==========================================
-- 4. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. Establish Table RLS Policies
-- ==========================================

-- Products Policies
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on products" ON public.products;
CREATE POLICY "Allow admin modify access on products" ON public.products
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- Store Settings Policies
DROP POLICY IF EXISTS "Allow public read access on store_settings" ON public.store_settings;
CREATE POLICY "Allow public read access on store_settings" ON public.store_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on store_settings" ON public.store_settings;
CREATE POLICY "Allow admin modify access on store_settings" ON public.store_settings
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- Site Content Policies
DROP POLICY IF EXISTS "Allow public read access on site_content" ON public.site_content;
CREATE POLICY "Allow public read access on site_content" ON public.site_content
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on site_content" ON public.site_content;
CREATE POLICY "Allow admin modify access on site_content" ON public.site_content
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- Categories Policies
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on categories" ON public.categories;
CREATE POLICY "Allow admin modify access on categories" ON public.categories
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- Discounts Policies
DROP POLICY IF EXISTS "Allow public read access on discounts" ON public.discounts;
CREATE POLICY "Allow public read access on discounts" ON public.discounts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on discounts" ON public.discounts;
CREATE POLICY "Allow admin modify access on discounts" ON public.discounts
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- Orders Policies
DROP POLICY IF EXISTS "Allow public insert access on orders" ON public.orders;
CREATE POLICY "Allow public insert access on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to read their own orders" ON public.orders;
CREATE POLICY "Allow users to read their own orders" ON public.orders
    FOR SELECT USING (
        (auth.uid()::text = user_id) OR
        ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    );

DROP POLICY IF EXISTS "Allow admin modify access on orders" ON public.orders;
CREATE POLICY "Allow admin modify access on orders" ON public.orders
    FOR UPDATE TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- Reviews Policies
DROP POLICY IF EXISTS "Allow public read access on reviews" ON public.reviews;
CREATE POLICY "Allow public read access on reviews" ON public.reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert access on reviews" ON public.reviews;
CREATE POLICY "Allow authenticated insert access on reviews" ON public.reviews
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin modify access on reviews" ON public.reviews;
CREATE POLICY "Allow admin modify access on reviews" ON public.reviews
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- ==========================================
-- 6. Setup Public Storage Buckets & Policies
-- ==========================================

-- Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('content', 'content', true)
ON CONFLICT (id) DO NOTHING;

-- Public Storage Read Access (Allows reading from both product-images and content buckets)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id IN ('product-images', 'content'));

-- Admin Storage Write Access (Allows admin to upload/delete/modify files in public buckets)
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
CREATE POLICY "Admin Upload Access" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id IN ('product-images', 'content') AND 
        (auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com'
    )
    WITH CHECK (
        bucket_id IN ('product-images', 'content') AND 
        (auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com'
    );

-- ==========================================
-- 7. Seed Essential Defaults (Avoid Blank Page Crashes)
-- ==========================================

-- Default Store Settings
INSERT INTO public.store_settings (key, value)
VALUES 
  ('general', '{"store_open": true, "footer": "Fuzzy Soft Studio", "whatsapp_number": "6306755973", "contact_email": "hello@fuzzysoftstudio.com", "free_delivery_threshold": 999, "shipping_charges": 99, "cod_available": true}'::jsonb),
  ('store_open', 'true'::jsonb),
  ('footer', '"Fuzzy Soft Studio"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Default Page / Dynamic Layout Site Content
INSERT INTO public.site_content (id, content)
VALUES 
  ('collections', '{"bridal_blooms_url": "", "everyday_luxury_url": "", "seasonal_picks_url": "", "gift_bouquets_url": ""}'::jsonb),
  ('garden_gallery', '{"photos": []}'::jsonb),
  ('hero', '{"title": "Exquisite Crochet Flowers", "subtitle": "Handcrafted to last forever", "button_text": "Shop Now", "background_url": ""}'::jsonb),
  ('about', '{"story_title": "Our Story", "story_text": "Handcrafting eternal crochet flower arrangements...", "founder_title": "Meet the Founder", "founder_text": "", "founder_image": "", "about_founder_image": ""}'::jsonb),
  ('contact', '{"contact_email": "hello@fuzzysoftstudio.com", "contact_phone": "", "contact_whatsapp": "6306755973", "contact_hours": "Mon-Sat: 9AM - 6PM", "contact_title": "Get in Touch", "contact_intro": "Have any questions?", "contact_location": ""}'::jsonb)
ON CONFLICT (id) DO NOTHING;
