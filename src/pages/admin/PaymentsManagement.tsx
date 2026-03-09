import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Plus, 
  Search,
  RefreshCw,
  Tag,
  Calendar,
  Edit,
  MoreHorizontal,
  Bell,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usePayments,
  usePaymentPlans,
  usePromoCodes,
  useSubscriptions,
  usePaymentStats,
  useCreatePaymentPlan,
  useUpdatePaymentPlan,
  useCreatePromoCode,
  useUpdatePromoCode,
  useUpdatePayment,
  useUpdateSubscription,
  useRenewSubscription,
  useCreateManualPayment,
  type PaymentPlan,
  type PromoCode,
} from "@/hooks/usePayments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function PaymentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [checkingExpiring, setCheckingExpiring] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: plans } = usePaymentPlans();
  const { data: promoCodes } = usePromoCodes();
  const { data: subscriptions, isLoading: loadingSubscriptions } = useSubscriptions();
  const { data: stats } = usePaymentStats();

  const handleCheckExpiring = async () => {
    setCheckingExpiring(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-expiring-subscriptions");
      
      if (error) throw error;
      
      toast({
        title: "Verificación completada",
        description: `Se verificaron ${data.results?.checked || 0} suscripciones. ${data.results?.notified || 0} notificaciones enviadas.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al verificar suscripciones",
        variant: "destructive",
      });
    } finally {
      setCheckingExpiring(false);
    }
  };

  const statCards = [
    { 
      title: "Ingresos Totales", 
      value: `$${stats?.totalRevenue?.toFixed(2) || "0.00"}`, 
      subtext: "Todos los pagos completados",
      icon: DollarSign, 
      color: "text-green-500" 
    },
    { 
      title: "Ingresos del Mes", 
      value: `$${stats?.monthlyRevenue?.toFixed(2) || "0.00"}`, 
      subtext: "Este mes",
      icon: TrendingUp, 
      color: "text-primary" 
    },
    { 
      title: "Suscripciones Activas", 
      value: stats?.activeSubscriptions || 0, 
      subtext: `${stats?.expiredSubscriptions || 0} expiradas`,
      icon: Users, 
      color: "text-secondary" 
    },
    { 
      title: "Pagos", 
      value: stats?.totalPayments || 0, 
      subtext: `${stats?.pendingPayments || 0} pendientes`,
      icon: CreditCard, 
      color: "text-accent" 
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Administra pagos, suscripciones y códigos promocionales
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleCheckExpiring}
          disabled={checkingExpiring}
        >
          {checkingExpiring ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Verificar Vencimientos
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">Transacciones</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="promos">Códigos Promo</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <PaymentsTab 
            payments={payments || []} 
            plans={plans || []}
            loading={loadingPayments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsTab 
            subscriptions={subscriptions || []}
            loading={loadingSubscriptions}
          />
        </TabsContent>

        <TabsContent value="plans">
          <PlansTab plans={plans || []} />
        </TabsContent>

        <TabsContent value="promos">
          <PromosTab promoCodes={promoCodes || []} plans={plans || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Payments Tab Component
function PaymentsTab({ 
  payments, 
  plans,
  loading, 
  searchTerm, 
  setSearchTerm,
  statusFilter,
  setStatusFilter
}: {
  payments: any[];
  plans: PaymentPlan[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}) {
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const updatePayment = useUpdatePayment();
  const createManualPayment = useCreateManualPayment();

  const { data: users } = useQuery({
    queryKey: ["users-for-payment"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .order("first_name");
      return data || [];
    },
  });

  const [newPayment, setNewPayment] = useState({
    user_id: "",
    plan_id: "",
    amount: "",
    notes: "",
    createSubscription: true,
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreatePayment = async () => {
    await createManualPayment.mutateAsync({
      user_id: newPayment.user_id,
      plan_id: newPayment.plan_id || undefined,
      amount: parseFloat(newPayment.amount),
      notes: newPayment.notes,
      createSubscription: newPayment.createSubscription,
    });
    setManualPaymentOpen(false);
    setNewPayment({ user_id: "", plan_id: "", amount: "", notes: "", createSubscription: true });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    const labels: Record<string, string> = {
      completed: "Completado",
      pending: "Pendiente",
      failed: "Fallido",
      refunded: "Reembolsado",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transacciones</CardTitle>
        <Dialog open={manualPaymentOpen} onOpenChange={setManualPaymentOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Pago Manual</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Usuario</Label>
                <Select value={newPayment.user_id} onValueChange={(v) => setNewPayment(p => ({ ...p, user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={newPayment.plan_id} onValueChange={(v) => {
                  const plan = plans.find(p => p.id === v);
                  setNewPayment(p => ({ ...p, plan_id: v, amount: plan?.price.toString() || p.amount }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plan (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newPayment.createSubscription}
                  onCheckedChange={(v) => setNewPayment(p => ({ ...p, createSubscription: v }))}
                />
                <Label>Crear suscripción activa</Label>
              </div>
              <Button 
                onClick={handleCreatePayment} 
                className="w-full"
                disabled={!newPayment.user_id || !newPayment.amount || createManualPayment.isPending}
              >
                Registrar Pago
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ID de transacción..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="failed">Fallidos</SelectItem>
              <SelectItem value="refunded">Reembolsados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron transacciones
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.profile?.first_name} {payment.profile?.last_name}
                  </TableCell>
                  <TableCell>{payment.plan?.name || "-"}</TableCell>
                  <TableCell>${Number(payment.amount).toFixed(2)} {payment.currency}</TableCell>
                  <TableCell className="capitalize">{payment.payment_method || "-"}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updatePayment.mutate({ id: payment.id, status: "completed" })}>
                          Marcar Completado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePayment.mutate({ id: payment.id, status: "refunded" })}>
                          Marcar Reembolsado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Subscriptions Tab Component
function SubscriptionsTab({ subscriptions, loading }: { subscriptions: any[]; loading: boolean }) {
  const updateSubscription = useUpdateSubscription();
  const renewSubscription = useRenewSubscription();
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [renewMonths, setRenewMonths] = useState("12");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      expired: "destructive",
      cancelled: "outline",
      suspended: "secondary",
    };
    const labels: Record<string, string> = {
      active: "Activa",
      expired: "Expirada",
      cancelled: "Cancelada",
      suspended: "Suspendida",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const handleRenew = async () => {
    if (!selectedSub) return;
    await renewSubscription.mutateAsync({
      subscriptionId: selectedSub.id,
      months: parseInt(renewMonths),
    });
    setRenewDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscripciones</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Auto-renovar</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay suscripciones
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.profile?.first_name} {sub.profile?.last_name}
                  </TableCell>
                  <TableCell>{sub.plan?.name || "-"}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>{new Date(sub.starts_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={sub.auto_renew}
                      onCheckedChange={(v) => updateSubscription.mutate({ id: sub.id, auto_renew: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedSub(sub);
                          setRenewDialogOpen(true);
                        }}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Renovar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateSubscription.mutate({ id: sub.id, status: "active" })}>
                          Activar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateSubscription.mutate({ id: sub.id, status: "suspended" })}>
                          Suspender
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateSubscription.mutate({ id: sub.id, status: "cancelled" })}>
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renovar Suscripción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Renovar suscripción de {selectedSub?.profile?.first_name} {selectedSub?.profile?.last_name}
              </p>
              <div>
                <Label>Duración (meses)</Label>
                <Select value={renewMonths} onValueChange={setRenewMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mes</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRenew} className="w-full" disabled={renewSubscription.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" /> Renovar Suscripción
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Plans Tab Component
function PlansTab({ plans }: { plans: PaymentPlan[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const createPlan = useCreatePaymentPlan();
  const updatePlan = useUpdatePaymentPlan();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_months: "12",
    level: "",
    is_active: true,
  });

  const openEdit = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      level: plan.level || "",
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingPlan(null);
    setFormData({ name: "", description: "", price: "", duration_months: "12", level: "", is_active: true });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration_months: parseInt(formData.duration_months),
      level: formData.level || null,
      is_active: formData.is_active,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...data });
    } else {
      await createPlan.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Planes de Pago</CardTitle>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuevo Plan</Button>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${Number(plan.price).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.duration_months} mes{plan.duration_months > 1 ? "es" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                {plan.level && (
                  <Badge variant="outline" className="mb-2">Nivel: {plan.level}</Badge>
                )}
                {!plan.is_active && <Badge variant="destructive">Inactivo</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Duración (meses)</Label>
                  <Input
                    type="number"
                    value={formData.duration_months}
                    onChange={(e) => setFormData(f => ({ ...f, duration_months: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Nivel (opcional)</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue placeholder="Acceso completo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Acceso completo</SelectItem>
                    <SelectItem value="básico">Básico</SelectItem>
                    <SelectItem value="tecnologias">Tecnologías</SelectItem>
                    <SelectItem value="decisiones">Decisiones</SelectItem>
                    <SelectItem value="analisis">Análisis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_active: v }))}
                />
                <Label>Activo</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!formData.name || !formData.price}>
                {editingPlan ? "Guardar Cambios" : "Crear Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Promos Tab Component
function PromosTab({ promoCodes, plans }: { promoCodes: PromoCode[]; plans: PaymentPlan[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const createPromo = useCreatePromoCode();
  const updatePromo = useUpdatePromoCode();

  const [formData, setFormData] = useState({
    code: "",
    discount_percent: "",
    discount_amount: "",
    free_access: false,
    plan_id: "",
    max_uses: "",
    valid_until: "",
    is_active: true,
  });

  const handleSubmit = async () => {
    await createPromo.mutateAsync({
      code: formData.code,
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : null,
      discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
      free_access: formData.free_access,
      plan_id: formData.plan_id || null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
    });
    setDialogOpen(false);
    setFormData({ code: "", discount_percent: "", discount_amount: "", free_access: false, plan_id: "", max_uses: "", valid_until: "", is_active: true });
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "EDAN-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(f => ({ ...f, code }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Códigos Promocionales</CardTitle>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nuevo Código</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Válido hasta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay códigos promocionales
                </TableCell>
              </TableRow>
            ) : (
              promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                  <TableCell>
                    {promo.free_access ? (
                      <Badge>Acceso Gratis</Badge>
                    ) : promo.discount_percent ? (
                      `${promo.discount_percent}%`
                    ) : promo.discount_amount ? (
                      `$${promo.discount_amount}`
                    ) : "-"}
                  </TableCell>
                  <TableCell>{promo.plan?.name || "Todos"}</TableCell>
                  <TableCell>
                    {promo.current_uses}/{promo.max_uses || "∞"}
                  </TableCell>
                  <TableCell>
                    {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : "Sin límite"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "outline"}>
                      {promo.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updatePromo.mutate({ id: promo.id, is_active: !promo.is_active })}
                    >
                      {promo.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Código Promocional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="EDAN-XXXXX"
                  />
                  <Button variant="outline" onClick={generateCode}><Tag className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.free_access}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, free_access: v, discount_percent: "", discount_amount: "" }))}
                />
                <Label>Acceso Gratuito</Label>
              </div>
              {!formData.free_access && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Descuento %</Label>
                    <Input
                      type="number"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData(f => ({ ...f, discount_percent: e.target.value, discount_amount: "" }))}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label>O Monto fijo $</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData(f => ({ ...f, discount_amount: e.target.value, discount_percent: "" }))}
                      placeholder="20.00"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label>Plan específico (opcional)</Label>
                <Select value={formData.plan_id} onValueChange={(v) => setFormData(f => ({ ...f, plan_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Todos los planes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los planes</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Máximo de usos</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(f => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <Label>Válido hasta</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(f => ({ ...f, valid_until: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!formData.code || createPromo.isPending}>
                Crear Código
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
