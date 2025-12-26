import { useEffect, useState, useRef } from "react";
import { Users, BookOpen, GraduationCap, Globe } from "lucide-react";

const stats = [
  { 
    icon: Users, 
    value: 500, 
    suffix: "+", 
    label: "Estudiantes Activos",
    color: "text-primary" 
  },
  { 
    icon: BookOpen, 
    value: 24, 
    suffix: "", 
    label: "Cursos Disponibles",
    color: "text-secondary" 
  },
  { 
    icon: GraduationCap, 
    value: 15, 
    suffix: "", 
    label: "Instructores Expertos",
    color: "text-accent" 
  },
  { 
    icon: Globe, 
    value: 12, 
    suffix: "", 
    label: "Países de la Región",
    color: "text-edan-orange" 
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold">
      {count}{suffix}
    </div>
  );
}

export function Stats() {
  return (
    <section className="py-20 bg-gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-8 w-8" />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-sm md:text-base opacity-90 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}