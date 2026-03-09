
-- ============================================
-- CLEAN SLATE: courses RLS policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins and instructors can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins and course authors can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins and course owners can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage their courses" ON public.courses;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;

-- SELECT: all authenticated users
CREATE POLICY "courses_select" ON public.courses
  FOR SELECT TO authenticated USING (true);

-- INSERT: author or admin
CREATE POLICY "courses_insert" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = instructor_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- UPDATE: author or admin
CREATE POLICY "courses_update" ON public.courses
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = instructor_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE: author or admin
CREATE POLICY "courses_delete" ON public.courses
  FOR DELETE TO authenticated
  USING (
    auth.uid() = instructor_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- CLEAN SLATE: modules RLS policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;
DROP POLICY IF EXISTS "Instructors can manage their course modules" ON public.modules;
DROP POLICY IF EXISTS "Modules are viewable if course is published" ON public.modules;

-- SELECT: all authenticated users
CREATE POLICY "modules_select" ON public.modules
  FOR SELECT TO authenticated USING (true);

-- INSERT: course author or admin
CREATE POLICY "modules_insert" ON public.modules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- UPDATE: course author or admin
CREATE POLICY "modules_update" ON public.modules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE: course author or admin
CREATE POLICY "modules_delete" ON public.modules
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
