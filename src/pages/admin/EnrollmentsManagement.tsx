import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Search, Trash2, CheckCircle, Clock, BarChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function EnrollmentsManagement() {
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: async () => {
      const { data: enrollmentData, error } = await supabase
        .from("enrollments")
        .select("*, course:courses(title, id)")
        .order("enrolled_at", { ascending: false });

      if (error) throw error;

      // Get profiles separately
      const userIds = [...new Set(enrollmentData?.map(e => e.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return enrollmentData?.map(e => ({
        ...e,
        profile: profileMap.get(e.user_id),
      }));
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title");
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["enrollment-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("*");

      const completed = data?.filter(e => e.completed_at).length || 0;
      const inProgress = data?.filter(e => !e.completed_at && (e.progress_percent || 0) > 0).length || 0;
      const notStarted = data?.filter(e => !e.completed_at && (e.progress_percent || 0) === 0).length || 0;
      const avgProgress = data?.reduce((acc, e) => acc + (e.progress_percent || 0), 0) / (data?.length || 1);

      return {
        total: data?.length || 0,
        completed,
        inProgress,
        notStarted,
        avgProgress: Math.round(avgProgress),
      };
    },
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-stats"] });
      toast({ title: "Inscripción eliminada" });
    },
  });

  const filteredEnrollments = enrollments?.filter(enrollment => {
    const matchesSearch =
      enrollment.profile?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      enrollment.profile?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      enrollment.course?.title?.toLowerCase().includes(search.toLowerCase());

    const matchesCourse = filterCourse === "all" || enrollment.course?.id === filterCourse;
    
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "completed" && enrollment.completed_at) ||
      (filterStatus === "in_progress" && !enrollment.completed_at && (enrollment.progress_percent || 0) > 0) ||
      (filterStatus === "not_started" && !enrollment.completed_at && (enrollment.progress_percent || 0) === 0);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Inscripciones</h1>
        <p className="text-muted-foreground">Administra las inscripciones de todos los usuarios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats?.completed || 0}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{stats?.inProgress || 0}</p>
              <p className="text-xs text-muted-foreground">En Progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats?.notStarted || 0}</p>
              <p className="text-xs text-muted-foreground">Sin Iniciar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">{stats?.avgProgress || 0}%</p>
              <p className="text-xs text-muted-foreground">Promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o curso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {courses?.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="not_started">Sin iniciar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Inscripciones ({filteredEnrollments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inscripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments?.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {enrollment.profile?.first_name?.[0]}{enrollment.profile?.last_name?.[0]}
                          </div>
                          <span className="font-medium">
                            {enrollment.profile?.first_name} {enrollment.profile?.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.course?.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={enrollment.progress_percent || 0} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10">
                            {enrollment.progress_percent || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {enrollment.completed_at ? (
                          <Badge className="gap-1 bg-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Completado
                          </Badge>
                        ) : (enrollment.progress_percent || 0) > 0 ? (
                          <Badge variant="secondary" className="gap-1">
                            <BarChart className="h-3 w-3" />
                            En Progreso
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Sin Iniciar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>¿Eliminar inscripción?</DialogTitle>
                              <DialogDescription>
                                Esto eliminará el progreso del usuario en este curso.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button
                                variant="destructive"
                                onClick={() => deleteEnrollmentMutation.mutate(enrollment.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
