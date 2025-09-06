-- Create public_rsvps table for non-authenticated users to RSVP to games
CREATE TABLE public_rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_public_rsvps_game_id ON public_rsvps(game_id);
CREATE INDEX idx_public_rsvps_email ON public_rsvps(email);
CREATE INDEX idx_public_rsvps_created_at ON public_rsvps(created_at);

-- Add unique constraint to prevent duplicate RSVPs from same email for same game
CREATE UNIQUE INDEX idx_public_rsvps_game_email ON public_rsvps(game_id, email);

-- Enable RLS (Row Level Security)
ALTER TABLE public_rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies for public_rsvps
-- Allow anyone to read public RSVPs (for displaying RSVP counts)
CREATE POLICY "Public RSVPs are viewable by everyone" ON public_rsvps
    FOR SELECT USING (true);

-- Allow anyone to insert public RSVPs (for public RSVP functionality)
CREATE POLICY "Anyone can create public RSVPs" ON public_rsvps
    FOR INSERT WITH CHECK (true);

-- Only allow users to update their own RSVPs (by email)
CREATE POLICY "Users can update their own public RSVPs" ON public_rsvps
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Only allow users to delete their own RSVPs (by email)
CREATE POLICY "Users can delete their own public RSVPs" ON public_rsvps
    FOR DELETE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_rsvps_updated_at 
    BEFORE UPDATE ON public_rsvps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public_rsvps IS 'Stores RSVPs from non-authenticated users who want to join games via public links';
