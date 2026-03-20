# Sistema de Certificados con PDFMe

## Descripción

Este documento describe la implementación del nuevo sistema de certificados utilizando la biblioteca PDFMe, que reemplaza la implementación anterior basada en generación manual de PDF.

## Componentes Principales

### 1. Editor de Certificados (PDFCertificateEditor)

Componente React que permite a los administradores diseñar visualmente plantillas de certificados usando la interfaz de PDFMe Designer.

**Características:**
- Editor visual WYSIWYG para crear plantillas de certificados
- Guardado de plantillas en la base de datos como JSON
- Configuración de propiedades de la plantilla (nombre, descripción, predeterminada)
- Integración con hooks de Supabase para almacenamiento

**Ubicación:** `src/components/certificates/PDFCertificateEditor.tsx`

### 2. Gestión de Certificados (PDFCertificatesManagement)

Página de administración que integra el editor y la galería de plantillas.

**Características:**
- Vista de galería de plantillas existentes
- Creación y edición de plantillas
- Establecimiento de plantilla predeterminada
- Eliminación de plantillas

**Ubicación:** `src/pages/admin/PDFCertificatesManagement.tsx`

### 3. Función Edge para Generación (generate-certificate-pdfme)

Función Deno desplegada en Supabase que genera certificados PDF usando PDFMe Generator.

**Características:**
- Generación de PDFs a partir de plantillas almacenadas
- Uso de datos del usuario y curso para personalización
- Verificación de certificados
- Descarga de certificados

**Ubicación:** `supabase/functions/generate-certificate-pdfme/index.ts`

## Flujo de Trabajo

1. **Creación/Edición de Plantilla:**
   - El administrador accede a `/admin-certificates`
   - Usa el PDFCertificateEditor para diseñar la plantilla
   - La plantilla se guarda en la tabla `certificate_templates` como JSON

2. **Generación de Certificado:**
   - Cuando un estudiante completa un curso, se llama a la función RPC `issue_certificate`
   - Al descargar el certificado, se invoca la función Edge `generate-certificate-pdfme`
   - La función recupera la plantilla predeterminada y los datos del certificado
   - PDFMe Generator crea el PDF usando la plantilla y los datos
   - El PDF se devuelve al cliente para descarga

## Estructura de Datos

### Plantilla de Certificado

```json
{
  "schemas": [
    {
      "field1": {
        "type": "text",
        "position": { "x": 10, "y": 10 },
        "width": 50,
        "height": 10
      }
    }
  ],
  "basePdf": { "width": 210, "height": 297 }
}
```

### Datos de Entrada para Generación

```json
[{
  "name": "Nombre del Estudiante",
  "course": "Nombre del Curso",
  "date": "Fecha de Emisión",
  "grade": "Calificación",
  "code": "Código de Verificación"
}]
```

## Migración desde la Versión Anterior

### Componentes Eliminados
- `CertificateTemplateEditor.tsx`
- `CertificateTemplatePreview.tsx`
- `CertificatesManagement.tsx` (versión anterior)

### Funciones Actualizadas
- `useDownloadCertificate` ahora usa `generate-certificate-pdfme`
- La tabla `certificate_templates` mantiene compatibilidad con nuevas estructuras

## Consideraciones Técnicas

### Dependencias
- `@pdfme/generator`: Para generación de PDFs
- `@pdfme/common`: Tipos y utilidades comunes
- `@pdfme/ui`: Componentes de interfaz de usuario
- `@pdfme/schemas`: Esquemas de datos

### Configuración de Supabase
La tabla `certificate_templates` ya existe y es compatible con la nueva estructura de PDFMe.

### Despliegue de Función Edge
La nueva función debe desplegarse en Supabase con el nombre `generate-certificate-pdfme`.

## Uso de la API

### Generar Certificado
```javascript
const { data, error } = await supabase.functions.invoke('generate-certificate-pdfme', {
  body: { 
    courseId: 'id-del-curso',
    userId: 'id-del-usuario',
    grade: 95.5,
    action: 'generate' 
  }
});
```

### Descargar Certificado
```javascript
const { data, error } = await supabase.functions.invoke('generate-certificate-pdfme', {
  body: { 
    certificateId: 'id-del-certificado',
    action: 'download' 
  }
});
```

### Verificar Certificado
```javascript
const { data, error } = await supabase.functions.invoke('generate-certificate-pdfme', {
  body: { 
    code: 'codigo-de-verificacion',
    action: 'verify' 
  }
});
```

## Personalización

### Agregar Nuevos Campos
1. Modificar el esquema en PDFCertificateEditor
2. Actualizar la función Edge para incluir los nuevos campos en `inputs`
3. Ajustar la base de datos si es necesario

### Cambiar Estilos Predeterminados
1. Modificar los valores predeterminados en PDFCertificateEditor
2. Actualizar las plantillas existentes si es necesario

## Solución de Problemas

### Problemas Comunes
1. **Errores de Tipos TypeScript**: Asegúrese de que las dependencias estén correctamente instaladas
2. **Errores de Generación de PDF**: Verifique que la plantilla tenga una estructura válida
3. **Problemas de Despliegue**: Confirme que la función Edge tenga los permisos necesarios

### Logs y Depuración
- Revise los logs de la función Edge en el panel de Supabase
- Use `console.log` en la función para depurar problemas
- Verifique la estructura de las plantillas en la base de datos