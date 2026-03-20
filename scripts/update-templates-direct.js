// Script para actualizar los templates de certificados al formato PDFMe
// Usando el cliente de Supabase de la aplicación

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase desde el archivo .env
const supabaseUrl = "https://qntnclsoudflabjrvyer.supabase.co";
// Usar una service key válida para el proyecto
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudG5jbHNvdWRmbGFianJ2eWVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc4MjIzMCwiZXhwIjoyMDg5MzU4MjMwfQ.XJXZ2LwG6zZJQKwHqYfLJgG9d2xJQKwHqYfLJgG9d2x"; // Service Role Key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para convertir el formato antiguo al formato PDFMe
function convertToPDFMeFormat(oldTemplate) {
  // Si ya está en formato PDFMe, devolver tal cual
  if (oldTemplate.schemas) {
    return oldTemplate;
  }

  // Convertir del formato antiguo al formato PDFMe
  const pdfMeTemplate = {
    schemas: [
      [
        {
          name: 'name',
          type: 'text',
          position: { x: 20, y: 40 },
          width: 60,
          height: 10,
          fontSize: 12,
          alignment: 'center'
        },
        {
          name: 'course',
          type: 'text',
          position: { x: 20, y: 60 },
          width: 60,
          height: 10,
          fontSize: 10,
          alignment: 'center'
        },
        {
          name: 'date',
          type: 'text',
          position: { x: 20, y: 80 },
          width: 60,
          height: 8,
          fontSize: 8,
          alignment: 'center'
        },
        {
          name: 'grade',
          type: 'text',
          position: { x: 20, y: 90 },
          width: 60,
          height: 8,
          fontSize: 8,
          alignment: 'center'
        },
        {
          name: 'code',
          type: 'text',
          position: { x: 20, y: 100 },
          width: 60,
          height: 6,
          fontSize: 6,
          alignment: 'center'
        }
      ]
    ],
    basePdf: { 
      width: 842, 
      height: 595,
      padding: [40, 40, 40, 40]
    }
  };

  return pdfMeTemplate;
}

async function updateTemplates() {
  try {
    console.log('Iniciando actualización de templates...');
    
    // Obtener todos los templates
    const { data: templates, error } = await supabase
      .from('certificate_templates')
      .select('*');

    if (error) {
      console.error('Error al obtener los templates:', error);
      return;
    }

    console.log(`Encontrados ${templates.length} templates para actualizar`);

    // Actualizar cada template
    for (const template of templates) {
      console.log(`Actualizando template: ${template.name}`);
      const updatedTemplateData = convertToPDFMeFormat(template.template_data);
      
      const { error: updateError } = await supabase
        .from('certificate_templates')
        .update({ template_data: updatedTemplateData })
        .eq('id', template.id);

      if (updateError) {
        console.error(`Error al actualizar el template ${template.name}:`, updateError);
      } else {
        console.log(`Template ${template.name} actualizado correctamente`);
      }
    }

    console.log('Actualización de templates completada');
  } catch (error) {
    console.error('Error durante la actualización de templates:', error);
  }
}

// Ejecutar la actualización
updateTemplates();