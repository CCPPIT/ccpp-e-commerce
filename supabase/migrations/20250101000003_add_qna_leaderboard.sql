/*
          # [Feature Expansion: Q&A, Leaderboard]
          This migration adds tables and views to support new social and gamification features.

          ## Query Description: [This script introduces a Question & Answer system for products and a Leaderboard view for users.
          1.  It creates a `product_qna` table for threaded discussions on product pages.
          2.  It creates a `leaderboard_view` to rank users by loyalty points.
          3.  RLS policies are applied to ensure users can only manage their own Q&A content.
          This is a non-destructive, structural change.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables Added: `product_qna`
          - Views Added: `leaderboard_view`
          - Columns Added: None to existing tables
          
          ## Security Implications:
          - RLS Status: Enabled on `product_qna`
          - Policy Changes: Yes, new policies for `product_qna`
          - Auth Requirements: Users must be authenticated to post questions/answers.
          
          ## Performance Impact:
          - Indexes: Primary and foreign key indexes are created automatically.
          - Triggers: None
          - Estimated Impact: Low. The new view is simple and reads from an indexed column.
          */

-- Create product_qna table for questions and answers
CREATE TABLE public.product_qna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.product_qna(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments to the new table
COMMENT ON TABLE public.product_qna IS 'Stores questions and answers related to products.';
COMMENT ON COLUMN public.product_qna.parent_id IS 'The parent question or answer this entry is a reply to.';

-- Enable RLS
ALTER TABLE public.product_qna ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_qna
CREATE POLICY "Allow public read access"
ON public.product_qna
FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert their own questions and answers"
ON public.product_qna
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own content"
ON public.product_qna
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own content"
ON public.product_qna
FOR DELETE
USING (auth.uid() = user_id);


-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    id,
    full_name,
    avatar_url,
    loyalty_points
FROM
    public.profiles
ORDER BY
    loyalty_points DESC
LIMIT 100;

-- Add comment to the new view
COMMENT ON VIEW public.leaderboard_view IS 'Provides a ranked list of top 100 users by loyalty points.';
