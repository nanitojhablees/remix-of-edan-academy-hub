
-- Add price column to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;

-- Create enrollment_requests table
CREATE TABLE public.enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'transfer',
  receipt_url text,
  message text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "enrollment_requests_select_own" ON public.enrollment_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "enrollment_requests_insert_own" ON public.enrollment_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "enrollment_requests_admin_all" ON public.enrollment_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can view requests for their courses
CREATE POLICY "enrollment_requests_instructor_select" ON public.enrollment_requests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = enrollment_requests.course_id AND courses.instructor_id = auth.uid()
  ));

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-receipts bucket
CREATE POLICY "Anyone can view payment receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts');

CREATE POLICY "Authenticated users can upload payment receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts');
