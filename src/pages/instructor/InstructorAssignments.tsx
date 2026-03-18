import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function InstructorAssignments() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["instructor-submissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select(`
          *,
          user:profiles(first_name, last_name, email),
          assignment:assignments(
            title, 
            max_score, 
            lesson:lessons(
              title, 
              module:modules(
                course:courses(title, instructor_id)
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out submissions for courses this instructor doesn't own (if they are not admin)
      if (role === 'admin') return data;
      
      return data.filter((sub: any) => 
        sub.assignment?.lesson?.module?.course?.instructor_id === user.id
      );
    },
    enabled: !!user
  });

  const gradeMutation = useMutation({
    mutationFn: async (params: { id: string, score: number, feedback: string }) => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .update({
          status: 'graded',
          score: params.score,
          feedback: params.feedback
        })
        .eq('id', params.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-submissions", user?.id] });
      toast({ title: "Calificación guardada exitosamente" });
      setSelectedSubmission(null);
    },
    onError: (error) => {
      toast({ title: "Error al calificar", description: error.message, variant: "destructive" });
    }
  });

  const handleGrade = () => {
    if (!selectedSubmission) return;
    if (score < 0 || score > (selectedSubmission.assignment.max_score || 100)) {
      toast({ title: "Puntuación inválida", variant: "destructive" });
      return;
    }
    gradeMutation.mutate({
      id: selectedSubmission.id,
      score,
      feedback
    });
  };

  const openGradingModal = (sub: any) => {
    setSelectedSubmission(sub);
    setScore(sub.score || 0);
    setFeedback(sub.feedback || "");
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando entregas...</div>;

  const pending = submissions?.filter(s => s.status === 'pending') || [];
  const graded = submissions?.filter(s => s.status === 'graded') || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revisión de Tareas</h1>
          <p className="text-muted-foreground mt-1">Evalúa los proyectos entregados por tus estudiantes.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pendientes de Revisión ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                No hay tareas pendientes por revisar. ¡Buen trabajo!
              </div>
            ) : (
              pending.map((sub: any) => (
                <div key={sub.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{sub.assignment?.title}</h4>
                      <p className="text-sm text-primary">
                        {sub.assignment?.lesson?.module?.course?.title}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendiente</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span className="font-medium text-foreground">
                      {sub.user?.first_name} {sub.user?.last_name}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(sub.created_at), "d MMM yyyy, HH:mm", { locale: es })}</span>
                  </div>

                  <Button onClick={() => openGradingModal(sub)} className="w-full">
                    Evaluar Entrega
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Calificadas ({graded.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {graded.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                Aún no has calificado ninguna tarea.
              </div>
            ) : (
              graded.slice(0, 10).map((sub: any) => ( // Show only last 10
                <div key={sub.id} className="p-4 border rounded-lg bg-muted/10 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{sub.assignment?.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {sub.user?.first_name} {sub.user?.last_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      {sub.score} / {sub.assignment?.max_score} pts
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openGradingModal(sub)} className="w-full text-xs h-8">
                    Ver o Editar Calificación
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluando Entrega</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-1">{selectedSubmission.assignment?.title}</h3>
                <p className="text-sm text-muted-foreground">Curso: {selectedSubmission.assignment?.lesson?.module?.course?.title}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Estudiante: </span>
                    <span className="font-medium">{selectedSubmission.user?.first_name} {selectedSubmission.user?.last_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Puntaje Máx: </span>
                    <span className="font-medium">{selectedSubmission.assignment?.max_score} pts</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> 
                  Trabajo Entregado
                </h4>
                {selectedSubmission.content && (
                  <div className="p-4 border rounded-md bg-background text-sm whitespace-pre-wrap mb-4">
                    {selectedSubmission.content}
                  </div>
                )}
                
                {selectedSubmission.file_url ? (
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Abrir Archivo Adjunto
                    </a>
                  </Button>
                ) : !selectedSubmission.content ? (
                  <p className="text-sm text-muted-foreground italic">El estudiante no envió contenido ni archivo.</p>
                ) : null}
              </div>

              <div className="grid gap-4 border-t pt-4">
                <div className="grid gap-2 w-1/3">
                  <Label>Calificación Otorgada</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min="0" 
                      max={selectedSubmission.assignment?.max_score || 100}
                      value={score} 
                      onChange={e => setScore(Number(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">/ {selectedSubmission.assignment?.max_score} pts</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Comentarios de Retroalimentación</Label>
                  <Textarea 
                    placeholder="Escribe comentarios formativos para el estudiante..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)} disabled={gradeMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleGrade} disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? "Guardando..." : "Guardar Calificación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
