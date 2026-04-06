# SEBDOM

Repositorio del sistema SEBDOM en stack **MERN** (MongoDB, Express, React, Node). La aplicación histórica **ASP.NET Core MVC** (`SEBDOM_SAS`) ya **no está en el árbol de trabajo**; si necesitas comparar dominio o vistas antiguas, consulta el **historial de Git** en commits anteriores a la limpieza del legado.

---

## Mantenimiento de esta documentación

**Cada vez que se añada o cambie algo relevante** (nuevo módulo, ruta de API, variable de entorno, flujo de despliegue, dependencia crítica, modelo de datos, etc.), **actualiza este README** en la sección correspondiente y, si aplica, añade una línea breve al [Historial de cambios en documentación](#historial-de-cambios-en-documentación).

---

## Legado: `SEBDOM_SAS` (ASP.NET Core MVC)

El código **.NET 8** (Razor, EF Core, SQL Server) fue **retirado del repositorio** para evitar duplicidad con el stack MERN. La descripción de módulos (productos, historial, pulpos, conversiones de unidad) sigue siendo válida a nivel de negocio y está reflejada en **`backend/`**; el detalle de carpetas y archivos C# solo puede recuperarse desde **Git** (commits previos).

---

## Estructura nueva: backend Node (`backend/`)

API **REST** con **Express**, **Mongoose** (MongoDB), **JWT** y **bcrypt**. La **lógica de negocio** (stock, conversiones, reglas de inventario) está en **`services/`**; los controladores solo despachan HTTP y códigos de estado.

### Tecnologías

| Área | Tecnología |
|------|------------|
| Runtime | Node.js ≥ 18 |
| HTTP | Express |
| Base de datos | MongoDB (Mongoose) |
| Auth | JWT (`jsonwebtoken`) + hash de contraseña (`bcryptjs`) |
| Config | `dotenv` |
| CORS | `cors` (orígenes configurables para front en Vite / Vercel) |

### Organización de carpetas

```
backend/
├── server.js                 # Entrada: carga env, conecta BD, escucha puerto
├── package.json
├── .env.example              # Plantilla de variables (no commitear .env)
├── .gitignore
└── src/
    ├── app.js                # Express: middlewares, rutas, error handler
    ├── config/
    │   ├── database.js       # Conexión Mongoose
    │   └── corsOptions.js    # Orígenes permitidos (CORS_ORIGINS)
    ├── models/
    │   ├── Product.js        # Esquema producto (ex-Producto.cs)
    │   ├── History.js        # Esquema historial (ex-Historial.cs)
    │   └── User.js           # Usuario para login (email, password, rol)
    ├── services/
    │   ├── productService.js         # Reglas de producto / inventario
    │   ├── productServiceInstance.js # Composición con modelo History
    │   └── authService.js            # Registro (opcional) y login JWT
    ├── controllers/
    │   ├── productController.js
    │   └── authController.js
    ├── routes/
    │   ├── productRoutes.js  # Protegidas con JWT
    │   └── authRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js # Verificación Bearer JWT
    │   └── errorMiddleware.js# Manejo global de errores
    └── utils/
        └── AppError.js       # Errores operacionales tipados
```

### Endpoints principales (resumen)

| Prefijo | Descripción |
|---------|-------------|
| `GET /health` | Comprobación de vida del servicio |
| `/api/auth` | `POST /login`, `POST /register` (registro desactivable con env) |
| `/api/products` | CRUD y `PATCH .../inventory` (JWT obligatorio) |

Detalle de cuerpos JSON y códigos: comentarios en controladores y `.env.example`.

### Variables de entorno

Ver **`backend/.env.example`**. Mínimo habitual: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGINS`.

**Nota:** Las actualizaciones de inventario con historial usan **transacciones** de MongoDB; conviene **Atlas** o **replica set**, no solo un standalone local sin soporte transaccional.

### Arranque local (backend)

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
# Editar .env con MONGODB_URI y JWT_SECRET
npm install
npm run dev
```

### Usuarios de prueba (seed)

Tras levantar el stack con Docker, crea en Mongo los usuarios de desarrollo (solo si no existen):

```bash
docker compose exec backend node scripts/seedTestUsers.js
```

Credenciales por defecto (cámbialas o borra la BD en entornos reales):

| Email | Contraseña | Rol |
|-------|------------|-----|
| `admin@sebdom.test` | `AdminTest1234` | admin |
| `operador@sebdom.test` | `OperTest1234` | operador |

En local sin Docker: `cd backend && npm run seed` (requiere `MONGODB_URI` válido en `.env`).

---

## Frontend SEBDOM V2 (`frontend/`)

SPA con **Vite**, **React 18**, **React Router**, **Tailwind CSS**, **Axios** e iconos **Lucide React**. El token JWT y el usuario se guardan en **`localStorage`** (claves definidas en `src/api/axiosConfig.js`); el interceptor adjunta `Authorization` y emite `sebdom:auth-expired` ante `401`.

### Scripts

```bash
cd frontend
cp .env.example .env         # Windows: copy .env.example .env
npm install
npm run dev      # http://localhost:5173
npm run build
```

### Variable de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base del backend (sin barra final), p. ej. `http://localhost:5000` |

El backend debe incluir ese origen en `CORS_ORIGINS` (p. ej. `http://localhost:5173`).

### Rutas de la app

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión (pública) |
| `/dashboard` | Resumen: cantidad de productos y suma de `stockActual` |
| `/productos` | Tabla CRUD: búsqueda (foco inicial para lector QR), entrada/salida en modal, renombrar, alta y baja |

Las rutas internas usan `ProtectedRoute` + `Layout` (navbar con usuario y cierre de sesión).

### Organización de carpetas (`src/`)

```
src/
├── api/axiosConfig.js       # Axios + interceptores JWT
├── context/AuthContext.jsx
├── services/productApi.js   # Llamadas REST de productos (sin UI)
├── hooks/useInventory.js    # Movimientos de inventario vía API
├── utils/apiErrors.js
├── components/
│   ├── Layout.jsx, Navbar.jsx, ProtectedRoute.jsx
│   ├── ui/Spinner.jsx
│   └── products/            # Tabla, búsqueda, modales
├── pages/Login.jsx, Dashboard.jsx, Products.jsx
├── App.jsx
├── main.jsx
└── index.css                # Directivas Tailwind
```

---

## Docker (servidor local / Torre)

Orquestación en la **raíz del repo** con **Docker Compose**: solo la **API Node** en el puerto **5000**. La base de datos es **MongoDB Atlas** (`MONGODB_URI` en `.env`). El servicio `backend` usa **`restart: unless-stopped`**.

### Archivos

| Archivo | Rol |
|---------|-----|
| `docker-compose.yml` | Servicio `backend`; requiere `MONGODB_URI` en `.env` (Atlas) |
| `backend/Dockerfile` | Imagen de producción (Alpine, `npm ci`, usuario no root, healthcheck HTTP) |
| `backend/.dockerignore` | Excluye `node_modules`, `.env`, etc. del contexto de build |
| `.env.docker.example` | Plantilla para copiar a `.env` (`MONGODB_URI`, JWT, CORS) |
| `setup.sh` | Linux/macOS: comprueba Docker, crea `.env` si falta y ejecuta `docker compose up -d --build` |
| `setup.ps1` / `setup.bat` | **Windows 11:** mismo flujo que `setup.sh` (recomendado en la Torre) |
| `docker-up.ps1` | Solo `docker compose up -d` (sin build); útil en **Programador de tareas** tras el inicio de sesión |
| `docs/DEPLOY-WINDOWS-11.md` | Guía detallada: volúmenes en Windows, arranque automático, tarea programada |

### Uso rápido (Linux / macOS)

```bash
chmod +x setup.sh
./setup.sh
```

### Uso rápido (Windows 11 — Torre)

1. Instale **Docker Desktop** y active **WSL2** si el asistente lo recomienda.
2. En la carpeta raíz del repo (donde está `docker-compose.yml`):
   - Ejecute **`setup.bat`** (doble clic o desde `cmd`), **o**
   - PowerShell:
     ```powershell
     Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
     .\setup.ps1
     ```
3. Guía ampliada: **`docs/DEPLOY-WINDOWS-11.md`**.

### Arranque automático en Windows 11

1. **Docker Desktop** → *Settings* → *General* → activar **iniciar al iniciar sesión**.
2. El servicio **`backend`** tiene **`restart: unless-stopped`**: cuando el daemon de Docker vuelve, el contenedor suele recuperarse solo.
3. **Opcional:** en el **Programador de tareas**, una acción que ejecute `powershell -NoProfile -ExecutionPolicy Bypass -File "RUTA\del\repo\docker-up.ps1"` con **retraso de 1 minuto** tras inicio de sesión (pasos exactos en `docs/DEPLOY-WINDOWS-11.md`).

### Manual (cualquier SO)

Copie `.env.docker.example` → `.env`, edite **`MONGODB_URI`** (Atlas) y **`JWT_SECRET`**, luego en la raíz del repo:

```bash
docker compose up -d --build
```

- **API:** `http://localhost:5000` (salud: `/health`).
- **MongoDB:** solo en **Atlas**; Compass y herramientas usan la misma URI `mongodb+srv://...` que en `.env`.
- Tras un corte de luz: en Windows, depende de que **Docker Desktop** arranque con la sesión; luego aplica `unless-stopped` en `backend` y, si la configuró, la tarea programada.

**Limpieza (opcional):** si antes usabas Mongo en Docker, puede quedar el volumen `sebdom_mongo_data` o contenedores viejos. Para liberar espacio: `docker rm -f sebdom-mongo sebdom-mongo-init 2>nul` y, si ya no lo necesita, `docker volume rm sebdom_mongo_data`.

El **frontend** no está en este Compose; puede seguir en Vite en desarrollo o servirse con nginx más adelante. Ajuste `CORS_ORIGINS` en `.env` con la URL o IP de su front en la red local (Quito/LAN).

### MongoDB Atlas (base de datos en la nube)

1. Entra en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register), crea una cuenta o inicia sesión.
2. **Crear proyecto** (p. ej. `SEBDOM`) → **Build a Database** → elige **M0** (gratis) o el tier que necesites → región cercana a tus usuarios → **Create**.
3. **Seguridad del clúster**
   - **Database Access** → *Add New Database User* → usuario + contraseña fuerte → rol integrado **Read and write to any database** (o uno más restrictivo si Atlas lo permite para tu BD). No uses **Atlas Admin** para la aplicación. Guarda la contraseña (Atlas no la vuelve a mostrar).
   - **Network Access** → *Add IP Address* → para pruebas rápidas puedes usar **`0.0.0.0/0`** (cualquier IP; menos seguro). Mejor: tu IP pública actual o la IP del servidor donde correrá Docker.
4. **Connect** en el clúster → **Drivers** → copia la cadena **URI** (Node.js). Sustituye `<password>` por la contraseña del usuario (si tiene caracteres especiales, [URL-encódificalos](https://www.mongodb.com/docs/atlas/troubleshoot-connection/#special-characters-in-connection-string-password)).
5. Asegúrate de que el path de la base sea **`/sebdom`** (o el nombre que uses), p. ej.  
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/sebdom?retryWrites=true&w=majority`
6. En la **raíz del repo**, edita tu `.env` y define **`MONGODB_URI=`** con esa URI completa en **una sola línea**.
7. Reinicia la API: `docker compose up -d --build`
8. Vuelve a ejecutar el seed si la base Atlas está vacía (el contenedor debe poder salir a Internet):  
   `docker compose exec backend node scripts/seedTestUsers.js`
9. **Compass** a la nube: usa la misma URI `mongodb+srv://...` (Atlas → Connect → Compass).

Los clústeres Atlas ya son **replica set**: las **transacciones** de inventario del backend siguen siendo válidas.

| Desde | URI |
|-------|-----|
| **Atlas** (backend en Docker con `.env`) | La que pegaste en `MONGODB_URI` (`mongodb+srv://...`) |

---

## Historial de cambios en documentación

| Fecha | Cambio |
|-------|--------|
| 2026-04-05 | Windows 11: `setup.ps1`, `setup.bat`, `docker-up.ps1`, `docs/DEPLOY-WINDOWS-11.md`; notas de volúmenes en `docker-compose.yml`. |
| 2026-04-05 | Docker: `docker-compose.yml`, `backend/Dockerfile`, `.env.docker.example`, `setup.sh`; sección README “Docker (servidor local)”. |
| 2026-04-05 | Frontend V2 documentado: Vite/React/Tailwind, rutas, env `VITE_API_URL`, estructura `frontend/src/`. |
| 2026-04-05 | Creación del README: estructura legada `SEBDOM_SAS`, nueva arquitectura `backend/`, convención de actualización ante cambios importantes. |
| 2026-04-05 | Limpieza del legado: eliminación de `SEBDOM_SAS/` y `SEBDOM_SAS.sln`; `.gitignore` orientado a Node/React; README actualizado (legado solo vía historial Git). |
| 2026-04-05 | Seed de usuarios de prueba: `backend/scripts/seedTestUsers.js`, `npm run seed`, documentación en README. |
| 2026-04-05 | Docker: puerto `127.0.0.1:27017` en `mongo` para clientes locales; README: URIs y explicación de `mongo-init`. |
| 2026-04-05 | `MONGODB_URI` configurable en `.env` para Atlas; guía README y `.env.docker.example`. |
| 2026-04-05 | Compose simplificado: solo `backend`; Mongo en Atlas obligatorio para Docker; eliminados servicios `mongo` / `mongo-init`. |

---

## Licencia y autoría

Definir según política del proyecto.
