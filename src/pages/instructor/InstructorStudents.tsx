import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Filter, GraduationCap, TrendingUp } from "lucide-react";
import { useInstructorStudents, useInstructorCourses } from "@/hooks/useInstructorData";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function InstructorStudents() {
  const { data: students, isLoading } = useInstructorStudents();
  const { data: courses } = useInstructorCourses();
  
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const filteredStudents = students?.filter((student) => {
    const name = `${student.profile?.first_name || ""} ${student.profile?.last_name || ""}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesCourse = courseFilter === "all" || student.course_id === courseFilter;
    return matchesSearch && matchesCourse;
  }) || [];

  // Calculate stats
  const totalStudents = new Set(students?.map(s => s.user_id)).size;
  const completedCount = students?.filter(s => s.completed_at)?.length || 0;
  const avgProgress = students && students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.progress_percent || 0), 0) / students.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estudiantes</h1>
        <p className="text-muted-foreground">Gestiona y monitorea el progreso de tus estudiantes</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full md:w-[250px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Inscripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                          {enrollment.profile?.first_name?.[0] || "?"}{enrollment.profile?.last_name?.[0] || ""}
                        </div>
                        <div>
                          <p className="font-medium">
                            {enrollment.profile?.first_name || "Usuario"} {enrollment.profile?.last_name || ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.profile?.country || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{enrollment.course?.title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={enrollment.progress_percent || 0} className="w-24" />
                        <span className="text-sm">{enrollment.progress_percent || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.completed_at ? (
                        <Badge className="bg-green-500">Completado</Badge>
                      ) : enrollment.progress_percent && enrollment.progress_percent > 0 ? (
                        <Badge variant="secondary">En progreso</Badge>
                      ) : (
                        <Badge variant="outline">Sin iniciar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(enrollment.enrolled_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Sin estudiantes</h3>
              <p className="text-muted-foreground">
                {search || courseFilter !== "all"
                  ? "No se encontraron estudiantes con los filtros aplicados"
                  : "Aún no tienes estudiantes matriculados en tus cursos"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
