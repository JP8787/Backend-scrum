// src/routes/usuario.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// Todas las rutas de este archivo requieren token
router.use(verificarToken);

// GET    /api/usuarios              — listar todos (Scrum Master / PO)
router.get('/',    verificarRol('Scrum Master', 'Product Owner'), ctrl.listar);

// GET    /api/usuarios/:id          — ver perfil de un usuario
router.get('/:id', ctrl.obtener);

// PUT    /api/usuarios/:id          — actualizar datos propios
router.put('/:id', ctrl.actualizar);

// GET    /api/usuarios/:id/perfil   — ver perfil público
router.get('/:id/perfil', ctrl.obtenerPerfil);

// PUT    /api/usuarios/:id/perfil   — actualizar mi perfil
router.put('/:id/perfil', ctrl.actualizarPerfil);

// GET    /api/usuarios/:id/habilidades — ver habilidades
router.get('/:id/habilidades', ctrl.listarHabilidades);

// POST   /api/usuarios/:id/habilidades — agregar habilidad
router.post('/:id/habilidades', ctrl.agregarHabilidad);

// DELETE /api/usuarios/:id/habilidades/:idHab — quitar habilidad
router.delete('/:id/habilidades/:idHab', ctrl.quitarHabilidad);

// GET    /api/usuarios/:id/notificaciones — mis notificaciones
router.get('/:id/notificaciones', ctrl.listarNotificaciones);

// PATCH  /api/usuarios/:id/notificaciones/:idNot/leida — marcar como leída
router.patch('/:id/notificaciones/:idNot/leida', ctrl.marcarLeida);

module.exports = router;
