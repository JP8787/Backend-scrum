// src/services/usuario.service.js
const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.email, u.nombre, u.telefono, u.ciudad, u.activo, u.fecha_registro,
            GROUP_CONCAT(r.nombre_rol) AS roles
     FROM   usuario u
     LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
     LEFT JOIN rol r          ON r.id_rol      = ur.id_rol
     GROUP  BY u.id_usuario`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.email, u.nombre, u.telefono, u.ciudad, u.activo, u.fecha_registro,
            GROUP_CONCAT(r.nombre_rol) AS roles
     FROM   usuario u
     LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
     LEFT JOIN rol r          ON r.id_rol      = ur.id_rol
     WHERE  u.id_usuario = ?
     GROUP  BY u.id_usuario`,
    [id]
  );
  return rows[0] || null;
}

async function update(id, { nombre, telefono, ciudad }) {
  const actual = await findById(id);
  if (!actual) return null;

  await pool.query(
    `UPDATE usuario SET nombre = ?, telefono = ?, ciudad = ? WHERE id_usuario = ?`,
    [
      nombre ?? actual.nombre,
      telefono ?? actual.telefono,
      ciudad ?? actual.ciudad,
      id,
    ]
  );
  return findById(id);
}

// ── Perfil ──────────────────────────────────────────────────
async function findPerfil(id_usuario) {
  const [rows] = await pool.query(
    `SELECT * FROM perfil_usuario WHERE id_usuario = ?`, [id_usuario]
  );
  return rows[0] || null;
}

async function upsertPerfil(id_usuario, datos) {
  const { descripcion_personal, experiencia, portafolio_url, foto_perfil_url, visibilidad } = datos;
  await pool.query(
    `INSERT INTO perfil_usuario (id_usuario, descripcion_personal, experiencia, portafolio_url, foto_perfil_url, visibilidad)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       descripcion_personal = VALUES(descripcion_personal),
       experiencia          = VALUES(experiencia),
       portafolio_url       = VALUES(portafolio_url),
       foto_perfil_url      = VALUES(foto_perfil_url),
       visibilidad          = VALUES(visibilidad)`,
    [id_usuario, descripcion_personal, experiencia, portafolio_url, foto_perfil_url, visibilidad || 'publico']
  );
  return findPerfil(id_usuario);
}

// ── Habilidades ─────────────────────────────────────────────
async function findHabilidades(id_usuario) {
  const [rows] = await pool.query(
    `SELECT h.id_habilidad, h.nombre, h.categoria, uh.nivel
     FROM   usuario_habilidad uh
     JOIN   habilidad h ON h.id_habilidad = uh.id_habilidad
     WHERE  uh.id_usuario = ?`,
    [id_usuario]
  );
  return rows;
}

async function addHabilidad(id_usuario, id_habilidad, nivel) {
  await pool.query(
    `INSERT IGNORE INTO usuario_habilidad (id_usuario, id_habilidad, nivel) VALUES (?, ?, ?)`,
    [id_usuario, id_habilidad, nivel || null]
  );
}

async function removeHabilidad(id_usuario, id_habilidad) {
  await pool.query(
    `DELETE FROM usuario_habilidad WHERE id_usuario = ? AND id_habilidad = ?`,
    [id_usuario, id_habilidad]
  );
}

// ── Notificaciones ──────────────────────────────────────────
async function findNotificaciones(id_usuario) {
  const [rows] = await pool.query(
    `SELECT * FROM notificacion WHERE id_usuario = ? ORDER BY fecha_creacion DESC`,
    [id_usuario]
  );
  return rows;
}

async function marcarLeida(id_notificacion, id_usuario) {
  await pool.query(
    `UPDATE notificacion SET leida = 1
     WHERE id_notificacion = ? AND id_usuario = ?`,
    [id_notificacion, id_usuario]
  );
}

module.exports = {
  findAll, findById, update,
  findPerfil, upsertPerfil,
  findHabilidades, addHabilidad, removeHabilidad,
  findNotificaciones, marcarLeida,
};
