import { useState } from 'react';
import {
  useCourseForumPosts,
  useForumThread,
  useCreateForumPost,
  useUpdateForumPost,
  useDeleteForumPost,
  usePinForumPost,
  useToggleForumLike,
  ForumPost,
  ForumCategory,
} from '@/hooks/useForumPosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  Trash2,
  Edit,
  MoreVertical,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  PlusCircle,
  Award,
  Megaphone,
  HelpCircle,
  Users,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_CONFIG: Record<ForumCategory, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: 'General', icon: <Users className="h-3.5 w-3.5" />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  pregunta: { label: 'Pregunta', icon: <HelpCircle className="h-3.5 w-3.5" />, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  debate: { label: 'Debate', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  anuncio: { label: 'Anuncio', icon: <Megaphone className="h-3.5 w-3.5" />, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

interface CourseForumViewProps {
  courseId: string;
  instructorId?: string;
  forumEnabled?: boolean;
}

export function CourseForumView({ courseId, instructorId, forumEnabled = true }: CourseForumViewProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ForumCategory | 'all'>('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('general');

  const { data: posts, isLoading } = useCourseForumPosts(
    courseId,
    filterCategory !== 'all' ? filterCategory : undefined
  );
  const createPost = useCreateForumPost();

  const isInstructor = role === 'instructor' || role === 'admin';

  if (!forumEnabled && !isInstructor) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">El foro de este curso no está disponible</p>
      </div>
    );
  }

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    try {
      await createPost.mutateAsync({
        courseId,
        content: newContent.trim(),
        title: newTitle.trim() || undefined,
        category: newCategory,
      });
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setShowNewPost(false);
      toast({ title: 'Publicado', description: 'Tu post ha sido publicado' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Thread view
  if (selectedPostId) {
    return (
      <ForumThreadView
        postId={selectedPostId}
        courseId={courseId}
        instructorId={instructorId}
        onBack={() => setSelectedPostId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Comunidad del Curso</h3>
          <Badge variant="secondary">{posts?.length || 0} hilos</Badge>
        </div>
        {user && forumEnabled && (
          <Button size="sm" onClick={() => setShowNewPost(!showNewPost)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo post
          </Button>
        )}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Título del post (opcional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-2 sm:col-span-1"
              />
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ForumCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">{v.icon}{v.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="¿Qué quieres compartir con la comunidad?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewPost(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreatePost} disabled={!newContent.trim() || createPost.isPending}>
                {createPost.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterCategory('all')}
          className="h-8 text-xs"
        >
          Todos
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
          <Button
            key={k}
            size="sm"
            variant={filterCategory === k ? 'default' : 'outline'}
            onClick={() => setFilterCategory(k as ForumCategory)}
            className="h-8 text-xs gap-1"
          >
            {v.icon}
            {v.label}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium mb-2">No hay posts todavía</p>
          <p className="text-sm">¡Sé el primero en iniciar una conversación!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts?.map((post) => (
            <ForumPostCard
              key={post.id}
              post={post}
              courseId={courseId}
              instructorId={instructorId}
              onClick={() => setSelectedPostId(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Card (list view) ───────────────────────────────────────────────────
function ForumPostCard({
  post,
  courseId,
  instructorId,
  onClick,
}: {
  post: ForumPost;
  courseId: string;
  instructorId?: string;
  onClick: () => void;
}) {
  const { user, role } = useAuth();
  const deletePost = useDeleteForumPost();
  const pinPost = usePinForumPost();
  const toggleLike = useToggleForumLike();
  const { toast } = useToast();

  const isOwner = user?.id === post.user_id;
  const isModerator = role === 'admin' || role === 'instructor' || user?.id === instructorId;
  const isInstructorPost = post.user_id === instructorId;

  const cfg = CATEGORY_CONFIG[post.category];
  const displayName = post.profile
    ? `${post.profile.first_name} ${post.profile.last_name}`
    : 'Usuario';
  const initials = post.profile
    ? `${post.profile.first_name?.[0] || ''}${post.profile.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <Card
      className={cn(
        'cursor-pointer hover:border-primary/40 transition-all hover:shadow-sm group',
        post.is_pinned && 'border-primary/40 bg-primary/5'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={post.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0" onClick={onClick}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium">{displayName}</span>
              {isInstructorPost && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Award className="h-3 w-3" />Instructor
                </Badge>
              )}
              <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', cfg.color)}>
                {cfg.icon}{cfg.label}
              </span>
              {post.is_pinned && (
                <Badge variant="outline" className="text-xs gap-1 border-primary/40">
                  <Pin className="h-3 w-3" />Fijado
                </Badge>
              )}
              {post.is_resolved && (
                <Badge className="text-xs gap-1 bg-green-500/10 text-green-600 border border-green-500/20">
                  <CheckCircle2 className="h-3 w-3" />Resuelto
                </Badge>
              )}
            </div>

            {post.title && (
              <p className="font-semibold text-sm mb-1 line-clamp-1">{post.title}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />{post.replies_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />{post.likes_count || 0}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 px-2 text-xs', post.user_has_liked && 'text-primary')}
              onClick={(e) => {
                e.stopPropagation();
                if (!user) return;
                toggleLike.mutate({ postId: post.id, courseId, hasLiked: post.user_has_liked || false });
              }}
            >
              <ThumbsUp className={cn('h-3.5 w-3.5', post.user_has_liked && 'fill-current')} />
            </Button>

            {(isOwner || isModerator) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isModerator && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); pinPost.mutate({ postId: post.id, isPinned: post.is_pinned, courseId }); }}>
                      <Pin className="h-4 w-4 mr-2" />
                      {post.is_pinned ? 'Desanclar' : 'Anclar'}
                    </DropdownMenuItem>
                  )}
                  {(isOwner || isModerator) && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('¿Eliminar este post?')) return;
                        await deletePost.mutateAsync({ postId: post.id, courseId });
                        toast({ title: 'Eliminado' });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClick}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Thread View ────────────────────────────────────────────────────────────
function ForumThreadView({
  postId,
  courseId,
  instructorId,
  onBack,
}: {
  postId: string;
  courseId: string;
  instructorId?: string;
  onBack: () => void;
}) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { data: thread, isLoading } = useForumThread(postId);
  const createPost = useCreateForumPost();
  const updatePost = useUpdateForumPost();
  const deletePost = useDeleteForumPost();
  const pinPost = usePinForumPost();
  const toggleLike = useToggleForumLike();

  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const isModerator = role === 'admin' || role === 'instructor' || user?.id === instructorId;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!thread) return null;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await createPost.mutateAsync({
      courseId,
      content: replyContent.trim(),
      parentId: postId,
    });
    setReplyContent('');
    toast({ title: 'Respuesta publicada' });
  };

  const handleMarkResolved = () => {
    updatePost.mutate({ postId, is_resolved: !thread.is_resolved });
  };

  const renderPost = (p: ForumPost, isRoot = false) => {
    const isOwner = user?.id === p.user_id;
    const isInstructorPost = p.user_id === instructorId;
    const displayName = p.profile ? `${p.profile.first_name} ${p.profile.last_name}` : 'Usuario';
    const initials = p.profile
      ? `${p.profile.first_name?.[0] || ''}${p.profile.last_name?.[0] || ''}`.toUpperCase()
      : '?';

    return (
      <div
        key={p.id}
        className={cn(
          'p-4 rounded-xl border bg-card',
          isRoot && thread.is_pinned && 'border-primary/40 bg-primary/5',
          isInstructorPost && !isRoot && 'border-amber-500/30 bg-amber-500/5'
        )}
      >
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={p.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-medium text-sm">{displayName}</span>
              {isInstructorPost && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Award className="h-3 w-3" />Instructor
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>

            {editingId === p.id ? (
              <div className="space-y-2">
                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => {
                    await updatePost.mutateAsync({ postId: p.id, content: editContent });
                    setEditingId(null);
                  }} disabled={updatePost.isPending}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{p.content}</p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost" size="sm"
                className={cn('h-7 px-2 text-xs', p.user_has_liked && 'text-primary')}
                onClick={() => user && toggleLike.mutate({ postId: p.id, courseId, hasLiked: p.user_has_liked || false })}
                disabled={!user}
              >
                <ThumbsUp className={cn('h-3.5 w-3.5 mr-1', p.user_has_liked && 'fill-current')} />
                {p.likes_count > 0 && p.likes_count}
              </Button>

              {(isOwner || isModerator) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && (
                      <DropdownMenuItem onClick={() => { setEditingId(p.id); setEditContent(p.content); }}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                    )}
                    {isModerator && isRoot && (
                      <DropdownMenuItem onClick={() => pinPost.mutate({ postId: p.id, isPinned: p.is_pinned, courseId })}>
                        <Pin className="h-4 w-4 mr-2" />{p.is_pinned ? 'Desanclar' : 'Anclar'}
                      </DropdownMenuItem>
                    )}
                    {isModerator && isRoot && (
                      <DropdownMenuItem onClick={handleMarkResolved}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {thread.is_resolved ? 'Marcar sin resolver' : 'Marcar resuelto'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={async () => {
                        if (!confirm('¿Eliminar?')) return;
                        await deletePost.mutateAsync({ postId: p.id, courseId });
                        if (isRoot) onBack();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />Foro
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', CATEGORY_CONFIG[thread.category].color)}>
            {CATEGORY_CONFIG[thread.category].icon}
            {CATEGORY_CONFIG[thread.category].label}
          </span>
          {thread.is_resolved && (
            <Badge className="text-xs gap-1 bg-green-500/10 text-green-600 border border-green-500/20">
              <CheckCircle2 className="h-3 w-3" />Resuelto
            </Badge>
          )}
        </div>
      </div>

      {/* Root post */}
      {thread.title && (
        <h2 className="text-xl font-semibold">{thread.title}</h2>
      )}
      {renderPost(thread, true)}

      {/* Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          <p className="text-sm font-medium text-muted-foreground">{thread.replies.length} respuesta{thread.replies.length !== 1 ? 's' : ''}</p>
          {thread.replies.map((r) => renderPost(r))}
        </div>
      )}

      {/* Reply Form */}
      {user && (
        <div className="space-y-2 pt-2">
          <Textarea
            placeholder="Escribe tu respuesta..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={!replyContent.trim() || createPost.isPending}
            >
              {createPost.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Responder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
