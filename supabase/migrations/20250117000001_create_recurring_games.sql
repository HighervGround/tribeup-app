-- Create recurring games system for weekly/monthly tournaments and regular games
-- This migration creates the recurring game functionality with automatic generation

-- 1. Create recurring_game_templates table
CREATE TABLE IF NOT EXISTS public.recurring_game_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  sport text NOT NULL,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  cost text,
  max_players integer NOT NULL,
  description text,
  image_url text,
  
  -- Recurrence settings
  recurrence_type text NOT NULL CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly', 'custom')),
  recurrence_interval integer DEFAULT 1, -- Every X weeks/months
  day_of_week integer, -- 0=Sunday, 1=Monday, etc. (for weekly)
  day_of_month integer, -- 1-31 (for monthly)
  time_of_day time NOT NULL,
  
  -- Schedule bounds
  start_date date NOT NULL,
  end_date date, -- NULL means indefinite
  max_occurrences integer, -- Alternative to end_date
  
  -- Status and metadata
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT valid_day_of_month CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  CONSTRAINT valid_recurrence_settings CHECK (
    (recurrence_type = 'weekly' AND day_of_week IS NOT NULL AND day_of_month IS NULL) OR
    (recurrence_type = 'biweekly' AND day_of_week IS NOT NULL AND day_of_month IS NULL) OR
    (recurrence_type = 'monthly' AND day_of_month IS NOT NULL AND day_of_week IS NULL) OR
    (recurrence_type = 'custom')
  )
);

-- 2. Create recurring_game_instances table to track generated games
CREATE TABLE IF NOT EXISTS public.recurring_game_instances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.recurring_game_templates(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  instance_number integer NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(template_id, scheduled_date)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_templates_creator ON public.recurring_game_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_active ON public.recurring_game_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_start_date ON public.recurring_game_templates(start_date);
CREATE INDEX IF NOT EXISTS idx_recurring_instances_template ON public.recurring_game_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_recurring_instances_game ON public.recurring_game_instances(game_id);
CREATE INDEX IF NOT EXISTS idx_recurring_instances_date ON public.recurring_game_instances(scheduled_date);

-- 4. Enable RLS
ALTER TABLE public.recurring_game_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_game_instances ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for templates
CREATE POLICY "Users can view all recurring templates" ON public.recurring_game_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create recurring templates" ON public.recurring_game_templates
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their templates" ON public.recurring_game_templates
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete their templates" ON public.recurring_game_templates
  FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- 6. Create RLS policies for instances
CREATE POLICY "Users can view recurring instances" ON public.recurring_game_instances
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can manage recurring instances" ON public.recurring_game_instances
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Function to create recurring game template
CREATE OR REPLACE FUNCTION public.create_recurring_template(
  p_title text,
  p_sport text,
  p_location text,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_cost text DEFAULT 'Free',
  p_max_players integer DEFAULT 10,
  p_description text DEFAULT '',
  p_image_url text DEFAULT NULL,
  p_recurrence_type text DEFAULT 'weekly',
  p_recurrence_interval integer DEFAULT 1,
  p_day_of_week integer DEFAULT NULL,
  p_day_of_month integer DEFAULT NULL,
  p_time_of_day time DEFAULT '18:00',
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT NULL,
  p_max_occurrences integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  template_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Insert template
  INSERT INTO public.recurring_game_templates (
    creator_id, title, sport, location, latitude, longitude, cost, max_players,
    description, image_url, recurrence_type, recurrence_interval, day_of_week,
    day_of_month, time_of_day, start_date, end_date, max_occurrences
  ) VALUES (
    current_user_id, p_title, p_sport, p_location, p_latitude, p_longitude,
    p_cost, p_max_players, p_description, p_image_url, p_recurrence_type,
    p_recurrence_interval, p_day_of_week, p_day_of_month, p_time_of_day,
    p_start_date, p_end_date, p_max_occurrences
  ) RETURNING id INTO template_id;

  -- Generate initial games (next 8 weeks)
  PERFORM public.generate_recurring_games(template_id, 8);

  RETURN template_id;
END;
$$;

-- 8. Function to calculate next occurrence date
CREATE OR REPLACE FUNCTION public.calculate_next_occurrence(
  template_record public.recurring_game_templates,
  from_date date
)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  next_date date;
  days_until_target integer;
BEGIN
  CASE template_record.recurrence_type
    WHEN 'weekly' THEN
      -- Find next occurrence of the target day of week
      days_until_target := (template_record.day_of_week - EXTRACT(DOW FROM from_date)::integer) % 7;
      IF days_until_target = 0 AND from_date > template_record.start_date THEN
        days_until_target := 7; -- If it's the same day, move to next week
      END IF;
      next_date := from_date + (days_until_target + (template_record.recurrence_interval - 1) * 7);
      
    WHEN 'biweekly' THEN
      -- Same as weekly but every 2 weeks
      days_until_target := (template_record.day_of_week - EXTRACT(DOW FROM from_date)::integer) % 7;
      IF days_until_target = 0 AND from_date > template_record.start_date THEN
        days_until_target := 14; -- If it's the same day, move to next biweek
      ELSE
        days_until_target := days_until_target + (template_record.recurrence_interval - 1) * 14;
      END IF;
      next_date := from_date + days_until_target;
      
    WHEN 'monthly' THEN
      -- Next occurrence of the target day of month
      next_date := date_trunc('month', from_date) + interval '1 month' + (template_record.day_of_month - 1);
      -- Handle months with fewer days
      IF EXTRACT(DAY FROM next_date) != template_record.day_of_month THEN
        next_date := date_trunc('month', next_date) + interval '1 month' - interval '1 day';
      END IF;
      
    ELSE
      RAISE EXCEPTION 'Unsupported recurrence type: %', template_record.recurrence_type;
  END CASE;

  RETURN next_date;
END;
$$;

-- 9. Function to generate recurring games
CREATE OR REPLACE FUNCTION public.generate_recurring_games(
  template_id uuid,
  weeks_ahead integer DEFAULT 8
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record public.recurring_game_templates;
  current_date date;
  end_generation_date date;
  next_occurrence_date date;
  instance_count integer := 0;
  generated_count integer := 0;
  new_game_id uuid;
BEGIN
  -- Get template
  SELECT * INTO template_record
  FROM public.recurring_game_templates
  WHERE id = template_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- Set generation bounds
  current_date := GREATEST(CURRENT_DATE, template_record.start_date);
  end_generation_date := CURRENT_DATE + (weeks_ahead * 7);
  
  -- Respect template end date if set
  IF template_record.end_date IS NOT NULL THEN
    end_generation_date := LEAST(end_generation_date, template_record.end_date);
  END IF;

  -- Get current instance count
  SELECT COALESCE(MAX(instance_number), 0) INTO instance_count
  FROM public.recurring_game_instances
  WHERE template_id = template_id;

  -- Generate games
  next_occurrence_date := public.calculate_next_occurrence(template_record, current_date);
  
  WHILE next_occurrence_date <= end_generation_date LOOP
    -- Check max occurrences limit
    IF template_record.max_occurrences IS NOT NULL AND 
       instance_count >= template_record.max_occurrences THEN
      EXIT;
    END IF;

    -- Check if instance already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.recurring_game_instances
      WHERE template_id = template_id AND scheduled_date = next_occurrence_date
    ) THEN
      -- Create the game
      INSERT INTO public.games (
        title, sport, date, time, location, latitude, longitude,
        cost, max_players, current_players, description, image_url, creator_id
      ) VALUES (
        template_record.title,
        template_record.sport,
        next_occurrence_date,
        template_record.time_of_day,
        template_record.location,
        template_record.latitude,
        template_record.longitude,
        template_record.cost,
        template_record.max_players,
        1, -- Creator is automatically a participant
        template_record.description,
        template_record.image_url,
        template_record.creator_id
      ) RETURNING id INTO new_game_id;

      -- Add creator as participant
      INSERT INTO public.game_participants (game_id, user_id)
      VALUES (new_game_id, template_record.creator_id);

      -- Create instance record
      instance_count := instance_count + 1;
      INSERT INTO public.recurring_game_instances (
        template_id, game_id, scheduled_date, instance_number
      ) VALUES (
        template_id, new_game_id, next_occurrence_date, instance_count
      );

      generated_count := generated_count + 1;
    END IF;

    -- Calculate next occurrence
    next_occurrence_date := public.calculate_next_occurrence(template_record, next_occurrence_date + 1);
  END LOOP;

  RETURN generated_count;
END;
$$;

-- 10. Function to update recurring template
CREATE OR REPLACE FUNCTION public.update_recurring_template(
  template_id uuid,
  updates jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.recurring_game_templates
    WHERE id = template_id AND creator_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;

  -- Update template (only allow certain fields)
  UPDATE public.recurring_game_templates
  SET
    title = COALESCE(updates->>'title', title),
    description = COALESCE(updates->>'description', description),
    location = COALESCE(updates->>'location', location),
    latitude = COALESCE((updates->>'latitude')::numeric, latitude),
    longitude = COALESCE((updates->>'longitude')::numeric, longitude),
    cost = COALESCE(updates->>'cost', cost),
    max_players = COALESCE((updates->>'max_players')::integer, max_players),
    image_url = COALESCE(updates->>'image_url', image_url),
    is_active = COALESCE((updates->>'is_active')::boolean, is_active),
    updated_at = now()
  WHERE id = template_id;

  RETURN true;
END;
$$;

-- 11. Function to cancel recurring template
CREATE OR REPLACE FUNCTION public.cancel_recurring_template(
  template_id uuid,
  cancel_future_games boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.recurring_game_templates
    WHERE id = template_id AND creator_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;

  -- Deactivate template
  UPDATE public.recurring_game_templates
  SET is_active = false, updated_at = now()
  WHERE id = template_id;

  -- Optionally cancel future games
  IF cancel_future_games THEN
    UPDATE public.recurring_game_instances
    SET status = 'cancelled'
    WHERE template_id = template_id 
      AND scheduled_date > CURRENT_DATE
      AND status = 'scheduled';
  END IF;

  RETURN true;
END;
$$;

-- 12. Function to generate games for all active templates (for scheduled job)
CREATE OR REPLACE FUNCTION public.generate_all_recurring_games()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record record;
  total_generated integer := 0;
  template_generated integer;
BEGIN
  FOR template_record IN 
    SELECT id FROM public.recurring_game_templates 
    WHERE is_active = true
  LOOP
    SELECT public.generate_recurring_games(template_record.id, 8) INTO template_generated;
    total_generated := total_generated + template_generated;
  END LOOP;

  RETURN total_generated;
END;
$$;

-- 13. Grant permissions
GRANT EXECUTE ON FUNCTION public.create_recurring_template(text, text, text, numeric, numeric, text, integer, text, text, text, integer, integer, integer, time, date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_next_occurrence(public.recurring_game_templates, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_recurring_games(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_recurring_template(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_recurring_template(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_all_recurring_games() TO service_role;
