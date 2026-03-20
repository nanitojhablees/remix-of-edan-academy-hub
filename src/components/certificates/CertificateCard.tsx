import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CertificateCardProps {
  certificateId: string;
  certificateCode: string;
  courseTitle: string;
  studentName: string;
  issuedAt: string;
  grade?: number | null;
}

export function CertificateCard({
  certificateId,
  certificateCode,
  courseTitle,
  studentName,
  issuedAt,
  grade
}: CertificateCardProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para descargar el certificado",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ certificateId, action: 'download' })
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar el certificado');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${certificateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Descarga iniciada",
        description: "Tu certificado se está descargando"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el certificado",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="py-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">¡Curso Completado!</h3>
            <p className="text-sm text-muted-foreground">
              Has completado exitosamente el curso "{courseTitle}"
            </p>
            {grade && (
              <p className="text-sm font-medium text-primary mt-1">
                Calificación: {grade.toFixed(1)}%
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Emitido el {new Date(issuedAt).toLocaleDateString('es-ES')}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Código: {certificateCode}
            </p>
          </div>
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}