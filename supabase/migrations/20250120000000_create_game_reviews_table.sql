-- Create game_reviews table for user ratings
CREATE TABLE IF NOT EXISTS game_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per reviewer-reviewee-game combination
    UNIQUE(game_id, reviewer_id, reviewee_id)
);

-- Add RLS policies
ALTER TABLE game_reviews ENABLE ROW LEVEL SECURITY;

-- Users can read all reviews
CREATE POLICY "Users can read all game reviews" ON game_reviews
    FOR SELECT USING (true);

-- Users can insert reviews for games they participated in
CREATE POLICY "Users can create reviews for games they joined" ON game_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM game_participants 
            WHERE game_id = game_reviews.game_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON game_reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON game_reviews
    FOR DELETE USING (reviewer_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_reviews_game_id ON game_reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_reviewer_id ON game_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_reviewee_id ON game_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_rating ON game_reviews(rating);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_reviews_updated_at 
    BEFORE UPDATE ON game_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
