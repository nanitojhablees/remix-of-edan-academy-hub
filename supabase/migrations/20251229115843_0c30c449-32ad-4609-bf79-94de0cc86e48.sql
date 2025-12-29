-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  certificate_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  grade DECIMAL(5,2) DEFAULT NULL,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
ON public.certificates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view certificates for their courses"
ON public.certificates
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = certificates.course_id
  AND courses.instructor_id = auth.uid()
));

CREATE POLICY "System can insert certificates"
ON public.certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to generate unique certificate code
CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _code TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: EDAN-XXXXXX-XXXX (alphanumeric)
    _code := 'EDAN-' || 
             upper(substr(md5(random()::text), 1, 6)) || '-' ||
             upper(substr(md5(random()::text), 1, 4));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM certificates WHERE certificate_code = _code) INTO _exists;
    
    EXIT WHEN NOT _exists;
  END LOOP;
  
  RETURN _code;
END;
$$;

-- Function to issue certificate when course is completed
CREATE OR REPLACE FUNCTION public.issue_certificate(
  _user_id UUID,
  _course_id UUID,
  _grade DECIMAL DEFAULT NULL
)
RETURNS certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _certificate certificates;
  _student_name TEXT;
  _course_title TEXT;
  _certificate_code TEXT;
BEGIN
  -- Check if certificate already exists
  SELECT * INTO _certificate
  FROM certificates
  WHERE user_id = _user_id AND course_id = _course_id;
  
  IF _certificate.id IS NOT NULL THEN
    RETURN _certificate;
  END IF;
  
  -- Get student name
  SELECT CONCAT(first_name, ' ', last_name) INTO _student_name
  FROM profiles
  WHERE user_id = _user_id;
  
  -- Get course title
  SELECT title INTO _course_title
  FROM courses
  WHERE id = _course_id;
  
  -- Generate unique code
  _certificate_code := generate_certificate_code();
  
  -- Insert certificate
  INSERT INTO certificates (user_id, course_id, certificate_code, student_name, course_title, grade)
  VALUES (_user_id, _course_id, _certificate_code, _student_name, _course_title, _grade)
  RETURNING * INTO _certificate;
  
  -- Add points for completing course
  PERFORM add_user_points(_user_id, 100, 'Curso completado: ' || _course_title, 'course', _course_id);
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (_user_id, '¡Certificado Disponible!', 
          'Has obtenido tu certificado del curso "' || _course_title || '"', 
          'achievement', '/dashboard/certificates');
  
  -- Check for badges
  PERFORM check_and_award_badges(_user_id);
  
  RETURN _certificate;
END;
$$;