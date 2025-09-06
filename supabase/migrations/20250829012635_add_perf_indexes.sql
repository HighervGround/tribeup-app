-- Performance indexes for faster feeds and lookups
--
-- Notes:
-- - Avoid CONCURRENTLY in Supabase migrations since they run in a transaction.
-- - IF NOT EXISTS ensures idempotency when re-running.

-- Games table indexes
CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games (created_at);
CREATE INDEX IF NOT EXISTS idx_games_date ON public.games (date);
CREATE INDEX IF NOT EXISTS idx_games_sport ON public.games (sport);
-- Composite to speed recommended feed: filter by sport, order by date
CREATE INDEX IF NOT EXISTS idx_games_sport_date ON public.games (sport, date);

-- Game participants lookup indexes
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON public.game_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON public.game_participants (game_id);

-- Optional: if you frequently query upcoming games only, a partial index can help
-- Uncomment if most queries filter for future dates. Adjust NOW() timezone considerations as needed.
-- CREATE INDEX IF NOT EXISTS idx_games_future_date ON public.games (date) WHERE date >= CURRENT_DATE;
