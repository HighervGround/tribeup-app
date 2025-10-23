# Onboarding Flow Implementation

## Overview

This document describes the implementation of a proper onboarding flow for both email/password and Google OAuth authentication in the TribeUp Social Sports App.

## Problem Statement

The previous implementation had several issues:
1. No onboarding detection logic - users weren't being sent to onboarding when needed
2. Profile creation issues - OAuth users weren't getting proper profiles created
3. Inconsistent profile handling between authentication methods
4. No way to track onboarding completion

## Solution Architecture

### 1. Onboarding Detection Hook (`useOnboardingCheck.ts`)

**Purpose**: Determines if a user needs onboarding based on their profile completeness.

**Logic**: A user needs onboarding if:
- They don't have a complete profile in the database
- They haven't selected any sports preferences
- They haven't completed the onboarding flow (tracked by `onboarding_completed` field)

**Key Features**:
- Caches results to prevent unnecessary API calls
- Handles loading states properly
- Provides error handling

### 2. Enhanced ProtectedRoute

**Purpose**: Automatically redirects users to onboarding when needed.

**Key Features**:
- Integrates with `useOnboardingCheck` hook
- Prevents redirect loops by checking current pathname
- Supports `skipOnboardingCheck` prop for routes that should bypass onboarding
- Maintains existing authentication logic

### 3. Database Schema Updates

**New Field**: `onboarding_completed` (BOOLEAN)
- Tracks whether a user has completed the onboarding process
- Defaults to `FALSE` for new users
- Set to `TRUE` when onboarding is completed

**Migration**: `20250120000007_add_onboarding_completed_field.sql`
- Adds the new field to the users table
- Creates index for performance
- Updates existing users who have sports preferences to `onboarding_completed = TRUE`

### 4. Enhanced Profile Creation

**SimpleAuthProvider Updates**:
- Better handling of OAuth user metadata (supports both `full_name` and `name`)
- Improved username generation from OAuth data
- Consistent profile creation for both auth methods

**AuthCallback Updates**:
- Simplified OAuth callback handling
- Lets ProtectedRoute handle onboarding detection consistently
- Removes hardcoded onboarding redirects

### 5. Onboarding Completion Tracking

**Onboarding Component Updates**:
- Sets `onboarding_completed = true` when onboarding is finished
- Updates both new and existing profiles
- Ensures proper profile persistence

## Implementation Details

### File Changes

1. **New Files**:
   - `src/hooks/useOnboardingCheck.ts` - Onboarding detection logic
   - `supabase/migrations/20250120000007_add_onboarding_completed_field.sql` - Database migration
   - `test-onboarding-flow.js` - Test script for verification

2. **Modified Files**:
   - `src/components/ProtectedRoute.tsx` - Added onboarding detection
   - `src/components/AppRouter.tsx` - Added `skipOnboardingCheck` for onboarding route
   - `src/providers/SimpleAuthProvider.tsx` - Enhanced OAuth profile creation
   - `src/components/AuthCallback.tsx` - Simplified OAuth callback handling
   - `src/components/Onboarding.tsx` - Added onboarding completion tracking
   - `src/lib/database.types.ts` - Added `onboarding_completed` field

### Database Schema

```sql
-- Users table now includes:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
```

### Flow Diagram

```
User Authentication
        ↓
   Auth Success
        ↓
ProtectedRoute Check
        ↓
   Needs Onboarding?
        ↓
    Yes → Redirect to /onboarding
        ↓
   Complete Onboarding
        ↓
   Set onboarding_completed = true
        ↓
   Redirect to Home
```

## Testing

### Manual Testing Steps

1. **Email/Password Flow**:
   - Sign up with new email/password
   - Should be redirected to onboarding
   - Complete onboarding steps
   - Should be redirected to home
   - Sign out and sign in again
   - Should NOT be redirected to onboarding

2. **Google OAuth Flow**:
   - Sign in with Google (new user)
   - Should be redirected to onboarding
   - Complete onboarding steps
   - Should be redirected to home
   - Sign out and sign in again
   - Should NOT be redirected to onboarding

### Automated Testing

Run the test script:
```bash
node test-onboarding-flow.js
```

This will verify:
- Database schema is correct
- Profile creation works
- Onboarding completion tracking works
- Onboarding detection logic works

## Configuration

### Environment Variables

No new environment variables are required. The implementation uses existing Supabase configuration.

### Supabase Configuration

Ensure the following are configured in your Supabase project:
- OAuth providers (Google, Apple) are enabled
- Redirect URLs are properly configured
- RLS policies allow profile creation and updates

## Troubleshooting

### Common Issues

1. **Users stuck in onboarding loop**:
   - Check if `onboarding_completed` field exists in database
   - Verify migration was run successfully
   - Check browser console for errors

2. **OAuth users not getting profiles**:
   - Verify OAuth provider configuration
   - Check if `ensure_user_profile` RPC function exists
   - Check browser console for profile creation errors

3. **Onboarding not triggering**:
   - Check if `useOnboardingCheck` hook is working
   - Verify ProtectedRoute is properly integrated
   - Check if user has valid session

### Debug Mode

Enable debug logging by setting localStorage:
```javascript
localStorage.setItem('DEBUG_AUTH', '1');
```

## Future Enhancements

1. **Progressive Onboarding**: Allow users to skip certain steps
2. **Onboarding Analytics**: Track completion rates and drop-off points
3. **Personalized Onboarding**: Customize flow based on user preferences
4. **Onboarding Reminders**: Send notifications to users who haven't completed onboarding

## Security Considerations

1. **RLS Policies**: Ensure proper Row Level Security policies are in place
2. **Data Validation**: Validate all user input during onboarding
3. **Profile Privacy**: Respect user privacy settings during onboarding
4. **OAuth Scopes**: Only request necessary OAuth permissions

## Performance Considerations

1. **Caching**: Onboarding status is cached to prevent repeated API calls
2. **Lazy Loading**: Onboarding components are lazy-loaded
3. **Database Indexes**: Proper indexes for onboarding status queries
4. **Async Operations**: Profile creation is non-blocking

---

*This implementation ensures a smooth onboarding experience for all users while maintaining security and performance standards.*
