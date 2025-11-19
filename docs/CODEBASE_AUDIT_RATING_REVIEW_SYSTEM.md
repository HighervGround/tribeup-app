# Codebase Audit: Rating & Review System (User + Game)

Date: February 2, 2025  
Status: Consolidated Audit for Unified Rating & Review Strategy

---
## 1. Overview
The rating and review system spans two domains: game-level quality feedback (`game_reviews`) and user-level reputation (`user_reviews`, `user_stats`). This unified audit merges overlapping concerns and clarifies a strategic path forward.

---
## 2. Current Components
| Component | Purpose |
|----------|---------|
| `game_reviews` | Per-game rating + optional comment |
| `user_reviews` | User-to-user rating (social/reputation) |
| `user_stats` | Performance metrics (ELO, games played) |
| Derived Views | Participant counts, leaderboards |
| Future (Planned) | Sentiment analysis, tag categorization |

---
## 3. Strategic Goals
1. Trust & Safety: Provide reliable indicators of host quality and participant behavior.
2. Discovery Enhancement: Surface high-quality games and reputable hosts.
3. Engagement: Encourage post-game reflection and feedback cycles.
4. Fairness: Avoid early rating volatility, prevent abuse, reduce bias.

---
## 4. Key Gaps
| Gap | Impact |
|-----|--------|
| Missing uniqueness constraints | Duplicate reviews inflate ratings |
| Lack of Bayesian smoothing | Early ratings distort averages |
| No sentiment/tag structure | Hard to categorize qualitative feedback |
| No review prompt flow | Low submission rate |
| No moderation tools | Toxic content risk |
| No composite reputation metric | Fragmented trust signals |

---
## 5. Data Model Enhancements
Add columns:
```sql
ALTER TABLE game_reviews ADD COLUMN sentiment TEXT;
ALTER TABLE game_reviews ADD COLUMN tags TEXT[];
ALTER TABLE user_reviews ADD COLUMN tags TEXT[];
```
Constraints:
```sql
ALTER TABLE game_reviews
ADD CONSTRAINT unique_game_reviewer UNIQUE (game_id, reviewer_user_id);

ALTER TABLE user_reviews
ADD CONSTRAINT unique_user_review_in_game UNIQUE (game_id, reviewer_user_id, target_user_id);
```

Future Table: `review_flags` for moderation.

---
## 6. Composite Reputation Formula (User)
```
CompositeReputation = (AdjUserRating * 0.45)
                    + (NormalizedELO * 0.30)
                    + (HostReliability * 0.15)
                    + (ParticipationQuality * 0.10)
```
Where:
- `AdjUserRating`: Bayesian adjusted average of `user_reviews.rating`
- `NormalizedELO`: ELO mapped to 0–5 scale
- `HostReliability`: Derived from cancellation rate & punctuality
- `ParticipationQuality`: Derived from retention & positive tags ratio

---
## 7. Bayesian Adjustment Examples
```sql
-- Global mean baseline assumed = 3.8, confidence constant C = 8
AdjustedUserRating = (8 * 3.8 + SUM(rating)) / (8 + COUNT(*));
AdjustedGameRating = (6 * 3.5 + SUM(rating)) / (6 + COUNT(*));
```
Materialized Views:
```sql
CREATE MATERIALIZED VIEW user_rating_mv AS
SELECT u.id AS user_id,
       (8 * 3.8 + COALESCE(SUM(ur.rating),0)) / (8 + COUNT(ur.id)) AS adjusted_user_rating,
       COUNT(ur.id) AS review_count
FROM users u
LEFT JOIN user_reviews ur ON ur.target_user_id = u.id
GROUP BY u.id;
```

---
## 8. API Surface (Unified)
| Endpoint | Purpose |
|----------|---------|
| `GET /ratings/user/:userId` | Composite reputation + raw stats |
| `GET /ratings/game/:gameId` | Adjusted rating + distribution |
| `POST /reviews/game` | Add game review |
| `POST /reviews/user` | Add user review |
| `POST /reviews/:type/:id/flag` | Flag review for moderation |
| `GET /reviews/user/:userId` | List user reviews |
| `GET /reviews/game/:gameId` | List game reviews |

Consider merging summary endpoints into `/ratings/*` namespace for clarity.

---
## 9. React Query Plan
```typescript
['ratings','user',userId]
['ratings','game',gameId]
['reviews','user',userId]
['reviews','game',gameId]
```
Mutations:
- `useAddGameReview()`
- `useAddUserReview()`
- `useFlagReview()`
Invalidations:
- On review add: invalidate both `reviews` and `ratings` namespaces.

---
## 10. Prompting & UX Flow
Events triggering review modals:
1. User viewed completed game they joined (within 24h)
2. User finishes 3rd game with same host (prompt host rating)
3. User receives ≥2 positive tags → suggest rating others (engagement driver)

UX Components:
- `GameReviewModal`
- `UserReviewQuickSheet`
- `HostQualityBadge`
- `ReputationScoreDisplay`

---
## 11. Moderation Pipeline (Phase 2)
Flow:
1. User flags review → row inserted into `review_flags`
2. Background job tallies flags per review
3. Threshold (≥3 flags) sets `is_hidden = true` (add column)
4. Admin dashboard lists hidden/flagged for manual action

Automated Checks (Future):
- Profanity filter before persistence
- Sentiment scoring + toxicity detection (NLP service)

---
## 12. Analytics & Instrumentation
Track:
- Review submission funnel (prompted → opened → submitted)
- Reputation distribution curves
- Correlation: reputation vs. game join rate
- Flag rate per 100 reviews
- Tag usage frequency (top positive/negative tags)

---
## 13. Performance Recommendations
- Index heavy join columns: `(game_id, reviewer_user_id)` and `(target_user_id, created_at)`
- Precompute composite reputation daily (unless real-time needs grow)
- Partition large review tables quarterly if growth exceeds thresholds (>5M rows)

---
## 14. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Early volatility | Bayesian smoothing constants |
| Biased tagging | Diversity prompts + review education |
| Abuse (harassment) | Flagging + moderation + rate limits |
| Performance overhead | Materialized views + periodic refresh |

---
## 15. Implementation Roadmap
Phase 1 (Week 1): Constraints, adjusted rating views, summary endpoints.  
Phase 2 (Week 2): UX prompts, composite reputation calculation, host badge.  
Phase 3 (Week 3): Tagging + sentiment column + analytics instrumentation.  
Phase 4 (Week 4+): Moderation pipeline, partitioning evaluation, NLP integration.

---
## 16. Success Metrics
- ≥55% of completed games with ≥1 review in 24h
- Composite reputation accessed in ≥25% of profile views
- Reduction in host cancellation rate by ≥10% within 2 months
- ≤2% of reviews flagged for abuse (after moderation tooling release)

---
**Next Action:** Implement Phase 1 migration and create initial `/ratings/*` endpoints returning Bayesian-adjusted values.
