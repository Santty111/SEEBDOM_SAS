#Requires -Version 5.1
<#
  SEBDOM V2 — Instalación en Windows (Docker Desktop + Compose V2).
  Ejecutar desde la raíz del repo:  .\setup.ps1
  O bien:  setup.bat
#>
$ErrorActionPreference = 'Stop'

$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
Set-Location -LiteralPath $Root

Write-Host '== SEBDOM V2 - setup (Windows) ==' -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error 'Docker no está en el PATH. Instale Docker Desktop para Windows y reinicie la sesión.'
}

docker compose version 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "No se encontró 'docker compose'. Actualice Docker Desktop (plugin Compose V2)."
}

$envFile = Join-Path $Root '.env'
$example = Join-Path $Root '.env.docker.example'

if (-not (Test-Path -LiteralPath $envFile)) {
  if (-not (Test-Path -LiteralPath $example)) {
    Write-Error 'Falta .env.docker.example en la raíz del repositorio.'
  }
  Copy-Item -LiteralPath $example -Destination $envFile
  Write-Host '[INFO] Se creó .env desde .env.docker.example' -ForegroundColor Yellow
  Write-Host '[AVISO] Edite .env y defina JWT_SECRET (valor largo y aleatorio).' -ForegroundColor Yellow
} else {
  Write-Host '[INFO] Ya existe .env (no se sobrescribe).'
}

Write-Host '[INFO] Construyendo imágenes y levantando contenedores...' -ForegroundColor Gray
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ''
Write-Host '== Listo ==' -ForegroundColor Green
Write-Host '  • API:     http://localhost:5000  (salud: /health)'
Write-Host '  • MongoDB: solo red interna Docker; datos en volumen sebdom_mongo_data'
Write-Host ''
Write-Host 'Comandos útiles:'
Write-Host '  docker compose logs -f backend'
Write-Host '  docker compose ps'
Write-Host '  docker compose down'
Write-Host ''
Write-Host 'Arranque automático: vea README sección Docker > Windows 11.' -ForegroundColor DarkGray
