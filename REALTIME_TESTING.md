# Real-time Feature Testing Guide

## 🎯 Overview

This guide provides comprehensive testing procedures for all real-time features in TribeUp. Real-time functionality is critical for user experience and must be thoroughly tested before launch.

---

## 📋 Pre-Testing Setup

### Requirements
- [ ] Two or more test user accounts
- [ ] Two different browsers/devices (or incognito windows)
- [ ] Stable internet connection
- [ ] Browser console open (F12) to monitor WebSocket connections
- [ ] Supabase dashboard open to monitor real-time activity

### Test Environment
- **Development**: Test on `localhost` first
- **Production**: Verify on production domain before launch
- **Network**: Test on both WiFi and mobile data

---

## 🔄 Real-time Features to Test

### 1. Game Updates (High Priority)

**What to Test**: When a game is created, updated, or deleted, all users viewing that game should see changes immediately.

#### Test Procedure

1. **Setup**:
   - User A: Open game details page for a specific game
   - User B: Open the same game details page in another browser/device

2. **Test Game Updates**:
   - [ ] User A edits game title → User B sees update immediately (< 2 seconds)
   - [ ] User A changes game date/time → User B sees update immediately
   - [ ] User A updates max players → User B sees update immediately
   - [ ] User A updates description → User B sees update immediately

3. **Test Game Deletion**:
   - [ ] User A deletes game → User B sees game removed from list immediately
   - [ ] User B on game details page → Sees error/redirect when game deleted

4. **Test Game Creation**:
   - [ ] User A creates new game → User B sees it appear in game list immediately
   - [ ] Verify game appears in correct location on map

5. **Expected Behavior**:
   - Updates appear within 1-2 seconds
   - No page refresh required
   - No console errors related to subscriptions
   - WebSocket connection shows as "SUBSCRIBED" in console

#### Verification Queries

Check Supabase dashboard → **Database** → **Replication**:
- `games` table should have replication enabled
- Monitor **Logs** for real-time events

#### Common Issues

- **Updates not appearing**: Check WebSocket connection status
- **Delayed updates**: Check network latency, verify Supabase region
- **Connection errors**: Verify real-time is enabled in Supabase dashboard

---

### 2. Game Participants (Join/Leave) (High Priority)

**What to Test**: When a user joins or leaves a game, all viewers should see player count and participant list update immediately.

#### Test Procedure

1. **Setup**:
   - User A: View game details page
   - User B: View same game details page
   - User C: Available to join/leave

2. **Test Join**:
   - [ ] User C joins game → User A and User B see:
     - Player count increases immediately
     - User C appears in participant list
     - Join button changes to "Leave" for User C
   - [ ] Verify status updates correctly in database

3. **Test Leave**:
   - [ ] User C leaves game → User A and User B see:
     - Player count decreases immediately
     - User C removed from participant list
     - Join button available again for User C

4. **Test Multiple Joins**:
   - [ ] Multiple users join simultaneously → All viewers see updates
   - [ ] Verify player count matches actual participants

5. **Test Max Players**:
   - [ ] Game reaches max players → Join button disabled for others
   - [ ] User leaves → Join button enabled again immediately

#### Expected Behavior
- Player count updates within 1 second
- Participant list updates immediately
- No duplicate entries
- Status column in database updates correctly

#### Database Verification

```sql
-- Check participant status
SELECT 
    gp.id,
    gp.user_id,
    gp.game_id,
    gp.status,
    gp.joined_at,
    u.full_name
FROM game_participants gp
JOIN users u ON gp.user_id = u.id
WHERE gp.game_id = 'your-game-id'
ORDER BY gp.joined_at;
```

All participants should have `status = 'joined'` when active.

---

### 3. Chat Messages (High Priority)

**What to Test**: Chat messages should appear instantly for all users in the game chat.

#### Test Procedure

1. **Setup**:
   - User A: Open game chat
   - User B: Open same game chat
   - User C: Open same game chat

2. **Test Message Sending**:
   - [ ] User A sends message → User B and User C see it immediately (< 1 second)
   - [ ] Message appears in correct order
   - [ ] Sender name/avatar displays correctly
   - [ ] Timestamp shows correctly

3. **Test Multiple Messages**:
   - [ ] Rapid message sending → All messages appear in order
   - [ ] No duplicate messages
   - [ ] No missing messages

4. **Test Message Persistence**:
   - [ ] User A sends message
   - [ ] User B refreshes page → Message still visible
   - [ ] User C joins chat → Sees message history

5. **Test Real-time Indicators**:
   - [ ] "User is typing..." indicator works (if implemented)
   - [ ] Online status updates correctly

#### Expected Behavior
- Messages appear instantly (< 1 second)
- Messages persist after page refresh
- Message order is correct
- No duplicate messages
- Chat scrolls to bottom on new messages

#### Database Verification

```sql
-- Check recent chat messages
SELECT 
    cm.id,
    cm.message,
    cm.created_at,
    u.full_name as author
FROM chat_messages cm
JOIN users u ON cm.user_id = u.id
WHERE cm.game_id = 'your-game-id'
ORDER BY cm.created_at DESC
LIMIT 10;
```

---

### 4. Notifications (Medium Priority)

**What to Test**: Users should receive real-time notifications for relevant events.

#### Test Procedure

1. **Setup**:
   - User A: Has notifications enabled
   - User B: Creates/updates games User A is interested in

2. **Test Notification Types**:
   - [ ] User joins your game → Creator receives notification
   - [ ] Game you joined is updated → You receive notification
   - [ ] Game you joined is cancelled → You receive notification
   - [ ] New message in game chat → Participants receive notification (if implemented)

3. **Test Notification Display**:
   - [ ] Notification appears in UI immediately
   - [ ] Notification badge updates
   - [ ] Notification persists until read
   - [ ] Clicking notification navigates to relevant page

#### Expected Behavior
- Notifications appear within 2-3 seconds
- Notifications are accurate and relevant
- Notification count updates correctly
- Notifications can be dismissed

---

### 5. User Presence (Medium Priority)

**What to Test**: Online/offline status and active users should update in real-time.

#### Test Procedure

1. **Setup**:
   - User A: Logged in and viewing app
   - User B: Logged in and viewing app

2. **Test Presence Updates**:
   - [ ] User A goes online → User B sees User A as online
   - [ ] User A goes offline → User B sees User A as offline
   - [ ] User A navigates to different page → Presence updates
   - [ ] Multiple users online → All show in presence list

3. **Test Presence Widget**:
   - [ ] OnlinePlayersWidget shows correct count
   - [ ] User list updates when users come online/offline
   - [ ] No infinite loading (should timeout after 3 seconds)

#### Expected Behavior
- Presence updates within 5-10 seconds
- Graceful fallback if WebSocket fails
- No performance impact from presence tracking

---

## 🔍 Testing Scenarios

### Scenario 1: High Activity

**Setup**: 5+ users, multiple games, active chat

**Test**:
- [ ] All real-time updates work correctly
- [ ] No performance degradation
- [ ] No missed updates
- [ ] WebSocket connection remains stable

### Scenario 2: Network Interruption

**Setup**: User A on stable connection, User B on unstable connection

**Test**:
- [ ] User B reconnects → Receives missed updates
- [ ] No duplicate messages/updates
- [ ] Connection recovery is seamless

### Scenario 3: Multiple Tabs

**Setup**: Same user logged in on multiple browser tabs

**Test**:
- [ ] Updates appear in all tabs
- [ ] No conflicts or duplicate actions
- [ ] Presence shows as single user (not multiple)

---

## 🐛 Common Issues & Solutions

### Issue: Real-time updates not working

**Symptoms**:
- Updates don't appear
- Console shows WebSocket errors
- "SUBSCRIBED" status not reached

**Solutions**:
1. Check Supabase dashboard → Database → Replication
2. Verify table is added to `supabase_realtime` publication
3. Check browser console for connection errors
4. Verify RLS policies allow SELECT operations
5. Check network/firewall settings

### Issue: Delayed updates

**Symptoms**:
- Updates appear but with delay (5+ seconds)
- Intermittent updates

**Solutions**:
1. Check Supabase region matches user location
2. Verify network latency
3. Check for WebSocket reconnection issues
4. Monitor Supabase dashboard for performance issues

### Issue: Duplicate updates

**Symptoms**:
- Same update appears multiple times
- Player count increments incorrectly

**Solutions**:
1. Check for multiple subscriptions to same channel
2. Verify cleanup of subscriptions in useEffect cleanup
3. Check for race conditions in update handlers

### Issue: Connection drops frequently

**Symptoms**:
- WebSocket disconnects and reconnects repeatedly
- Updates stop working intermittently

**Solutions**:
1. Check network stability
2. Verify Supabase real-time service status
3. Check for browser extension interference
4. Review connection pooling settings

---

## ✅ Real-time Testing Checklist

### Critical (Must Pass)
- [ ] Game updates appear in real-time (< 2 seconds)
- [ ] Join/leave updates appear immediately
- [ ] Chat messages appear instantly (< 1 second)
- [ ] No console errors related to subscriptions
- [ ] WebSocket connections show "SUBSCRIBED" status

### High Priority
- [ ] Multiple users can see updates simultaneously
- [ ] Updates persist after page refresh
- [ ] No duplicate updates
- [ ] Connection recovers after network interruption

### Medium Priority
- [ ] Notifications appear in real-time
- [ ] Presence updates work correctly
- [ ] Performance remains good with 5+ concurrent users

---

## 📊 Monitoring Real-time Performance

### Browser Console Checks

1. **WebSocket Connection**:
   ```javascript
   // Check subscription status
   // Should see: "SUBSCRIBED" status in console
   ```

2. **Network Tab**:
   - Check WebSocket connection in Network tab
   - Verify connection is "101 Switching Protocols"
   - Monitor message frequency

3. **Console Errors**:
   - No errors related to `supabase.channel`
   - No errors related to `postgres_changes`
   - No subscription cleanup warnings

### Supabase Dashboard Checks

1. **Replication Status**:
   - Go to Database → Replication
   - Verify tables show as "Active"

2. **Logs**:
   - Monitor Database → Logs for real-time events
   - Check for errors or warnings

3. **Performance**:
   - Monitor Database → Reports
   - Check for slow queries related to real-time

---

## 🚀 Production Readiness

Real-time features are production-ready when:

- ✅ All critical tests pass
- ✅ No blocking console errors
- ✅ Updates appear within acceptable latency (< 2 seconds)
- ✅ Connection recovery works
- ✅ Performance is acceptable with multiple users
- ✅ Monitoring is in place

---

## 📝 Test Report Template

### Test Session Info
- **Date**: ___________
- **Tester**: ___________
- **Environment**: Development / Production
- **Browser/Device**: ___________

### Results
- **Game Updates**: ✅ Pass / ❌ Fail
- **Participants**: ✅ Pass / ❌ Fail
- **Chat**: ✅ Pass / ❌ Fail
- **Notifications**: ✅ Pass / ❌ Fail
- **Presence**: ✅ Pass / ❌ Fail

### Issues Found
1. ___________
2. ___________
3. ___________

### Notes
___________

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase real-time is enabled
3. Review this guide's troubleshooting section
4. Check [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)

