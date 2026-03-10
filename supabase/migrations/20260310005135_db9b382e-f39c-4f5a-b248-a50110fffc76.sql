
-- Fix exams RLS: Drop old policies that use is_course_instructor which doesn't check instructor_id
DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
DROP POLICY IF EXISTS "Instructors can manage their course exams" ON public.exams;
DROP POLICY IF EXISTS "Published exams viewable by enrolled students" ON public.exams;

-- Simple SELECT: all authenticated users can see exams
CREATE POLICY "exams_select" ON public.exams
  FOR SELECT TO authenticated USING (true);

-- INSERT: course instructor_id or admin
CREATE POLICY "exams_insert" ON public.exams
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM courses WHERE courses.id = exams.course_id AND courses.instructor_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- UPDATE: course instructor_id or admin
CREATE POLICY "exams_update" ON public.exams
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM courses WHERE courses.id = exams.course_id AND courses.instructor_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE: course instructor_id or admin
CREATE POLICY "exams_delete" ON public.exams
  FOR DELETE TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM courses WHERE courses.id = exams.course_id AND courses.instructor_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Also fix questions and answer_options RLS to use instructor_id instead of is_course_instructor
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
DROP POLICY IF EXISTS "Instructors can manage questions for their exams" ON public.questions;
DROP POLICY IF EXISTS "Questions viewable with exam access" ON public.questions;

CREATE POLICY "questions_select" ON public.questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "questions_manage" ON public.questions
  FOR ALL TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM exams e JOIN courses c ON e.course_id = c.id WHERE e.id = questions.exam_id AND c.instructor_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM exams e JOIN courses c ON e.course_id = c.id WHERE e.id = questions.exam_id AND c.instructor_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can manage all options" ON public.answer_options;
DROP POLICY IF EXISTS "Instructors can manage options for their questions" ON public.answer_options;
DROP POLICY IF EXISTS "Options viewable with question access" ON public.answer_options;

CREATE POLICY "answer_options_select" ON public.answer_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "answer_options_manage" ON public.answer_options
  FOR ALL TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id JOIN courses c ON e.course_id = c.id
      WHERE q.id = answer_options.question_id AND c.instructor_id = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id JOIN courses c ON e.course_id = c.id
      WHERE q.id = answer_options.question_id AND c.instructor_id = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  );
