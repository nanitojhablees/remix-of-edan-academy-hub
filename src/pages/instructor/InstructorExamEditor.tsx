import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ArrowLeft, Plus, Trash2, GripVertical, Check, Save, FileQuestion, 
  Image as ImageIcon, Shuffle, Eye, Clock, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/editor/FileUploader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type QuestionType = 'multiple_choice' | 'true_false' | 'open_answer';

interface QuestionForm {
  question_text: string;
  question_type: QuestionType;
  points: number;
  image_url: string;
  options: Array<{ option_text: string; is_correct: boolean }>;
}

const emptyMultipleChoice: QuestionForm = {
  question_text: '',
  question_type: 'multiple_choice',
  points: 1,
  image_url: '',
  options: [
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ]
};

const emptyTrueFalse: QuestionForm = {
  question_text: '',
  question_type: 'true_false',
  points: 1,
  image_url: '',
  options: [
    { option_text: 'Verdadero', is_correct: true },
    { option_text: 'Falso', is_correct: false },
  ]
};

const emptyOpenAnswer: QuestionForm = {
  question_text: '',
  question_type: 'open_answer',
  points: 1,
  image_url: '',
  options: [
    { option_text: 'Respuesta abierta (revisión manual)', is_correct: true },
  ]
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Selección Múltiple',
  true_false: 'Verdadero / Falso',
  open_answer: 'Respuesta Abierta',
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
    is_published: false,
    shuffle_questions: false,
    show_correct_answers: true,
  });
  
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyMultipleChoice);
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  // Initialize settings when exam loads
  useEffect(() => {
    if (exam && !settingsInitialized) {
      setExamSettings({
        title: exam.title,
        description: exam.description || '',
        duration_minutes: exam.duration_minutes,
        passing_score: exam.passing_score,
        max_attempts: exam.max_attempts,
        is_published: exam.is_published,
        shuffle_questions: exam.shuffle_questions ?? false,
        show_correct_answers: exam.show_correct_answers ?? true,
      });
      setSettingsInitialized(true);
    }
  }, [exam, settingsInitialized]);
  
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
    if (examSettings.passing_score < 70) {
      toast({
        title: "Error",
        description: "El porcentaje de aprobación no puede ser inferior al 70%",
        variant: "destructive"
      });
      return;
    }
    if (examSettings.passing_score > 100) {
      toast({
        title: "Error",
        description: "El porcentaje de aprobación no puede ser superior al 100%",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateExam.mutateAsync({
        id: examId!,
        ...examSettings
      });
      toast({
        title: "Guardado",
        description: "Configuración actualizada"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar",
        variant: "destructive"
      });
    }
  };
  
  const handleQuestionTypeChange = (type: QuestionType) => {
    if (type === 'true_false') {
      setQuestionForm(prev => ({
        ...prev,
        question_type: 'true_false',
        options: [
          { option_text: 'Verdadero', is_correct: prev.options[0]?.is_correct ?? true },
          { option_text: 'Falso', is_correct: !(prev.options[0]?.is_correct ?? true) },
        ]
      }));
    } else if (type === 'open_answer') {
      setQuestionForm(prev => ({
        ...prev,
        question_type: 'open_answer',
        options: [
          { option_text: 'Respuesta abierta (revisión manual)', is_correct: true },
        ]
      }));
    } else {
      setQuestionForm(prev => ({
        ...prev,
        question_type: 'multiple_choice',
        options: prev.options.length <= 2
          ? emptyMultipleChoice.options
          : prev.options,
      }));
    }
  };
  
  const handleOpenQuestionDialog = (questionId?: string) => {
    if (questionId) {
      const q = exam.questions?.find((q: any) => q.id === questionId);
      if (q) {
        setEditingQuestionId(questionId);
        const qType = q.question_type as QuestionType;
        setQuestionForm({
          question_text: q.question_text,
          question_type: (['multiple_choice', 'true_false', 'open_answer'].includes(qType) ? qType : 'multiple_choice') as QuestionType,
          points: q.points,
          image_url: q.image_url || '',
          options: q.answer_options.map((o: any) => ({
            option_text: o.option_text,
            is_correct: o.is_correct
          }))
        });
      }
    } else {
      setEditingQuestionId(null);
      setQuestionForm(emptyMultipleChoice);
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
    
    const validOptions = questionForm.question_type === 'open_answer'
      ? questionForm.options
      : questionForm.options.filter(o => o.option_text.trim());
    if (questionForm.question_type !== 'open_answer' && validOptions.length < 2) {
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
            question_type: questionForm.question_type,
            points: questionForm.points,
            image_url: questionForm.image_url || null,
          },
          options: validOptions
        });
      } else {
        await createQuestion.mutateAsync({
          question: {
            exam_id: examId!,
            question_text: questionForm.question_text,
            question_type: questionForm.question_type,
            points: questionForm.points,
            image_url: questionForm.image_url || undefined,
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
        if (field === 'is_correct' && value === true) {
          return { ...o, is_correct: false };
        }
        return o;
      })
    }));
  };
  
  const addOption = () => {
    if (questionForm.options.length >= 6 || questionForm.question_type === 'true_false') return;
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { option_text: '', is_correct: false }]
    }));
  };
  
  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2 || questionForm.question_type === 'true_false') return;
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
            <p className="text-muted-foreground">Editor de evaluación</p>
          </div>
        </div>
        <Badge variant={exam.is_published ? 'default' : 'secondary'}>
          {exam.is_published ? 'Publicado' : 'Borrador'}
        </Badge>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={examSettings.title}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={examSettings.description}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Publicar evaluación</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible para estudiantes
                  </p>
                </div>
                <Switch
                  checked={examSettings.is_published}
                  onCheckedChange={(checked) => setExamSettings(prev => ({ ...prev, is_published: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Parámetros de Evaluación
              </CardTitle>
              <CardDescription>Configura las condiciones del examen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Duración (minutos)</Label>
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={examSettings.duration_minutes}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                />
                <p className="text-xs text-muted-foreground">Entre 5 y 300 minutos</p>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Porcentaje para aprobar
                  <Badge variant="outline" className="text-xs">Mín. 70%</Badge>
                </Label>
                <Input
                  type="number"
                  min={70}
                  max={100}
                  value={examSettings.passing_score}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 70;
                    setExamSettings(prev => ({ ...prev, passing_score: Math.max(70, Math.min(100, val)) }));
                  }}
                />
                {examSettings.passing_score < 70 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Mínimo permitido: 70%
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Máximo de intentos</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={examSettings.max_attempts}
                  onChange={(e) => setExamSettings(prev => ({ ...prev, max_attempts: Math.max(1, Math.min(10, parseInt(e.target.value) || 3)) }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    Mezclar preguntas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Orden aleatorio en cada intento
                  </p>
                </div>
                <Switch
                  checked={examSettings.shuffle_questions}
                  onCheckedChange={(checked) => setExamSettings(prev => ({ ...prev, shuffle_questions: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Mostrar respuestas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Al finalizar, mostrar las correctas
                  </p>
                </div>
                <Switch
                  checked={examSettings.show_correct_answers}
                  onCheckedChange={(checked) => setExamSettings(prev => ({ ...prev, show_correct_answers: checked }))}
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
          
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{exam.questions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Preguntas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-xs text-muted-foreground">Puntos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{examSettings.passing_score}%</p>
                  <p className="text-xs text-muted-foreground">Para aprobar</p>
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
                  Selección múltiple, verdadero/falso, con imágenes
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
                    Agrega preguntas de selección múltiple o verdadero/falso
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
                      <div className="flex items-center gap-2 text-muted-foreground pt-1">
                        <GripVertical className="h-4 w-4" />
                        <span className="font-mono text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          {question.image_url && (
                            <img 
                              src={question.image_url} 
                              alt="Imagen de la pregunta" 
                              className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-2">{question.question_text}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {questionTypeLabels[question.question_type as QuestionType] || 'Selección Múltiple'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {question.answer_options?.length || 0} opciones
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {question.points} pts
                              </Badge>
                              {question.image_url && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  Imagen
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
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
            {/* Question Type Selector */}
            <div className="space-y-2">
              <Label>Tipo de pregunta</Label>
              <Select 
                value={questionForm.question_type} 
                onValueChange={(v) => handleQuestionTypeChange(v as QuestionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Selección Múltiple</SelectItem>
                  <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label>Pregunta</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Escribe la pregunta aquí..."
                rows={3}
              />
            </div>

            {/* Question Image */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Imagen de la pregunta (opcional)
              </Label>
              {questionForm.image_url ? (
                <div className="relative group">
                  <img 
                    src={questionForm.image_url} 
                    alt="Imagen de la pregunta" 
                    className="w-full max-h-48 object-contain rounded-lg border bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setQuestionForm(prev => ({ ...prev, image_url: '' }))}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Subir imagen</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-2">
                    <FileUploader
                      accept="image/*"
                      maxSize={10}
                      onFileUploaded={(file) => setQuestionForm(prev => ({ ...prev, image_url: file.url }))}
                    />
                  </TabsContent>
                  <TabsContent value="url" className="mt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://ejemplo.com/imagen.jpg"
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, image_url: e.target.value }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
            
            {/* Points */}
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
            
            {/* Answer Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Opciones de respuesta</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {questionForm.question_type === 'true_false' 
                      ? 'Selecciona cuál es la respuesta correcta'
                      : 'Marca la opción correcta con el círculo verde'
                    }
                  </p>
                </div>
                {questionForm.question_type === 'multiple_choice' && (
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
                )}
              </div>
              
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOptionChange(index, 'is_correct', true)}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      option.is_correct 
                        ? 'border-green-500 bg-green-500 text-white' 
                        : 'border-muted-foreground hover:border-green-500'
                    }`}
                  >
                    {option.is_correct && <Check className="h-4 w-4" />}
                  </button>
                  {questionForm.question_type === 'true_false' ? (
                    <span className="flex-1 font-medium">{option.option_text}</span>
                  ) : (
                    <Input
                      value={option.option_text}
                      onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1"
                    />
                  )}
                  {questionForm.question_type === 'multiple_choice' && questionForm.options.length > 2 && (
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
