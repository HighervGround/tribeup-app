-- Create user_testing_feedback table for survey responses
CREATE TABLE IF NOT EXISTS user_testing_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic session info
    tester_name TEXT NOT NULL,
    device_browser TEXT NOT NULL,
    session_duration TEXT,
    trigger_context TEXT DEFAULT 'general',
    
    -- Task completion
    signup_success TEXT NOT NULL,
    signup_method TEXT DEFAULT '',
    create_game TEXT NOT NULL,
    join_game TEXT NOT NULL,
    
    -- Experience ratings (1-5 scale)
    onboarding_rating INTEGER CHECK (onboarding_rating >= 1 AND onboarding_rating <= 5),
    game_creation_rating INTEGER CHECK (game_creation_rating >= 1 AND game_creation_rating <= 5),
    navigation_rating INTEGER CHECK (navigation_rating >= 1 AND navigation_rating <= 5),
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    likelihood_rating INTEGER CHECK (likelihood_rating >= 1 AND likelihood_rating <= 5),
    
    -- Technical issues and feedback
    technical_issues TEXT DEFAULT '',
    bug_details TEXT DEFAULT '',
    positive_feedback TEXT DEFAULT '',
    confusion_feedback TEXT DEFAULT '',
    missing_features TEXT DEFAULT '',
    additional_comments TEXT DEFAULT '',
    
    -- Metadata
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_testing_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (for anonymous testing)
CREATE POLICY "Anyone can submit user testing feedback" ON user_testing_feedback
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can read feedback (for admin analysis)
CREATE POLICY "Authenticated users can read feedback" ON user_testing_feedback
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_submitted_at ON user_testing_feedback(submitted_at);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_trigger_context ON user_testing_feedback(trigger_context);
CREATE INDEX IF NOT EXISTS idx_user_testing_feedback_device_browser ON user_testing_feedback(device_browser);

-- Add trigger for updated_at
CREATE TRIGGER update_user_testing_feedback_updated_at 
    BEFORE UPDATE ON user_testing_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
