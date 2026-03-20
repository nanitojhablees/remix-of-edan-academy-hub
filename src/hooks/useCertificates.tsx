import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_code: string;
  issued_at: string;
  grade: number | null;
  student_name: string;
  course_title: string;
  created_at: string;
}

export const useMyCertificates = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!user,
  });
};

export const useCertificate = (certificateId: string | undefined) => {
  return useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: async () => {
      if (!certificateId) return null;
      
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();
      
      if (error) throw error;
      return data as Certificate;
    },
    enabled: !!certificateId,
  });
};

export const useCourseCertificate = (courseId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['course-certificate', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return null;
      
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Certificate | null;
    },
    enabled: !!courseId && !!user,
  });
};

export const useIssueCertificate = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  
  return useMutation({
    mutationFn: async ({ courseId, grade }: { courseId: string; grade?: number }) => {
      if (!user || !session) throw new Error('Not authenticated');
      
      // Call the RPC function directly
      const { data, error } = await supabase
        .rpc('issue_certificate', {
          _user_id: user.id,
          _course_id: courseId,
          _grade: grade || null
        });
      
      if (error) throw error;
      return data as Certificate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificate'] });
    },
  });
};

export const useDownloadCertificate = () => {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async (certificateId: string) => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('generate-certificate-pdfme', {
        body: { certificateId, action: 'download' }
      });
      
      if (response.error) throw response.error;
      
      // The response.data will be the PDF content
      return response.data;
    },
  });
};

export const useVerifyCertificate = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await supabase.functions.invoke('generate-certificate-pdfme', {
        body: { action: 'verify', code }
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
  });
};
