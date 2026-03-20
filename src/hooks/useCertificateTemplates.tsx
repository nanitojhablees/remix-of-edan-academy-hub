import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  template_data: any;
  background_image?: string;
  is_default: boolean;
  created_by?: string;
  colors_config: any;
  fonts_config: any;
  layout_config: any;
  created_at: string;
  updated_at: string;
}

export const useCertificateTemplates = () => {
  return useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as CertificateTemplate[];
    },
  });
};

export const useCertificateTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ["certificate-template", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      return data as CertificateTemplate;
    },
    enabled: !!templateId,
  });
};

export const useCreateCertificateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<CertificateTemplate, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
  });
};

export const useUpdateCertificateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...template }: Partial<CertificateTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .update(template)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      queryClient.invalidateQueries({ queryKey: ["certificate-template", variables.id] });
    },
  });
};

export const useDeleteCertificateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("certificate_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
  });
};

export const useSetDefaultTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      // First unset all templates as default
      await supabase
        .from("certificate_templates")
        .update({ is_default: false })
        .neq("id", templateId);
      
      // Then set the selected template as default
      const { data, error } = await supabase
        .from("certificate_templates")
        .update({ is_default: true })
        .eq("id", templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
  });
};