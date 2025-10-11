-- Simple SQL script to create user_testing_feedback table
-- Run this in your Supabase SQL Editor

CREATE TABLE user_testing_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic info
    tester_name TEXT,
    device_browser TEXT,
    session_duration TEXT,
    
    -- Task completion
    signup_success TEXT,
    signup_method TEXT,
    create_game TEXT,
    join_game TEXT,
    
    -- Ratings (1-5)
    onboarding_rating INTEGER,
    game_creation_rating INTEGER,
    navigation_rating INTEGER,
    performance_rating INTEGER,
    likelihood_rating INTEGER,
    
    -- Feedback text
    technical_issues TEXT,
    bug_details TEXT,
    positive_feedback TEXT,
    confusion_feedback TEXT,
    missing_features TEXT,
    additional_comments TEXT,
    
    -- Metadata
    trigger_context TEXT DEFAULT 'feedback_page',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_testing_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback
CREATE POLICY "Anyone can submit feedback" ON user_testing_feedback
    FOR INSERT WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON user_testing_feedback
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
