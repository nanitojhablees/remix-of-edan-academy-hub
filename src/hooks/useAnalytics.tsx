import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

// Track analytics event
export function useTrackEvent() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ eventType, eventData }: { eventType: string; eventData?: Record<string, unknown> }) => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from("user_analytics")
        .insert([{
          user_id: user.id,
          event_type: eventType,
          event_data: eventData ? JSON.parse(JSON.stringify(eventData)) : null,
        }]);

      if (error) throw error;
    },
  });
}

// Get user analytics
export function useUserAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-analytics", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_analytics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AnalyticsEvent[];
    },
    enabled: !!user?.id,
  });
}

// Admin: Get all analytics
export function useAllAnalytics(days: number = 30) {
  const { role } = useAuth();
  
  return useQuery({
    queryKey: ["all-analytics", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from("user_analytics")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnalyticsEvent[];
    },
    enabled: role === "admin",
  });
}

// Admin: Get analytics summary
export function useAnalyticsSummary() {
  const { role } = useAuth();
  
  return useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Get daily active users (unique users with events today)
      const { data: todayEvents } = await supabase
        .from("user_analytics")
        .select("user_id")
        .gte("created_at", today.toISOString());
      
      const dailyActiveUsers = new Set(todayEvents?.map(e => e.user_id) || []).size;

      // Get weekly active users
      const { data: weekEvents } = await supabase
        .from("user_analytics")
        .select("user_id")
        .gte("created_at", weekAgo.toISOString());
      
      const weeklyActiveUsers = new Set(weekEvents?.map(e => e.user_id) || []).size;

      // Get monthly active users
      const { data: monthEvents } = await supabase
        .from("user_analytics")
        .select("user_id, event_type")
        .gte("created_at", monthAgo.toISOString());
      
      const monthlyActiveUsers = new Set(monthEvents?.map(e => e.user_id) || []).size;

      // Get total events this month
      const totalEventsMonth = monthEvents?.length || 0;

      // Get event breakdown
      const eventCounts: Record<string, number> = {};
      monthEvents?.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });

      return {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        totalEventsMonth,
        eventBreakdown: eventCounts,
      };
    },
    enabled: role === "admin",
  });
}

// Admin: Get leaderboard
export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select(`
          *,
          profile:profiles!user_points_user_id_fkey(first_name, last_name, avatar_url)
        `)
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback without join if foreign key doesn't exist
        const { data: pointsData, error: pointsError } = await supabase
          .from("user_points")
          .select("*")
          .order("total_points", { ascending: false })
          .limit(limit);
        
        if (pointsError) throw pointsError;
        return pointsData;
      }
      return data;
    },
  });
}
