import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Clock, TrendingUp } from "lucide-react";

export function DashboardContent() {
  const { profile, role } = useAuth();

  const stats = [
    { title: "Cursos Inscritos", value: "3", icon: BookOpen, color: "text-primary" },
    { title: "Insignias", value: "5", icon: Trophy, color: "text-edan-orange" },
    { title: "Horas de Estudio", value: "24", icon: Clock, color: "text-secondary" },
    { title: "Progreso General", value: "45%", icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          ¡Bienvenido, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          {role === "admin" 
            ? "Panel de administración del LMS EDAN" 
            : role === "instructor" 
              ? "Gestiona tus cursos y estudiantes" 
              : "Continúa tu formación en gestión de emergencias"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mis Cursos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Próximamente: Vista de cursos en progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Próximamente: Historial de actividades
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}