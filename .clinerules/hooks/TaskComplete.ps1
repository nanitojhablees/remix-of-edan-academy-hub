# Hook: Actualizar BITACORA.md al completar tarea
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# IMPORTANTE: Leer stdin para no bloquear Cline
$input_data = $input | Out-String

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$consecutivo = 1
if (Test-Path "BITACORA.md") {
    $consecutivo = (Select-String -Path "BITACORA.md" -Pattern "^### #").Count + 1
}

Write-Output "Tarea completada. Actualiza BITACORA.md agregando esta entrada al inicio:"
Write-Output ""
Write-Output "### #$consecutivo - $fecha - [descripcion corta]"
Write-Output "- **Que se hizo:** descripcion detallada"
Write-Output "- **Archivos modificados:** lista completa"
Write-Output "- **Tablas afectadas:** si hubo cambios en BD"
Write-Output "- **Estado:** Completado / Parcial / Problema"
Write-Output "- **Pendiente:** que falta si quedo incompleto"