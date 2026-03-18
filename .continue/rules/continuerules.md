# ContinueRules - EDAN Academy Hub (Actualizado)

## 🔍 Visión General Ampliada
Plataforma LMS con:
- **3 roles jerárquicos**: Estudi< Instructor < Admin
- **4 niveles de membresía**: Básico, Intermedio, Avanzado, Experto (acceso acumulativo)
- **Sistemas paralelos**:
  - Educación estructurada (cursos → módulos → lecciones)
  - Comunidad activa (foros por curso)
  - Gamificación (puntos, badges, leaderboard)

## 🛠️ Stack Tecnológico (Detallado)
### Frontend
- **Core**: React 18 + Vite + TypeScript
- **UI/UX**:
  - Tailwind CSS + shadcn/ui (Radix primitives)
  - Framer Motion (transiciones)
  - Tiptap (editor rich-text)
  - Recharts (gráficos)
- **Gestión de Estado**:
  - TanStack Query v5 (data fetching)
  - Zustand (estado global de UI)
- **Routing**: React Router 6 (layout nesting)

### Backend (Supabase)
- **PostgreSQL**: 35+ tablas con RLS
- **Autenticación**: Magic Links + OAuth
- **Edge Functions**: 12+ (TypeScript/Deno)
- **Storage**: Optimizado para WebP

## 🗃️ Esquema de DB (Puntos Clave)
- **Relaciones críticas**:
  - `courses` ↔ `enrollments` ↔ `profiles` (matrículas)
  - `lessons` ↔ `lesson_progress` (tracking)
  - `forum_posts` ↔ `courses` (comunidad)
- **Índices importantes**:
  - `user_roles.role` (control de acceso)
  - `courses.level` (filtrado VIP)

## 🚪 Rutas (Estructura Profunda)
### Flujos Clave
1. **Estudiante**:
   - `/course/:id` → `ContentPlayer` + `LessonDiscussion`
   - `/exam/:id` → Sistema de intentos con `exam_attempts`
2. **Instructor**:
   - `/course-editor/:id` → Editor multimodal (RichText + FileUploader)
3. **Admin**:
   - `/admin-analytics` → Dashboard con Recharts

## ✅ Estado Actual (Detallado)
### Funcionalidades Completas
✔️ **Core LMS**:
- Creación de cursos con 3 tipos de contenido (video/texto/quiz)
- Progreso automático (xAPI-like)
- Certificados web (no PDF aún)

✔️ **Gamificación**:
- Badges por completar cursos
- Puntos por actividad en foros
- Leaderboard con filtros

✔️ **Backend**:
- 12 Edge Functions operativas
- Sistema de emails transaccionales

### 🔄 Pendientes Prioritarios
1. **Live Sessions**:
   - Base de datos preparada (`live_sessions`)
   - Falta implementar WebSocket

2. **Moderación**:
   - `ForumModerationPanel` creado (sin lógica completa)

3. **Optimizaciones**:
   - Code-splitting en rutas pesadas
   - Cache estratégico con React Query

## 🧠 Decisiones Técnicas Clave
1. **Arquitectura de Features**:
   - Cada feature mayor tiene:
     - Ruta dedicada
     - Custom hooks
     - Types específicos

2. **Seguridad**:
   - RLS en TODAS las tablas
   - Validación Zod en todos los forms
   - ProtectedRoute con 3 niveles

3. **Performance**:
   - Pre-render de rutas públicas
   - Lazy-load de componentes pesados

## 📌 Recomendaciones Técnicas
1. **Testing**:
   - Añadir Jest/Vitest para:
     - Custom hooks
     - Lógica de negocios

2. **Documentación**:
   - Swagger para APIs de Edge Functions
   - Storybook para componentes UI

3. **Roadmap**:
   ```mermaid
   timeline
       title Prioridades Técnicas
       section Corto Plazo
         PDF Certificados : 2 semanas
         WebSocket : 3 semanas
       section Medio Plazo
         PWA : 1 mes
         Modo Offline : 6 semanas
   ```

## 🔗 Dependencias Críticas
- `@supabase/supabase-js`: v3.4.0
- `react-router-dom`: v6.22.1
- `zod`: v3.22.4