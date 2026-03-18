import { useCourseModules, useModuleLessons } from "@/hooks/useCourses";
import { CheckCircle2, XCircle, Rocket, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CheckItem {
  key: string;
  label: string;
  passed: boolean;
  hint?: string;
}

function CheckRow({ item }: { item: CheckItem }) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      item.passed ? "border-green-500/20 bg-green-500/5" : "border-amber-500/20 bg-amber-500/5"
    )}>
      {item.passed
        ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        : <XCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", item.passed ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400")}>
          {item.label}
        </p>
        {!item.passed && item.hint && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
        )}
      </div>
    </div>
  );
}

// Helper hook per module — called in parent to avoid hooks-in-loop
function useModuleStats(moduleId: string) {
  const { data: lessons } = useModuleLessons(moduleId);
  return {
    count: lessons?.length ?? 0,
    withContent: lessons?.filter(l => l.content || l.video_url).length ?? 0,
  };
}

export function CourseLaunchChecklist({
  course,
  modules,
  onPublish,
  isPublishing,
}: {
  course: { title: string; description: string | null; image_url: string | null; is_published: boolean; learning_objectives?: string[] };
  modules: { id: string }[];
  onPublish: () => void;
  isPublishing: boolean;
}) {
  // Aggregate lesson stats across all modules (hooks at top level, one per module max we allow up to 20)
  const s0 = useModuleStats(modules[0]?.id ?? "");
  const s1 = useModuleStats(modules[1]?.id ?? "");
  const s2 = useModuleStats(modules[2]?.id ?? "");
  const s3 = useModuleStats(modules[3]?.id ?? "");
  const s4 = useModuleStats(modules[4]?.id ?? "");
  const s5 = useModuleStats(modules[5]?.id ?? "");
  const s6 = useModuleStats(modules[6]?.id ?? "");
  const s7 = useModuleStats(modules[7]?.id ?? "");
  const s8 = useModuleStats(modules[8]?.id ?? "");
  const s9 = useModuleStats(modules[9]?.id ?? "");

  const allStats = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9].slice(0, modules.length);
  const totalLessons = allStats.reduce((s, m) => s + m.count, 0);
  const lessonsWithContent = allStats.reduce((s, m) => s + m.withContent, 0);

  const checks: CheckItem[] = [
    {
      key: "image",
      label: "Imagen de portada cargada",
      passed: !!course.image_url,
      hint: "Sube una imagen llamativa para tu curso en la sección Básico",
    },
    {
      key: "desc",
      label: "Descripción del curso escrita",
      passed: !!(course.description && course.description.length > 30),
      hint: "Escribe al menos 30 caracteres describiendo tu curso",
    },
    {
      key: "objectives",
      label: "Objetivos de aprendizaje definidos",
      passed: !!(course.learning_objectives && course.learning_objectives.length >= 2),
      hint: "Define al menos 2 objetivos en la sección Objetivos",
    },
    {
      key: "modules",
      label: "Al menos 1 módulo creado",
      passed: modules.length > 0,
      hint: "Crea el primer módulo de tu curso en la sección Currículum",
    },
    {
      key: "lessons",
      label: "Al menos 1 lección creada",
      passed: totalLessons > 0,
      hint: "Agrega lecciones dentro de tus módulos",
    },
    {
      key: "content",
      label: "Al menos 1 lección con contenido",
      passed: lessonsWithContent > 0,
      hint: "Añade texto o video a al menos 1 lección",
    },
  ];

  const allPassed = checks.every(c => c.passed);
  const passedCount = checks.filter(c => c.passed).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className={cn(
          "inline-flex items-center justify-center w-16 h-16 rounded-full mb-2",
          allPassed ? "bg-green-500/10" : "bg-amber-500/10"
        )}>
          {allPassed
            ? <Rocket className="h-8 w-8 text-green-500" />
            : <AlertTriangle className="h-8 w-8 text-amber-500" />}
        </div>
        <h2 className="text-2xl font-bold">
          {allPassed ? "¡Listo para publicar!" : "Completa los requisitos"}
        </h2>
        <p className="text-muted-foreground">
          {passedCount}/{checks.length} requisitos completados
        </p>
        <div className="w-full bg-muted rounded-full h-2 max-w-sm mx-auto">
          <div
            className={cn("h-2 rounded-full transition-all", allPassed ? "bg-green-500" : "bg-amber-500")}
            style={{ width: `${(passedCount / checks.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {checks.map(item => <CheckRow key={item.key} item={item} />)}
      </div>

      <div className="pt-4 border-t text-center">
        {course.is_published ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Curso publicado y visible para los alumnos
            </div>
            <Button variant="outline" onClick={onPublish} disabled={isPublishing}>
              {isPublishing ? "Actualizando..." : "Despublicar temporalmente"}
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={onPublish}
            disabled={!allPassed || isPublishing}
          >
            <Rocket className="h-5 w-5" />
            {isPublishing ? "Publicando..." : "Publicar Curso"}
          </Button>
        )}
        {!allPassed && (
          <p className="text-xs text-muted-foreground mt-2">
            Completa todos los requisitos para habilitar la publicación
          </p>
        )}
      </div>
    </div>
  );
}
