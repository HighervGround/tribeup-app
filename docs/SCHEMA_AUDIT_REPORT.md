# TribeUp Schema Audit Report

## 🔍 Executive Summary

**Status**: ⚠️ CRITICAL ISSUES FOUND  
**Total Migrations**: 57 migration files  
**Issues Identified**: 5 major permission/policy problems  
**Action Required**: Apply 2 migrations immediately

---

## 🚨 Critical Issues Found

### Issue 1: JOIN GAMES NOT WORKING ❌
**Problem**: Users cannot join games  
**Root Cause**: Missing INSERT permissions on `game_participants` table  
**Impact**: Core functionality broken  
**Status**: Code fixed, migration ready

### Issue 2: TRIBE CHAT NOT WORKING ❌  
**Problem**: Users cannot post messages to tribe channels  
**Root Cause**: Missing INSERT permissions on `tribe_chat_messages` table  
**Impact**: Social feature completely broken  
**Status**: Migration ready

### Issue 3: LIKE COUNTS NOT SHOWING ❌
**Problem**: Activity like counts are 0 or not displaying  
**Root Cause**: Restrictive RLS policy blocks `anon` users from viewing likes  
**Impact**: Social engagement metrics invisible  
**Status**: Migration ready

### Issue 4: CONFLICTING RLS POLICIES ⚠️
**Problem**: Multiple overlapping policies causing confusion  
**Tables Affected**: `games`, `game_participants`, `activity_likes`, `chat_messages`  
**Impact**: Unpredictable permission behavior  
**Status**: Migration ready to consolidate

### Issue 5: TABLE REFERENCE ERRORS ❌
**Problem**: Views/triggers reference non-existent `rsvps` table  
**Root Cause**: Legacy migration created wrong table name  
**Impact**: View queries fail with permission errors  
**Status**: Migration ready to clean up

---

## 📊 Schema Overview

### Core Tables (11 total)

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|-------------|--------|--------|--------|--------|--------|
| `games` | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | Needs INSERT grant |
| `game_participants` | ✅ | ✅ | ❌ | ❌ | ❌ | **CRITICAL: No INSERT** |
| `chat_messages` | ✅ | ✅ | ⚠️ | ❌ | ❌ | Needs INSERT grant |
| `activity_likes` | ✅ | ⚠️ | ❌ | ❌ | ❌ | **CRITICAL: No INSERT** |
| `users` | ✅ | ✅ | ✅ | ✅ | ❌ | OK |
| `tribes` | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | Needs full CRUD |
| `tribe_members` | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | Needs full CRUD |
| `tribe_channels` | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | Needs full CRUD |
| `tribe_chat_messages` | ✅ | ✅ | ❌ | ❌ | ❌ | **CRITICAL: No INSERT** |
| `tribe_games` | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | Needs INSERT/DELETE |
| `public_rsvps` | ✅ | ✅ | ✅ | ❌ | ❌ | OK |

**Legend**:
- ✅ = Properly configured
- ⚠️ = Partially configured (works but incomplete)
- ❌ = **BROKEN - Not working**

### Views (6 total)

| View | SELECT Granted | Used By | Status |
|------|----------------|---------|--------|
| `games_with_counts` | ⚠️ | Home, Search | Partial (anon missing) |
| `activity_like_counts` | ⚠️ | All activities | Partial (anon missing) |
| `tribe_member_details` | ✅ | Tribe pages | OK |
| `tribe_statistics` | ✅ | Tribe pages | OK |
| `tribe_chat_messages_with_author` | ⚠️ | Tribe chat | Partial (anon missing) |
| `chat_messages_with_author` | ✅ | Game chat | OK |

### RLS Policies (Count: ~30+)

**Conflicting Policies Found**:
- `games`: 4 different SELECT policies (should be 1)
- `game_participants`: 3 different SELECT policies (should be 1)
- `activity_likes`: 2 different SELECT policies (should be 1)

---

## 🔧 What Needs To Be Fixed

### MUST FIX IMMEDIATELY (Blocking Core Features):

1. **Grant INSERT on `game_participants`** → Fix joining games
2. **Grant INSERT on `tribe_chat_messages`** → Fix tribe chat
3. **Grant INSERT/DELETE on `activity_likes`** → Fix like functionality
4. **Consolidate RLS policies** → Remove conflicts
5. **Fix table grants for anon role** → Enable public viewing

### RECOMMENDED FIXES:

6. Grant full CRUD on tribe tables for authenticated users
7. Ensure all views have proper anon grants
8. Clean up legacy/unused policies
9. Remove references to non-existent `rsvps` table
10. Grant sequence USAGE to authenticated role

---

## 📋 Migration Plan

### Step 1: Apply Core Fixes (URGENT)
**File**: `20250204000000_fix_games_with_counts_security.sql`  
**Purpose**: Fixes permissions for games, likes, tribe chat  
**Impact**: Enables joining games, posting to tribes, viewing likes  
**Time**: ~30 seconds  
**Risk**: Low (only adds permissions, doesn't remove)

### Step 2: Apply Comprehensive Audit (RECOMMENDED)
**File**: `20250205000000_comprehensive_schema_audit_and_fix.sql`  
**Purpose**: Complete schema validation and standardization  
**Impact**: Ensures all tables, views, policies are correctly configured  
**Time**: ~1 minute  
**Risk**: Low (consolidates policies, adds missing permissions)

---

## 🚀 How To Apply Migrations

### Option 1: Apply Both Migrations (RECOMMENDED)

```bash
cd "/Users/cole.guyton/Downloads/React TribeUp Social Sports App"
npx supabase db push
```

This will apply both migrations in order:
1. `20250204000000` - Critical fixes
2. `20250205000000` - Comprehensive audit

### Option 2: Apply Via Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and run **FIRST**: `20250204000000_fix_games_with_counts_security.sql`
5. Wait for success
6. Copy and run **SECOND**: `20250205000000_comprehensive_schema_audit_and_fix.sql`
7. Wait for success

### Option 3: Apply Only Critical Fixes (Quick)

If you only want to fix the immediate issues:
1. Run only `20250204000000_fix_games_with_counts_security.sql`
2. Test joining games and tribe chat
3. Run `20250205000000` later for complete audit

---

## ✅ Verification Checklist

After applying migrations, verify these work:

- [ ] **Home page loads** without console errors
- [ ] **Join button works** on any activity
- [ ] **Leave button works** on joined activities
- [ ] **Like counts display** on activity cards
- [ ] **Like button toggles** likes on/off
- [ ] **Tribe chat loads** messages
- [ ] **Tribe chat accepts** new messages
- [ ] **Participant counts** show correctly
- [ ] **No 403 errors** in browser console
- [ ] **No permission denied** errors in console

---

## 📊 Expected Results

### Before Migrations:
```
❌ Joining games: FAILS (permission denied)
❌ Tribe chat: FAILS (permission denied)
❌ Like counts: MISSING (0 displayed)
⚠️  View games: WORKS (but console errors)
⚠️  View tribes: WORKS (but can't post)
```

### After Migrations:
```
✅ Joining games: WORKS
✅ Tribe chat: WORKS  
✅ Like counts: DISPLAYS CORRECTLY
✅ View games: WORKS (no errors)
✅ View tribes: WORKS (can post)
✅ All features: FULLY FUNCTIONAL
```

---

## 🔍 Technical Details

### Permission Grants Added

**Tables with INSERT grants**:
- `game_participants` (for joining)
- `tribe_chat_messages` (for posting)
- `activity_likes` (for liking)
- `chat_messages` (for messaging)

**Tables with DELETE grants**:
- `game_participants` (for leaving)
- `activity_likes` (for unliking)

**Views with anon SELECT grants**:
- `games_with_counts`
- `activity_like_counts`
- `tribe_chat_messages_with_author`

### RLS Policies Standardized

**Pattern used**: `{role}_can_{action}_{subject}`

Examples:
- `public_can_view_active_games`
- `authenticated_can_join_games`
- `authenticated_can_send_messages`

### Cleanup Performed

**Removed**:
- `game_public_rsvps` view (referenced wrong table)
- `set_rsvp_user_id_tg` trigger (on non-existent table)
- `set_rsvp_user_id()` function (unused)
- Duplicate/conflicting RLS policies

---

## 🆘 Troubleshooting

### If migrations fail:

1. **Check for syntax errors** in migration output
2. **Look for foreign key issues** (rare)
3. **Verify Supabase connection** is active
4. **Try running migrations one at a time**

### If features still don't work:

1. **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear browser cache** completely
3. **Check browser console** for specific errors
4. **Verify user is authenticated** (logged in)
5. **Check Supabase logs** in dashboard

### Common errors and fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| "permission denied for table X" | Missing grants | Run migration |
| "duplicate key value violates..." | Already joined | Check `isJoined` status |
| "RLS policy violation" | Wrong user context | Verify auth state |
| "relation X does not exist" | Missing table | Check migration order |

---

## 📚 Related Files

- **Migrations**:
  - `supabase/migrations/20250204000000_fix_games_with_counts_security.sql`
  - `supabase/migrations/20250205000000_comprehensive_schema_audit_and_fix.sql`

- **Documentation**:
  - `APPLY_FIX.md` - Quick fix guide
  - `JOINING_FIX_SUMMARY.md` - Detailed fix summary
  - `SCHEMA_AUDIT_REPORT.md` - This file

- **Code Files**:
  - `src/domains/games/services/gameParticipantService.ts` - Fixed
  - `src/domains/games/components/GameDetails.tsx` - Fixed
  - `src/core/database/database.types.ts` - Schema types

---

## 🎯 Priority Actions

### DO THIS NOW:
1. ✅ **Apply migrations** (both files)
2. ✅ **Hard refresh browser** 
3. ✅ **Test joining a game**
4. ✅ **Test tribe chat**
5. ✅ **Verify like counts display**

### DO THIS AFTER:
- Review all policies are working as expected
- Check performance metrics
- Monitor for any new errors
- Consider adding indexes if queries slow

---

## 📞 Support

If issues persist after applying both migrations:
1. Check browser console for specific error codes
2. Check Supabase logs for database errors
3. Verify migration ran successfully (no errors in output)
4. Hard refresh and test in incognito mode

---

**Report Generated**: 2025-02-05  
**Schema Version**: Current (57 migrations)  
**Status**: ⚠️ REQUIRES IMMEDIATE ACTION


