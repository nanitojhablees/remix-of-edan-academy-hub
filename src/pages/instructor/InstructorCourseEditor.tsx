import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Plus, Save, BookOpen, FileText, Video, Trash2, GripVertical, 
  Edit, Eye, EyeOff, Clock, Link as LinkIcon, Image, Youtube, Settings,
  ChevronDown, ChevronUp, X
} from "lucide-react";
import { useCourse, useCourseModules, useModuleLessons } from "@/hooks/useCourses";
import { 
  useCreateModule, useCreateLesson, useUpdateCourse, useUpdateModule, 
  useDeleteModule, useUpdateLesson, useDeleteLesson, useToggleCoursePublish 
} from "@/hooks/useInstructorData";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  module_id: string;
}

function LessonEditor({ 
  lesson, 
  moduleId, 
  onClose 
}: { 
  lesson: Lesson | null; 
  moduleId: string; 
  onClose: () => void;
}) {
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const { toast } = useToast();
  
  const [title, setTitle] = useState(lesson?.title || "");
  const [content, setContent] = useState(lesson?.content || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || "");
  const [duration, setDuration] = useState(lesson?.duration_minutes || 0);
  const [activeTab, setActiveTab] = useState("content");

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }

    try {
      if (lesson) {
        await updateLesson.mutateAsync({
          id: lesson.id,
          title,
          content,
          video_url: videoUrl || null,
          duration_minutes: duration,
        });
      } else {
        await createLesson.mutateAsync({
          moduleId,
          title,
          content,
          videoUrl: videoUrl || undefined,
          durationMinutes: duration,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving lesson:", error);
    }
  };

  const isPending = createLesson.isPending || updateLesson.isPending;

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Título de la lección *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Introducción al tema"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="video">URL del video</Label>
            <Input
              id="video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube, Vimeo, etc."
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-4">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Escribe el contenido de la lección. Puedes añadir imágenes, videos de YouTube, enlaces y más..."
            className="min-h-[400px]"
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <div className="border rounded-lg p-6 min-h-[400px] bg-muted/30">
            {videoUrl && (
              <div className="aspect-video mb-6 bg-black rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-2" />
                  <p>Video: {videoUrl}</p>
                </div>
              </div>
            )}
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>Sin contenido aún...</p>" }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Guardando..." : lesson ? "Guardar cambios" : "Crear lección"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ModuleLessons({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const { data: lessons, isLoading } = useModuleLessons(moduleId);
  const deleteLesson = useDeleteLesson();
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) return <div className="py-2 text-sm text-muted-foreground">Cargando lecciones...</div>;

  return (
    <div className="space-y-2 pl-4">
      {lessons?.map((lesson, index) => (
        <div 
          key={lesson.id} 
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {lesson.video_url ? (
                <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="font-medium truncate">{lesson.title}</span>
            </div>
            {lesson.duration_minutes > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {lesson.duration_minutes} min
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditingLesson(lesson)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Lección</DialogTitle>
                </DialogHeader>
                <LessonEditor 
                  lesson={lesson} 
                  moduleId={moduleId} 
                  onClose={() => setEditingLesson(null)} 
                />
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar lección?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la lección "{lesson.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteLesson.mutate(lesson.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Añadir lección
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Lección - {moduleTitle}</DialogTitle>
          </DialogHeader>
          <LessonEditor 
            lesson={null} 
            moduleId={moduleId} 
            onClose={() => setIsCreating(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InstructorCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId);
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const updateCourse = useUpdateCourse();
  const togglePublish = useToggleCoursePublish();

  const backUrl = role === "admin" ? "/dashboard/admin-courses" : "/dashboard/instructor-courses";

  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string; description: string } | null>(null);
  
  // Course form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [courseDuration, setCourseDuration] = useState(0);
  const [courseImage, setCourseImage] = useState("");

  // Initialize form when course loads
  useEffect(() => {
    if (course) {
      setCourseTitle(course.title);
      setCourseDescription(course.description || "");
      setCourseLevel(course.level);
      setCourseDuration(course.duration_hours || 0);
      setCourseImage(course.image_url || "");
    }
  }, [course]);

  const handleCreateModule = async () => {
    if (!courseId || !newModule.title.trim()) return;
    await createModule.mutateAsync({
      courseId,
      title: newModule.title,
      description: newModule.description,
      orderIndex: modules?.length || 0,
    });
    setNewModule({ title: "", description: "" });
    setModuleDialogOpen(false);
  };

  const handleUpdateModule = async () => {
    if (!editingModule) return;
    await updateModule.mutateAsync({
      id: editingModule.id,
      title: editingModule.title,
      description: editingModule.description,
    });
    setEditingModule(null);
  };

  const handleSaveCourse = () => {
    if (!courseId) return;
    updateCourse.mutate({
      id: courseId,
      title: courseTitle,
      description: courseDescription,
      level: courseLevel,
      duration_hours: courseDuration,
      image_url: courseImage || null,
    });
  };

  const handleTogglePublish = () => {
    if (!courseId || !course) return;
    togglePublish.mutate({
      id: courseId,
      is_published: !course.is_published,
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
        <Button variant="link" onClick={() => navigate(backUrl)}>
          Volver a cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">Editar Curso</h1>
          <p className="text-muted-foreground text-sm">Configura el contenido y estructura de tu curso</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={course.is_published ? "default" : "secondary"}>
            {course.is_published ? "Publicado" : "Borrador"}
          </Badge>
          <Button
            variant={course.is_published ? "outline" : "default"}
            size="sm"
            onClick={handleTogglePublish}
            disabled={togglePublish.isPending}
          >
            {course.is_published ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Despublicar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Course Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Curso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Título del curso *</Label>
              <Input
                id="course-title"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Nombre del curso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-level">Nivel</Label>
              <Select value={courseLevel} onValueChange={setCourseLevel}>
                <SelectTrigger id="course-level">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operaciones">Operaciones</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                  <SelectItem value="experto">Experto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course-description">Descripción</Label>
            <Textarea
              id="course-description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Describe el contenido y objetivos del curso"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-duration">Duración estimada (horas)</Label>
              <Input
                id="course-duration"
                type="number"
                min="0"
                value={courseDuration}
                onChange={(e) => setCourseDuration(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-image">URL de imagen de portada</Label>
              <Input
                id="course-image"
                value={courseImage}
                onChange={(e) => setCourseImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveCourse} disabled={updateCourse.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateCourse.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Lessons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Módulos y Lecciones
          </CardTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="module-title">Título del módulo *</Label>
                  <Input
                    id="module-title"
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    placeholder="Ej: Módulo 1 - Introducción"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-description">Descripción (opcional)</Label>
                  <Textarea
                    id="module-description"
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    placeholder="Breve descripción del contenido del módulo"
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
            <Accordion type="multiple" className="w-full" defaultValue={modules.map(m => m.id)}>
              {modules.map((module, index) => (
                <AccordionItem key={module.id} value={module.id}>
                  <div className="flex items-center group">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="text-left">
                          <div className="font-medium">{module.title}</div>
                          {module.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">{module.description}</div>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setEditingModule({ 
                              id: module.id, 
                              title: module.title, 
                              description: module.description || "" 
                            })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Módulo</DialogTitle>
                          </DialogHeader>
                          {editingModule && (
                            <div className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label>Título del módulo *</Label>
                                <Input
                                  value={editingModule.title}
                                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                  value={editingModule.description}
                                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                                />
                              </div>
                              <Button onClick={handleUpdateModule} disabled={updateModule.isPending} className="w-full">
                                {updateModule.isPending ? "Guardando..." : "Guardar cambios"}
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará el módulo "{module.title}" y todas sus lecciones.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteModule.mutate(module.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent>
                    <ModuleLessons moduleId={module.id} moduleTitle={module.title} />
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
