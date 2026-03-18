import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface MicroQuiz {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  created_at: string;
}

export function useLessonMicroQuizzes(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["micro-quizzes", lessonId],
    queryFn: async () => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from("micro_quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MicroQuiz[];
    },
    enabled: !!lessonId,
  });
}

export function useCreateMicroQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: { lesson_id: string; question: string; options: string[]; correct_answer: string; explanation?: string }) => {
      const { data, error } = await supabase.from("micro_quizzes").insert([params]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["micro-quizzes", variables.lesson_id] });
      toast({ title: "Micro-quiz creado" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
}

export function useDeleteMicroQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: { id: string; lesson_id: string }) => {
      const { error } = await supabase.from("micro_quizzes").delete().eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["micro-quizzes", variables.lesson_id] });
      toast({ title: "Quiz eliminado" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
}
