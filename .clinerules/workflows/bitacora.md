# Workflow: Actualizar Bitácora

Ejecuta este workflow DESPUÉS de cada cambio exitoso.

# Bitácora del Proyecto

Documenta el estado actual después de cada cambio exitoso.

## Step 1: Obtén la fecha y hora actual
<execute_command>
<command>powershell -command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"</command>
<requires_approval>false</requires_approval>
</execute_command>

## Step 2: Obtén el número consecutivo
<execute_command>
<command>powershell -command "(Select-String -Path 'BITACORA.md' -Pattern '^### #' | Measure-Object).Count + 1"</command>
<requires_approval>false</requires_approval>
</execute_command>

## Step 3: Lee el estado actual
Lee BITACORA.md para entender las entradas anteriores.

## Step 4: Verifica cambios recientes
<execute_command>
<command>git diff --name-only HEAD</command>
<requires_approval>false</requires_approval>
</execute_command>

## Step 5: Actualiza BITACORA.md
Agrega una nueva entrada al inicio del archivo con este formato exacto:

### #[CONSECUTIVO] - [yyyy-MM-dd HH:mm:ss] - [DESCRIPCIÓN CORTA]
- **Qué se hizo:** descripción detallada
- **Archivos modificados:** lista completa
- **Tablas afectadas:** si hubo cambios en BD
- **Estado:** ✅ Completado / ⚠️ Parcial / ❌ Problema
- **Pendiente:** qué falta si quedó incompleto