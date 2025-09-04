/*
          # [Operation Name]
          Create Subscriptions and Daily Spin Tables

          ## Query Description: [This script adds new tables to support product subscriptions and a daily spin wheel feature. It creates the 'subscriptions' table to manage recurring product deliveries and the 'user_spins' table to track daily user engagement with the spin wheel. These changes are structural and safe, with no impact on existing data.]

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Adds table: `public.subscriptions`
          - Adds table: `public.user_spins`

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Users must be authenticated to interact with their own subscriptions and spin records.

          ## Performance Impact:
          - Indexes: Primary keys and foreign keys are indexed by default.
          - Triggers: None
          - Estimated Impact: Low performance impact, as these are new tables.
          */

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    frequency text NOT NULL, -- e.g., 'weekly', 'monthly'
    status text NOT NULL DEFAULT 'active', -- e.g., 'active', 'paused', 'cancelled'
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    next_delivery_date date NOT NULL
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Create User Spins Table
CREATE TABLE IF NOT EXISTS public.user_spins (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    last_spin_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own spin records" ON public.user_spins
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comments for clarity
COMMENT ON TABLE public.subscriptions IS 'Stores user subscriptions for products.';
COMMENT ON TABLE public.user_spins IS 'Tracks the last time a user spun the daily wheel.';
