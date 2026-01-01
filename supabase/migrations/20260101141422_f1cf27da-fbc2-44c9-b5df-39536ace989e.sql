-- Eliminar políticas restrictivas y crear permisivas para courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage their courses" ON public.courses;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;

-- Crear políticas PERMISSIVE (por defecto) para courses
CREATE POLICY "Admins can manage all courses" 
ON public.courses 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage their courses" 
ON public.courses 
FOR ALL 
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Published courses are viewable by everyone" 
ON public.courses 
FOR SELECT 
TO authenticated
USING (is_published = true);

-- También actualizar políticas de modules
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;
DROP POLICY IF EXISTS "Instructors can manage their course modules" ON public.modules;
DROP POLICY IF EXISTS "Modules are viewable if course is published" ON public.modules;

CREATE POLICY "Admins can manage all modules" 
ON public.modules 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage their course modules" 
ON public.modules 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = modules.course_id 
  AND courses.instructor_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = modules.course_id 
  AND courses.instructor_id = auth.uid()
));

CREATE POLICY "Modules are viewable if course is published" 
ON public.modules 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = modules.course_id 
  AND courses.is_published = true
));

-- Actualizar políticas de lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can manage their course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Lessons viewable if enrolled or admin" ON public.lessons;

CREATE POLICY "Admins can manage all lessons" 
ON public.lessons 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage their course lessons" 
ON public.lessons 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM modules m 
  JOIN courses c ON m.course_id = c.id 
  WHERE m.id = lessons.module_id 
  AND c.instructor_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM modules m 
  JOIN courses c ON m.course_id = c.id 
  WHERE m.id = lessons.module_id 
  AND c.instructor_id = auth.uid()
));

CREATE POLICY "Lessons viewable if course is published" 
ON public.lessons 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM modules m 
  JOIN courses c ON m.course_id = c.id 
  WHERE m.id = lessons.module_id 
  AND c.is_published = true
));