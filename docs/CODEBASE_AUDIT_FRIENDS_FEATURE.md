# Codebase Audit: Friends Feature & Social Graph

Date: February 2, 2025  
Status: Gap Analysis & Recommendations

---
## 1. Purpose
Evaluate current codebase support for a social graph (friends/follows) and identify minimal viable implementation path aligned with existing patterns (Supabase, React Query, domain folder organization).

---
## 2. Current State
- No `user_follows` or relationship table present.
- Presence system exists (`user_presence`) but not leveraged socially.
- Game discovery is primarily global or location-based.
- Chat limited to game rooms; no direct user-to-user messaging layer.
- No friend suggestions or social feed implemented.
- Notifications system in early stage (game + generic events).

---
## 3. Existing Foundations to Leverage
| Area | Existing Asset | Use in Friends Feature |
|------|----------------|------------------------|
| Realtime | Supabase Realtime | Follow event broadcasts (optional) |
| State | React Query + Zustand | Query caching for following lists |
| Presence | `user_presence` table | Elevate followed users' online status |
| Game Discovery | `games_with_counts_view` | Filter games by followed hosts |
| Notifications | Basic system | New game hosted by followed user |

---
## 4. Gaps Identified
| Gap | Description | Impact |
|-----|-------------|--------|
| Relationship Data | No table for user relationships | Can't model social graph |
| Surfacing | No UI/feed for friends' games | Missed personalized discovery |
| Privacy Controls | No user preference for being followed | Potential user discomfort |
| Abuse Controls | No rate limits on relationship actions | Risk of spam/harassment |
| Suggestions | No follow recommendations | Slower graph growth |
| Direct Interaction | No DMs or mutual visibility enhancements | Limited social stickiness |

---
## 5. Minimal Schema Additions
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_user_id, target_user_id)
);
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE INDEX CONCURRENTLY idx_user_follows_follower ON user_follows (follower_user_id);
CREATE INDEX CONCURRENTLY idx_user_follows_target ON user_follows (target_user_id);
```

---
## 6. Policy Examples
```sql
CREATE POLICY select_own_follows ON user_follows FOR SELECT
USING (follower_user_id = auth.uid());

CREATE POLICY follow_user ON user_follows FOR INSERT
WITH CHECK (follower_user_id = auth.uid());

CREATE POLICY unfollow_user ON user_follows FOR DELETE
USING (follower_user_id = auth.uid());
```

---
## 7. Derived Views
```sql
CREATE VIEW friends_games_view AS
SELECT uf.follower_user_id AS user_id,
       g.id AS game_id,
       g.host_user_id,
       g.start_time,
       g.sport_type,
       g.location_id
FROM user_follows uf
JOIN games g ON g.host_user_id = uf.target_user_id
WHERE g.start_time > NOW();
```

Optional materialized view for performance if query volume high.

---
## 8. Backend Service Layer Changes
Add module: `src/domains/users/friendsService.ts`
Responsibilities:
- `followUser(targetUserId)`
- `unfollowUser(targetUserId)`
- `listFollowing(cursor?)`
- `listFollowers(cursor?)`
- `listFriendsGames(cursor?)`
- Standardize error handling via existing pattern `{ success, error }`

---
## 9. React Query Integration
```typescript
// Query Keys
['friends', 'following']
['friends', 'followers']
['friends', 'games']

// Mutations
useFollowUserMutation()
useUnfollowUserMutation()

// Invalidations
queryClient.invalidateQueries(['friends', 'following']);
queryClient.invalidateQueries(['friends', 'games']);
```

---
## 10. UI Additions
Components:
- `FollowButton` (profile + game card contexts)
- `FriendsGamesFeed` (in dashboard/home)
- `FollowingAvatarStrip` (horizontal list of online followed users)

Placement:
- Profile page (primary follow action)
- Game list filter (tab: "Friends")
- Header: quick access to followed online users

---
## 11. Notifications Integration
Event: Followed user creates a game
Implementation:
- Real-time subscription to `games` inserts filtered by `host_user_id IN (followed_ids)`
- Dispatch toast + optional push

---
## 12. Abuse & Rate Limiting
Application-level guard:
```typescript
if (requestsFromIpLastHour > 200) block();
if (followsByUserToday > 100) requireCooldown();
```
Future: Store counters in `system_config` or analytics table.

---
## 13. Suggestions Engine (Phase 2)
Heuristics:
- Shared game participation
- Proximity (location city match)
- Similar sport preferences (`profiles.sport_preferences` overlap)
Query Example:
```sql
SELECT u.id, u.display_name
FROM users u
JOIN game_participants gp ON gp.user_id = u.id
WHERE gp.game_id IN (
  SELECT game_id FROM game_participants WHERE user_id = $CURRENT_USER
)
AND u.id <> $CURRENT_USER
LIMIT 20;
```

---
## 14. Analytics & Metrics
Track:
- Follow graph growth (edges/day)
- % of sessions with friends feed interaction
- Conversion: follow → game join within 7 days
- Retention lift vs. non-followers cohort

---
## 15. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Spam follows | Rate limit + optional confirmation |
| Privacy complaints | Future setting: allow follows toggle |
| Performance degrade on large graphs | Indexes + caching + pagination |
| Notification overload | Batch & throttle, user preference center |

---
## 16. Roadmap
Phase 1 (MVP): Table, policies, service, queries, follow UI, friends games feed.  
Phase 2: Suggestions, presence elevation strip, notifications enhancements.  
Phase 3: Mutual "friends" tier, privacy controls, social activity feed.  
Phase 4: Direct messaging integration, advanced social analytics.

---
## 17. Success Criteria
- ≥30% of active users follow ≥3 others by month 2
- Friends games feed drives ≥15% of joins
- Follow graph density correlates with +10% retention lift

---
**Next Action:** Implement Phase 1 migration + service layer, wire frontend queries.
