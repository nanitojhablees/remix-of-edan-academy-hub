-- Add tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_ip_address TEXT;

-- Admins can manage all enrollments (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update enrollments
CREATE POLICY "Admins can update enrollments"
  ON public.enrollments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete enrollments  
CREATE POLICY "Admins can delete enrollments"
  ON public.enrollments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all user badges
CREATE POLICY "Admins can manage all user badges"
  ON public.user_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete user badges
CREATE POLICY "Admins can delete user badges"
  ON public.user_badges FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));