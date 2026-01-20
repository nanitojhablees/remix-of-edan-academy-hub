import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Calendar, CheckCircle, Clock, XCircle, AlertTriangle, Receipt, Download, RefreshCw, Search, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembershipAlert } from "@/components/dashboard/MembershipAlert";
import { 
  useUserPayments, 
  useUserSubscriptions, 
  useActiveSubscription,
  useDownloadReceipt,
  useToggleAutoRenew
} from "@/hooks/useStudentPayments";
import { useAuth } from "@/hooks/useAuth";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
    case "active":
      return <Badge className="bg-accent/20 text-accent hover:bg-accent/30"><CheckCircle className="w-3 h-3 mr-1" /> {status === "completed" ? "Completado" : "Activa"}</Badge>;
    case "pending":
      return <Badge className="bg-[hsl(var(--edan-orange))]/20 text-[hsl(var(--edan-orange))] hover:bg-[hsl(var(--edan-orange))]/30"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
    case "expired":
      return <Badge className="bg-[hsl(var(--edan-orange))]/20 text-[hsl(var(--edan-orange))] hover:bg-[hsl(var(--edan-orange))]/30"><AlertTriangle className="w-3 h-3 mr-1" /> Vencida</Badge>;
    case "cancelled":
    case "failed":
      return <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30"><XCircle className="w-3 h-3 mr-1" /> {status === "cancelled" ? "Cancelado" : "Fallido"}</Badge>;
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
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: payments, isLoading: loadingPayments } = useUserPayments();
  const { data: subscriptions, isLoading: loadingSubscriptions } = useUserSubscriptions();
  const { data: activeSubscription } = useActiveSubscription();
  const downloadReceipt = useDownloadReceipt();
  const toggleAutoRenew = useToggleAutoRenew();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalPaid = payments?.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const daysRemaining = activeSubscription?.expires_at 
    ? differenceInDays(new Date(activeSubscription.expires_at), new Date())
    : null;

  // Filter payments
  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = searchTerm === "" || 
      payment.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.promo_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadReceipt = async (paymentId: string) => {
    await downloadReceipt.mutateAsync(paymentId);
  };

  const handleToggleAutoRenew = async (subscriptionId: string, currentValue: boolean) => {
    await toggleAutoRenew.mutateAsync({ subscriptionId, autoRenew: !currentValue });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Administra tu membresía y consulta tu historial de pagos
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/renew")} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Renovar Membresía
        </Button>
      </div>

      {/* Membership Alert */}
      {activeSubscription && (
        <MembershipAlert 
          expiresAt={activeSubscription.expires_at} 
          status={activeSubscription.status} 
        />
      )}

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
                {activeSubscription?.plan && (
                  <p className="text-xs text-muted-foreground">
                    Plan: {activeSubscription.plan.name}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Días Restantes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSubscriptions ? (
              <Skeleton className="h-6 w-24" />
            ) : daysRemaining !== null ? (
              <>
                <div className={`text-2xl font-bold ${
                  daysRemaining <= 7 ? "text-destructive" : 
                  daysRemaining <= 30 ? "text-[hsl(var(--edan-orange))]" : ""
                }`}>
                  {daysRemaining > 0 ? daysRemaining : 0} días
                </div>
                <p className="text-xs text-muted-foreground">
                  Vence: {format(new Date(activeSubscription!.expires_at!), "dd MMM yyyy", { locale: es })}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Historial de Pagos</CardTitle>
                  <CardDescription>
                    Todos tus pagos realizados en la plataforma
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[180px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="failed">Fallido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredPayments && filteredPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Recibo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
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
                          {payment.payment_method === "card" ? "Tarjeta" :
                           payment.payment_method === "manual" ? "Manual" : 
                           payment.payment_method || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadReceipt(payment.id)}
                              disabled={downloadReceipt.isPending}
                              title="Descargar recibo"
                            >
                              {downloadReceipt.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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
                      <TableHead>Auto-renovar</TableHead>
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
                          {subscription.status === "active" && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscription.auto_renew}
                                onCheckedChange={() => handleToggleAutoRenew(subscription.id, subscription.auto_renew)}
                                disabled={toggleAutoRenew.isPending}
                              />
                              <Label className="text-xs">
                                {subscription.auto_renew ? "Sí" : "No"}
                              </Label>
                            </div>
                          )}
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
