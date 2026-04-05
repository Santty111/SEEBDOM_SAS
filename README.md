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

Orquestación en la **raíz del repo** con **Docker Compose**: MongoDB 7 (réplica de un nodo para **transacciones**), API Node en el puerto **5000**, volúmenes persistentes y **`restart: unless-stopped`** en servicios largos.

### Archivos

| Archivo | Rol |
|---------|-----|
| `docker-compose.yml` | Servicios `mongo`, `mongo-init`, `backend`; red `sebdom-net`; volumen `mongo_data` |
| `backend/Dockerfile` | Imagen de producción (Alpine, `npm ci`, usuario no root, healthcheck HTTP) |
| `backend/.dockerignore` | Excluye `node_modules`, `.env`, etc. del contexto de build |
| `.env.docker.example` | Plantilla para copiar a `.env` (JWT, CORS) |
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
2. Los servicios `mongo` y `backend` ya tienen **`restart: unless-stopped`**: cuando el daemon de Docker vuelve, los contenedores suelen recuperarse solos.
3. **Opcional:** en el **Programador de tareas**, una acción que ejecute `powershell -NoProfile -ExecutionPolicy Bypass -File "RUTA\del\repo\docker-up.ps1"` con **retraso de 1 minuto** tras inicio de sesión (pasos exactos en `docs/DEPLOY-WINDOWS-11.md`).

### Manual (cualquier SO)

Copie `.env.docker.example` → `.env`, edite `JWT_SECRET`, luego en la raíz del repo:

```bash
docker compose up -d --build
```

- **API:** `http://localhost:5000` (salud: `/health`).
- **Mongo:** solo red interna `sebdom-net`; datos en volumen nombrado `sebdom_mongo_data` (compatible con Windows: volumen **nombrado**, no ruta `C:\...` en el YAML).
- Tras un corte de luz: en Windows, depende de que **Docker Desktop** arranque con la sesión; luego aplican `unless-stopped` y, si la configuró, la tarea programada.

El **frontend** no está en este Compose; puede seguir en Vite en desarrollo o servirse con nginx más adelante. Ajuste `CORS_ORIGINS` en `.env` con la URL o IP de su front en la red local (Quito/LAN).

---

## Historial de cambios en documentación

| Fecha | Cambio |
|-------|--------|
| 2026-04-05 | Windows 11: `setup.ps1`, `setup.bat`, `docker-up.ps1`, `docs/DEPLOY-WINDOWS-11.md`; notas de volúmenes en `docker-compose.yml`. |
| 2026-04-05 | Docker: `docker-compose.yml`, `backend/Dockerfile`, `.env.docker.example`, `setup.sh`; sección README “Docker (servidor local)”. |
| 2026-04-05 | Frontend V2 documentado: Vite/React/Tailwind, rutas, env `VITE_API_URL`, estructura `frontend/src/`. |
| 2026-04-05 | Creación del README: estructura legada `SEBDOM_SAS`, nueva arquitectura `backend/`, convención de actualización ante cambios importantes. |
| 2026-04-05 | Limpieza del legado: eliminación de `SEBDOM_SAS/` y `SEBDOM_SAS.sln`; `.gitignore` orientado a Node/React; README actualizado (legado solo vía historial Git). |

---

## Licencia y autoría

Definir según política del proyecto. Los commits y autores en Git deben reflejar a los contribuidores humanos del equipo.
