-- Add constraint to validate mentor availability is a valid JSON array
ALTER TABLE public.mentors
ADD CONSTRAINT availability_must_be_array
CHECK (jsonb_typeof(availability) = 'array');

-- Add trigger function to validate availability structure more thoroughly
CREATE OR REPLACE FUNCTION public.validate_mentor_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  element jsonb;
BEGIN
  -- Check that availability is an array
  IF jsonb_typeof(NEW.availability) != 'array' THEN
    RAISE EXCEPTION 'Availability must be an array';
  END IF;
  
  -- Validate each element has required structure
  FOR element IN SELECT * FROM jsonb_array_elements(NEW.availability)
  LOOP
    -- Check that each element has 'day' as text and 'times' as array
    IF NOT (element ? 'day' AND element ? 'times') THEN
      RAISE EXCEPTION 'Each availability entry must have day and times fields';
    END IF;
    
    IF jsonb_typeof(element->'times') != 'array' THEN
      RAISE EXCEPTION 'Times must be an array';
    END IF;
    
    -- Validate day is one of valid values
    IF NOT (element->>'day' IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) THEN
      RAISE EXCEPTION 'Invalid day value: %', element->>'day';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate availability on insert and update
CREATE TRIGGER validate_mentor_availability_trigger
BEFORE INSERT OR UPDATE ON public.mentors
FOR EACH ROW
EXECUTE FUNCTION public.validate_mentor_availability();