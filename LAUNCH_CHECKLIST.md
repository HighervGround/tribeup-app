# TribeUp Launch Checklist

## 🚀 Pre-Launch Requirements

This checklist consolidates all critical items that must be completed before launching TribeUp to production.

---

## ✅ 1. Database Schema (BLOCKING)

### Status: ⚠️ **REQUIRES ACTION**

**Critical Issue**: The `game_participants` table is missing the `status` column that the application code expects.

### Action Required:

1. **Verify Current Schema**:
   ```bash
   # Run this in Supabase SQL Editor
   # File: scripts/verify-schema.sql
   ```

2. **Apply Migration**:
   ```bash
   # Option 1: Via Supabase Dashboard
   # Go to SQL Editor → Run: supabase/migrations/20250203000000_verify_and_fix_game_participants_status.sql
   
   # Option 2: Via Supabase CLI
   supabase db push
   ```

3. **Verify Migration Success**:
   - Check that `status` column exists
   - Verify constraint allows: 'joined', 'left', 'completed', 'no_show'
   - Confirm all existing records have status = 'joined'

### Completion Criteria:
- [ ] `status` column exists in `game_participants` table
- [ ] All required columns present (status, joined_at, left_at, play_time_minutes)
- [ ] No "column does not exist" errors in application
- [ ] Verification script passes all checks

**📄 See**: `PRODUCTION_SETUP.md` Section 1 for detailed instructions

---

## ✅ 2. Production Environment Setup (BLOCKING)

### Status: ⚠️ **REQUIRES CONFIGURATION**

### Required Environment Variables:

#### Critical (Must Have):
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=https://your-production-domain.com
```

#### Recommended:
```bash
VITE_OPENWEATHER_API_KEY=your_key
VITE_GOOGLE_MAPS_API_KEY=your_key
```

### Action Required:

1. **Set Variables in Hosting Platform** (Vercel/Netlify):
   - [ ] Add all required variables
   - [ ] Set for Production environment
   - [ ] Verify variable names start with `VITE_`

2. **Configure Supabase**:
   - [ ] Set Site URL to production domain
   - [ ] Add redirect URLs for OAuth
   - [ ] Enable real-time replication
   - [ ] Configure database backups

3. **Verify Configuration**:
   - [ ] App loads without environment errors
   - [ ] Supabase connection works
   - [ ] OAuth redirects work correctly

### Completion Criteria:
- [ ] All required environment variables set
- [ ] No "Missing environment variable" errors
- [ ] Supabase authentication configured
- [ ] Real-time features enabled

**📄 See**: `PRODUCTION_SETUP.md` Sections 2-4 for detailed instructions

---

## ✅ 3. Basic User Testing (REQUIRED)

### Status: ⚠️ **REQUIRES TESTING**

### Critical Path Tests:

1. **Authentication**:
   - [ ] User can sign up
   - [ ] User can sign in
   - [ ] User can sign out
   - [ ] Session persists

2. **Game Management**:
   - [ ] User can create games
   - [ ] User can view games
   - [ ] User can join games
   - [ ] User can leave games
   - [ ] Player count updates correctly

3. **Database Integration**:
   - [ ] No "status column missing" errors
   - [ ] Join/leave operations work
   - [ ] Data persists correctly

### Action Required:

1. **Run User Testing**:
   - Follow `USER_TESTING_CHECKLIST.md`
   - Test with 2-3 different users
   - Test on multiple devices/browsers

2. **Document Issues**:
   - Record any blocking bugs
   - Note usability concerns
   - Track performance issues

### Completion Criteria:
- [ ] All critical path tests pass
- [ ] No blocking bugs found
- [ ] User feedback collected
- [ ] Issues documented and prioritized

**📄 See**: `USER_TESTING_CHECKLIST.md` for complete testing guide

---

## ✅ 4. Real-time Feature Testing (HIGH PRIORITY)

### Status: ⚠️ **REQUIRES TESTING**

### Critical Real-time Tests:

1. **Game Updates**:
   - [ ] Game edits appear in real-time (< 2 seconds)
   - [ ] Game deletions propagate immediately
   - [ ] New games appear instantly

2. **Participants**:
   - [ ] Join/leave updates appear immediately
   - [ ] Player count updates in real-time
   - [ ] Status column updates correctly

3. **Chat**:
   - [ ] Messages appear instantly (< 1 second)
   - [ ] Messages persist after refresh
   - [ ] No duplicate messages

### Action Required:

1. **Run Real-time Tests**:
   - Follow `REALTIME_TESTING.md`
   - Test with multiple users simultaneously
   - Test network interruption scenarios

2. **Verify WebSocket Connections**:
   - Check browser console for "SUBSCRIBED" status
   - Monitor Supabase dashboard for real-time activity
   - Verify no connection errors

### Completion Criteria:
- [ ] All real-time features work correctly
- [ ] Updates appear within acceptable latency
- [ ] Connection recovery works
- [ ] No WebSocket errors

**📄 See**: `REALTIME_TESTING.md` for detailed testing procedures

---

## 📋 Complete Launch Checklist

### Pre-Launch (Must Complete):

- [ ] **Database Schema Fixed**
  - [ ] Status column exists
  - [ ] Migration applied successfully
  - [ ] Verification script passes

- [ ] **Production Environment Configured**
  - [ ] Environment variables set
  - [ ] Supabase configured
  - [ ] OAuth redirects working
  - [ ] Real-time enabled

- [ ] **User Testing Completed**
  - [ ] Critical path tests pass
  - [ ] No blocking bugs
  - [ ] User feedback reviewed

- [ ] **Real-time Testing Completed**
  - [ ] All real-time features work
  - [ ] Performance acceptable
  - [ ] Connection stability verified

### Launch Day:

- [ ] Final smoke tests on production
- [ ] Monitor error logs
- [ ] Verify analytics tracking
- [ ] Check uptime monitoring

### Post-Launch:

- [ ] Monitor user feedback
- [ ] Track error rates
- [ ] Review performance metrics
- [ ] Plan hotfixes if needed

---

## 🆘 Quick Reference

### If You See "Column 'status' does not exist":
1. Run: `supabase/migrations/20250203000000_verify_and_fix_game_participants_status.sql`
2. Verify: `scripts/verify-schema.sql`
3. See: `PRODUCTION_SETUP.md` Section 1

### If Real-time Not Working:
1. Check Supabase Dashboard → Database → Replication
2. Verify tables in `supabase_realtime` publication
3. See: `REALTIME_TESTING.md` Troubleshooting

### If Environment Variables Not Loading:
1. Restart deployment after adding variables
2. Verify names start with `VITE_`
3. Check build logs
4. See: `PRODUCTION_SETUP.md` Section 2

---

## 📞 Support Resources

- **Production Setup**: `PRODUCTION_SETUP.md`
- **User Testing**: `USER_TESTING_CHECKLIST.md`
- **Real-time Testing**: `REALTIME_TESTING.md`
- **Schema Verification**: `scripts/verify-schema.sql`
- **Supabase Setup**: `SUPABASE_SETUP.md`

---

## ✅ Launch Readiness

Your app is ready to launch when:

- ✅ All blocking items (Database Schema, Production Environment) are complete
- ✅ All required items (User Testing) are complete
- ✅ All high priority items (Real-time Testing) are complete
- ✅ No critical bugs remain
- ✅ Monitoring is in place

**Once all items are checked, you're ready to launch! 🚀**

