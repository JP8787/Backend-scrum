// src/controllers/historia.controller.js
const svc = require('../services/historia.service');
const R   = require('../utils/response');

// ── Historias ─────────────────────────────────────────────────────────

async function listar(req, res) {
  try {
    const { id_epica, id_sprint } = req.query;
    if (!id_epica && !id_sprint)
      return R.badRequest(res, 'Se requiere id_epica o id_sprint como query param');
    return R.ok(res, await svc.findAll({ id_epica, id_sprint }));
  } catch (err) { return R.serverError(res, err); }
}

async function obtener(req, res) {
  try {
    const h = await svc.findById(req.params.id);
    return h ? R.ok(res, h) : R.notFound(res, 'Historia no encontrada');
  } catch (err) { return R.serverError(res, err); }
}

async function crear(req, res) {
  try {
    const { id_epica, nombre } = req.body;
    if (!id_epica || !nombre)
      return R.badRequest(res, 'id_epica y nombre son obligatorios');
    return R.created(res, await svc.create(req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function actualizar(req, res) {
  try {
    const h = await svc.findById(req.params.id);
    if (!h) return R.notFound(res, 'Historia no encontrada');
    return R.ok(res, await svc.update(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function eliminar(req, res) {
  try {
    const h = await svc.findById(req.params.id);
    if (!h) return R.notFound(res, 'Historia no encontrada');
    await svc.remove(req.params.id);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

// ── Criterios ─────────────────────────────────────────────────────────

async function listarCriterios(req, res) {
  try {
    return R.ok(res, await svc.findCriterios(req.params.id));
  } catch (err) { return R.serverError(res, err); }
}

async function crearCriterio(req, res) {
  try {
    const { descripcion } = req.body;
    if (!descripcion) return R.badRequest(res, 'descripcion es obligatoria');
    return R.created(res, await svc.createCriterio(req.params.id, descripcion));
  } catch (err) { return R.serverError(res, err); }
}

async function toggleCriterio(req, res) {
  try {
    return R.ok(res, await svc.toggleCriterio(req.params.idCrit));
  } catch (err) { return R.serverError(res, err); }
}

async function eliminarCriterio(req, res) {
  try {
    await svc.removeCriterio(req.params.idCrit);
    return R.noContent(res);
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

module.exports = {
  listar, obtener, crear, actualizar, eliminar,
  listarCriterios, crearCriterio, toggleCriterio, eliminarCriterio,
  listarComentarios, crearComentario,
};
