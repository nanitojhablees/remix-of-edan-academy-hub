import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileQuestion, Search, Trash2, Eye, Users, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function ExamsManagement() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: exams, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          course:courses(title, instructor_id),
          questions:questions(id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["admin-exam-attempts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_attempts")
        .select("exam_id, passed");
      
      const stats: Record<string, { total: number; passed: number }> = {};
      data?.forEach(a => {
        if (!stats[a.exam_id]) stats[a.exam_id] = { total: 0, passed: 0 };
        stats[a.exam_id].total++;
        if (a.passed) stats[a.exam_id].passed++;
      });
      return stats;
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ examId, isPublished }: { examId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from("exams")
        .update({ is_published: isPublished })
        .eq("id", examId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast({ title: "Examen eliminado" });
    },
  });

  const filteredExams = exams?.filter(exam =>
    exam.title.toLowerCase().includes(search.toLowerCase()) ||
    exam.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Exámenes</h1>
        <p className="text-muted-foreground">Administra todos los exámenes del sistema</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exámenes..."
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
            <FileQuestion className="h-5 w-5" />
            Exámenes ({filteredExams?.length || 0})
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
                    <TableHead>Examen</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Preguntas</TableHead>
                    <TableHead>Intentos</TableHead>
                    <TableHead>Tasa Aprobación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams?.map((exam: any) => {
                    const examStats = attempts?.[exam.id] || { total: 0, passed: 0 };
                    const passRate = examStats.total > 0 
                      ? Math.round((examStats.passed / examStats.total) * 100) 
                      : 0;
                    
                    return (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{exam.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {exam.duration_minutes} min • Mín: {exam.passing_score}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{exam.course?.title || "Sin curso"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{exam.questions?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {examStats.total}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CheckCircle className={`h-4 w-4 ${passRate >= 50 ? 'text-green-500' : 'text-destructive'}`} />
                            {passRate}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={exam.is_published}
                            onCheckedChange={(checked) =>
                              togglePublishMutation.mutate({ examId: exam.id, isPublished: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/dashboard/exam-editor/${exam.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>¿Eliminar examen?</DialogTitle>
                                  <DialogDescription>
                                    Esta acción eliminará el examen "{exam.title}" y todos sus datos asociados.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2 mt-4">
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteExamMutation.mutate(exam.id)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
