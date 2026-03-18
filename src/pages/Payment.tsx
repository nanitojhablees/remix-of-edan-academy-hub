import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useActivePaymentPlans, useProcessPayment } from "@/hooks/useStudentPayments";
import { Check, Shield, Loader2, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import logoEdan from "@/assets/logo-edan.png";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Payment() {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const { activateMembership } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: plans, isLoading: loadingPlans } = useActivePaymentPlans();
  const processPayment = useProcessPayment();

  // Opción 1: Gratis
  const handleFreePlan = async () => {
    setLoadingCode("free");
    const { error } = await activateMembership();
    setLoadingCode(null);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Bienvenido a EDAN!", description: "Has activado tu acceso gratuito." });
      navigate("/dashboard");
    }
  };

  // Opción 2: Compra por Curso
  const handleByCourse = async () => {
    setLoadingCode("by-course");
    const { error } = await activateMembership();
    setLoadingCode(null);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Explora nuestro catálogo!", description: "Elige los cursos que desees y paga individualmente." });
      navigate("/dashboard/catalog");
    }
  };

  // Opción 3+: Membresía Premium (Planes de Pago de BD)
  const handlePremiumPlan = async (plan: any) => {
    setLoadingCode(plan.id);
    
    try {
      await processPayment.mutateAsync({
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency || "USD",
      });
      // success handled inside mutation, and we just navigate
      navigate("/dashboard");
    } catch (err) {
      // error handled in mutation
    } finally {
      setLoadingCode(null);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-10">
            <img src={logoEdan} alt="EDAN" className="h-16 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Elige cómo quieres aprender</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Selecciona el plan que mejor se adapte a tus necesidades y comienza tu aprendizaje con EDAN.
            </p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {/* Opción Gratis */}
              <Card className="flex flex-col relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-2xl">
                    <span>Gratis</span>
                  </CardTitle>
                  <CardDescription>Para dar tus primeros pasos</CardDescription>
                  <div className="mt-4 text-4xl font-bold">
                    $0 <span className="text-lg font-normal text-muted-foreground">/siempre</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Acceso al dashboard</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Inscripción en cursos gratuitos</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><Check className="h-4 w-4 opacity-50" /> Sin soporte prioritario</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleFreePlan}
                    disabled={!!loadingCode}
                  >
                    {loadingCode === "free" ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                    Comenzar Gratis
                  </Button>
                </CardFooter>
              </Card>

              {/* Opción Por Curso */}
              <Card className="flex flex-col relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-2xl">
                    <span>Por Curso</span>
                  </CardTitle>
                  <CardDescription>Paga sólo lo que necesites</CardDescription>
                  <div className="mt-4 text-4xl font-bold">
                    A tu ritmo
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Acceso completo al catálogo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Compra individual de cursos</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Certificado por cada curso completado</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary/10" 
                    onClick={handleByCourse}
                    disabled={!!loadingCode}
                  >
                    {loadingCode === "by-course" ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                    Ver Catálogo
                  </Button>
                </CardFooter>
              </Card>

              {/* Opción(es) Premium */}
              {plans?.map((plan) => (
                <Card key={plan.id} className="flex flex-col relative overflow-hidden border-2 border-primary shadow-lg scale-105 z-10">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-bl-lg">
                    RECOMENDADO
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center text-2xl">
                      <span>{plan.name}</span>
                    </CardTitle>
                    <CardDescription>{plan.description || "Acceso ilimitado a nuestra plataforma"}</CardDescription>
                    <div className="mt-4 text-4xl font-bold">
                      ${plan.price} <span className="text-lg font-normal text-muted-foreground">/{plan.duration_months} mes(es)</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 text-sm font-medium">
                      {(plan.features || [
                        "Acceso a todos los niveles",
                        "Todos los cursos incluidos",
                        "Certificados digitales de inmediato",
                        "Soporte 1a1 de instructores",
                        "Comunidad VIP reservada",
                      ]).map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" /> {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 border border-border rounded-lg p-3 text-xs text-muted-foreground bg-muted/50 flex items-start gap-2">
                      <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        Este es un entorno de demostración. Al hacer clic se simulará un pago para tu membresía y luego serás redirigido.
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handlePremiumPlan(plan)}
                      disabled={!!loadingCode}
                    >
                      {loadingCode === plan.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <GraduationCap className="h-4 w-4 mr-2" />}
                      Obtener {plan.name}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}