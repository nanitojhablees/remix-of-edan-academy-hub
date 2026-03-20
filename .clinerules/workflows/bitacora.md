# Workflow: Actualizar Bitácora

Ejecuta este workflow DESPUÉS de cada cambio exitoso.

## Pasos
1. Obtén la fecha actual ejecutando en terminal: `date /t && time /t`
2. Abre BITACORA.md en la raíz del proyecto
3. Agrega una nueva entrada al inicio del archivo con este formato:

### [FECHA Y HORA REAL DEL SISTEMA] - [DESCRIPCIÓN CORTA]
- **Qué se hizo:** descripción detallada
- **Archivos modificados:** lista completa
- **Tablas afectadas:** si hubo cambios en BD
- **Estado:** ✅ Completado / ⚠️ Parcial / ❌ Problema
- **Pendiente:** qué falta si quedó incompleto