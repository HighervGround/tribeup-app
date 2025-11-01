-- Validation queries for chat_messages_with_author setup
-- Run these after applying migrations to verify everything is correct

-- ============================================================================
-- 1) Verify view exists and columns match code expectations
-- ============================================================================
SELECT 
  'View columns check' AS check_name,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'game_id', 'user_id', 'message', 'created_at', 'display_name', 'username', 'avatar_url')
    THEN '✅ Expected column'
    ELSE '⚠️ Unexpected column'
  END AS status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chat_messages_with_author'
ORDER BY ordinal_position;

-- Expected 8 columns: id, game_id, user_id, message, created_at, display_name, username, avatar_url

-- ============================================================================
-- 2) Verify grants on view
-- ============================================================================
SELECT 
  'View grants check' AS check_name,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee IN ('authenticated', 'anon') AND privilege_type = 'SELECT'
    THEN '✅ Correct grant'
    ELSE '⚠️ Unexpected grant'
  END AS status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'chat_messages_with_author'
ORDER BY grantee, privilege_type;

-- Expected: authenticated SELECT, anon SELECT

-- ============================================================================
-- 3) Verify base table policies
-- ============================================================================
SELECT 
  'Chat messages policies' AS check_name,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' AND policyname LIKE '%participant%'
    THEN '✅ Participant-only SELECT policy'
    WHEN cmd = 'INSERT' AND policyname LIKE '%participant%'
    THEN '✅ Participant-only INSERT policy'
    WHEN cmd = 'DELETE' AND policyname LIKE '%delete%'
    THEN '✅ Delete own messages policy'
    WHEN cmd = 'ALL' AND policyname LIKE '%admin%'
    THEN '✅ Admin policy (expected)'
    WHEN cmd = 'SELECT' AND policyname LIKE '%all%'
    THEN '❌ BROAD SELECT POLICY - SHOULD BE REMOVED'
    ELSE '⚠️ Other policy'
  END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'chat_messages'
ORDER BY cmd, policyname;

-- Should see:
-- - chat_messages_select_participants_only (SELECT)
-- - chat_insert_participants_only (INSERT)
-- - chat_messages_delete_consolidated or similar (DELETE)
-- - admin_manage_all_messages (ALL, if admin support exists)
-- Should NOT see: "Anyone can view chat messages" or similar broad policies

-- ============================================================================
-- 4) Verify indexes for performance
-- ============================================================================
SELECT 
  'Index check' AS check_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%game_id%' OR indexname LIKE '%created_at%'
    THEN '✅ Performance index for queries/realtime'
    WHEN indexname LIKE '%user_id%'
    THEN '✅ Index for user lookups'
    WHEN indexname LIKE '%primary%' OR indexname LIKE '%pkey%'
    THEN '✅ Primary key index'
    ELSE 'ℹ️ Other index'
  END AS status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'chat_messages'
ORDER BY indexname;

-- Should have: idx_chat_messages_game_id_created_at or similar composite index

-- ============================================================================
-- 5) Test view query (should return structure, may be empty if no messages)
-- ============================================================================
SELECT 
  'View query test' AS check_name,
  COUNT(*) AS message_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ View is queryable'
    ELSE '❌ View query failed'
  END AS status
FROM public.chat_messages_with_author
LIMIT 1;

-- ============================================================================
-- 6) Verify user_public_profile join is working
-- ============================================================================
-- Check if view can properly join (this will error if join is broken)
SELECT 
  'Join validation' AS check_name,
  COUNT(*) AS messages_with_author_info,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Join working (or no messages exist)'
    ELSE '❌ Join failed'
  END AS status
FROM public.chat_messages_with_author
WHERE display_name IS NOT NULL OR username IS NOT NULL
LIMIT 1;

