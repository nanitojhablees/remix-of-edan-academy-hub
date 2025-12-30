import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Medal, Plus, Search, Trash2, Edit, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ICONS = ["award", "medal", "star", "trophy", "zap", "target", "flame", "crown", "gem", "rocket"];

export default function BadgesManagement() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "award",
    category: "achievement",
    criteria_type: "lessons_completed",
    criteria_value: 1,
    points_value: 10,
  });

  const { data: badges, isLoading } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: badgeAwards } = useQuery({
    queryKey: ["badge-awards-count"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("badge_id");

      const counts: Record<string, number> = {};
      data?.forEach(ub => {
        counts[ub.badge_id] = (counts[ub.badge_id] || 0) + 1;
      });
      return counts;
    },
  });

  const saveBadgeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingBadge) {
        const { error } = await supabase
          .from("badges")
          .update(data)
          .eq("id", editingBadge.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("badges").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      toast({ title: editingBadge ? "Insignia actualizada" : "Insignia creada" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase.from("badges").delete().eq("id", badgeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      toast({ title: "Insignia eliminada" });
    },
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingBadge(null);
    setFormData({
      name: "",
      description: "",
      icon: "award",
      category: "achievement",
      criteria_type: "lessons_completed",
      criteria_value: 1,
      points_value: 10,
    });
  };

  const handleEdit = (badge: any) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || "",
      icon: badge.icon,
      category: badge.category,
      criteria_type: badge.criteria_type,
      criteria_value: badge.criteria_value,
      points_value: badge.points_value,
    });
    setShowDialog(true);
  };

  const filteredBadges = badges?.filter(badge =>
    badge.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Insignias</h1>
          <p className="text-muted-foreground">Crea y administra las insignias del sistema</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setEditingBadge(null);
              setFormData({
                name: "",
                description: "",
                icon: "award",
                category: "achievement",
                criteria_type: "lessons_completed",
                criteria_value: 1,
                points_value: 10,
              });
            }}>
              <Plus className="h-4 w-4" />
              Nueva Insignia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBadge ? "Editar Insignia" : "Nueva Insignia"}</DialogTitle>
              <DialogDescription>
                {editingBadge ? "Modifica los datos de la insignia" : "Crea una nueva insignia para los usuarios"}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveBadgeMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, icon: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONS.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="achievement">Logro</SelectItem>
                      <SelectItem value="milestone">Hito</SelectItem>
                      <SelectItem value="special">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Criterio</Label>
                  <Select
                    value={formData.criteria_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, criteria_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lessons_completed">Lecciones completadas</SelectItem>
                      <SelectItem value="courses_completed">Cursos completados</SelectItem>
                      <SelectItem value="exams_passed">Exámenes aprobados</SelectItem>
                      <SelectItem value="points_earned">Puntos ganados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Requerido</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.criteria_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, criteria_value: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Puntos Otorgados</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.points_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_value: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saveBadgeMutation.isPending}>
                {saveBadgeMutation.isPending ? "Guardando..." : editingBadge ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar insignias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Insignias ({filteredBadges?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insignia</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Criterio</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Otorgadas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBadges?.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Medal className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{badge.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {badge.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{badge.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {badge.criteria_type.replace(/_/g, " ")} ≥ {badge.criteria_value}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge>{badge.points_value} pts</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {badgeAwards?.[badge.id] || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(badge)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteBadgeMutation.mutate(badge.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
