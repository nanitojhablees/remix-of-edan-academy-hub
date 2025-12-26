import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export function CTA() {
  const features = [
    "Acceso inmediato a todos los cursos",
    "Certificados digitales verificables",
    "Soporte de instructores expertos",
    "Comunidad de profesionales",
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Comienza Tu Formación en{" "}
              <span className="text-gradient">Gestión de Emergencias</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Únete a cientos de profesionales que ya están transformando 
              su práctica en evaluación de daños y respuesta humanitaria.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-left">
                  <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="group">
                <Link to="/auth?mode=register">
                  Registrarme Ahora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}