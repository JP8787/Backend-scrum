// src/controllers/tarea.controller.js
const svc = require('../services/tarea.service');
const R   = require('../utils/response');

const ESTADOS_VALIDOS = ['por_hacer', 'en_progreso', 'terminado', 'bloqueado'];

// ── Tareas ────────────────────────────────────────────────────────────

async function listar(req, res) {
  try {
    const { id_historia, id_sprint } = req.query;
    if (!id_historia && !id_sprint)
      return R.badRequest(res, 'Se requiere id_historia o id_sprint como query param');
    return R.ok(res, await svc.findAll({ id_historia, id_sprint }));
  } catch (err) { return R.serverError(res, err); }
}

async function obtener(req, res) {
  try {
    const t = await svc.findById(req.params.id);
    return t ? R.ok(res, t) : R.notFound(res, 'Tarea no encontrada');
  } catch (err) { return R.serverError(res, err); }
}

async function crear(req, res) {
  try {
    const { id_historia, nombre } = req.body;
    if (!id_historia || !nombre)
      return R.badRequest(res, 'id_historia y nombre son obligatorios');
    return R.created(res, await svc.create(req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function actualizar(req, res) {
  try {
    const t = await svc.findById(req.params.id);
    if (!t) return R.notFound(res, 'Tarea no encontrada');
    return R.ok(res, await svc.update(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

/**
 * PATCH /api/tareas/:id/estado
 * Body: { estado: 'en_progreso' }
 * Este es el endpoint del drag & drop del tablero Kanban.
 * Actualiza el estado, registra en historial y genera notificaciones.
 */
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado))
      return R.badRequest(res, `Estado inválido. Valores: ${ESTADOS_VALIDOS.join(', ')}`);

    const t = await svc.findById(req.params.id);
    if (!t) return R.notFound(res, 'Tarea no encontrada');

    return R.ok(res, await svc.cambiarEstado(req.params.id, estado, req.usuario.id_usuario));
  } catch (err) { return R.serverError(res, err); }
}

async function eliminar(req, res) {
  try {
    const t = await svc.findById(req.params.id);
    if (!t) return R.notFound(res, 'Tarea no encontrada');
    await svc.remove(req.params.id);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

// ── Asignados ─────────────────────────────────────────────────────────

async function listarAsignados(req, res) {
  try {
    return R.ok(res, await svc.findAsignados(req.params.id));
  } catch (err) { return R.serverError(res, err); }
}

async function asignarUsuario(req, res) {
  try {
    const { id_usuario, es_responsable } = req.body;
    if (!id_usuario) return R.badRequest(res, 'id_usuario es requerido');
    await svc.asignarUsuario(req.params.id, id_usuario, es_responsable);
    return R.created(res, { mensaje: 'Usuario asignado a la tarea' });
  } catch (err) { return R.serverError(res, err); }
}

async function quitarUsuario(req, res) {
  try {
    await svc.quitarUsuario(req.params.id, req.params.idUser);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

// ── Historial ─────────────────────────────────────────────────────────

async function historial(req, res) {
  try {
    return R.ok(res, await svc.findHistorial(req.params.id));
  } catch (err) { return R.serverError(res, err); }
}

// ── Comentarios ───────────────────────────────────────────────────────

async function listarComentarios(req, res) {
  try {
    return R.ok(res, await svc.findComentarios(req.params.id));
  } catch (err) { return R.serverError(res, err); }
}

async function crearComentario(req, res) {
  try {
    const { comentario } = req.body;
    if (!comentario) return R.badRequest(res, 'El comentario no puede estar vacío');
    return R.created(res, await svc.createComentario(
      req.params.id, req.usuario.id_usuario, comentario
    ));
  } catch (err) { return R.serverError(res, err); }
}

// ── Etiquetas ─────────────────────────────────────────────────────────

async function agregarEtiqueta(req, res) {
  try {
    const { id_etiqueta } = req.body;
    if (!id_etiqueta) return R.badRequest(res, 'id_etiqueta es requerido');
    await svc.addEtiqueta(req.params.id, id_etiqueta);
    return R.created(res, { mensaje: 'Etiqueta agregada' });
  } catch (err) { return R.serverError(res, err); }
}

async function quitarEtiqueta(req, res) {
  try {
    await svc.removeEtiqueta(req.params.id, req.params.idEtiq);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

module.exports = {
  listar, obtener, crear, actualizar, cambiarEstado, eliminar,
  listarAsignados, asignarUsuario, quitarUsuario,
  historial,
  listarComentarios, crearComentario,
  agregarEtiqueta, quitarEtiqueta,
};
