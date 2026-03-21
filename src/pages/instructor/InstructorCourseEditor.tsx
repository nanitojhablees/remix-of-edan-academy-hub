import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Save, BookOpen, FileText, Video, Trash2, GripVertical,
  Edit, Eye, EyeOff, Clock, Settings, FileQuestion, Rocket, Target,
  Zap, Radio, ExternalLink, CheckCircle, GraduationCap, MessageSquare
} from "lucide-react";
import { useCourse, useCourseModules, useModuleLessons } from "@/hooks/useCourses";
import { useCreateExam, useInstructorExams, useDeleteExam } from "@/hooks/useExams";
import {
  useCreateModule, useCreateLesson, useUpdateCourse, useUpdateModule,
  useDeleteModule, useUpdateLesson, useDeleteLesson, useToggleCoursePublish,
  useReorderModules, useReorderLessons, useSubmitCourseForReview
} from "@/hooks/useInstructorData";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/editor/ImageUploader";
import { ModuleMaterialsEditor } from "@/components/materials/ModuleMaterials";
import { LessonAssignments } from "@/components/assignments/LessonAssignments";
import { InstructorLiveSessions } from "@/components/live/InstructorLiveSessions";
import { InstructorMicroQuizEditor } from "@/components/quizzes/InstructorMicroQuizEditor";
import { CourseObjectivesEditor } from "@/components/instructor/CourseObjectivesEditor";
import { CourseLaunchChecklist } from "@/components/instructor/CourseLaunchChecklist";
import { ForumModerationPanel } from "@/components/instructor/ForumModerationPanel";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
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

// ─── Lesson type icon ───────────────────────────────────────────────────────
function LessonTypeIcon({ lesson }: { lesson: Lesson }) {
  if (lesson.video_url) return <Video className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
  if (lesson.content) return <FileText className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
  return <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
}

// ─── Sortable Lesson Item ─────────────────────────────────────────────────────
function SortableLessonItem({
  lesson, moduleId, onEdit, onDelete
}: {
  lesson: Lesson; moduleId: string; onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group border border-transparent hover:border-border/50",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-0.5">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <LessonTypeIcon lesson={lesson} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{lesson.title}</span>
        {lesson.duration_minutes > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />{lesson.duration_minutes} min
          </span>
        )}
      </div>
      {/* status pill */}
      {(lesson.content || lesson.video_url)
        ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium hidden group-hover:inline-flex">OK</span>
        : <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium hidden group-hover:inline-flex">Vacía</span>
      }
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar lección?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente "{lesson.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Lesson Editor Dialog ────────────────────────────────────────────────────
function LessonEditor({
  lesson, moduleId, onClose
}: {
  lesson: Lesson | null; moduleId: string; onClose: () => void;
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
        await updateLesson.mutateAsync({ id: lesson.id, title, content, video_url: videoUrl || null, duration_minutes: duration });
      } else {
        await createLesson.mutateAsync({ moduleId, title, content, videoUrl: videoUrl || undefined, durationMinutes: duration });
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
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Introducción al tema" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input id="duration" type="number" min="0" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="video">URL del video</Label>
            <Input id="video" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, etc." />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          <TabsTrigger value="assignments">Tareas</TabsTrigger>
          <TabsTrigger value="quizzes">Mini-Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-4">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Escribe el contenido de la lección..."
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
        <TabsContent value="assignments" className="mt-4 border rounded-lg p-6 min-h-[400px]">
          {lesson ? (
            <LessonAssignments lessonId={lesson.id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>Guarda esta lección por primera vez para poder adjuntarle tareas.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="quizzes" className="mt-4 border rounded-lg p-6 min-h-[400px]">
          {lesson ? (
            <InstructorMicroQuizEditor lessonId={lesson.id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <p>Guarda esta lección primero para poder agregar quizzes.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Guardando..." : lesson ? "Guardar cambios" : "Crear lección"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Module Lessons ─────────────────────────────────────────────────────────
function ModuleLessons({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const { data: lessons, isLoading } = useModuleLessons(moduleId);
  const deleteLesson = useDeleteLesson();
  const reorderLessons = useReorderLessons();
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { if (lessons) setLocalLessons(lessons as Lesson[]); }, [lessons]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localLessons.findIndex(l => l.id === active.id);
      const newIndex = localLessons.findIndex(l => l.id === over.id);
      const newLessons = arrayMove(localLessons, oldIndex, newIndex);
      setLocalLessons(newLessons);
      reorderLessons.mutate({ moduleId, lessons: newLessons.map((l, i) => ({ id: l.id, order_index: i })) });
    }
  };

  if (isLoading) return <div className="py-2 text-sm text-muted-foreground animate-pulse">Cargando lecciones...</div>;

  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localLessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {localLessons.map(lesson => (
            <SortableLessonItem
              key={lesson.id} lesson={lesson} moduleId={moduleId}
              onEdit={() => setEditingLesson(lesson)}
              onDelete={() => deleteLesson.mutate(lesson.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={open => !open && setEditingLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Lección</DialogTitle></DialogHeader>
          {editingLesson && <LessonEditor lesson={editingLesson} moduleId={moduleId} onClose={() => setEditingLesson(null)} />}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground text-xs h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Añadir lección
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Lección — {moduleTitle}</DialogTitle></DialogHeader>
          <LessonEditor lesson={null} moduleId={moduleId} onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Module Exams ─────────────────────────────────────────────────────────────
function ModuleExams({ moduleId, courseId }: { moduleId: string; courseId: string }) {
  const navigate = useNavigate();
  const { data: allExams } = useInstructorExams(courseId);
  const createExam = useCreateExam();
  const deleteExam = useDeleteExam();
  const { toast } = useToast();
  const moduleExams = allExams?.filter((e: any) => e.module_id === moduleId) || [];

  const handleCreateExam = async () => {
    try {
      const exam = await createExam.mutateAsync({ title: "Nueva Evaluación", course_id: courseId, module_id: moduleId });
      navigate(`/dashboard/exam-editor/${exam.id}`);
    } catch {
      toast({ title: "Error", description: "No se pudo crear la evaluación", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-1.5">
      {moduleExams.map((exam: any) => (
        <div key={exam.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 group">
          <FileQuestion className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="flex-1 text-sm font-medium truncate">{exam.title}</span>
          <Badge variant={exam.is_published ? "default" : "secondary"} className="text-xs">
            {exam.is_published ? "Publicado" : "Borrador"}
          </Badge>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/dashboard/exam-editor/${exam.id}`)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => { if (confirm("¿Eliminar esta evaluación?")) deleteExam.mutate(exam.id); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground text-xs h-8"
        onClick={handleCreateExam} disabled={createExam.isPending}>
        <FileQuestion className="h-3.5 w-3.5 mr-1.5" />
        {createExam.isPending ? "Creando..." : "Añadir evaluación"}
      </Button>
    </div>
  );
}

// ─── Sortable Module Item ─────────────────────────────────────────────────────
function SortableModuleItem({
  module, index, onEdit, onDelete, children
}: {
  module: Module; index: number; onEdit: () => void; onDelete: () => void; children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const [isExpanded, setIsExpanded] = useState(true);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className={cn("border rounded-xl overflow-hidden shadow-sm", isDragging && "opacity-50 shadow-lg")}>
      <div className="flex items-center bg-muted/40 group border-b border-border/50">
        <button {...attributes} {...listeners} className="p-3 touch-none cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-3 py-3 pl-0 text-left">
          <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{module.title}</div>
            {module.description && <div className="text-xs text-muted-foreground line-clamp-1">{module.description}</div>}
          </div>
          <svg className={cn("h-4 w-4 shrink-0 transition-transform duration-200 mr-2 text-muted-foreground", isExpanded && "rotate-180")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
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
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {isExpanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
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
  const submitForReview = useSubmitCourseForReview();
  const reorderModules = useReorderModules();

  const backUrl = role === "admin" ? "/dashboard/admin-courses" : "/dashboard/instructor-courses";

  const [activeSection, setActiveSection] = useState("basico");
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
  const [coursePrice, setCoursePrice] = useState(0);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [forumEnabled, setForumEnabled] = useState(true);
  const [forumModerationMode, setForumModerationMode] = useState<'open' | 'moderated' | 'closed'>('open');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (course) {
      setCourseTitle(course.title);
      setCourseDescription(course.description || "");
      setCourseLevel(course.level);
      setCourseDuration(course.duration_hours || 0);
      setCourseImage(course.image_url || "");
      setCoursePrice(course.price || 0);
      setObjectives((course as any).learning_objectives || []);
      setRequirements((course as any).requirements || []);
      setTargetAudience((course as any).target_audience || "");
      if (course.forum_enabled !== undefined) setForumEnabled(course.forum_enabled);
      if (course.forum_moderation_mode) setForumModerationMode(course.forum_moderation_mode as any);
    }
  }, [course]);

  useEffect(() => { if (modules) setLocalModules(modules as Module[]); }, [modules]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && courseId) {
      const oldIndex = localModules.findIndex(m => m.id === active.id);
      const newIndex = localModules.findIndex(m => m.id === over.id);
      const newModules = arrayMove(localModules, oldIndex, newIndex);
      setLocalModules(newModules);
      reorderModules.mutate({ courseId, modules: newModules.map((m, i) => ({ id: m.id, order_index: i })) });
    }
  };

  const handleCreateModule = async () => {
    if (!courseId || !newModule.title.trim()) return;
    await createModule.mutateAsync({ courseId, title: newModule.title, description: newModule.description, orderIndex: localModules.length });
    setNewModule({ title: "", description: "" });
    setModuleDialogOpen(false);
  };

  const handleUpdateModule = async () => {
    if (!editingModule) return;
    await updateModule.mutateAsync({ id: editingModule.id, title: editingModule.title, description: editingModule.description });
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
      price: coursePrice,
      learning_objectives: objectives,
      requirements,
      target_audience: targetAudience,
      forum_enabled: forumEnabled,
      forum_moderation_mode: forumModerationMode,
    } as any);
  };

  const handleTogglePublish = () => {
    if (!courseId || !course) return;
    // Si el curso está en borrador, enviarlo para revisión en lugar de publicarlo directamente
    if (!course.is_published && course.publication_status !== 'pending_review') {
      submitForReview.mutate(courseId);
    } else {
      togglePublish.mutate({ id: courseId, is_published: !course.is_published });
    }
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
        <Button variant="link" onClick={() => navigate(backUrl)}>Volver a cursos</Button>
      </div>
    );
  }

  // Progress bar stats
  const totalModules = localModules.length;

  return (
    <div className="max-w-6xl mx-auto space-y-0">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b pb-3 mb-6 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate leading-tight">{courseTitle || "Editor de Curso"}</h1>
            <p className="text-xs text-muted-foreground">
              {totalModules} módulo{totalModules !== 1 ? "s" : ""} · {course.is_published ? "Publicado" : "Borrador"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={course.is_published ? "default" : "secondary"} className="hidden sm:flex">
              {course.is_published ? "Publicado" : "Borrador"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/course/${courseId}`)} className="gap-2 hidden sm:flex">
              <Eye className="h-4 w-4" />
              Ver como alumno
            </Button>
            <Button
              variant={course.is_published ? "outline" : "default"}
              size="sm"
              onClick={handleTogglePublish}
              disabled={togglePublish.isPending}
              className="gap-2"
            >
              {course.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {togglePublish.isPending ? "..." : course.is_published ? "Despublicar" : "Publicar"}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 6-Tab Navigation ─── */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6 h-auto gap-1">
          <TabsTrigger value="basico" className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2.5 text-xs sm:text-sm">
            <GraduationCap className="h-4 w-4" />
            <span>Básico</span>
          </TabsTrigger>
          <TabsTrigger value="curriculum" className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2.5 text-xs sm:text-sm">
            <BookOpen className="h-4 w-4" />
            <span>Currículum</span>
          </TabsTrigger>
          <TabsTrigger value="objetivos" className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2.5 text-xs sm:text-sm">
            <Target className="h-4 w-4" />
            <span>Objetivos</span>
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2.5 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            <span>Config.</span>
          </TabsTrigger>
          <TabsTrigger value="comunidad" className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2.5 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>Comunidad</span>
          </TabsTrigger>
          <TabsTrigger value="lanzar" className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2.5 text-xs sm:text-sm">
            <Rocket className="h-4 w-4" />
            <span>Lanzar</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: BÁSICO  
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="basico">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cover image — prominent left column */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Imagen de portada</Label>
              <div className="aspect-video rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/30">
                {courseImage ? (
                  <img src={courseImage} alt="Portada" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Sin portada</p>
                  </div>
                )}
              </div>
              <ImageUploader
                value={courseImage}
                onChange={setCourseImage}
                bucket="course-materials"
                folder="banners"
                placeholder="URL de imagen..."
              />
              <p className="text-xs text-muted-foreground">Recomendado: 1280×720px. Se comprimirá a WebP automáticamente.</p>
            </div>

            {/* Main info — right 2 columns */}
            <div className="lg:col-span-2 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="course-title" className="text-sm font-semibold">Título del curso *</Label>
                <Input
                  id="course-title"
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  placeholder="Nombre del curso"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-description" className="text-sm font-semibold">Descripción</Label>
                <Textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={e => setCourseDescription(e.target.value)}
                  placeholder="Describe el contenido, el enfoque y los beneficios del curso"
                  rows={5}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-level" className="text-sm font-semibold">Nivel</Label>
                  <Select value={courseLevel} onValueChange={setCourseLevel}>
                    <SelectTrigger id="course-level"><SelectValue placeholder="Selecciona nivel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="básico">Básico</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                      <SelectItem value="experto">Experto</SelectItem>
                      <SelectItem value="único">Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-duration" className="text-sm font-semibold">Duración estimada (horas)</Label>
                  <Input
                    id="course-duration"
                    type="number"
                    min="0"
                    value={courseDuration}
                    onChange={e => setCourseDuration(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveCourse} disabled={updateCourse.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updateCourse.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: CURRÍCULUM
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="curriculum">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                Módulos y Lecciones
              </CardTitle>
              <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />Nuevo Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Crear Módulo</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-title">Título del módulo *</Label>
                      <Input
                        id="module-title"
                        value={newModule.title}
                        onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                        placeholder="Ej: Módulo 1 - Introducción"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="module-description">Descripción (opcional)</Label>
                      <Textarea
                        id="module-description"
                        value={newModule.description}
                        onChange={e => setNewModule({ ...newModule, description: e.target.value })}
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={localModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {localModules.map((module, index) => (
                        <SortableModuleItem
                          key={module.id} module={module} index={index}
                          onEdit={() => setEditingModule({ id: module.id, title: module.title, description: module.description || "" })}
                          onDelete={() => deleteModule.mutate(module.id)}
                        >
                          {/* Lessons */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <FileText className="h-3 w-3" /> Lecciones
                            </p>
                            <ModuleLessons moduleId={module.id} moduleTitle={module.title} />
                          </div>

                          {/* Exams */}
                          <div className="pt-2 border-t border-dashed">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <FileQuestion className="h-3 w-3" /> Evaluaciones
                            </p>
                            <ModuleExams moduleId={module.id} courseId={courseId!} />
                          </div>

                          {/* Materials */}
                          <div className="pt-2 border-t border-dashed">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <BookOpen className="h-3 w-3" /> Materiales
                            </p>
                            <ModuleMaterialsEditor moduleId={module.id} />
                          </div>

                          {/* Live Sessions */}
                          <div className="pt-2 border-t border-dashed">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Radio className="h-3 w-3" /> Clases en Vivo
                            </p>
                            <InstructorLiveSessions moduleId={module.id} />
                          </div>
                        </SortableModuleItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-16 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">Sin módulos</h3>
                  <p className="text-muted-foreground text-sm mb-4">Añade módulos para organizar el contenido de tu curso</p>
                  <Button variant="outline" onClick={() => setModuleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Crear primer módulo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: OBJETIVOS
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="objetivos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objetivos de Aprendizaje
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Define qué aprenderán los estudiantes, qué deben saber antes de tomar el curso y a quién está dirigido.
              </p>
            </CardHeader>
            <CardContent>
              <CourseObjectivesEditor
                objectives={objectives}
                requirements={requirements}
                targetAudience={targetAudience}
                onObjectivesChange={setObjectives}
                onRequirementsChange={setRequirements}
                onTargetAudienceChange={setTargetAudience}
              />
              <div className="flex justify-end mt-8 pt-4 border-t">
                <Button onClick={handleSaveCourse} disabled={updateCourse.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updateCourse.isPending ? "Guardando..." : "Guardar Objetivos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: COMUNIDAD
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="comunidad">
          <ForumModerationPanel 
            courseId={courseId!}
            forumEnabled={forumEnabled}
            moderationMode={forumModerationMode}
            onUpdateConfig={(enabled, mode) => {
              setForumEnabled(enabled);
              setForumModerationMode(mode);
              // Trigger auto-save or wait for manual save
              updateCourse.mutate({ id: courseId, forum_enabled: enabled, forum_moderation_mode: mode } as any);
            }}
            isUpdating={updateCourse.isPending}
          />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: CONFIGURACIÓN
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="configuracion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del Curso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {role === "admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="cfg-price">Precio (USD)</Label>
                    <Input
                      id="cfg-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={coursePrice}
                      onChange={e => setCoursePrice(parseFloat(e.target.value) || 0)}
                      placeholder="0 = Gratis"
                    />
                    <p className="text-xs text-muted-foreground">Escribe 0 para hacer el curso gratuito</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="cfg-duration">Duración estimada (horas)</Label>
                  <Input
                    id="cfg-duration"
                    type="number"
                    min="0"
                    value={courseDuration}
                    onChange={e => setCourseDuration(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cfg-level">Nivel del curso</Label>
                <Select value={courseLevel} onValueChange={setCourseLevel}>
                  <SelectTrigger id="cfg-level"><SelectValue placeholder="Selecciona nivel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="básico">Básico</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                    <SelectItem value="experto">Experto</SelectItem>
                    <SelectItem value="único">Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Vista previa del curso
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Revisa cómo verán tu curso los estudiantes antes de publicarlo.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/course/${courseId}`)} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir Vista de Alumno
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveCourse} disabled={updateCourse.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updateCourse.isPending ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: LANZAR
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="lanzar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Checklist de Lanzamiento
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Completa todos los requisitos para publicar tu curso y hacerlo visible para los estudiantes.
              </p>
            </CardHeader>
            <CardContent className="py-4">
              <CourseLaunchChecklist
                course={{ ...course, learning_objectives: objectives }}
                modules={localModules}
                onPublish={handleTogglePublish}
                isPublishing={togglePublish.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Edit Module Dialog ─── */}
      <Dialog open={!!editingModule} onOpenChange={open => !open && setEditingModule(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Módulo</DialogTitle></DialogHeader>
          {editingModule && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Título del módulo *</Label>
                <Input value={editingModule.title} onChange={e => setEditingModule({ ...editingModule, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={editingModule.description} onChange={e => setEditingModule({ ...editingModule, description: e.target.value })} />
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
