---
name: Contexto del Proyecto
alwaysApply: true
---

## 🔍 Visión General
Plataforma LMS con:
- **3 roles jerárquicos**: Estudiante < Instructor < Admin
- **4 niveles de membresía**: Básico, Intermedio, Avanzado, Experto
- **Sistemas paralelos**:
  - Educación estructurada (cursos → módulos → lecciones)
  - Comunidad activa (foros por curso)
  - Gamificación (puntos, badges, leaderboard)

## 🛠️ Stack Tecnológico
### Frontend
- **Core**: React 18 + Vite + TypeScript
- **UI/UX**: Tailwind CSS + shadcn/ui + Framer Motion + Tiptap + Recharts
- **Estado**: TanStack Query v5 + Zustand
- **Routing**: React Router 6

### Backend (Supabase)
- **PostgreSQL**: 35+ tablas con RLS
- **Autenticación**: Magic Links + OAuth
- **Edge Functions**: 12+ (TypeScript/Deno)
- **Storage**: Optimizado para WebP

## 🗃️ Esquema de DB
- `courses` ↔ `enrollments` ↔ `profiles`
- `lessons` ↔ `lesson_progress`
- `forum_posts` ↔ `courses`
- `user_roles.role` (control de acceso)
- `courses.level` (filtrado VIP)

## 🚪 Rutas Principales
1. **Estudiante**: `/course/:id` → `/exam/:id`
2. **Instructor**: `/course-editor/:id`
3. **Admin**: `/admin-analytics`

## ✅ Estado Actual
### Completado
- Core LMS: cursos, progreso, certificados web
- Gamificación: badges, puntos, leaderboard
- Backend: 12 Edge Functions + emails transaccionales

### 🔄 Pendientes Prioritarios
1. Live Sessions — BD lista, falta WebSocket
2. Moderación de foros — ForumModerationPanel sin lógica completa
3. Code-splitting en rutas pesadas
4. Certificados en PDF

## 🧠 Decisiones Técnicas
- RLS en TODAS las tablas
- Validación Zod en todos los forms
- ProtectedRoute con 3 niveles
- Lazy-load de componentes pesados

## 🔗 Dependencias Críticas
- `@supabase/supabase-js`: v3.4.0
- `react-router-dom`: v6.22.1
- `zod`: v3.22.4

## 📅 Roadmap
- Corto plazo: PDF Certificados (2 sem), WebSocket (3 sem)
- Medio plazo: PWA (1 mes), Modo Offline (6 sem)