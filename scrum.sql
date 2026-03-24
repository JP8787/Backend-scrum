CREATE DATABASE IF NOT EXISTS scrum_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE scrum_db;

 MODULO 1 — GESTION DE ROLES Y USUARIOS

-- Tabla de permisos funcionales del sistema
CREATE TABLE permiso (
    id_permiso      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     VARCHAR(255)
);

-- Roles del sistema (Product Owner, Scrum Master, Developer, etc.)
CREATE TABLE rol (
    id_rol          INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol      VARCHAR(100) NOT NULL,
    descripcion     VARCHAR(255)
);

-- Relación rol → permisos (qué puede hacer cada rol)
CREATE TABLE rol_permiso (
    id_rol          INT NOT NULL,
    id_permiso      INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol)     REFERENCES rol(id_rol),
    FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso)
);

-- Usuarios de la plataforma
CREATE TABLE usuario (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(200) NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20),
    ciudad          VARCHAR(100),
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Relación usuario ↔ rol (con fecha de asignación, requerida en EPIC05)
CREATE TABLE usuario_rol (
    id_usuario          INT NOT NULL,
    id_rol              INT NOT NULL,
    fecha_asignacion    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_rol)     REFERENCES rol(id_rol)
);

-- Habilidades técnicas o de rol
CREATE TABLE habilidad (
    id_habilidad    INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    categoria       VARCHAR(100)   -- ej: 'Desarrollador', 'Diseñador', 'Otro'
);

-- Relación usuario ↔ habilidad
CREATE TABLE usuario_habilidad (
    id_usuario      INT NOT NULL,
    id_habilidad    INT NOT NULL,
    nivel           VARCHAR(50),   -- ej: 'Básico', 'Intermedio', 'Avanzado'
    PRIMARY KEY (id_usuario, id_habilidad),
    FOREIGN KEY (id_usuario)   REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_habilidad) REFERENCES habilidad(id_habilidad)
);

-- Perfil público del usuario (portafolio, experiencia, visibilidad)
CREATE TABLE perfil_usuario (
    id_perfil               INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario              INT NOT NULL UNIQUE,
    descripcion_personal    TEXT,
    experiencia             TEXT,
    portafolio_url          VARCHAR(255),
    foto_perfil_url         VARCHAR(255),
    visibilidad             ENUM('publico', 'privado', 'solo_equipo') NOT NULL DEFAULT 'publico',
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Notificaciones del sistema (módulo 1 y módulo 4 — cambios de estado)
CREATE TABLE notificacion (
    id_notificacion     INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario          INT NOT NULL,              -- destinatario
    tipo                ENUM('sistema','urgente','prioritaria','mensajeria','informativa','recordatorio') NOT NULL DEFAULT 'informativa',
    titulo              VARCHAR(200) NOT NULL,
    mensaje             TEXT,
    leida               TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);


MODULO 2 — BACKLOG DE PRODUCTO

-- Proyectos (pueden ser múltiples)
CREATE TABLE proyecto (
    id_proyecto     INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(100),   -- ej: 'Desarrollo de software', 'Marketing', 'Otro'
    estado          ENUM('inicio','activo','pausado','completado','cancelado') NOT NULL DEFAULT 'inicio',
    fecha_inicio    DATE,
    fecha_fin_est   DATE,           -- fecha estimada de cierre
    creado_por      INT NOT NULL,
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario)
);

-- Equipo de trabajo ligado a un proyecto
CREATE TABLE equipo_proyecto (
    id_equipo_proyecto  INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto         INT NOT NULL,
    nombre              VARCHAR(100) NOT NULL,
    descripcion         TEXT,
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id_proyecto)
);

-- Integrantes del equipo de proyecto (con su rol en ese proyecto)
CREATE TABLE usuario_equipo_proyecto (
    id_usuario              INT NOT NULL,
    id_equipo_proyecto      INT NOT NULL,
    id_rol                  INT NOT NULL,
    fecha_ingreso           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo                  TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_usuario, id_equipo_proyecto),
    FOREIGN KEY (id_usuario)          REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_equipo_proyecto)  REFERENCES equipo_proyecto(id_equipo_proyecto),
    FOREIGN KEY (id_rol)              REFERENCES rol(id_rol)
);

-- Etiquetas reutilizables para historias y tareas
CREATE TABLE etiqueta (
    id_etiqueta     INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    color           VARCHAR(20)   -- ej: '#FF5733'
);

-- Épicas del backlog (agrupan historias de usuario)
CREATE TABLE epica (
    id_epica        INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto     INT NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    categoria       VARCHAR(100),
    prioridad       TINYINT NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
    estado          ENUM('por_hacer','en_progreso','completada','cancelada') NOT NULL DEFAULT 'por_hacer',
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id_proyecto)
);

-- Historias de usuario (pertenecen a una épica)
CREATE TABLE historia_usuario (
    id_historia         INT AUTO_INCREMENT PRIMARY KEY,
    id_epica            INT NOT NULL,
    id_sprint           INT,                  -- sprint al que fue asignada (NULL = backlog)
    nombre              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    como_quien          VARCHAR(100),         -- "Como [rol]..."
    quiero              TEXT,                 -- "Quiero [acción]..."
    para                TEXT,                 -- "Para [beneficio]..."
    prioridad           TINYINT NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
    story_points        SMALLINT,             -- 0,0.5,1,3,5,8,13,20,40,100
    estimacion_dias     DECIMAL(5,1),
    estado              ENUM('por_hacer','en_progreso','terminado','eliminado') NOT NULL DEFAULT 'por_hacer',
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion  DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_epica) REFERENCES epica(id_epica)
    -- FK a sprint se agrega después de crear la tabla sprint
);

-- Criterios de aceptación (múltiples por historia — requerido en todo el backlog)
CREATE TABLE criterio_aceptacion (
    id_criterio     INT AUTO_INCREMENT PRIMARY KEY,
    id_historia     INT NOT NULL,
    descripcion     TEXT NOT NULL,
    cumplido        TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (id_historia) REFERENCES historia_usuario(id_historia)
);

-- Etiquetas asignadas a una historia
CREATE TABLE historia_etiqueta (
    id_historia     INT NOT NULL,
    id_etiqueta     INT NOT NULL,
    PRIMARY KEY (id_historia, id_etiqueta),
    FOREIGN KEY (id_historia) REFERENCES historia_usuario(id_historia),
    FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
);

-- Comentarios sobre historias de usuario
CREATE TABLE comentario_historia (
    id_comentario   INT AUTO_INCREMENT PRIMARY KEY,
    id_historia     INT NOT NULL,
    id_usuario      INT NOT NULL,
    comentario      TEXT NOT NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_historia) REFERENCES historia_usuario(id_historia),
    FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario)
);

 MODULO 3 — SPRINTS

-- Sprints del proyecto
CREATE TABLE sprint (
    id_sprint           INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto         INT NOT NULL,
    nombre              VARCHAR(100) NOT NULL,
    meta                TEXT,                 -- objetivo del sprint
    fecha_inicio        DATETIME NOT NULL,
    fecha_fin           DATETIME NOT NULL,
    estado              ENUM('planeado','en_curso','completado','cancelado') NOT NULL DEFAULT 'planeado',
    velocidad_estimada  SMALLINT,             -- story points comprometidos
    velocidad_real      SMALLINT,             -- story points completados al cierre
    fecha_liberacion    DATE,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id_proyecto)
);

-- Ahora que sprint existe, agregamos la FK en historia_usuario
ALTER TABLE historia_usuario
    ADD CONSTRAINT fk_hu_sprint
    FOREIGN KEY (id_sprint) REFERENCES sprint(id_sprint);

-- Tabla pivot sprint ↔ historia (historial de asignación)
-- Permite mover/reasignar historias entre sprints con trazabilidad
CREATE TABLE sprint_historia (
    id_sprint       INT NOT NULL,
    id_historia     INT NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_sprint, id_historia),
    FOREIGN KEY (id_sprint)   REFERENCES sprint(id_sprint),
    FOREIGN KEY (id_historia) REFERENCES historia_usuario(id_historia)
);

 MODULO 4 — TABLÓN DE TAREAS (KANBAN / SCRUM BOARD)

-- Tareas (son subdivisiones de una historia de usuario)
CREATE TABLE tarea (
    id_tarea            INT AUTO_INCREMENT PRIMARY KEY,
    id_historia         INT NOT NULL,
    nombre              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    tipo                ENUM('RF','RNF','bug','mejora','otro') NOT NULL DEFAULT 'RF',
    estado              ENUM('por_hacer','en_progreso','terminado','bloqueado') NOT NULL DEFAULT 'por_hacer',
    prioridad           ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
    story_points        SMALLINT,
    estimacion_dias     DECIMAL(5,1),
    orden_columna       INT NOT NULL DEFAULT 0,   -- posición en el tablero (drag & drop)
    fecha_inicio        DATETIME,
    fecha_fin_est       DATETIME,
    fecha_fin_real      DATETIME,
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion  DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_historia) REFERENCES historia_usuario(id_historia)
);

-- Asignación de usuarios a tareas (varios usuarios pueden trabajar en una tarea)
CREATE TABLE tarea_usuario (
    id_tarea        INT NOT NULL,
    id_usuario      INT NOT NULL,
    es_responsable  TINYINT(1) NOT NULL DEFAULT 0,   -- 1 = dueño principal
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_tarea, id_usuario),
    FOREIGN KEY (id_tarea)   REFERENCES tarea(id_tarea),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Historial de cambios de estado de una tarea (para notificaciones y auditoría)
CREATE TABLE historial_tarea (
    id_historial        INT AUTO_INCREMENT PRIMARY KEY,
    id_tarea            INT NOT NULL,
    id_usuario          INT NOT NULL,               -- quien hizo el cambio
    estado_anterior     ENUM('por_hacer','en_progreso','terminado','bloqueado'),
    estado_nuevo        ENUM('por_hacer','en_progreso','terminado','bloqueado') NOT NULL,
    observacion         TEXT,
    fecha               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tarea)   REFERENCES tarea(id_tarea),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Etiquetas asignadas a una tarea (bloqueada, alta prioridad, etc.)
CREATE TABLE tarea_etiqueta (
    id_tarea        INT NOT NULL,
    id_etiqueta     INT NOT NULL,
    PRIMARY KEY (id_tarea, id_etiqueta),
    FOREIGN KEY (id_tarea)   REFERENCES tarea(id_tarea),
    FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
);

-- Comentarios sobre tareas
CREATE TABLE comentario_tarea (
    id_comentario   INT AUTO_INCREMENT PRIMARY KEY,
    id_tarea        INT NOT NULL,
    id_usuario      INT NOT NULL,
    comentario      TEXT NOT NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tarea)   REFERENCES tarea(id_tarea),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

 DATOS DE PRUEBA (INSERT basico)
 
-- Permisos base
INSERT INTO permiso (nombre, descripcion) VALUES
('ver_backlog',         'Visualizar el backlog del producto'),
('editar_backlog',      'Crear y modificar épicas e historias'),
('gestionar_sprints',   'Crear, iniciar y cerrar sprints'),
('mover_tareas',        'Arrastrar tareas en el tablero'),
('gestionar_equipo',    'Agregar y asignar miembros al equipo'),
('ver_metricas',        'Ver burndown y métricas del sprint');

-- Roles
INSERT INTO rol (nombre_rol, descripcion) VALUES
('Product Owner',  'Define y prioriza el backlog'),
('Scrum Master',   'Facilita el proceso Scrum'),
('Developer',      'Desarrolla las tareas del sprint'),
('Designer',       'Diseña interfaces y experiencia de usuario'),
('Stakeholder',    'Interesado externo, solo lectura');

-- Permisos por rol
INSERT INTO rol_permiso VALUES
(1,1),(1,2),(1,3),(1,5),(1,6),  -- Product Owner: todo excepto mover tareas
(2,1),(2,3),(2,4),(2,5),(2,6),  -- Scrum Master
(3,1),(3,4),                    -- Developer: ver backlog y mover tareas
(4,1),(4,4),                    -- Designer: ver backlog y mover tareas
(5,1),(5,6);                    -- Stakeholder: solo ver backlog y métricas

-- Usuarios
INSERT INTO usuario (email, password, nombre, telefono, ciudad) VALUES
('karen@gmail.com',  '$2b$10$hash_karen', 'Karen Rodríguez', '3256321587', 'Bogotá'),
('juan@gmail.com',   '$2b$10$hash_juan',  'Juan Pérez',      '3026984120', 'Medellín'),
('sofia@gmail.com',  '$2b$10$hash_sofia', 'Sofía Bonilla',   '3101234567', 'Bogotá');

-- Roles a usuarios
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
(1, 2),  -- Karen: Scrum Master
(2, 3),  -- Juan:  Developer
(3, 1);  -- Sofía: Product Owner

-- Habilidades
INSERT INTO habilidad (nombre, categoria) VALUES
('JavaScript',  'Desarrollador'),
('MySQL',       'Desarrollador'),
('React',       'Desarrollador'),
('Figma',       'Diseñador'),
('Scrum',       'Gestión');

-- Habilidades de usuarios
INSERT INTO usuario_habilidad (id_usuario, id_habilidad, nivel) VALUES
(1,5,'Avanzado'),
(2,1,'Intermedio'),
(2,2,'Intermedio'),
(3,5,'Avanzado');

-- Perfiles
INSERT INTO perfil_usuario (id_usuario, descripcion_personal, visibilidad) VALUES
(1, 'Scrum Master certificada, 3 años de experiencia.', 'publico'),
(3, 'Product Owner especializada en metodologías ágiles.', 'publico');

-- Etiquetas del tablero
INSERT INTO etiqueta (nombre, color) VALUES
('Alta prioridad', '#FF5733'),
('Bloqueada',      '#C0392B'),
('Bug',            '#E74C3C'),
('Mejora',         '#3498DB'),
('Revisión',       '#F39C12');

-- Proyecto
INSERT INTO proyecto (nombre, descripcion, tipo, estado, creado_por) VALUES
('App Scrum', 'Sistema de gestión de proyectos con metodología Scrum', 'Desarrollo de software', 'activo', 3);

-- Equipo del proyecto
INSERT INTO equipo_proyecto (id_proyecto, nombre, descripcion) VALUES
(1, 'Equipo Alpha', 'Equipo principal de desarrollo');

-- Integrantes del equipo
INSERT INTO usuario_equipo_proyecto (id_usuario, id_equipo_proyecto, id_rol) VALUES
(1, 1, 2),  -- Karen: Scrum Master
(2, 1, 3),  -- Juan:  Developer
(3, 1, 1);  -- Sofía: Product Owner

-- Épicas (primeras 2 del backlog real)
INSERT INTO epica (id_proyecto, nombre, descripcion, categoria, prioridad, estado) VALUES
(1, 'Landing / Presentación', 'Información de la plataforma para nuevos usuarios', 'UI', 3, 'por_hacer'),
(1, 'Registro e Inicio de Sesión', 'Autenticación de usuarios con email o Google', 'Seguridad', 1, 'por_hacer'),
(1, 'Gestión de Proyectos',  'Crear, configurar e ingresar a proyectos', 'Core', 1, 'por_hacer');

-- Historias de usuario
INSERT INTO historia_usuario (id_epica, nombre, como_quien, quiero, para, prioridad, story_points, estimacion_dias, estado) VALUES
(2, 'Registro de nuevo usuario', 'Usuario de la plataforma', 'registrarme con email y contraseña o con Google', 'acceder a todas las funcionalidades', 1, 3, 1.0, 'por_hacer'),
(2, 'Aceptar términos y condiciones', 'Usuario de la plataforma', 'ver y aceptar los términos durante el registro', 'conocer el uso de mis datos', 2, 1, 0.5, 'por_hacer'),
(2, 'Iniciar sesión', 'Usuario registrado', 'iniciar sesión con email o cuenta de Google', 'acceder al sistema', 1, 2, 1.0, 'por_hacer'),
(3, 'Crear proyecto', 'Usuario', 'crear un proyecto con nombre, descripción y tipo', 'iniciar la gestión de tareas en Scrum', 2, 3, 2.0, 'por_hacer');

-- Criterios de aceptación
INSERT INTO criterio_aceptacion (id_historia, descripcion) VALUES
(1, 'El sistema permite registro con email y contraseña, o con Google'),
(1, 'Los correos electrónicos deben ser únicos en la base de datos'),
(1, 'La contraseña debe tener mínimo 8 caracteres, un número y una mayúscula'),
(2, 'Se exige aceptación de términos mediante checkbox; sin aceptarlos no se puede continuar'),
(3, 'El sistema permite inicio de sesión con email/contraseña o Google'),
(3, 'Si Google retorna error, el sistema emite una alerta clara al usuario'),
(4, 'El formulario solicita nombre, descripción y tipo de proyecto'),
(4, 'El proyecto se almacena y queda disponible en el listado del usuario');

-- Sprint 1
INSERT INTO sprint (id_proyecto, nombre, meta, fecha_inicio, fecha_fin, estado, velocidad_estimada) VALUES
(1, 'Sprint 1', 'Completar módulo de autenticación', NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'planeado', 9);

-- Asignar historias al sprint 1
INSERT INTO sprint_historia (id_sprint, id_historia) VALUES
(1,1),(1,2),(1,3);

UPDATE historia_usuario SET id_sprint = 1 WHERE id_historia IN (1,2,3);

-- Tareas del sprint 1
INSERT INTO tarea (id_historia, nombre, tipo, estado, prioridad, estimacion_dias, orden_columna) VALUES
(1, 'Diseñar formulario de registro', 'RF', 'por_hacer', 'alta', 1.0, 1),
(1, 'Implementar validación de contraseña', 'RF', 'por_hacer', 'alta', 0.5, 2),
(1, 'Integración OAuth Google', 'RF', 'por_hacer', 'alta', 1.0, 3),
(3, 'Diseñar pantalla de login', 'RF', 'por_hacer', 'alta', 0.5, 1),
(3, 'Implementar lógica de autenticación JWT', 'RF', 'por_hacer', 'critica', 1.0, 2);

-- Asignar tareas a usuarios
INSERT INTO tarea_usuario (id_tarea, id_usuario, es_responsable) VALUES
(1,2,1),(2,2,1),(3,2,1),(4,2,1),(5,2,1);

-- Etiquetas en tareas
INSERT INTO tarea_etiqueta (id_tarea, id_etiqueta) VALUES
(3,1),  -- Integración OAuth = Alta prioridad
(5,1);  -- JWT = Alta prioridad

-- Comentarios en tareas
INSERT INTO comentario_tarea (id_tarea, id_usuario, comentario) VALUES
(1, 1, 'Validar que el diseño sea responsive (RWD)'),
(5, 3, 'Usar librería passport.js para JWT');

-- Notificación de prueba
INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje) VALUES
(2, 'informativa', 'Sprint 1 iniciado', 'El Sprint 1 ha sido creado. Revisa tus tareas asignadas en el tablero.');

 CONSULTAS DE VERIFICACION
 
SELECT 'usuarios'           AS tabla, COUNT(*) AS registros FROM usuario
UNION ALL
SELECT 'roles',              COUNT(*) FROM rol
UNION ALL
SELECT 'proyectos',          COUNT(*) FROM proyecto
UNION ALL
SELECT 'epicas',             COUNT(*) FROM epica
UNION ALL
SELECT 'historias',          COUNT(*) FROM historia_usuario
UNION ALL
SELECT 'criterios_ac',       COUNT(*) FROM criterio_aceptacion
UNION ALL
SELECT 'sprints',            COUNT(*) FROM sprint
UNION ALL
SELECT 'tareas',             COUNT(*) FROM tarea
UNION ALL
SELECT 'tarea_usuario',      COUNT(*) FROM tarea_usuario
UNION ALL
SELECT 'notificaciones',     COUNT(*) FROM notificacion;
