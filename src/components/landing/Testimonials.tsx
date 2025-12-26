import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "María Elena García",
    role: "Coordinadora de Emergencias",
    organization: "Cruz Roja Colombia",
    avatar: "MG",
    rating: 5,
    text: "El programa EDAN me ha dado las herramientas necesarias para realizar evaluaciones más precisas y rápidas. La metodología es clara y los instructores son excelentes.",
  },
  {
    name: "Carlos Rodríguez",
    role: "Especialista en Gestión de Riesgos",
    organization: "Defensa Civil Perú",
    avatar: "CR",
    rating: 5,
    text: "Gracias a este programa pude aplicar técnicas modernas de evaluación de daños en nuestra última emergencia. El nivel de Tecnologías Aplicables fue especialmente útil.",
  },
  {
    name: "Ana Lucía Mendoza",
    role: "Directora de Operaciones",
    organization: "CONRED Guatemala",
    avatar: "AM",
    rating: 5,
    text: "La flexibilidad de la plataforma me permitió estudiar mientras trabajaba. Los certificados son reconocidos en toda la región y han impulsado mi carrera.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Lo Que Dicen Nuestros{" "}
            <span className="text-gradient">Estudiantes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Profesionales de toda Latinoamérica han transformado su práctica 
            en gestión de emergencias con nuestro programa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="bg-card border border-border rounded-2xl p-6 relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-edan-orange text-edan-orange" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-primary">{testimonial.organization}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}