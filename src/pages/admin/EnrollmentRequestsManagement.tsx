import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, Clock, FileText } from "lucide-react";
import { useAllEnrollmentRequests, useReviewEnrollmentRequest } from "@/hooks/useEnrollmentRequests";
import type { EnrollmentRequest } from "@/hooks/useEnrollmentRequests";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusBadge = (status: string) => {
  switch (status) {
    case "pending": return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
    case "approved": return <Badge className="bg-green-600 gap-1"><CheckCircle className="h-3 w-3" />Aprobada</Badge>;
    case "rejected": return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rechazada</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function EnrollmentRequestsManagement() {
  const { data: requests, isLoading } = useAllEnrollmentRequests();
  const reviewMutation = useReviewEnrollmentRequest();
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleApprove = (request: EnrollmentRequest) => {
    reviewMutation.mutate({ requestId: request.id, action: "approved" });
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      requestId: selectedRequest.id,
      action: "rejected",
      notes: rejectNotes,
    });
    setRejectDialogOpen(false);
    setRejectNotes("");
    setSelectedRequest(null);
  };

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Solicitudes de Matrícula</h1>
        <p className="text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} solicitudes pendientes de revisión` : "Gestiona las solicitudes de matrícula manual"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay solicitudes de matrícula aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.profile ? `${req.profile.first_name} ${req.profile.last_name}` : "—"}
                      </TableCell>
                      <TableCell>{req.course?.title || "—"}</TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>
                        {req.receipt_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={req.receipt_url} target="_blank" rel="noopener noreferrer" className="gap-1">
                              <Eye className="h-4 w-4" />
                              Ver
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin adjunto</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {req.message || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(req.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {req.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => handleApprove(req)}
                              disabled={reviewMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => { setSelectedRequest(req); setRejectDialogOpen(true); }}
                              disabled={reviewMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" />
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {req.review_notes && `Nota: ${req.review_notes}`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Motivo del rechazo (opcional)</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Explica por qué se rechaza la solicitud..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={reviewMutation.isPending}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
