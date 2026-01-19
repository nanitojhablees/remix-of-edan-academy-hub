-- Email settings table for configuration
CREATE TABLE public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  subject TEXT NOT NULL,
  description TEXT,
  sender_email TEXT DEFAULT 'onboarding@resend.dev',
  sender_name TEXT DEFAULT 'EDAN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email logs table for tracking
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  user_id UUID,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_settings (admin only)
CREATE POLICY "Admins can manage email settings"
ON public.email_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for email_logs (admin only)
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Insert default email settings
INSERT INTO public.email_settings (email_type, subject, description) VALUES
  ('welcome', '¡Bienvenido a EDAN! 🎓', 'Se envía cuando un usuario se registra'),
  ('payment_confirmation', 'Tu pago ha sido confirmado ✅', 'Se envía tras completar un pago exitoso'),
  ('expiring_notification', 'Tu membresía está por vencer ⏰', 'Se envía 7, 3 y 1 día antes de expirar'),
  ('expired_notification', 'Tu membresía ha expirado', 'Se envía cuando la membresía expira'),
  ('suspension', 'Tu cuenta ha sido suspendida', 'Se envía cuando un admin suspende una cuenta'),
  ('reactivation', '¡Tu cuenta ha sido reactivada! 🎉', 'Se envía cuando se reactiva una cuenta'),
  ('renewal', 'Renovación de membresía confirmada 🔄', 'Se envía tras renovar la membresía');

-- Trigger for updated_at
CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();