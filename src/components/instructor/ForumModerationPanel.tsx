import { useCourseForumStats, useCourseForumPosts } from '@/hooks/useForumPosts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, CheckCircle2, AlertCircle, Users, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface ForumModerationPanelProps {
  courseId: string;
  forumEnabled: boolean;
  moderationMode: 'open' | 'moderated' | 'closed';
  onUpdateConfig: (enabled: boolean, mode: 'open' | 'moderated' | 'closed') => void;
  isUpdating: boolean;
}

export function ForumModerationPanel({
  courseId,
  forumEnabled,
  moderationMode,
  onUpdateConfig,
  isUpdating,
}: ForumModerationPanelProps) {
  const navigate = useNavigate();
  const { data: stats, isLoading: loadingStats } = useCourseForumStats(courseId);

  return (
    <div className="space-y-6">
      {/* ─── Configuración ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configuración de la Comunidad
          </CardTitle>
          <CardDescription>Controla cómo los estudiantes interactúan en el foro del curso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-0.5">
              <Label className="text-base">Habilitar Foro</Label>
              <p className="text-sm text-muted-foreground">
                Permite a los estudiantes hacer preguntas y debatir
              </p>
            </div>
            <Switch
              checked={forumEnabled}
              onCheckedChange={(checked) => onUpdateConfig(checked, moderationMode)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-3">
            <Label>Modo de Moderación</Label>
            <Select
              value={moderationMode || 'open'}
              onValueChange={(val: any) => onUpdateConfig(forumEnabled, val)}
              disabled={!forumEnabled || isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abierto (Publicación inmediata)</SelectItem>
                <SelectItem value="moderated" disabled>Moderado (Aprobar antes de publicar - Próximamente)</SelectItem>
                <SelectItem value="closed">Cerrado (Solo lectura)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define si los posts requieren aprobación antes de ser visibles para los demás estudiantes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Estadísticas ─── */}
      {forumEnabled && (
        <>
          <div className="grid sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                {loadingStats ? <Skeleton className="h-8 w-16 mb-2" /> : <span className="text-3xl font-bold">{stats?.total_posts || 0}</span>}
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hilos Totales</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                {loadingStats ? <Skeleton className="h-8 w-16 mb-2" /> : <span className="text-3xl font-bold">{stats?.total_replies || 0}</span>}
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Respuestas</span>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <AlertCircle className="h-5 w-5 text-amber-500 mb-2" />
                {loadingStats ? <Skeleton className="h-8 w-16 mb-2" /> : <span className="text-3xl font-bold text-amber-600">{stats?.unanswered || 0}</span>}
                <span className="text-xs text-amber-600/80 uppercase tracking-wider font-semibold">Sin Responder</span>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
                {loadingStats ? <Skeleton className="h-8 w-16 mb-2" /> : <span className="text-3xl font-bold text-green-600">{stats?.resolved || 0}</span>}
                <span className="text-xs text-green-600/80 uppercase tracking-wider font-semibold">Resueltos</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Acceso Rápido al Foro</CardTitle>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/dashboard/course/${courseId}?tab=forum`)}>
                  <ExternalLink className="h-4 w-4" />
                  Ir al Foro como Estudiante
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h3 className="font-medium mb-1">Modera directamente desde la vista del curso</h3>
                <p className="text-sm text-muted-foreground">
                  Al entrar al foro tendrás permisos especiales para Anclar, Modificar y Eliminar posts o marcar preguntas como resueltas.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
