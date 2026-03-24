// src/controllers/usuario.controller.js
const svc = require('../services/usuario.service');
const R   = require('../utils/response');

async function listar(req, res) {
  try { return R.ok(res, await svc.findAll()); }
  catch (err) { return R.serverError(res, err); }
}

async function obtener(req, res) {
  try {
    const u = await svc.findById(req.params.id);
    return u ? R.ok(res, u) : R.notFound(res, 'Usuario no encontrado');
  } catch (err) { return R.serverError(res, err); }
}

async function actualizar(req, res) {
  try {
    // Solo el mismo usuario puede editar su perfil
    if (String(req.usuario.id_usuario) !== String(req.params.id))
      return res.status(403).json({ error: 'Solo puedes editar tu propio perfil' });
    return R.ok(res, await svc.update(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function obtenerPerfil(req, res) {
  try {
    const p = await svc.findPerfil(req.params.id);
    return p ? R.ok(res, p) : R.notFound(res, 'Perfil no encontrado');
  } catch (err) { return R.serverError(res, err); }
}

async function actualizarPerfil(req, res) {
  try {
    if (String(req.usuario.id_usuario) !== String(req.params.id))
      return res.status(403).json({ error: 'Solo puedes editar tu propio perfil' });
    return R.ok(res, await svc.upsertPerfil(req.params.id, req.body));
  } catch (err) { return R.serverError(res, err); }
}

async function listarHabilidades(req, res) {
  try { return R.ok(res, await svc.findHabilidades(req.params.id)); }
  catch (err) { return R.serverError(res, err); }
}

async function agregarHabilidad(req, res) {
  try {
    const { id_habilidad, nivel } = req.body;
    if (!id_habilidad) return R.badRequest(res, 'id_habilidad es requerido');
    await svc.addHabilidad(req.params.id, id_habilidad, nivel);
    return R.created(res, { mensaje: 'Habilidad agregada' });
  } catch (err) { return R.serverError(res, err); }
}

async function quitarHabilidad(req, res) {
  try {
    await svc.removeHabilidad(req.params.id, req.params.idHab);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

async function listarNotificaciones(req, res) {
  try { return R.ok(res, await svc.findNotificaciones(req.params.id)); }
  catch (err) { return R.serverError(res, err); }
}

async function marcarLeida(req, res) {
  try {
    await svc.marcarLeida(req.params.idNot, req.params.id);
    return R.noContent(res);
  } catch (err) { return R.serverError(res, err); }
}

module.exports = {
  listar, obtener, actualizar,
  obtenerPerfil, actualizarPerfil,
  listarHabilidades, agregarHabilidad, quitarHabilidad,
  listarNotificaciones, marcarLeida,
};
