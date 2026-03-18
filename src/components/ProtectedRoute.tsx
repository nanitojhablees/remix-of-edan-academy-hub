import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActiveMembership?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireActiveMembership = false 
}: ProtectedRouteProps) {
  const { user, profile, role, loading, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // If user was created manually, we appended "needs_password_reset" on their metadata? 
  // Wait, let's just check if they have it. If not, maybe we should update the edge function to add it.
  useEffect(() => {
    if (user && user.user_metadata?.needs_password_reset === true) {
      setShowPasswordReset(true);
    }
  }, [user]);

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { needs_password_reset: false } // remove flag
      });

      if (error) throw error;

      toast({ title: "Contraseña actualizada", description: "Tu contraseña ha sido actualizada exitosamente." });
      setShowPasswordReset(false);
    } catch (error: any) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user account is suspended (admins bypass this check)
  if (profile?.membership_status === "suspended" && role !== "admin") {
    return <Navigate to="/account-suspended" replace />;
  }

  // Membership payment gate only applies to students
  if (requireActiveMembership && role === "estudiante" && profile?.membership_status !== "active") {
    return <Navigate to="/payment" replace />;
  }

  return (
    <>
      {children}
      
      <Dialog open={showPasswordReset} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Actualiza tu contraseña</DialogTitle>
            <DialogDescription>
              Por motivos de seguridad, debes actualizar la contraseña temporal que te fue asignada antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleLogout} disabled={resetting}>
              Cerrar sesión
            </Button>
            <Button onClick={handlePasswordReset} disabled={resetting}>
              {resetting ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}