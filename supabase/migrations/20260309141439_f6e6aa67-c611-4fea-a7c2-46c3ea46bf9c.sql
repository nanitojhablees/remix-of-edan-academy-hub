
-- 1. Replace is_course_instructor to NOT query courses table (avoid recursion)
CREATE OR REPLACE FUNCTION public.is_course_instructor(_user_id uuid, _course_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_instructors WHERE course_id = _course_id AND user_id = _user_id
  )
$$;

-- 2. Drop all existing policies on courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage their courses" ON public.courses;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;

-- 3. Simple SELECT: all authenticated users can read all courses
CREATE POLICY "Authenticated users can view all courses"
ON public.courses FOR SELECT TO authenticated
USING (true);

-- 4. INSERT: owner or admin
CREATE POLICY "Admins and instructors can insert courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = instructor_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 5. UPDATE: owner, co-instructor, or admin
CREATE POLICY "Admins and course authors can update courses"
ON public.courses FOR UPDATE TO authenticated
USING (
  auth.uid() = instructor_id
  OR is_course_instructor(auth.uid(), id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 6. DELETE: owner or admin only
CREATE POLICY "Admins and course owners can delete courses"
ON public.courses FOR DELETE TO authenticated
USING (
  auth.uid() = instructor_id
  OR has_role(auth.uid(), 'admin'::app_role)
);
