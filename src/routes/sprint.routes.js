// src/routes/sprint.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/sprint.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.use(verificarToken);

// GET    /api/sprints?id_proyecto=1   — listar sprints de un proyecto
router.get('/',    ctrl.listar);

// POST   /api/sprints                 — crear sprint (SM)
router.post('/',   verificarRol('Scrum Master'), ctrl.crear);

// GET    /api/sprints/:id             — detalle del sprint + historias
router.get('/:id', ctrl.obtener);

// PUT    /api/sprints/:id             — editar sprint (SM)
router.put('/:id', verificarRol('Scrum Master'), ctrl.actualizar);

// PATCH  /api/sprints/:id/estado      — cambiar estado del sprint (SM)
router.patch('/:id/estado', verificarRol('Scrum Master'), ctrl.cambiarEstado);

// DELETE /api/sprints/:id             — eliminar sprint si está planeado (SM)
router.delete('/:id', verificarRol('Scrum Master'), ctrl.eliminar);

// ── Historias del sprint ──────────────────────────────────────────────
// POST   /api/sprints/:id/historias         — asignar historia al sprint
router.post('/:id/historias',
  verificarRol('Product Owner', 'Scrum Master'), ctrl.asignarHistoria);

// DELETE /api/sprints/:id/historias/:idHist — quitar historia del sprint
router.delete('/:id/historias/:idHist',
  verificarRol('Product Owner', 'Scrum Master'), ctrl.quitarHistoria);

// GET    /api/sprints/:id/progreso           — tareas Por Hacer / En Progreso / Terminado
router.get('/:id/progreso', ctrl.progreso);

module.exports = router;
