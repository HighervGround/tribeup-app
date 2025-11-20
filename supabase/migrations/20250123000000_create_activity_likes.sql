-- Create activity_likes table for like/kudos functionality
CREATE TABLE IF NOT EXISTS public.activity_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON public.activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON public.activity_likes(user_id);

-- Enable RLS
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read likes (for counts)
CREATE POLICY "Anyone can read activity likes"
    ON public.activity_likes
    FOR SELECT
    USING (true);

-- Users can like/unlike activities
CREATE POLICY "Users can like activities"
    ON public.activity_likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unlike activities they liked
CREATE POLICY "Users can unlike activities"
    ON public.activity_likes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create view for activity like counts
CREATE OR REPLACE VIEW public.activity_like_counts AS
SELECT 
    activity_id,
    COUNT(*) as like_count
FROM public.activity_likes
GROUP BY activity_id;

-- Grant access
GRANT SELECT ON public.activity_like_counts TO authenticated, anon;

