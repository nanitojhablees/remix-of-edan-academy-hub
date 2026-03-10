import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Link2, Plus, Trash2, Download, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ModuleMaterial {
  id: string;
  module_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

function useModuleMaterials(moduleId: string) {
  return useQuery({
    queryKey: ['module-materials', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('module_materials')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ModuleMaterial[];
    },
    enabled: !!moduleId,
  });
}

function useAddMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (material: Omit<ModuleMaterial, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('module_materials')
        .insert(material)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module-materials', variables.module_id] });
      toast.success('Material añadido');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al añadir material');
    },
  });
}

function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moduleId }: { id: string; moduleId: string }) => {
      const { error } = await supabase.from('module_materials').delete().eq('id', id);
      if (error) throw error;
      return moduleId;
    },
    onSuccess: (moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['module-materials', moduleId] });
      toast.success('Material eliminado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar');
    },
  });
}

// Instructor view: manage materials
export function ModuleMaterialsEditor({ moduleId }: { moduleId: string }) {
  const { user } = useAuth();
  const { data: materials, isLoading } = useModuleMaterials(moduleId);
  const addMaterial = useAddMaterial();
  const deleteMaterial = useDeleteMaterial();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'link' | 'pdf'>('link');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo no puede superar 50MB');
      return;
    }
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `materials/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file, { cacheControl: '3600' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(data.path);
      setFileUrl(urlData.publicUrl);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setFileType('pdf');
      toast.success('Archivo subido');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !fileUrl.trim() || !user) return;
    await addMaterial.mutateAsync({
      module_id: moduleId,
      title,
      file_url: fileUrl,
      file_type: fileType,
      file_size: 0,
      uploaded_by: user.id,
    });
    setTitle('');
    setFileUrl('');
    setFileType('link');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Material de Referencia
        </h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Añadir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Material de Referencia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={fileType} onValueChange={(v) => setFileType(v as 'link' | 'pdf')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Enlace (Drive, web, etc.)</SelectItem>
                    <SelectItem value="pdf">Archivo PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Guía de estudio" />
              </div>

              {fileType === 'pdf' ? (
                <div className="space-y-2">
                  <Label>Subir archivo</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="material-file-input"
                      disabled={isUploading}
                    />
                    <label htmlFor="material-file-input" className="cursor-pointer">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      ) : (
                        <div>
                          <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                          <p className="text-sm text-muted-foreground">
                            {fileUrl ? 'Archivo cargado ✓' : 'Haz clic para subir PDF, DOC, PPT'}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {fileUrl && (
                    <p className="text-xs text-green-600 truncate">✓ {fileUrl.split('/').pop()}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>URL del recurso *</Label>
                  <Input
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={!title.trim() || !fileUrl.trim() || addMaterial.isPending}
                className="w-full"
              >
                {addMaterial.isPending ? 'Guardando...' : 'Añadir Material'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : materials && materials.length > 0 ? (
        <div className="space-y-1">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 group text-sm">
              {m.file_type === 'pdf' ? (
                <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
              ) : (
                <Link2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
              <span className="flex-1 truncate">{m.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => deleteMaterial.mutate({ id: m.id, moduleId })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Sin material aún</p>
      )}
    </div>
  );
}

// Student view: see and download materials
export function ModuleMaterialsViewer({ moduleId }: { moduleId: string }) {
  const { data: materials, isLoading } = useModuleMaterials(moduleId);

  if (isLoading || !materials || materials.length === 0) return null;

  return (
    <div className="space-y-1 px-4 pb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        📎 Material de Referencia
      </p>
      {materials.map((m) => (
        <a
          key={m.id}
          href={m.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors"
        >
          {m.file_type === 'pdf' ? (
            <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
          ) : (
            <Link2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          <span className="flex-1 truncate">{m.title}</span>
          {m.file_type === 'pdf' ? (
            <Download className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </a>
      ))}
    </div>
  );
}
