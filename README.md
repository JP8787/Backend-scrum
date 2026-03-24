# Scrum Backend — API REST

Backend del Sistema de Gestión de Proyectos Scrum (Módulos 1 al 4).  
Stack: **Node.js + Express + mysql2**

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos de MySQL y un JWT_SECRET seguro

# 3. Importar la base de datos
mysql -u root -p < scrum_db_v2.sql

# 4. Iniciar en desarrollo
npm run dev

# 5. Iniciar en producción
npm start
```

---

## Autenticación

Todos los endpoints (excepto `/api/auth/*` y `/api/health`) requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene haciendo `POST /api/auth/login`.

---

## Endpoints — 37 en total

### 🔐 Auth (sin token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión → devuelve JWT |

**Body register:**
```json
{
  "email": "usuario@correo.com",
  "password": "Segura123",
  "nombre": "Juan Pérez",
  "telefono": "3001234567",
  "ciudad": "Bogotá"
}
```

**Body login:**
```json
{ "email": "usuario@correo.com", "password": "Segura123" }
```

---

### 👤 Usuarios (Módulo 1)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/usuarios` | SM / PO | Listar todos los usuarios |
| GET | `/api/usuarios/:id` | Autenticado | Ver datos de un usuario |
| PUT | `/api/usuarios/:id` | Mismo usuario | Actualizar mis datos |
| GET | `/api/usuarios/:id/perfil` | Autenticado | Ver perfil público |
| PUT | `/api/usuarios/:id/perfil` | Mismo usuario | Actualizar mi perfil |
| GET | `/api/usuarios/:id/habilidades` | Autenticado | Listar habilidades |
| POST | `/api/usuarios/:id/habilidades` | Autenticado | Agregar habilidad |
| DELETE | `/api/usuarios/:id/habilidades/:idHab` | Autenticado | Quitar habilidad |
| GET | `/api/usuarios/:id/notificaciones` | Autenticado | Mis notificaciones |
| PATCH | `/api/usuarios/:id/notificaciones/:idNot/leida` | Autenticado | Marcar como leída |

---

### 📁 Proyectos (Módulo 2)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/proyectos` | Autenticado | Mis proyectos |
| POST | `/api/proyectos` | Autenticado | Crear proyecto |
| GET | `/api/proyectos/:id` | Autenticado | Detalle del proyecto |
| PUT | `/api/proyectos/:id` | PO / SM | Editar proyecto |
| DELETE | `/api/proyectos/:id` | PO | Eliminar proyecto |
| GET | `/api/proyectos/:id/equipo` | Autenticado | Ver integrantes del equipo |
| POST | `/api/proyectos/:id/equipo` | PO / SM | Agregar integrante |
| DELETE | `/api/proyectos/:id/equipo/:idUsuario` | PO / SM | Quitar integrante |

**Body crear proyecto:**
```json
{
  "nombre": "App Scrum",
  "descripcion": "Sistema de gestión ágil",
  "tipo": "Desarrollo de software",
  "fecha_inicio": "2026-04-01",
  "fecha_fin_est": "2026-12-31"
}
```

---

### 🗂 Épicas (Módulo 2 — Backlog)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/epicas?id_proyecto=1` | Autenticado | Listar épicas del proyecto |
| POST | `/api/epicas` | PO | Crear épica |
| GET | `/api/epicas/:id` | Autenticado | Detalle de épica |
| PUT | `/api/epicas/:id` | PO | Editar épica |
| DELETE | `/api/epicas/:id` | PO | Eliminar épica |

**Body crear épica:**
```json
{
  "id_proyecto": 1,
  "nombre": "Autenticación",
  "descripcion": "Registro e inicio de sesión",
  "categoria": "Seguridad",
  "prioridad": 1
}
```

---

### 📋 Historias de usuario (Módulo 2 — Backlog)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/historias?id_epica=1` | Autenticado | Historias de una épica |
| GET | `/api/historias?id_sprint=1` | Autenticado | Historias de un sprint |
| POST | `/api/historias` | PO | Crear historia |
| GET | `/api/historias/:id` | Autenticado | Detalle + criterios |
| PUT | `/api/historias/:id` | PO | Editar historia |
| DELETE | `/api/historias/:id` | PO | Eliminar historia |
| GET | `/api/historias/:id/criterios` | Autenticado | Listar criterios de aceptación |
| POST | `/api/historias/:id/criterios` | PO | Agregar criterio |
| PATCH | `/api/historias/:id/criterios/:idCrit` | Autenticado | Marcar criterio cumplido/pendiente |
| DELETE | `/api/historias/:id/criterios/:idCrit` | PO | Eliminar criterio |
| GET | `/api/historias/:id/comentarios` | Autenticado | Ver comentarios |
| POST | `/api/historias/:id/comentarios` | Autenticado | Agregar comentario |

**Body crear historia:**
```json
{
  "id_epica": 1,
  "nombre": "Registro de usuario",
  "como_quien": "Usuario de la plataforma",
  "quiero": "registrarme con email y contraseña",
  "para": "acceder a las funcionalidades",
  "prioridad": 1,
  "story_points": 3,
  "estimacion_dias": 1.0
}
```

---

### 🏃 Sprints (Módulo 3)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/sprints?id_proyecto=1` | Autenticado | Listar sprints |
| POST | `/api/sprints` | SM | Crear sprint |
| GET | `/api/sprints/:id` | Autenticado | Detalle + historias asignadas |
| PUT | `/api/sprints/:id` | SM | Editar sprint |
| PATCH | `/api/sprints/:id/estado` | SM | Cambiar estado (iniciar/completar) |
| DELETE | `/api/sprints/:id` | SM | Eliminar sprint (solo si está planeado) |
| POST | `/api/sprints/:id/historias` | PO / SM | Asignar historia al sprint |
| DELETE | `/api/sprints/:id/historias/:idHist` | PO / SM | Quitar historia del sprint |
| GET | `/api/sprints/:id/progreso` | Autenticado | Progreso del sprint (% completado) |

**Body crear sprint:**
```json
{
  "id_proyecto": 1,
  "nombre": "Sprint 1",
  "meta": "Completar módulo de autenticación",
  "fecha_inicio": "2026-04-01T08:00:00",
  "fecha_fin": "2026-04-14T18:00:00",
  "velocidad_estimada": 13
}
```

**Body cambiar estado:**
```json
{ "estado": "en_curso" }
```

---

### ✅ Tareas — Tablero Kanban (Módulo 4)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/tareas?id_sprint=1` | Autenticado | Todas las tareas del sprint (tablero) |
| GET | `/api/tareas?id_historia=1` | Autenticado | Tareas de una historia |
| POST | `/api/tareas` | Autenticado | Crear tarea |
| GET | `/api/tareas/:id` | Autenticado | Detalle + asignados + etiquetas |
| PUT | `/api/tareas/:id` | Autenticado | Editar tarea |
| PATCH | `/api/tareas/:id/estado` | Autenticado | **Mover en el tablero (drag & drop)** |
| DELETE | `/api/tareas/:id` | SM / PO | Eliminar tarea |
| GET | `/api/tareas/:id/asignados` | Autenticado | Ver usuarios asignados |
| POST | `/api/tareas/:id/asignados` | SM / PO | Asignar usuario a tarea |
| DELETE | `/api/tareas/:id/asignados/:idUser` | SM / PO | Quitar usuario de tarea |
| GET | `/api/tareas/:id/historial` | Autenticado | Historial de cambios de estado |
| GET | `/api/tareas/:id/comentarios` | Autenticado | Ver comentarios |
| POST | `/api/tareas/:id/comentarios` | Autenticado | Agregar comentario |
| POST | `/api/tareas/:id/etiquetas` | Autenticado | Agregar etiqueta |
| DELETE | `/api/tareas/:id/etiquetas/:idEtiq` | Autenticado | Quitar etiqueta |

**Body crear tarea:**
```json
{
  "id_historia": 1,
  "nombre": "Diseñar formulario de registro",
  "descripcion": "Incluir validación responsive",
  "tipo": "RF",
  "prioridad": "alta",
  "story_points": 2,
  "estimacion_dias": 1.0
}
```

**Body cambiar estado (drag & drop):**
```json
{ "estado": "en_progreso" }
```
> Valores válidos: `por_hacer` | `en_progreso` | `terminado` | `bloqueado`  
> Este endpoint automáticamente registra el cambio en `historial_tarea` y genera notificaciones.

---

## Formato de respuestas

**Éxito:**
```json
{ "ok": true, "data": { ... } }
```

**Error:**
```json
{ "ok": false, "error": "Mensaje descriptivo del error" }
```

---

## Estructura del proyecto

```
scrum-backend/
├── .env.example
├── package.json
└── src/
    ├── app.js                        ← Servidor Express + rutas
    ├── config/
    │   └── db.js                     ← Pool de conexiones MySQL
    ├── middlewares/
    │   └── auth.middleware.js        ← Verificación JWT + roles
    ├── utils/
    │   └── response.js               ← Helpers de respuesta HTTP
    ├── routes/
    │   ├── auth.routes.js
    │   ├── usuario.routes.js
    │   ├── proyecto.routes.js
    │   ├── epica.routes.js
    │   ├── historia.routes.js
    │   ├── sprint.routes.js
    │   └── tarea.routes.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── usuario.controller.js
    │   ├── proyecto.controller.js
    │   ├── epica.controller.js
    │   ├── historia.controller.js
    │   ├── sprint.controller.js
    │   └── tarea.controller.js
    └── services/
        ├── auth.service.js
        ├── usuario.service.js
        ├── proyecto.service.js
        ├── epica.service.js
        ├── historia.service.js
        ├── sprint.service.js
        └── tarea.service.js
```
