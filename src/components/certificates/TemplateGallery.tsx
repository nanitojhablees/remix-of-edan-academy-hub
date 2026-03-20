import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  StarOff, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  Plus,
  Check
} from "lucide-react";
import { CertificateTemplate } from "@/hooks/useCertificateTemplates";

interface TemplateGalleryProps {
  templates: CertificateTemplate[];
  selectedTemplate: string | null;
  onSelectTemplate: (template: CertificateTemplate) => void;
  onEditTemplate: (template: CertificateTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
  onCreateNew: () => void;
}

export function TemplateGallery({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSetDefault,
  onCreateNew
}: TemplateGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      await onDeleteTemplate(templateId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates de Certificados</h2>
          <p className="text-muted-foreground">
            Selecciona un template o crea uno nuevo
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate === template.id 
                ? "ring-2 ring-primary shadow-lg" 
                : ""
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex gap-1">
                  {template.is_default && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      Predeterminado
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTemplate(template);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="w-64 h-48 overflow-hidden rounded border bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Vista previa del template</div>
                    <div className="text-xs text-muted-foreground mt-1">{template.name}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Creado: {new Date(template.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (template.is_default) {
                        // If it's already default, we could unset it or do nothing
                        // For now, let's just not allow unsetting
                      } else {
                        onSetDefault(template.id);
                      }
                    }}
                  >
                    {template.is_default ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === template.id || template.is_default}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                  >
                    {deletingId === template.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay templates disponibles</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer template de certificado para comenzar
            </p>
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}