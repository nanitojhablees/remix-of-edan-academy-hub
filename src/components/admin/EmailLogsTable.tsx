import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEmailLogs, getEmailTypeLabel, getEmailTypeIcon } from "@/hooks/useEmailSettings";

export function EmailLogsTable() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  const { data: logs, isLoading } = useEmailLogs({
    email_type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case "skipped":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Omitido
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Emails
        </CardTitle>
        <CardDescription>
          Últimos 100 emails enviados por el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="welcome">Bienvenida</SelectItem>
              <SelectItem value="payment_confirmation">Confirmación de Pago</SelectItem>
              <SelectItem value="expiring_notification">Aviso de Vencimiento</SelectItem>
              <SelectItem value="expired_notification">Membresía Expirada</SelectItem>
              <SelectItem value="suspension">Cuenta Suspendida</SelectItem>
              <SelectItem value="reactivation">Cuenta Reactivada</SelectItem>
              <SelectItem value="renewal">Renovación</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="skipped">Omitido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {logs && logs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getEmailTypeIcon(log.email_type)}</span>
                        <span className="text-sm">{getEmailTypeLabel(log.email_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{log.recipient_email}</span>
                        {log.recipient_name && (
                          <span className="text-xs text-muted-foreground">{log.recipient_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(log.status)}
                        {log.error_message && (
                          <span className="text-xs text-destructive">{log.error_message}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.sent_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No hay registros de emails</p>
            <p className="text-sm text-muted-foreground">
              Los emails enviados aparecerán aquí
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
