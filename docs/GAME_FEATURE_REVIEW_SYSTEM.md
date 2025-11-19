# Game Feature Review & Rating System

Date: February 2, 2025  
Status: Implemented (Needs Enhancement Opportunities Logged)

---
## 1. Purpose
Provide structured feedback loops and quality signals for games and participants to enhance matchmaking, trust, and repeat engagement.

---
## 2. Current Components

### Tables
1. `game_reviews`
   - Stores rating + comment per user per game
2. `user_reviews`
   - User-to-user rating (post-game or general interaction)
3. `user_stats`
   - Aggregated metrics (games played, ELO, etc.)
4. `games_with_counts_view`
   - Game listing metadata including participant totals

### Key Fields (Game Reviews)
- `id`: UUID
- `game_id`: References `games`
- `reviewer_user_id`: References `users`
- `rating`: Integer (1–5)
- `comment`: Text (nullable)
- `created_at`: Timestamp

### Key Fields (User Reviews)
- `id`: UUID
- `reviewer_user_id`: References `users`
- `target_user_id`: References `users`
- `game_id`: Nullable reference to `games`
- `rating`: Integer (1–5)
- `comment`: Text (nullable)
- `created_at`: Timestamp

---
## 3. Core Rules (Expected)
1. One game review per user per game (enforce unique constraint).
2. One user review per reviewer-target pair per game context (optional uniqueness: `(reviewer_user_id, target_user_id, game_id)`).
3. Only participants of a game can leave a game review.
4. Only participants in the same game can leave user reviews for that game context.

---
## 4. Current Gaps & Issues
| Area | Gap | Impact |
|------|-----|--------|
| Constraints | Missing uniqueness on game reviews | Duplicate ratings skew averages |
| Data Model | No sentiment or structured tags | Harder to aggregate actionable insights |
| UX | Limited prompting for reviews | Low review completion rate |
| Analytics | No decay model for old ratings | Stale data affects ranking |
| Moderation | No flagging mechanism | Hard to manage abuse/toxicity |

---
## 5. Rating Aggregation Strategy

### Game Rating
- Simple average of all `game_reviews.rating`
- Potential enhancements:
  - Weighted average (recent reviews weight higher)
  - Bayesian smoothing (avoid extreme averages with few reviews)

### User Rating
- Combine `user_reviews.rating` + ELO + role-adjusted performance (e.g., host reliability)
- Proposed formula:
```
UserComposite = (AvgUserReview * 0.4) + (ELO_Normalized * 0.4) + (HostReliabilityScore * 0.2)
```

### Host Reliability Score (Future)
- % of games started on time
- Cancellation rate (lower is better)
- Average participant retention

---
## 6. API Endpoints (Existing / Planned)

`POST /reviews/game`
Payload: `{ gameId, rating, comment? }`

`POST /reviews/user`
Payload: `{ targetUserId, gameId?, rating, comment? }`

`GET /reviews/game/:gameId`
Returns list + aggregated rating

`GET /reviews/user/:userId`
Returns list + composite rating

`GET /reviews/user/:userId/summary`
Returns `{ averageRating, compositeScore, elo, totalReviews }`

---
## 7. React Query Structure

```typescript
// Queries
['reviews', 'game', gameId]
['reviews', 'user', userId]
['reviews', 'user', userId, 'summary']

// Mutations
useAddGameReview()
useAddUserReview()

// Invalidations
queryClient.invalidateQueries(['reviews', 'game', gameId]);
queryClient.invalidateQueries(['reviews', 'user', targetUserId]);
```

---
## 8. UI Touchpoints
1. Post-game modal: Prompt user to rate game & participants
2. Game detail page: Display aggregate rating + recent comments
3. User profile: Show composite rating + badges (e.g., "Reliable Host")
4. Participant list: Hover for quick rating dropdown (future)
5. Review management panel (admin) for moderation (future)

---
## 9. Data Integrity & Policies

Example Policies:
```sql
-- Only participants can review games
CREATE POLICY review_game_participant ON game_reviews FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM game_participants gp
  WHERE gp.game_id = game_reviews.game_id
  AND gp.user_id = auth.uid()
));

-- Prevent duplicate game reviews
ALTER TABLE game_reviews
ADD CONSTRAINT unique_game_reviewer UNIQUE (game_id, reviewer_user_id);
```

---
## 10. Moderation & Abuse Prevention (Phase 2)
- Add `is_flagged` boolean + `flag_reason` field
- Create `review_flags` table for user-submitted flags
- Implement threshold-based auto-hide (e.g., ≥3 flags)
- Add admin dashboard view for flagged reviews

---
## 11. Enhancement Opportunities
| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Sentiment Analysis | Auto-tag reviews (positive/negative) | Medium |
| Review Tags | Structured tags (e.g., "Organized", "Competitive") | Medium |
| Decay Model | Lower weight for reviews > 6 months | Low |
| Badge System | Host badges (Reliable, Top Rated) | High |
| Review Replies | Allow host replies to game reviews | Low |

---
## 12. Example SQL Snippets
```sql
-- Bayesian smoothing example (materialized view)
CREATE MATERIALIZED VIEW game_rating_mv AS
SELECT
  g.id AS game_id,
  ( (SELECT avg(rating) FROM game_reviews WHERE game_id = g.id) * 0.7
    + 3.0 * 0.3 ) AS bayesian_adjusted_rating,
  COUNT(gr.id) AS review_count
FROM games g
LEFT JOIN game_reviews gr ON gr.game_id = g.id
GROUP BY g.id;

-- Sentiment placeholder
ALTER TABLE game_reviews ADD COLUMN sentiment TEXT;
```

---
## 13. Analytics & Metrics
Track:
- Review completion rate per game
- Avg rating distribution over time
- % of users with composite rating > threshold
- Impact of ratings on game joins (correlation)

---
## 14. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Review bombing | Rate-limiting + anomaly detection |
| Low engagement | In-context prompts & frictionless UI |
| Bias in ratings | Bayesian smoothing + diversity prompts |
| Host retaliation | Delay display of individual ratings (aggregate first) |

---
## 15. Success Metrics Targets
- ≥60% of completed games receive ≥1 review
- ≥35% of active users have ≥3 user reviews
- Host cancellation rate reduced by 10% after rating system visibility

---
## 16. Next Actions
1. Verify unique constraints exist.
2. Add sentiment field + placeholder processing.
3. Implement composite user rating endpoint.
4. Add post-game review prompt.
5. Create materialized view for Bayesian game rating.

---
**Owner:** Gameplay & Trust Team  
**Review Cycle:** Monthly for rating fairness & abuse monitoring
