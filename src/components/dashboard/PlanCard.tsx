import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles } from "lucide-react";
import { PaymentPlan } from "@/hooks/usePayments";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: PaymentPlan;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  discountedPrice?: number;
  onSelect: (plan: PaymentPlan) => void;
  loading?: boolean;
}

export function PlanCard({ 
  plan, 
  isCurrentPlan, 
  isPopular, 
  discountedPrice,
  onSelect, 
  loading 
}: PlanCardProps) {
  const hasDiscount = discountedPrice !== undefined && discountedPrice < plan.price;
  const displayPrice = hasDiscount ? discountedPrice : plan.price;
  const monthlyPrice = displayPrice / plan.duration_months;

  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <Card 
      className={cn(
        "relative transition-all hover:shadow-lg",
        isPopular && "border-primary shadow-md scale-105",
        isCurrentPlan && "border-accent"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1" />
            Más Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            <Sparkles className="h-3 w-3 mr-1" />
            Plan Actual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div>
          {hasDiscount && (
            <div className="text-muted-foreground line-through text-lg">
              {plan.currency} {plan.price.toFixed(2)}
            </div>
          )}
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-primary">
              {plan.currency} {displayPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            por {plan.duration_months} {plan.duration_months === 1 ? 'mes' : 'meses'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ({plan.currency} {monthlyPrice.toFixed(2)}/mes)
          </div>
        </div>

        {plan.level && (
          <Badge variant="outline" className="capitalize">
            Nivel: {plan.level}
          </Badge>
        )}

        {features.length > 0 && (
          <ul className="space-y-2 text-left">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>{String(feature)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onSelect(plan)}
          disabled={loading || isCurrentPlan}
          variant={isPopular ? "default" : "outline"}
        >
          {isCurrentPlan ? "Plan Actual" : "Seleccionar Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}
