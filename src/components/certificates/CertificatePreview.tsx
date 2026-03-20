import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CertificatePreviewProps {
  certificateId: string;
  certificateCode: string;
  courseTitle: string;
  studentName: string;
  issuedAt: string;
  grade?: number | null;
}

export function CertificatePreview({
  certificateId,
  certificateCode,
  courseTitle,
  studentName,
  issuedAt,
  grade
}: CertificatePreviewProps) {
  const { toast } = useToast();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = async () => {
    try {
      setDownloadingId(certificateId);
      
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
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async () => {
    try {
      setIsGeneratingPreview(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para ver el certificado",
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
      
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }

      toast({
        title: "Vista previa generada",
        description: "El certificado se está mostrando en la vista previa"
      });
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la vista previa del certificado",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-accent" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">{courseTitle}</h3>
              <p className="text-sm text-muted-foreground">Otorgado a {studentName}</p>
            </div>
          </div>
          {grade && (
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
              {grade.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="font-mono bg-muted px-2 py-1 rounded">
            {certificateCode}
          </span>
          <span>•</span>
          <span>{new Date(issuedAt).toLocaleDateString('es-ES')}</span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handlePreview}
            disabled={isGeneratingPreview}
          >
            {isGeneratingPreview ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Vista Previa
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleDownload}
            disabled={downloadingId === certificateId}
          >
            {downloadingId === certificateId ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar
          </Button>
        </div>

        {isGeneratingPreview && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              className="w-full h-64 border-0"
              title={`Preview-${certificateCode}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}