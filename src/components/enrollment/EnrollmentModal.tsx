import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreditCard, ExternalLink, Upload, Send, ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  patreonUrl?: string;
}

export function EnrollmentModal({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  coursePrice,
  patreonUrl = "https://www.patreon.com/edan",
}: EnrollmentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"choose" | "manual">("choose");
  const [message, setMessage] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({ title: "Archivo no válido", description: "Solo se permiten imágenes o PDF", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "El tamaño máximo es 5MB", variant: "destructive" });
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      let receiptUrl: string | null = null;

      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop();
        const path = `${user.id}/${courseId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(path, receiptFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("payment-receipts")
          .getPublicUrl(path);
        receiptUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("enrollment_requests").insert({
        user_id: user.id,
        course_id: courseId,
        payment_method: "transfer",
        receipt_url: receiptUrl,
        message: message || null,
      });

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de matrícula ha sido enviada. Te notificaremos cuando sea aprobada.",
      });

      queryClient.invalidateQueries({ queryKey: ["enrollment-request", courseId] });
      resetAndClose();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep("choose");
    setMessage("");
    setReceiptFile(null);
    setReceiptPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscribirse en el curso</DialogTitle>
          <DialogDescription>{courseTitle}</DialogDescription>
        </DialogHeader>

        {step === "choose" ? (
          <div className="space-y-4 py-2">
            {coursePrice > 0 && (
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Precio del curso</p>
                <p className="text-3xl font-bold text-foreground">${coursePrice}</p>
              </div>
            )}

            <Button
              className="w-full gap-2 h-14"
              variant="outline"
              onClick={() => window.open(patreonUrl, "_blank")}
            >
              <ExternalLink className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Pagar con Patreon</p>
                <p className="text-xs text-muted-foreground">Redirige a plataforma externa</p>
              </div>
            </Button>

            <Button
              className="w-full gap-2 h-14"
              variant="outline"
              onClick={() => setStep("manual")}
            >
              <CreditCard className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Transferencia / Matrícula Manual</p>
                <p className="text-xs text-muted-foreground">Adjunta comprobante de pago</p>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <Button variant="ghost" size="sm" onClick={() => setStep("choose")} className="mb-2">
              ← Volver
            </Button>

            <div className="space-y-2">
              <Label>Comprobante de pago</Label>
              {receiptFile ? (
                <div className="relative border rounded-lg p-3">
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Comprobante" className="max-h-40 mx-auto rounded" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <ImageIcon className="h-4 w-4" />
                      <span className="truncate">{receiptFile.name}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Haz clic para subir imagen o PDF</span>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mensaje (opcional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Información adicional sobre tu pago..."
                rows={3}
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
