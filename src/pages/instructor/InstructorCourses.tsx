import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Settings, ChevronRight } from "lucide-react";
import { useInstructorCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "@/hooks/useInstructorData";
import { useNavigate } from "react-router-dom";

export default function InstructorCourses() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useInstructorCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    level: "básico",
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  const handleCreate = async () => {
    await createCourse.mutateAsync(newCourse);
    setNewCourse({ title: "", description: "", level: "básico" });
    setCreateDialogOpen(false);
  };

  const togglePublish = (courseId: string, currentStatus: boolean) => {
    updateCourse.mutate({ id: courseId, is_published: !currentStatus });
  };

  const handleDelete = (courseId: string) => {
    if (confirm("¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.")) {
      deleteCourse.mutate(courseId);
    }
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      básico: "Básico",
      tecnologias: "Tecnologías",
      decisiones: "Toma de Decisiones",
      analisis: "Análisis",
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Cursos</h1>
          <p className="text-muted-foreground">Gestiona y edita tus cursos</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Nombre del curso"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Describe el contenido del curso"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nivel</label>
                <Select value={newCourse.level} onValueChange={(v) => setNewCourse({ ...newCourse, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operaciones">Operaciones</SelectItem>
                    <SelectItem value="tecnologias">Tecnologías</SelectItem>
                    <SelectItem value="decisiones">Toma de Decisiones</SelectItem>
                    <SelectItem value="analisis">Análisis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!newCourse.title || createCourse.isPending} className="w-full">
                {createCourse.isPending ? "Creando..." : "Crear Curso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{getLevelLabel(course.level)}</Badge>
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Publicado" : "Borrador"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description || "Sin descripción"}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.duration_hours || 0} horas</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/course-editor/${course.id}`)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Editar Contenido
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(course.id, course.is_published)}
                  >
                    {course.is_published ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Publicar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tienes cursos aún</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer curso y comienza a compartir tu conocimiento
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear mi primer curso
          </Button>
        </Card>
      )}
    </div>
  );
}
