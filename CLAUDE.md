# Contexto del Proyecto: EDAN Academy Hub

Este documento proporciona una visión general técnica y funcional del proyecto EDAN Academy Hub para facilitar el desarrollo y mantenimiento.

## 🚀 Descripción de la Aplicación
**EDAN Academy Hub** es una plataforma de gestión de aprendizaje (LMS) integral diseñada para conectar a estudiantes, instructores y administradores. Permite la creación y consumo de cursos, gestión de inscripciones, sistemas de evaluación (exámenes y micro-quizzes), gamificación, y una comunidad activa mediante foros integrados.

## 🛠️ Stack Tecnológico
- **Frontend**: 
  - React 18 + Vite (TypeScript)
  - **Estilizado**: Tailwind CSS + Shadcn UI (Radix UI)
  - **Animaciones**: Framer Motion
  - **Gráficos**: Recharts
  - **Navegación**: React Router DOM v6
- **Backend (BaaS)**: 
  - **Supabase**: Auth, PostgreSQL, Storage, Edge Functions
- **Gestión de Estado**: 
  - Tanstack Query (React Query) v5
- **Formularios**: 
  - React Hook Form + Zod (validación)
- **Editor de Texto**: 
  - Tiptap (Rich Text Editor)
- **Iconografía**: 
  - Lucide React

## 📊 Esquema de Base de Datos (Supabase)

### Autenticación y Perfiles
- `profiles`: Datos de usuario (nombre, país, membresía, avatar).
- `user_roles`: Roles asignados (`admin`, `instructor`, `estudiante`).

### Estructura de Cursos
- `courses`: Información principal del curso (título, precio, nivel, foro habilitado).
- `modules`: Módulos que agrupan lecciones.
- `lessons`: Contenido individual (texto, video, duración).
- `course_instructors`: Relación de instructores adicionales por curso.
- `module_materials`: Archivos adjuntos para los módulos.

### Progreso y Evaluaciones
- `enrollments`: Inscripciones de usuarios en cursos.
- `lesson_progress`: Seguimiento de lecciones completadas.
- `exams`: Exámenes del curso o módulo.
- `questions` & `answer_options`: Estructura de los exámenes.
- `exam_attempts`: Resultados e intentos de exámenes por usuario.
- `micro_quizzes`: Evaluaciones rápidas dentro de las lecciones.
- `assignments` & `assignment_submissions`: Tareas prácticas y entregas.

### Comunidad y Gamificación
- `forum_posts`: Hilos y respuestas de la comunidad (asociados a cursos/lecciones).
- `forum_post_likes`: "Me gusta" en publicaciones del foro.
- `lesson_comments`: Comentarios directos en las lecciones.
- `user_points`: Puntos totales y nivel actual del usuario.
- `points_history`: Historial de obtención de puntos.
- `badges` & `user_badges`: Sistema de insignias y logros.

### Pagos y Suscripciones
- `payment_plans`: Planes de membresía disponibles.
- `subscriptions`: Suscripciones activas de los usuarios.
- `payments`: Registro de transacciones.
- `scholarships` & `scholarship_recipients`: Gestión de becas y beneficiarios.
- `enrollment_requests`: Solicitudes de inscripción manual (vía transferencia).

### Otros
- `notifications`: Sistema de alertas internas.
- `email_settings` & `email_logs`: Configuración y trazabilidad de correos (Resend).

## 🗺️ Rutas de Navegación

### Públicas
- `/`: Landing page / Inicio.
- `/auth`: Login y Registro.

### Privadas (`/dashboard/*`)
- **Estudiante**:
  - `/my-courses`: Mis cursos inscritos.
  - `/catalog`: Catálogo global de cursos.
  - `/course/:id`: Visor de curso (Lecciones + Comunidad).
  - `/achievements`: Logros e insignias.
  - `/leaderboard`: Ranking de usuarios.
  - `/certificates`: Mis certificados obtenidos.
  - `/renew`: Renovación de membresía.
  - `/exam/:id`: Interfaz de examen.
- **Instructor**:
  - `/instructor-courses`: Gestión de sus cursos.
  - `/instructor-students`: Listado de sus alumnos.
  - `/instructor-exams`: Banco de exámenes.
  - `/course-editor/:id`: Editor integral de curso.
  - `/exam-editor/:id`: Editor de exámenes.
- **Administrador**:
  - `/admin-users`: Gestión de usuarios y roles.
  - `/admin-courses`: Control global de cursos.
  - `/admin-analytics`: Métricas avanzadas.
  - `/admin-payments`: Gestión de pagos y facturación.
  - `/admin-settings`: Configuración del sistema.

## ✅ Estado del Proyecto

### Completado
- Autenticación completa con roles.
- Flujo de inscripción (gratuito, pago y VIP por jerarquía de niveles).
- Editor de cursos con módulos, lecciones y materiales.
- Sistema de foros integrado en la vista del alumno y configurable en el editor.
- Visualización de lecciones con soporte para video y Micro-Quizzes.
- Sistema de gamificación básico (puntos por participación y visualización).
- Backend de emails integrado (Resend).

### Pendiente / Próximos pasos
- [ ] Moderación avanzada en foros (Cola de aprobación).
- [ ] Generación dinámica de PDFs para certificados (ahora es web).
- [ ] Videollamadas integradas en vivo (estructura de bases lista).
- [ ] Aplicación móvil (PWA o nativa).

## 💡 Decisiones Técnicas Importantes
1. **Acceso VIP**: Se utiliza una jerarquía de niveles (`Básico` < `Intermedio` < `Avanzado` < `Experto`). Un plan de nivel superior da acceso automático a todos los cursos de niveles inferiores.
2. **Foros**: Se decidió integrar el foro como una pestaña raíz en `CourseView` para fomentar la cohesión de la comunidad de cada curso, en lugar de esconderlo por lecciones.
3. **Optimización de Imágenes**: Se ha implementado un sistema de compresión WebP en el cliente antes de subir archivos a Supabase para ahorrar ancho de banda y almacenamiento.
4. **Roles**: Los administradores tienen acceso a todas las herramientas de instructor por herencia lógica en las rutas protegidas.
