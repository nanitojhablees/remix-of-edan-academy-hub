import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LiveSessionRoom } from "@/components/live/LiveSessionRoom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LiveSessionPage() {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!courseId || !sessionId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Sesión no encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/dashboard/courses/${courseId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Curso
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Clase en Vivo</h1>
          <p className="text-muted-foreground text-sm">
            Bienvenido {profile?.first_name} {profile?.last_name}
          </p>
        </div>
      </div>
      
      <LiveSessionRoom courseId={courseId} sessionId={sessionId} />
    </div>
  );
}