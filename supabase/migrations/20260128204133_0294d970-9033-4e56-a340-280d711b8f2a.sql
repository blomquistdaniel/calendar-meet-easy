-- Create function to generate unique short codes
CREATE OR REPLACE FUNCTION public.generate_short_code(length INT DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add new columns for short codes
ALTER TABLE public.polls 
  ADD COLUMN short_code TEXT UNIQUE,
  ADD COLUMN admin_short_code TEXT UNIQUE;

-- Backfill existing polls with short codes
UPDATE public.polls SET 
  short_code = public.generate_short_code(6),
  admin_short_code = public.generate_short_code(8)
WHERE short_code IS NULL;

-- Set defaults for new rows
ALTER TABLE public.polls 
  ALTER COLUMN short_code SET DEFAULT public.generate_short_code(6),
  ALTER COLUMN admin_short_code SET DEFAULT public.generate_short_code(8);

-- Make columns NOT NULL after backfill
ALTER TABLE public.polls 
  ALTER COLUMN short_code SET NOT NULL,
  ALTER COLUMN admin_short_code SET NOT NULL;