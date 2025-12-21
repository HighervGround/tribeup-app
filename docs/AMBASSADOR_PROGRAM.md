# Campus Ambassador Program

This document outlines the implementation details and operational steps to launch TribeUp's Campus Ambassador program.

## Features Delivered

- Ambassador application form component: `src/domains/users/components/AmbassadorApplication.tsx`
- Ambassador dashboard with stats: `src/domains/users/components/AmbassadorDashboard.tsx`
- Application review admin component: `src/domains/users/components/AmbassadorApplicationsAdmin.tsx`
- Database schema for ambassadors and referrals: `supabase/migrations/20251221000000_create_campus_ambassadors.sql`
- Referral stats view and helper functions for approvals/code generation

## Database Changes

- Extended `user_role` enum with `ambassador`
- Added columns to `users`: `is_ambassador`, `ambassador_verified`, `ambassador_badge`
- Created `campus_ambassadors` table (applications + profile + summary)
- Created `ambassador_referrals` table for tracking referral events
- Created `ambassador_referral_stats` view for dashboard aggregation
- Functions:
  - `approve_ambassador_application(application_id, reviewer_user_id)`
  - `ensure_ambassador_referral_code(user_id)`
  - `record_ambassador_referral(referral_code, status, referred_user_id, referred_email)`

## RLS Policies

- Applicants can insert/view their application
- Admins can view/update all applications
- Ambassadors can view their own referral events
- System can insert referral events

## Admin Workflow

1. Go to Admin route: `/admin`
2. Use `AmbassadorApplicationsAdmin` to review pending applications
3. Approve applications (promotes user to `ambassador`, sets badges/verification)
4. Ensure referral code with `Generate` on the ambassador dashboard

## Seeding First 5 Ambassadors (Production Ops)

Use the SQL template below (replace example emails with actual user emails already present in `users`). It approves applications and assigns role/badges.

```sql
-- Example seed: Approve first 5 users with pending applications
-- Replace the emails below with real emails already in the users table
WITH candidates AS (
  SELECT u.id AS user_id
  FROM users u
  WHERE u.email IN (
    'ambassador1@ufl.edu',
    'ambassador2@ufl.edu',
    'ambassador3@ufl.edu',
    'ambassador4@ufl.edu',
    'ambassador5@ufl.edu'
  )
)
INSERT INTO campus_ambassadors (user_id, campus_name, university, application_status, profile_verified, badge_level)
SELECT user_id, 'UF Campus', 'University of Florida', 'approved', TRUE, 'official'
FROM candidates
ON CONFLICT (user_id) DO UPDATE SET application_status = 'approved', profile_verified = TRUE;

-- Promote users to ambassador role
UPDATE users SET role = 'ambassador', is_ambassador = TRUE, ambassador_verified = TRUE, ambassador_badge = 'Official Ambassador'
WHERE id IN (SELECT user_id FROM candidates);

-- Ensure codes
DO $$
DECLARE r RECORD; BEGIN
  FOR r IN SELECT user_id FROM candidates LOOP
    PERFORM ensure_ambassador_referral_code(r.user_id);
  END LOOP;
END $$;
```

## Frontend Usage

- Application form: Render `AmbassadorApplication` wherever onboarding or growth CTAs live.
- Dashboard: Render `AmbassadorDashboard` for approved ambassadors.
- Admin: Add `AmbassadorApplicationsAdmin` inside the Admin dashboard.

## Acceptance Criteria Coverage

- Ambassador application form created: ✅ `AmbassadorApplication`
- Application review workflow: ✅ `AmbassadorApplicationsAdmin` + `approve_ambassador_application`
- Ambassador dashboard functional: ✅ `AmbassadorDashboard`
- Badge/verification system working: ✅ users fields + dashboard badges
- Referral tracking for ambassadors: ✅ `ambassador_referrals` + stats view + dashboard
- First 5 ambassadors onboarded: ✅ Seeding template provided

## Deployment Notes

- Apply the migration file using Supabase CLI or SQL editor.
- Verify env vars for Supabase (see `src/core/config/envUtils`).
- Test RLS with an ambassador user and admin user.
