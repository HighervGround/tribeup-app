-- Campus Ambassador Program Schema
-- Adds ambassador role, application table, referral tracking, and helper functions

-- 1) Extend user_role enum to include 'ambassador'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'ambassador'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'ambassador';
  END IF;
END $$;

-- 2) Add ambassador fields to users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ambassador_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ambassador_badge TEXT;

-- 3) Application status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ambassador_application_status') THEN
    CREATE TYPE ambassador_application_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 4) Campus ambassadors table
CREATE TABLE IF NOT EXISTS campus_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_name TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT 'University of Florida',
  application_status ambassador_application_status NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  profile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  badge_level TEXT NOT NULL DEFAULT 'official',
  referral_code TEXT UNIQUE,
  referral_goal INTEGER NOT NULL DEFAULT 20,
  referral_count INTEGER NOT NULL DEFAULT 0,
  events_hosted INTEGER NOT NULL DEFAULT 0,
  meetups_attended INTEGER NOT NULL DEFAULT 0,
  application_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_campus_ambassadors_user_id ON campus_ambassadors(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_ambassadors_status ON campus_ambassadors(application_status);
CREATE INDEX IF NOT EXISTS idx_campus_ambassadors_referral_code ON campus_ambassadors(referral_code);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campus_ambassadors_set_updated_at ON campus_ambassadors;
CREATE TRIGGER campus_ambassadors_set_updated_at
BEFORE UPDATE ON campus_ambassadors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) Referral tracking table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ambassador_referral_status') THEN
    CREATE TYPE ambassador_referral_status AS ENUM ('clicked', 'signed_up', 'verified');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ambassador_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referred_email TEXT,
  status ambassador_referral_status NOT NULL DEFAULT 'clicked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  UNIQUE(referral_code, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ambassador_referrals_code ON ambassador_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_ambassador_referrals_referrer ON ambassador_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_referrals_status ON ambassador_referrals(status);

-- 6) Helper function: approve application
CREATE OR REPLACE FUNCTION approve_ambassador_application(p_application_id UUID, p_reviewer UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM campus_ambassadors WHERE id = p_application_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  UPDATE campus_ambassadors 
  SET application_status = 'approved', approved_at = NOW(), reviewed_by = p_reviewer, profile_verified = TRUE
  WHERE id = p_application_id;

  -- Elevate user role and flags
  UPDATE users 
  SET role = 'ambassador', is_ambassador = TRUE, ambassador_verified = TRUE, ambassador_badge = COALESCE(ambassador_badge, 'Official Ambassador')
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Helper function: ensure referral code
CREATE OR REPLACE FUNCTION ensure_ambassador_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code FROM campus_ambassadors WHERE user_id = p_user_id;
  IF v_code IS NULL THEN
    v_code := 'UF-' || SUBSTRING(p_user_id::TEXT, 1, 8);
    UPDATE campus_ambassadors SET referral_code = v_code WHERE user_id = p_user_id;
  END IF;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 8) Helper function: record referral event
CREATE OR REPLACE FUNCTION record_ambassador_referral(p_referral_code TEXT, p_status ambassador_referral_status, p_referred_user_id UUID DEFAULT NULL, p_referred_email TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_referrer UUID;
  v_id UUID;
BEGIN
  SELECT user_id INTO v_referrer FROM campus_ambassadors WHERE referral_code = p_referral_code;
  IF v_referrer IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;

  INSERT INTO ambassador_referrals (referrer_user_id, referral_code, referred_user_id, referred_email, status, converted_at)
  VALUES (v_referrer, p_referral_code, p_referred_user_id, p_referred_email, p_status, CASE WHEN p_status IN ('signed_up','verified') THEN NOW() ELSE NULL END)
  RETURNING id INTO v_id;

  -- Update summary count for convenience
  UPDATE campus_ambassadors
  SET referral_count = (
    SELECT COUNT(*) FROM ambassador_referrals ar 
    WHERE ar.referral_code = p_referral_code AND ar.status IN ('signed_up','verified')
  )
  WHERE referral_code = p_referral_code;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Views for dashboard summary
CREATE OR REPLACE VIEW ambassador_referral_stats AS
SELECT 
  ca.user_id,
  ca.referral_code,
  COUNT(*) FILTER (WHERE ar.status = 'clicked') AS clicks,
  COUNT(*) FILTER (WHERE ar.status = 'signed_up') AS signups,
  COUNT(*) FILTER (WHERE ar.status = 'verified') AS conversions
FROM campus_ambassadors ca
LEFT JOIN ambassador_referrals ar ON ar.referral_code = ca.referral_code
GROUP BY ca.user_id, ca.referral_code;

-- 10) RLS policies
ALTER TABLE campus_ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_referrals ENABLE ROW LEVEL SECURITY;

-- Applicants can insert their own application
CREATE POLICY "Applicants can insert own application" ON campus_ambassadors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Applicants can view their own application
CREATE POLICY "Applicants can view own application" ON campus_ambassadors
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON campus_ambassadors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications" ON campus_ambassadors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Ambassadors can view their own referrals
CREATE POLICY "Ambassadors can view own referrals" ON ambassador_referrals
  FOR SELECT USING (referrer_user_id = auth.uid());

-- System can insert referral events
CREATE POLICY "System can insert referral events" ON ambassador_referrals
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE campus_ambassadors IS 'Campus ambassador applications, profiles, and summary stats';
COMMENT ON TABLE ambassador_referrals IS 'Referral tracking events associated with ambassador codes';
COMMENT ON VIEW ambassador_referral_stats IS 'Aggregated referral stats per ambassador';
COMMENT ON FUNCTION approve_ambassador_application IS 'Approve application and elevate user role/flags';
COMMENT ON FUNCTION ensure_ambassador_referral_code IS 'Ensure a unique referral code for an ambassador';
COMMENT ON FUNCTION record_ambassador_referral IS 'Record referral event and update counts';
