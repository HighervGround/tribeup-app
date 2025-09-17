-- PRODUCTION SECURITY SCRIPT
-- Run this script to remove development-only permissions before deploying to production

-- Remove anon EXECUTE permissions for dev functions (keep authenticated and service_role only)
REVOKE EXECUTE ON FUNCTION public.create_dev_user(uuid, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_dev_users() FROM anon;

-- Optional: Drop the dev functions entirely in production
-- Uncomment these lines if you want to completely remove dev tools in production:
-- DROP FUNCTION IF EXISTS public.create_dev_user(uuid, text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.get_dev_users();

-- Verify current permissions (for reference)
-- SELECT routine_name, grantee, privilege_type 
-- FROM information_schema.routine_privileges 
-- WHERE routine_name IN ('create_dev_user', 'get_dev_users');
