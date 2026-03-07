
-- 1. Create course_instructors junction table for co-instructors
CREATE TABLE public.course_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'co_instructor',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE(course_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;

-- 3. Create helper function to check if user is instructor/co-instructor of a course
CREATE OR REPLACE FUNCTION public.is_course_instructor(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses WHERE id = _course_id AND instructor_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.course_instructors WHERE course_id = _course_id AND user_id = _user_id
  )
$$;

-- 4. RLS policies for course_instructors
CREATE POLICY "Admins can manage course_instructors"
  ON public.course_instructors FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Primary instructors can manage co-instructors"
  ON public.course_instructors FOR ALL
  USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_instructors.course_id AND instructor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE id = course_instructors.course_id AND instructor_id = auth.uid()));

CREATE POLICY "Co-instructors can view their assignments"
  ON public.course_instructors FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Update modules RLS to allow co-instructors
DROP POLICY IF EXISTS "Instructors can manage their course modules" ON public.modules;
CREATE POLICY "Instructors can manage their course modules"
  ON public.modules FOR ALL
  USING (is_course_instructor(auth.uid(), course_id))
  WITH CHECK (is_course_instructor(auth.uid(), course_id));

-- 6. Update lessons RLS to allow co-instructors
DROP POLICY IF EXISTS "Instructors can manage their course lessons" ON public.lessons;
CREATE POLICY "Instructors can manage their course lessons"
  ON public.lessons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM modules m WHERE m.id = lessons.module_id AND is_course_instructor(auth.uid(), m.course_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM modules m WHERE m.id = lessons.module_id AND is_course_instructor(auth.uid(), m.course_id)
  ));

-- 7. Update courses RLS to allow co-instructors to edit
DROP POLICY IF EXISTS "Instructors can manage their courses" ON public.courses;
CREATE POLICY "Instructors can manage their courses"
  ON public.courses FOR ALL
  USING (instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.course_instructors WHERE course_id = courses.id AND user_id = auth.uid()))
  WITH CHECK (instructor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.course_instructors WHERE course_id = courses.id AND user_id = auth.uid()));

-- 8. Update exams RLS for co-instructors
DROP POLICY IF EXISTS "Instructors can manage their course exams" ON public.exams;
CREATE POLICY "Instructors can manage their course exams"
  ON public.exams FOR ALL
  USING (is_course_instructor(auth.uid(), course_id));

-- 9. Update questions RLS for co-instructors
DROP POLICY IF EXISTS "Instructors can manage questions for their exams" ON public.questions;
CREATE POLICY "Instructors can manage questions for their exams"
  ON public.questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM exams e WHERE e.id = questions.exam_id AND is_course_instructor(auth.uid(), e.course_id)
  ));

-- 10. Update answer_options RLS for co-instructors
DROP POLICY IF EXISTS "Instructors can manage options for their questions" ON public.answer_options;
CREATE POLICY "Instructors can manage options for their questions"
  ON public.answer_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id
    WHERE q.id = answer_options.question_id AND is_course_instructor(auth.uid(), e.course_id)
  ));

-- 11. Update exam_attempts RLS for co-instructors
DROP POLICY IF EXISTS "Instructors can view attempts for their courses" ON public.exam_attempts;
CREATE POLICY "Instructors can view attempts for their courses"
  ON public.exam_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM exams e WHERE e.id = exam_attempts.exam_id AND is_course_instructor(auth.uid(), e.course_id)
  ));

-- 12. Update enrollments RLS for co-instructors
DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON public.enrollments;
CREATE POLICY "Instructors can view enrollments for their courses"
  ON public.enrollments FOR SELECT
  USING (is_course_instructor(auth.uid(), course_id));

-- 13. Update certificates RLS for co-instructors
DROP POLICY IF EXISTS "Instructors can view certificates for their courses" ON public.certificates;
CREATE POLICY "Instructors can view certificates for their courses"
  ON public.certificates FOR SELECT
  USING (is_course_instructor(auth.uid(), course_id));
