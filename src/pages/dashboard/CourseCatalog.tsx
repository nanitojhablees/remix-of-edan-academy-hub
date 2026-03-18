import { useCourses, useMyEnrollments, useEnrollInCourse } from "@/hooks/useCourses";
import { useActiveSubscription } from "@/hooks/useStudentPayments";
import { useEnrollmentRequest } from "@/hooks/useEnrollmentRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, CheckCircle, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CourseCatalogSkeleton } from "@/components/skeletons/CourseCardSkeleton";
import { PageHeaderSkeleton } from "@/components/skeletons/PageHeaderSkeleton";
import { EnrollmentModal } from "@/components/enrollment/EnrollmentModal";
import { useState } from "react";
import { hasVipAccess } from "@/utils/courseAccess";

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

export default function CourseCatalog() {
  const { data: courses, isLoading } = useCourses();
  const { data: enrollments } = useMyEnrollments();
  const { data: activeSubscription } = useActiveSubscription();
  const enrollInCourse = useEnrollInCourse();
  const navigate = useNavigate();
  const [enrollModalCourse, setEnrollModalCourse] = useState<{ id: string; title: string; price: number } | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const isEnrolled = (courseId: string) => {
    return enrollments?.some((e) => e.course_id === courseId);
  };

  const checkVipAccess = (courseLevel: string) => {
    return activeSubscription ? hasVipAccess(courseLevel, activeSubscription.plan?.level) : false;
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/dashboard/course/${courseId}`);
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse.mutateAsync(courseId);
    } catch (e) {
      // toast shown in mutation
    } finally {
      setEnrollingId(null);
    }
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
        {courses?.map((course) => {
          const isFree = !course.price || course.price <= 0;
          const hasVip = checkVipAccess(course.level);

          return (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
              {course.image_url ? (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img 
                    src={course.image_url} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${levelColors[course.level] || "bg-primary"}`} />
                </div>
              ) : (
                <div className={`h-2 ${levelColors[course.level] || "bg-primary"}`} />
              )}
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    {levelNames[course.level] || course.level}
                  </Badge>
                  {isEnrolled(course.id) ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : !isFree && !hasVip ? (
                    <span className="text-lg font-bold text-foreground">${course.price}</span>
                  ) : hasVip && !isFree ? (
                    <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/50">VIP</Badge>
                  ) : (
                    <Badge variant="secondary">Gratis</Badge>
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
                    <span>Nivel {levelNames[course.level] || course.level}</span>
                  </div>
                </div>
                
                {isEnrolled(course.id) ? (
                  <Button 
                    className="w-full" 
                    onClick={() => handleViewCourse(course.id)}
                  >
                    Continuar Curso
                  </Button>
                ) : (isFree || hasVip) ? (
                  <Button 
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingId === course.id}
                  >
                    {enrollingId === course.id ? (
                      <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> Inscribiendo...</span>
                    ) : (
                      <><CheckCircle className="h-4 w-4" /> {hasVip && !isFree ? "Acceso VIP - Entrar" : "Inscribirse gratis"}</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={() => setEnrollModalCourse({ id: course.id, title: course.title, price: course.price || 0 })}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Inscribirse — ${course.price}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {courses?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay cursos disponibles aún.</p>
          </CardContent>
        </Card>
      )}

      {enrollModalCourse && (
        <EnrollmentModal
          open={!!enrollModalCourse}
          onOpenChange={(v) => !v && setEnrollModalCourse(null)}
          courseId={enrollModalCourse.id}
          courseTitle={enrollModalCourse.title}
          coursePrice={enrollModalCourse.price}
        />
      )}
    </div>
  );
}
