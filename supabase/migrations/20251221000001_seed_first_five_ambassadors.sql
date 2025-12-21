-- Seed first 5 ambassadors (mock data)
-- Approves the earliest 5 users and ensures referral codes.
-- Use in non-production or adjust selection criteria for production.

DO $$
DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM users ORDER BY created_at ASC LIMIT 5 LOOP
    INSERT INTO campus_ambassadors (user_id, campus_name, university, application_status, profile_verified, badge_level)
    VALUES (r.id, 'UF Campus', 'University of Florida', 'approved', TRUE, 'official')
    ON CONFLICT (user_id) DO UPDATE SET application_status = 'approved', profile_verified = TRUE;

    UPDATE users SET role = 'ambassador', is_ambassador = TRUE, ambassador_verified = TRUE, ambassador_badge = 'Official Ambassador'
    WHERE id = r.id;

    PERFORM ensure_ambassador_referral_code(r.id);
  END LOOP;
END $$;
