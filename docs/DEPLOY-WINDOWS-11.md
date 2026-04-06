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
4. Si se creó `.env` desde la plantilla, edítelo: **`MONGODB_URI`** (Atlas) y **`JWT_SECRET`** largo y aleatorio.
5. Compruebe la API: en el navegador o con:
   ```powershell
   curl http://localhost:5000/health
   ```

## 2. Base de datos (MongoDB Atlas)

La API en Docker **no incluye** MongoDB: los datos están en **Atlas**. La cadena de conexión va en **`MONGODB_URI`** en el `.env` de la raíz del repo.

- **Copias de seguridad:** use las herramientas de backup de Atlas (M0 incluye snapshot básico según el plan).
- Si en el pasado usó Mongo en Docker y quedó el volumen `sebdom_mongo_data`, puede eliminarlo con `docker volume rm sebdom_mongo_data` cuando ya no lo necesite.

## 3. Arranque automático tras iniciar sesión

Hay **dos capas**: que arranque **Docker Desktop** y que los **contenedores** queden en marcha.

### A) Docker Desktop al inicio de sesión (imprescindible)

1. Abra **Docker Desktop**.
2. **Settings** (engranaje) → **General**.
3. Active **“Start Docker Desktop when you sign in to your computer”** (o el texto equivalente en español).
4. Aplique / reinicie si lo pide.

Así, al encender la Torre e iniciar sesión, el motor Docker estará disponible antes o después de unos segundos.

### B) Política `restart: unless-stopped` (ya configurada)

El servicio **backend** en `docker-compose.yml` usa `restart: unless-stopped`. Cuando el daemon de Docker vuelve a estar activo (por ejemplo tras un corte de luz y nuevo inicio de Windows), Docker intenta **volver a levantar** ese contenedor automáticamente, si no lo detuvo usted con `docker compose down` o “Stop” explícito.

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
