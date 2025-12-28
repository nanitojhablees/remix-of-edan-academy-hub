-- =============================================
-- FASE 3: GAMIFICACIÓN, ANALYTICS Y NOTIFICACIONES
-- =============================================

-- Tabla de badges/insignias disponibles
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'award',
  category TEXT NOT NULL DEFAULT 'achievement',
  points_value INTEGER NOT NULL DEFAULT 10,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de badges obtenidos por usuarios
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Tabla de puntos del usuario
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historial de puntos ganados
CREATE TABLE public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de notificaciones
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de analytics de usuario (para tracking detallado)
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Badges policies (public read)
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User badges policies
CREATE POLICY "Users can view their badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all badges" ON public.user_badges FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User points policies
CREATE POLICY "Users can view their points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all points" ON public.user_points FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Points history policies
CREATE POLICY "Users can view their points history" ON public.points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert points history" ON public.points_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all points history" ON public.points_history FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User analytics policies
CREATE POLICY "Users can view their analytics" ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert analytics" ON public.user_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all analytics" ON public.user_analytics FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, criteria_type, criteria_value, points_value) VALUES
('Primer Paso', 'Completa tu primera lección', 'footprints', 'progress', 'lessons_completed', 1, 10),
('Estudiante Dedicado', 'Completa 10 lecciones', 'book-open', 'progress', 'lessons_completed', 10, 50),
('Maestro del Conocimiento', 'Completa 50 lecciones', 'graduation-cap', 'progress', 'lessons_completed', 50, 200),
('Curso Completado', 'Completa tu primer curso', 'award', 'achievement', 'courses_completed', 1, 100),
('Experto EDAN', 'Completa todos los cursos de un nivel', 'trophy', 'achievement', 'level_completed', 1, 500),
('Perfil Completo', 'Completa toda la información de tu perfil', 'user-check', 'profile', 'profile_complete', 1, 25),
('Racha de 7 días', 'Estudia 7 días consecutivos', 'flame', 'streak', 'study_streak', 7, 75),
('Madrugador', 'Estudia antes de las 8am', 'sunrise', 'special', 'early_study', 1, 30),
('Nocturno', 'Estudia después de las 10pm', 'moon', 'special', 'night_study', 1, 30),
('Velocista', 'Completa un curso en menos de una semana', 'zap', 'special', 'fast_completion', 1, 150);

-- Function to calculate user level based on points
CREATE OR REPLACE FUNCTION public.calculate_level(points INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN points < 100 THEN 1
    WHEN points < 300 THEN 2
    WHEN points < 600 THEN 3
    WHEN points < 1000 THEN 4
    WHEN points < 1500 THEN 5
    WHEN points < 2500 THEN 6
    WHEN points < 4000 THEN 7
    WHEN points < 6000 THEN 8
    WHEN points < 9000 THEN 9
    ELSE 10
  END;
$$;

-- Function to add points and update level
CREATE OR REPLACE FUNCTION public.add_user_points(
  _user_id UUID,
  _points INTEGER,
  _reason TEXT,
  _reference_type TEXT DEFAULT NULL,
  _reference_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_total INTEGER;
  _new_level INTEGER;
BEGIN
  -- Insert or update user_points
  INSERT INTO public.user_points (user_id, total_points, current_level)
  VALUES (_user_id, _points, calculate_level(_points))
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + _points,
    current_level = calculate_level(user_points.total_points + _points),
    updated_at = now()
  RETURNING total_points, current_level INTO _new_total, _new_level;
  
  -- Insert history
  INSERT INTO public.points_history (user_id, points, reason, reference_type, reference_id)
  VALUES (_user_id, _points, _reason, _reference_type, _reference_id);
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id UUID)
RETURNS SETOF public.badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _badge RECORD;
  _lessons_count INTEGER;
  _courses_count INTEGER;
BEGIN
  -- Count completed lessons
  SELECT COUNT(*) INTO _lessons_count
  FROM public.lesson_progress
  WHERE user_id = _user_id AND completed = true;
  
  -- Count completed courses
  SELECT COUNT(*) INTO _courses_count
  FROM public.enrollments
  WHERE user_id = _user_id AND completed_at IS NOT NULL;
  
  -- Check each badge
  FOR _badge IN 
    SELECT * FROM public.badges 
    WHERE id NOT IN (SELECT badge_id FROM public.user_badges WHERE user_id = _user_id)
  LOOP
    -- Check if user meets criteria
    IF (_badge.criteria_type = 'lessons_completed' AND _lessons_count >= _badge.criteria_value) OR
       (_badge.criteria_type = 'courses_completed' AND _courses_count >= _badge.criteria_value) THEN
      
      -- Award badge
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (_user_id, _badge.id);
      
      -- Add points
      PERFORM add_user_points(_user_id, _badge.points_value, 'Insignia: ' || _badge.name, 'badge', _badge.id);
      
      -- Create notification
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (_user_id, '¡Nueva Insignia!', 'Has obtenido la insignia "' || _badge.name || '"', 'achievement', '/dashboard/achievements');
      
      RETURN NEXT _badge;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;