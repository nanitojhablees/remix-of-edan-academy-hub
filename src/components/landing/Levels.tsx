import { Settings, Cpu, Brain, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const levels = [
  {
    number: 1,
    title: "Operaciones",
    subtitle: "Fundamentos y procedimientos operativos",
    description: "Aprende los conceptos básicos de la metodología EDAN, técnicas de recolección de datos en campo, y protocolos de seguridad para evaluadores.",
    icon: Settings,
    color: "edan-teal",
    topics: [
      "Introducción a EDAN",
      "Técnicas de recolección de datos",
      "Protocolos de seguridad",
      "Formularios y herramientas",
    ],
  },
  {
    number: 2,
    title: "Tecnologías Aplicables",
    subtitle: "Herramientas digitales y sistemas de información",
    description: "Domina las herramientas tecnológicas modernas para la evaluación de daños, incluyendo GIS, aplicaciones móviles y sistemas de gestión de datos.",
    icon: Cpu,
    color: "edan-blue",
    topics: [
      "Sistemas de Información Geográfica",
      "Aplicaciones móviles de campo",
      "Gestión de bases de datos",
      "Análisis geoespacial",
    ],
  },
  {
    number: 3,
    title: "Toma de Decisiones",
    subtitle: "Liderazgo y gestión estratégica",
    description: "Desarrolla habilidades de liderazgo y toma de decisiones basadas en evidencia para coordinar respuestas efectivas ante emergencias.",
    icon: Brain,
    color: "edan-orange",
    topics: [
      "Análisis de escenarios",
      "Priorización de necesidades",
      "Coordinación interinstitucional",
      "Comunicación de crisis",
    ],
  },
  {
    number: 4,
    title: "Análisis de Datos",
    subtitle: "Inteligencia y reportes avanzados",
    description: "Aprende a transformar datos en información accionable mediante técnicas avanzadas de análisis, visualización y elaboración de reportes.",
    icon: BarChart3,
    color: "edan-green",
    topics: [
      "Estadística aplicada",
      "Visualización de datos",
      "Elaboración de informes",
      "Indicadores de impacto",
    ],
  },
];

export function Levels() {
  return (
    <section id="levels" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Niveles de{" "}
            <span className="text-gradient">Formación</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nuestro programa está estructurado en 4 niveles progresivos que te 
            llevarán desde los fundamentos hasta el dominio avanzado de la 
            metodología EDAN.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {levels.map((level, index) => (
            <div 
              key={level.number}
              className="group relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300"
            >
              {/* Level number badge */}
              <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-${level.color} flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg`}
                style={{ 
                  backgroundColor: level.color === 'edan-teal' ? 'hsl(187 87% 37%)' : 
                                  level.color === 'edan-blue' ? 'hsl(210 100% 40%)' :
                                  level.color === 'edan-orange' ? 'hsl(28 87% 55%)' :
                                  'hsl(134 61% 41%)'
                }}
              >
                {level.number}
              </div>

              <div className="flex items-start gap-4 mb-4 mt-2">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ 
                    backgroundColor: level.color === 'edan-teal' ? 'hsl(187 70% 92%)' : 
                                    level.color === 'edan-blue' ? 'hsl(210 100% 95%)' :
                                    level.color === 'edan-orange' ? 'hsl(28 90% 94%)' :
                                    'hsl(134 60% 92%)'
                  }}
                >
                  <level.icon 
                    className="h-7 w-7"
                    style={{ 
                      color: level.color === 'edan-teal' ? 'hsl(187 87% 37%)' : 
                             level.color === 'edan-blue' ? 'hsl(210 100% 40%)' :
                             level.color === 'edan-orange' ? 'hsl(28 87% 55%)' :
                             'hsl(134 61% 41%)'
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{level.title}</h3>
                  <p className="text-sm text-muted-foreground">{level.subtitle}</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">{level.description}</p>

              <div className="space-y-2 mb-6">
                <h4 className="font-semibold text-sm">Temas principales:</h4>
                <ul className="grid grid-cols-2 gap-2">
                  {level.topics.map((topic) => (
                    <li key={topic} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: level.color === 'edan-teal' ? 'hsl(187 87% 37%)' : 
                                          level.color === 'edan-blue' ? 'hsl(210 100% 40%)' :
                                          level.color === 'edan-orange' ? 'hsl(28 87% 55%)' :
                                          'hsl(134 61% 41%)'
                        }}
                      />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Ver detalles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link to="/auth?mode=register">
              Inscribirme Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}