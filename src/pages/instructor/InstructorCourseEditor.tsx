import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Plus, Save, BookOpen, FileText, Video, Trash2, GripVertical } from "lucide-react";
import { useCourse, useCourseModules, useModuleLessons } from "@/hooks/useCourses";
import { useCreateModule, useCreateLesson, useUpdateCourse } from "@/hooks/useInstructorData";
import { Badge } from "@/components/ui/badge";

function ModuleLessons({ moduleId }: { moduleId: string }) {
  const { data: lessons, isLoading } = useModuleLessons(moduleId);
  const createLesson = useCreateLesson();
  const [newLesson, setNewLesson] = useState({ title: "", content: "", videoUrl: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateLesson = async () => {
    await createLesson.mutateAsync({
      moduleId,
      title: newLesson.title,
      content: newLesson.content,
      videoUrl: newLesson.videoUrl,
      orderIndex: lessons?.length || 0,
    });
    setNewLesson({ title: "", content: "", videoUrl: "" });
    setDialogOpen(false);
  };

  if (isLoading) return <div className="py-2 text-sm text-muted-foreground">Cargando lecciones...</div>;

  return (
    <div className="space-y-2 pl-4">
      {lessons?.map((lesson, index) => (
        <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {lesson.video_url ? (
                <Video className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{lesson.title}</span>
            </div>
            {lesson.duration_minutes > 0 && (
              <span className="text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
            )}
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Añadir lección
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Lección</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Nombre de la lección"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL del Video (opcional)</label>
              <Input
                value={newLesson.videoUrl}
                onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contenido</label>
              <Textarea
                value={newLesson.content}
                onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                placeholder="Contenido de la lección..."
                rows={4}
              />
            </div>
            <Button onClick={handleCreateLesson} disabled={!newLesson.title || createLesson.isPending} className="w-full">
              {createLesson.isPending ? "Creando..." : "Crear Lección"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InstructorCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId);
  const createModule = useCreateModule();
  const updateCourse = useUpdateCourse();

  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  // Initialize form when course loads
  useState(() => {
    if (course) {
      setCourseTitle(course.title);
      setCourseDescription(course.description || "");
    }
  });

  const handleCreateModule = async () => {
    if (!courseId) return;
    await createModule.mutateAsync({
      courseId,
      title: newModule.title,
      description: newModule.description,
      orderIndex: modules?.length || 0,
    });
    setNewModule({ title: "", description: "" });
    setModuleDialogOpen(false);
  };

  const handleSaveCourse = () => {
    if (!courseId) return;
    updateCourse.mutate({
      id: courseId,
      title: courseTitle || course?.title,
      description: courseDescription,
    });
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Curso no encontrado</h2>
        <Button variant="link" onClick={() => navigate("/dashboard/instructor-courses")}>
          Volver a mis cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/instructor-courses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Editar Curso</h1>
          <p className="text-muted-foreground">Configura el contenido de tu curso</p>
        </div>
        <Badge variant={course.is_published ? "default" : "secondary"}>
          {course.is_published ? "Publicado" : "Borrador"}
        </Badge>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Información del Curso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              value={courseTitle || course.title}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Nombre del curso"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={courseDescription || course.description || ""}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Describe el contenido del curso"
              rows={3}
            />
          </div>
          <Button onClick={handleSaveCourse} disabled={updateCourse.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateCourse.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardContent>
      </Card>

      {/* Modules & Lessons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Módulos y Lecciones</CardTitle>
          <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Módulo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Módulo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    placeholder="Nombre del módulo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    placeholder="Descripción opcional"
                  />
                </div>
                <Button onClick={handleCreateModule} disabled={!newModule.title || createModule.isPending} className="w-full">
                  {createModule.isPending ? "Creando..." : "Crear Módulo"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {modulesLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando módulos...</div>
          ) : modules && modules.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {modules.map((module, index) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <div className="font-medium">{module.title}</div>
                        {module.description && (
                          <div className="text-sm text-muted-foreground">{module.description}</div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ModuleLessons moduleId={module.id} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">Sin módulos</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Añade módulos para organizar el contenido de tu curso
              </p>
              <Button variant="outline" onClick={() => setModuleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer módulo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
