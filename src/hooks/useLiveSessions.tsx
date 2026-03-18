import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface LiveSession {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  start_time: string;
  meeting_url: string;
  created_at: string;
}

export function useModuleLiveSessions(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["live-sessions", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("module_id", moduleId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as LiveSession[];
    },
    enabled: !!moduleId,
  });
}

// Fetch all live sessions for a course's modules (for Student View)
export function useCourseLiveSessions(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-live-sessions", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      // We do a nested select since live_sessions are tied to modules
      const { data, error } = await supabase
        .from("live_sessions")
        .select(`
          *,
          module:modules!inner(course_id)
        `)
        .eq("modules.course_id", courseId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as LiveSession[];
    },
    enabled: !!courseId,
  });
}

export function useCreateLiveSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { 
      module_id: string; 
      title: string; 
      description?: string; 
      start_time: string;
      meeting_url: string; 
    }) => {
      const { data, error } = await supabase
        .from("live_sessions")
        .insert([{
          module_id: params.module_id,
          title: params.title,
          description: params.description,
          start_time: params.start_time,
          meeting_url: params.meeting_url
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["live-sessions", variables.module_id] });
      toast({ title: "Clase en vivo agendada" });
    },
    onError: (error) => {
      toast({ title: "Error al agendar", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateLiveSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { 
      id: string; 
      module_id: string; 
      title: string; 
      description?: string; 
      start_time: string;
      meeting_url: string; 
    }) => {
      const { data, error } = await supabase
        .from("live_sessions")
        .update({
          title: params.title,
          description: params.description,
          start_time: params.start_time,
          meeting_url: params.meeting_url
        })
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["live-sessions", variables.module_id] });
      toast({ title: "Clase en vivo actualizada" });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteLiveSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { id: string; module_id: string }) => {
      const { error } = await supabase
        .from("live_sessions")
        .delete()
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["live-sessions", variables.module_id] });
      toast({ title: "Clase en vivo cancelada/eliminada" });
    },
    onError: (error) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    }
  });
}
