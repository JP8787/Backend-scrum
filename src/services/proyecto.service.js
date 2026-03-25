// src/services/proyecto.service.js
const pool = require('../config/db');

async function findAll(id_usuario) {
  // Devuelve proyectos donde el usuario es miembro del equipo o creador
  const [rows] = await pool.query(
    `SELECT DISTINCT p.*,
            u.nombre AS creador_nombre
     FROM   proyecto p
     JOIN   usuario u ON u.id_usuario = p.creado_por
     LEFT JOIN equipo_proyecto ep ON ep.id_proyecto = p.id_proyecto
     LEFT JOIN usuario_equipo_proyecto uep ON uep.id_equipo_proyecto = ep.id_equipo_proyecto
     WHERE  p.creado_por = ? OR uep.id_usuario = ?`,
    [id_usuario, id_usuario]
  );
  return rows;
}

async function findById(id_proyecto) {
  const [rows] = await pool.query(
    `SELECT p.*, u.nombre AS creador_nombre
     FROM   proyecto p
     JOIN   usuario u ON u.id_usuario = p.creado_por
     WHERE  p.id_proyecto = ?`,
    [id_proyecto]
  );
  return rows[0] || null;
}

async function create(datos, id_creador) {
  const { nombre, descripcion, tipo, fecha_inicio, fecha_fin_est } = datos;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO proyecto (nombre, descripcion, tipo, estado, fecha_inicio, fecha_fin_est, creado_por)
       VALUES (?, ?, ?, 'inicio', ?, ?, ?)`,
      [nombre, descripcion || null, tipo || null, fecha_inicio || null, fecha_fin_est || null, id_creador]
    );
    const id_proyecto = result.insertId;

    // Crear equipo por defecto para el proyecto
    const [eq] = await conn.query(
      `INSERT INTO equipo_proyecto (id_proyecto, nombre, descripcion)
       VALUES (?, 'Equipo principal', 'Equipo generado automáticamente')`,
      [id_proyecto]
    );

    // Agregar al creador con rol Product Owner (id_rol = 1)
    await conn.query(
      `INSERT INTO usuario_equipo_proyecto (id_usuario, id_equipo_proyecto, id_rol)
       VALUES (?, ?, 1)`,
      [id_creador, eq.insertId]
    );

    await conn.commit();
    return findById(id_proyecto);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function update(id_proyecto, datos) {
  const actual = await findById(id_proyecto);
  if (!actual) return null;

  const { nombre, descripcion, tipo, estado, fecha_inicio, fecha_fin_est } = datos;
  await pool.query(
    `UPDATE proyecto
     SET nombre = ?, descripcion = ?, tipo = ?, estado = ?,
         fecha_inicio = ?, fecha_fin_est = ?
     WHERE id_proyecto = ?`,
    [
      nombre ?? actual.nombre,
      descripcion ?? actual.descripcion,
      tipo ?? actual.tipo,
      estado ?? actual.estado,
      fecha_inicio ?? actual.fecha_inicio,
      fecha_fin_est ?? actual.fecha_fin_est,
      id_proyecto,
    ]
  );
  return findById(id_proyecto);
}

async function remove(id_proyecto) {
  await pool.query(`DELETE FROM proyecto WHERE id_proyecto = ?`, [id_proyecto]);
}

// ── Equipo ────────────────────────────────────────────────────────────
async function findEquipo(id_proyecto) {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.email, r.nombre_rol,
            uep.fecha_ingreso, uep.activo
     FROM   equipo_proyecto ep
     JOIN   usuario_equipo_proyecto uep ON uep.id_equipo_proyecto = ep.id_equipo_proyecto
     JOIN   usuario u ON u.id_usuario = uep.id_usuario
     JOIN   rol r     ON r.id_rol     = uep.id_rol
     WHERE  ep.id_proyecto = ?`,
    [id_proyecto]
  );
  return rows;
}

async function addMiembro(id_proyecto, id_usuario, id_rol) {
  // Obtener el equipo principal del proyecto
  const [ep] = await pool.query(
    `SELECT id_equipo_proyecto FROM equipo_proyecto WHERE id_proyecto = ? LIMIT 1`,
    [id_proyecto]
  );
  if (!ep.length) throw new Error('El proyecto no tiene equipo configurado');

  await pool.query(
    `INSERT IGNORE INTO usuario_equipo_proyecto (id_usuario, id_equipo_proyecto, id_rol)
     VALUES (?, ?, ?)`,
    [id_usuario, ep[0].id_equipo_proyecto, id_rol]
  );
}

async function removeMiembro(id_proyecto, id_usuario) {
  await pool.query(
    `DELETE uep FROM usuario_equipo_proyecto uep
     JOIN equipo_proyecto ep ON ep.id_equipo_proyecto = uep.id_equipo_proyecto
     WHERE ep.id_proyecto = ? AND uep.id_usuario = ?`,
    [id_proyecto, id_usuario]
  );
}

module.exports = { findAll, findById, create, update, remove, findEquipo, addMiembro, removeMiembro };
