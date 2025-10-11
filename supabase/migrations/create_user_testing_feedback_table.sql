-- Create user_testing_feedback table for collecting user feedback and testing data
CREATE TABLE IF NOT EXISTS user_testing_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic session info
    tester_name TEXT,
    device_browser TEXT,
    session_duration TEXT,
    
    -- Task completion tracking
    signup_success TEXT CHECK (signup_success IN ('yes', 'partial', 'no', 'na')),
    signup_method TEXT, -- Comma-separated list of methods used
    create_game TEXT CHECK (create_game IN ('yes', 'partial', 'no', 'na')),
    join_game TEXT CHECK (join_game IN ('yes', 'partial', 'no', 'na')),
    
    -- Experience ratings (1-5 scale)
    onboarding_rating INTEGER CHECK (onboarding_rating >= 1 AND onboarding_rating <= 5),
    game_creation_rating INTEGER CHECK (game_creation_rating >= 1 AND game_creation_rating <= 5),
    navigation_rating INTEGER CHECK (navigation_rating >= 1 AND navigation_rating <= 5),
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    likelihood_rating INTEGER CHECK (likelihood_rating >= 1 AND likelihood_rating <= 5),
    
    -- Technical issues and bugs
    technical_issues TEXT, -- Comma-separated list of issues encountered
    bug_details TEXT,
    
    -- Qualitative feedback
    positive_feedback TEXT,
    confusion_feedback TEXT,
    missing_features TEXT,
    additional_comments TEXT,
    
    -- Context and metadata
    trigger_context TEXT DEFAULT 'feedback_page' CHECK (trigger_context IN ('onboarding', 'game_creation', 'game_join', 'general', 'feedback_page')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional user association
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_submitted_at ON user_testing_feedback(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_trigger_context ON user_testing_feedback(trigger_context);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_user_id ON user_testing_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_device_browser ON user_testing_feedback(device_browser);

-- Enable Row Level Security (RLS)
ALTER TABLE user_testing_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Allow anyone to insert feedback (anonymous or authenticated)
CREATE POLICY "Anyone can submit feedback" ON user_testing_feedback
    FOR INSERT 
    WITH CHECK (true);

-- Policy 2: Users can view their own feedback if they're authenticated
CREATE POLICY "Users can view own feedback" ON user_testing_feedback
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL AND 
        (user_id = auth.uid() OR user_id IS NULL)
    );

-- Policy 3: Admin users can view all feedback (assuming you have an admin role system)
-- Uncomment and modify this if you have admin roles set up
-- CREATE POLICY "Admins can view all feedback" ON user_testing_feedback
--     FOR SELECT 
--     USING (
--         EXISTS (
--             SELECT 1 FROM users 
--             WHERE id = auth.uid() 
--             AND role = 'admin'
--         )
--     );

-- Policy 4: No updates or deletes allowed (preserve feedback integrity)
-- Users cannot modify or delete feedback once submitted

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_testing_feedback_updated_at 
    BEFORE UPDATE ON user_testing_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE user_testing_feedback IS 'Stores user feedback and testing data from the integrated feedback system';
COMMENT ON COLUMN user_testing_feedback.tester_name IS 'Optional name or initials provided by the user';
COMMENT ON COLUMN user_testing_feedback.device_browser IS 'Device and browser combination used during testing';
COMMENT ON COLUMN user_testing_feedback.session_duration IS 'How long the user has been using the app';
COMMENT ON COLUMN user_testing_feedback.signup_success IS 'Whether user successfully completed signup process';
COMMENT ON COLUMN user_testing_feedback.signup_method IS 'Comma-separated list of signup methods attempted';
COMMENT ON COLUMN user_testing_feedback.technical_issues IS 'Comma-separated list of technical issues encountered';
COMMENT ON COLUMN user_testing_feedback.trigger_context IS 'What triggered the feedback collection';
COMMENT ON COLUMN user_testing_feedback.user_id IS 'Optional reference to authenticated user who submitted feedback';
