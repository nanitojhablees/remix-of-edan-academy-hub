import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, Plus, Search, Users, Award, Calendar, 
  Edit, Trash2, CheckCircle, XCircle, Clock, MoreHorizontal,
  Percent, DollarSign, Infinity
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  useScholarships, 
  useScholarshipRecipients,
  useScholarshipStats,
  useDeleteScholarship,
  useRevokeScholarship,
  Scholarship,
  ScholarshipRecipient 
} from "@/hooks/useScholarships";
import { ScholarshipForm } from "@/components/admin/ScholarshipForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getTypeLabel = (type: string) => {
  switch (type) {
    case "full": return "100%";
    case "partial": return "Parcial";
    case "fixed": return "Monto Fijo";
    default: return type;
  }
};

const getTypeBadge = (scholarship: Scholarship) => {
  switch (scholarship.type) {
    case "full":
      return <Badge className="bg-green-500/20 text-green-600"><Percent className="w-3 h-3 mr-1" />100%</Badge>;
    case "partial":
      return <Badge className="bg-blue-500/20 text-blue-600"><Percent className="w-3 h-3 mr-1" />{scholarship.discount_percent}%</Badge>;
    case "fixed":
      return <Badge className="bg-purple-500/20 text-purple-600"><DollarSign className="w-3 h-3 mr-1" />${scholarship.discount_amount}</Badge>;
    default:
      return <Badge variant="outline">{scholarship.type}</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500/20 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Activa</Badge>;
    case "expired":
      return <Badge className="bg-orange-500/20 text-orange-600"><Clock className="w-3 h-3 mr-1" />Vencida</Badge>;
    case "revoked":
      return <Badge className="bg-red-500/20 text-red-600"><XCircle className="w-3 h-3 mr-1" />Revocada</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ScholarshipsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revokeRecipient, setRevokeRecipient] = useState<ScholarshipRecipient | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const { data: scholarships, isLoading: loadingScholarships } = useScholarships();
  const { data: recipients, isLoading: loadingRecipients } = useScholarshipRecipients();
  const { data: stats } = useScholarshipStats();
  const deleteScholarship = useDeleteScholarship();
  const revokeScholarship = useRevokeScholarship();

  const filteredScholarships = scholarships?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecipients = recipients?.filter(r =>
    r.scholarship?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingScholarship(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteScholarship.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleRevoke = async () => {
    if (revokeRecipient && revokeReason) {
      await revokeScholarship.mutateAsync({
        recipientId: revokeRecipient.id,
        reason: revokeReason,
      });
      setRevokeRecipient(null);
      setRevokeReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Gestión de Becas
          </h1>
          <p className="text-muted-foreground">
            Administra los tipos de becas y los becarios
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Beca
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalScholarships || 0}</p>
                <p className="text-sm text-muted-foreground">Total Becas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeScholarships || 0}</p>
                <p className="text-sm text-muted-foreground">Becas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeRecipients || 0}</p>
                <p className="text-sm text-muted-foreground">Becarios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.availableSlots || 0}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar becas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scholarships">
        <TabsList>
          <TabsTrigger value="scholarships" className="gap-2">
            <Award className="h-4 w-4" />
            Tipos de Becas
          </TabsTrigger>
          <TabsTrigger value="recipients" className="gap-2">
            <Users className="h-4 w-4" />
            Becarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scholarships" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Becas</CardTitle>
              <CardDescription>
                Configura los diferentes tipos de becas disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingScholarships ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredScholarships?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay becas configuradas</p>
                  <Button variant="link" onClick={() => setShowForm(true)}>
                    Crear primera beca
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Becarios</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScholarships?.map((scholarship) => (
                      <TableRow key={scholarship.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{scholarship.name}</p>
                            {scholarship.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {scholarship.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(scholarship)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {scholarship.duration_months} meses
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {scholarship.current_recipients}
                            {scholarship.max_recipients ? (
                              <span className="text-muted-foreground">/ {scholarship.max_recipients}</span>
                            ) : (
                              <Infinity className="h-3 w-3 text-muted-foreground ml-1" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {scholarship.is_active ? (
                            <Badge className="bg-green-500/20 text-green-600">Activa</Badge>
                          ) : (
                            <Badge variant="outline">Inactiva</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(scholarship)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(scholarship.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Becarios</CardTitle>
              <CardDescription>
                Lista de estudiantes con becas asignadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecipients ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredRecipients?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay becarios registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beca</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipients?.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{recipient.scholarship?.name}</p>
                            {recipient.scholarship && getTypeBadge(recipient.scholarship)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(recipient.status)}</TableCell>
                        <TableCell>
                          {format(new Date(recipient.starts_at), "d MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(recipient.expires_at), "d MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {recipient.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRevokeRecipient(recipient)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scholarship Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingScholarship ? "Editar Beca" : "Nueva Beca"}
            </DialogTitle>
            <DialogDescription>
              {editingScholarship 
                ? "Modifica los datos de la beca"
                : "Crea un nuevo tipo de beca para asignar a estudiantes"
              }
            </DialogDescription>
          </DialogHeader>
          <ScholarshipForm 
            scholarship={editingScholarship}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar beca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la beca y todos sus registros asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeRecipient} onOpenChange={() => setRevokeRecipient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar beca?</AlertDialogTitle>
            <AlertDialogDescription>
              El estudiante perderá los beneficios de esta beca. Por favor ingresa el motivo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Motivo de la revocación..."
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRevokeReason("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={!revokeReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
