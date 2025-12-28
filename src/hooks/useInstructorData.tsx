import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { Course, Module, Lesson } from "./useCourses";

export interface StudentEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    country: string | null;
  };
  course?: Course;
}

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalLessons: number;
  averageProgress: number;
}

// Get instructor's own courses
export function useInstructorCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["instructor-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user,
  });
}

// Get students enrolled in instructor's courses
export function useInstructorStudents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["instructor-students", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get instructor's courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);

      if (coursesError) throw coursesError;
      if (!courses || courses.length === 0) return [];

      const courseIds = courses.map(c => c.id);

      // Get enrollments for those courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(*)
        `)
        .in("course_id", courseIds)
        .order("enrolled_at", { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Fetch profiles separately
      const userIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url, country")
        .in("user_id", userIds);

      // Map profiles to enrollments
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return enrollments?.map(e => ({
        ...e,
        profile: profileMap.get(e.user_id),
      })) as StudentEnrollment[];
    },
    enabled: !!user,
  });
}

// Get instructor statistics
export function useInstructorStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["instructor-stats", user?.id],
    queryFn: async (): Promise<InstructorStats> => {
      if (!user) return {
        totalCourses: 0,
        publishedCourses: 0,
        totalStudents: 0,
        totalLessons: 0,
        averageProgress: 0,
      };

      // Get courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, is_published")
        .eq("instructor_id", user.id);

      if (coursesError) throw coursesError;

      const courseIds = courses?.map(c => c.id) || [];
      const totalCourses = courses?.length || 0;
      const publishedCourses = courses?.filter(c => c.is_published)?.length || 0;

      if (courseIds.length === 0) {
        return {
          totalCourses: 0,
          publishedCourses: 0,
          totalStudents: 0,
          totalLessons: 0,
          averageProgress: 0,
        };
      }

      // Get enrollments count
      const { count: studentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIds);

      // Get modules and lessons count
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .in("course_id", courseIds);

      const moduleIds = modules?.map(m => m.id) || [];
      
      let lessonsCount = 0;
      if (moduleIds.length > 0) {
        const { count } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .in("module_id", moduleIds);
        lessonsCount = count || 0;
      }

      // Get average progress
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("progress_percent")
        .in("course_id", courseIds);

      const avgProgress = enrollments && enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / enrollments.length
        : 0;

      return {
        totalCourses,
        publishedCourses,
        totalStudents: studentsCount || 0,
        totalLessons: lessonsCount,
        averageProgress: Math.round(avgProgress),
      };
    },
    enabled: !!user,
  });
}

// Create a new course
export function useCreateCourse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      if (!user) throw new Error("No user");
      
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: courseData.title || "Nuevo Curso",
          description: courseData.description || "",
          level: courseData.level || "operaciones",
          instructor_id: user.id,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-stats"] });
      toast({ title: "Curso creado", description: "Ahora puedes añadir módulos y lecciones." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Update a course
export function useUpdateCourse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
      toast({ title: "Curso actualizado" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Create a module
export function useCreateModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, title, description, orderIndex }: { 
      courseId: string; 
      title: string; 
      description?: string;
      orderIndex?: number;
    }) => {
      const { data, error } = await supabase
        .from("modules")
        .insert({
          course_id: courseId,
          title,
          description: description || null,
          order_index: orderIndex || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modules", variables.courseId] });
      toast({ title: "Módulo creado" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Create a lesson
export function useCreateLesson() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, title, content, videoUrl, durationMinutes, orderIndex }: {
      moduleId: string;
      title: string;
      content?: string;
      videoUrl?: string;
      durationMinutes?: number;
      orderIndex?: number;
    }) => {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          module_id: moduleId,
          title,
          content: content || null,
          video_url: videoUrl || null,
          duration_minutes: durationMinutes || 0,
          order_index: orderIndex || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-stats"] });
      toast({ title: "Lección creada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Delete a course
export function useDeleteCourse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-stats"] });
      toast({ title: "Curso eliminado" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
