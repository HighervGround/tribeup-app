-- Create the send_game_reminders function for scheduled notifications
-- This function will be called by pg_cron every 5 minutes to send reminders

CREATE OR REPLACE FUNCTION public.send_game_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    game_record RECORD;
    participant_record RECORD;
    reminder_time TIMESTAMP WITH TIME ZONE;
    game_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current time
    reminder_time := NOW();
    
    -- Find games that start in the next 2 hours and haven't had reminders sent yet
    FOR game_record IN
        SELECT 
            g.id,
            g.title,
            g.date,
            g.time,
            g.location,
            g.creator_id
        FROM games g
        WHERE 
            -- Game starts within next 2 hours
            (g.date + g.time::time) BETWEEN reminder_time AND (reminder_time + INTERVAL '2 hours')
            -- Game hasn't started yet
            AND (g.date + g.time::time) > reminder_time
            -- No reminder sent yet (check if notification exists)
            AND NOT EXISTS (
                SELECT 1 FROM notifications n 
                WHERE n.data->>'game_id' = g.id::text 
                AND n.type = 'game_reminder'
                AND n.created_at > (reminder_time - INTERVAL '3 hours')
            )
    LOOP
        game_start_time := game_record.date + game_record.time::time;
        
        -- Send reminders to all participants
        FOR participant_record IN
            SELECT DISTINCT gp.user_id
            FROM game_participants gp
            WHERE gp.game_id = game_record.id
            UNION
            SELECT game_record.creator_id -- Include the host
        LOOP
            -- Insert notification for each participant
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data,
                created_at
            ) VALUES (
                participant_record.user_id,
                'game_reminder',
                'Game Starting Soon!',
                format('Your game "%s" starts in %s at %s', 
                    game_record.title,
                    CASE 
                        WHEN EXTRACT(EPOCH FROM (game_start_time - reminder_time)) < 3600 
                        THEN format('%s minutes', ROUND(EXTRACT(EPOCH FROM (game_start_time - reminder_time)) / 60))
                        ELSE format('%s hours', ROUND(EXTRACT(EPOCH FROM (game_start_time - reminder_time)) / 3600, 1))
                    END,
                    game_record.location
                ),
                jsonb_build_object(
                    'game_id', game_record.id,
                    'game_title', game_record.title,
                    'game_location', game_record.location,
                    'game_start_time', game_start_time,
                    'reminder_type', 'upcoming_game'
                ),
                reminder_time
            );
        END LOOP;
        
        -- Log that we processed this game
        RAISE NOTICE 'Sent reminders for game: % (ID: %)', game_record.title, game_record.id;
    END LOOP;
    
    -- Clean up old notifications (older than 30 days)
    DELETE FROM notifications 
    WHERE created_at < (reminder_time - INTERVAL '30 days');
    
    RAISE NOTICE 'Game reminders function completed at %', reminder_time;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.send_game_reminders() TO service_role;

-- Add comment
COMMENT ON FUNCTION public.send_game_reminders() IS 'Sends reminder notifications for games starting within 2 hours. Called by pg_cron scheduler.';
