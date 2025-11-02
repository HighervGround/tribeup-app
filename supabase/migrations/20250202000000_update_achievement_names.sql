-- Update achievement names and descriptions to use "activity" terminology
-- This migration updates existing achievement records in the database

UPDATE public.achievements 
SET 
  name = 'First Activity',
  description = 'Join your first activity'
WHERE name = 'First Game';

UPDATE public.achievements 
SET 
  name = 'Activity Host',
  description = 'Host your first activity'
WHERE name = 'Game Host';

UPDATE public.achievements 
SET 
  description = 'Join 10 activities'
WHERE name = 'Regular Player';

UPDATE public.achievements 
SET 
  description = 'Host 5 activities'
WHERE name = 'Community Builder';

UPDATE public.achievements 
SET 
  description = 'Join 25 activities'
WHERE name = 'Sports Enthusiast';

UPDATE public.achievements 
SET 
  description = 'Host 10 activities'
WHERE name = 'Event Organizer';

UPDATE public.achievements 
SET 
  description = 'Join 50 activities'
WHERE name = 'Veteran Player';

UPDATE public.achievements 
SET 
  description = 'Host 20 activities'
WHERE name = 'Community Leader';

