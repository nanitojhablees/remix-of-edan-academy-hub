import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  image_url: string | null;
  duration_hours: number;
  instructor_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  course?: Course;
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Course[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAllCourses() {
  return useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Course[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .maybeSingle();

      if (error) throw error;
      return data as Course | null;
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCourseModules(courseId: string | undefined) {
  return useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      return data as Module[];
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useModuleLessons(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["lessons", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMyEnrollments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data as (Enrollment & { course: Course })[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEnrollment(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["enrollment", courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return null;
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (error) throw error;
      return data as Enrollment | null;
    },
    enabled: !!user && !!courseId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEnrollInCourse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("No user");
      
      const { error } = await supabase
        .from("enrollments")
        .insert({ user_id: user.id, course_id: courseId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      toast({ title: "¡Inscripción exitosa!", description: "Ya puedes acceder al curso." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useLessonProgress(lessonId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lesson-progress", lessonId, user?.id],
    queryFn: async () => {
      if (!user || !lessonId) return null;
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!lessonId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useMarkLessonComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("No user");
      
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
    },
  });
}
