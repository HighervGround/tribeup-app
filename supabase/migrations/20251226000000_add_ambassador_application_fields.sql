-- Add missing fields to campus_ambassadors table that are expected by the UI

ALTER TABLE campus_ambassadors 
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS motivation TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB;

-- Add comment
COMMENT ON TABLE campus_ambassadors IS 'Campus ambassador applications and profiles with all application form fields';
