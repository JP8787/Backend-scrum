// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT en el header Authorization: Bearer <token>
 * Si es válido, adjunta req.usuario con { id_usuario, email, roles[] }
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Fábrica de middleware que verifica si el usuario tiene al menos uno
 * de los roles permitidos.
 * Uso: verificarRol('Product Owner', 'Scrum Master')
 */
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    const rolesUsuario = req.usuario?.roles || [];
    const tieneRol = rolesPermitidos.some(r => rolesUsuario.includes(r));
    if (!tieneRol)
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    next();
  };
}

module.exports = { verificarToken, verificarRol };
