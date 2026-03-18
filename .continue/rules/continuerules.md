## Bitácora del proyecto

Existe un archivo llamado BITACORA.md en la raíz del proyecto.

### Reglas obligatorias para el agente:

1. ANTES de hacer cualquier cambio, lee BITACORA.md para entender 
   el estado actual del proyecto.

2. DESPUÉS de cada cambio exitoso, actualiza BITACORA.md agregando 
   una entrada con este formato:

   ### [FECHA] - [DESCRIPCIÓN CORTA]
   - **Qué se hizo:** descripción detallada
   - **Archivos modificados:** lista de archivos
   - **Tablas afectadas:** si hubo cambios en BD
   - **Estado:** ✅ Completado / ⚠️ Parcial / ❌ Problema
   - **Pendiente:** qué falta si quedó incompleto

3. Si un cambio falla o queda incompleto, documéntalo igual 
   con estado ⚠️ o ❌ para que el próximo agente sepa qué pasó.

4. NUNCA asumas el estado del proyecto sin leer BITACORA.md primero.

5. Si encuentras inconsistencias entre el código y BITACORA.md, 
   reporta la diferencia antes de hacer cualquier cambio.

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

## Reglas de eficiencia para el agente

1. NUNCA repitas código que no cambias — solo muestra las líneas modificadas
2. Antes de escribir código, describe en 2 líneas qué vas a hacer
3. Para cambios pequeños edita solo el archivo afectado — no releas todo el proyecto
4. Usa @codebase solo cuando sea necesario entender contexto amplio
5. Para cambios en BD consulta primero el MCP antes de asumir la estructura
6. Si una tarea tiene más de 3 archivos a modificar, pide confirmación antes
7. Mantén respuestas concisas — código limpio sin explicaciones innecesarias
8. Siempre actualiza BITACORA.md después de cada cambio exitoso
9. Si el modelo cambia a DeepSeek por límite de quota, continúa sin interrumpir el flujo
10. maxTokens de respuesta: 2000 — si necesitas más divídelo en pasos