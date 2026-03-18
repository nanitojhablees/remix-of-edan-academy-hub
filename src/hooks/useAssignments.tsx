import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Assignment {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  max_score: number;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  file_url: string | null;
  content: string | null;
  status: 'pending' | 'graded';
  score: number | null;
  feedback: string | null;
  created_at: string;
}

// Fetch assignments for a specific lesson
export function useLessonAssignments(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["assignments", lessonId],
    queryFn: async () => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("lesson_id", lessonId);

      if (error) throw error;
      return data as Assignment[];
    },
    enabled: !!lessonId,
  });
}

// Fetch submission for a specific assignment and current user
export function useMySubmission(assignmentId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["submission", assignmentId, user?.id],
    queryFn: async () => {
      if (!assignmentId || !user) return null;
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AssignmentSubmission | null;
    },
    enabled: !!assignmentId && !!user,
  });
}

// Instructor: Create assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { lesson_id: string; title: string; description?: string; max_score?: number }) => {
      const { data, error } = await supabase
        .from("assignments")
        .insert([{
          lesson_id: params.lesson_id,
          title: params.title,
          description: params.description,
          max_score: params.max_score || 100
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", variables.lesson_id] });
      toast({ title: "Tarea creada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al crear tarea", description: error.message, variant: "destructive" });
    }
  });
}

// Instructor: Update assignment
export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { id: string; lesson_id: string; title: string; description?: string; max_score?: number }) => {
      const { data, error } = await supabase
        .from("assignments")
        .update({
          title: params.title,
          description: params.description,
          max_score: params.max_score
        })
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", variables.lesson_id] });
      toast({ title: "Tarea actualizada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar tarea", description: error.message, variant: "destructive" });
    }
  });
}

// Instructor: Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { id: string; lesson_id: string }) => {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", variables.lesson_id] });
      toast({ title: "Tarea eliminada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al eliminar tarea", description: error.message, variant: "destructive" });
    }
  });
}

// Student: Submit assignment
export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { assignment_id: string; file_url?: string; content?: string }) => {
      if (!user) throw new Error("No user");
      
      const { data, error } = await supabase
        .from("assignment_submissions")
        .upsert([{
          assignment_id: params.assignment_id,
          user_id: user.id,
          file_url: params.file_url,
          content: params.content,
          status: 'pending' // Regresar a pending si resube
        }], { onConflict: 'assignment_id, user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["submission", variables.assignment_id, user?.id] });
      toast({ title: "Entrega enviada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
    }
  });
}
