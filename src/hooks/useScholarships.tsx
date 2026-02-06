import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Scholarship {
  id: string;
  name: string;
  description: string | null;
  type: "full" | "partial" | "fixed";
  discount_percent: number | null;
  discount_amount: number | null;
  duration_months: number;
  max_recipients: number | null;
  current_recipients: number;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScholarshipRecipient {
  id: string;
  scholarship_id: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "revoked" | "pending";
  notes: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  updated_at: string;
  scholarship?: Scholarship;
}

export interface ScholarshipFormData {
  name: string;
  description?: string;
  type: "full" | "partial" | "fixed";
  discount_percent?: number;
  discount_amount?: number;
  duration_months: number;
  max_recipients?: number;
  requirements?: string;
  is_active: boolean;
}

export interface AssignScholarshipData {
  scholarship_id: string;
  user_id: string;
  starts_at?: string;
  notes?: string;
}

// Fetch all scholarships
export function useScholarships() {
  return useQuery({
    queryKey: ["scholarships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Scholarship[];
    },
  });
}

// Fetch active scholarships (for assignment)
export function useActiveScholarships() {
  return useQuery({
    queryKey: ["active-scholarships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      // Filter out scholarships that have reached max recipients
      return (data as Scholarship[]).filter(s => 
        s.max_recipients === null || s.current_recipients < s.max_recipients
      );
    },
  });
}

// Fetch all scholarship recipients
export function useScholarshipRecipients() {
  return useQuery({
    queryKey: ["scholarship-recipients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarship_recipients")
        .select(`
          *,
          scholarship:scholarships(*)
        `)
        .order("granted_at", { ascending: false });

      if (error) throw error;
      return data as ScholarshipRecipient[];
    },
  });
}

// Fetch user's active scholarship
export function useUserActiveScholarship(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-active-scholarship", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from("scholarship_recipients")
        .select(`
          *,
          scholarship:scholarships(*)
        `)
        .eq("user_id", targetUserId)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ScholarshipRecipient | null;
    },
    enabled: !!targetUserId,
  });
}

// Fetch user's scholarship history
export function useUserScholarships(userId: string) {
  return useQuery({
    queryKey: ["user-scholarships", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarship_recipients")
        .select(`
          *,
          scholarship:scholarships(*)
        `)
        .eq("user_id", userId)
        .order("granted_at", { ascending: false });

      if (error) throw error;
      return data as ScholarshipRecipient[];
    },
    enabled: !!userId,
  });
}

// Create scholarship
export function useCreateScholarship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ScholarshipFormData) => {
      const { data: result, error } = await supabase
        .from("scholarships")
        .insert({
          name: data.name,
          description: data.description || null,
          type: data.type,
          discount_percent: data.type === "partial" ? data.discount_percent : null,
          discount_amount: data.type === "fixed" ? data.discount_amount : null,
          duration_months: data.duration_months,
          max_recipients: data.max_recipients || null,
          requirements: data.requirements || null,
          is_active: data.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["active-scholarships"] });
      toast({
        title: "Beca creada",
        description: "La beca ha sido creada exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update scholarship
export function useUpdateScholarship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScholarshipFormData> }) => {
      const updateData: Record<string, unknown> = { ...data };
      
      if (data.type === "full") {
        updateData.discount_percent = null;
        updateData.discount_amount = null;
      } else if (data.type === "partial") {
        updateData.discount_amount = null;
      } else if (data.type === "fixed") {
        updateData.discount_percent = null;
      }

      const { error } = await supabase
        .from("scholarships")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["active-scholarships"] });
      toast({
        title: "Beca actualizada",
        description: "Los cambios han sido guardados.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete scholarship
export function useDeleteScholarship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scholarships")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["active-scholarships"] });
      toast({
        title: "Beca eliminada",
        description: "La beca ha sido eliminada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Assign scholarship to user
export function useAssignScholarship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AssignScholarshipData) => {
      // Get scholarship details
      const { data: scholarship, error: scholarshipError } = await supabase
        .from("scholarships")
        .select("*")
        .eq("id", data.scholarship_id)
        .single();

      if (scholarshipError) throw scholarshipError;

      // Check if user already has an active scholarship
      const { data: existingActive } = await supabase
        .from("scholarship_recipients")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (existingActive) {
        throw new Error("El usuario ya tiene una beca activa. Debe revocarla primero.");
      }

      // Calculate dates
      const startsAt = data.starts_at ? new Date(data.starts_at) : new Date();
      const expiresAt = new Date(startsAt);
      expiresAt.setMonth(expiresAt.getMonth() + scholarship.duration_months);

      // Create scholarship recipient
      const { data: recipient, error: recipientError } = await supabase
        .from("scholarship_recipients")
        .insert({
          scholarship_id: data.scholarship_id,
          user_id: data.user_id,
          granted_by: user?.id,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "active",
          notes: data.notes || null,
        })
        .select()
        .single();

      if (recipientError) throw recipientError;

      // Update scholarship current_recipients count
      await supabase
        .from("scholarships")
        .update({ current_recipients: scholarship.current_recipients + 1 })
        .eq("id", data.scholarship_id);

      // Update user's membership status to active
      await supabase
        .from("profiles")
        .update({ membership_status: "active" })
        .eq("user_id", data.user_id);

      // Create or extend subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, expires_at")
        .eq("user_id", data.user_id)
        .eq("status", "active")
        .maybeSingle();

      if (existingSub) {
        const currentExpiry = existingSub.expires_at ? new Date(existingSub.expires_at) : new Date();
        const newExpiry = new Date(Math.max(currentExpiry.getTime(), expiresAt.getTime()));
        
        await supabase
          .from("subscriptions")
          .update({ expires_at: newExpiry.toISOString() })
          .eq("id", existingSub.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            user_id: data.user_id,
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: false,
          });
      }

      // Send notification email
      try {
        const { data: userData } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", data.user_id)
          .single();

        const { data: userAuth } = await supabase.auth.admin.getUserById(data.user_id);
        
        if (userData && userAuth?.user?.email) {
          await supabase.functions.invoke("send-scholarship-email", {
            body: {
              userId: data.user_id,
              userEmail: userAuth.user.email,
              userName: `${userData.first_name} ${userData.last_name}`,
              scholarshipName: scholarship.name,
              startsAt: startsAt.toISOString(),
              expiresAt: expiresAt.toISOString(),
            },
          });
        }
      } catch (emailError) {
        console.error("Failed to send scholarship email:", emailError);
      }

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: data.user_id,
        title: "¡Felicitaciones! Has recibido una beca",
        message: `Se te ha otorgado la beca "${scholarship.name}". Tu membresía está activa hasta ${expiresAt.toLocaleDateString("es-ES")}.`,
        type: "achievement",
        link: "/dashboard/profile",
      });

      return recipient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["scholarship-recipients"] });
      queryClient.invalidateQueries({ queryKey: ["user-scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["user-active-scholarship"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Beca asignada",
        description: "La beca ha sido asignada exitosamente al usuario.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al asignar beca",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Revoke scholarship
export function useRevokeScholarship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ recipientId, reason }: { recipientId: string; reason: string }) => {
      const { data: recipient, error: fetchError } = await supabase
        .from("scholarship_recipients")
        .select("*, scholarship:scholarships(*)")
        .eq("id", recipientId)
        .single();

      if (fetchError) throw fetchError;

      // Update recipient status
      const { error: updateError } = await supabase
        .from("scholarship_recipients")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_reason: reason,
        })
        .eq("id", recipientId);

      if (updateError) throw updateError;

      // Decrease scholarship current_recipients
      if (recipient.scholarship) {
        await supabase
          .from("scholarships")
          .update({ 
            current_recipients: Math.max(0, recipient.scholarship.current_recipients - 1) 
          })
          .eq("id", recipient.scholarship_id);
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: recipient.user_id,
        title: "Beca revocada",
        message: `Tu beca "${recipient.scholarship?.name}" ha sido revocada. Motivo: ${reason}`,
        type: "warning",
        link: "/dashboard/profile",
      });

      return recipient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["scholarship-recipients"] });
      queryClient.invalidateQueries({ queryKey: ["user-scholarships"] });
      queryClient.invalidateQueries({ queryKey: ["user-active-scholarship"] });
      toast({
        title: "Beca revocada",
        description: "La beca ha sido revocada exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get scholarship statistics
export function useScholarshipStats() {
  return useQuery({
    queryKey: ["scholarship-stats"],
    queryFn: async () => {
      const [scholarshipsResult, recipientsResult] = await Promise.all([
        supabase.from("scholarships").select("id, is_active, max_recipients, current_recipients"),
        supabase.from("scholarship_recipients").select("id, status"),
      ]);

      if (scholarshipsResult.error) throw scholarshipsResult.error;
      if (recipientsResult.error) throw recipientsResult.error;

      const scholarships = scholarshipsResult.data;
      const recipients = recipientsResult.data;

      const activeScholarships = scholarships.filter(s => s.is_active).length;
      const activeRecipients = recipients.filter(r => r.status === "active").length;
      const availableSlots = scholarships
        .filter(s => s.is_active && (s.max_recipients === null || s.current_recipients < s.max_recipients))
        .length;

      return {
        totalScholarships: scholarships.length,
        activeScholarships,
        totalRecipients: recipients.length,
        activeRecipients,
        availableSlots,
      };
    },
  });
}
