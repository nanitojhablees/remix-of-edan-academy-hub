 import { useState } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 type AppRole = "admin" | "instructor" | "estudiante";
 
 export interface UserDetails {
   id: string;
   user_id: string;
   first_name: string;
   last_name: string;
   country: string | null;
   profession: string | null;
   phone: string | null;
   membership_status: string | null;
   avatar_url: string | null;
   created_at: string;
   updated_at: string;
   last_login: string | null;
   last_ip_address: string | null;
   role?: AppRole;
 }
 
 export interface UserEnrollment {
   id: string;
   course_id: string;
   enrolled_at: string;
   progress_percent: number;
   completed_at: string | null;
   course: {
     id: string;
     title: string;
     level: string;
   };
 }
 
 export interface UserBadge {
   id: string;
   badge_id: string;
   earned_at: string;
   badge: {
     id: string;
     name: string;
     icon: string;
     points_value: number;
     description: string | null;
   };
 }
 
 export interface UserPoints {
   total_points: number;
   current_level: number;
 }
 
 export function useAdminUsers() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Fetch user details
   const useUserDetails = (userId: string | null) => {
     return useQuery({
       queryKey: ["admin-user-details", userId],
       queryFn: async () => {
         if (!userId) return null;
 
         const [profileResult, roleResult] = await Promise.all([
           supabase.from("profiles").select("*").eq("user_id", userId).single(),
           supabase.from("user_roles").select("role").eq("user_id", userId).single()
         ]);
 
         if (profileResult.error) throw profileResult.error;
 
         return {
           ...profileResult.data,
           role: (roleResult.data?.role as AppRole) || "estudiante"
         } as UserDetails;
       },
       enabled: !!userId
     });
   };
 
   // Fetch user enrollments
   const useUserEnrollments = (userId: string | null) => {
     return useQuery({
       queryKey: ["admin-user-enrollments", userId],
       queryFn: async () => {
         if (!userId) return [];
 
         const { data, error } = await supabase
           .from("enrollments")
           .select(`
             id,
             course_id,
             enrolled_at,
             progress_percent,
             completed_at,
             course:courses(id, title, level)
           `)
           .eq("user_id", userId);
 
         if (error) throw error;
         return data as unknown as UserEnrollment[];
       },
       enabled: !!userId
     });
   };
 
   // Fetch user badges
   const useUserBadges = (userId: string | null) => {
     return useQuery({
       queryKey: ["admin-user-badges", userId],
       queryFn: async () => {
         if (!userId) return [];
 
         const { data, error } = await supabase
           .from("user_badges")
           .select(`
             id,
             badge_id,
             earned_at,
             badge:badges(id, name, icon, points_value, description)
           `)
           .eq("user_id", userId);
 
         if (error) throw error;
         return data as unknown as UserBadge[];
       },
       enabled: !!userId
     });
   };
 
   // Fetch user points
   const useUserPoints = (userId: string | null) => {
     return useQuery({
       queryKey: ["admin-user-points", userId],
       queryFn: async () => {
         if (!userId) return { total_points: 0, current_level: 1 };
 
         const { data, error } = await supabase
           .from("user_points")
           .select("total_points, current_level")
           .eq("user_id", userId)
           .maybeSingle();
 
         if (error) throw error;
         return data || { total_points: 0, current_level: 1 };
       },
       enabled: !!userId
     });
   };
 
   // Fetch available courses
   const useAvailableCourses = () => {
     return useQuery({
       queryKey: ["available-courses"],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("courses")
           .select("id, title, level")
           .order("title");
 
         if (error) throw error;
         return data;
       }
     });
   };
 
   // Fetch available badges
   const useAvailableBadges = () => {
     return useQuery({
       queryKey: ["available-badges"],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("badges")
           .select("id, name, icon, points_value, description")
           .order("name");
 
         if (error) throw error;
         return data;
       }
     });
   };
 
   // Update user profile
   const updateProfileMutation = useMutation({
     mutationFn: async ({ userId, updates }: { 
       userId: string; 
       updates: Partial<UserDetails>;
     }) => {
       const { error } = await supabase
         .from("profiles")
         .update(updates)
         .eq("user_id", userId);
 
       if (error) throw error;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["admin-user-details", variables.userId] });
       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
       toast({ title: "Perfil actualizado", description: "Los cambios se guardaron correctamente." });
     },
     onError: (error: any) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     }
   });
 
   // Update user role
   const updateRoleMutation = useMutation({
     mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
       const { error } = await supabase
         .from("user_roles")
         .update({ role })
         .eq("user_id", userId);
 
       if (error) throw error;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["admin-user-details", variables.userId] });
       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
       toast({ title: "Rol actualizado", description: "El rol del usuario ha sido cambiado." });
     },
     onError: (error: any) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     }
   });
 
   // Assign course to user
   const assignCourseMutation = useMutation({
     mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
       const { error } = await supabase
         .from("enrollments")
         .insert({
           user_id: userId,
           course_id: courseId,
           progress_percent: 0
         });
 
       if (error) throw error;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["admin-user-enrollments", variables.userId] });
       toast({ title: "Curso asignado", description: "El usuario ha sido inscrito en el curso." });
     },
     onError: (error: any) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     }
   });
 
   // Remove course from user
   const removeCourseMutation = useMutation({
     mutationFn: async ({ enrollmentId }: { enrollmentId: string; userId: string }) => {
       const { error } = await supabase
         .from("enrollments")
         .delete()
         .eq("id", enrollmentId);
 
       if (error) throw error;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["admin-user-enrollments", variables.userId] });
       toast({ title: "Inscripción eliminada", description: "El usuario ya no está inscrito en el curso." });
     },
     onError: (error: any) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     }
   });
 
   // Assign badge to user
   const assignBadgeMutation = useMutation({
     mutationFn: async ({ userId, badgeId, badgeName, pointsValue }: { 
       userId: string; 
       badgeId: string;
       badgeName: string;
       pointsValue: number;
     }) => {
       // First, insert the badge
       const { error: badgeError } = await supabase
         .from("user_badges")
         .insert({
           user_id: userId,
           badge_id: badgeId
         });
 
       if (badgeError) throw badgeError;
 
       // Then, add points
       const { error: pointsError } = await supabase.rpc("add_user_points", {
         _user_id: userId,
         _points: pointsValue,
         _reason: `Insignia asignada manualmente: ${badgeName}`,
         _reference_type: "badge",
         _reference_id: badgeId
       });
 
       if (pointsError) throw pointsError;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["admin-user-badges", variables.userId] });
       queryClient.invalidateQueries({ queryKey: ["admin-user-points", variables.userId] });
       toast({ title: "Insignia asignada", description: "La insignia y sus puntos han sido otorgados." });
     },
     onError: (error: any) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     }
   });
 
   // Remove badge from user
   const removeBadgeMutation = useMutation({
     mutationFn: async ({ userBadgeId }: { userBadgeId: string; userId: string }) => {
       const { error } = await supabase
         .from("user_badges")
         .delete()
         .eq("id", userBadgeId);
 
       if (error) throw error;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ["admin-user-badges", variables.userId] });
       toast({ title: "Insignia eliminada", description: "La insignia ha sido removida del usuario." });
     },
     onError: (error: any) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     }
   });
 
   return {
     useUserDetails,
     useUserEnrollments,
     useUserBadges,
     useUserPoints,
     useAvailableCourses,
     useAvailableBadges,
     updateProfile: updateProfileMutation.mutate,
     updateRole: updateRoleMutation.mutate,
     assignCourse: assignCourseMutation.mutate,
     removeCourse: removeCourseMutation.mutate,
     assignBadge: assignBadgeMutation.mutate,
     removeBadge: removeBadgeMutation.mutate,
     isUpdating: updateProfileMutation.isPending || updateRoleMutation.isPending,
     isAssigning: assignCourseMutation.isPending || assignBadgeMutation.isPending
   };
 }