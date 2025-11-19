# Friends Feature V2: Complex User Relationships

Date: February 2, 2025  
Status: Advanced Design (Post-V1 Follow Graph)

---
## 1. Objective
Extend the initial follow graph (V1) into richer, multi-tier relationships supporting mutual friendships, trust levels, blocking, and social recommendations. Provide scalable foundation for messaging, private game invites, and group formation.

---
## 2. Relationship Model Evolution
| Tier | Description | Directionality | Approval | Use Cases |
|------|-------------|----------------|----------|----------|
| Follow | Lightweight subscription | Unidirectional | No | Feed surfacing, notifications |
| Friend | Mutual connection | Bidirectional | Yes | Private invites, priority presence |
| Close Friend (future) | Trusted inner circle | Bidirectional | Yes | Exclusive games, sensitive sharing |
| Block | Interaction prevention | Unidirectional | No | Abuse mitigation |

---
## 3. Expanded Schema
### Tables
1. `user_follows` (existing)
2. `user_friend_requests`
3. `user_friends`
4. `user_blocks`

```sql
CREATE TABLE user_friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','accepted','rejected','canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT unique_friend_request UNIQUE (requester_user_id, target_user_id)
);

CREATE TABLE user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  friendship_level TEXT NOT NULL DEFAULT 'friend' CHECK (friendship_level IN ('friend','close')),
  CONSTRAINT unique_friend_pair UNIQUE (LEAST(user_a,user_b), GREATEST(user_a,user_b))
);

CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_block UNIQUE (blocker_user_id, blocked_user_id)
);
```

---
## 4. RLS Policies (Examples)
```sql
-- Friend requests
CREATE POLICY select_own_requests ON user_friend_requests FOR SELECT
USING (requester_user_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY create_friend_request ON user_friend_requests FOR INSERT
WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY respond_friend_request ON user_friend_requests FOR UPDATE
USING (target_user_id = auth.uid());

-- Friends
CREATE POLICY select_own_friends ON user_friends FOR SELECT
USING (user_a = auth.uid() OR user_b = auth.uid());

-- Blocks
CREATE POLICY manage_blocks ON user_blocks FOR ALL
USING (blocker_user_id = auth.uid()) WITH CHECK (blocker_user_id = auth.uid());
```

---
## 5. Service Layer Modules
Add: `friendsComplexService.ts`
Functions:
- `requestFriend(targetUserId)`
- `respondFriendRequest(requestId, decision)` (accept/reject)
- `listFriendRequests()`
- `listFriends()`
- `upgradeFriendship(userId, level)`
- `blockUser(userId)` / `unblockUser(userId)`
- `listBlockedUsers()`

Ensure decorators or wrappers for standardized error + rate limiting.

---
## 6. State & React Query Keys
```typescript
['relationships','friend-requests']
['relationships','friends']
['relationships','friends','level','close']
['relationships','blocks']
```
Mutations:
- `useRequestFriend()`
- `useRespondFriendRequest()`
- `useUpgradeFriendship()`
- `useBlockUser()`
- `useUnblockUser()`

Invalidation strategy: granular; accept request → invalidate friends + requests.

---
## 7. UI Components
| Component | Purpose |
|-----------|---------|
| `FriendRequestButton` | Request/Cancel pending request |
| `FriendRequestList` | Manage incoming/outgoing requests |
| `FriendsList` | Display friends grouped by level |
| `FriendshipLevelBadge` | Visualize friend vs. close friend |
| `BlockUserAction` | Abuse mitigation interface |
| `BlockedUsersList` | Manage blocked relationships |

Presence Elevation: Display close friends at top with online status & quick invite buttons.

---
## 8. Game Integration
- Private game creation: Restrict visibility to friends or close friends.
- Invite flow: Pre-filter participants list to close friends for high-signal invites.
- Notification: Friend joins a game you created (optional toggle).

---
## 9. Abuse Prevention & Rate Limits
| Action | Limit Recommendation |
|--------|----------------------|
| Friend requests sent | 50 per day |
| Blocks applied | 200 total |
| Friendship upgrades | 100 per day |

Implement counters either in `system_config` or a lightweight metrics table.

---
## 10. Privacy Controls
Add user settings (future table): `user_privacy_settings`
Fields:
- `user_id`
- `allow_follows` (boolean)
- `allow_friend_requests` (boolean)
- `default_game_visibility` (enum: public|friends|close)

---
## 11. Recommendation Engine (Phase 3)
Signals for suggesting friends:
- Shared game participation frequency
- Mutual follows
- Location proximity (city/state match)
- Similar sport preferences overlap (Jaccard index on `profiles.sport_preferences`)

Example similarity query:
```sql
SELECT u.id, u.display_name,
       similarity_score
FROM user_similarity_view
WHERE base_user_id = $CURRENT_USER
ORDER BY similarity_score DESC
LIMIT 25;
```

Materialized view calculation (batch daily) for `user_similarity_view`.

---
## 12. Blocking Effects
When a block exists:
- Hide blocked user's games from discovery (unless public feed requirement overrides)
- Prevent chat visibility and messaging
- Ignore follow/friend requests automatically
- Exclude from friend suggestions

---
## 13. Migration Order
1. Create tables (`user_friend_requests`, `user_friends`, `user_blocks`).
2. Enable RLS + policies.
3. Add indexes:
```sql
CREATE INDEX CONCURRENTLY idx_friend_requests_target ON user_friend_requests (target_user_id, status);
CREATE INDEX CONCURRENTLY idx_friends_user_a ON user_friends (user_a);
CREATE INDEX CONCURRENTLY idx_friends_user_b ON user_friends (user_b);
CREATE INDEX CONCURRENTLY idx_blocks_blocker ON user_blocks (blocker_user_id);
```
4. Implement service layer.
5. Build UI flows (request, respond, list, block).
6. Wire notifications for accepted requests.
7. Add privacy settings table (optional Phase 2).

---
## 14. Analytics & Metrics
Track:
- Request acceptance rate
- Average time to respond
- Block rate per active user
- Impact of friendships on game invite acceptance
- Retention delta for users with ≥5 friends

---
## 15. Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Spam friend requests | Rate limits + optional request cap display |
| Social exclusion concerns | Provide discovery fallback suggestions |
| Privacy complaints | User-controlled settings |
| Data bloat | Archive old rejected requests > 90 days |

---
## 16. Success Criteria
- ≥40% of users with ≥3 friends by month 3 post-launch
- Game invite acceptance +20% among friend-connected users
- Block feature reduces repeat negative interactions by ≥60%

---
## 17. Roadmap
Phase 1: Mutual friends & requests.  
Phase 2: Blocks + privacy settings + close friend tier.  
Phase 3: Recommendations & similarity scoring.  
Phase 4: Private games + enhanced invite workflows.  
Phase 5: Advanced analytics & social health dashboards.

---
**Next Action:** Implement Phase 1 migrations and basic friend request workflow; coordinate UI integration with existing profile components.
