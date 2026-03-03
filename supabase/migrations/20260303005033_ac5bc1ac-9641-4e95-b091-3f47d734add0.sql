-- Add image support to questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text;

-- Add advanced exam configuration
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT false;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS show_correct_answers boolean NOT NULL DEFAULT true;

-- Add constraint: passing_score minimum 70%
-- Using a validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_exam_passing_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.passing_score < 70 THEN
    RAISE EXCEPTION 'El porcentaje de aprobación no puede ser inferior al 70%%';
  END IF;
  IF NEW.passing_score > 100 THEN
    RAISE EXCEPTION 'El porcentaje de aprobación no puede ser superior al 100%%';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_exam_passing_score_trigger
  BEFORE INSERT OR UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_exam_passing_score();