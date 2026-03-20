import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PDFCertificateEditor from '@/components/certificates/PDFCertificateEditor';
import { TemplateGallery } from '@/components/certificates/TemplateGallery';
import { useCertificateTemplates, useSetDefaultTemplate } from '@/hooks/useCertificateTemplates';
import { CertificateTemplate } from '@/hooks/useCertificateTemplates';
import { useDeleteCertificateTemplate } from '@/hooks/useCertificateTemplates';

const PDFCertificatesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(id);
  const { data: templates = [], refetch } = useCertificateTemplates();
  const { mutate: setDefaultTemplate } = useSetDefaultTemplate();
  const { mutate: deleteTemplate } = useDeleteCertificateTemplate();

  const handleSave = () => {
    refetch();
    setEditingTemplateId(undefined);
    navigate('/admin/certificates');
  };

  const handleEditTemplate = (template: CertificateTemplate) => {
    setEditingTemplateId(template.id);
    navigate(`/admin/certificates/edit/${template.id}`);
  };

  const handleCreateNew = () => {
    setEditingTemplateId(undefined);
    navigate('/admin/certificates/new');
  };

  const handleDeleteTemplate = async (templateId: string) => {
    deleteTemplate(templateId);
  };

  const handleSetDefault = async (templateId: string) => {
    setDefaultTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Certificados</h1>
        <Button onClick={handleCreateNew}>
          Crear Nueva Plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTemplateId ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PDFCertificateEditor 
                templateId={editingTemplateId} 
                onSave={handleSave} 
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Plantillas Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateGallery 
                templates={templates}
                selectedTemplate={editingTemplateId || null}
                onSelectTemplate={() => {}}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onSetDefault={handleSetDefault}
                onCreateNew={handleCreateNew}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDFCertificatesManagement;
