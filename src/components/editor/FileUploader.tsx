import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, Image, FileText, Video, Music, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploaderProps {
  onFileUploaded: (file: UploadedFile) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="h-5 w-5 text-green-500" />;
  if (type.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
  if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-orange-500" />;
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-blue-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const FileUploader = ({ 
  onFileUploaded, 
  accept = "image/*,application/pdf,.doc,.docx,video/mp4,video/webm,audio/mpeg,audio/wav",
  maxSize = 50,
  className 
}: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`El archivo excede el límite de ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(data.path);

      setProgress(100);

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      };

      onFileUploaded(uploadedFile);
      toast.success('Archivo subido correctamente');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isUploading ? 'Subiendo...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Imágenes, PDFs, videos, audio (máx. {maxSize}MB)
            </p>
          </div>
        </div>
      </div>

      {isUploading && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
};

interface FilePreviewProps {
  file: UploadedFile;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const FilePreview = ({ file, onRemove, showRemove = true }: FilePreviewProps) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');

  return (
    <div className="relative group border rounded-lg overflow-hidden bg-muted/50">
      {isImage ? (
        <div className="aspect-video relative">
          <img 
            src={file.url} 
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : isVideo ? (
        <video 
          src={file.url} 
          controls 
          className="w-full aspect-video"
        />
      ) : isAudio ? (
        <div className="p-4">
          <audio src={file.url} controls className="w-full" />
        </div>
      ) : (
        <a 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
        >
          {getFileIcon(file.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
        </a>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate">{file.name}</p>
      </div>

      {showRemove && onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
