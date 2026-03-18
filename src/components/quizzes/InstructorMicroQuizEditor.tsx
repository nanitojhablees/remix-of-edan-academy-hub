import { useState } from "react";
import { useLessonMicroQuizzes, useCreateMicroQuiz, useDeleteMicroQuiz, MicroQuiz } from "@/hooks/useMicroQuizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Zap, ChevronDown, ChevronUp } from "lucide-react";

export function InstructorMicroQuizEditor({ lessonId }: { lessonId: string }) {
  const { data: quizzes, isLoading } = useLessonMicroQuizzes(lessonId);
  const createQuiz = useCreateMicroQuiz();
  const deleteQuiz = useDeleteMicroQuiz();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    question: "",
    optionA: "", optionB: "", optionC: "", optionD: "",
    correct_answer: "",
    explanation: ""
  });

  const handleCreate = async () => {
    const options = [
      form.optionA, form.optionB, form.optionC, form.optionD
    ].filter(Boolean);
    
    if (!form.question || options.length < 2 || !form.correct_answer) return;
    if (!options.includes(form.correct_answer)) {
      alert("La respuesta correcta debe coincidir exactamente con una de las opciones.");
      return;
    }

    await createQuiz.mutateAsync({
      lesson_id: lessonId,
      question: form.question,
      options,
      correct_answer: form.correct_answer,
      explanation: form.explanation || undefined
    });

    setForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correct_answer: "", explanation: "" });
    setIsAdding(false);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-3">
      {/* Existing quizzes */}
      {quizzes?.map((quiz) => (
        <div key={quiz.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 group">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2">{quiz.question}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {quiz.options.length} opciones · Resp: <span className="text-green-600 dark:text-green-400">{quiz.correct_answer}</span>
            </p>
          </div>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive flex-shrink-0"
            onClick={() => { if(confirm("¿Eliminar Quiz?")) deleteQuiz.mutate({ id: quiz.id, lesson_id: lessonId }); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add Quiz Form */}
      {isAdding ? (
        <div className="space-y-3 p-4 border border-dashed rounded-lg bg-card">
          <div className="space-y-1">
            <Label className="text-xs">Pregunta *</Label>
            <Textarea
              value={form.question}
              onChange={e => setForm({ ...form, question: e.target.value })}
              placeholder="¿Cuál de las siguientes es correcta?"
              rows={2}
              className="text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {(["optionA", "optionB", "optionC", "optionD"] as const).map((key, i) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">Opción {String.fromCharCode(65 + i)}</Label>
                <Input
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                  className="text-xs h-8"
                />
              </div>
            ))}
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Respuesta Correcta * (debe coincidir exactamente con una opción)</Label>
            <Input
              value={form.correct_answer}
              onChange={e => setForm({ ...form, correct_answer: e.target.value })}
              placeholder="Escribe el texto exacto de la opción correcta"
              className="text-sm border-green-500/50 focus:ring-green-500/20"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Explicación (Opcional)</Label>
            <Textarea
              value={form.explanation}
              onChange={e => setForm({ ...form, explanation: e.target.value })}
              placeholder="¿Por qué es esa la respuesta correcta?"
              rows={2}
              className="text-sm"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={createQuiz.isPending}>
              {createQuiz.isPending ? "Guardando..." : "Guardar Quiz"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setIsAdding(true)}>
          <Zap className="h-4 w-4 mr-2 text-amber-500" />
          Agregar Micro-quiz
        </Button>
      )}
    </div>
  );
}
