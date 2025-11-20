# Friends Feature V1

Date: February 2, 2025  
Status: Proposal (Initial Implementation Scope)

---
## 1. Objective
Introduce a lightweight friends feature to improve user retention, game discovery, and social interaction. Phase 1 focuses on follow-style relationships, activity surfacing, and social affordances without requiring complex bidirectional approval flows.

---
## 2. Core Concepts

### Relationship Type: Follow (Unidirectional)
- User A "follows" User B
- B is not required to approve (optional settings later)
- Future expansion can add "friend" (mutual) or "close friend" tier

### Visibility & Surfacing
- Games hosted by followed users appear in "Friends' Games" feed
- Recent activity (hosting, joining, achievements) elevated
- Presence (online/in_game) prioritized in UI lists

### Notifications (Phase 1)
- When a followed user hosts a new game
- When a followed user reaches a milestone (optional toggle)

---
## 3. Data Model

### Table: user_follows
- `id`: UUID (PK)
- `follower_user_id`: UUID (references users.id)
- `target_user_id`: UUID (references users.id)
- `created_at`: Timestamp (default now)
- Unique constraint: `(follower_user_id, target_user_id)`

### Derived View: followed_games_view
- Fields: `follower_user_id`, `game_id`, `host_user_id`, `start_time`, `sport_type`, `location_id`
- Joins `user_follows` with `games`

### Suggested Indexes
```sql
CREATE INDEX CONCURRENTLY idx_user_follows_follower ON user_follows (follower_user_id);
CREATE INDEX CONCURRENTLY idx_user_follows_target ON user_follows (target_user_id);
```

---
## 4. API Surface

### Follow User
`POST /relationships/follow`
Payload: `{ targetUserId: string }`
Response: `{ success: true }` or standardized error

### Unfollow User
`DELETE /relationships/follow/:targetUserId`
Response: `{ success: true }`

### List Followed Users
`GET /relationships/following`
Query params: pagination (cursor)

### List Followers
`GET /relationships/followers`

### Friends' Games Feed
`GET /feed/friends-games?cursor=...`
- Returns upcoming games hosted by followed users

---
## 5. Frontend UI

### Entry Points
- User profile: "Follow" button
- Game card: Host avatar → mini profile → follow action
- Dedicated "Following" list page (Phase 1 simplified)

### Components
- `FollowButton` (handles states: follow, unfollow, loading)
- `FollowingBadge` (shows count + recent hosts)
- `FriendsGamesFeed` (query with React Query, infinite scroll)
- `RelationshipList` (optional placeholder)

### States
- Optimistic update on follow/unfollow
- Disabled button while in-flight
- Toast notifications for success/failure

---
## 6. React Query Structure

```typescript
// Keys
['relationships', 'following']
['relationships', 'followers']
['feed', 'friends-games']

// Mutations
useFollowUserMutation()
useUnfollowUserMutation()

// Invalidations
queryClient.invalidateQueries(['relationships', 'following']);
queryClient.invalidateQueries(['feed', 'friends-games']);
```

---
## 7. Presence & Surfacing Enhancements

Phase 1 synergy:
- Elevate online followed users in player selection lists
- Add subtle indicator (dot) next to display name
- Optional toggle: show only followed users for quick invites

---
## 8. Notifications (Phase 1 Scope)

Events:
1. Followed user hosts a new game
2. Followed user starts a game you haven't joined (prompt to join)

Delivery channels:
- In-app toast
- Optional push (user-level setting, future)

---
## 9. Security & Policies

RLS Considerations:
- `user_follows` select: user can see rows where `follower_user_id = auth.uid()`
- Insert: `follower_user_id = auth.uid()` only
- Delete: row where `follower_user_id = auth.uid()`

Example Policy Snippet:
```sql
CREATE POLICY select_own_follows ON user_follows FOR SELECT
USING (follower_user_id = auth.uid());

CREATE POLICY follow_user ON user_follows FOR INSERT
WITH CHECK (follower_user_id = auth.uid());

CREATE POLICY unfollow_user ON user_follows FOR DELETE
USING (follower_user_id = auth.uid());
```

---
## 10. Analytics & Metrics

Track:
- Number of follows per day
- Follow → game join conversion rate
- Games discovered via friends feed
- Retention impact (D7, D30 retention for users who follow ≥2 users)

---
## 11. Implementation Phases

Phase 1 (Target: 3-5 days):
1. Create `user_follows` table + RLS policies
2. Backend endpoints (follow/unfollow/list/feed)
3. React Query integration + mutations
4. UI components (FollowButton, FriendsGamesFeed)
5. Basic presence elevation for followed users
6. Toast notification for new hosted game (simplified subscription)

Phase 2 (Future):
- Add mutual friend detection
- Notification preferences
- Friend activity digest email
- Follow suggestions (shared games, location proximity)

---
## 12. Example SQL Migration
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_user_id, target_user_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX CONCURRENTLY idx_user_follows_follower ON user_follows (follower_user_id);
CREATE INDEX CONCURRENTLY idx_user_follows_target ON user_follows (target_user_id);

-- Policies
CREATE POLICY select_own_follows ON user_follows FOR SELECT USING (follower_user_id = auth.uid());
CREATE POLICY follow_user ON user_follows FOR INSERT WITH CHECK (follower_user_id = auth.uid());
CREATE POLICY unfollow_user ON user_follows FOR DELETE USING (follower_user_id = auth.uid());
```

---
## 13. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Abuse (mass-follow) | Rate limit follow mutation |
| Spam notifications | Batch notifications; add quiet periods |
| Privacy concerns | Future user setting: allow follows (toggle) |
| Performance on large follow graphs | Indexes + pagination + caching |

---
## 14. Success Metrics Targets

- 40% of active users follow ≥3 users within 14 days
- +15% increase in game joins sourced via friends feed
- +10% improvement in D30 retention for users with follows

---
## 15. Next Actions

1. Approve schema and endpoints.
2. Implement migration and RLS policies.
3. Build follow/unfollow mutations and UI components.
4. Launch friends games feed (MVP).
5. Instrument metrics (events + analytics logging).

---
**Owner:** Product + Engineering Collaboration  
**Review Cycle:** Bi-weekly until feature maturity
