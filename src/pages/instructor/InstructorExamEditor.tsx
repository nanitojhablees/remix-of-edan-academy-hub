import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  useInstructorExamDetails, 
  useUpdateExam, 
  useCreateQuestion, 
  useUpdateQuestion,
  useDeleteQuestion 
} from "@/hooks/useExams";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, GripVertical, Check, Save, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuestionForm {
  question_text: string;
  points: number;
  options: Array<{ option_text: string; is_correct: boolean }>;
}

const emptyQuestion: QuestionForm = {
  question_text: '',
  points: 1,
  options: [
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ]
};

export default function InstructorExamEditor() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: exam, isLoading, refetch } = useInstructorExamDetails(examId);
  const updateExam = useUpdateExam();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  
  const [examSettings, setExamSettings] = useState({
    title: '',
    description: '',
    duration_minutes: 30,
    passing_score: 70,
    max_attempts: 3,
    is_published: false
  });
  
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestion);
  
  // Initialize settings when exam loads
  useState(() => {
    if (exam) {
      setExamSettings({
        title: exam.title,
        description: exam.description || '',
        duration_minutes: exam.duration_minutes,
        passing_score: exam.passing_score,
        max_attempts: exam.max_attempts,
        is_published: exam.is_published
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Examen no encontrado</h2>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }
  
  const handleSaveSettings = async () => {
    try {
      await updateExam.mutateAsync({
        id: examId!,
        ...examSettings
      });
      toast({
        title: "Guardado",
        description: "Configuración actualizada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar",
        variant: "destructive"
      });
    }
  };
  
  const handleOpenQuestionDialog = (questionId?: string) => {
    if (questionId) {
      const q = exam.questions?.find((q: any) => q.id === questionId);
      if (q) {
        setEditingQuestionId(questionId);
        setQuestionForm({
          question_text: q.question_text,
          points: q.points,
          options: q.answer_options.map((o: any) => ({
            option_text: o.option_text,
            is_correct: o.is_correct
          }))
        });
      }
    } else {
      setEditingQuestionId(null);
      setQuestionForm(emptyQuestion);
    }
    setQuestionDialogOpen(true);
  };
  
  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) {
      toast({
        title: "Error",
        description: "La pregunta no puede estar vacía",
        variant: "destructive"
      });
      return;
    }
    
    const validOptions = questionForm.options.filter(o => o.option_text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Debe haber al menos 2 opciones",
        variant: "destructive"
      });
      return;
    }
    
    if (!validOptions.some(o => o.is_correct)) {
      toast({
        title: "Error",
        description: "Debe haber al menos una respuesta correcta",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (editingQuestionId) {
        await updateQuestion.mutateAsync({
          questionId: editingQuestionId,
          question: {
            question_text: questionForm.question_text,
            points: questionForm.points
          },
          options: validOptions
        });
      } else {
        await createQuestion.mutateAsync({
          question: {
            exam_id: examId!,
            question_text: questionForm.question_text,
            points: questionForm.points,
            order_index: exam.questions?.length || 0
          },
          options: validOptions
        });
      }
      
      setQuestionDialogOpen(false);
      refetch();
      toast({
        title: "Guardado",
        description: editingQuestionId ? "Pregunta actualizada" : "Pregunta creada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la pregunta",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;
    
    try {
      await deleteQuestion.mutateAsync(questionId);
      refetch();
      toast({
        title: "Eliminada",
        description: "La pregunta ha sido eliminada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive"
      });
    }
  };
  
  const handleOptionChange = (index: number, field: 'option_text' | 'is_correct', value: string | boolean) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => {
        if (i === index) {
          return { ...o, [field]: value };
        }
        // If setting this option as correct, unset others
        if (field === 'is_correct' && value === true) {
          return { ...o, is_correct: false };
        }
        return o;
      })
    }));
  };
  
  const addOption = () => {
    if (questionForm.options.length >= 6) return;
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { option_text: '', is_correct: false }]
    }));
  };
  
  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2) return;
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };
  
  const totalPoints = exam.questions?.reduce((sum: number, q: any) => sum + q.points, 0) || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">Editor de examen</p>
          </div>
        </div>
        <Badge variant={exam.is_published ? 'default' : 'secondary'}>
          {exam.is_published ? 'Publicado' : 'Borrador'}
        </Badge>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={examSettings.title || exam.title}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={examSettings.description || exam.description || ''}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración (min)</Label>
                  <Input
                    type="number"
                    value={examSettings.duration_minutes || exam.duration_minutes}
                    onChange={(e) => setExamSettings(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Para aprobar (%)</Label>
                  <Input
                    type="number"
                    value={examSettings.passing_score || exam.passing_score}
                    onChange={(e) => setExamSettings(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Máximo de intentos</Label>
                <Input
                  type="number"
                  value={examSettings.max_attempts || exam.max_attempts}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Publicar examen</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible para estudiantes
                  </p>
                </div>
                <Switch
                  checked={examSettings.is_published ?? exam.is_published}
                  onCheckedChange={(checked) => setExamSettings(prev => ({ ...prev, is_published: checked }))}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSaveSettings}
                disabled={updateExam.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateExam.isPending ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{exam.questions?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Preguntas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Puntos totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Questions panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Preguntas</CardTitle>
                <CardDescription>
                  Agrega y edita las preguntas del examen
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenQuestionDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva pregunta
              </Button>
            </CardHeader>
            <CardContent>
              {exam.questions?.length === 0 ? (
                <div className="text-center py-12">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Sin preguntas</h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega preguntas para crear tu examen
                  </p>
                  <Button onClick={() => handleOpenQuestionDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar primera pregunta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {exam.questions?.map((question: any, index: number) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="font-mono text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{question.question_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {question.answer_options?.length || 0} opciones
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.points} pts
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenQuestionDialog(question.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionId ? 'Editar pregunta' : 'Nueva pregunta'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Pregunta</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Escribe la pregunta aquí..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Puntos</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={questionForm.points}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                className="w-24"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Opciones de respuesta</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={questionForm.options.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Marca la opción correcta con el círculo verde
              </p>
              
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOptionChange(index, 'is_correct', true)}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      option.is_correct 
                        ? 'border-green-500 bg-green-500 text-white' 
                        : 'border-muted-foreground hover:border-green-500'
                    }`}
                  >
                    {option.is_correct && <Check className="h-4 w-4" />}
                  </button>
                  <Input
                    value={option.option_text}
                    onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="flex-1"
                  />
                  {questionForm.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveQuestion}
              disabled={createQuestion.isPending || updateQuestion.isPending}
            >
              {createQuestion.isPending || updateQuestion.isPending ? 'Guardando...' : 'Guardar pregunta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
