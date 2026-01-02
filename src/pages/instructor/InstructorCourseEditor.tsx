import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Plus, Save, BookOpen, FileText, Video, Trash2, GripVertical, 
  Edit, Eye, EyeOff, Clock, Settings
} from "lucide-react";
import { useCourse, useCourseModules, useModuleLessons } from "@/hooks/useCourses";
import { 
  useCreateModule, useCreateLesson, useUpdateCourse, useUpdateModule, 
  useDeleteModule, useUpdateLesson, useDeleteLesson, useToggleCoursePublish,
  useReorderModules, useReorderLessons
} from "@/hooks/useInstructorData";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  course_id: string;
}

// Sortable Lesson Item
function SortableLessonItem({ 
  lesson, 
  moduleId,
  onEdit,
  onDelete
}: { 
  lesson: Lesson; 
  moduleId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group",
        isDragging && "opacity-50 bg-muted shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
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
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
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
  const reorderLessons = useReorderLessons();
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (lessons) {
      setLocalLessons(lessons as Lesson[]);
    }
  }, [lessons]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localLessons.findIndex((l) => l.id === active.id);
      const newIndex = localLessons.findIndex((l) => l.id === over.id);
      
      const newLessons = arrayMove(localLessons, oldIndex, newIndex);
      setLocalLessons(newLessons);

      // Update order in database
      reorderLessons.mutate({
        moduleId,
        lessons: newLessons.map((l, index) => ({ id: l.id, order_index: index })),
      });
    }
  };

  if (isLoading) return <div className="py-2 text-sm text-muted-foreground">Cargando lecciones...</div>;

  return (
    <div className="space-y-2 pl-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localLessons.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {localLessons.map((lesson) => (
            <SortableLessonItem
              key={lesson.id}
              lesson={lesson}
              moduleId={moduleId}
              onEdit={() => setEditingLesson(lesson)}
              onDelete={() => deleteLesson.mutate(lesson.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Edit Lesson Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Lección</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <LessonEditor 
              lesson={editingLesson} 
              moduleId={moduleId} 
              onClose={() => setEditingLesson(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
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

// Sortable Module Item
function SortableModuleItem({ 
  module, 
  index,
  onEdit,
  onDelete,
  children
}: { 
  module: Module; 
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });
  const [isExpanded, setIsExpanded] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg overflow-hidden",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center bg-muted/30 group">
        <button
          {...attributes}
          {...listeners}
          className="p-3 touch-none cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-3 p-3 pl-0 text-left hover:bg-muted/50 transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{module.title}</div>
            {module.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">{module.description}</div>
            )}
          </div>
          <svg
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 mr-2",
              isExpanded && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
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
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 pt-2 border-t">
          {children}
        </div>
      )}
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
  const reorderModules = useReorderModules();

  const backUrl = role === "admin" ? "/dashboard/admin-courses" : "/dashboard/instructor-courses";

  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string; description: string } | null>(null);
  const [localModules, setLocalModules] = useState<Module[]>([]);
  
  // Course form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [courseDuration, setCourseDuration] = useState(0);
  const [courseImage, setCourseImage] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  useEffect(() => {
    if (modules) {
      setLocalModules(modules as Module[]);
    }
  }, [modules]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && courseId) {
      const oldIndex = localModules.findIndex((m) => m.id === active.id);
      const newIndex = localModules.findIndex((m) => m.id === over.id);
      
      const newModules = arrayMove(localModules, oldIndex, newIndex);
      setLocalModules(newModules);

      // Update order in database
      reorderModules.mutate({
        courseId,
        modules: newModules.map((m, index) => ({ id: m.id, order_index: index })),
      });
    }
  };

  const handleCreateModule = async () => {
    if (!courseId || !newModule.title.trim()) return;
    await createModule.mutateAsync({
      courseId,
      title: newModule.title,
      description: newModule.description,
      orderIndex: localModules.length,
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
          <p className="text-muted-foreground text-sm">Arrastra los módulos y lecciones para reordenarlos</p>
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
          ) : localModules.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localModules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {localModules.map((module, index) => (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      index={index}
                      onEdit={() => setEditingModule({ 
                        id: module.id, 
                        title: module.title, 
                        description: module.description || "" 
                      })}
                      onDelete={() => deleteModule.mutate(module.id)}
                    >
                      <ModuleLessons moduleId={module.id} moduleTitle={module.title} />
                    </SortableModuleItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
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
    </div>
  );
}
