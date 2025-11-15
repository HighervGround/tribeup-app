-- Schema Verification Script
-- Run this in Supabase SQL Editor to verify your database schema is correct
-- This script checks for critical columns and configurations

-- 1. Check game_participants table structure
SELECT 
    'game_participants Schema Check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'game_participants' 
            AND column_name = 'status'
        ) THEN '✅ status column exists'
        ELSE '❌ status column MISSING - Run migration!'
    END as status_check,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'game_participants' 
            AND column_name = 'joined_at'
        ) THEN '✅ joined_at column exists'
        ELSE '❌ joined_at column MISSING'
    END as joined_at_check,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'game_participants' 
            AND column_name = 'left_at'
        ) THEN '✅ left_at column exists'
        ELSE '❌ left_at column MISSING'
    END as left_at_check,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'game_participants' 
            AND column_name = 'play_time_minutes'
        ) THEN '✅ play_time_minutes column exists'
        ELSE '❌ play_time_minutes column MISSING'
    END as play_time_check;

-- 2. Check status column constraint
SELECT 
    'Status Constraint Check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu 
                ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'game_participants'
            AND ccu.column_name = 'status'
            AND cc.check_clause LIKE '%joined%'
            AND cc.check_clause LIKE '%left%'
            AND cc.check_clause LIKE '%completed%'
        ) THEN '✅ status constraint exists'
        ELSE '⚠️  status constraint may be missing or incomplete'
    END as constraint_check;

-- 3. Check RLS is enabled
SELECT 
    'RLS Check' as check_name,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS enabled'
        ELSE '❌ RLS NOT enabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'games', 'game_participants', 'chat_messages', 'notifications')
ORDER BY tablename;

-- 4. Check indexes exist
SELECT 
    'Index Check' as check_name,
    indexname,
    CASE 
        WHEN indexname IS NOT NULL THEN '✅ Index exists'
        ELSE '❌ Index missing'
    END as index_status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'game_participants'
AND indexname IN (
    'idx_game_participants_status',
    'idx_game_participants_user_id',
    'idx_game_participants_game_id',
    'idx_game_participants_joined_at'
);

-- 5. Check real-time replication
SELECT 
    'Real-time Replication Check' as check_name,
    schemaname,
    tablename,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename IN ('games', 'game_participants', 'chat_messages', 'notifications')
        ) THEN '✅ Table in real-time publication'
        ELSE '⚠️  Table may not be in real-time publication'
    END as replication_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('games', 'game_participants', 'chat_messages', 'notifications')
ORDER BY tablename;

-- 6. Sample data check (if data exists)
SELECT 
    'Data Integrity Check' as check_name,
    COUNT(*) as total_participants,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_count,
    COUNT(CASE WHEN status NOT IN ('joined', 'left', 'completed', 'no_show') THEN 1 END) as invalid_status_count
FROM game_participants;

-- Summary
SELECT 
    '=== SCHEMA VERIFICATION SUMMARY ===' as summary,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'game_participants' 
            AND column_name = 'status'
        ) 
        AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'game_participants' 
            AND column_name = 'joined_at'
        )
        THEN '✅ Schema appears correct - Ready for production!'
        ELSE '❌ Schema issues detected - Review results above and run migrations'
    END as overall_status;

