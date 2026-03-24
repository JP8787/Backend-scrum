// src/controllers/proyecto.controller.js
const svc = require('../services/proyecto.service');
const R   = require('../utils/response');

async function listar(req, res) {
  try { return R.ok(res, await svc.findAll(req.usuario.id_usuario)); }
  catch (err) { return R.serverError(res, err); }
}

async function obtener(req, res) {
  try {
    const p = await svc.findById(req.params.id);
    return p ? R.ok(res, p) : R.notFound(res, 'Proyecto no encontrado');
  } catch (err) { return R.serverError(res, err); }
}

async function crear(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre) return R.badRequest(res, 'El nombre del proyecto es obligatorio');
    return R.created(res, await svc.create(req.body, req.usuario.id_usuario));
  } catch (err) { return R.serverError(res, err); }
}

async function actualizar(req, res) {
  try {
    const p = await svc.findById(req.params.id);
    if (!p) return R.notFound(res, 'Proyecto no encontrado');
    return R.ok(res, await svc.update(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function eliminar(req, res) {
  try {
    const p = await svc.findById(req.params.id);
    if (!p) return R.notFound(res, 'Proyecto no encontrado');
    await svc.remove(req.params.id);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

async function listarEquipo(req, res) {
  try { return R.ok(res, await svc.findEquipo(req.params.id)); }
  catch (err) { return R.serverError(res, err); }
}

async function agregarMiembro(req, res) {
  try {
    const { id_usuario, id_rol } = req.body;
    if (!id_usuario || !id_rol) return R.badRequest(res, 'id_usuario e id_rol son requeridos');
    await svc.addMiembro(req.params.id, id_usuario, id_rol);
    return R.created(res, { mensaje: 'Miembro agregado al equipo' });
  } catch (err) { return R.serverError(res, err); }
}

async function quitarMiembro(req, res) {
  try {
    await svc.removeMiembro(req.params.id, req.params.idUsuario);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, listarEquipo, agregarMiembro, quitarMiembro };
