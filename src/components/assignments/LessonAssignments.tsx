import { useState } from "react";
import { useLessonAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, Assignment } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, FileText, Edit } from "lucide-react";
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

export function LessonAssignments({ lessonId }: { lessonId: string }) {
  const { data: assignments, isLoading } = useLessonAssignments(lessonId);
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ title: "", description: "", max_score: 100 });

  const resetForm = () => {
    setFormData({ title: "", description: "", max_score: 100 });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      max_score: assignment.max_score || 100
    });
    setEditingId(assignment.id);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    if (editingId) {
      await updateAssignment.mutateAsync({
        id: editingId,
        lesson_id: lessonId,
        title: formData.title,
        description: formData.description,
        max_score: formData.max_score
      });
    } else {
      await createAssignment.mutateAsync({
        lesson_id: lessonId,
        title: formData.title,
        description: formData.description,
        max_score: formData.max_score
      });
    }
    resetForm();
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Cargando tareas...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tareas de la lección</h3>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div className="border rounded-md p-4 bg-muted/20 space-y-4">
          <div className="grid gap-2">
            <Label>Título de la tarea *</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Ensayo sobre el tema"
            />
          </div>
          <div className="grid gap-2">
            <Label>Instrucciones detalladas</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe lo que el alumno debe hacer y entregar..."
            />
          </div>
          <div className="grid gap-2 w-1/3">
            <Label>Puntaje Máximo</Label>
            <Input 
              type="number" 
              min="1"
              value={formData.max_score} 
              onChange={e => setFormData({ ...formData, max_score: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createAssignment.isPending || updateAssignment.isPending || !formData.title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Tarea
            </Button>
          </div>
        </div>
      )}

      {assignments && assignments.length > 0 && !isCreating && !editingId && (
        <div className="space-y-2">
          {assignments.map(assignment => (
            <div key={assignment.id} className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors group">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block">{assignment.title}</span>
                <span className="text-sm text-muted-foreground">{assignment.max_score} pts máx</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Eliminar "{assignment.title}" borrará también las entregas de los estudiantes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteAssignment.mutate({ id: assignment.id, lesson_id: lessonId })} className="bg-destructive hover:bg-destructive/90">
                        Eliminar Tarea
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {assignments?.length === 0 && !isCreating && (
        <div className="text-center py-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
          No hay tareas en esta lección.
        </div>
      )}
    </div>
  );
}
