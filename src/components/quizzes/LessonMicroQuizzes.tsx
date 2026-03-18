import { useState } from "react";
import { useLessonMicroQuizzes } from "@/hooks/useMicroQuizzes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Zap, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function SingleQuiz({ quiz }: { quiz: { id: string; question: string; options: string[]; correct_answer: string; explanation: string | null } }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const { user } = useAuth();

  const isAnswered = selected !== null;
  const isCorrect = selected === quiz.correct_answer;

  const handleSelect = async (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    setShowExplanation(true);

    // Award 3 points for attempting a quiz (regardless of answer)
    if (user) {
      await supabase.rpc('add_user_points', {
        _user_id: user.id,
        _points: isCorrect ? 10 : 3,
        _reason: isCorrect ? 'Respuesta correcta en Micro-quiz' : 'Participaci\u00f3n en Micro-quiz',
        _reference_type: 'quiz',
        _reference_id: quiz.id
      });
    }
  };

  const handleReset = () => {
    setSelected(null);
    setShowExplanation(false);
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-base leading-relaxed">{quiz.question}</p>
      
      <div className="grid gap-2">
        {quiz.options.map((option) => {
          const isSelected = selected === option;
          const isRight = option === quiz.correct_answer;
          
          let variant: string = "outline";
          if (isAnswered) {
            if (isRight) variant = "correct";
            else if (isSelected) variant = "wrong";
          }

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                !isAnswered && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                isAnswered && isRight && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                isAnswered && isSelected && !isRight && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400",
                isAnswered && !isSelected && !isRight && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3">
                {isAnswered && isRight && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {isAnswered && isSelected && !isRight && <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                {(!isAnswered || (!isRight && !isSelected)) && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={cn(
          "p-4 rounded-xl border text-sm space-y-2",
          isCorrect ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
        )}>
          <div className="flex items-center gap-2 font-semibold">
            {isCorrect 
              ? <><CheckCircle className="h-4 w-4 text-green-500" /> <span className="text-green-600 dark:text-green-400">¡Correcto! +10 pts</span></>
              : <><XCircle className="h-4 w-4 text-amber-500" /> <span className="text-amber-600 dark:text-amber-400">Incorrecto — +3 pts por participar</span></>
            }
          </div>
          {quiz.explanation && (
            <p className="text-muted-foreground leading-relaxed">{quiz.explanation}</p>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7 gap-1 mt-2">
            <RotateCcw className="h-3 w-3" /> Intentar de nuevo
          </Button>
        </div>
      )}
    </div>
  );
}

export function LessonMicroQuizzes({ lessonId }: { lessonId: string }) {
  const { data: quizzes, isLoading } = useLessonMicroQuizzes(lessonId);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading || !quizzes || quizzes.length === 0) return null;

  const quiz = quizzes[currentIndex];

  return (
    <Card className="mt-8 border-amber-500/20 shadow-md">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-base">Pausa Activa</h3>
          {quizzes.length > 1 && (
            <Badge variant="secondary" className="ml-auto">
              {currentIndex + 1} / {quizzes.length}
            </Badge>
          )}
        </div>

        <SingleQuiz key={quiz.id} quiz={quiz} />

        {quizzes.length > 1 && (
          <div className="flex justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>
              Anterior
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentIndex(i => Math.min(quizzes.length - 1, i + 1))} disabled={currentIndex === quizzes.length - 1}>
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
