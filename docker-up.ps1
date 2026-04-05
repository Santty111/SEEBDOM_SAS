#Requires -Version 5.1
<#
  Solo levanta contenedores existentes (sin --build). Pensado para Programador de tareas
  tras iniciar sesión, cuando Docker Desktop ya está arrancando.
#>
$ErrorActionPreference = 'Stop'
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
Set-Location -LiteralPath $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { exit 1 }
docker compose up -d 2>$null
exit $LASTEXITCODE
