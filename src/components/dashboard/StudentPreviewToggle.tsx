import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useStudentPreview } from "@/hooks/useStudentPreview";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export function StudentPreviewToggle() {
  const { role } = useAuth();
  const { isStudentPreview, toggleStudentPreview } = useStudentPreview();

  if (role !== "admin" && role !== "instructor") return null;

  return (
    <div className="flex items-center gap-2">
      {isStudentPreview && (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
          Vista Alumno
        </Badge>
      )}
      <Button
        variant={isStudentPreview ? "default" : "outline"}
        size="sm"
        onClick={toggleStudentPreview}
        className="gap-2 text-xs"
      >
        {isStudentPreview ? (
          <>
            <EyeOff className="h-3.5 w-3.5" />
            Salir Vista Alumno
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" />
            Ver como Alumno
          </>
        )}
      </Button>
    </div>
  );
}
