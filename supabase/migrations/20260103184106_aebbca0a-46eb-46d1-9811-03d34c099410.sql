-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials', 
  'course-materials', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']
);

-- Policy: Anyone can view course materials (public bucket)
CREATE POLICY "Anyone can view course materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-materials');

-- Policy: Instructors and admins can upload
CREATE POLICY "Instructors and admins can upload course materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials' 
  AND (
    public.has_role(auth.uid(), 'instructor') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Policy: Instructors and admins can update their uploads
CREATE POLICY "Instructors and admins can update course materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-materials' 
  AND (
    public.has_role(auth.uid(), 'instructor') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Policy: Instructors and admins can delete their uploads
CREATE POLICY "Instructors and admins can delete course materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-materials' 
  AND (
    public.has_role(auth.uid(), 'instructor') 
    OR public.has_role(auth.uid(), 'admin')
  )
);