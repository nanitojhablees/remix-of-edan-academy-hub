import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Globe, Award } from "lucide-react";
import logoEdan from "@/assets/logo-edan.png";

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Programa de Actualización Oficial
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Evaluación de Daños y{" "}
              <span className="text-gradient">Análisis de Necesidades</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Fortalece tus capacidades en gestión de emergencias y desastres con 
              nuestro programa integral de formación certificada para profesionales 
              de Latinoamérica.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button size="lg" asChild className="group">
                <Link to="/auth?mode=register">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#about">
                  <Play className="mr-2 h-5 w-5" />
                  Conocer el Programa
                </a>
              </Button>
            </div>

            {/* Stats mini */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary">4</div>
                <div className="text-sm text-muted-foreground">Niveles</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Online</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary">Cert.</div>
                <div className="text-sm text-muted-foreground">Oficial</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden lg:block animate-fade-in">
            <div className="relative">
              {/* Main card */}
              <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                <img 
                  src={logoEdan} 
                  alt="EDAN Latinoamérica" 
                  className="w-48 h-auto mx-auto mb-6"
                />
                <h3 className="text-xl font-bold text-center mb-4">
                  Programa de Formación EDAN
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-edan-teal-light flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span>Metodología certificada internacionalmente</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-edan-blue-light flex items-center justify-center">
                      <Globe className="h-4 w-4 text-secondary" />
                    </div>
                    <span>Enfoque específico para Latinoamérica</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-edan-green-light flex items-center justify-center">
                      <Award className="h-4 w-4 text-accent" />
                    </div>
                    <span>Certificados digitales verificables</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-float">
                <span className="text-sm font-medium">🎓 +500 Estudiantes</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg animate-float" style={{ animationDelay: "1s" }}>
                <span className="text-sm font-medium">⭐ 4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}