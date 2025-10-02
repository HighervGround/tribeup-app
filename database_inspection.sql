-- Comprehensive Database Inspection Script
-- Run this in Supabase SQL Editor to identify potential issues

-- ============================================================================
-- 1. CHECK RLS POLICIES AND PERMISSIONS
-- ============================================================================

-- Check tables without RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- Check policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    array_agg(DISTINCT cmd) as operations_covered
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Check for tables with missing DELETE policies (like the game_participants issue)
SELECT DISTINCT
    t.tablename,
    CASE WHEN p.cmd IS NULL THEN 'MISSING DELETE POLICY' ELSE 'HAS DELETE POLICY' END as delete_policy_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.cmd = 'DELETE'
WHERE t.schemaname = 'public'
AND t.tablename IN ('game_participants', 'games', 'users', 'profiles', 'notifications')
ORDER BY t.tablename;

-- ============================================================================
-- 2. CHECK INDEXES AND PERFORMANCE
-- ============================================================================

-- Find duplicate indexes
SELECT 
    schemaname,
    tablename,
    array_agg(indexname) as duplicate_indexes,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, indexdef
HAVING COUNT(*) > 1
ORDER BY tablename;

-- Check for missing indexes on foreign keys
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    CASE WHEN i.indexname IS NULL THEN 'MISSING INDEX' ELSE 'HAS INDEX' END as index_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes i 
    ON kcu.table_name = i.tablename 
    AND kcu.column_name = ANY(string_to_array(replace(i.indexdef, '(', ''), ')'))
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 3. CHECK DATA INTEGRITY
-- ============================================================================

-- Check for orphaned records in game_participants
SELECT 
    'game_participants -> users' as relationship,
    COUNT(*) as orphaned_records
FROM game_participants gp
LEFT JOIN users u ON gp.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'game_participants -> games' as relationship,
    COUNT(*) as orphaned_records
FROM game_participants gp
LEFT JOIN games g ON gp.game_id = g.id
WHERE g.id IS NULL

UNION ALL

-- Check for orphaned records in games
SELECT 
    'games -> users (creator)' as relationship,
    COUNT(*) as orphaned_records
FROM games g
LEFT JOIN users u ON g.creator_id = u.id
WHERE u.id IS NULL;

-- Check for games with inconsistent player counts
SELECT 
    g.id,
    g.title,
    g.current_players as stored_count,
    COUNT(gp.user_id) as actual_count,
    g.current_players - COUNT(gp.user_id) as count_difference
FROM games g
LEFT JOIN game_participants gp ON g.id = gp.game_id
GROUP BY g.id, g.title, g.current_players
HAVING g.current_players != COUNT(gp.user_id)
ORDER BY ABS(g.current_players - COUNT(gp.user_id)) DESC;

-- ============================================================================
-- 4. CHECK FUNCTIONS AND TRIGGERS
-- ============================================================================

-- List all custom functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER' 
        ELSE 'SECURITY INVOKER' 
    END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY p.proname;

-- Check for functions with multiple overloads (potential conflicts)
SELECT 
    proname as function_name,
    COUNT(*) as overload_count,
    array_agg(pg_get_function_arguments(oid)) as all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
GROUP BY proname
HAVING COUNT(*) > 1
ORDER BY overload_count DESC;

-- List all triggers
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    CASE t.tgtype & 2 
        WHEN 0 THEN 'AFTER' 
        ELSE 'BEFORE' 
    END as timing,
    CASE t.tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 12 THEN 'INSERT, DELETE'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 24 THEN 'DELETE, UPDATE'
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 5. CHECK COLUMN TYPES AND CONSTRAINTS
-- ============================================================================

-- Check for missing NOT NULL constraints on important columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('games', 'users', 'game_participants')
AND column_name IN ('id', 'created_at', 'user_id', 'game_id', 'creator_id')
AND is_nullable = 'YES'
ORDER BY table_name, column_name;

-- Check for missing unique constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    array_agg(kcu.column_name) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name;

-- ============================================================================
-- 6. STORAGE AND PERFORMANCE METRICS
-- ============================================================================

-- Table sizes and row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_tables t
JOIN pg_stat_user_tables s ON t.tablename = s.relname
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE WHEN idx_tup_read = 0 THEN 'UNUSED INDEX' ELSE 'USED' END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- ============================================================================
-- SUMMARY RECOMMENDATIONS
-- ============================================================================

SELECT 'DATABASE INSPECTION COMPLETE' as status,
       'Check results above for:' as note,
       '1. Missing RLS policies, 2. Orphaned data, 3. Duplicate indexes, 4. Unused indexes, 5. Function conflicts' as issues_to_review;
