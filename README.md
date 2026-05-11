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
├── seed_admin.js             # Seed optimizado para comparativas 2024-2025
└── src/
    ├── app.js                # Express: middlewares, rutas, error handler
    ├── config/
    │   ├── database.js       # Conexión Mongoose
    │   └── corsOptions.js    # Orígenes permitidos (CORS_ORIGINS)
    ├── models/
    │   ├── Product.js        # Esquema producto (con validación de costo base)
    │   ├── Category.js       # Esquema categorías (relación foránea)
    │   ├── Order.js          # Esquema de Despachos y Alertas de Salida
    │   ├── Supply.js         # Esquema de Abastecimiento de Terceros
    │   ├── History.js        # Esquema historial
    │   └── User.js           # Usuario para login (admin/operador)
    ├── services/
    │   ├── productService.js         # Reglas de negocio y transacciones
    │   └── authService.js            # Lógica de autenticación
    ├── controllers/
    │   ├── productController.js      # Operaciones de inventario
    │   ├── adminDashboardController.js # Motor de comparativas y distribución
    │   └── categoryController.js     # Gestión de categorías
    ├── routes/
    │   ├── productRoutes.js  # Protegidas con JWT
    │   ├── adminRoutes.js    # Protegidas con JWT + Rol Admin
    │   ├── categoryRoutes.js # Listado de categorías para dropdowns
    │   └── authRoutes.js
    └── middleware/
        ├── authMiddleware.js # Verificación Bearer JWT y Roles
        └── errorMiddleware.js# Manejo global de errores
```

### Endpoints principales

| Prefijo | Descripción |
|---------|-------------|
| `/api/auth` | Login y registro |
| `/api/products` | Gestión de inventario (Entradas/Salidas con alerta automática) |
| `/api/categories` | Listado de categorías para dropdowns relacionales |
| `/api/admin/dashboard/distribucion` | Cola de pedidos activos |
| `/api/admin/dashboard/comparativa` | Motor de rentabilidad interanual |
| `/api/admin/dashboard/alertas` | Notificaciones de stock crítico |

### Validaciones Core (Requerimientos de Integridad)

1. **Back-End (Datos Sensibles):** El backend valida en cada inserción que el stock no sea negativo y que los nombres de productos no se dupliquen (insensible a mayúsculas), devolviendo errores de integridad `409` antes de tocar la base de datos.
2. **Relación Foránea (Dropdowns):** Las asignaciones de categorías a productos y productos a lotes se realizan mediante selectores dinámicos vinculados a los IDs reales de la base de datos, evitando ingresos manuales de claves foráneas.

### Arranque local (backend)

```bash
cd backend
npm install
npm run dev
```

### Usuarios de prueba (seed)

Para probar la comparativa interanual 2024 vs 2025:

```bash
cd backend
node seed_admin.js
```

| Email | Contraseña | Rol |
|-------|------------|-----|
| `admin@sebdom.test` | `AdminTest1234` | admin |
| `operador@sebdom.test` | `OperTest1234` | operador |

---

## Frontend SEBDOM V2 (`frontend/`)

SPA con **Vite**, **React 18**, **Tailwind CSS**.

### Rutas de la app

| Ruta | Descripción | Rol |
|------|-------------|-----|
| `/login` | Acceso al sistema | Público |
| `/productos` | Inventario: entradas, salidas y gestión | Todos |
| `/dashboard` | Comparativa Core, Distribución y Alertas | Admin |

### Características destacadas

*   **Distribución Inteligente:** Las salidas de inventario generan automáticamente pedidos en la cola de distribución del administrador.
*   **Gestión de Costos:** Cálculo dinámico de rentabilidad restando costos operativos de delivery y abastecimiento de terceros.
*   **Dashboard Visual:** Comparativa de Ingresos, Costos y Rentabilidad por temporadas.

---

## Historial de cambios en documentación

| Fecha | Cambio |
|-------|--------|
| 2026-05-10 | **Optimización Core**: Implementación de motor de comparativas interanuales, flujo automático Salida -> Distribución, y validaciones estrictas de backend para integridad de datos. |
| 2026-04-06 | Documentación inicial del stack MERN y limpieza del legado ASP.NET. |

---

## Licencia y autoría

Desarrollado para SEBDOM SAS - Sistema de Gestión de Inventario y Distribución.
