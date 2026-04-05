#!/usr/bin/env bash
# SEBDOM V2 — Instalación rápida en Linux / macOS (no Windows: use setup.bat o setup.ps1).
# Requisitos: Docker Engine + plugin "docker compose" (v2).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "== SEBDOM V2 — setup =="

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker no está instalado. Instale Docker Engine y vuelva a ejecutar este script."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[ERROR] No se encontró 'docker compose'. Instale el plugin Compose v2."
  exit 1
fi

if [ ! -f .env ]; then
  if [ -f .env.docker.example ]; then
    cp .env.docker.example .env
    echo "[INFO] Se creó .env desde .env.docker.example"
    echo "[AVISO] Edite .env y defina JWT_SECRET con un valor largo y aleatorio antes de exponer el servicio."
  else
    echo "[ERROR] Falta .env.docker.example en la raíz del repositorio."
    exit 1
  fi
else
  echo "[INFO] Ya existe .env (no se sobrescribe)."
fi

echo "[INFO] Construyendo imágenes y levantando contenedores..."
docker compose up -d --build

echo ""
echo "== Listo =="
echo "  • MongoDB: contenedor 'sebdom-mongo' (datos en volumen Docker: sebdom_mongo_data)"
echo "  • API:     http://localhost:5000  (health: http://localhost:5000/health)"
echo ""
echo "Comandos útiles:"
echo "  docker compose logs -f backend"
echo "  docker compose ps"
echo "  docker compose down        # detiene; los datos de Mongo persisten en el volumen"
echo ""
