import { useCourses, useMyEnrollments, useEnrollInCourse } from "@/hooks/useCourses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CourseCatalogSkeleton } from "@/components/skeletons/CourseCardSkeleton";
import { PageHeaderSkeleton } from "@/components/skeletons/PageHeaderSkeleton";

const levelColors: Record<string, string> = {
  básico: "bg-primary",
  tecnologias: "bg-secondary",
  decisiones: "bg-accent",
  analisis: "bg-edan-orange",
};

const levelNames: Record<string, string> = {
  básico: "Básico",
  tecnologias: "Tecnologías Aplicables",
  decisiones: "Toma de Decisiones",
  analisis: "Análisis de Datos",
};

export default function CourseCatalog() {
  const { data: courses, isLoading } = useCourses();
  const { data: enrollments } = useMyEnrollments();
  const enrollMutation = useEnrollInCourse();
  const navigate = useNavigate();

  const isEnrolled = (courseId: string) => {
    return enrollments?.some((e) => e.course_id === courseId);
  };

  const handleEnroll = async (courseId: string) => {
    await enrollMutation.mutateAsync(courseId);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/dashboard/course/${courseId}`);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeaderSkeleton titleWidth="w-48" descriptionWidth="w-72" />
        <CourseCatalogSkeleton count={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Catálogo de Cursos</h1>
        <p className="text-muted-foreground">
          Explora nuestros cursos de formación en EDAN
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`h-2 ${levelColors[course.level]}`} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="mb-2">
                  {levelNames[course.level]}
                </Badge>
                {isEnrolled(course.id) && (
                  <CheckCircle className="h-5 w-5 text-accent" />
                )}
              </div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Nivel {levelNames[course.level]}</span>
                </div>
              </div>
              
              {isEnrolled(course.id) ? (
                <Button 
                  className="w-full" 
                  onClick={() => handleViewCourse(course.id)}
                >
                  Continuar Curso
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? "Inscribiendo..." : "Inscribirse"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {courses?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay cursos disponibles aún.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
