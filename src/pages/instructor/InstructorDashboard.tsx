import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, GraduationCap, TrendingUp, FileText, Eye } from "lucide-react";
import { useInstructorStats, useInstructorCourses, useInstructorStudents } from "@/hooks/useInstructorData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function InstructorDashboard() {
  const { data: stats, isLoading: statsLoading } = useInstructorStats();
  const { data: courses } = useInstructorCourses();
  const { data: students } = useInstructorStudents();

  const recentEnrollments = students?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Instructor</h1>
        <p className="text-muted-foreground">Resumen de tus cursos y estudiantes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.publishedCourses || 0} publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalStudents}</div>
            <p className="text-xs text-muted-foreground">matriculados en tus cursos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Lecciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalLessons}</div>
            <p className="text-xs text-muted-foreground">en todos tus cursos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : `${stats?.averageProgress}%`}</div>
            <Progress value={stats?.averageProgress || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Tus Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courses && courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{course.level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? (
                          <><Eye className="h-3 w-3 mr-1" /> Publicado</>
                        ) : (
                          "Borrador"
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tienes cursos aún</p>
                <p className="text-sm">Crea tu primer curso desde "Mis Cursos"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inscripciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEnrollments.length > 0 ? (
              <div className="space-y-4">
                {recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {enrollment.profile?.first_name?.[0] || "?"}{enrollment.profile?.last_name?.[0] || ""}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {enrollment.profile?.first_name || "Usuario"} {enrollment.profile?.last_name || ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.course?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{enrollment.progress_percent || 0}%</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(enrollment.enrolled_at), "d MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sin inscripciones aún</p>
                <p className="text-sm">Publica un curso para recibir estudiantes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
