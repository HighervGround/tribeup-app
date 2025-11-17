-- TribeUp Tribes System Migration
-- Creates persistent groups (tribes) for organizing activities
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Tribes table - Main tribe/group table
CREATE TABLE IF NOT EXISTS public.tribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  activity TEXT NOT NULL, -- Primary activity for this tribe
  avatar_url TEXT,
  cover_image_url TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  game_count INTEGER DEFAULT 0,
  location TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  settings JSONB DEFAULT '{}'::jsonb, -- Custom settings (privacy, notifications, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tribes_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  CONSTRAINT tribes_description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

-- Tribe members table - Member relationships with roles
CREATE TABLE IF NOT EXISTS public.tribe_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  invite_token TEXT, -- For public invite links
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tribe_id, user_id),
  CONSTRAINT tribe_members_valid_invite CHECK (
    (invite_token IS NULL) OR (invited_by IS NOT NULL)
  )
);

-- Tribe games table - Link games to tribes (optional)
CREATE TABLE IF NOT EXISTS public.tribe_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tribe_id, game_id)
);

-- Tribe channels table - Chat channels within tribes
CREATE TABLE IF NOT EXISTS public.tribe_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('general', 'announcements', 'games', 'custom')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tribe_channels_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50)
);

-- Tribe chat messages table - Messages in tribe channels
CREATE TABLE IF NOT EXISTS public.tribe_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.tribe_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tribe_chat_messages_length CHECK (char_length(message) >= 1 AND char_length(message) <= 2000)
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================

-- Tribes indexes
CREATE INDEX IF NOT EXISTS idx_tribes_creator_id ON public.tribes(creator_id);
CREATE INDEX IF NOT EXISTS idx_tribes_activity ON public.tribes(activity);
CREATE INDEX IF NOT EXISTS idx_tribes_is_public ON public.tribes(is_public);
CREATE INDEX IF NOT EXISTS idx_tribes_created_at ON public.tribes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tribes_location ON public.tribes USING GIST (
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Tribe members indexes
CREATE INDEX IF NOT EXISTS idx_tribe_members_tribe_id ON public.tribe_members(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_user_id ON public.tribe_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_status ON public.tribe_members(status);
CREATE INDEX IF NOT EXISTS idx_tribe_members_role ON public.tribe_members(role);
CREATE INDEX IF NOT EXISTS idx_tribe_members_tribe_user ON public.tribe_members(tribe_id, user_id);

-- Tribe games indexes
CREATE INDEX IF NOT EXISTS idx_tribe_games_tribe_id ON public.tribe_games(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_games_game_id ON public.tribe_games(game_id);

-- Tribe channels indexes
CREATE INDEX IF NOT EXISTS idx_tribe_channels_tribe_id ON public.tribe_channels(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_channels_type ON public.tribe_channels(type);

-- Tribe chat messages indexes
CREATE INDEX IF NOT EXISTS idx_tribe_chat_messages_channel_id ON public.tribe_chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_tribe_chat_messages_user_id ON public.tribe_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_tribe_chat_messages_created_at ON public.tribe_chat_messages(created_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_chat_messages ENABLE ROW LEVEL SECURITY;

-- Tribes RLS Policies
CREATE POLICY "Anyone can view public tribes" ON public.tribes
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Members can view their tribes" ON public.tribes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribes.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create tribes" ON public.tribes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins and moderators can update tribes" ON public.tribes
  FOR UPDATE USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribes.id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

CREATE POLICY "Only creators can delete tribes" ON public.tribes
  FOR DELETE USING (creator_id = auth.uid());

-- Tribe members RLS Policies
CREATE POLICY "Anyone can view active tribe members" ON public.tribe_members
  FOR SELECT USING (status = 'active');

CREATE POLICY "Members can view all members of their tribes" ON public.tribe_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members tm
      WHERE tm.tribe_id = tribe_members.tribe_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Allow tribe creators to insert themselves (for trigger)
CREATE POLICY "Tribe creators can insert themselves" ON public.tribe_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tribes
      WHERE id = tribe_id
      AND creator_id = auth.uid()
    )
  );

-- Allow users to join public tribes
CREATE POLICY "Users can join public tribes" ON public.tribe_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tribes
      WHERE id = tribe_id
      AND is_public = true
      AND creator_id != auth.uid() -- Don't allow creator to use this policy (use the one above)
    )
  );

CREATE POLICY "Users can leave tribes" ON public.tribe_members
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update members (but not insert - that's handled by other policies)
CREATE POLICY "Admins can update members" ON public.tribe_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members tm
      WHERE tm.tribe_id = tribe_members.tribe_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'moderator')
      AND tm.status = 'active'
    )
  );

-- Admins can delete members
CREATE POLICY "Admins can delete members" ON public.tribe_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members tm
      WHERE tm.tribe_id = tribe_members.tribe_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'moderator')
      AND tm.status = 'active'
    )
  );

-- Tribe games RLS Policies
CREATE POLICY "Anyone can view tribe games" ON public.tribe_games
  FOR SELECT USING (true);

CREATE POLICY "Tribe admins can link games" ON public.tribe_games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_games.tribe_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

CREATE POLICY "Tribe admins can unlink games" ON public.tribe_games
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_games.tribe_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

-- Tribe channels RLS Policies
CREATE POLICY "Tribe members can view channels" ON public.tribe_channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_channels.tribe_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Tribe admins can create channels" ON public.tribe_channels
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_channels.tribe_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

CREATE POLICY "Tribe admins can update channels" ON public.tribe_channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_channels.tribe_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

CREATE POLICY "Tribe admins can delete channels" ON public.tribe_channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_channels.tribe_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

-- Tribe chat messages RLS Policies
CREATE POLICY "Tribe members can view messages" ON public.tribe_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tribe_channels tc
      JOIN public.tribe_members tm ON tm.tribe_id = tc.tribe_id
      WHERE tc.id = tribe_chat_messages.channel_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Tribe members can send messages" ON public.tribe_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tribe_channels tc
      JOIN public.tribe_members tm ON tm.tribe_id = tc.tribe_id
      WHERE tc.id = tribe_chat_messages.channel_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- ============================================
-- 4. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update tribe member count
CREATE OR REPLACE FUNCTION public.update_tribe_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.tribes
    SET member_count = member_count + 1
    WHERE id = NEW.tribe_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE public.tribes
      SET member_count = GREATEST(0, member_count - 1)
      WHERE id = NEW.tribe_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE public.tribes
      SET member_count = member_count + 1
      WHERE id = NEW.tribe_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.tribes
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.tribe_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for member count updates
CREATE TRIGGER tribe_members_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tribe_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tribe_member_count();

-- Function to update tribe game count
CREATE OR REPLACE FUNCTION public.update_tribe_game_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tribes
    SET game_count = game_count + 1
    WHERE id = NEW.tribe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tribes
    SET game_count = GREATEST(0, game_count - 1)
    WHERE id = OLD.tribe_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for game count updates
CREATE TRIGGER tribe_games_count_trigger
  AFTER INSERT OR DELETE ON public.tribe_games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tribe_game_count();

-- Function to automatically add creator as admin
CREATE OR REPLACE FUNCTION public.add_tribe_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tribe_members (tribe_id, user_id, role, status)
  VALUES (NEW.id, NEW.creator_id, 'admin', 'active')
  ON CONFLICT (tribe_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as admin
CREATE TRIGGER tribe_creator_admin_trigger
  AFTER INSERT ON public.tribes
  FOR EACH ROW
  EXECUTE FUNCTION public.add_tribe_creator_as_admin();

-- Function to create default channels for new tribe
CREATE OR REPLACE FUNCTION public.create_default_tribe_channels()
RETURNS TRIGGER AS $$
BEGIN
  -- Create General channel
  INSERT INTO public.tribe_channels (tribe_id, name, description, type, created_by)
  VALUES (NEW.id, 'General', 'General discussion', 'general', NEW.creator_id);
  
  -- Create Announcements channel
  INSERT INTO public.tribe_channels (tribe_id, name, description, type, created_by)
  VALUES (NEW.id, 'Announcements', 'Important announcements', 'announcements', NEW.creator_id);
  
  -- Create Games channel
  INSERT INTO public.tribe_channels (tribe_id, name, description, type, created_by)
  VALUES (NEW.id, 'Games', 'Game planning and coordination', 'games', NEW.creator_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default channels
CREATE TRIGGER tribe_default_channels_trigger
  AFTER INSERT ON public.tribes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_tribe_channels();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER tribes_updated_at_trigger
  BEFORE UPDATE ON public.tribes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tribe_members_updated_at_trigger
  BEFORE UPDATE ON public.tribe_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tribe_channels_updated_at_trigger
  BEFORE UPDATE ON public.tribe_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. VIEWS FOR EASY QUERYING
-- ============================================

-- View for tribe member details with user profile data
CREATE OR REPLACE VIEW public.tribe_member_details AS
SELECT 
  tm.id,
  tm.tribe_id,
  tm.user_id,
  tm.role,
  tm.status,
  tm.joined_at,
  tm.invited_by,
  u.display_name,
  u.username,
  u.avatar_url,
  u.email
FROM public.tribe_members tm
JOIN public.user_profiles u ON u.id = tm.user_id
WHERE tm.status = 'active';

-- View for tribe statistics
CREATE OR REPLACE VIEW public.tribe_statistics AS
SELECT 
  t.id AS tribe_id,
  t.name,
  t.activity,
  t.member_count,
  t.game_count,
  COUNT(DISTINCT tg.game_id) AS actual_game_count,
  COUNT(DISTINCT CASE WHEN tm.status = 'active' THEN tm.user_id END) AS active_member_count,
  MAX(g.created_at) AS last_game_date,
  MIN(g.date) AS next_game_date
FROM public.tribes t
LEFT JOIN public.tribe_members tm ON tm.tribe_id = t.id
LEFT JOIN public.tribe_games tg ON tg.tribe_id = t.id
LEFT JOIN public.games g ON g.id = tg.game_id AND g.date >= CURRENT_DATE
GROUP BY t.id, t.name, t.activity, t.member_count, t.game_count;

-- View for tribe chat messages with author info
CREATE OR REPLACE VIEW public.tribe_chat_messages_with_author AS
SELECT 
  tcm.id,
  tcm.channel_id,
  tcm.user_id,
  tcm.message,
  tcm.created_at,
  up.display_name,
  up.username,
  up.avatar_url,
  tc.tribe_id,
  tc.name AS channel_name
FROM public.tribe_chat_messages tcm
JOIN public.tribe_channels tc ON tc.id = tcm.channel_id
JOIN public.user_profiles up ON up.id = tcm.user_id
ORDER BY tcm.created_at ASC;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.tribe_games TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_channels TO authenticated;
GRANT SELECT, INSERT ON public.tribe_chat_messages TO authenticated;

-- Grant access to views
GRANT SELECT ON public.tribe_member_details TO authenticated;
GRANT SELECT ON public.tribe_statistics TO authenticated;
GRANT SELECT ON public.tribe_chat_messages_with_author TO authenticated;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.tribes IS 'Persistent groups (tribes) for organizing activities';
COMMENT ON TABLE public.tribe_members IS 'Member relationships with roles (member, moderator, admin)';
COMMENT ON TABLE public.tribe_games IS 'Optional linking of games to tribes';
COMMENT ON TABLE public.tribe_channels IS 'Chat channels within tribes';
COMMENT ON TABLE public.tribe_chat_messages IS 'Messages in tribe channels';

COMMENT ON VIEW public.tribe_member_details IS 'Tribe members with user profile information';
COMMENT ON VIEW public.tribe_statistics IS 'Aggregate statistics for tribes';
COMMENT ON VIEW public.tribe_chat_messages_with_author IS 'Chat messages with author profile data';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration creates the complete tribes system.
-- After running, you can:
-- 1. Create tribes via the API
-- 2. Join/leave tribes
-- 3. Manage members with roles
-- 4. Link games to tribes
-- 5. Use tribe chat channels
-- 6. Query tribe statistics

