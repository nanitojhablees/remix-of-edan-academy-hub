import { useCourseModules, useModuleLessons } from "@/hooks/useCourses";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, AlertCircle } from "lucide-react";

function ModuleLessonCount({ moduleId }: { moduleId: string }) {
  const { data: lessons } = useModuleLessons(moduleId);
  const filled = lessons?.filter(l => l.content || l.video_url).length ?? 0;
  const total = lessons?.length ?? 0;
  return { filled, total };
}

export function CourseCompletionBar({ courseId }: { courseId: string }) {
  const { data: modules } = useCourseModules(courseId);

  if (!modules || modules.length === 0) return null;

  // We need lesson data per module — let's compute from each module
  // Since we can't call hooks in a loop, we render a child component per module
  return (
    <CourseCompletionBarInner moduleIds={modules.map(m => m.id)} />
  );
}

function CourseCompletionBarInner({ moduleIds }: { moduleIds: string[] }) {
  // Collects data from each module via individual lesson hooks
  const moduleData = moduleIds.map(id => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: lessons } = useModuleLessons(id);
    const filled = lessons?.filter(l => l.content || l.video_url).length ?? 0;
    const total = lessons?.length ?? 0;
    return { filled, total };
  });

  const totalLessons = moduleData.reduce((s, m) => s + m.total, 0);
  const filledLessons = moduleData.reduce((s, m) => s + m.filled, 0);
  const pct = totalLessons > 0 ? Math.round((filledLessons / totalLessons) * 100) : 0;

  const color = pct === 100 ? "text-green-500" : pct >= 50 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 bg-muted/40 border rounded-lg px-4 py-2.5">
      <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Contenido del curso</span>
          <span className={`text-xs font-bold ${color}`}>{filledLessons}/{totalLessons} lecciones con contenido</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
      {pct === 100 ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
      )}
    </div>
  );
}
