-- Create user_presence table for tracking online users
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_online BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all presence data" ON public.user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON public.user_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence" ON public.user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON public.user_presence(is_online);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_presence_updated_at
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_updated_at();
