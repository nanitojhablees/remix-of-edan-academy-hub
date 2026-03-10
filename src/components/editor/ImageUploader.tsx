import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  folder?: string;
  className?: string;
  placeholder?: string;
  accept?: string;
}

export function ImageUploader({
  value,
  onChange,
  bucket,
  folder = 'uploads',
  className,
  placeholder = 'Sube una imagen o pega una URL',
  accept = 'image/png,image/jpeg,image/webp',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.includes(bucket) ? 'url' : 'upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      onChange(urlData.publicUrl);
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('upload')}
        >
          <Upload className="h-3 w-3 mr-1" />
          Subir archivo
        </Button>
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('url')}
        >
          Pegar URL
        </Button>
      </div>

      {mode === 'upload' ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-4 transition-colors text-center cursor-pointer hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Haz clic para seleccionar imagen (PNG, JPG, max 5MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}

      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-24 w-auto rounded-lg border object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
