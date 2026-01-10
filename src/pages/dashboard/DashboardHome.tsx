import { useAuth } from "@/hooks/useAuth";
import { useMyEnrollments } from "@/hooks/useCourses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Clock, TrendingUp } from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export default function DashboardHome() {
  const { profile, role, loading: authLoading } = useAuth();
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();

  const isLoading = authLoading || enrollmentsLoading;

  const stats = [
    { title: "Cursos Inscritos", value: enrollments?.length || 0, icon: BookOpen, color: "text-primary" },
    { title: "Insignias", value: "0", icon: Trophy, color: "text-edan-orange" },
    { title: "Horas de Estudio", value: "0", icon: Clock, color: "text-secondary" },
    { title: "Progreso General", value: "0%", icon: TrendingUp, color: "text-accent" },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

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
    </div>
  );
}
