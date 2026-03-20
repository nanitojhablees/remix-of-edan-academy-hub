import { useState } from 'react';
import { useCourseForumStats, useCourseForumPosts, useDeleteForumPost, usePinForumPost, useUpdateForumPost } from '@/hooks/useForumPosts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ExternalLink, 
  Pin, 
  PinOff, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ForumPost, ForumCategory } from '@/hooks/useForumPosts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const { toast } = useToast();
  const { data: stats, isLoading: loadingStats } = useCourseForumStats(courseId);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'all'>('all');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const { data: posts, isLoading: loadingPosts } = useCourseForumPosts(courseId, selectedCategory === 'all' ? undefined : selectedCategory);
  const deletePost = useDeleteForumPost();
  const pinPost = usePinForumPost();
  const updatePost = useUpdateForumPost();

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.')) return;
    
    try {
      await deletePost.mutateAsync({ postId, courseId });
      toast({ title: 'Post eliminado', description: 'El post ha sido eliminado correctamente.' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar el post.', 
        variant: 'destructive' 
      });
    }
  };

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      await pinPost.mutateAsync({ postId, isPinned, courseId });
      toast({ 
        title: isPinned ? 'Post desanclado' : 'Post anclado', 
        description: isPinned ? 'El post ha sido desanclado.' : 'El post ha sido anclado.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el post.', 
        variant: 'destructive' 
      });
    }
  };

  const handleStartEdit = (post: ForumPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    
    try {
      await updatePost.mutateAsync({ postId, content: editContent });
      setEditingPostId(null);
      setEditContent('');
      toast({ title: 'Post actualizado', description: 'El post ha sido actualizado correctamente.' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el post.', 
        variant: 'destructive' 
      });
    }
  };

  const getCategoryBadge = (category: ForumCategory) => {
    const categoryConfig = {
      general: { label: 'General', variant: 'default' },
      pregunta: { label: 'Pregunta', variant: 'destructive' },
      anuncio: { label: 'Anuncio', variant: 'secondary' },
      debate: { label: 'Debate', variant: 'outline' },
    };
    
    const config = categoryConfig[category];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

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
                <SelectItem value="moderated">Moderado (Aprobar antes de publicar)</SelectItem>
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

          {/* ─── Moderación de Posts ─── */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Moderación de Posts</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCategory}
                    onValueChange={(val: any) => setSelectedCategory(val)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="pregunta">Pregunta</SelectItem>
                      <SelectItem value="anuncio">Anuncio</SelectItem>
                      <SelectItem value="debate">Debate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2" 
                    onClick={() => navigate(`/dashboard/course/${courseId}?tab=forum`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Foro
                  </Button>
                </div>
              </div>
              <CardDescription>
                Gestiona y modera los posts del foro del curso
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingPosts ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div 
                      key={post.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      {editingPostId === post.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full min-h-20 p-2 border rounded-md"
                            placeholder="Editar contenido del post..."
                          />
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveEdit(post.id)}
                              disabled={!editContent.trim()}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Guardar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingPostId(null)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {post.is_pinned && (
                                <Pin className="h-4 w-4 text-primary" />
                              )}
                              <span className="font-medium">
                                {post.profile?.first_name} {post.profile?.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                              </span>
                              {getCategoryBadge(post.category)}
                              {post.is_resolved && (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Resuelto</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handlePinPost(post.id, post.is_pinned)}
                                title={post.is_pinned ? 'Desanclar post' : 'Anclar post'}
                              >
                                {post.is_pinned ? (
                                  <PinOff className="h-4 w-4" />
                                ) : (
                                  <Pin className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleStartEdit(post)}
                                title="Editar post"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeletePost(post.id)}
                                title="Eliminar post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            {post.title && <h4 className="font-medium mb-2">{post.title}</h4>}
                            <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{post.replies_count || 0} respuestas</span>
                            <span>{post.likes_count || 0} likes</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-medium mb-1">No hay posts para moderar</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? 'Aún no hay publicaciones en el foro de este curso.' 
                      : `No hay posts en la categoría "${selectedCategory}"`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
