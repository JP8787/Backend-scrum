// src/controllers/sprint.controller.js
const svc = require('../services/sprint.service');
const R   = require('../utils/response');

async function listar(req, res) {
  try {
    const { id_proyecto } = req.query;
    if (!id_proyecto) return R.badRequest(res, 'Se requiere id_proyecto como query param');
    return R.ok(res, await svc.findAll(id_proyecto));
  } catch (err) { return R.serverError(res, err); }
}

async function obtener(req, res) {
  try {
    const s = await svc.findById(req.params.id);
    return s ? R.ok(res, s) : R.notFound(res, 'Sprint no encontrado');
  } catch (err) { return R.serverError(res, err); }
}

async function crear(req, res) {
  try {
    const { id_proyecto, nombre, fecha_inicio, fecha_fin } = req.body;
    if (!id_proyecto || !nombre || !fecha_inicio || !fecha_fin)
      return R.badRequest(res, 'id_proyecto, nombre, fecha_inicio y fecha_fin son obligatorios');
    return R.created(res, await svc.create(req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function actualizar(req, res) {
  try {
    const s = await svc.findById(req.params.id);
    if (!s) return R.notFound(res, 'Sprint no encontrado');
    if (s.estado === 'completado')
      return R.badRequest(res, 'No se puede editar un sprint completado');
    return R.ok(res, await svc.update(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    const estadosValidos = ['planeado', 'en_curso', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado))
      return R.badRequest(res, `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`);

    const s = await svc.findById(req.params.id);
    if (!s) return R.notFound(res, 'Sprint no encontrado');

    return R.ok(res, await svc.cambiarEstado(req.params.id, estado));
  } catch (err) { return R.serverError(res, err); }
}

async function eliminar(req, res) {
  try {
    const s = await svc.findById(req.params.id);
    if (!s) return R.notFound(res, 'Sprint no encontrado');
    if (s.estado !== 'planeado')
      return R.badRequest(res, 'Solo se pueden eliminar sprints en estado planeado');
    await svc.remove(req.params.id);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

async function asignarHistoria(req, res) {
  try {
    const { id_historia } = req.body;
    if (!id_historia) return R.badRequest(res, 'id_historia es requerido');
    await svc.asignarHistoria(req.params.id, id_historia);
    return R.created(res, { mensaje: 'Historia asignada al sprint' });
  } catch (err) { return R.serverError(res, err); }
}

async function quitarHistoria(req, res) {
  try {
    await svc.quitarHistoria(req.params.id, req.params.idHist);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

async function progreso(req, res) {
  try {
    const s = await svc.findById(req.params.id);
    if (!s) return R.notFound(res, 'Sprint no encontrado');
    return R.ok(res, await svc.getProgreso(req.params.id));
  } catch (err) { return R.serverError(res, err); }
}

module.exports = {
  listar, obtener, crear, actualizar, cambiarEstado, eliminar,
  asignarHistoria, quitarHistoria, progreso,
};
