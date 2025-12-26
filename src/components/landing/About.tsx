import { Target, Users, BookOpen, Award } from "lucide-react";

export function About() {
  const features = [
    {
      icon: Target,
      title: "Metodología EDAN",
      description: "Aprende la metodología estándar de evaluación de daños utilizada por organismos internacionales de ayuda humanitaria.",
    },
    {
      icon: Users,
      title: "Enfoque Regional",
      description: "Contenido adaptado a la realidad y contextos específicos de emergencias en Latinoamérica y el Caribe.",
    },
    {
      icon: BookOpen,
      title: "Aprendizaje Flexible",
      description: "Estudia a tu propio ritmo con acceso 24/7 a todos los materiales, videos y recursos del programa.",
    },
    {
      icon: Award,
      title: "Certificación Oficial",
      description: "Obtén certificados digitales verificables al completar cada nivel del programa de formación.",
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sobre el Programa{" "}
            <span className="text-gradient">EDAN</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            El Programa de Actualización en Evaluación de Daños y Análisis de Necesidades 
            (EDAN) es una iniciativa de formación integral diseñada para fortalecer las 
            capacidades de profesionales y voluntarios involucrados en la gestión de 
            emergencias y desastres en Latinoamérica.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Additional content */}
        <div className="mt-16 bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                ¿Por qué es importante la metodología EDAN?
              </h3>
              <p className="text-muted-foreground mb-4">
                En situaciones de emergencia y desastre, la evaluación rápida y precisa 
                de los daños y necesidades es fundamental para tomar decisiones informadas 
                y coordinar una respuesta efectiva.
              </p>
              <p className="text-muted-foreground">
                La metodología EDAN proporciona un marco estandarizado que permite a los 
                equipos de respuesta recopilar, analizar y comunicar información crítica 
                de manera sistemática y comparable.
              </p>
            </div>
            <div className="bg-gradient-hero rounded-xl p-8 text-primary-foreground">
              <h4 className="text-xl font-bold mb-4">Áreas de Aplicación</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Evaluación post-desastre
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Planificación de respuesta humanitaria
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Coordinación interinstitucional
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Gestión de recursos de emergencia
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  Comunicación de crisis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}