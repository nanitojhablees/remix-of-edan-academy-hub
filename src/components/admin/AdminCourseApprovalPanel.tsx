import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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
  useCoursesPendingReview, 
  useApproveCoursePublication, 
  useRejectCoursePublication 
} from "@/hooks/useInstructorData";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Clock,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseForReview {
  id: string;
  title: string;
  description: string | null;
  level: string;
  image_url: string | null;
  duration_hours: number;
  instructor_id: string;
  is_published: boolean;
  publication_status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  price: number;
  created_at: string;
  updated_at: string;
  instructor_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export function AdminCourseApprovalPanel() {
  const { data: pendingCourses = [], isLoading, refetch } = useCoursesPendingReview();
  const approveCourse = useApproveCoursePublication();
  const rejectCourse = useRejectCoursePublication();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<CourseForReview | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async (courseId: string) => {
    try {
      await approveCourse.mutateAsync(courseId);
      refetch();
      toast({
        title: "Curso aprobado",
        description: "El curso ha sido aprobado y ahora está publicado.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (courseId: string) => {
    try {
      await rejectCourse.mutateAsync(courseId);
      refetch();
      toast({
        title: "Curso rechazado",
        description: "El curso ha sido rechazado y no se publicará.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cursos Pendientes de Aprobación
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lista de cursos creados por instructores que requieren aprobación antes de ser publicados
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingCourses.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No hay cursos pendientes</h3>
              <p className="text-sm text-muted-foreground">
                Todos los cursos han sido revisados y aprobados o rechazados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCourses.map((course: CourseForReview) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {course.image_url ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={course.image_url} alt={course.title} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                            {course.description || "Sin descripción"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={course.instructor_profile.avatar_url || undefined} 
                            alt={`${course.instructor_profile.first_name} ${course.instructor_profile.last_name}`}
                          />
                          <AvatarFallback>
                            {course.instructor_profile.first_name.charAt(0)}
                            {course.instructor_profile.last_name?.charAt(0) || ''}
                          </AvatarFallback>
                        </Avatar>
                        <span>{course.instructor_profile.first_name} {course.instructor_profile.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(course.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/dashboard/course/${course.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Vista previa del curso</DialogTitle>
                              <DialogDescription>
                                Revisa el contenido del curso antes de tomar una decisión
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex justify-center">
                                {course.image_url ? (
                                  <img 
                                    src={course.image_url} 
                                    alt={course.title} 
                                    className="max-w-md h-auto rounded-lg"
                                  />
                                ) : (
                                  <div className="w-64 h-36 bg-muted rounded-lg flex items-center justify-center">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{course.title}</h3>
                                <p className="text-muted-foreground mt-2">{course.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Nivel:</span> {course.level}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duración:</span> {course.duration_hours} horas
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Precio:</span> ${course.price.toFixed(2)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Creado:</span> {formatDate(course.created_at)}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCourse(course);
                                setActionType("approve");
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                              Aprobar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Aprobar este curso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas aprobar el curso "{selectedCourse?.title}"? 
                                Este curso será publicado y visible para los estudiantes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => selectedCourse && handleApprove(selectedCourse.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Aprobar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCourse(course);
                                setActionType("reject");
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1 text-red-500" />
                              Rechazar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Rechazar este curso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas rechazar el curso "{selectedCourse?.title}"? 
                                Este curso no será publicado y el instructor recibirá una notificación.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => selectedCourse && handleReject(selectedCourse.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Rechazar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
