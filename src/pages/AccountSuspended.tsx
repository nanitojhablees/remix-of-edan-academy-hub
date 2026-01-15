import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AccountSuspended() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Cuenta Suspendida</CardTitle>
          <CardDescription className="text-base">
            Tu cuenta ha sido suspendida temporalmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Hola{profile?.first_name ? `, ${profile.first_name}` : ""},</strong>
            </p>
            <p>
              Tu acceso a la plataforma ha sido suspendido. Esto puede deberse a:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Incumplimiento de los términos de servicio</li>
              <li>Problemas con el pago de la membresía</li>
              <li>Solicitud de revisión de cuenta</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => window.location.href = "mailto:soporte@edan.com"}
            >
              <Mail className="h-4 w-4" />
              Contactar Soporte
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full gap-2"
              onClick={handleSignOut}
            >
              <ArrowLeft className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Si crees que esto es un error, por favor contacta a nuestro equipo de soporte 
            para resolver la situación lo antes posible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}