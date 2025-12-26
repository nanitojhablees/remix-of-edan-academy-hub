-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('operaciones', 'tecnologias', 'decisiones', 'analisis')),
  image_url TEXT,
  duration_hours INTEGER DEFAULT 0,
  instructor_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percent INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- COURSES policies
CREATE POLICY "Published courses are viewable by everyone" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all courses" ON public.courses FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Instructors can manage their courses" ON public.courses FOR ALL USING (instructor_id = auth.uid());

-- MODULES policies
CREATE POLICY "Modules are viewable if course is published" ON public.modules FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true));
CREATE POLICY "Admins can manage all modules" ON public.modules FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Instructors can manage their course modules" ON public.modules FOR ALL 
USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()));

-- LESSONS policies
CREATE POLICY "Lessons viewable if enrolled or admin" ON public.lessons FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id WHERE m.id = module_id AND c.is_published = true)
);
CREATE POLICY "Admins can manage all lessons" ON public.lessons FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Instructors can manage their course lessons" ON public.lessons FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id 
  WHERE m.id = module_id AND c.instructor_id = auth.uid()
));

-- ENROLLMENTS policies
CREATE POLICY "Users can view their enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.enrollments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Instructors can view enrollments for their courses" ON public.enrollments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()));

-- LESSON_PROGRESS policies
CREATE POLICY "Users can view their progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can modify their progress" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.lesson_progress FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses for the 4 EDAN levels
INSERT INTO public.courses (title, description, level, duration_hours, is_published) VALUES
('Operaciones EDAN - Nivel Básico', 'Fundamentos de evaluación de daños en operaciones de respuesta a emergencias y desastres.', 'operaciones', 20, true),
('Tecnologías Aplicables EDAN', 'Herramientas tecnológicas y sistemas de información para la evaluación de daños y análisis de necesidades.', 'tecnologias', 25, true),
('Toma de Decisiones en EDAN', 'Metodologías para la toma de decisiones basadas en datos de evaluación de emergencias.', 'decisiones', 30, true),
('Análisis de Datos EDAN Avanzado', 'Técnicas avanzadas de análisis estadístico y modelado para gestión de desastres.', 'analisis', 35, true);

-- Insert sample modules for first course
INSERT INTO public.modules (course_id, title, description, order_index)
SELECT id, 'Introducción a EDAN', 'Conceptos básicos y fundamentos de la metodología EDAN.', 1 FROM public.courses WHERE level = 'operaciones' LIMIT 1;

INSERT INTO public.modules (course_id, title, description, order_index)
SELECT id, 'Evaluación de Campo', 'Técnicas y procedimientos para evaluación en terreno.', 2 FROM public.courses WHERE level = 'operaciones' LIMIT 1;

INSERT INTO public.modules (course_id, title, description, order_index)
SELECT id, 'Reporte y Documentación', 'Elaboración de informes y documentación de daños.', 3 FROM public.courses WHERE level = 'operaciones' LIMIT 1;

-- Insert sample lessons for first module
INSERT INTO public.lessons (module_id, title, content, duration_minutes, order_index)
SELECT id, '¿Qué es EDAN?', 'La Evaluación de Daños y Análisis de Necesidades (EDAN) es una metodología sistemática...', 15, 1 
FROM public.modules WHERE title = 'Introducción a EDAN' LIMIT 1;

INSERT INTO public.lessons (module_id, title, content, duration_minutes, order_index)
SELECT id, 'Historia y Evolución', 'La metodología EDAN ha evolucionado desde sus orígenes en los años 80...', 20, 2 
FROM public.modules WHERE title = 'Introducción a EDAN' LIMIT 1;

INSERT INTO public.lessons (module_id, title, content, duration_minutes, order_index)
SELECT id, 'Principios Fundamentales', 'Los principios que rigen la aplicación de EDAN incluyen: objetividad, sistematización...', 25, 3 
FROM public.modules WHERE title = 'Introducción a EDAN' LIMIT 1;