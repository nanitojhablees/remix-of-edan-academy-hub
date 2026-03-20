# Contexto del Proyecto

## Stack
- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion + Tiptap + Recharts
- Estado: TanStack Query v5 + Zustand
- Routing: React Router 6
- Backend: Supabase (PostgreSQL 35+ tablas RLS, 12+ Edge Functions Deno, Magic Links + OAuth)

## Arquitectura
- 3 roles: Estudiante < Instructor < Admin
- 4 membresías: Básico, Intermedio, Avanzado, Experto (acceso acumulativo)
- Supabase Project ID: qntnclsoudflabjrvyer

## Rutas
- Estudiante: `/course/:id` → `/exam/:id`
- Instructor: `/course-editor/:id`
- Admin: `/admin-analytics`

## Dependencias Críticas
- `@supabase/supabase-js`: v3.4.0
- `react-router-dom`: v6.22.1
- `zod`: v3.22.4