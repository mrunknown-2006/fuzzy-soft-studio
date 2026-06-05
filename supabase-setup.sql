-- ----------------------------------------------------
-- FUZZY SOFT STUDIO - SUPABASE DATABASE INITIALIZATION
-- Run this script in the Supabase SQL Editor (Dashboard)
-- ----------------------------------------------------

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Products Table
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
    stock INT NOT NULL DEFAULT 10,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    shipping_address TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 7. Configure RLS Policies for Products
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on products" ON public.products;
CREATE POLICY "Allow admin modify access on products" ON public.products
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- 8. Configure RLS Policies for Settings
DROP POLICY IF EXISTS "Allow public read access on settings" ON public.settings;
CREATE POLICY "Allow public read access on settings" ON public.settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify access on settings" ON public.settings;
CREATE POLICY "Allow admin modify access on settings" ON public.settings
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com');

-- 9. Configure RLS Policies for Orders
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

-- 10. Configure RLS Policies for Reviews
DROP POLICY IF EXISTS "Allow public read access on reviews" ON public.reviews;
CREATE POLICY "Allow public read access on reviews" ON public.reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert access on reviews" ON public.reviews;
CREATE POLICY "Allow authenticated insert access on reviews" ON public.reviews
    FOR INSERT TO authenticated WITH CHECK (true);

-- 11. Setup Storage Bucket for Product Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated admin email to upload and modify images
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
CREATE POLICY "Admin Upload Access" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'product-images' AND 
        (auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com'
    )
    WITH CHECK (
        bucket_id = 'product-images' AND 
        (auth.jwt() ->> 'email') = 'angrybird@fuzzysoftstudio.com'
    );
