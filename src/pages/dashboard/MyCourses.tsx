import { useMyEnrollments } from "@/hooks/useCourses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CourseListSkeleton } from "@/components/skeletons/CourseCardSkeleton";
import { PageHeaderSkeleton } from "@/components/skeletons/PageHeaderSkeleton";

const levelColors: Record<string, string> = {
  básico: "bg-primary",
  intermedio: "bg-secondary",
  avanzado: "bg-accent",
  experto: "bg-edan-orange",
  único: "bg-slate-800",
};

const levelNames: Record<string, string> = {
  básico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  experto: "Experto",
  único: "Único / Especial",
};

export default function MyCourses() {
  const { data: enrollments, isLoading } = useMyEnrollments();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div>
        <PageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-64" />
        <CourseListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mis Cursos</h1>
        <p className="text-muted-foreground">
          Continúa tu formación donde lo dejaste
        </p>
      </div>

      {enrollments && enrollments.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col overflow-hidden">
              {enrollment.course?.image_url ? (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={enrollment.course.image_url}
                    alt={enrollment.course?.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${levelColors[enrollment.course?.level || ''] || "bg-primary"}`} />
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-700" />
                  <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${levelColors[enrollment.course?.level || ''] || "bg-primary"}`} />
                </div>
              )}
              
              <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">
                    {levelNames[enrollment.course?.level || '']}
                  </Badge>
                  {enrollment.completed_at && (
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      Completado
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold leading-none tracking-tight mb-2">
                  {enrollment.course?.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {enrollment.course?.description}
                </p>
                <div className="mt-auto pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{enrollment.course?.duration_hours}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>Inscrito: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progreso</span>
                      <span className="font-medium">{enrollment.progress_percent}%</span>
                    </div>
                    <Progress value={enrollment.progress_percent} className="h-2" />
                  </div>

                  <Button 
                    className="w-full mt-2"
                    onClick={() => navigate(`/dashboard/course/${enrollment.course_id}`)}
                  >
                    {enrollment.progress_percent === 0 ? "Comenzar Curso" : "Continuar Lección"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No estás inscrito en ningún curso</h3>
            <p className="text-muted-foreground mb-4">
              Explora el catálogo y comienza tu formación en EDAN
            </p>
            <Button onClick={() => navigate("/dashboard/catalog")}>
              Ver Catálogo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
