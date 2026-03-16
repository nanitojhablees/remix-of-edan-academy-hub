import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentPreview } from "@/hooks/useStudentPreview";
import { useAuth } from "@/hooks/useAuth";

export function StudentPreviewBanner() {
  const { role } = useAuth();
  const { isStudentPreview, setStudentPreview } = useStudentPreview();

  if (!isStudentPreview || (role !== "admin" && role !== "instructor")) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium sticky top-0 z-50">
      <Eye className="h-4 w-4 flex-shrink-0" />
      <span>Previsualización: Modo Estudiante activo</span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs bg-amber-400/50 border-amber-700/30 text-amber-950 hover:bg-amber-400 hover:text-amber-950"
        onClick={() => setStudentPreview(false)}
      >
        <X className="h-3 w-3 mr-1" />
        Volver a modo Editor
      </Button>
    </div>
  );
}
