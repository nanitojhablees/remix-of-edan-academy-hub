import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useExam, useExamQuestions, useExamAttempts, useStartExamAttempt, useSubmitExam } from "@/hooks/useExams";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, FileQuestion, CheckCircle, XCircle, AlertTriangle, Trophy, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ExamView() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: exam, isLoading: loadingExam } = useExam(examId);
  const { data: questions, isLoading: loadingQuestions } = useExamQuestions(examId);
  const { data: attempts, isLoading: loadingAttempts } = useExamAttempts(examId);
  const startAttempt = useStartExamAttempt();
  const submitExam = useSubmitExam();
  
  const [currentAttempt, setCurrentAttempt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  
  // Timer effect
  useEffect(() => {
    if (!examStarted || timeLeft === null || timeLeft <= 0 || examSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [examStarted, examSubmitted]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartExam = async () => {
    if (!exam || !examId) return;
    
    try {
      const attempt = await startAttempt.mutateAsync(examId);
      setCurrentAttempt(attempt.id);
      setTimeLeft(exam.duration_minutes * 60);
      setExamStarted(true);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar el examen",
        variant: "destructive"
      });
    }
  };

  // Shuffle questions if exam has shuffle enabled
  const shuffledQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    if (!exam?.shuffle_questions) return questions;
    // Fisher-Yates shuffle with stable seed per attempt
    const arr = [...questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [questions, exam?.shuffle_questions, examStarted]);
  
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  const handleSubmit = async () => {
    if (!currentAttempt || examSubmitted) return;
    
    try {
      const formattedAnswers = Object.entries(answers).map(([question_id, selected_option_id]) => ({
        question_id,
        selected_option_id
      }));
      
      await submitExam.mutateAsync({
        attemptId: currentAttempt,
        answers: formattedAnswers
      });
      
      setExamSubmitted(true);
      toast({
        title: "Examen enviado",
        description: "Tu examen ha sido calificado"
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el examen",
        variant: "destructive"
      });
    }
  };
  
  if (loadingExam || loadingQuestions || loadingAttempts) {
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
  
  const completedAttempts = attempts?.filter(a => a.completed_at) || [];
  const passedAttempts = completedAttempts.filter(a => a.passed);
  const attemptsLeft = exam.max_attempts - completedAttempts.length;
  const hasPassed = passedAttempts.length > 0;
  const latestAttempt = completedAttempts[0];
  
  // Show results after submission
  if (examSubmitted && latestAttempt) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al curso
        </Button>
        
        <Card className={latestAttempt.passed ? "border-green-500/50" : "border-red-500/50"}>
          <CardHeader className="text-center">
            <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
              latestAttempt.passed ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {latestAttempt.passed ? (
                <Trophy className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {latestAttempt.passed ? '¡Felicidades!' : 'Examen no aprobado'}
            </CardTitle>
            <CardDescription>
              {latestAttempt.passed 
                ? 'Has aprobado el examen exitosamente'
                : `Necesitas ${exam.passing_score}% para aprobar`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-foreground mb-2">
                {latestAttempt.score?.toFixed(1)}%
              </p>
              <p className="text-muted-foreground">Puntuación obtenida</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{exam.passing_score}%</p>
                <p className="text-sm text-muted-foreground">Puntuación mínima</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{attemptsLeft}</p>
                <p className="text-sm text-muted-foreground">Intentos restantes</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button className="flex-1" onClick={() => navigate(-1)}>
              Volver al curso
            </Button>
            {!latestAttempt.passed && attemptsLeft > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => {
                setExamSubmitted(false);
                setExamStarted(false);
                setCurrentAttempt(null);
              }}>
                Intentar de nuevo
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show exam in progress
  if (examStarted && shuffledQuestions && shuffledQuestions.length > 0) {
    const question = shuffledQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;
    const answeredCount = Object.keys(answers).length;
    
    return (
      <div className="max-w-3xl mx-auto">
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-background py-4 z-10">
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              Pregunta {currentQuestion + 1} de {shuffledQuestions.length}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeLeft && timeLeft < 60 ? 'bg-red-500/10 text-red-500' : 'bg-muted'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">{timeLeft ? formatTime(timeLeft) : '--:--'}</span>
          </div>
        </div>
        
        <Progress value={progress} className="mb-6" />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{question.points} punto{question.points !== 1 ? 's' : ''}</Badge>
              <Badge variant={answers[question.id] ? 'default' : 'secondary'}>
                {answers[question.id] ? 'Respondida' : 'Sin responder'}
              </Badge>
            </div>
            <CardTitle className="text-lg mt-4">{question.question_text}</CardTitle>
            {question.image_url && (
              <div className="mt-4">
                <img 
                  src={question.image_url} 
                  alt="Imagen de la pregunta" 
                  className="max-w-full max-h-64 rounded-lg border object-contain mx-auto"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleAnswerSelect(question.id, value)}
            >
              <div className="space-y-3">
                {question.answer_options.map((option) => (
                  <div 
                    key={option.id} 
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      answers[question.id] === option.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleAnswerSelect(question.id, option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.option_text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              {currentQuestion === shuffledQuestions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitExam.isPending}
                >
                  {submitExam.isPending ? 'Enviando...' : `Enviar examen (${answeredCount}/${shuffledQuestions.length})`}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
                >
                  Siguiente
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        {/* Question navigator */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Navegación de preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {shuffledQuestions.map((q, i) => (
                <Button
                  key={q.id}
                  variant={currentQuestion === i ? 'default' : answers[q.id] ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-10 h-10"
                  onClick={() => setCurrentQuestion(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show exam intro
  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al curso
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="h-6 w-6 text-primary" />
            <Badge variant="outline">Evaluación</Badge>
          </div>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          {exam.description && (
            <CardDescription>{exam.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duración</span>
              </div>
              <p className="text-xl font-bold">{exam.duration_minutes} min</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Preguntas</span>
              </div>
              <p className="text-xl font-bold">{questions?.length || 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Para aprobar</span>
              </div>
              <p className="text-xl font-bold">{exam.passing_score}%</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Intentos</span>
              </div>
              <p className="text-xl font-bold">{attemptsLeft} de {exam.max_attempts}</p>
            </div>
          </div>
          
          {hasPassed && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium text-green-600">Ya aprobaste este examen</p>
                <p className="text-sm text-muted-foreground">
                  Mejor puntuación: {Math.max(...passedAttempts.map(a => a.score || 0)).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {completedAttempts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Intentos anteriores</h4>
              {completedAttempts.slice(0, 3).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {attempt.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {format(new Date(attempt.completed_at!), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                    {attempt.score?.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {attemptsLeft > 0 ? (
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleStartExam}
              disabled={startAttempt.isPending}
            >
              {startAttempt.isPending ? 'Iniciando...' : 'Comenzar examen'}
            </Button>
          ) : (
            <div className="w-full text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">Has agotado todos los intentos</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
