// src/services/auth.service.js
const pool = require('../config/db');

/**
 * Busca un usuario por email con sus roles
 */
async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.email, u.password, u.nombre, u.activo,
            GROUP_CONCAT(r.nombre_rol) AS roles
     FROM   usuario u
     LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
     LEFT JOIN rol r          ON r.id_rol      = ur.id_rol
     WHERE  u.email = ?
     GROUP  BY u.id_usuario`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Crea un nuevo usuario y le asigna el rol 'Developer' por defecto
 */
async function createUser({ email, passwordHash, nombre, telefono, ciudad }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO usuario (email, password, nombre, telefono, ciudad)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, nombre, telefono || null, ciudad || null]
    );
    const id_usuario = result.insertId;

    // Asignar rol Developer (id_rol = 3) por defecto
    await conn.query(
      `INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, 3)`,
      [id_usuario]
    );

    await conn.commit();
    return { id_usuario, email, nombre };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { findByEmail, createUser };
