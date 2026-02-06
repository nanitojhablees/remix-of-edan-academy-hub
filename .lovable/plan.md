

## Plan: Sistema de Becas para la Plataforma EDAN

### Objetivo
Implementar un sistema completo de becas que permita a los administradores crear, gestionar y asignar becas a estudiantes, otorgándoles acceso parcial o total a la plataforma sin costo o con descuento.

---

### Modelo de Datos

#### Nueva Tabla: `scholarships` (Tipos de Becas)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Identificador único |
| name | text | Nombre de la beca (ej: "Beca Excelencia", "Beca Socioeconómica") |
| description | text | Descripción detallada |
| type | text | Tipo: full (100%), partial (porcentaje), fixed (monto fijo) |
| discount_percent | integer | Porcentaje de descuento (para tipo partial) |
| discount_amount | numeric | Monto de descuento fijo (para tipo fixed) |
| duration_months | integer | Duración de la beca en meses |
| max_recipients | integer | Número máximo de beneficiarios (null = sin límite) |
| current_recipients | integer | Contador de beneficiarios actuales |
| requirements | text | Requisitos para aplicar |
| is_active | boolean | Si está disponible para asignar |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

#### Nueva Tabla: `scholarship_recipients` (Becarios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Identificador único |
| scholarship_id | uuid | FK a scholarships |
| user_id | uuid | FK a auth.users |
| granted_by | uuid | Admin que otorgó la beca |
| granted_at | timestamp | Fecha de asignación |
| starts_at | timestamp | Fecha de inicio |
| expires_at | timestamp | Fecha de expiración |
| status | text | active, expired, revoked, pending |
| notes | text | Notas del admin |
| revoked_at | timestamp | Fecha de revocación (si aplica) |
| revoked_reason | text | Razón de revocación |

---

### Políticas RLS

```sql
-- scholarships: Admins pueden gestionar, todos pueden ver las activas
CREATE POLICY "Admins can manage scholarships" ON scholarships FOR ALL 
  USING (has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Anyone can view active scholarships" ON scholarships FOR SELECT 
  USING (is_active = true);

-- scholarship_recipients: Admins gestionan todo, usuarios ven las suyas
CREATE POLICY "Admins can manage recipients" ON scholarship_recipients FOR ALL 
  USING (has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Users can view their scholarships" ON scholarship_recipients FOR SELECT 
  USING (auth.uid() = user_id);
```

---

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/pages/admin/ScholarshipsManagement.tsx` | Página de gestión de becas |
| `src/hooks/useScholarships.tsx` | Hook con queries y mutations para becas |
| `src/components/admin/ScholarshipForm.tsx` | Formulario crear/editar beca |
| `src/components/admin/AssignScholarshipDialog.tsx` | Modal para asignar beca a usuario |
| `supabase/functions/send-scholarship-email/index.ts` | Edge function para notificación |
| Migración SQL | Crear tablas y políticas |

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Dashboard.tsx` | Agregar ruta `/dashboard/admin-scholarships` |
| `src/components/dashboard/AppSidebar.tsx` | Agregar enlace "Becas" en menú admin |
| `src/components/admin/UserDetailPanel.tsx` | Mostrar becas del usuario y permitir asignar |
| `src/hooks/useAdminUsers.tsx` | Agregar query para becas del usuario |
| `src/pages/dashboard/Profile.tsx` | Mostrar estado de beca activa del estudiante |
| `src/hooks/useStudentPayments.tsx` | Verificar si usuario tiene beca activa |
| `src/pages/dashboard/RenewMembership.tsx` | Aplicar descuento de beca automáticamente |
| `src/hooks/useEmailSettings.tsx` | Agregar tipo de email "scholarship_granted" |

---

### Diseño de UI - Gestión de Becas

```text
┌─────────────────────────────────────────────────────────────────┐
│  🎓 Gestión de Becas                           [+ Nueva Beca]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Total Becas  │  │ Becarios     │  │ Becas        │          │
│  │     8        │  │ Activos: 24  │  │ Disponibles  │          │
│  │ 5 activas    │  │              │  │     3        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  [Tipos de Becas] [Becarios]                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Tipos de Becas                                           │   │
│  ├──────┬──────────┬────────┬─────────┬──────────┬────────┤   │
│  │Nombre│   Tipo   │Descuento│Duración │Becarios  │ Estado │   │
│  ├──────┼──────────┼────────┼─────────┼──────────┼────────┤   │
│  │Excel │  100%    │ Total  │12 meses │  8/10    │ Activa │   │
│  │Socio │  50%     │  50%   │ 6 meses │  12/∞    │ Activa │   │
│  │Mérito│  $50     │ Fijo   │ 3 meses │  4/20    │ Activa │   │
│  └──────┴──────────┴────────┴─────────┴──────────┴────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flujo de Asignación de Beca

```text
Admin abre panel de usuario
        ↓
Tab "Becas" muestra historial
        ↓
Clic en "Asignar Beca"
        ↓
Selecciona tipo de beca disponible
        ↓
Define fechas y agrega notas
        ↓
Confirma asignación
        ↓
Sistema:
  - Crea registro en scholarship_recipients
  - Actualiza membership_status a "active"
  - Crea/extiende suscripción
  - Envía email de notificación
  - Registra en historial
```

---

### Integración con Pagos

Cuando un usuario con beca activa intenta renovar:

1. El sistema detecta la beca activa
2. Aplica el descuento automáticamente al precio
3. Si es beca 100%, muestra que tiene acceso gratuito
4. Si es beca parcial, muestra precio original vs. precio con beca

---

### Email de Notificación

Nueva Edge Function `send-scholarship-email`:
- Notifica al estudiante cuando recibe una beca
- Incluye: nombre de la beca, duración, fecha de inicio/fin
- Se registra en email_logs

Agregar configuración en `email_settings`:
```sql
INSERT INTO email_settings (email_type, subject, description)
VALUES ('scholarship_granted', '¡Felicitaciones! Has recibido una beca EDAN', 
        'Email enviado cuando se asigna una beca a un estudiante');
```

---

### Panel de Usuario (Estudiante)

En el perfil del estudiante se mostrará:
- Badge "Becario" si tiene beca activa
- Nombre de la beca y porcentaje de cobertura
- Fecha de inicio y expiración
- Días restantes con barra de progreso

---

### Panel de Usuario (Admin - UserDetailPanel)

Nueva pestaña "Becas" que muestra:
- Historial de becas del usuario
- Beca activa actual (si existe)
- Botón "Asignar Beca" 
- Opción de revocar beca activa

---

### Secuencia de Implementación

1. **Migración SQL**: Crear tablas `scholarships` y `scholarship_recipients` con RLS
2. **Hook useScholarships**: Queries y mutations para gestionar becas
3. **ScholarshipsManagement.tsx**: Página completa de administración
4. **AssignScholarshipDialog**: Modal para asignar beca desde gestión de usuarios
5. **Integrar en UserDetailPanel**: Nueva tab de becas
6. **Edge Function email**: Notificación de beca asignada
7. **Integrar en RenewMembership**: Aplicar descuento de beca
8. **Actualizar sidebar y rutas**: Agregar acceso al menú admin

---

### Consideraciones Técnicas

- Las becas no crean pagos, pero sí crean/extienden suscripciones
- El campo `payment_method` en payments puede ser "scholarship" para registros de beca
- Las becas tienen prioridad sobre códigos promocionales
- Un usuario solo puede tener una beca activa a la vez
- Al revocar una beca, se puede optar por suspender o mantener el acceso restante

