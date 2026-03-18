import { useState } from "react";
import { useLessonAssignments, useMySubmission, useSubmitAssignment } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { ImageUploader } from "@/components/editor/ImageUploader";
import { Label } from "@/components/ui/label";

export function StudentAssignmentView({ lessonId }: { lessonId: string }) {
  const { data: assignments, isLoading: loadingAssignments } = useLessonAssignments(lessonId);
  const assignment = assignments?.[0]; // Assuming 1 assignment per lesson for simplicity

  const { data: submission, isLoading: loadingSubmission } = useMySubmission(assignment?.id);
  const submitAssignment = useSubmitAssignment();

  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  if (loadingAssignments || loadingSubmission) {
    return <div className="animate-pulse h-32 bg-muted/50 rounded-lg" />;
  }

  if (!assignment) {
    return null; // No assignment for this lesson
  }

  const isGraded = submission?.status === 'graded';
  const isPending = submission?.status === 'pending';
  const showForm = !submission || isEditing;

  const handleSubmit = async () => {
    if (!content.trim() && !fileUrl) return;
    
    await submitAssignment.mutateAsync({
      assignment_id: assignment.id,
      content,
      file_url: fileUrl
    });
    
    setIsEditing(false);
  };

  return (
    <Card className="mt-8 border-primary/20 shadow-md">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Proyecto Práctico: {assignment.title}
            </CardTitle>
            <CardDescription className="text-sm">
              Esta lección incluye una tarea evaluada. Puntuación máxima: {assignment.max_score} pts.
            </CardDescription>
          </div>
          {isGraded && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-sm py-1 px-3">
              Calificada: {submission.score} / {assignment.max_score}
            </Badge>
          )}
          {isPending && !isEditing && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-sm py-1 px-3">
              Enviada - Pendiente de revisión
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Instrucciones */}
        {assignment.description && (
          <div className="bg-muted/30 p-4 rounded-lg prose prose-sm dark:prose-invert max-w-none">
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-foreground">
              <AlertCircle className="h-4 w-4" /> Instrucciones
            </h4>
            <div className="whitespace-pre-wrap">{assignment.description}</div>
          </div>
        )}

        {/* Feedback del instructor (si está calificada) */}
        {isGraded && submission.feedback && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Comentarios del Instructor
            </h4>
            <p className="text-sm italic">{submission.feedback}</p>
          </div>
        )}

        {/* Formulario de entrega */}
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium text-base">Tu entrega</h4>
            
            <div className="space-y-2">
              <Label>Texto, Enlace o Resolución</Label>
              <Textarea
                placeholder="Escribe aquí tu respuesta o pega el enlace a tu trabajo (Google Drive, Github, etc)..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Adjuntar Archivo (Opcional)</Label>
              <div className="border border-dashed rounded-lg p-4 bg-muted/10">
                <ImageUploader 
                  value={fileUrl}
                  onChange={setFileUrl}
                  bucket="course-materials"
                  folder="submissions"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {submission && (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              )}
              <Button 
                onClick={handleSubmit} 
                className="gap-2"
                disabled={(!content.trim() && !fileUrl) || submitAssignment.isPending}
              >
                <Upload className="h-4 w-4" />
                {submitAssignment.isPending ? "Enviando..." : "Enviar Tarea"}
              </Button>
            </div>
          </div>
        ) : (
          /* Vista de solo lectura de la entrega actual */
          <div className="border rounded-lg p-4 bg-muted/10 space-y-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> 
                Trabajo Enviado
              </h4>
              {!isGraded && (
                <Button variant="outline" size="sm" onClick={() => {
                  setContent(submission.content || "");
                  setFileUrl(submission.file_url || "");
                  setIsEditing(true);
                }}>
                  Editar Entrega
                </Button>
              )}
            </div>

            {submission.content && (
              <div className="bg-background border p-3 rounded text-sm whitespace-pre-wrap">
                {submission.content}
              </div>
            )}

            {submission.file_url && (
              <div className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                <FileText className="h-4 w-4" />
                <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                  Ver archivo adjunto
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
