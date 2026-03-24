// src/controllers/epica.controller.js
const svc = require('../services/epica.service');
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
    const e = await svc.findById(req.params.id);
    return e ? R.ok(res, e) : R.notFound(res, 'Épica no encontrada');
  } catch (err) { return R.serverError(res, err); }
}

async function crear(req, res) {
  try {
    const { id_proyecto, nombre } = req.body;
    if (!id_proyecto || !nombre) return R.badRequest(res, 'id_proyecto y nombre son obligatorios');
    return R.created(res, await svc.create(req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function actualizar(req, res) {
  try {
    const e = await svc.findById(req.params.id);
    if (!e) return R.notFound(res, 'Épica no encontrada');
    return R.ok(res, await svc.update(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function eliminar(req, res) {
  try {
    const e = await svc.findById(req.params.id);
    if (!e) return R.notFound(res, 'Épica no encontrada');
    await svc.remove(req.params.id);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
