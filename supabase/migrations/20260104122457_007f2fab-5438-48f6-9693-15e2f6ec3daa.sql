
-- Create payment plans table for subscription tiers
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_months INTEGER NOT NULL DEFAULT 12,
  level TEXT, -- NULL for full access, or specific level (operaciones, tecnologias, decisiones, analisis)
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments/transactions table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.payment_plans(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method TEXT, -- stripe, paypal, manual, promo_code
  transaction_id TEXT, -- External payment provider ID
  promo_code TEXT,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER, -- Percentage discount
  discount_amount DECIMAL(10,2), -- Fixed amount discount
  free_access BOOLEAN DEFAULT false, -- Grants free access
  plan_id UUID REFERENCES public.payment_plans(id), -- NULL for all plans
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table for tracking active memberships
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.payment_plans(id),
  payment_id UUID REFERENCES public.payments(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled, suspended
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Payment plans: Anyone can view active plans, only admins can manage
CREATE POLICY "Anyone can view active payment plans"
ON public.payment_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage payment plans"
ON public.payment_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Payments: Users see own, admins see all
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Promo codes: Anyone can view active codes (to validate), admins manage
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions: Users see own, admins see all
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_payment_plans_updated_at
BEFORE UPDATE ON public.payment_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment plans
INSERT INTO public.payment_plans (name, description, price, duration_months, level, features) VALUES
('Membresía Anual Completa', 'Acceso completo a los 4 niveles durante 1 año', 99.00, 12, NULL, '["Acceso a los 4 niveles", "Certificados digitales", "Soporte de instructores", "Comunidad exclusiva"]'),
('Nivel Operaciones', 'Acceso al nivel de Operaciones', 29.00, 12, 'operaciones', '["Acceso nivel Operaciones", "Certificado digital", "Soporte básico"]'),
('Nivel Tecnologías', 'Acceso al nivel de Tecnologías', 29.00, 12, 'tecnologias', '["Acceso nivel Tecnologías", "Certificado digital", "Soporte básico"]'),
('Nivel Decisiones', 'Acceso al nivel de Decisiones', 29.00, 12, 'decisiones', '["Acceso nivel Decisiones", "Certificado digital", "Soporte básico"]'),
('Nivel Análisis', 'Acceso al nivel de Análisis', 29.00, 12, 'analisis', '["Acceso nivel Análisis", "Certificado digital", "Soporte básico"]'),
('Membresía Mensual', 'Acceso completo mensual', 12.00, 1, NULL, '["Acceso a los 4 niveles", "Certificados digitales", "Soporte de instructores"]');
