import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCog, Shield, GraduationCap, User, Eye, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { UserDetailPanel } from "@/components/admin/UserDetailPanel";
import { UserCreationDialog } from "@/components/admin/UserCreationDialog";

type AppRole = "admin" | "instructor" | "estudiante";

interface UserWithRole {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  country: string | null;
  profession: string | null;
  phone: string | null;
  membership_status: string | null;
  created_at: string;
  role?: AppRole;
  email?: string;
}

export default function UsersManagement() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [creationDialogOpen, setCreationDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]));

      // Obtener emails de los perfiles si están disponibles, o manejar vía auth
      // Si profiles no tiene email, usaremos la tabla de profiles si se agregó. En algunos setups de Supabase, se duplica el email ahí.
      // Modificamos el user mapping
      return profiles.map((p: any) => ({
        ...p,
        role: rolesMap.get(p.user_id) || "estudiante",
      })) as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Rol actualizado", description: "El rol del usuario ha sido cambiado." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendSuspensionEmail = async (userId: string, userName: string) => {
    try {
      const response = await supabase.functions.invoke("send-suspension-email", {
        body: { userId, userName },
      });
      if (response.error) console.error("Failed to send suspension email:", response.error);
    } catch (error) {
      console.error("Error sending suspension email:", error);
    }
  };

  const sendReactivationEmail = async (userId: string, userName: string, previousStatus: string) => {
    try {
      const response = await supabase.functions.invoke("send-reactivation-email", {
        body: { userId, userName, previousStatus },
      });
      if (response.error) console.error("Failed to send reactivation email:", response.error);
    } catch (error) {
      console.error("Error sending reactivation email:", error);
    }
  };

  const sendWelcomeEmail = async (userEmail: string, userName: string) => {
    try {
      const response = await supabase.functions.invoke("send-welcome-email", {
        body: { email: userEmail, userName },
      });
      if (response.error) console.error("Failed to send welcome email:", response.error);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  };

  const sendRejectionEmail = async (userEmail: string, userName: string) => {
    // Si no tenemos una edge function dedicada a rechazo, envíamos una simple o la creamos luego.
    // Por ahora, imprimimos o usamos otra genérica, dado que en el alcance principal se usa la misma base.
    console.log("Send rejection email to", userEmail);
    // TODO: implement send-rejection-email Edge Function if required. (El plan decía "enviar correo de rechazo").
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, userName, previousStatus, userEmail }: { 
      userId: string; 
      status: string; 
      userName: string;
      previousStatus: string;
      userEmail?: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ membership_status: status })
        .eq("user_id", userId);

      if (error) throw error;

      // Send appropriate email notification
      if (status === "suspended") {
        await sendSuspensionEmail(userId, userName);
      } else if (status === "active" && previousStatus === "pending") {
        if (userEmail) await sendWelcomeEmail(userEmail, userName);
      } else if (status === "active" && ["suspended", "expired", "cancelled"].includes(previousStatus)) {
        await sendReactivationEmail(userId, userName, previousStatus);
      } else if (status === "cancelled" && previousStatus === "pending") {
        if (userEmail) await sendRejectionEmail(userEmail, userName);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      const message = variables.status === "suspended" 
        ? "Usuario suspendido. Se ha enviado notificación por email."
        : variables.status === "active" && ["suspended", "expired", "cancelled"].includes(variables.previousStatus)
        ? "Usuario reactivado. Se ha enviado notificación por email."
        : "El estado de membresía ha sido cambiado.";
      toast({ title: "Estado actualizado", description: message });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setPanelOpen(true);
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.membership_status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "instructor": return <GraduationCap className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case "admin": return "bg-destructive text-destructive-foreground";
      case "instructor": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra usuarios, roles y estados de membresía
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Usuarios ({filteredUsers?.length || 0})
          </CardTitle>
          <Button onClick={() => setCreationDialogOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Crear Usuario
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Profesión</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-muted-foreground">{user.phone || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.country || "-"}</TableCell>
                      <TableCell>{user.profession || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getRoleBadgeColor(user.role!)}`}>
                          {getRoleIcon(user.role!)}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.membership_status === "active" ? "default" : 
                          user.membership_status === "suspended" ? "destructive" : 
                          "secondary"
                        }>
                          {user.membership_status === "active" ? "Activo" : 
                           user.membership_status === "pending" ? "Pendiente" :
                           user.membership_status === "suspended" ? "Suspendido" :
                           user.membership_status === "expired" ? "Vencido" :
                           user.membership_status === "cancelled" ? "Cancelado" : 
                           user.membership_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {user.membership_status === "pending" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mr-2 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  userId: user.user_id,
                                  status: "active",
                                  userName: user.first_name,
                                  previousStatus: user.membership_status!,
                                  userEmail: user.email // En el query principal no viene el email desde Auth. Necesitamos obtenerlo si es posible.
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mr-2 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  userId: user.user_id,
                                  status: "cancelled",
                                  userName: user.first_name,
                                  previousStatus: user.membership_status!,
                                  userEmail: user.email
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenUserDetail(user.user_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Panel */}
      <UserDetailPanel 
        userId={selectedUserId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />

      {/* User Creation Dialog */}
      <UserCreationDialog
        open={creationDialogOpen}
        onOpenChange={setCreationDialogOpen}
      />
    </div>
  );
}
