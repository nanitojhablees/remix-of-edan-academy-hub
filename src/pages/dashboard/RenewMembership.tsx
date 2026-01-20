import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Tag, CreditCard, CheckCircle, Loader2, Gift, Shield, Sparkles } from "lucide-react";
import { PlanCard } from "@/components/dashboard/PlanCard";
import { MembershipAlert } from "@/components/dashboard/MembershipAlert";
import { 
  useActivePaymentPlans, 
  useActiveSubscription, 
  useValidatePromoCode, 
  useProcessPayment,
  type UserSubscription 
} from "@/hooks/useStudentPayments";
import { PaymentPlan, PromoCode } from "@/hooks/usePayments";
import { useToast } from "@/hooks/use-toast";

export default function RenewMembership() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: plans, isLoading: plansLoading } = useActivePaymentPlans();
  const { data: activeSubscription } = useActiveSubscription();
  
  const validatePromo = useValidatePromoCode();
  const processPayment = useProcessPayment();
  
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"confirm" | "processing" | "success">("confirm");

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    try {
      const result = await validatePromo.mutateAsync({
        code: promoCode,
        planId: selectedPlan?.id,
      });
      setAppliedPromo(result);
      toast({
        title: "¡Código aplicado!",
        description: getPromoDescription(result),
      });
    } catch (error) {
      toast({
        title: "Código inválido",
        description: error instanceof Error ? error.message : "El código no es válido",
        variant: "destructive",
      });
    }
  };

  const getPromoDescription = (promo: PromoCode) => {
    if (promo.free_access) return "Acceso gratuito aplicado";
    if (promo.discount_percent) return `${promo.discount_percent}% de descuento aplicado`;
    if (promo.discount_amount) return `$${promo.discount_amount} de descuento aplicado`;
    return "Descuento aplicado";
  };

  const calculateFinalPrice = (plan: PaymentPlan) => {
    if (!appliedPromo) return plan.price;
    
    if (appliedPromo.free_access) return 0;
    if (appliedPromo.discount_percent) {
      return plan.price * (1 - appliedPromo.discount_percent / 100);
    }
    if (appliedPromo.discount_amount) {
      return Math.max(0, plan.price - appliedPromo.discount_amount);
    }
    return plan.price;
  };

  const handleSelectPlan = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
    setPaymentStep("confirm");
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    
    setPaymentStep("processing");
    
    try {
      await processPayment.mutateAsync({
        planId: selectedPlan.id,
        amount: calculateFinalPrice(selectedPlan),
        currency: selectedPlan.currency,
        promoCode: appliedPromo?.code,
      });
      setPaymentStep("success");
    } catch {
      setPaymentStep("confirm");
    }
  };

  const handleCloseDialog = () => {
    setShowPaymentDialog(false);
    if (paymentStep === "success") {
      navigate("/dashboard/payment-history");
    }
  };

  const finalPrice = selectedPlan ? calculateFinalPrice(selectedPlan) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Renovar Membresía</h1>
          <p className="text-muted-foreground">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>
      </div>

      {/* Membership Alert */}
      {activeSubscription && (
        <MembershipAlert 
          expiresAt={activeSubscription.expires_at} 
          status={activeSubscription.status} 
        />
      )}

      {/* Benefits Banner */}
      <Card className="bg-gradient-hero text-primary-foreground">
        <CardContent className="py-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Acceso a todos los cursos</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>Certificados oficiales</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <span>Contenido exclusivo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            ¿Tienes un código promocional?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa tu código"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="max-w-xs"
              disabled={!!appliedPromo}
            />
            {appliedPromo ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setAppliedPromo(null);
                  setPromoCode("");
                }}
              >
                Quitar
              </Button>
            ) : (
              <Button 
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || validatePromo.isPending}
              >
                {validatePromo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            )}
          </div>
          {appliedPromo && (
            <Badge variant="secondary" className="mt-2 bg-accent/20 text-accent">
              <CheckCircle className="h-3 w-3 mr-1" />
              {getPromoDescription(appliedPromo)}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Plans Grid */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-80 animate-pulse">
              <CardContent className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={activeSubscription?.plan?.id === plan.id}
              isPopular={index === Math.floor((plans.length - 1) / 2)}
              discountedPrice={appliedPromo ? calculateFinalPrice(plan) : undefined}
              onSelect={handleSelectPlan}
              loading={processPayment.isPending}
            />
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          {paymentStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar Pago</DialogTitle>
                <DialogDescription>
                  Revisa los detalles de tu compra antes de continuar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duración</span>
                  <span>{selectedPlan?.duration_months} meses</span>
                </div>
                {appliedPromo && (
                  <>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Precio original</span>
                      <span className="line-through">
                        {selectedPlan?.currency} {selectedPlan?.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-accent">
                      <span>Descuento ({appliedPromo.code})</span>
                      <span>
                        -{selectedPlan?.currency} {(selectedPlan!.price - finalPrice).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total a pagar</span>
                  <span className="text-primary">
                    {selectedPlan?.currency} {finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmPayment}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar Ahora
                </Button>
              </DialogFooter>
            </>
          )}

          {paymentStep === "processing" && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <DialogTitle>Procesando Pago</DialogTitle>
                <DialogDescription>
                  Por favor espera mientras procesamos tu pago...
                </DialogDescription>
              </div>
            </div>
          )}

          {paymentStep === "success" && (
            <>
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-accent" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">¡Pago Exitoso!</DialogTitle>
                  <DialogDescription className="mt-2">
                    Tu membresía ha sido activada. Recibirás un email de confirmación con los detalles.
                  </DialogDescription>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseDialog} className="w-full">
                  Ver Mi Historial de Pagos
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
