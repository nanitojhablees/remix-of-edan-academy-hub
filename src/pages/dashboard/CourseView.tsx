import { useParams, useNavigate } from "react-router-dom";
import { useCourse, useCourseModules, useEnrollment } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, PlayCircle, CheckCircle, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: modules, isLoading: loadingModules } = useCourseModules(courseId);
  const { data: enrollment } = useEnrollment(courseId);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessonsMap, setLessonsMap] = useState<Record<string, any[]>>({});

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
        <Button onClick={() => navigate("/dashboard/catalog")}>
          Volver al catálogo
        </Button>
      </div>
    );
  }

  const currentLessonData = selectedLesson 
    ? Object.values(lessonsMap).flat().find(l => l.id === selectedLesson)
    : null;

  return (
    <div>
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/dashboard/my-courses")}
      >
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
                      <div className="space-y-1 pb-4">
                        {lessonsMap[module.id]?.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => enrollment ? setSelectedLesson(lesson.id) : null}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                              selectedLesson === lesson.id ? 'bg-muted' : ''
                            } ${!enrollment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {enrollment ? (
                              <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            <span className="text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                          </button>
                        ))}
                      </div>
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
              <Badge variant="outline" className="w-fit mb-2">
                Nivel {course.level}
              </Badge>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <p className="text-muted-foreground">{course.description}</p>
            </CardHeader>
          </Card>

          {currentLessonData ? (
            <Card>
              <CardHeader>
                <CardTitle>{currentLessonData.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentLessonData.video_url && (
                  <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Video disponible próximamente</span>
                  </div>
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {currentLessonData.content || "Contenido de la lección próximamente."}
                </div>
                <div className="flex justify-end mt-6">
                  <Button className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Marcar como completada
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {enrollment ? "Selecciona una lección" : "Inscríbete para acceder"}
                </h3>
                <p className="text-muted-foreground">
                  {enrollment 
                    ? "Elige una lección del menú lateral para comenzar"
                    : "Debes inscribirte en el curso para acceder al contenido"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
