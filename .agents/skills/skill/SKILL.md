# EDAN Academy Hub - Estado Actual del Proyecto

## Stack Tecnológico

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animaciones**: Framer Motion
- **Editor de texto**: Tiptap
- **Gráficos**: Recharts
- **Ruteo**: React Router 6
- **Gestión de estado**: TanStack Query v5, Zustand

### Backend
- **Base de datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth (Magic Links + OAuth)
- **Funciones**: Supabase Edge Functions (Deno)
- **Seguridad**: Row Level Security (RLS) en 35+ tablas
- **ID del Proyecto**: qntnclsoudflabjrvyer

### Dependencias Críticas
- `@supabase/supabase-js`: v2.89.0
- `react-router-dom`: v6.30.1
- `@tanstack/react-query`: v5.83.0
- `zod`: v3.25.76
- `@pdfme/common`, `@pdfme/generator`, `@pdfme/schemas`, `@pdfme/ui`: v5.5.9
- `framer-motion`: v12.25.0
- `lucide-react`: v0.462.0

## Arquitectura del Sistema

### Roles de Usuario
1. **Estudiante** - Acceso a cursos, exámenes, certificados
2. **Instructor** - Gestión de cursos, estudiantes, exámenes
3. **Administrador** - Gestión completa del sistema

### Niveles de Membresía
- **Básico** → **Intermedio** → **Avanzado** → **Experto**
- Acceso acumulativo según nivel de membresía

## Estructura de Rutas

### Público
- `/` - Página principal (Landing)
- `/auth` - Autenticación
- `/payment` - Proceso de pago (requiere autenticación)

### Dashboard (requiere autenticación)
- `/dashboard` - Página principal del dashboard
- `/dashboard/profile` - Perfil del usuario
- `/dashboard/my-courses` - Cursos del estudiante
- `/dashboard/catalog` - Catálogo de cursos disponibles
- `/dashboard/course/:courseId` - Vista de curso
- `/dashboard/course/:courseId/live/:sessionId` - Sesiones en vivo
- `/dashboard/achievements` - Logros y recompensas
- `/dashboard/leaderboard` - Clasificación de usuarios
- `/dashboard/certificates` - Certificados obtenidos
- `/dashboard/payment-history` - Historial de pagos
- `/dashboard/renew` - Renovación de membresía
- `/dashboard/exam/:examId` - Vista de examen

### Instructor
- `/dashboard/instructor-courses` - Gestión de cursos del instructor
- `/dashboard/instructor-students` - Estudiantes inscritos
- `/dashboard/instructor-exams` - Exámenes creados
- `/dashboard/instructor-assignments` - Asignaciones
- `/dashboard/course-editor/:courseId` - Editor de cursos
- `/dashboard/exam-editor/:examId` - Editor de exámenes

### Administrador
- `/dashboard/admin-users` - Gestión de usuarios
- `/dashboard/admin-courses` - Gestión de todos los cursos
- `/dashboard/admin-settings` - Configuración del sistema
- `/dashboard/admin-analytics` - Analítica avanzada
- `/dashboard/admin-exams` - Gestión de exámenes
- `/dashboard/admin-certificates` - Gestión de certificados PDF
- `/dashboard/admin-badges` - Gestión de insignias
- `/dashboard/admin-enrollments` - Gestión de inscripciones
- `/dashboard/admin-enrollment-requests` - Solicitudes de inscripción
- `/dashboard/admin-notifications` - Gestión de notificaciones
- `/dashboard/admin-payments` - Gestión de pagos
- `/dashboard/admin-scholarships` - Gestión de becas
- `/dashboard/admin-forums` - Moderación de foros

## Componentes Principales

### Componentes de UI (shadcn/ui)
- Todos los componentes estándar de shadcn/ui
- Botones, formularios, diálogos, tooltips, menús, etc.

### Componentes Funcionales
- `ProtectedRoute` - Control de acceso basado en roles y membresía
- `PageTransition` - Transiciones suaves entre páginas
- `AppSidebar` - Barra lateral del dashboard con navegación

### Componentes por Rol

#### Estudiante
- `CourseView` - Vista detallada de un curso
- `ExamView` - Vista de examen
- `Certificates` - Gestión y visualización de certificados
- `Achievements` - Logros y progreso
- `CourseLiveSessions` - Participación en sesiones en vivo
- `CourseForumView` - Foro del curso

#### Instructor
- `InstructorCourseEditor` - Editor avanzado de cursos
- `ForumModerationPanel` - Panel de moderación de foros
- `CourseCompletionBar` - Indicador de progreso de estudiantes
- `CourseLaunchChecklist` - Lista de verificación para publicar cursos
- `CourseObjectivesEditor` - Editor de objetivos del curso
- `InstructorLiveSessions` - Control de sesiones en vivo
- `InstructorLiveStreamControl` - Controles de transmisión

#### Administrador
- `AdminCourseApprovalPanel` - Panel de aprobación de cursos
- `UserCreationDialog` - Diálogo para crear usuarios
- `AdvancedAnalytics` - Panel de análisis avanzado
- `EmailSettingsCard` - Configuración de correos electrónicos
- `ScholarshipForm` - Formulario de becas

### Otros Componentes Importantes
- `RichTextEditor` - Editor de texto enriquecido (Tiptap)
- `FileUploader` - Carga de archivos
- `ImageUploader` - Carga de imágenes
- `ContentPlayer` - Reproductor de contenido multimedia
- `LessonDiscussion` - Discusión de lecciones
- `LessonAssignments` - Asignaciones de lecciones
- `PDFCertificateEditor` - Editor visual de certificados PDF
- `TemplateGallery` - Galería de plantillas

## Funcionalidades Completadas

### Autenticación y Autorización
- Sistema de login/logout con Supabase Auth
- Soporte para Magic Links y OAuth
- Control de roles (estudiante, instructor, admin)
- Verificación de membresía activa
- Protección de rutas según rol y membresía

### Gestión de Cursos
- Creación y edición de cursos (instructores)
- Sistema de revisión y aprobación de cursos (administradores)
- Catálogo público de cursos
- Inscripción a cursos
- Seguimiento de progreso del estudiante
- Publicación/privacidad de cursos

### Contenido Educativo
- Módulos y lecciones estructurados
- Tipos de contenido multimedia (videos, documentos, etc.)
- Evaluaciones y micro-quizzes
- Material de apoyo y recursos descargables

### Exámenes y Evaluaciones
- Creación de exámenes por instructores
- Sistema de calificación automática
- Vista de examen para estudiantes
- Gestión de exámenes por administradores

### Certificados
- Generación automática de certificados
- Editor visual de certificados PDF (PDFMe)
- Plantillas personalizables
- Vista previa y descarga de certificados
- Gestión de certificados por administradores

### Comunicación y Colaboración
- Foros de discusión por curso
- Moderación de foros
- Chat en sesiones en vivo
- Sistema de notificaciones

### Sesiones en Vivo
- Transmisión en vivo con WebSockets
- Control de instructor para la transmisión
- Participación de estudiantes
- Grabación y reproducción de sesiones

### Gamificación
- Sistema de logros y recompensas
- Tabla de clasificación (leaderboard)
- Niveles de usuario
- Progreso y estadísticas

### Pagos y Membresías
- Proceso de pago integrado
- Gestión de membresías
- Historial de pagos
- Renovación automática
- Sistema de becas

### Administración
- Gestión de usuarios
- Análisis y métricas avanzadas
- Configuración del sistema
- Gestión de contenido
- Moderación de foros
- Control de calidad de cursos

## Funcionalidades Pendientes o Incompletas
- No se han identificado funcionalidades pendientes específicas en la bitácora actual
- El sistema está en constante evolución con nuevas características añadidas regularmente

## Decisiones Técnicas Importantes

### Code Splitting y Performance
- Se implementó una estrategia de code splitting con lazy loading
- Se eliminó temporalmente debido a problemas de carga de páginas
- Se volvió a importaciones directas para garantizar la estabilidad
- Se mantienen herramientas de análisis de bundle

### Certificados PDF
- Cambio de implementación personalizada a PDFMe
- Mejora en la edición visual de certificados
- Soporte para plantillas complejas
- Integración con Supabase Edge Functions

### WebSocket y Sesiones en Vivo
- Implementación con Supabase Realtime
- Soporte para chat en tiempo real
- Control de transmisión para instructores
- Integración con el sistema de autenticación

### Gestión de Errores y Carga
- Implementación de estrategias de reintento con backoff exponencial
- Manejo de errores en lazy loading
- Mensajes de carga y estados de espera
- Prefetching estratégico de componentes críticos

### Seguridad
- Implementación de RLS en todas las tablas de Supabase
- Validación de roles en rutas protegidas
- Control de acceso basado en membresía
- Protección contra accesos no autorizados

### Arquitectura de Datos
- Diseño de base de datos relacional con 35+ tablas
- Relaciones entre usuarios, cursos, exámenes, certificados
- Historial de pagos y membresías
- Sistema de notificaciones y logs

## Scripts y Herramientas
- `scripts/analyze-bundle.js` - Análisis del tamaño del bundle
- `scripts/test-certificate-templates.js` - Pruebas de plantillas de certificados
- Varios scripts para actualización de plantillas de certificados
- Scripts de desarrollo y mantenimiento

## Documentación
- `docs/CODE_SPLITTING.md` - Documentación sobre estrategia de code splitting
- `docs/CERTIFICATE_PDFME.md` - Documentación sobre el sistema de certificados PDF
- `docs/CERTIFICATE_EDITOR.md` - Documentación sobre el editor de certificados