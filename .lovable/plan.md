

## Plan: Panel Detallado de Usuario para Administrador

### Objetivo
Crear un panel detallado al seleccionar un usuario en la gestión de administración que muestre toda su información y permita editar datos y asignar cursos/insignias manualmente.

### Cambios en Base de Datos

#### 1. Agregar campos a la tabla `profiles`

```sql
ALTER TABLE profiles
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_ip_address TEXT;
```

Estos campos almacenarán la fecha de última conexión y la dirección IP del usuario.

#### 2. Actualizar RLS policies para enrollments

Agregar política que permita a admins insertar y actualizar enrollments:

```sql
-- Admins can manage all enrollments
CREATE POLICY "Admins can manage all enrollments"
  ON enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

#### 3. Actualizar RLS policies para user_badges

Agregar política que permita a admins insertar insignias manualmente:

```sql
-- Admins can manage all badges
CREATE POLICY "Admins can manage all user badges"
  ON user_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| Migracion SQL | Crear | Agregar campos last_login, last_ip_address y politicas RLS |
| `src/hooks/useAuth.tsx` | Modificar | Trackear login con IP y fecha |
| `src/components/admin/UserDetailPanel.tsx` | Crear | Panel lateral/modal con toda la informacion del usuario |
| `src/pages/admin/UsersManagement.tsx` | Modificar | Integrar panel de detalle y nuevas funcionalidades |
| `src/hooks/useAdminUsers.tsx` | Crear | Hook con funciones para gestionar usuarios, asignar cursos e insignias |

### Estructura del Panel de Usuario

```
+-----------------------------------------------+
|  [<] Usuario Detallado                        |
+-----------------------------------------------+
| [Avatar] Juan Perez                           |
| Estado: Activo    Rol: Estudiante             |
+-----------------------------------------------+
| INFORMACION PERSONAL                          |
| ----------------------------------------      |
| Nombre: Juan Perez              [Editar]      |
| Pais: Colombia                                |
| Profesion: Ingeniero                          |
| Telefono: +57 300 123 4567                    |
+-----------------------------------------------+
| ACTIVIDAD                                     |
| ----------------------------------------      |
| Ultima conexion: 5 Feb 2026, 14:30            |
| Direccion IP: 192.168.1.100                   |
| Registrado: 15 Ene 2026                       |
+-----------------------------------------------+
| CURSOS INSCRITOS                    [+ Nuevo] |
| ----------------------------------------      |
| - Operaciones EDAN (Operaciones)  0%  [X]     |
| - Tecnologias EDAN (Tecnologias)  25% [X]     |
+-----------------------------------------------+
| INSIGNIAS OBTENIDAS                 [+ Nueva] |
| ----------------------------------------      |
| - Primer Paso (10 pts) - 29 Dic 2025          |
| - Explorador (25 pts) - 15 Ene 2026           |
+-----------------------------------------------+
| PUNTOS Y NIVEL                                |
| ----------------------------------------      |
| Nivel: 3 - Estudiante                         |
| Puntos: 450 / 600                             |
| [==========>----------] 75%                   |
+-----------------------------------------------+
|          [Guardar Cambios]                    |
+-----------------------------------------------+
```

### Funcionalidades del Panel

#### Tab 1: Informacion General
- Nombre completo (editable)
- Pais, profesion, telefono (editables)
- Estado de membresia (editable)
- Rol del usuario (editable)

#### Tab 2: Actividad
- Fecha de ultima conexion
- Direccion IP de ultima conexion
- Fecha de registro
- Historial de eventos recientes (de user_analytics)

#### Tab 3: Cursos
- Lista de cursos inscritos con:
  - Titulo del curso
  - Nivel del curso
  - Porcentaje de progreso
  - Fecha de inscripcion
  - Boton para eliminar inscripcion
- Boton para asignar nuevo curso (dropdown con cursos disponibles)

#### Tab 4: Gamificacion
- Nivel actual y puntos
- Barra de progreso hacia siguiente nivel
- Lista de insignias obtenidas
- Boton para asignar insignia manualmente

### Flujo de Tracking de Conexion

```
Usuario inicia sesion
        |
        v
Hook useAuth detecta login exitoso
        |
        v
Obtiene IP del cliente (via API o header)
        |
        v
Actualiza profiles con last_login y last_ip_address
        |
        v
Datos disponibles para el admin
```

### Diagrama de Componentes

```text
UsersManagement.tsx
    |
    +-- UserDetailPanel.tsx (Sheet lateral)
    |       |
    |       +-- Tabs
    |       |     +-- Tab: Informacion (formulario editable)
    |       |     +-- Tab: Actividad (solo lectura)
    |       |     +-- Tab: Cursos (lista + asignar)
    |       |     +-- Tab: Gamificacion (nivel + insignias)
    |       |
    |       +-- AssignCourseDialog.tsx
    |       +-- AssignBadgeDialog.tsx
    |
    +-- useAdminUsers.tsx (hook)
            +-- getUserDetails()
            +-- updateUserProfile()
            +-- assignCourse()
            +-- removeCourse()
            +-- assignBadge()
            +-- removeBadge()
```

### Detalles Tecnicos

#### Tracking de IP
Para obtener la IP del usuario, se usara una API externa gratuita como `api.ipify.org` al momento del login, ya que desde el frontend no se puede obtener la IP real del cliente directamente.

```typescript
// En useAuth.tsx al detectar login
const response = await fetch('https://api.ipify.org?format=json');
const { ip } = await response.json();
await supabase.from('profiles').update({
  last_login: new Date().toISOString(),
  last_ip_address: ip
}).eq('user_id', user.id);
```

#### Asignacion de Cursos
```typescript
// Insertar enrollment como admin
await supabase.from('enrollments').insert({
  user_id: selectedUser.user_id,
  course_id: selectedCourse,
  progress_percent: 0
});
```

#### Asignacion de Insignias
```typescript
// Insertar insignia manualmente
await supabase.from('user_badges').insert({
  user_id: selectedUser.user_id,
  badge_id: selectedBadge
});

// Agregar puntos correspondientes
await supabase.rpc('add_user_points', {
  _user_id: selectedUser.user_id,
  _points: badge.points_value,
  _reason: 'Insignia asignada manualmente: ' + badge.name,
  _reference_type: 'badge',
  _reference_id: badge.id
});
```

### Beneficios
- Vision completa del usuario en un solo lugar
- Control total sobre inscripciones y gamificacion
- Tracking de actividad para monitoreo
- Capacidad de asignar recursos manualmente (util para promociones, casos especiales)

