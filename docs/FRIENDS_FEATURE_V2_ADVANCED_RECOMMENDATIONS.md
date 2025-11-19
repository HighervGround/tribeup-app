# Friends Feature V2: Advanced Recommendations & Social Growth

Date: February 2, 2025  
Status: Expansion Plan (Post-Friendship Launch)

---
## 1. Objective
Boost social graph density and engagement via intelligent follow/friend recommendations leveraging activity, proximity, preference, and behavioral similarity signals.

---
## 2. Recommendation Categories
| Category | Description | Primary Data Sources |
|----------|-------------|----------------------|
| Shared Activity | Users who co-participated in games | `game_participants`, `games` |
| Sport Preference Match | Similar interests (e.g., basketball + running) | `profiles.sport_preferences` JSON |
| Location Proximity | Same city/state or nearby coordinates | `profiles.location`, `locations` |
| Engagement Patterns | High participation overlap or similar cadence | `user_stats`, `game_participants` |
| Emerging Hosts | New hosts with growing reliability | `games`, `user_stats` |
| Social Bridges | Users followed by many you follow | `user_follows` |

---
## 3. Data Preparation
### A. Similarity Views
```sql
CREATE MATERIALIZED VIEW user_game_similarity_mv AS
SELECT a.user_id AS user_a,
       b.user_id AS user_b,
       COUNT(*) AS shared_games,
       COUNT(*)::float / NULLIF(a.total_games + b.total_games - COUNT(*),0) AS jaccard_participation
FROM (
  SELECT user_id, COUNT(*) AS total_games FROM game_participants GROUP BY user_id
) a
JOIN game_participants gp1 ON gp1.user_id = a.user_id
JOIN game_participants gp2 ON gp2.game_id = gp1.game_id
JOIN (
  SELECT user_id, COUNT(*) AS total_games FROM game_participants GROUP BY user_id
) b ON b.user_id = gp2.user_id
WHERE a.user_id <> b.user_id
GROUP BY a.user_id, b.user_id, a.total_games, b.total_games;
```

### B. Sport Preference Similarity
Assuming JSON array of sports in `profiles.sport_preferences`:
```sql
CREATE MATERIALIZED VIEW user_sport_similarity_mv AS
SELECT p1.id AS user_a,
       p2.id AS user_b,
       (ARRAY_LENGTH(ARRAY(SELECT UNNEST(p1.sport_preferences) INTERSECT SELECT UNNEST(p2.sport_preferences)),1)::float /
        NULLIF(ARRAY_LENGTH(ARRAY(SELECT UNNEST(p1.sport_preferences) UNION SELECT UNNEST(p2.sport_preferences)),1),0)) AS sport_jaccard
FROM profiles p1
JOIN profiles p2 ON p1.id <> p2.id;
```

### C. Location Proximity (City Match)
```sql
CREATE MATERIALIZED VIEW user_location_similarity_mv AS
SELECT p1.id AS user_a,
       p2.id AS user_b,
       CASE WHEN p1.location IS NOT NULL AND p1.location = p2.location THEN 1 ELSE 0 END AS same_city
FROM profiles p1
JOIN profiles p2 ON p1.id <> p2.id;
```

---
## 4. Unified Recommendation Scoring
```sql
CREATE MATERIALIZED VIEW user_recommendation_score_mv AS
SELECT
  g.user_a AS user_a,
  g.user_b AS user_b,
  COALESCE(g.jaccard_participation,0) * 0.35
    + COALESCE(s.sport_jaccard,0) * 0.30
    + COALESCE(l.same_city,0) * 0.15
    + COALESCE(f.follow_bridge_score,0) * 0.20 AS composite_score,
  g.shared_games,
  s.sport_jaccard,
  l.same_city
FROM user_game_similarity_mv g
LEFT JOIN user_sport_similarity_mv s ON s.user_a = g.user_a AND s.user_b = g.user_b
LEFT JOIN user_location_similarity_mv l ON l.user_a = g.user_a AND l.user_b = g.user_b
LEFT JOIN (
  SELECT uf1.follower_user_id AS user_a,
         uf2.target_user_id AS user_b,
         COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM user_follows WHERE follower_user_id = uf1.follower_user_id),0) AS follow_bridge_score
  FROM user_follows uf1
  JOIN user_follows uf2 ON uf1.target_user_id = uf2.follower_user_id
  WHERE uf1.follower_user_id <> uf2.target_user_id
  GROUP BY uf1.follower_user_id, uf2.target_user_id
) f ON f.user_a = g.user_a AND f.user_b = g.user_b;
```

---
## 5. Backend Endpoint
`GET /relationships/recommendations?limit=20&cursor=...`
Response:
```json
[
  {
    "userId": "uuid",
    "displayName": "Alice",
    "score": 0.78,
    "sharedGames": 12,
    "sportSimilarity": 0.6,
    "sameCity": true,
    "reasons": ["Shared games", "Sport overlap", "City match"]
  }
]
```

Algorithm selects top N by `composite_score`, filters out:
- Already followed
- Already friends or blocked

---
## 6. React Query Integration
```typescript
const { data } = useQuery(['relationships','recommendations'], () => api.getRecommendations());
```

Refetch triggers:
- After a new follow
- After friend request accepted

---
## 7. UI Components
| Component | Purpose |
|-----------|---------|
| `RecommendedUsersList` | Displays ranked recommendations |
| `RecommendationReasonBadges` | Shows why user is recommended |
| `QuickFollowStrip` | One-tap follow all (with caution) |
| `RecommendationRefineControls` | Filters by sport, location |

---
## 8. Personalization Controls
User toggle settings:
- Hide recommendations (privacy preference)
- Emphasize local vs. sport similarity (weight sliders)
- Exclude sport types

Store preferences in `user_privacy_settings` or `user_recommendation_settings` table.

---
## 9. Performance & Refresh Strategy
- Refresh materialized views nightly (low churn acceptable)
- Consider incremental refresh for large row counts (future)
- Cache endpoint responses (5–15 min TTL)

---
## 10. Anti-Abuse & Quality Filters
Exclude users who:
- Are blocked by current user
- Have low reputation (< threshold composite)
- Have excessive recent blocks (signal potential abuse)

Add fallback: If < X recommendations above threshold, widen criteria (lower weights).

---
## 11. Metrics & Growth KPIs
Track:
- Recommendation click-through rate (CTR)
- Follow conversion rate post-view
- Retention lift for users engaging with recommendations
- Social graph density increase (% of users with ≥5 connections)

Targets:
- CTR ≥ 25%
- Follow conversion ≥ 15%
- +12% retention lift for engaged users by month 3

---
## 12. Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Filter bubble formation | Periodic diversity injection (random picks) |
| Over-recommendation fatigue | Cap daily exposures; rotate users |
| Privacy concerns | Opt-out + data transparency UI |
| Performance cost of joins | Materialized views + selective indexing |

---
## 13. Implementation Phases
Phase 1: Basic similarity (shared games + sport).  
Phase 2: Add follow bridge + city proximity.  
Phase 3: Composite scoring + API + UI list.  
Phase 4: Personalization controls + anti-abuse filters.  
Phase 5: Diversity injection + advanced analytics dashboard.

---
## 14. Index Recommendations
```sql
CREATE INDEX CONCURRENTLY idx_game_participants_user ON game_participants (user_id);
CREATE INDEX CONCURRENTLY idx_profiles_location ON profiles (location);
CREATE INDEX CONCURRENTLY idx_user_follows_follower ON user_follows (follower_user_id);
CREATE INDEX CONCURRENTLY idx_user_follows_target ON user_follows (target_user_id);
```

---
## 15. Success Criteria
- ≥30% of recommended users followed within 14 days
- +15% growth in average connections per user
- Recommendation-engaged cohort retention +10% vs. control

---
**Next Action:** Implement Phase 1 similarity materialized views; baseline endpoint returning shared activity + sport overlap recommendations.
