/*
          # [Operation Name]
          Create Reviews, Badges, and Live Shopping Tables

          ## Query Description: 
          This script adds new tables to support revolutionary features: product reviews with images, a user badge/achievement system, and a structure for live shopping events. It establishes relationships between users, products, and these new entities. This change is structural and does not risk existing data.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the new tables)
          
          ## Structure Details:
          - Creates `reviews` table for user-submitted product reviews.
          - Creates `badges` table to define available achievements.
          - Creates `user_badges` table to link users to earned badges.
          - Creates `live_streams` table for managing live shopping events.
          
          ## Security Implications:
          - RLS Status: Enabled on all new tables.
          - Policy Changes: Yes, new policies are created for `reviews`, `user_badges`, and `live_streams` to ensure users can only manage their own data while allowing public read access where appropriate.
          - Auth Requirements: A valid user session (JWT) is required to create reviews or earn badges.
          
          ## Performance Impact:
          - Indexes: Added on foreign keys (`user_id`, `product_id`, `badge_id`) for efficient querying.
          - Triggers: None added in this script.
          - Estimated Impact: Low performance impact on existing operations.
          */

-- 1. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- 2. Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for Reviews
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews"
ON public.reviews
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow users to insert their own reviews" ON public.reviews;
CREATE POLICY "Allow users to insert their own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own reviews" ON public.reviews;
CREATE POLICY "Allow users to update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own reviews" ON public.reviews;
CREATE POLICY "Allow users to delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create Badges Table (for achievements)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description_ar TEXT,
    icon_name TEXT NOT NULL, -- e.g., 'award', 'star', 'shopping-cart' from lucide-react-native
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable RLS for Badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies for Badges (publicly readable)
DROP POLICY IF EXISTS "Allow public read access to badges" ON public.badges;
CREATE POLICY "Allow public read access to badges"
ON public.badges
FOR SELECT
USING (true);

-- 7. Create User Badges Table (join table)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- 8. Enable RLS for User Badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 9. Create Policies for User Badges
DROP POLICY IF EXISTS "Allow users to view their own badges" ON public.user_badges;
CREATE POLICY "Allow users to view their own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

-- 10. Create Live Streams Table
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    stream_url TEXT,
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, live, finished
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Enable RLS for Live Streams
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- 12. Create Policies for Live Streams (publicly readable)
DROP POLICY IF EXISTS "Allow public read access to live streams" ON public.live_streams;
CREATE POLICY "Allow public read access to live streams"
ON public.live_streams
FOR SELECT
USING (true);

-- 13. Seed some initial badges
INSERT INTO public.badges (name_ar, name_en, description_ar, icon_name)
VALUES
    ('المتسوق الأول', 'First Shopper', 'لإتمام أول عملية شراء بنجاح', 'shopping-cart'),
    ('الناقد الأول', 'First Reviewer', 'لكتابة أول تقييم على منتج', 'message-square'),
    ('المستكشف', 'Explorer', 'لتصفح 10 منتجات مختلفة', 'compass')
ON CONFLICT DO NOTHING;

-- 14. Create a function to award a badge to a user
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_name_en TEXT)
RETURNS void AS $$
DECLARE
    v_badge_id UUID;
BEGIN
    SELECT id INTO v_badge_id FROM public.badges WHERE name_en = p_badge_name_en;
    
    IF v_badge_id IS NOT NULL THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (p_user_id, v_badge_id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 15. Create a trigger function to award 'First Shopper' badge
CREATE OR REPLACE FUNCTION handle_new_order_badge()
RETURNS TRIGGER AS $$
DECLARE
    order_count INT;
BEGIN
    -- Check if this is the user's first order
    SELECT count(*) INTO order_count FROM public.orders WHERE user_id = NEW.user_id;
    
    IF order_count = 1 THEN
        PERFORM award_badge(NEW.user_id, 'First Shopper');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create a trigger on the orders table
DROP TRIGGER IF EXISTS on_new_order_award_badge ON public.orders;
CREATE TRIGGER on_new_order_award_badge
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION handle_new_order_badge();

-- 17. Create a trigger function to award 'First Reviewer' badge
CREATE OR REPLACE FUNCTION handle_new_review_badge()
RETURNS TRIGGER AS $$
DECLARE
    review_count INT;
BEGIN
    -- Check if this is the user's first review
    SELECT count(*) INTO review_count FROM public.reviews WHERE user_id = NEW.user_id;
    
    IF review_count = 1 THEN
        PERFORM award_badge(NEW.user_id, 'First Reviewer');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Create a trigger on the reviews table
DROP TRIGGER IF EXISTS on_new_review_award_badge ON public.reviews;
CREATE TRIGGER on_new_review_award_badge
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION handle_new_review_badge();
