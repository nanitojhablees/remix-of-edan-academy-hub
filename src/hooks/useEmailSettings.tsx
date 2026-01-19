import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailSetting {
  id: string;
  email_type: string;
  enabled: boolean;
  subject: string;
  description: string | null;
  sender_email: string;
  sender_name: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  recipient_name: string | null;
  user_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export const useEmailSettings = () => {
  return useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .order("email_type");
      
      if (error) throw error;
      return data as EmailSetting[];
    },
  });
};

export const useUpdateEmailSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<EmailSetting, "enabled" | "subject" | "sender_email" | "sender_name">> 
    }) => {
      const { data, error } = await supabase
        .from("email_settings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      toast.success("Configuración actualizada");
    },
    onError: (error) => {
      toast.error("Error al actualizar: " + error.message);
    },
  });
};

export const useEmailLogs = (filters?: { email_type?: string; status?: string }) => {
  return useQuery({
    queryKey: ["email-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);
      
      if (filters?.email_type) {
        query = query.eq("email_type", filters.email_type);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as EmailLog[];
    },
  });
};

export const useSendTestEmail = () => {
  return useMutation({
    mutationFn: async ({ emailType, recipientEmail }: { emailType: string; recipientEmail: string }) => {
      const functionMap: Record<string, string> = {
        welcome: "send-welcome-email",
        payment_confirmation: "send-payment-confirmation",
        expiring_notification: "send-expiring-notification",
        expired_notification: "send-expired-notification",
        suspension: "send-suspension-email",
        reactivation: "send-reactivation-email",
        renewal: "send-renewal-email",
      };

      const functionName = functionMap[emailType];
      if (!functionName) throw new Error("Tipo de email no soportado");

      // Get current user for test data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Prepare test data based on email type
      let testData: Record<string, unknown> = {
        userId: user.id,
        userName: "Usuario de Prueba",
      };

      if (emailType === "welcome") {
        testData = { email: recipientEmail, userName: "Usuario de Prueba" };
      } else if (emailType === "payment_confirmation") {
        testData = {
          ...testData,
          amount: 99.99,
          planName: "Plan Premium",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };
      } else if (emailType === "expiring_notification") {
        testData = {
          ...testData,
          daysRemaining: 3,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        };
      } else if (emailType === "renewal") {
        testData = {
          ...testData,
          newExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          months: 12,
        };
      } else if (emailType === "suspension") {
        testData = {
          ...testData,
          reason: "Este es un email de prueba",
        };
      } else if (emailType === "reactivation") {
        testData = {
          ...testData,
          previousStatus: "suspended",
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: testData,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Email de prueba enviado correctamente");
    },
    onError: (error) => {
      toast.error("Error al enviar email de prueba: " + error.message);
    },
  });
};

export const getEmailTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    welcome: "Bienvenida",
    payment_confirmation: "Confirmación de Pago",
    expiring_notification: "Aviso de Vencimiento",
    expired_notification: "Membresía Expirada",
    suspension: "Cuenta Suspendida",
    reactivation: "Cuenta Reactivada",
    renewal: "Renovación",
  };
  return labels[type] || type;
};

export const getEmailTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    welcome: "👋",
    payment_confirmation: "💳",
    expiring_notification: "⏰",
    expired_notification: "📅",
    suspension: "🚫",
    reactivation: "✅",
    renewal: "🔄",
  };
  return icons[type] || "📧";
};
