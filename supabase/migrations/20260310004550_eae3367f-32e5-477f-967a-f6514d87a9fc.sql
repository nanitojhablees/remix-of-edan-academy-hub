
-- Create module_materials table
CREATE TABLE public.module_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'link',
  file_size INTEGER DEFAULT 0,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_materials ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users
CREATE POLICY "module_materials_select" ON public.module_materials
  FOR SELECT TO authenticated USING (true);

-- INSERT: course instructor or admin
CREATE POLICY "module_materials_insert" ON public.module_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM modules m JOIN courses c ON m.course_id = c.id
      WHERE m.id = module_materials.module_id AND c.instructor_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- UPDATE: course instructor or admin
CREATE POLICY "module_materials_update" ON public.module_materials
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM modules m JOIN courses c ON m.course_id = c.id
      WHERE m.id = module_materials.module_id AND c.instructor_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE: course instructor or admin
CREATE POLICY "module_materials_delete" ON public.module_materials
  FOR DELETE TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM modules m JOIN courses c ON m.course_id = c.id
      WHERE m.id = module_materials.module_id AND c.instructor_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Storage policies for course-materials (ensure authenticated can upload)
CREATE POLICY "Course materials upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Course materials read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'course-materials');

CREATE POLICY "Course materials delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-materials');
