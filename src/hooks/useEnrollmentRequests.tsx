import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface EnrollmentRequest {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  payment_method: string;
  receipt_url: string | null;
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  course?: { title: string; price: number };
  profile?: { first_name: string; last_name: string; avatar_url: string | null };
}

// Check if user has a pending request for a course
export function useEnrollmentRequest(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["enrollment-request", courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return null;
      const { data, error } = await supabase
        .from("enrollment_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as EnrollmentRequest | null;
    },
    enabled: !!user && !!courseId,
  });
}

// Admin: get all enrollment requests
export function useAllEnrollmentRequests() {
  return useQuery({
    queryKey: ["all-enrollment-requests"],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("enrollment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!requests || requests.length === 0) return [];

      // Fetch courses and profiles
      const courseIds = [...new Set(requests.map((r: any) => r.course_id))];
      const userIds = [...new Set(requests.map((r: any) => r.user_id))];

      const [{ data: courses }, { data: profiles }] = await Promise.all([
        supabase.from("courses").select("id, title, price").in("id", courseIds),
        supabase.from("profiles").select("user_id, first_name, last_name, avatar_url").in("user_id", userIds),
      ]);

      const courseMap = new Map(courses?.map((c: any) => [c.id, c]) || []);
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      return requests.map((r: any) => ({
        ...r,
        course: courseMap.get(r.course_id),
        profile: profileMap.get(r.user_id),
      })) as EnrollmentRequest[];
    },
  });
}

// Admin: approve or reject
export function useReviewEnrollmentRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, action, notes }: { requestId: string; action: "approved" | "rejected"; notes?: string }) => {
      if (!user) throw new Error("No user");

      // Update the request
      const { data: request, error: updateError } = await supabase
        .from("enrollment_requests")
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single();

      if (updateError) throw updateError;

      // If approved, create enrollment
      if (action === "approved" && request) {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert({
            user_id: request.user_id,
            course_id: request.course_id,
          });
        if (enrollError) throw enrollError;

        // Create notification for user
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          title: "¡Matrícula aprobada!",
          message: "Tu solicitud de matrícula ha sido aprobada. Ya puedes acceder al curso.",
          type: "info",
          link: `/dashboard/course/${request.course_id}`,
        });
      }

      if (action === "rejected" && request) {
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          title: "Solicitud de matrícula rechazada",
          message: notes || "Tu solicitud de matrícula ha sido rechazada. Contacta al administrador para más información.",
          type: "warning",
        });
      }

      return request;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["all-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-request"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      toast({
        title: variables.action === "approved" ? "Solicitud aprobada" : "Solicitud rechazada",
        description: variables.action === "approved" ? "El alumno ya tiene acceso al curso." : "La solicitud ha sido rechazada.",
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
