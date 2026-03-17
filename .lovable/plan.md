
## Plan: Implementar Sistema de 4 Niveles de Acceso + Membresia Anual

### Resumen

Transformar el sistema actual (que requiere membresia para todo) en un sistema con 4 niveles de acceso diferenciados, mas la membresia anual como opcion principal para acceso completo.

---

### Estado Actual

- La tabla `courses` tiene un campo `level` (operaciones, tecnologias, decisiones, analisis) que es tematico, no de acceso
- `ProtectedRoute` con `requireActiveMembership` bloquea todo el dashboard si no hay membresia activa
- Ya existen planes de pago en la BD: Mensual $12, Por Nivel $29, Anual $99
- No existe concepto de cursos gratuitos ni acceso sin membresia

### Lo que se implementara

| Nivel | Descripcion | Requiere Cuenta | Requiere Pago |
|-------|-------------|-----------------|---------------|
| 1. Basico/Gratuito | Cursos marcados como "free" | No | No |
| 2. Medio | Cursos de nivel medio | Si (registro gratis) | No |
| 3. Especializado | Todos los cursos (membresia) | Si | Si ($99/ano o $12/mes) |
| 4. Curso Individual | Un curso especifico | Si | Si (precio individual) |

---

### Cambios en Base de Datos

#### Migracion SQL

```sql
-- Agregar nivel de acceso a cursos
ALTER TABLE courses ADD COLUMN access_level text NOT NULL DEFAULT 'premium';
-- Valores: 'free', 'medium', 'premium'

-- Agregar precio individual para compra de curso suelto
ALTER TABLE courses ADD COLUMN individual_price numeric DEFAULT NULL;

-- Crear tabla de compras individuales de cursos
CREATE TABLE course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'completed',
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all purchases" ON course_purchases 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their purchases" ON course_purchases 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their purchases" ON course_purchases 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Actualizar RLS de courses para permitir acceso publico a cursos gratuitos
-- (la politica existente ya permite SELECT si is_published = true, eso es suficiente)

-- Actualizar RLS de modules para cursos gratuitos (ya permite si curso published)
-- Actualizar RLS de lessons para cursos gratuitos (ya permite si curso published)
```

---

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/hooks/useCourseAccess.tsx` | Hook central de logica de acceso: verifica si un usuario puede ver un curso segun su nivel, membresia, o compras individuales |
| `src/components/course/CourseAccessGate.tsx` | Componente que envuelve contenido y muestra opciones de pago/registro si no tiene acceso |
| `src/components/course/PurchaseCourseDialog.tsx` | Modal para compra individual de un curso premium |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/ProtectedRoute.tsx` | Eliminar la logica de `requireActiveMembership` que bloquea todo el dashboard. En su lugar, el acceso se verificara a nivel de curso individual |
| `src/App.tsx` | Quitar `requireActiveMembership` del dashboard route; agregar ruta publica `/course/:courseId` para cursos gratuitos |
| `src/pages/dashboard/CourseCatalog.tsx` | Agregar badges de nivel de acceso (Gratis, Cuenta Gratuita, Premium), filtros por nivel, mostrar precio individual si aplica |
| `src/pages/dashboard/CourseView.tsx` | Integrar `useCourseAccess` para verificar acceso antes de mostrar contenido; mostrar `CourseAccessGate` si no tiene acceso |
| `src/pages/admin/CoursesManagement.tsx` | Agregar selector de `access_level` (free/medium/premium) y campo `individual_price` al crear/editar cursos |
| `src/pages/instructor/InstructorCourseEditor.tsx` | Agregar campos `access_level` e `individual_price` en la configuracion del curso |
| `src/hooks/useCourses.tsx` | Agregar `access_level` e `individual_price` a la interfaz `Course`; crear hook `usePublicCourses` para cursos sin auth |
| `src/pages/Payment.tsx` | Reemplazar pago fijo $99 por seleccion de planes desde la BD usando `useActivePaymentPlans` con la membresia anual destacada |
| `src/pages/dashboard/RenewMembership.tsx` | Integrar deteccion de beca activa para descuentos automaticos |

---

### Logica de Acceso (useCourseAccess)

```text
checkCourseAccess(course, user, membershipStatus, purchases):

  1. Si course.access_level === 'free' -> ACCESO (para todos)
  2. Si no hay usuario -> REQUIERE REGISTRO
  3. Si course.access_level === 'medium' -> ACCESO (solo cuenta)
  4. Si membershipStatus === 'active' -> ACCESO (membresia cubre todo)
  5. Si course.id esta en purchases -> ACCESO (compra individual)
  6. Sin acceso -> Mostrar opciones: membresia o compra individual
```

---

### Flujo del Dashboard sin Membresia

Actualmente si no tienes membresia, no puedes entrar al dashboard. Con el cambio:

1. Usuarios sin cuenta pueden ver cursos gratuitos (ruta publica)
2. Usuarios con cuenta pero sin membresia pueden entrar al dashboard
3. En el dashboard ven todos los cursos pero con indicadores de acceso
4. Al intentar abrir un curso premium sin membresia, ven opciones de pago
5. Pueden comprar membresia completa O un curso individual

---

### Cambios en Payment.tsx

Transformar de pago fijo $99 a seleccion de planes:
- Tarjeta destacada: Membresia Anual Completa ($99/ano) con badge "Mas Popular"
- Tarjetas secundarias: Membresia Mensual ($12/mes), Niveles individuales ($29)
- Reutilizar componente `PlanCard` existente
- Mantener flujo de pago simulado

---

### Cambios en Admin (CoursesManagement)

Al crear/editar un curso, el admin podra:
- Seleccionar `access_level`: Gratuito, Medio, Premium
- Definir `individual_price` (solo para premium): precio para compra individual
- Los cursos existentes quedaran como "premium" por defecto (no rompe nada)

---

### Secuencia de Implementacion

1. Migracion SQL: agregar columnas a courses, crear course_purchases
2. Actualizar interfaz Course y hooks (useCourses.tsx)
3. Crear useCourseAccess hook
4. Crear CourseAccessGate y PurchaseCourseDialog
5. Modificar ProtectedRoute y App.tsx (quitar bloqueo global de membresia)
6. Actualizar CourseCatalog con badges y filtros
7. Actualizar CourseView con verificacion de acceso
8. Actualizar Payment.tsx con seleccion de planes
9. Actualizar admin CoursesManagement con access_level
10. Actualizar InstructorCourseEditor con access_level
