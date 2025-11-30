-- User Data Exports Audit Table
-- Track GDPR data export requests for compliance and rate limiting
-- Issue #40

-- ============================================================================
-- CREATE USER DATA EXPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_data_exports_user ON public.user_data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_requested_at ON public.user_data_exports(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON public.user_data_exports(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.user_data_exports ENABLE ROW LEVEL SECURITY;

-- Users can only view their own export history
CREATE POLICY user_data_exports_select_own ON public.user_data_exports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own export requests
CREATE POLICY user_data_exports_insert_own ON public.user_data_exports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_data_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_data_exports_updated_at
  BEFORE UPDATE ON public.user_data_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_data_exports_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_data_exports IS 'Audit log for GDPR data export requests';
COMMENT ON COLUMN public.user_data_exports.export_type IS 'Type of export: full, partial, specific';
COMMENT ON COLUMN public.user_data_exports.status IS 'Export status: pending, processing, completed, failed';
COMMENT ON COLUMN public.user_data_exports.file_size_bytes IS 'Size of exported data in bytes';
