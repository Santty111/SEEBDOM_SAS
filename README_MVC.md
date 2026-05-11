# SEBDOM V2 - Panel de Administración MVC

## 1. Arquitectura del Proyecto
Este proyecto sigue el patrón **Modelo-Vista-Controlador (MVC)** para garantizar una separación clara de responsabilidades.

- **Modelos (`backend/src/models`)**: Estructuras de datos con Mongoose.
- **Vistas (`frontend/src/pages`)**: Interfaces React que consumen la API.
- **Controladores (`backend/src/controllers`)**: Lógica de negocio y validaciones.

## 2. Comandos Git
```bash
git add .
git commit -m "feat: implementacion de panel admin mvc"
git push origin admin
```

## 3. Endpoints Principales
- `POST /api/admin/lotes`: Registro de lotes con validación de fecha.
- `POST /api/admin/productos`: Registro de productos con validación de costo.
- `GET /api/admin/categorias`: Listado de categorías.
- `GET /api/admin/productos/categoria/:id`: Filtrado dinámico (Cascada).

## 4. Despliegue
- Backend: Usar `backend/Dockerfile.admin`.
- Frontend: Configurado para Vercel via `frontend/vercel.json`.
