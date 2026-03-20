---
name: Reglas de Eficiencia y Bitácora
alwaysApply: true
---

## Bitácora del proyecto

Existe un archivo llamado BITACORA.md en la raíz del proyecto.

### Reglas de bitácora:

1. ANTES de hacer cualquier cambio lee BITACORA.md
2. DESPUÉS de cada cambio exitoso actualiza BITACORA.md con este formato:

   ### [FECHA] - [DESCRIPCIÓN CORTA]
   - **Qué se hizo:** descripción detallada
   - **Archivos modificados:** lista de archivos
   - **Tablas afectadas:** si hubo cambios en BD
   - **Estado:** ✅ Completado / ⚠️ Parcial / ❌ Problema
   - **Pendiente:** qué falta si quedó incompleto

3. Si un cambio falla documéntalo con estado ⚠️ o ❌

## Reglas de eficiencia

1. NUNCA repitas código que no cambias — solo muestra líneas modificadas
2. Describe en 2 líneas qué vas a hacer antes de escribir código
3. Para cambios pequeños edita solo el archivo afectado
4. Para cambios en BD consulta primero el MCP antes de asumir la estructura
5. Mantén respuestas concisas — código limpio sin explicaciones innecesarias
6. Siempre actualiza BITACORA.md después de cada cambio exitoso
7. Si el modelo cambia por límite de cuota continúa sin interrumpir el flujo
8. maxTokens de respuesta: 2000 — si necesitas más divídelo en pasos