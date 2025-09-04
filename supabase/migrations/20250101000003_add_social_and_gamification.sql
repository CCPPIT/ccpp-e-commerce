/*
# [Social & Gamification Features]
This migration adds the necessary tables for social commerce (shopping feed), AI assistance (stylist chat), and advanced gamification (challenges).

## Query Description: This operation is structural and safe. It adds new tables and does not modify or delete existing data. It will enable new social, AI, and gamification features within the application.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the created tables and types)

## Structure Details:
- Tables Created:
  - `posts`: For user-generated content in the shopping feed.
  - `post_tagged_products`: Links posts to products.
  - `post_likes`: Tracks likes on posts.
  - `ai_stylist_messages`: Stores conversations with the AI stylist.
  - `challenges`: Defines available daily/weekly challenges.
  - `user_challenges`: Tracks user completion of challenges.

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: New policies are added to restrict access to user-specific data.
- Auth Requirements: All new tables are linked to `auth.users`.

## Performance Impact:
- Indexes: Added on foreign keys and frequently queried columns.
- Triggers: None.
- Estimated Impact: Low. The new tables will only be queried on new feature screens.
*/

-- 1. Posts for Shopping Feed
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- 2. Tagged Products in Posts
CREATE TABLE post_tagged_products (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, product_id)
);
ALTER TABLE post_tagged_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all tagged products" ON post_tagged_products FOR SELECT USING (true);
CREATE POLICY "Users can insert tags on their own posts" ON post_tagged_products FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM posts WHERE id = post_id)
);
CREATE POLICY "Users can delete tags on their own posts" ON post_tagged_products FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM posts WHERE id = post_id)
);

-- 3. Likes on Posts
CREATE TABLE post_likes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert/delete their own likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

-- 4. AI Stylist Messages
CREATE TYPE message_sender AS ENUM ('user', 'ai');
CREATE TABLE ai_stylist_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender message_sender NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ai_stylist_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own messages" ON ai_stylist_messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_ai_stylist_messages_user_id ON ai_stylist_messages(user_id);

-- 5. Challenges
CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'one_time');
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_points INT NOT NULL DEFAULT 10,
    type challenge_type NOT NULL DEFAULT 'one_time',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all active challenges" ON challenges FOR SELECT USING (is_active = true);
-- Admin policies would be needed to insert/update challenges

-- 6. User Challenges (tracking completion)
CREATE TABLE user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, challenge_id)
);
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own completed challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own completed challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);

-- Seed some challenges for demonstration
INSERT INTO challenges (name, description, reward_points, type) VALUES
('المتسوق اليومي', 'قم بزيارة التطبيق يومياً', 5, 'daily'),
('المراجع الأول', 'أضف أول تقييم لك على منتج', 20, 'one_time'),
('مشاركة اجتماعية', 'شارك منتجاً مع أصدقائك', 10, 'daily'),
('مستكشف الفئات', 'تصفح 3 فئات مختلفة', 10, 'daily');
