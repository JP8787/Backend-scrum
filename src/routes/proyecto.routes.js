// src/routes/proyecto.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/proyecto.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.use(verificarToken);

// GET    /api/proyectos              — listar proyectos del usuario
router.get('/',    ctrl.listar);

// POST   /api/proyectos              — crear proyecto (cualquier usuario autenticado)
router.post('/',   ctrl.crear);

// GET    /api/proyectos/:id          — detalle de un proyecto
router.get('/:id', ctrl.obtener);

// PUT    /api/proyectos/:id          — editar proyecto (PO / SM)
router.put('/:id', verificarRol('Product Owner', 'Scrum Master'), ctrl.actualizar);

// DELETE /api/proyectos/:id          — eliminar proyecto (solo PO)
router.delete('/:id', verificarRol('Product Owner'), ctrl.eliminar);

// ── Equipo del proyecto ───────────────────────────────────────────────
// GET    /api/proyectos/:id/equipo            — ver integrantes
router.get('/:id/equipo', ctrl.listarEquipo);

// POST   /api/proyectos/:id/equipo            — agregar integrante
router.post('/:id/equipo', verificarRol('Product Owner', 'Scrum Master'), ctrl.agregarMiembro);

// DELETE /api/proyectos/:id/equipo/:idUsuario — quitar integrante
router.delete('/:id/equipo/:idUsuario', verificarRol('Product Owner', 'Scrum Master'), ctrl.quitarMiembro);

module.exports = router;
