# Estándares de Código

## TypeScript
- **ALWAYS** usa TypeScript — NEVER uses JavaScript puro
- **ALWAYS** define interfaces para objetos
- **ALWAYS** valida con Zod en formularios

## Seguridad
- **ALWAYS** aplica RLS en tablas nuevas de Supabase
- **ALWAYS** usa ProtectedRoute para rutas privadas
- **NEVER** expongas service role key en el frontend

## Base de Datos
- **ALWAYS** consulta el MCP de Supabase antes de asumir estructura
- **ALWAYS** refleja cambios de BD en Supabase — NEVER solo localmente
- **NEVER** asumas nombres de tablas o columnas sin verificar

## Componentes
- **ALWAYS** usa componentes de shadcn/ui existentes antes de crear nuevos
- **ALWAYS** aplica lazy-load en componentes pesados
- Sigue el patrón de hooks existente en `/src/hooks/`