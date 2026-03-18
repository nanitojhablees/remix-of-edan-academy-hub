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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Si el archivo ya es muy pequeño o no es imagen, pasarlo directamente
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es muy grande (max 1280px width)
          const MAX_WIDTH = 1280;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(file); // fail-safe fallback
            return;
          }
          
          // Fondo blanco para imágenes transparentes que pasan a WebP
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Crear un nuevo File objeto de tipo WebP
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.8 // 80% compression quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen original no puede superar 10MB');
      return;
    }

    setIsUploading(true);
    try {
      toast.info('Optimizando imagen...');
      const compressedFile = await compressImage(file);
      
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

      toast.info('Subiendo imagen optimizada...');
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      onChange(urlData.publicUrl);
      toast.success('Imagen optimizada y subida correctamente');
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
