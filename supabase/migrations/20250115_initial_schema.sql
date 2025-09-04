/*
# Initial E-commerce Database Schema
Creates the foundational tables for an Arabic e-commerce platform including user profiles, products, categories, and shopping cart functionality.

## Query Description:
This migration establishes the core database structure for an e-commerce application. It creates user profiles linked to Supabase auth, product categories, products with Arabic names and descriptions, and shopping cart functionality. The schema supports user authentication, product management, and basic e-commerce operations. Safe initial setup with no existing data impact.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- profiles: User profile information linked to auth.users
- categories: Product categories with Arabic names
- products: Product catalog with pricing and inventory
- cart_items: Shopping cart functionality
- orders: Order management system
- order_items: Order details and line items

## Security Implications:
- RLS Status: Enabled on all public tables
- Policy Changes: Yes
- Auth Requirements: JWT-based authentication for user-specific data

## Performance Impact:
- Indexes: Added on foreign keys and frequently queried columns
- Triggers: Profile creation trigger on auth.users
- Estimated Impact: Minimal performance impact for initial setup
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description_ar TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_urls TEXT[] DEFAULT '{}',
    stock_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create cart_items table
CREATE TABLE public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (is_active = true);

-- Products policies (public read)
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Cart items policies
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart items" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart items" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart items" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items for own orders" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample categories
INSERT INTO public.categories (name_ar, name_en, description_ar, image_url) VALUES
('الدروع', 'Shields', 'دروع تذكارية وتكريمية', 'https://images.unsplash.com/photo-1567360425618-1594206637d2?w=300&h=300&fit=crop'),
('الأقلام', 'Pens', 'أقلام فاخرة ومخصصة', 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=300&fit=crop'),
('المفكرات والحافديات', 'Notebooks', 'مفكرات وحافديات مخصصة', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=300&fit=crop'),
('حقائب وأفرد', 'Bags & Individuals', 'حقائب وهدايا فردية', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop');

-- Insert sample products
INSERT INTO public.products (name_ar, name_en, description_ar, price, sale_price, category_id, image_urls, stock_quantity, is_featured) VALUES
('درع تذكاري ذهبي', 'Golden Memorial Shield', 'درع تذكاري فاخر مصنوع من المعدن المطلي بالذهب', 299.99, 249.99, (SELECT id FROM public.categories WHERE name_ar = 'الدروع' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1567360425618-1594206637d2?w=400&h=400&fit=crop'], 50, true),
('قلم حبر فاخر', 'Luxury Fountain Pen', 'قلم حبر فاخر مع إمكانية الحفر الشخصي', 89.99, null, (SELECT id FROM public.categories WHERE name_ar = 'الأقلام' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop'], 100, true),
('مفكرة جلدية مخصصة', 'Custom Leather Notebook', 'مفكرة جلدية فاخرة مع إمكانية التخصيص', 45.99, 39.99, (SELECT id FROM public.categories WHERE name_ar = 'المفكرات والحافديات' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop'], 75, false),
('حقيبة عمل أنيقة', 'Elegant Business Bag', 'حقيبة عمل أنيقة مناسبة للمناسبات الرسمية', 129.99, null, (SELECT id FROM public.categories WHERE name_ar = 'حقائب وأفرد' LIMIT 1), ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'], 30, true);
