import { 
  Video, 
  Award, 
  Trophy, 
  GraduationCap, 
  Clock, 
  Users 
} from "lucide-react";

const benefits = [
  {
    icon: Video,
    title: "Contenido Multimedia",
    description: "Videos, presentaciones interactivas, PDFs y recursos descargables en cada lección.",
  },
  {
    icon: Award,
    title: "Certificados Digitales",
    description: "Obtén certificados verificables al completar cada nivel del programa.",
  },
  {
    icon: Trophy,
    title: "Sistema de Insignias",
    description: "Gana insignias por tus logros y muestra tu progreso en la plataforma.",
  },
  {
    icon: GraduationCap,
    title: "Instructores Expertos",
    description: "Aprende de profesionales con amplia experiencia en gestión de emergencias.",
  },
  {
    icon: Clock,
    title: "A Tu Propio Ritmo",
    description: "Acceso 24/7 para estudiar cuando y donde quieras, sin fechas límite.",
  },
  {
    icon: Users,
    title: "Comunidad Activa",
    description: "Conecta con otros profesionales de emergencias en toda Latinoamérica.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Beneficios de Nuestra{" "}
            <span className="text-gradient">Plataforma</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Una experiencia de aprendizaje diseñada para profesionales ocupados 
            que buscan desarrollar sus habilidades en gestión de emergencias.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.title}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <benefit.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}