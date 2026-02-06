-- Create scholarships table (types of scholarships)
CREATE TABLE public.scholarships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('full', 'partial', 'fixed')),
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount NUMERIC(10,2) CHECK (discount_amount >= 0),
  duration_months INTEGER NOT NULL DEFAULT 12,
  max_recipients INTEGER,
  current_recipients INTEGER NOT NULL DEFAULT 0,
  requirements TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scholarship_recipients table (students with scholarships)
CREATE TABLE public.scholarship_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
  notes TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for scholarships
CREATE POLICY "Admins can manage scholarships"
  ON public.scholarships FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active scholarships"
  ON public.scholarships FOR SELECT
  USING (is_active = true);

-- RLS policies for scholarship_recipients
CREATE POLICY "Admins can manage scholarship recipients"
  ON public.scholarship_recipients FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own scholarships"
  ON public.scholarship_recipients FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scholarship_recipients_updated_at
  BEFORE UPDATE ON public.scholarship_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add email setting for scholarship notifications
INSERT INTO public.email_settings (email_type, subject, description)
VALUES ('scholarship_granted', '¡Felicitaciones! Has recibido una beca EDAN', 'Email enviado cuando se asigna una beca a un estudiante');