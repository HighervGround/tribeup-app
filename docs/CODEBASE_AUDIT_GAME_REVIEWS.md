# Codebase Audit: Game & User Reviews

Date: February 2, 2025  
Status: Gap Analysis & Refactor Plan

---
## 1. Scope
Assess current implementation of game and user review systems, identify structural gaps, and outline enhancement strategy for accuracy, scalability, and trust.

---
## 2. Current Assets
| Component | Description |
|----------|-------------|
| `game_reviews` | Stores per-game rating + optional comment |
| `user_reviews` | User-to-user ratings (may or may not require game context) |
| `user_stats` | Aggregated performance metrics (ELO, games played) |
| Views (e.g., counts) | Support listing and leaderboard building |

---
## 3. Observed Issues
| Area | Issue | Impact |
|------|-------|--------|
| Constraints | No enforced uniqueness per game reviewer | Skews averages with duplicates |
| Normalization | Rating only (1–5); no structured tags | Lacks granular insight |
| Aggregation | No Bayesian smoothing or weight decay | Early ratings distort perception |
| Moderation | No flag/report system | Abuse potential (toxicity) |
| UX Flow | Reviews not consistently prompted post-game | Low completion rate |
| Response | Hosts cannot reply to reviews | Trust/clarification gap |

---
## 4. Data Integrity Enhancements
```sql
-- Prevent duplicate game reviews
ALTER TABLE game_reviews
ADD CONSTRAINT unique_game_reviewer UNIQUE (game_id, reviewer_user_id);

-- Optional uniqueness for user reviews in game context
ALTER TABLE user_reviews
ADD CONSTRAINT unique_user_review_in_game UNIQUE (game_id, reviewer_user_id, target_user_id);
```

Add columns:
```sql
ALTER TABLE game_reviews ADD COLUMN sentiment TEXT; -- future NLP tag
ALTER TABLE game_reviews ADD COLUMN tags TEXT[]; -- e.g., ['organized','friendly']
ALTER TABLE user_reviews ADD COLUMN tags TEXT[];
```

---
## 5. Aggregation Strategy Proposal
### Game Rating (Bayesian Smoothing)
```
Adjusted = (C * m + Sum(ratings)) / (C + n)
Where:
  C = 5 (confidence constant)
  m = 3.5 (global mean baseline)
  n = number of reviews
```

### User Composite Rating
```
Composite = (AvgUserReview * 0.5) + (ELO_Normalized * 0.3) + (HostReliability * 0.2)
```

HostReliability Factors:
- Cancellation rate
- On-time start percentage
- Participant retention

---
## 6. Materialized Views
```sql
CREATE MATERIALIZED VIEW game_rating_mv AS
SELECT g.id AS game_id,
       (5 * 3.5 + COALESCE(SUM(gr.rating),0)) / (5 + COUNT(gr.id)) AS adjusted_rating,
       COUNT(gr.id) AS review_count
FROM games g
LEFT JOIN game_reviews gr ON gr.game_id = g.id
GROUP BY g.id;

CREATE MATERIALIZED VIEW user_rating_mv AS
SELECT u.id AS user_id,
       AVG(ur.rating) AS avg_user_review,
       COUNT(ur.id) AS review_count
FROM users u
LEFT JOIN user_reviews ur ON ur.target_user_id = u.id
GROUP BY u.id;
```

Refresh strategy (cron every 30 min or event-driven on insert).

---
## 7. API Layer Enhancements
Endpoints to verify/build:
- `GET /reviews/game/:gameId` (include adjusted rating)
- `GET /reviews/game/:gameId/summary`
- `GET /reviews/user/:userId/summary` (composite)
- `POST /reviews/game`
- `POST /reviews/user`
- `POST /reviews/game/:id/flag` (phase 2)

---
## 8. React Query Plan
```typescript
// Query Keys
['reviews','game',gameId]
['reviews','game',gameId,'summary']
['reviews','user',userId]
['reviews','user',userId,'summary']

// Mutations
useAddGameReview()
useAddUserReview()
useFlagGameReview()

// Invalidations
queryClient.invalidateQueries(['reviews','game',gameId]);
queryClient.invalidateQueries(['reviews','game',gameId,'summary']);
```

Add optimistic UI for adding a game review (append locally then invalidate).

---
## 9. Moderation Pipeline (Phase 2)
New table: `review_flags`
```sql
CREATE TABLE review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_type TEXT NOT NULL CHECK (review_type IN ('game','user')),
  review_id UUID NOT NULL,
  flagger_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Policy restricts flagging to authenticated users. Admin view lists top flagged reviews for action.

---
## 10. Analytics Metrics
Track:
- Review submission rate per completed game
- Distribution of ratings (histogram)
- Time-to-first-review post-game
- Impact of rating visibility on join rates
- Flag rate / resolution time

---
## 11. Performance Considerations
- Index `(game_id, reviewer_user_id)` for `game_reviews`
- Index `(target_user_id, created_at)` for `user_reviews`
- Consider partitioning `game_reviews` if volume grows (by month)
- Use materialized views for expensive aggregation queries

---
## 12. UX Flow Improvements
1. Post-game modal triggers once game end time passes + user participated
2. Inline quick-rating buttons (1–5 stars) before optional comment
3. Success toast with ability to rate participants next
4. Surface composite host score on game creation (trust indicator)

---
## 13. Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Rating inflation | Bayesian smoothing + weight decay |
| Toxic comments | Flagging + moderation tooling |
| Low engagement | Timely prompts + low-friction UI |
| Performance lag | Materialized views + indexes |

---
## 14. Implementation Order
1. Add constraints + indexes
2. Implement materialized views
3. Build summary endpoints
4. Add React Query integration + UI modal
5. Instrument analytics events
6. Add moderation pipeline (phase 2)

---
## 15. Success Criteria
- ≥50% of games receive ≥1 review within 24h
- ≥30% of active users have ≥3 user reviews
- Rating features correlate with ≥10% increase in repeat joins

---
**Next Action:** Draft migration script (constraints + columns), implement aggregation views, expose summary endpoints.
