
-- 1. Drop the restrictive level check constraint
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_check;

-- 2. Drop existing RLS policies on courses
DROP POLICY IF EXISTS "courses_select" ON public.courses;
DROP POLICY IF EXISTS "courses_insert" ON public.courses;
DROP POLICY IF EXISTS "courses_update" ON public.courses;
DROP POLICY IF EXISTS "courses_delete" ON public.courses;

-- 3. Recreate simplified RLS policies
CREATE POLICY "courses_select" ON public.courses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "courses_insert" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = instructor_id OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "courses_update" ON public.courses
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = instructor_id OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "courses_delete" ON public.courses
  FOR DELETE TO authenticated
  USING (
    auth.uid() = instructor_id OR has_role(auth.uid(), 'admin'::app_role)
  );
