-- Fix search_path for calculate_level function
CREATE OR REPLACE FUNCTION public.calculate_level(points INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN points < 100 THEN 1
    WHEN points < 300 THEN 2
    WHEN points < 600 THEN 3
    WHEN points < 1000 THEN 4
    WHEN points < 1500 THEN 5
    WHEN points < 2500 THEN 6
    WHEN points < 4000 THEN 7
    WHEN points < 6000 THEN 8
    WHEN points < 9000 THEN 9
    ELSE 10
  END;
$$;