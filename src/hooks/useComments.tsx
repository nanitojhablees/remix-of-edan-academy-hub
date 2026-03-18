import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_instructor_reply: boolean;
  is_pinned: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
  user_has_liked?: boolean;
}

export const useLessonComments = (lessonId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: async () => {
      if (!lessonId) return [];

      const { data: comments, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      // Fetch user's likes
      let userLikes: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        userLikes = likes?.map(l => l.comment_id) || [];
      }

      // Map profiles and likes to comments
      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id),
        user_has_liked: userLikes.includes(comment.id)
      }));

      // Organize into threads (parent comments with replies)
      const parentComments = commentsWithProfiles.filter(c => !c.parent_id);
      const replies = commentsWithProfiles.filter(c => c.parent_id);

      return parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(r => r.parent_id === parent.id)
      })) as Comment[];
    },
    enabled: !!lessonId,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!lessonId) return;

    const channel = supabase
      .channel(`lesson-comments-${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_comments',
          filter: `lesson_id=eq.${lessonId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, queryClient]);

  return query;
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      content,
      parentId
    }: {
      lessonId: string;
      content: string;
      parentId?: string;
    }) => {
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
          is_instructor_reply: role === 'instructor' || role === 'admin'
        })
        .select()
        .single();

      if (error) throw error;

      // Gamification: Award points for participating in the forum
      // Instructors and admins generally shouldn't get points for this, but letting it pass is fine or we can exclude them.
      if (role === 'estudiante') {
        const { error: pointsError } = await supabase.rpc('add_user_points', {
          _user_id: user.id,
          _points: 5, // 5 points per comment
          _reason: 'Participación en Foro de Comunidad',
          _reference_type: 'comment',
          _reference_id: data.id
        });
        if (pointsError) console.error('Error awarding points:', pointsError);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      toast.success('Comentario publicado (+5 Pts)');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al publicar comentario');
    }
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      lessonId
    }: {
      commentId: string;
      content: string;
      lessonId: string;
    }) => {
      const { error } = await supabase
        .from('lesson_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      toast.success('Comentario actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar comentario');
    }
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      lessonId
    }: {
      commentId: string;
      lessonId: string;
    }) => {
      const { error } = await supabase
        .from('lesson_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      toast.success('Comentario eliminado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar comentario');
    }
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      commentId,
      lessonId,
      hasLiked
    }: {
      commentId: string;
      lessonId: string;
      hasLiked: boolean;
    }) => {
      if (!user) throw new Error('No autenticado');

      if (hasLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al dar like');
    }
  });
};

export const useTogglePinComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      isPinned,
      lessonId
    }: {
      commentId: string;
      isPinned: boolean;
      lessonId: string;
    }) => {
      const { error } = await supabase
        .from('lesson_comments')
        .update({ is_pinned: !isPinned })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      toast.success(variables.isPinned ? 'Comentario desanclado' : 'Comentario anclado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al anclar comentario');
    }
  });
};
