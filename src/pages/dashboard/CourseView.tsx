import { useParams, useNavigate } from "react-router-dom";
import { useCourse, useCourseModules, useEnrollment, useMarkLessonComplete, useEnrollInCourse } from "@/hooks/useCourses";
import { useCourseCertificate, useIssueCertificate } from "@/hooks/useCertificates";
import { supabase } from "@/integrations/supabase/client";
import { useCourseExams } from "@/hooks/useExams";
import { useEnrollmentRequest } from "@/hooks/useEnrollmentRequests";
import { useActiveSubscription } from "@/hooks/useStudentPayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, BookOpen, PlayCircle, CheckCircle, Lock, Award, Download, MessageSquare, FileQuestion, ShoppingCart } from "lucide-react";
import { ModuleMaterialsViewer } from "@/components/materials/ModuleMaterials";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RichTextViewer } from "@/components/editor/RichTextEditor";
import { LessonDiscussion } from "@/components/comments/LessonDiscussion";
import { ContentPlayer } from "@/components/content/ContentPlayer";
import { useStudentPreview } from "@/hooks/useStudentPreview";
import { EnrollmentModal } from "@/components/enrollment/EnrollmentModal";
import { hasVipAccess } from "@/utils/courseAccess";
import { StudentAssignmentView } from "@/components/assignments/StudentAssignmentView";

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { isStudentPreview } = useStudentPreview();
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: modules, isLoading: loadingModules } = useCourseModules(courseId);
  const { data: enrollment } = useEnrollment(courseId);
  const { data: certificate } = useCourseCertificate(courseId);
  const { data: courseExams } = useCourseExams(courseId);
  const { data: enrollmentRequest } = useEnrollmentRequest(courseId);
  const { data: activeSubscription } = useActiveSubscription();
  const markLessonComplete = useMarkLessonComplete();
  const issueCertificate = useIssueCertificate();
  const enrollInCourse = useEnrollInCourse();
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessonsMap, setLessonsMap] = useState<Record<string, any[]>>({});
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // In student preview: simulate a student WITH active enrollment (full content access, no edit controls)
  // Normal: admin/instructor always have access
  const isPrivileged = (role === "admin" || role === "instructor") && !isStudentPreview;
  const canAccessContent = enrollment || isPrivileged || isStudentPreview;

  // Validate Access Rules
  const isFree = !course?.price || course.price <= 0;
  const hasVip = activeSubscription && course ? hasVipAccess(course.level, activeSubscription.plan?.level) : false;

  // Load lessons for all modules
  useEffect(() => {
    if (modules) {
      modules.forEach(async (module) => {
        const { data } = await supabase
          .from("lessons")
          .select("*")
          .eq("module_id", module.id)
          .order("order_index");
        
        if (data) {
          setLessonsMap(prev => ({ ...prev, [module.id]: data }));
        }
      });
    }
  }, [modules]);

  // Load completed lessons
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      
      const allLessons = Object.values(lessonsMap).flat();
      if (allLessons.length === 0) return;
      
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in("lesson_id", allLessons.map(l => l.id));
      
      if (data) {
        setCompletedLessons(new Set(data.map(p => p.lesson_id)));
      }
    };
    
    loadProgress();
  }, [lessonsMap, user]);

  const allLessons = Object.values(lessonsMap).flat();
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(l => completedLessons.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCompleted = totalLessons > 0 && completedCount === totalLessons;

  const handleMarkComplete = async (lessonId: string) => {
    if (!user || !courseId) return;
    
    try {
      setLoadingCompletion(true);
      await markLessonComplete.mutateAsync(lessonId);
      setCompletedLessons(prev => new Set([...prev, lessonId]));
      
      toast({ title: "Lección completada", description: "Tu progreso ha sido guardado" });
      
      const newCompletedCount = completedCount + 1;
      if (newCompletedCount === totalLessons && !certificate) {
        try {
          await issueCertificate.mutateAsync({ courseId, grade: 100 });
          toast({ title: "¡Felicidades!", description: "Has completado el curso y obtenido tu certificado" });
        } catch (certError) {
          console.error('Error issuing certificate:', certError);
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast({ title: "Error", description: "No se pudo marcar la lección como completada", variant: "destructive" });
    } finally {
      setLoadingCompletion(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ certificateId: certificate.id, action: 'download' })
        }
      );
      if (!response.ok) throw new Error('Error generating certificate');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${certificate.certificate_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Error", description: "No se pudo descargar el certificado", variant: "destructive" });
    }
  };

  if (loadingCourse || loadingModules) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Curso no encontrado</h2>
        <Button onClick={() => navigate("/dashboard/catalog")}>Volver al catálogo</Button>
      </div>
    );
  }

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      await enrollInCourse.mutateAsync(courseId);
    } catch (e) {
      // error handled in mutation
    } finally {
      setEnrolling(false);
    }
  };

  const currentLessonData = selectedLesson 
    ? Object.values(lessonsMap).flat().find(l => l.id === selectedLesson)
    : null;

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/dashboard/my-courses")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Mis Cursos
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar with modules */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contenido del Curso</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{modules?.length || 0} módulos</span>
                </div>
              </div>
              {enrollment && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {modules?.map((module) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="text-left">
                        <span className="font-medium">{module.title}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lessonsMap[module.id]?.length || 0} lecciones
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="space-y-1 pb-2">
                        {lessonsMap[module.id]?.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => canAccessContent ? setSelectedLesson(lesson.id) : null}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                              selectedLesson === lesson.id ? 'bg-muted' : ''
                            } ${!canAccessContent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {!canAccessContent ? (
                              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : completedLessons.has(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            <span className="text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                          </button>
                        ))}
                      </div>
                      {canAccessContent && courseExams?.filter(e => e.module_id === module.id).map(exam => (
                        <button
                          key={exam.id}
                          onClick={() => navigate(`/dashboard/exam/${exam.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-primary/5 transition-colors cursor-pointer border-t border-border/50"
                        >
                          <FileQuestion className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="flex-1 truncate">{exam.title}</span>
                          <Badge variant="outline" className="text-xs">Evaluación</Badge>
                        </button>
                      ))}
                      {canAccessContent && <ModuleMaterialsViewer moduleId={module.id} />}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge variant="outline" className="w-fit">Nivel {course.level}</Badge>
                {course.price > 0 && (
                  <span className="text-2xl font-bold text-foreground">${course.price}</span>
                )}
                {isCompleted && certificate && (
                  <Button size="sm" onClick={handleDownloadCertificate} className="gap-2">
                    <Award className="h-4 w-4" />
                    Descargar Certificado
                  </Button>
                )}
              </div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <p className="text-muted-foreground">{course.description}</p>

              {/* Enrollment CTA */}
              {!canAccessContent && !isPrivileged && (
                <div className="mt-4">
                  {enrollmentRequest?.status === "pending" ? (
                    <Button disabled className="w-full gap-2" variant="secondary">
                      <Clock className="h-4 w-4" />
                      Solicitud pendiente de aprobación
                    </Button>
                  ) : (isFree || hasVip) ? (
                    <Button 
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? (
                        <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> Inscribiendo...</span>
                      ) : (
                        <><ShoppingCart className="h-4 w-4" /> {hasVip && !isFree ? "Acceso VIP - Entrar gratis" : "Inscribirse gratis"}</>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full gap-2" onClick={() => setEnrollModalOpen(true)}>
                      <ShoppingCart className="h-4 w-4" />
                      Inscribirse — ${course.price}
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {isCompleted && certificate && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">¡Curso Completado!</h3>
                    <p className="text-sm text-muted-foreground">Tu certificado está disponible para descargar</p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadCertificate} className="gap-2">
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentLessonData && canAccessContent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{currentLessonData.title}</CardTitle>
                  {completedLessons.has(currentLessonData.id) && (
                    <Badge className="bg-green-500">Completada</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentLessonData.video_url && (
                  <div className="mb-6">
                    <ContentPlayer videoUrl={currentLessonData.video_url} title={currentLessonData.title} />
                  </div>
                )}

                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Contenido
                    </TabsTrigger>
                    <TabsTrigger value="discussion" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Discusión
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {currentLessonData.content ? (
                        <RichTextViewer content={currentLessonData.content} />
                      ) : (
                        <p className="text-muted-foreground">Contenido de la lección próximamente.</p>
                      )}
                    </div>

                    <StudentAssignmentView lessonId={currentLessonData.id} />

                    <div className="flex justify-end mt-6">
                      {!completedLessons.has(currentLessonData.id) ? (
                        <Button className="gap-2" onClick={() => handleMarkComplete(currentLessonData.id)} disabled={loadingCompletion}>
                          {loadingCompletion ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Marcar como completada
                        </Button>
                      ) : (
                        <Button variant="outline" disabled className="gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Completada
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="discussion">
                    <LessonDiscussion lessonId={currentLessonData.id} courseInstructorId={course.instructor_id || undefined} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : !canAccessContent ? (
            <Card className="text-center py-12">
              <CardContent>
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Contenido bloqueado</h3>
                <p className="text-muted-foreground mb-4">
                  Debes inscribirte en el curso para acceder a las lecciones y evaluaciones
                </p>
                {enrollmentRequest?.status === "pending" ? (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Tu solicitud está siendo revisada
                  </Badge>
                ) : (isFree || hasVip) ? (
                  <Button 
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> Inscribiendo...</span>
                    ) : (
                      <><ShoppingCart className="h-4 w-4" /> {hasVip && !isFree ? "Acceso VIP - Entrar gratis" : "Inscribirse gratis"}</>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => setEnrollModalOpen(true)} className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Inscribirse — ${course.price}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona una lección</h3>
                <p className="text-muted-foreground">Elige una lección del menú lateral para comenzar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      <EnrollmentModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        courseId={courseId || ""}
        courseTitle={course.title}
        coursePrice={course.price || 0}
      />
    </div>
  );
}
