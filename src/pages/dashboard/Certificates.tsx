import { useState } from "react";
import { Award, Search, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyCertificates, useVerifyCertificate } from "@/hooks/useCertificates";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";
import { supabase } from "@/integrations/supabase/client";

const Certificates = () => {
  const { data: certificates, isLoading } = useMyCertificates();
  const [verifyCode, setVerifyCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const verifyCertificate = useVerifyCertificate();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (certificateId: string, code: string) => {
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

      const response = await supabase.functions.invoke('generate-certificate-pdfme', {
        body: { certificateId, action: 'download' }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar el certificado');
      }

      // La respuesta debería contener el PDF como base64 o directamente como blob
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${code}.pdf`;
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

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un código de verificación",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await verifyCertificate.mutateAsync(verifyCode.trim().toUpperCase());
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({ valid: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis Certificados</h1>
        <p className="text-muted-foreground mt-2">
          Descarga y verifica tus certificados de cursos completados
        </p>
      </div>

      <Tabs defaultValue="certificates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="certificates">Mis Certificados</TabsTrigger>
          <TabsTrigger value="verify">Verificar Certificado</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          {certificates && certificates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((cert) => (
                <CertificatePreview
                  key={cert.id}
                  certificateId={cert.id}
                  certificateCode={cert.certificate_code}
                  courseTitle={cert.course_title}
                  studentName={cert.student_name}
                  issuedAt={cert.issued_at}
                  grade={cert.grade}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">
                  Aún no tienes certificados
                </h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  Completa tus cursos para obtener certificados verificables
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verificar Certificado
              </CardTitle>
              <CardDescription>
                Ingresa el código único del certificado para verificar su autenticidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="EDAN-XXXXXX-XXXX"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button 
                  onClick={handleVerify}
                  disabled={verifyCertificate.isPending}
                >
                  {verifyCertificate.isPending ? "Verificando..." : "Verificar"}
                </Button>
              </div>

              {verificationResult && (
                <Card className={verificationResult.valid ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
                  <CardContent className="pt-6">
                    {verificationResult.valid ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-6 w-6" />
                          <span className="font-semibold">Certificado Válido</span>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estudiante:</span>
                            <span className="font-medium">{verificationResult.certificate.studentName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Curso:</span>
                            <span className="font-medium">{verificationResult.certificate.courseTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha de emisión:</span>
                            <span className="font-medium">
                              {format(new Date(verificationResult.certificate.issuedAt), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>
                          {verificationResult.certificate.grade && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Calificación:</span>
                              <span className="font-medium">{verificationResult.certificate.grade}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-6 w-6" />
                        <span className="font-semibold">Certificado no encontrado</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Certificates;
