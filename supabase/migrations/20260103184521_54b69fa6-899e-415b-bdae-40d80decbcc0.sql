-- Create lesson_comments table for discussions
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_instructor_reply BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment_likes table to track who liked what
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for lesson_comments

-- Anyone enrolled can view comments
CREATE POLICY "Enrolled users can view lesson comments"
ON public.lesson_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN enrollments e ON m.course_id = e.course_id
    WHERE l.id = lesson_comments.lesson_id AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE l.id = lesson_comments.lesson_id AND c.instructor_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Enrolled users can insert comments
CREATE POLICY "Enrolled users can create comments"
ON public.lesson_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN enrollments e ON m.course_id = e.course_id
      WHERE l.id = lesson_comments.lesson_id AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = lesson_comments.lesson_id AND c.instructor_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.lesson_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments, instructors and admins can delete any
CREATE POLICY "Users can delete their own comments"
ON public.lesson_comments FOR DELETE
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE l.id = lesson_comments.lesson_id AND c.instructor_id = auth.uid()
  )
);

-- Policies for comment_likes

-- Anyone can view likes
CREATE POLICY "Users can view likes"
ON public.comment_likes FOR SELECT
USING (true);

-- Users can like comments
CREATE POLICY "Users can like comments"
ON public.comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their likes
CREATE POLICY "Users can remove their likes"
ON public.comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lesson_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lesson_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_comments;