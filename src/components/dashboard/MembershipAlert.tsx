import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, XCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface MembershipAlertProps {
  expiresAt: string | null;
  status: string;
  className?: string;
}

export function MembershipAlert({ expiresAt, status, className }: MembershipAlertProps) {
  const navigate = useNavigate();

  if (!expiresAt || status !== "active") {
    if (status === "expired" || status === "suspended") {
      return (
        <Alert variant="destructive" className={className}>
          <XCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>
              Tu membresía ha {status === "expired" ? "expirado" : "sido suspendida"}. 
              Renueva para recuperar el acceso completo.
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => navigate("/dashboard/renew")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar Ahora
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  const daysRemaining = differenceInDays(new Date(expiresAt), new Date());
  const expiryDate = format(new Date(expiresAt), "d 'de' MMMM, yyyy", { locale: es });

  // No mostrar alerta si quedan más de 30 días
  if (daysRemaining > 30) return null;

  // Determinar el tipo de alerta según los días restantes
  const getAlertStyle = () => {
    if (daysRemaining <= 3) {
      return {
        variant: "destructive" as const,
        icon: XCircle,
        bgClass: "bg-destructive/10 border-destructive",
        textClass: "text-destructive",
        message: `¡URGENTE! Tu membresía vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
      };
    }
    if (daysRemaining <= 7) {
      return {
        variant: "default" as const,
        icon: AlertTriangle,
        bgClass: "bg-[hsl(var(--edan-orange-light))] border-[hsl(var(--edan-orange))]",
        textClass: "text-[hsl(var(--edan-orange))]",
        message: `Tu membresía vence en ${daysRemaining} días`,
      };
    }
    return {
      variant: "default" as const,
      icon: Clock,
      bgClass: "bg-[hsl(var(--edan-teal-light))] border-[hsl(var(--edan-teal))]",
      textClass: "text-[hsl(var(--edan-teal))]",
      message: `Tu membresía vence en ${daysRemaining} días`,
    };
  };

  const alertStyle = getAlertStyle();
  const Icon = alertStyle.icon;

  return (
    <Alert className={`${alertStyle.bgClass} ${className}`}>
      <Icon className={`h-4 w-4 ${alertStyle.textClass}`} />
      <AlertDescription className="flex items-center justify-between w-full">
        <div>
          <span className={`font-medium ${alertStyle.textClass}`}>{alertStyle.message}</span>
          <span className="text-muted-foreground ml-2">
            (Vence el {expiryDate})
          </span>
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate("/dashboard/renew")}
          className="ml-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Renovar
        </Button>
      </AlertDescription>
    </Alert>
  );
}
