import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ForumCategory = 'general' | 'pregunta' | 'anuncio' | 'debate';

export interface ForumPost {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  parent_id: string | null;
  title: string | null;
  content: string;
  category: ForumCategory;
  is_pinned: boolean;
  is_resolved: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  replies?: ForumPost[];
  replies_count?: number;
  user_has_liked?: boolean;
}

// ───── GET top-level posts for a course ─────
export const useCourseForumPosts = (courseId: string | undefined, category?: ForumCategory) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['forum-posts', courseId, category],
    queryFn: async () => {
      if (!courseId) return [];

      let query = supabase
        .from('forum_posts')
        .select('*')
        .eq('course_id', courseId)
        .is('parent_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (category) query = query.eq('category', category);

      const { data: posts, error } = await query;
      if (error) throw error;

      if (!posts || posts.length === 0) return [];

      // Fetch profiles
      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      // Fetch reply counts
      const postIds = posts.map((p) => p.id);
      const { data: repliesRaw } = await supabase
        .from('forum_posts')
        .select('parent_id')
        .in('parent_id', postIds);

      const repliesByParent: Record<string, number> = {};
      repliesRaw?.forEach((r) => {
        repliesByParent[r.parent_id!] = (repliesByParent[r.parent_id!] || 0) + 1;
      });

      // Fetch user likes
      let userLikedIds: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('forum_post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        userLikedIds = likes?.map((l) => l.post_id) || [];
      }

      return posts.map((post) => ({
        ...post,
        profile: profiles?.find((p) => p.user_id === post.user_id),
        replies_count: repliesByParent[post.id] || 0,
        user_has_liked: userLikedIds.includes(post.id),
      })) as ForumPost[];
    },
    enabled: !!courseId,
  });
};

// ───── GET a single thread with all replies ─────
export const useForumThread = (postId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['forum-thread', postId],
    queryFn: async () => {
      if (!postId) return null;

      // Root post
      const { data: root, error: rootError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', postId)
        .single();
      if (rootError) throw rootError;

      // All replies
      const { data: replies, error: rError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('parent_id', postId)
        .order('created_at', { ascending: true });
      if (rError) throw rError;

      const allPosts = [root, ...(replies || [])];
      const userIds = [...new Set(allPosts.map((p) => p.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      let userLikedIds: string[] = [];
      if (user) {
        const allIds = allPosts.map((p) => p.id);
        const { data: likes } = await supabase
          .from('forum_post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', allIds);
        userLikedIds = likes?.map((l) => l.post_id) || [];
      }

      const enrich = (p: any): ForumPost => ({
        ...p,
        profile: profiles?.find((pr) => pr.user_id === p.user_id),
        user_has_liked: userLikedIds.includes(p.id),
      });

      return {
        ...enrich(root),
        replies: (replies || []).map(enrich),
      } as ForumPost;
    },
    enabled: !!postId,
  });
};

// ───── CREATE post or reply ─────
export const useCreateForumPost = () => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      content,
      title,
      category = 'general',
      parentId,
      lessonId,
    }: {
      courseId: string;
      content: string;
      title?: string;
      category?: ForumCategory;
      parentId?: string;
      lessonId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content,
          title: title || null,
          category,
          parent_id: parentId || null,
          lesson_id: lessonId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Award gamification points for new root posts (not replies)
      if (!parentId) {
        await supabase.rpc('add_user_points', {
          _user_id: user.id,
          _points: 5,
          _reason: 'Participación en el foro',
          _reference_type: 'forum',
          _reference_id: data.id,
        });
      }

      return data as ForumPost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', data.course_id] });
      if (data.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['forum-thread', data.parent_id] });
      }
    },
  });
};

// ───── UPDATE post content ─────
export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      is_resolved,
    }: {
      postId: string;
      content?: string;
      is_resolved?: boolean;
    }) => {
      const updates: any = {};
      if (content !== undefined) updates.content = content;
      if (is_resolved !== undefined) updates.is_resolved = is_resolved;

      const { data, error } = await supabase
        .from('forum_posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data as ForumPost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-thread', data.parent_id ?? data.id] });
    },
  });
};

// ───── DELETE post ─────
export const useDeleteForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, courseId }: { postId: string; courseId: string }) => {
      const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
      if (error) throw error;
      return { postId, courseId };
    },
    onSuccess: ({ courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', courseId] });
    },
  });
};

// ───── PIN / UNPIN post (moderator only) ─────
export const usePinForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      isPinned,
      courseId,
    }: {
      postId: string;
      isPinned: boolean;
      courseId: string;
    }) => {
      const { error } = await supabase
        .from('forum_posts')
        .update({ is_pinned: !isPinned })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', variables.courseId] });
    },
  });
};

// ───── LIKE / UNLIKE post ─────
export const useToggleForumLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      courseId,
      hasLiked,
    }: {
      postId: string;
      courseId: string;
      hasLiked: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasLiked) {
        await supabase
          .from('forum_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('forum_post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['forum-thread'] });
    },
  });
};

// ───── FORUM STATS for instructor panel ─────
export const useCourseForumStats = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['forum-stats', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data: posts, error } = await supabase
        .from('forum_posts')
        .select('id, parent_id, is_resolved, category, created_at')
        .eq('course_id', courseId);

      if (error) throw error;

      const rootPosts = posts?.filter((p) => !p.parent_id) || [];
      const replies = posts?.filter((p) => p.parent_id) || [];
      const unanswered = rootPosts.filter(
        (p) => !replies.some((r) => r.parent_id === p.id)
      );
      const resolved = rootPosts.filter((p) => p.is_resolved);

      return {
        total_posts: rootPosts.length,
        total_replies: replies.length,
        unanswered: unanswered.length,
        resolved: resolved.length,
        by_category: {
          general: rootPosts.filter((p) => p.category === 'general').length,
          pregunta: rootPosts.filter((p) => p.category === 'pregunta').length,
          debate: rootPosts.filter((p) => p.category === 'debate').length,
          anuncio: rootPosts.filter((p) => p.category === 'anuncio').length,
        },
      };
    },
    enabled: !!courseId,
  });
};
