# Despliegue SEBDOM V2 en Torre con Windows 11

## Requisitos

- **Windows 11** actualizado.
- **Docker Desktop para Windows** (motor WSL2 recomendado).
- En Docker Desktop: habilitado el uso de **Docker Compose V2** (incluido por defecto en versiones recientes).

## 1. Primera instalación

1. Clone o copie el repositorio en una ruta estable, por ejemplo:
   `C:\Apps\SEBDOM`
2. Abra **PowerShell** o **Símbolo del sistema** en esa carpeta (raíz del repo, donde está `docker-compose.yml`).
3. Ejecute **una** de estas opciones:
   - Doble clic en **`setup.bat`**, o
   - En PowerShell:
     ```powershell
     Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
     .\setup.ps1
     ```
4. Si se creó `.env` desde la plantilla, edítelo y defina un **`JWT_SECRET`** largo y aleatorio.
5. Compruebe la API: en el navegador o con:
   ```powershell
   curl http://localhost:5000/health
   ```

## 2. Volúmenes y rutas (Windows)

El archivo `docker-compose.yml` usa un **volumen nombrado** (`sebdom_mongo_data`), no una carpeta del tipo `C:\datos\mongo:/data/db`.

- **Ventaja en Windows:** Docker Desktop guarda los datos dentro de su máquina virtual (WSL2 o Hyper-V). No hay que escapar rutas con `\`, ni permisos raros de NTFS en el montaje.
- **Copias de seguridad:** use `docker run` / extensiones de Docker o exportaciones de Mongo según su política; si en el futuro necesita un bind mount explícito a `D:\MongoData`, documente la ruta y los permisos aparte.

## 3. Arranque automático tras iniciar sesión

Hay **dos capas**: que arranque **Docker Desktop** y que los **contenedores** queden en marcha.

### A) Docker Desktop al inicio de sesión (imprescindible)

1. Abra **Docker Desktop**.
2. **Settings** (engranaje) → **General**.
3. Active **“Start Docker Desktop when you sign in to your computer”** (o el texto equivalente en español).
4. Aplique / reinicie si lo pide.

Así, al encender la Torre e iniciar sesión, el motor Docker estará disponible antes o después de unos segundos.

### B) Política `restart: unless-stopped` (ya configurada)

Los servicios **mongo** y **backend** en `docker-compose.yml` usan `restart: unless-stopped`. Cuando el daemon de Docker vuelve a estar activo (por ejemplo tras un corte de luz y nuevo inicio de Windows), Docker intenta **volver a levantar** esos contenedores automáticamente, si no los detuvo usted con `docker compose down` o “Stop” explícito.

### C) Programador de tareas (opcional, refuerzo)

Si nota que a veces los contenedores no están arriba hasta que abre Docker Desktop manualmente, puede crear una tarea que ejecute un “`compose up`” ligero **un minuto después** de iniciar sesión.

1. Abra **Programador de tareas** (`taskschd.msc`).
2. **Crear tarea básica…** o **Crear tarea…** (recomendado: Crear tarea para más opciones).
3. **General:**
   - Nombre: `SEBDOM Docker Compose up`
   - Marque **Ejecutar tanto si el usuario inició sesión como si no** solo si necesita servicio sin sesión (en una Torre con usuario fijo suele bastar “al iniciar sesión”).
   - Opcional: **Ejecutar con los privilegios más altos** si tiene problemas de permisos (no suele hacer falta).
4. **Desencadenadores:** **Al iniciar sesión** → en **Configuración avanzada** añada **Retraso de:** **1 minuto** (para dar tiempo a Docker Desktop).
5. **Acciones:** **Iniciar un programa**
   - **Programa/script:** `powershell.exe`
   - **Agregar argumentos:**
     ```text
     -NoProfile -ExecutionPolicy Bypass -File "C:\Apps\SEBDOM\docker-up.ps1"
     ```
     (Cambie `C:\Apps\SEBDOM` por la ruta real de su clon del repo.)
   - **Iniciar en:** `C:\Apps\SEBDOM` (misma carpeta raíz del repo).
6. **Condiciones:** puede desmarcar “Iniciar solo si el equipo está conectado a la alimentación de CA” si usa laptop y quiere la tarea en batería.
7. Acepte y pruebe: **Ejecutar** con clic derecho en la tarea.

El script **`docker-up.ps1`** solo ejecuta `docker compose up -d` (sin `--build`), adecuado para arranques diarios.

## 4. Comandos útiles (PowerShell, raíz del repo)

```powershell
docker compose ps
docker compose logs -f backend
docker compose down
docker compose up -d --build
```

## 5. Firewall de Windows

Si accede al puerto **5000** desde **otro equipo** de la LAN, cree una regla de entrada TCP 5000 o use la UI “Firewall de Windows Defender” → reglas de entrada → nuevo puerto.

---

Véase también el **README** principal del repositorio, sección Docker.
