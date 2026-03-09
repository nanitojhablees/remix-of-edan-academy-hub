import { useState } from "react";
import { Settings, Cpu, Brain, BarChart3, ArrowRight, Clock, Users, Target, BookOpen, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const levels = [
  {
    number: 1,
    title: "Básico",
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
    fullDetails: {
      duration: "40 horas",
      targetAudience: "Evaluadores de campo, técnicos operativos, voluntarios de protección civil",
      objectives: [
        "Dominar la metodología EDAN para evaluación inicial de daños",
        "Aplicar técnicas de recolección de datos en las primeras 72 horas post-desastre",
        "Clasificar afectaciones en salud, líneas vitales e infraestructura",
        "Utilizar formularios estándar FEDANH correctamente"
      ],
      modules: [
        {
          title: "Fundamentos de la Metodología EDAN",
          content: "Historia, principios y marco conceptual de la Evaluación de Daños y Análisis de Necesidades según estándares USAID/OFDA."
        },
        {
          title: "Evaluación Inicial: Fases Preliminar y Complementaria",
          content: "Técnicas para la evaluación preliminar (primeras 8 horas) y complementaria (hasta 48 horas) post-evento."
        },
        {
          title: "Identificación y Clasificación de Daños",
          content: "Criterios para evaluar morbimortalidad, líneas vitales (agua, energía, telecomunicaciones), infraestructura productiva y vivienda."
        },
        {
          title: "Técnicas de Recolección en Campo",
          content: "Uso de formularios FEDANH, censos rápidos, vuelos de reconocimiento y encuestas por muestreo."
        },
        {
          title: "Criterios de Habitabilidad Post-Sísmica",
          content: "Evaluación de edificaciones: clasificación como Habitables, No Habitables o Destruidas según normativas internacionales."
        },
        {
          title: "Protocolos de Seguridad del Evaluador",
          content: "Medidas de autoprotección, equipamiento básico y procedimientos ante situaciones de riesgo en campo."
        }
      ],
      skills: [
        "Evaluación rápida de daños",
        "Uso de formularios estándar",
        "Técnicas de entrevista en crisis",
        "Documentación fotográfica",
        "Trabajo en equipo multidisciplinario"
      ],
      certification: "Certificación como Evaluador EDAN Nivel Operativo"
    }
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
    fullDetails: {
      duration: "60 horas",
      targetAudience: "Técnicos en sistemas, analistas de información, coordinadores de tecnología en emergencias",
      objectives: [
        "Implementar sistemas GIS para mapeo de zonas de impacto",
        "Configurar y utilizar aplicaciones móviles de recolección de datos",
        "Gestionar bases de datos para emergencias (SINPAD, SIGBAH)",
        "Aplicar técnicas de análisis geoespacial para toma de decisiones"
      ],
      modules: [
        {
          title: "Sistemas de Información Geográfica (GIS)",
          content: "Fundamentos de cartografía digital, manejo de escalas (1:500.000 a 1:1.000), capas de información y análisis espacial."
        },
        {
          title: "Georreferenciación y GPS",
          content: "Uso de GPS para ubicación de puntos críticos, orientación con brújula y técnicas de navegación en campo."
        },
        {
          title: "Aplicaciones Móviles para EDAN",
          content: "Configuración y uso de apps de campo: KoboToolbox, ODK Collect, Survey123 para recolección digital de datos."
        },
        {
          title: "Bases de Datos de Emergencias",
          content: "Gestión del SINPAD (Sistema Nacional de Información para Prevención y Atención de Desastres) y SIGBAH para ayuda humanitaria."
        },
        {
          title: "Telecomunicaciones en Emergencias",
          content: "Manejo de bandas de radiocomunicaciones, alfabeto fonético NATO y sistemas inalámbricos resilientes."
        },
        {
          title: "Análisis Geoespacial Avanzado",
          content: "Creación de mapas de calor, análisis de proximidad, identificación de zonas prioritarias de intervención."
        }
      ],
      skills: [
        "Manejo de software GIS",
        "Configuración de apps móviles",
        "Gestión de bases de datos",
        "Radiocomunicaciones",
        "Producción cartográfica"
      ],
      certification: "Certificación como Especialista en Tecnologías EDAN"
    }
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
    fullDetails: {
      duration: "50 horas",
      targetAudience: "Coordinadores de emergencias, directores de protección civil, líderes de equipos EDAN, funcionarios de COE",
      objectives: [
        "Liderar equipos E-EDAN multidisciplinarios",
        "Priorizar intervenciones según criterios de urgencia y recursos disponibles",
        "Coordinar acciones entre múltiples instituciones y actores",
        "Gestionar declaratorias de emergencia y desastre"
      ],
      modules: [
        {
          title: "Liderazgo de Equipos E-EDAN",
          content: "Conformación y gestión de equipos multidisciplinarios: ingenieros, médicos, geólogos y trabajadores sociales."
        },
        {
          title: "Centros de Operaciones de Emergencia (COE)",
          content: "Funcionamiento del COE, flujos de información, roles y responsabilidades del coordinador EDAN."
        },
        {
          title: "Priorización de Intervenciones",
          content: "Criterios para priorizar acciones de salvamento, salud y saneamiento. Matriz de decisiones bajo presión."
        },
        {
          title: "Gestión del Riesgo y Declaratorias",
          content: "Diferenciación entre Emergencia (capacidad local) y Desastre (asistencia externa). Procedimientos legales y administrativos."
        },
        {
          title: "Coordinación Interinstitucional",
          content: "Protocolos de coordinación con instituciones nacionales e internacionales. Evitar duplicidad de esfuerzos."
        },
        {
          title: "Comunicación de Crisis",
          content: "Técnicas de comunicación efectiva en situaciones de alta presión, manejo de medios y comunicación con afectados."
        }
      ],
      skills: [
        "Liderazgo bajo presión",
        "Toma de decisiones estratégicas",
        "Coordinación multi-agencia",
        "Comunicación de crisis",
        "Gestión de recursos limitados"
      ],
      certification: "Certificación como Coordinador EDAN"
    }
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
    fullDetails: {
      duration: "70 horas",
      targetAudience: "Analistas de datos, investigadores, planificadores de recuperación, consultores en gestión de riesgos",
      objectives: [
        "Aplicar análisis cuantitativo y cualitativo de impacto de desastres",
        "Utilizar la metodología CEPAL para evaluación socioeconómica",
        "Diseñar indicadores de impacto sectorial",
        "Elaborar reportes ejecutivos para tomadores de decisiones"
      ],
      modules: [
        {
          title: "Medición de Impacto de Desastres",
          content: "Metodologías de análisis cuantitativo y cualitativo para medir extensión y gravedad de los efectos."
        },
        {
          title: "Evaluación Socioeconómica (Metodología CEPAL)",
          content: "Cuantificación de pérdidas económicas y ambientales. Bases para rehabilitación y reconstrucción estructural."
        },
        {
          title: "Variables e Indicadores Sectoriales",
          content: "Diseño de indicadores para sector social (vivienda, salud, educación), productivo e infraestructura."
        },
        {
          title: "Estadística Aplicada a Emergencias",
          content: "Técnicas estadísticas para muestreo, extrapolación de datos y análisis de tendencias."
        },
        {
          title: "Visualización de Datos",
          content: "Creación de dashboards, mapas temáticos, gráficos dinámicos y presentaciones ejecutivas."
        },
        {
          title: "Elaboración de Informes EDAN",
          content: "Estructura de informes técnicos, reportes ejecutivos y comunicación de hallazgos a diferentes audiencias."
        }
      ],
      skills: [
        "Análisis estadístico",
        "Metodología CEPAL",
        "Visualización de datos",
        "Redacción técnica",
        "Presentación de informes"
      ],
      certification: "Certificación como Analista EDAN Senior"
    }
  },
];

const getColorStyles = (colorName: string) => {
  const colors: Record<string, { bg: string; bgLight: string; text: string }> = {
    'edan-teal': { bg: 'hsl(187 87% 37%)', bgLight: 'hsl(187 70% 92%)', text: 'hsl(187 87% 37%)' },
    'edan-blue': { bg: 'hsl(210 100% 40%)', bgLight: 'hsl(210 100% 95%)', text: 'hsl(210 100% 40%)' },
    'edan-orange': { bg: 'hsl(28 87% 55%)', bgLight: 'hsl(28 90% 94%)', text: 'hsl(28 87% 55%)' },
    'edan-green': { bg: 'hsl(134 61% 41%)', bgLight: 'hsl(134 60% 92%)', text: 'hsl(134 61% 41%)' },
  };
  return colors[colorName] || colors['edan-teal'];
};

export function Levels() {
  const [selectedLevel, setSelectedLevel] = useState<typeof levels[0] | null>(null);

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
          {levels.map((level) => {
            const colors = getColorStyles(level.color);
            return (
              <div 
                key={level.number}
                className="group relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300"
              >
                {/* Level number badge */}
                <div 
                  className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg"
                  style={{ backgroundColor: colors.bg }}
                >
                  {level.number}
                </div>

                <div className="flex items-start gap-4 mb-4 mt-2">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: colors.bgLight }}
                  >
                    <level.icon 
                      className="h-7 w-7"
                      style={{ color: colors.text }}
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
                          style={{ backgroundColor: colors.bg }}
                        />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedLevel(level)}
                >
                  Ver detalles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            );
          })}
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

      {/* Level Details Modal */}
      <Dialog open={!!selectedLevel} onOpenChange={() => setSelectedLevel(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLevel && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: getColorStyles(selectedLevel.color).bgLight }}
                  >
                    <selectedLevel.icon 
                      className="h-8 w-8"
                      style={{ color: getColorStyles(selectedLevel.color).text }}
                    />
                  </div>
                  <div>
                    <Badge 
                      variant="secondary" 
                      className="mb-2"
                      style={{ 
                        backgroundColor: getColorStyles(selectedLevel.color).bgLight,
                        color: getColorStyles(selectedLevel.color).text 
                      }}
                    >
                      Nivel {selectedLevel.number}
                    </Badge>
                    <DialogTitle className="text-2xl">{selectedLevel.title}</DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedLevel.subtitle}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duración</p>
                      <p className="font-semibold">{selectedLevel.fullDetails.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Módulos</p>
                      <p className="font-semibold">{selectedLevel.fullDetails.modules.length} módulos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Certificación</p>
                      <p className="font-semibold text-sm">Incluida</p>
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Dirigido a
                  </h4>
                  <p className="text-muted-foreground">{selectedLevel.fullDetails.targetAudience}</p>
                </div>

                <Separator />

                {/* Learning Objectives */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Objetivos de Aprendizaje
                  </h4>
                  <ul className="space-y-2">
                    {selectedLevel.fullDetails.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 
                          className="h-5 w-5 mt-0.5 shrink-0" 
                          style={{ color: getColorStyles(selectedLevel.color).text }}
                        />
                        <span className="text-muted-foreground">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Modules */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Contenido del Programa
                  </h4>
                  <div className="space-y-3">
                    {selectedLevel.fullDetails.modules.map((module, index) => (
                      <div 
                        key={index} 
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ backgroundColor: getColorStyles(selectedLevel.color).bg }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="font-medium">{module.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{module.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Skills */}
                <div>
                  <h4 className="font-semibold mb-3">Competencias que Desarrollarás</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLevel.fullDetails.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certification */}
                <div 
                  className="p-4 rounded-lg border-2"
                  style={{ 
                    borderColor: getColorStyles(selectedLevel.color).bg,
                    backgroundColor: getColorStyles(selectedLevel.color).bgLight 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: getColorStyles(selectedLevel.color).bg }}
                    >
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Al completar este nivel obtendrás:</p>
                      <p className="font-bold" style={{ color: getColorStyles(selectedLevel.color).text }}>
                        {selectedLevel.fullDetails.certification}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    className="flex-1"
                    style={{ backgroundColor: getColorStyles(selectedLevel.color).bg }}
                    asChild
                  >
                    <Link to="/auth?mode=register">
                      Inscribirme en este Nivel
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedLevel(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
