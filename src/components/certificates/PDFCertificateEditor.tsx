import React, { useState, useEffect, useRef } from 'react';
import { Designer } from '@pdfme/ui';
import { Template } from '@pdfme/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useCertificateTemplate, 
  useCreateCertificateTemplate, 
  useUpdateCertificateTemplate 
} from '@/hooks/useCertificateTemplates';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CertificateTemplate } from '@/hooks/useCertificateTemplates';

interface PDFCertificateEditorProps {
  templateId?: string;
  onSave: () => void;
}

const PDFCertificateEditor: React.FC<PDFCertificateEditorProps> = ({ 
  templateId,
  onSave 
}) => {
  const designerRef = useRef<any>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const { data: templateData } = useCertificateTemplate(templateId || '');
  const { mutate: createTemplate } = useCreateCertificateTemplate();
  const { mutate: updateTemplate } = useUpdateCertificateTemplate();
  const { user } = useAuth();

  useEffect(() => {
    if (templateId && templateData) {
      setName(templateData.name);
      setDescription(templateData.description || '');
      setIsDefault(templateData.is_default || false);
      // Convert the stored template to pdfme format
      setTemplate(templateData.template_data as Template);
    } else if (!templateId) {
      // Create a default template compatible with PDFMe 5.5.10
      const defaultTemplate: Template = {
        schemas: [{
          name: {
            type: 'text',
            position: { x: 40, y: 150 },
            width: 130,
            height: 20,
            content: '{{name}}',
            fontName: 'Helvetica',
            fontSize: 16,
            align: 'center',
            verticalAlign: 'middle',
            lineHeight: 1.2,
            color: '#000000',
            opacity: 1,
            rotation: 0,
            readOnly: false,
            hidden: false,
            locked: false,
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 0,
            borderRadius: 0,
            padding: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            zIndex: 1,
            placeholder: 'Nombre del Estudiante'
          },
          course: {
            type: 'text',
            position: { x: 40, y: 180 },
            width: 130,
            height: 15,
            content: '{{course}}',
            fontName: 'Helvetica',
            fontSize: 14,
            align: 'center',
            verticalAlign: 'middle',
            lineHeight: 1.2,
            color: '#000000',
            opacity: 1,
            rotation: 0,
            readOnly: false,
            hidden: false,
            locked: false,
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 0,
            borderRadius: 0,
            padding: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            zIndex: 1,
            placeholder: 'Nombre del Curso'
          },
          date: {
            type: 'text',
            position: { x: 40, y: 210 },
            width: 130,
            height: 15,
            content: '{{date}}',
            fontName: 'Helvetica',
            fontSize: 12,
            align: 'center',
            verticalAlign: 'middle',
            lineHeight: 1.2,
            color: '#000000',
            opacity: 1,
            rotation: 0,
            readOnly: false,
            hidden: false,
            locked: false,
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 0,
            borderRadius: 0,
            padding: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            zIndex: 1,
            placeholder: 'Fecha de Emisión'
          },
          grade: {
            type: 'text',
            position: { x: 40, y: 230 },
            width: 130,
            height: 15,
            content: '{{grade}}',
            fontName: 'Helvetica',
            fontSize: 12,
            align: 'center',
            verticalAlign: 'middle',
            lineHeight: 1.2,
            color: '#000000',
            opacity: 1,
            rotation: 0,
            readOnly: false,
            hidden: false,
            locked: false,
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 0,
            borderRadius: 0,
            padding: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            zIndex: 1,
            placeholder: 'Calificación'
          },
          code: {
            type: 'text',
            position: { x: 40, y: 250 },
            width: 130,
            height: 15,
            content: '{{code}}',
            fontName: 'Helvetica',
            fontSize: 10,
            align: 'center',
            verticalAlign: 'middle',
            lineHeight: 1.2,
            color: '#666666',
            opacity: 1,
            rotation: 0,
            readOnly: false,
            hidden: false,
            locked: false,
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 0,
            borderRadius: 0,
            padding: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            zIndex: 1,
            placeholder: 'Código de Certificado'
          }
        }],
        basePdf: { 
          width: 210, 
          height: 297,
          padding: [0, 0, 0, 0]
        },
        fonts: {
          Helvetica: {
            fallback: true,
            data: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/web/fonts/Helvetica.ttf'
          }
        },
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          background: '#ffffff',
          text: '#000000'
        }
      } as any;
      setTemplate(defaultTemplate);
    }
  }, [templateId, templateData]);

  useEffect(() => {
    if (template && designerRef.current) {
      designerRef.current.updateTemplate(template);
    }
  }, [template]);

  const handleSave = async () => {
    if (!template || !user) return;

    try {
      const templateToSave: Omit<CertificateTemplate, "id" | "created_at" | "updated_at"> = {
        name,
        description,
        template_data: template,
        is_default: isDefault,
        created_by: user.id,
        colors_config: {},
        fonts_config: {},
        layout_config: {},
      };

      if (templateId) {
        updateTemplate({ id: templateId, ...templateToSave });
      } else {
        createTemplate(templateToSave);
      }

      toast({
        title: 'Éxito',
        description: 'Plantilla guardada correctamente',
      });
      onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la plantilla',
        variant: 'destructive',
      });
    }
  };

  const handleDesignerChange = (newTemplate: Template) => {
    setTemplate(newTemplate);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre de la Plantilla</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la plantilla"
          />
        </div>
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Label htmlFor="isDefault">Plantilla Predeterminada</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isDefault">Establecer como predeterminada</Label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción de la plantilla"
          rows={3}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div 
          id="designer" 
          style={{ height: '600px' }}
          ref={(el) => {
            if (el && !designerRef.current && template) {
              designerRef.current = new Designer({
                domContainer: el,
                template,
              });
              
              designerRef.current.onChangeTemplate = handleDesignerChange;
            }
          }}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={handleSave}>
          Guardar Plantilla
        </Button>
      </div>
    </div>
  );
};

export default PDFCertificateEditor;
