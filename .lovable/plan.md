

## Plan: Persistir sesión y adaptar Header según estado de autenticación

### Problemas identificados

1. **Header estático**: El componente `Header` no usa `useAuth()`, así que siempre muestra "Iniciar Sesión" y "Registrarse", incluso cuando el usuario ya está logueado.
2. **Sesión no persistida**: El auth hook ya usa `getSession()` + `onAuthStateChange`, que debería persistir la sesión. El problema real es que la página `/` (landing) no verifica si hay sesión activa — el usuario logueado ve la landing con botones de login en vez de ser redirigido o ver un botón "Ir al Dashboard".

### Cambios a implementar

#### 1. Actualizar `Header.tsx` — mostrar estado según sesión
- Importar `useAuth` del hook existente
- Si el usuario está autenticado: mostrar botón **"Ir al Dashboard"** en lugar de "Iniciar Sesión" / "Registrarse"
- Si no está autenticado: mantener los botones actuales
- Aplicar lo mismo en el menú móvil

#### 2. Verificar persistencia de sesión
- El hook `useAuth` ya maneja `getSession()` + `onAuthStateChange` correctamente, así que la sesión se restaura automáticamente al recargar. No se requieren cambios en el hook.
- El `AuthProvider` envuelve toda la app en `App.tsx`, por lo que el `Header` dentro de `Index.tsx` puede acceder a `useAuth()` sin problemas.

### Archivos a modificar
- `src/components/landing/Header.tsx` — agregar lógica condicional basada en `useAuth()`

