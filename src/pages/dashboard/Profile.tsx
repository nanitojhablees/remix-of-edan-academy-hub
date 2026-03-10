import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Briefcase, Save, Key, CreditCard, Calendar, CheckCircle, Clock, XCircle, AlertTriangle, Receipt, ChevronRight, RefreshCw, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { MembershipAlert } from "@/components/dashboard/MembershipAlert";

interface ActiveSubscription {
  id: string;
  status: string;
  expires_at: string | null;
  auto_renew: boolean;
  plan: {
    name: string;
    price: number;
    currency: string;
  } | null;
}

const useActiveSubscription = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["active-subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          expires_at,
          auto_renew,
          plan:payment_plans(name, price, currency)
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ActiveSubscription | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

const usePaymentStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-payment-stats", userId],
    queryFn: async () => {
      if (!userId) return { totalPaid: 0, paymentCount: 0 };
      
      const { data, error } = await supabase
        .from("payments")
        .select("amount")
        .eq("user_id", userId)
        .eq("status", "completed");

      if (error) throw error;
      
      const totalPaid = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return { totalPaid, paymentCount: data?.length || 0 };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Activa</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
    case "expired":
      return <Badge className="bg-orange-500/20 text-orange-600 hover:bg-orange-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Vencida</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
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
export default function Profile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  const { data: activeSubscription, isLoading: loadingSubscription } = useActiveSubscription(user?.id);
  const { data: paymentStats, isLoading: loadingStats } = usePaymentStats(user?.id);

  const daysRemaining = activeSubscription?.expires_at 
    ? differenceInDays(new Date(activeSubscription.expires_at), new Date())
    : null;
  
  // Calculate progress for membership bar (assuming 365 days max)
  const membershipProgress = daysRemaining !== null && daysRemaining > 0
    ? Math.min(100, (daysRemaining / 365) * 100)
    : 0;
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    country: profile?.country || "",
    profession: profile?.profession || "",
    phone: profile?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
      setShowPasswordDialog(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal
        </p>
      </div>

      {/* Avatar Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                Estado: <span className="text-accent font-medium">{profile?.membership_status}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Alert */}
      {activeSubscription && (
        <MembershipAlert 
          expiresAt={activeSubscription.expires_at} 
          status={activeSubscription.status}
          className="mb-6"
        />
      )}

      {/* Membership & Payment Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Membresía y Pagos
              </CardTitle>
              <CardDescription>
                Estado de tu suscripción y resumen de pagos
              </CardDescription>
            </div>
            <Button onClick={() => navigate("/dashboard/renew")} size="sm" variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Renovar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Days Remaining Progress */}
          {daysRemaining !== null && daysRemaining > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Días restantes de membresía</span>
                <span className={`text-lg font-bold ${
                  daysRemaining <= 7 ? "text-destructive" : 
                  daysRemaining <= 30 ? "text-[hsl(var(--edan-orange))]" : "text-primary"
                }`}>
                  {daysRemaining} días
                </span>
              </div>
              <Progress 
                value={membershipProgress} 
                className={`h-2 ${
                  daysRemaining <= 7 ? "[&>div]:bg-destructive" : 
                  daysRemaining <= 30 ? "[&>div]:bg-[hsl(var(--edan-orange))]" : ""
                }`}
              />
              <p className="text-xs text-muted-foreground">
                Vence el {format(new Date(activeSubscription!.expires_at!), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          )}

          {/* Subscription Status */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado de Suscripción</span>
                {loadingSubscription ? (
                  <Skeleton className="h-5 w-16" />
                ) : activeSubscription ? (
                  getStatusBadge(activeSubscription.status)
                ) : (
                  <Badge variant="outline">Sin suscripción</Badge>
                )}
              </div>
              {activeSubscription?.plan && (
                <p className="text-lg font-semibold">{activeSubscription.plan.name}</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Próximo Vencimiento
              </div>
              {loadingSubscription ? (
                <Skeleton className="h-6 w-24" />
              ) : activeSubscription?.expires_at ? (
                <div>
                  <p className="text-lg font-semibold">
                    {format(new Date(activeSubscription.expires_at), "dd MMMM yyyy", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeSubscription.auto_renew ? "Renovación automática" : "Sin renovación automática"}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">-</p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Receipt className="h-4 w-4" />
                  Total Pagado
                </div>
                {loadingStats ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {formatCurrency(paymentStats?.totalPaid || 0, "USD")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paymentStats?.paymentCount || 0} pagos completados
                    </p>
                  </>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link to="/dashboard/payment-history" className="flex items-center gap-2">
                  Ver historial
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Actualiza tus datos de contacto y profesionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Apellido
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                El email no puede ser modificado
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  País
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Ej: Colombia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Profesión
              </Label>
              <Input
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                placeholder="Ej: Ingeniero Civil"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>

              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    <Key className="h-4 w-4" />
                    Cambiar Contraseña
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                      Ingresa tu nueva contraseña
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" disabled={passwordLoading} className="w-full">
                      {passwordLoading ? "Actualizando..." : "Actualizar Contraseña"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
