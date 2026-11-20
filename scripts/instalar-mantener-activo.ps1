# Programa en Windows una tarea que, cada vez que inicias sesión, ejecuta mantener-activo-supabase.mjs
# para que Supabase (plan gratuito) no pause los proyectos por inactividad.
#
# Instalar:    powershell -ExecutionPolicy Bypass -File scripts\instalar-mantener-activo.ps1
# Desinstalar: powershell -ExecutionPolicy Bypass -File scripts\instalar-mantener-activo.ps1 -Quitar
param([switch]$Quitar)

$nombre = 'Portal Inmobiliario - mantener Supabase activo'

if ($Quitar) {
  Unregister-ScheduledTask -TaskName $nombre -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tarea eliminada."
  exit 0
}

$node = (Get-Command node -ErrorAction Stop).Source
$script = Join-Path $PSScriptRoot 'mantener-activo-supabase.mjs'
$raiz = Split-Path $PSScriptRoot -Parent

# Se ejecuta oculta (sin ventana) y con la raíz del proyecto como carpeta de trabajo.
$accion = New-ScheduledTaskAction -Execute 'conhost.exe' `
  -Argument "--headless `"$node`" `"$script`"" `
  -WorkingDirectory $raiz
$disparador = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$disparador.Delay = 'PT1M'   # espera 1 minuto para que la red y OneDrive estén listos
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask -TaskName $nombre -Action $accion -Trigger $disparador -Settings $config `
  -Description 'Consulta mínima a los proyectos de Supabase para evitar la pausa por inactividad.' -Force | Out-Null

Write-Host "Tarea creada: '$nombre' (se ejecuta al iniciar sesión, con 1 minuto de espera)."
Write-Host "Registro de resultados: $raiz\_archivo\registros\mantener-activo.log"
