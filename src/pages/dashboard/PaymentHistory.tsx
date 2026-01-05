import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Calendar, CheckCircle, Clock, XCircle, AlertTriangle, Receipt } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  promo_code: string | null;
  created_at: string;
  plan: {
    name: string;
    duration_months: number;
  } | null;
}

interface UserSubscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  plan: {
    name: string;
    price: number;
    currency: string;
    duration_months: number;
  } | null;
}

const useUserPayments = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          currency,
          status,
          payment_method,
          promo_code,
          created_at,
          plan:payment_plans(name, duration_months)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserPayment[];
    },
    enabled: !!user?.id,
  });
};

const useUserSubscriptions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-subscriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          starts_at,
          expires_at,
          auto_renew,
          plan:payment_plans(name, price, currency, duration_months)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserSubscription[];
    },
    enabled: !!user?.id,
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
    case "active":
      return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> {status === "completed" ? "Completado" : "Activa"}</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
    case "expired":
      return <Badge className="bg-orange-500/20 text-orange-600 hover:bg-orange-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Vencida</Badge>;
    case "cancelled":
    case "failed":
      return <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30"><XCircle className="w-3 h-3 mr-1" /> {status === "cancelled" ? "Cancelado" : "Fallido"}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export default function PaymentHistory() {
  const { profile } = useAuth();
  const { data: payments, isLoading: loadingPayments } = useUserPayments();
  const { data: subscriptions, isLoading: loadingSubscriptions } = useUserSubscriptions();

  const activeSubscription = subscriptions?.find(s => s.status === "active");
  const totalPaid = payments?.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial de Pagos</h1>
        <p className="text-muted-foreground mt-1">
          Consulta tu historial de pagos y estado de membresía
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estado de Membresía</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSubscriptions ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {profile?.membership_status === "active" ? "Activa" : 
                   profile?.membership_status === "expired" ? "Vencida" : "Pendiente"}
                </div>
                {activeSubscription && (
                  <p className="text-xs text-muted-foreground">
                    Plan: {activeSubscription.plan?.name}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximo Vencimiento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSubscriptions ? (
              <Skeleton className="h-6 w-24" />
            ) : activeSubscription?.expires_at ? (
              <>
                <div className="text-2xl font-bold">
                  {format(new Date(activeSubscription.expires_at), "dd MMM yyyy", { locale: es })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeSubscription.auto_renew ? "Renovación automática activada" : "Sin renovación automática"}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalPaid, "USD")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payments?.filter(p => p.status === "completed").length || 0} pagos completados
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Payments and Subscriptions */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Todos tus pagos realizados en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.plan?.name || "Plan eliminado"}</p>
                            {payment.promo_code && (
                              <p className="text-xs text-muted-foreground">
                                Código: {payment.promo_code}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount, payment.currency)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes pagos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Suscripciones</CardTitle>
              <CardDescription>
                Todas tus suscripciones pasadas y actuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscriptions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Vencimiento</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.plan?.name || "Plan eliminado"}</p>
                            <p className="text-xs text-muted-foreground">
                              {subscription.plan?.duration_months} {subscription.plan?.duration_months === 1 ? "mes" : "meses"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(subscription.starts_at), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {subscription.expires_at 
                            ? format(new Date(subscription.expires_at), "dd/MM/yyyy", { locale: es })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="font-medium">
                          {subscription.plan 
                            ? formatCurrency(subscription.plan.price, subscription.plan.currency)
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(subscription.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes suscripciones registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
