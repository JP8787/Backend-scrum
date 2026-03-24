// src/routes/historia.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/historia.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.use(verificarToken);

// GET  /api/historias?id_epica=1 | ?id_sprint=1  — backlog filtrado
router.get('/',    ctrl.listar);

// POST /api/historias              — crear historia (PO)
router.post('/',   verificarRol('Product Owner'), ctrl.crear);

// GET  /api/historias/:id          — detalle + criterios
router.get('/:id', ctrl.obtener);

// PUT  /api/historias/:id          — editar historia (PO)
router.put('/:id', verificarRol('Product Owner'), ctrl.actualizar);

// DELETE /api/historias/:id        — eliminar historia (PO)
router.delete('/:id', verificarRol('Product Owner'), ctrl.eliminar);

// ── Criterios de aceptación ───────────────────────────────────────────
// GET    /api/historias/:id/criterios
router.get('/:id/criterios', ctrl.listarCriterios);

// POST   /api/historias/:id/criterios
router.post('/:id/criterios', verificarRol('Product Owner'), ctrl.crearCriterio);

// PATCH  /api/historias/:id/criterios/:idCrit   — marcar cumplido
router.patch('/:id/criterios/:idCrit', ctrl.toggleCriterio);

// DELETE /api/historias/:id/criterios/:idCrit
router.delete('/:id/criterios/:idCrit', verificarRol('Product Owner'), ctrl.eliminarCriterio);

// ── Comentarios ────────────────────────────────────────────────────────
// GET  /api/historias/:id/comentarios
router.get('/:id/comentarios', ctrl.listarComentarios);

// POST /api/historias/:id/comentarios
router.post('/:id/comentarios', ctrl.crearComentario);

module.exports = router;
