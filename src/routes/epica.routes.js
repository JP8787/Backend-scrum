// src/routes/epica.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/epica.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.use(verificarToken);

// GET    /api/epicas?id_proyecto=1   — listar épicas de un proyecto
router.get('/',    ctrl.listar);

// POST   /api/epicas                 — crear épica (PO)
router.post('/',   verificarRol('Product Owner'), ctrl.crear);

// GET    /api/epicas/:id             — detalle de épica
router.get('/:id', ctrl.obtener);

// PUT    /api/epicas/:id             — editar épica (PO)
router.put('/:id', verificarRol('Product Owner'), ctrl.actualizar);

// DELETE /api/epicas/:id             — eliminar épica (PO)
router.delete('/:id', verificarRol('Product Owner'), ctrl.eliminar);

module.exports = router;
