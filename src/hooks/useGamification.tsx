import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  points_value: number;
  criteria_type: string;
  criteria_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  updated_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

// Get all available badges
export function useAllBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("points_value", { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
  });
}

// Get user's earned badges
export function useUserBadges() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badges(*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!user?.id,
  });
}

// Get user's points and level
export function useUserPoints() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-points", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserPoints | null;
    },
    enabled: !!user?.id,
  });
}

// Get points history
export function usePointsHistory() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["points-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("points_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PointsHistory[];
    },
    enabled: !!user?.id,
  });
}

// Check and award badges
export function useCheckBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .rpc("check_and_award_badges", { _user_id: user.id });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Level thresholds for UI
export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0, maxPoints: 99, title: "Novato" },
  { level: 2, minPoints: 100, maxPoints: 299, title: "Aprendiz" },
  { level: 3, minPoints: 300, maxPoints: 599, title: "Estudiante" },
  { level: 4, minPoints: 600, maxPoints: 999, title: "Avanzado" },
  { level: 5, minPoints: 1000, maxPoints: 1499, title: "Competente" },
  { level: 6, minPoints: 1500, maxPoints: 2499, title: "Experto" },
  { level: 7, minPoints: 2500, maxPoints: 3999, title: "Maestro" },
  { level: 8, minPoints: 4000, maxPoints: 5999, title: "Veterano" },
  { level: 9, minPoints: 6000, maxPoints: 8999, title: "Leyenda" },
  { level: 10, minPoints: 9000, maxPoints: Infinity, title: "Élite EDAN" },
];

export function getLevelInfo(level: number) {
  return LEVEL_THRESHOLDS.find(t => t.level === level) || LEVEL_THRESHOLDS[0];
}

export function getProgressToNextLevel(points: number, currentLevel: number) {
  const current = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const next = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  if (!current || !next) return 100;
  
  const progressInLevel = points - current.minPoints;
  const levelRange = next.minPoints - current.minPoints;
  
  return Math.min(100, Math.round((progressInLevel / levelRange) * 100));
}
