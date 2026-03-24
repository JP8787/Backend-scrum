// src/controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const svc     = require('../services/auth.service');
const R       = require('../utils/response');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { email, password, nombre, telefono, ciudad } = req.body;

    if (!email || !password || !nombre)
      return R.badRequest(res, 'email, password y nombre son obligatorios');

    // Validar contraseña: mínimo 8 chars, 1 número, 1 mayúscula (criterio del backlog)
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwdRegex.test(password))
      return R.badRequest(res, 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');

    const existe = await svc.findByEmail(email);
    if (existe)
      return R.badRequest(res, 'El correo ya está registrado');

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await svc.createUser({ email, passwordHash, nombre, telefono, ciudad });

    return R.created(res, { mensaje: 'Usuario registrado correctamente', usuario });
  } catch (err) {
    return R.serverError(res, err);
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return R.badRequest(res, 'email y password son obligatorios');

    const usuario = await svc.findByEmail(email);
    if (!usuario || !usuario.activo)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const roles = usuario.roles ? usuario.roles.split(',') : [];
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, nombre: usuario.nombre, roles },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return R.ok(res, { token, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email, roles } });
  } catch (err) {
    return R.serverError(res, err);
  }
}

module.exports = { register, login };
