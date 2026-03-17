import { Facebook, Twitter, Linkedin, Instagram, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Instructor {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  initials: string;
  social: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
}

const instructors: Instructor[] = [
  {
    name: "Krisnader Garcia",
    role: "Director Académico",
    bio: "Especialista en gestión de riesgos con más de 20 años de experiencia en organismos internacionales de ayuda humanitaria.",
    initials: "KG",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Ing. María Fernanda López",
    role: "Instructora Senior – Nivel Básico",
    bio: "Ingeniera civil con maestría en gestión de desastres. Ha liderado más de 50 evaluaciones EDAN en la región.",
    initials: "ML",
    social: {
      linkedin: "#",
      instagram: "#",
    },
  },
  {
    name: "Lic. Roberto Álvarez",
    role: "Instructor – Nivel Tecnologías",
    bio: "Experto en sistemas de información geográfica aplicados a la gestión de emergencias y respuesta humanitaria.",
    initials: "RA",
    social: {
      linkedin: "#",
      twitter: "#",
      website: "#",
    },
  },
  {
    name: "Dra. Ana Sofía Reyes",
    role: "Instructora – Nivel Gestión",
    bio: "Consultora internacional en políticas públicas de reducción de riesgo de desastres con enfoque en Latinoamérica.",
    initials: "AR",
    social: {
      linkedin: "#",
      facebook: "#",
    },
  },
];

const socialIcon = (type: string) => {
  const cls = "h-4 w-4";
  switch (type) {
    case "linkedin": return <Linkedin className={cls} />;
    case "twitter": return <Twitter className={cls} />;
    case "facebook": return <Facebook className={cls} />;
    case "instagram": return <Instagram className={cls} />;
    case "website": return <ExternalLink className={cls} />;
    default: return null;
  }
};

export function TeamSection() {
  return (
    <section id="team" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nuestro <span className="text-gradient">Equipo</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Profesionales con amplia trayectoria internacional en evaluación de daños, gestión de emergencias y cooperación humanitaria.
          </p>
        </div>

        {/* History & Accreditations */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* History */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">📜</span>
              Nuestra Historia
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                EDAN Latinoamérica nace en <strong className="text-foreground">2015</strong> como respuesta a la necesidad de estandarizar los procesos de evaluación de daños en la región, impulsado por profesionales con experiencia en organismos como la ONU, la Cruz Roja y sistemas nacionales de protección civil.
              </p>
              <p>
                Desde entonces, hemos formado a más de <strong className="text-foreground">2,000 profesionales</strong> en 18 países de Latinoamérica y el Caribe, contribuyendo a mejorar la capacidad de respuesta ante emergencias y desastres naturales.
              </p>
              <p>
                En <strong className="text-foreground">2024</strong> lanzamos nuestra plataforma digital para democratizar el acceso a la formación EDAN, permitiendo a profesionales de toda la región capacitarse de manera flexible y certificada.
              </p>
            </div>
          </div>

          {/* Accreditations */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm">🏅</span>
              Acreditaciones y Alianzas
            </h3>
            <div className="space-y-3">
              {[
                { name: "Sistema CEPREDENAC", desc: "Centro de Coordinación para la Prevención de los Desastres en América Central" },
                { name: "UNDRR – Naciones Unidas", desc: "Oficina de las Naciones Unidas para la Reducción del Riesgo de Desastres" },
                { name: "FICR – Cruz Roja", desc: "Federación Internacional de Sociedades de la Cruz Roja y de la Media Luna Roja" },
                { name: "OEA – CIDH", desc: "Comité Interamericano para la Reducción de Desastres Naturales" },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.map((instructor) => (
            <div
              key={instructor.name}
              className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <Avatar className="h-20 w-20 mx-auto mb-4 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                {instructor.avatar && <AvatarImage src={instructor.avatar} alt={instructor.name} />}
                <AvatarFallback className="bg-gradient-hero text-primary-foreground text-lg font-bold">
                  {instructor.initials}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-semibold text-sm">{instructor.name}</h4>
              <p className="text-xs text-primary font-medium mb-2">{instructor.role}</p>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{instructor.bio}</p>
              <div className="flex justify-center gap-2">
                {Object.entries(instructor.social).map(([type, url]) => (
                  <a
                    key={type}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {socialIcon(type)}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
