-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answer options table
CREATE TABLE public.answer_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create exam attempts table
CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  passed BOOLEAN,
  answers JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Published exams viewable by enrolled students"
ON public.exams FOR SELECT
USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = exams.course_id 
    AND enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can manage their course exams"
ON public.exams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = exams.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Questions policies
CREATE POLICY "Questions viewable with exam access"
ON public.questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = questions.exam_id 
    AND exams.is_published = true
  )
);

CREATE POLICY "Instructors can manage questions for their exams"
ON public.questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM exams e
    JOIN courses c ON e.course_id = c.id
    WHERE e.id = questions.exam_id 
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all questions"
ON public.questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Answer options policies
CREATE POLICY "Options viewable with question access"
ON public.answer_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM questions q
    JOIN exams e ON q.exam_id = e.id
    WHERE q.id = answer_options.question_id 
    AND e.is_published = true
  )
);

CREATE POLICY "Instructors can manage options for their questions"
ON public.answer_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM questions q
    JOIN exams e ON q.exam_id = e.id
    JOIN courses c ON e.course_id = c.id
    WHERE q.id = answer_options.question_id 
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all options"
ON public.answer_options FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Exam attempts policies
CREATE POLICY "Users can view their attempts"
ON public.exam_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their attempts"
ON public.exam_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their attempts"
ON public.exam_attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view attempts for their courses"
ON public.exam_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams e
    JOIN courses c ON e.course_id = c.id
    WHERE e.id = exam_attempts.exam_id 
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all attempts"
ON public.exam_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to calculate and save exam score
CREATE OR REPLACE FUNCTION public.submit_exam(
  _attempt_id UUID,
  _answers JSONB
)
RETURNS exam_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt exam_attempts;
  _exam exams;
  _total_points INTEGER := 0;
  _earned_points INTEGER := 0;
  _score DECIMAL(5,2);
  _passed BOOLEAN;
  _answer RECORD;
  _correct_option_id UUID;
BEGIN
  -- Get the attempt
  SELECT * INTO _attempt FROM exam_attempts WHERE id = _attempt_id;
  IF _attempt IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  
  -- Get the exam
  SELECT * INTO _exam FROM exams WHERE id = _attempt.exam_id;
  
  -- Calculate score
  FOR _answer IN SELECT * FROM jsonb_to_recordset(_answers) AS x(question_id UUID, selected_option_id UUID)
  LOOP
    -- Get question points
    SELECT points INTO _total_points FROM questions WHERE id = _answer.question_id;
    _total_points := COALESCE(_total_points, 0);
    
    -- Check if answer is correct
    SELECT id INTO _correct_option_id 
    FROM answer_options 
    WHERE question_id = _answer.question_id AND is_correct = true
    LIMIT 1;
    
    IF _answer.selected_option_id = _correct_option_id THEN
      _earned_points := _earned_points + COALESCE((SELECT points FROM questions WHERE id = _answer.question_id), 1);
    END IF;
  END LOOP;
  
  -- Get total possible points
  SELECT COALESCE(SUM(points), 0) INTO _total_points 
  FROM questions 
  WHERE exam_id = _attempt.exam_id;
  
  -- Calculate percentage
  IF _total_points > 0 THEN
    _score := (_earned_points::DECIMAL / _total_points::DECIMAL) * 100;
  ELSE
    _score := 0;
  END IF;
  
  _passed := _score >= _exam.passing_score;
  
  -- Update attempt
  UPDATE exam_attempts
  SET 
    completed_at = now(),
    score = _score,
    passed = _passed,
    answers = _answers
  WHERE id = _attempt_id
  RETURNING * INTO _attempt;
  
  -- Award points if passed
  IF _passed THEN
    PERFORM add_user_points(_attempt.user_id, 50, 'Examen aprobado: ' || _exam.title, 'exam', _exam.id);
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (_attempt.user_id, '¡Examen Aprobado!', 
            'Has aprobado el examen "' || _exam.title || '" con ' || ROUND(_score) || '%', 
            'achievement', '/dashboard/my-courses');
  END IF;
  
  RETURN _attempt;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();