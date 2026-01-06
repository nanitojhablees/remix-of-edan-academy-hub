import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_months: number;
  level: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  promo_code: string | null;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
  plan?: PaymentPlan;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  free_access: boolean;
  plan_id: string | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  plan?: PaymentPlan;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  payment_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
  plan?: PaymentPlan;
}

// Fetch all payments with related data
export function usePayments() {
  return useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("payments")
        .select(`
          *,
          plan:payment_plans(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each payment
      const userIds = [...new Set(payments?.map(p => p.user_id) || [])];
      if (userIds.length === 0) return [] as Payment[];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (payments || []).map(payment => ({
        ...payment,
        profile: profileMap.get(payment.user_id),
      })) as Payment[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch all payment plans
export function usePaymentPlans() {
  return useQuery({
    queryKey: ["payment-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      return data as PaymentPlan[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - plans don't change often
  });
}

// Fetch all promo codes
export function usePromoCodes() {
  return useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select(`
          *,
          plan:payment_plans(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });
}

// Fetch all subscriptions
export function useSubscriptions() {
  return useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plan:payment_plans(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each subscription
      const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])];
      if (userIds.length === 0) return [] as Subscription[];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (subscriptions || []).map(sub => ({
        ...sub,
        profile: profileMap.get(sub.user_id),
      })) as Subscription[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Payment statistics
export function usePaymentStats() {
  return useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const [payments, subscriptions] = await Promise.all([
        supabase.from("payments").select("amount, status, created_at"),
        supabase.from("subscriptions").select("status"),
      ]);

      if (payments.error) throw payments.error;
      if (subscriptions.error) throw subscriptions.error;

      const completedPayments = payments.data?.filter(p => p.status === "completed") || [];
      const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyRevenue = completedPayments
        .filter(p => new Date(p.created_at) >= thisMonth)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const activeSubscriptions = subscriptions.data?.filter(s => s.status === "active").length || 0;
      const expiredSubscriptions = subscriptions.data?.filter(s => s.status === "expired").length || 0;

      return {
        totalRevenue,
        monthlyRevenue,
        totalPayments: payments.data?.length || 0,
        completedPayments: completedPayments.length,
        pendingPayments: payments.data?.filter(p => p.status === "pending").length || 0,
        failedPayments: payments.data?.filter(p => p.status === "failed").length || 0,
        activeSubscriptions,
        expiredSubscriptions,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Create payment plan
export function useCreatePaymentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (plan: Partial<PaymentPlan>) => {
      const { data, error } = await supabase
        .from("payment_plans")
        .insert({
          name: plan.name!,
          description: plan.description,
          price: plan.price!,
          currency: plan.currency || "USD",
          duration_months: plan.duration_months || 12,
          level: plan.level,
          features: plan.features || [],
          is_active: plan.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-plans"] });
      toast({ title: "Plan creado", description: "El plan de pago se ha creado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Update payment plan
export function useUpdatePaymentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...plan }: Partial<PaymentPlan> & { id: string }) => {
      const { error } = await supabase
        .from("payment_plans")
        .update(plan)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-plans"] });
      toast({ title: "Plan actualizado", description: "El plan se ha actualizado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Create promo code
export function useCreatePromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (code: Partial<PromoCode>) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .insert({
          code: code.code!.toUpperCase(),
          discount_percent: code.discount_percent,
          discount_amount: code.discount_amount,
          free_access: code.free_access || false,
          plan_id: code.plan_id,
          max_uses: code.max_uses,
          valid_from: code.valid_from || new Date().toISOString(),
          valid_until: code.valid_until,
          is_active: code.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast({ title: "Código creado", description: "El código promocional se ha creado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Update promo code
export function useUpdatePromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...code }: Partial<PromoCode> & { id: string }) => {
      const { error } = await supabase
        .from("promo_codes")
        .update(code)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast({ title: "Código actualizado", description: "El código se ha actualizado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Update payment status
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...payment }: Partial<Payment> & { id: string }) => {
      const { error } = await supabase
        .from("payments")
        .update(payment)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({ title: "Pago actualizado", description: "El pago se ha actualizado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Update subscription
export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...subscription }: Partial<Subscription> & { id: string }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update(subscription)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "Suscripción actualizada", description: "La suscripción se ha actualizado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Renew subscription manually
export function useRenewSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ subscriptionId, months }: { subscriptionId: string; months: number }) => {
      // Get the subscription
      const { data: sub, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*, plan:payment_plans(*)")
        .eq("id", subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new expiration
      const currentExpiry = sub.expires_at ? new Date(sub.expires_at) : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      // Update subscription
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          expires_at: newExpiry.toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) throw error;

      // Update profile membership status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ membership_status: "active" })
        .eq("user_id", sub.user_id);

      if (profileError) throw profileError;

      return { newExpiry };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({ 
        title: "Suscripción renovada", 
        description: `La suscripción se ha renovado hasta ${new Date(data.newExpiry).toLocaleDateString()}.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Create manual payment
export function useCreateManualPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payment: {
      user_id: string;
      plan_id?: string;
      amount: number;
      notes?: string;
      createSubscription?: boolean;
    }) => {
      // Create payment
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          amount: payment.amount,
          status: "completed",
          payment_method: "manual",
          notes: payment.notes,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // If creating subscription
      if (payment.createSubscription && payment.plan_id) {
        const { data: plan } = await supabase
          .from("payment_plans")
          .select("duration_months")
          .eq("id", payment.plan_id)
          .single();

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + (plan?.duration_months || 12));

        await supabase.from("subscriptions").insert({
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          payment_id: paymentData.id,
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

        // Update profile
        await supabase
          .from("profiles")
          .update({ membership_status: "active" })
          .eq("user_id", payment.user_id);
      }

      return paymentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "Pago creado", description: "El pago manual se ha registrado exitosamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
