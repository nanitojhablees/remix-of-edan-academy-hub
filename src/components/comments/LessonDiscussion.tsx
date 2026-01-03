import { useState } from 'react';
import { 
  useLessonComments, 
  useAddComment, 
  useDeleteComment, 
  useToggleLike, 
  useTogglePinComment,
  useUpdateComment,
  Comment 
} from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Pin, 
  Trash2, 
  Edit, 
  MoreVertical,
  Send,
  Loader2,
  Award
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LessonDiscussionProps {
  lessonId: string;
  courseInstructorId?: string;
}

export function LessonDiscussion({ lessonId, courseInstructorId }: LessonDiscussionProps) {
  const { user, role } = useAuth();
  const { data: comments, isLoading } = useLessonComments(lessonId);
  const [newComment, setNewComment] = useState('');
  
  const addCommentMutation = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addCommentMutation.mutateAsync({
      lessonId,
      content: newComment.trim()
    });
    setNewComment('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Discusión</h3>
        <Badge variant="secondary">{comments?.length || 0} comentarios</Badge>
      </div>

      {/* New Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Escribe un comentario o pregunta..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground text-center py-4">
          Inicia sesión para participar en la discusión
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Sé el primero en comentar</p>
          </div>
        ) : (
          comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              lessonId={lessonId}
              courseInstructorId={courseInstructorId}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  lessonId: string;
  courseInstructorId?: string;
  isReply?: boolean;
}

function CommentItem({ comment, lessonId, courseInstructorId, isReply = false }: CommentItemProps) {
  const { user, role } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleLikeMutation = useToggleLike();
  const togglePinMutation = useTogglePinComment();
  const updateCommentMutation = useUpdateComment();

  const isOwner = user?.id === comment.user_id;
  const isInstructor = role === 'instructor' || role === 'admin';
  const canModerate = isInstructor || user?.id === courseInstructorId;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await addCommentMutation.mutateAsync({
      lessonId,
      content: replyContent.trim(),
      parentId: comment.id
    });
    setReplyContent('');
    setShowReplyForm(false);
  };

  const handleDelete = async () => {
    if (confirm('¿Eliminar este comentario?')) {
      await deleteCommentMutation.mutateAsync({ commentId: comment.id, lessonId });
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    await updateCommentMutation.mutateAsync({
      commentId: comment.id,
      content: editContent.trim(),
      lessonId
    });
    setIsEditing(false);
  };

  const handleLike = () => {
    toggleLikeMutation.mutate({
      commentId: comment.id,
      lessonId,
      hasLiked: comment.user_has_liked || false
    });
  };

  const handlePin = () => {
    togglePinMutation.mutate({
      commentId: comment.id,
      isPinned: comment.is_pinned,
      lessonId
    });
  };

  const initials = comment.profile 
    ? `${comment.profile.first_name?.[0] || ''}${comment.profile.last_name?.[0] || ''}`
    : '??';

  const displayName = comment.profile
    ? `${comment.profile.first_name} ${comment.profile.last_name}`
    : 'Usuario';

  return (
    <div className={cn(
      "group",
      isReply && "ml-8 mt-3"
    )}>
      <div className={cn(
        "p-4 rounded-lg border bg-card transition-colors",
        comment.is_pinned && "border-primary/50 bg-primary/5",
        comment.is_instructor_reply && "border-amber-500/30 bg-amber-500/5"
      )}>
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={comment.profile?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{displayName}</span>
              {comment.is_instructor_reply && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Award className="h-3 w-3" />
                  Instructor
                </Badge>
              )}
              {comment.is_pinned && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Pin className="h-3 w-3" />
                  Fijado
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </span>
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={updateCommentMutation.isPending}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 text-xs",
                  comment.user_has_liked && "text-primary"
                )}
                onClick={handleLike}
                disabled={!user}
              >
                <ThumbsUp className={cn(
                  "h-3.5 w-3.5 mr-1",
                  comment.user_has_liked && "fill-current"
                )} />
                {comment.likes_count > 0 && comment.likes_count}
              </Button>

              {!isReply && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply className="h-3.5 w-3.5 mr-1" />
                  Responder
                </Button>
              )}

              {(isOwner || canModerate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {canModerate && !isReply && (
                      <DropdownMenuItem onClick={handlePin}>
                        <Pin className="h-4 w-4 mr-2" />
                        {comment.is_pinned ? 'Desanclar' : 'Anclar'}
                      </DropdownMenuItem>
                    )}
                    {(isOwner || canModerate) && (
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="ml-8 mt-2 space-y-2">
          <Textarea
            placeholder="Escribe tu respuesta..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleReply}
              disabled={!replyContent.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Responder
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowReplyForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              lessonId={lessonId}
              courseInstructorId={courseInstructorId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
