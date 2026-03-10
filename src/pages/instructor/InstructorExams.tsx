import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorExams, useCreateExam, useDeleteExam } from "@/hooks/useExams";
import { useInstructorCourses } from "@/hooks/useInstructorData";
import { useCourseModules } from "@/hooks/useCourses";
import { useInstructorCourses } from "@/hooks/useInstructorData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileQuestion, Clock, Users, Trash2, Edit, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function InstructorExams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: exams, isLoading } = useInstructorExams();
  const { data: courses } = useInstructorCourses();
  const createExam = useCreateExam();
  const deleteExam = useDeleteExam();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    course_id: '',
    module_id: ''
  });
  
  const { data: modules } = useCourseModules(newExam.course_id || undefined);
  
  const handleCreateExam = async () => {
    if (!newExam.title.trim() || !newExam.course_id) {
      toast({
        title: "Error",
        description: "Completa todos los campos",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const exam = await createExam.mutateAsync({
        title: newExam.title,
        course_id: newExam.course_id,
        module_id: newExam.module_id || undefined,
      });
      
      setCreateDialogOpen(false);
      setNewExam({ title: '', course_id: '', module_id: '' });
      navigate(`/dashboard/exam-editor/${exam.id}`);
      
      toast({
        title: "Examen creado",
        description: "Ahora puedes agregar preguntas"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el examen",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteExam = async (examId: string) => {
    if (!confirm('¿Estás seguro de eliminar este examen?')) return;
    
    try {
      await deleteExam.mutateAsync(examId);
      toast({
        title: "Eliminado",
        description: "El examen ha sido eliminado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Evaluaciones</h1>
          <p className="text-muted-foreground mt-1">
            Crea y gestiona exámenes para tus cursos
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Examen
        </Button>
      </div>
      
      {exams && exams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam: any) => (
            <Card key={exam.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5 text-primary" />
                    <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                      {exam.is_published ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/exam-editor/${exam.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <CardDescription>
                  {exam.courses?.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{exam.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{exam.passing_score}% para aprobar</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/dashboard/exam-editor/${exam.id}`)}
                >
                  Editar examen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Sin evaluaciones</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              Crea exámenes para evaluar el progreso de tus estudiantes
            </p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer examen
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Create Exam Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Examen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título del examen</Label>
              <Input
                value={newExam.title}
                onChange={(e) => setNewExam(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Examen Final - Módulo 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select
                value={newExam.course_id}
                onValueChange={(value) => setNewExam(prev => ({ ...prev, course_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateExam}
              disabled={createExam.isPending}
            >
              {createExam.isPending ? 'Creando...' : 'Crear examen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
