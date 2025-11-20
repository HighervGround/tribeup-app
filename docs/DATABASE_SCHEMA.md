# TribeUp Database Schema (Simplified Overview)

This document provides a simplified overview of the current TribeUp database schema, focusing on key tables, relationships, and fields likely involved in gameplay, user interactions, and analytics.

---
## 1. Core Entities

### users
- `id`: UUID (PK)
- `username`: Text (unique)
- `display_name`: Text
- `avatar_url`: Text (nullable)
- `bio`: Text (nullable)
- `created_at`: Timestamp (default now)
- `is_admin`: Boolean (default false)

### profiles
- `id`: UUID (PK, references users.id)
- `location`: Text (nullable)
- `sport_preferences`: JSON (nullable)
- `rating_overall`: Numeric (nullable)
- `updated_at`: Timestamp (default now)

### games
- `id`: UUID (PK)
- `host_user_id`: UUID (references users.id)
- `sport_type`: Text
- `start_time`: Timestamp
- `end_time`: Timestamp (nullable or derived via duration)
- `duration_minutes`: Integer (nullable; added in migration 20250111000000)
- `participant_limit`: Integer (nullable)
- `location_id`: UUID (references locations.id)
- `status`: Text (planned|active|completed|canceled)
- `is_recurring`: Boolean (default false)
- `recurrence_rule`: Text (nullable; RRULE format)
- `planned_route`: JSON or Text (added in migration 20250112000000)
- `created_at`: Timestamp (default now)

### game_participants
- `id`: UUID (PK)
- `game_id`: UUID (references games.id)
- `user_id`: UUID (references users.id)
- `joined_at`: Timestamp (default now)
- `role`: Text (player|host|viewer)
- `status`: Text (active|left|waitlisted)
- `rating_delta`: Integer (nullable)
- Added missing columns in migration 20250115000003

### locations
- `id`: UUID (PK)
- `name`: Text
- `latitude`: Numeric
- `longitude`: Numeric
- `address`: Text (nullable)
- `city`: Text (nullable)
- `state`: Text (nullable)
- `country`: Text (nullable)
- `created_at`: Timestamp (default now)

### weather_cache
- `id`: UUID (PK)
- `location_id`: UUID (references locations.id)
- `forecast_json`: JSONB
- `fetched_at`: Timestamp
- `source`: Text (e.g., openweather)

---
## 2. Extended User Systems

### user_presence
- `id`: UUID (PK)
- `user_id`: UUID (references users.id)
- `status`: Text (online|offline|in_game|away)
- `updated_at`: Timestamp (default now)

### user_stats
(Partitioned or separate subtables introduced in migrations 20250115000001)
- `user_id`: UUID (references users.id)
- `games_played`: Integer
- `games_hosted`: Integer
- `rating_elo`: Integer
- `win_loss_record`: JSON (wins, losses, draws)

### user_reviews
- `id`: UUID (PK)
- `reviewer_user_id`: UUID (references users.id)
- `target_user_id`: UUID (references users.id)
- `game_id`: UUID (references games.id, nullable)
- `rating`: Integer (1-5)
- `comment`: Text (nullable)
- `created_at`: Timestamp

### user_testing_feedback
- `id`: UUID (PK)
- `user_id`: UUID (nullable, references users.id)
- `session_id`: UUID (nullable)
- `feedback_type`: Text
- `feedback_text`: Text
- `created_at`: Timestamp

---
## 3. Game Enhancements

### game_reviews
- `id`: UUID (PK)
- `game_id`: UUID (references games.id)
- `reviewer_user_id`: UUID (references users.id)
- `rating`: Integer
- `comment`: Text (nullable)
- `created_at`: Timestamp

### waitlist_entries
(From waitlist system migration 20250117000000)
- `id`: UUID (PK)
- `game_id`: UUID (references games.id)
- `user_id`: UUID (references users.id)
- `position`: Integer
- `joined_at`: Timestamp

### game_reminders_queue
(From game reminders function migration 20250117000003)
- `id`: UUID (PK)
- `game_id`: UUID (references games.id)
- `user_id`: UUID (references users.id)
- `reminder_time`: Timestamp
- `sent`: Boolean (default false)

### recurring_games
(From recurring games migration 20250117000001)
- `id`: UUID (PK)
- `base_game_id`: UUID (references games.id)
- `occurrence_time`: Timestamp
- `created_at`: Timestamp

---
## 4. System Configuration

### system_config
(From system config migration 20250118000000)
- `id`: UUID (PK)
- `key`: Text (unique)
- `value`: JSONB
- `updated_at`: Timestamp

---
## 5. Derived Views & Analytics

### games_with_counts_view
- Provides aggregated count of participants per game
- Fields: `game_id`, `participant_count`, `waitlist_count`, possibly `host_user_id`, `start_time`
- Updated in two migrations for new fields (`duration_minutes`, `planned_route`)

### user_leaderboard_view
- Aggregates ELO or performance metrics
- Fields: `user_id`, `rating_elo`, `games_played`, `win_rate`

### location_popularity_view
- Ranks locations by usage
- Fields: `location_id`, `games_hosted`, `recent_activity_score`

### pending_game_reminders_view
- Lists upcoming reminders not yet sent
- Fields: `game_id`, `user_id`, `reminder_time`

---
## 6. Relationships Summary

- `users` 1:M `games` (host)
- `games` M:N `users` via `game_participants`
- `games` 1:M `waitlist_entries`
- `games` 1:M `game_reviews`
- `users` 1:M `user_reviews` (as reviewer)
- `users` 1:M `user_reviews` (as target)
- `users` 1:1 `profiles`
- `users` 1:M `user_presence` (latest row relevant)
- `games` 1:M `recurring_games` (base to occurrences)
- `locations` 1:M `games`
- `locations` 1:M `weather_cache`

---
## 7. Security & Policies (High-Level)

- Row Level Security (RLS) enforced on user-specific tables (e.g., `game_participants`, `user_reviews`)
- Policies likely include:
  - Allow users to select their own presence
  - Allow hosts to update games they created
  - Allow participants to read associated games and chat
  - Restrict reviews to users who attended the game

---
## 8. Audit & Migration Notes

Recent migrations added:
- Game duration field
- Planned route support
- Performance fixes (indexes, materialized views maybe)
- Admin policies for elevated access controls
- ELO matchmaking and waitlist systems
- Rating & review system for games and users
- System configuration table for dynamic settings
- User testing feedback collection table

Outstanding tasks:
- Verify indexes for high-volume tables (`game_participants`, `games`, `user_reviews`)
- Confirm RLS policies align with new tables (especially `system_config` and `user_testing_feedback`)
- Consider partitioning high-growth tables (e.g., `game_participants` by month)

---
## 9. Recommended Improvements

1. Add composite index on (`game_id`, `user_id`) in `game_participants` if not present.
2. Add partial index on `sent = false` in `game_reminders_queue`.
3. Normalize `sport_type` into a `sports` lookup table for consistency.
4. Add materialized view for active games with weather summary.
5. Introduce archival strategy for old `recurring_games` occurrences.
6. Add unique constraint for (`game_id`, `reviewer_user_id`) in `game_reviews`.
7. Add trigger to auto-update `user_stats` on game completion.
8. Consider JSON Schema validation for `planned_route` field.
9. Implement TTL cleanup for stale `weather_cache` entries.

---
## 10. Future Extensions

- Leaderboards segmented by sport type
- Geographic clustering of active games
- Enhanced attendance prediction (machine learning-ready table)
- Game performance snapshots for analytics pipeline

---
## Appendix: Missing Explicit Definitions

Some field names and table structures are inferred from migration filenames. Exact schema should be verified against actual SQL in `supabase/migrations/*` and introspected via Supabase dashboard.

Run a schema dump for confirmation:
```sql
-- Example: psql to list relevant tables
\dt games* user_* location* game_* system_config
```

---
**Last Reviewed:** 2025-02-02
