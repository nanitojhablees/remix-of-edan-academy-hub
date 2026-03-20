// Script para actualizar los templates de certificados al formato PDFMe
// Usando la service role key del archivo .env

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno desde .env
config();

// Obtener variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan las variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Presente' : 'Ausente');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Presente' : 'Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

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