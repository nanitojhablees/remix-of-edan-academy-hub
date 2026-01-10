import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, Shield, Loader2 } from "lucide-react";
import logoEdan from "@/assets/logo-edan.png";
import { PageTransition } from "@/components/PageTransition";

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const { activateMembership, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const { error } = await activateMembership();
    setLoading(false);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Pago exitoso!", description: "Tu membresía ha sido activada." });
      navigate("/dashboard");
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="text-center mb-8">
              <img src={logoEdan} alt="EDAN" className="h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Activar Membresía</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Completa el pago para acceder a todos los cursos
              </p>
            </div>

            <div className="bg-gradient-hero text-primary-foreground rounded-xl p-6 mb-6">
              <h3 className="font-bold text-xl mb-2">Membresía EDAN Anual</h3>
              <div className="text-3xl font-bold mb-4">$99 USD <span className="text-sm font-normal opacity-80">/año</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Acceso a los 4 niveles</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Certificados digitales</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Soporte de instructores</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Comunidad exclusiva</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Pago Simulado (Demo)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Este es un flujo de pago simulado para demostración. 
                En producción se integraría con Stripe u otro procesador.
              </p>
            </div>

            <Button onClick={handlePayment} className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                <><Shield className="mr-2 h-4 w-4" /> Completar Pago Seguro</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}