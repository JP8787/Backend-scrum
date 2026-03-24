// src/routes/tarea.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/tarea.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.use(verificarToken);

// GET    /api/tareas?id_historia=1 | ?id_sprint=1  — listar tareas (tablero)
router.get('/',    ctrl.listar);

// POST   /api/tareas                   — crear tarea
router.post('/',   ctrl.crear);

// GET    /api/tareas/:id               — detalle de tarea + asignados + historial
router.get('/:id', ctrl.obtener);

// PUT    /api/tareas/:id               — editar tarea
router.put('/:id', ctrl.actualizar);

// PATCH  /api/tareas/:id/estado        — mover en el tablero Kanban (drag & drop)
router.patch('/:id/estado', ctrl.cambiarEstado);

// DELETE /api/tareas/:id               — eliminar tarea (SM / PO)
router.delete('/:id', verificarRol('Scrum Master', 'Product Owner'), ctrl.eliminar);

// ── Asignación de usuarios ────────────────────────────────────────────
// GET    /api/tareas/:id/asignados
router.get('/:id/asignados', ctrl.listarAsignados);

// POST   /api/tareas/:id/asignados         — asignar usuario a tarea
router.post('/:id/asignados',
  verificarRol('Scrum Master', 'Product Owner'), ctrl.asignarUsuario);

// DELETE /api/tareas/:id/asignados/:idUser — quitar usuario de tarea
router.delete('/:id/asignados/:idUser',
  verificarRol('Scrum Master', 'Product Owner'), ctrl.quitarUsuario);

// ── Historial de estado ───────────────────────────────────────────────
// GET    /api/tareas/:id/historial
router.get('/:id/historial', ctrl.historial);

// ── Comentarios ───────────────────────────────────────────────────────
// GET    /api/tareas/:id/comentarios
router.get('/:id/comentarios', ctrl.listarComentarios);

// POST   /api/tareas/:id/comentarios
router.post('/:id/comentarios', ctrl.crearComentario);

// ── Etiquetas ─────────────────────────────────────────────────────────
// POST   /api/tareas/:id/etiquetas
router.post('/:id/etiquetas', ctrl.agregarEtiqueta);

// DELETE /api/tareas/:id/etiquetas/:idEtiq
router.delete('/:id/etiquetas/:idEtiq', ctrl.quitarEtiqueta);

module.exports = router;
