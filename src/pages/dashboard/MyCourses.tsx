import { useMyEnrollments } from "@/hooks/useCourses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CourseListSkeleton } from "@/components/skeletons/CourseCardSkeleton";
import { PageHeaderSkeleton } from "@/components/skeletons/PageHeaderSkeleton";

const levelNames: Record<string, string> = {
  operaciones: "Operaciones",
  tecnologias: "Tecnologías Aplicables",
  decisiones: "Toma de Decisiones",
  analisis: "Análisis de Datos",
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
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {levelNames[enrollment.course?.level || '']}
                    </Badge>
                    {enrollment.completed_at && (
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        Completado
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{enrollment.course?.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {enrollment.course?.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{enrollment.course?.duration_hours}h duración</span>
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
                  className="w-full sm:w-auto"
                  onClick={() => navigate(`/dashboard/course/${enrollment.course_id}`)}
                >
                  {enrollment.progress_percent === 0 ? "Comenzar" : "Continuar"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
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
