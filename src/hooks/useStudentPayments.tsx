import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PaymentPlan, PromoCode } from "@/hooks/usePayments";

export interface UserPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  promo_code: string | null;
  notes: string | null;
  created_at: string;
  plan?: {
    id: string;
    name: string;
    duration_months: number;
  };
}

export interface UserSubscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    duration_months: number;
    level: string | null;
  };
}

// Get active payment plans for students to purchase
export function useActivePaymentPlans() {
  return useQuery({
    queryKey: ["active-payment-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data as PaymentPlan[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Get current user's payments
export function useUserPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("payments")
        .select(`
          id, amount, currency, status, payment_method, 
          transaction_id, promo_code, notes, created_at,
          plan:payment_plans(id, name, duration_months, level)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserPayment[];
    },
    enabled: !!user?.id,
  });
}

// Get current user's subscriptions
export function useUserSubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-subscriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id, status, starts_at, expires_at, auto_renew,
          plan:payment_plans(id, name, price, currency, duration_months, level)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserSubscription[];
    },
    enabled: !!user?.id,
  });
}

// Get current active subscription
export function useActiveSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id, status, starts_at, expires_at, auto_renew,
          plan:payment_plans(id, name, price, currency, duration_months, level)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user?.id,
  });
}

// Validate and apply promo code
export function useValidatePromoCode() {
  return useMutation({
    mutationFn: async ({ code, planId }: { code: string; planId?: string }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Código promocional no válido");

      // Validate dates
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        throw new Error("Este código aún no es válido");
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        throw new Error("Este código ha expirado");
      }

      // Validate max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        throw new Error("Este código ha alcanzado su límite de usos");
      }

      // Validate plan restriction
      if (data.plan_id && planId && data.plan_id !== planId) {
        throw new Error("Este código no aplica para el plan seleccionado");
      }

      return data as PromoCode;
    },
  });
}

// Process payment and create subscription (simulated)
export function useProcessPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      amount,
      currency,
      promoCode,
    }: {
      planId: string;
      amount: number;
      currency: string;
      promoCode?: string;
    }) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from("payment_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) throw planError;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          plan_id: planId,
          amount,
          currency,
          status: "completed",
          payment_method: "card",
          transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          promo_code: promoCode || null,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Calculate subscription dates
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);

      // Create or update subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (existingSub) {
        // Extend existing subscription
        const currentExpiry = existingSub.expires_at ? new Date(existingSub.expires_at) : new Date();
        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + plan.duration_months);

        await supabase
          .from("subscriptions")
          .update({
            expires_at: newExpiry.toISOString(),
            payment_id: payment.id,
            plan_id: planId,
          })
          .eq("id", existingSub.id);
      } else {
        // Create new subscription
        await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_id: planId,
            payment_id: payment.id,
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: true,
          });
      }

      // Update profile membership status
      await supabase
        .from("profiles")
        .update({ membership_status: "active" })
        .eq("user_id", user.id);

      // Update promo code usage if used
      if (promoCode) {
        try {
          // Get current usage count and increment
          const { data: currentPromo } = await supabase
            .from("promo_codes")
            .select("current_uses")
            .eq("code", promoCode.toUpperCase())
            .single();
          
          if (currentPromo) {
            await supabase
              .from("promo_codes")
              .update({ current_uses: (currentPromo.current_uses || 0) + 1 })
              .eq("code", promoCode.toUpperCase());
          }
        } catch {
          // Ignore errors
        }
      }

      // Send payment confirmation email
      if (user.email && profile) {
        await supabase.functions.invoke("send-payment-confirmation", {
          body: {
            userId: user.id,
            userEmail: user.email,
            userName: `${profile.first_name} ${profile.last_name}`,
            amount,
            currency,
            planName: plan.name,
            transactionId: payment.transaction_id,
          },
        }).catch(console.error);
      }

      return { payment, plan };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payments"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["active-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "¡Pago exitoso!",
        description: "Tu membresía ha sido activada. Recibirás un email de confirmación.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error en el pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Toggle auto-renew setting
export function useToggleAutoRenew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ subscriptionId, autoRenew }: { subscriptionId: string; autoRenew: boolean }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ auto_renew: autoRenew })
        .eq("id", subscriptionId);

      if (error) throw error;
    },
    onSuccess: (_, { autoRenew }) => {
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["active-subscription"] });
      toast({
        title: autoRenew ? "Renovación automática activada" : "Renovación automática desactivada",
        description: autoRenew 
          ? "Tu membresía se renovará automáticamente antes de expirar."
          : "Deberás renovar manualmente tu membresía antes de que expire.",
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

// Download payment receipt
export function useDownloadReceipt() {
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-payment-receipt", {
        body: { 
          paymentId,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : "Usuario"
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Create download link
      const link = document.createElement("a");
      link.href = data.pdfUrl;
      link.download = `recibo-${data.transactionId}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Recibo generado",
        description: "El recibo se está descargando.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo generar el recibo: " + error.message,
        variant: "destructive",
      });
    },
  });
}
