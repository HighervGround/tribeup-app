# Urgent Database Fixes Summary

Date: February 2, 2025
Status: Actionable Checklist (Prioritized)

This document consolidates critical database issues requiring immediate attention to ensure stability, performance, and data integrity.

---
## 1. High Priority (Execute Within 24-48 Hours)

### A. Missing Indexes on High-Volume Joins
Tables: `game_participants`, `games`, `user_reviews`
- Add composite indexes:
  - `game_participants (game_id, user_id)`
  - `game_participants (user_id, status)` (if status is frequently filtered)
  - `user_reviews (target_user_id, created_at)`
- Rationale: Reduces latency on participant listing, review aggregation.

### B. Waitlist Performance Degradation
Table: `waitlist_entries`
- Add index on `(game_id, position)`
- Validate uniqueness constraint on `(game_id, user_id)`
- Rationale: Fast retrieval of waitlist ordering and validation of duplicate entries.

### C. Reminder Queue Scalability
Table: `game_reminders_queue`
- Add partial index: `(sent) WHERE sent = false`
- Rationale: Speeds up selection of pending reminders.

### D. Data Integrity for Reviews
Table: `game_reviews`
- Add unique constraint: `(game_id, reviewer_user_id)`
- Rationale: Prevents duplicate reviews per game per user.

### E. Weather Cache Staleness
Table: `weather_cache`
- Add TTL process (scheduled function) to purge entries older than 6 hours.
- Rationale: Prevent stale forecast usage and reduce storage.

### F. User Stats Denormalization
Tables: `user_stats`, `games`, `game_participants`
- Add trigger on game completion to update `user_stats` (games_played, rating_elo adjustments).
- Rationale: Ensures real-time accuracy without cron lag.

---
## 2. Medium Priority (Execute Within 1-2 Weeks)

### A. Recurring Games Growth
Table: `recurring_games`
- Archive occurrences older than 90 days into `recurring_games_archive`.
- Add index on `(base_game_id, occurrence_time)`.
- Rationale: Keeps active table lean, improves lookup.

### B. System Config Access Patterns
Table: `system_config`
- Add unique index on `key` (if not enforced).
- Introduce caching layer at service level.
- Rationale: Faster config retrieval for high-frequency reads.

### C. Planned Route Validation
Table: `games (planned_route)`
- Implement JSON Schema validation via trigger or application-level check.
- Rationale: Prevent malformed route data.

### D. Presence Status Normalization
Table: `user_presence`
- Add index on `(status, updated_at)` for dashboard queries.
- Rationale: Improves active/away user listing performance.

### E. Location Popularity Metrics
Table: `games`, `locations`
- Create materialized view `location_activity_mv` aggregating games by location.
- Rationale: Reduces repeated aggregation work.

---
## 3. Low Priority (Execute Within 1-2 Months)

### A. Sport Type Normalization
Table: `games (sport_type)`
- Create lookup table `sports (id, code, name, category)`.
- Replace free-text with FK to `sports.id`.
- Rationale: Prevents inconsistent values and improves filtering.

### B. Historical Analytics Partitioning
Tables: `game_participants`, `user_reviews`
- Partition by month or quarter for archival scalability.
- Rationale: Prevents table bloat and improves vacuum efficiency.

### C. Leaderboard Optimization
Views: `user_leaderboard_view`
- Convert into materialized view refreshed periodically.
- Rationale: Faster leaderboard rendering.

### D. Weather Insight View
Tables: `games`, `weather_cache`
- Create view combining game start times and forecast snapshot.
- Rationale: Enables predictive analytics features.

### E. Review Sentiment Preprocessing
Table: `user_reviews`
- Add column `sentiment` populated by trigger or batch job.
- Rationale: Precomputes analytics for user reputation modeling.

---
## 4. Validation & Monitoring Additions

### A. Consistency Checks
Function: `validate_game_integrity()`
- Ensures participant_limit >= active participants
- Ensures recurring rule syntax correctness if `is_recurring = true`

### B. Dead Data Sweeps
Scheduled Task: `purge_inactive_presence_rows()`
- Removes presence rows not updated in > 24h

### C. Reminder Processing Monitor
View: `reminder_processing_lag_view`
- Shows time delta between `reminder_time` and processing timestamp

### D. Duplicate Detection
Function: `detect_duplicate_user_reviews()`
- Periodic scan for reviews missing uniqueness

---
## 5. Example SQL Snippets

```sql
-- Composite index for game participants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_participants_game_user
  ON game_participants (game_id, user_id);

-- Unique constraint for game reviews
ALTER TABLE game_reviews
  ADD CONSTRAINT unique_game_reviewer UNIQUE (game_id, reviewer_user_id);

-- Partial index for pending reminders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_reminders_pending
  ON game_reminders_queue (reminder_time)
  WHERE sent = false;

-- TTL cleanup function (weather)
CREATE OR REPLACE FUNCTION purge_stale_weather_cache() RETURNS void AS $$
BEGIN
  DELETE FROM weather_cache WHERE fetched_at < NOW() - INTERVAL '6 hours';
END;$$ LANGUAGE plpgsql;

-- Schedule TTL via pg_cron (if available)
SELECT cron.schedule('purge_weather_cache', '0 */6 * * *', $$SELECT purge_stale_weather_cache();$$);
```

---
## 6. Execution Plan

1. Apply high priority indexes & constraints (migration batch A).
2. Implement triggers for stats and weather TTL.
3. Verify no locking issues (use `CONCURRENTLY` where supported).
4. Deploy monitoring views & functions.
5. Stage medium priority improvements (batch B).
6. Plan partitioning strategy with historical data sample.

---
## 7. Risk Mitigation

- Use `CONCURRENTLY` for large table index creation.
- Run integrity validation scripts pre-migration.
- Backup critical tables (`games`, `game_participants`, `user_reviews`).
- Monitor slow queries via pg_stat_statements before & after.

---
## 8. Success Metrics

- Query latency reduction (target: -30% on participant/game joins).
- Reminder selection time < 50ms for pending tasks.
- Reduction in stale weather cache rows to near zero.
- Accurate real-time user stats post-game completion (<5s lag).

---
## 9. Ownership & Follow-Up

- DBA / Backend Engineer: Execute migrations.
- Monitoring Owner: Validate performance improvements.
- Product Owner: Confirm no regression in game scheduling or review flows.

---
**Next Action:** Begin High Priority migration scripts and validate via staging environment before production deployment.
