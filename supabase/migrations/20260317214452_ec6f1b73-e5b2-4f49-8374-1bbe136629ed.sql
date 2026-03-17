
-- Fix email_logs INSERT policy - restrict to authenticated users
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
CREATE POLICY "Authenticated can insert email logs" ON public.email_logs
FOR INSERT TO authenticated
WITH CHECK (true);
