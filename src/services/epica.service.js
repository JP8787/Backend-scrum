// src/services/epica.service.js
const pool = require('../config/db');

async function findAll(id_proyecto) {
  const [rows] = await pool.query(
    `SELECT e.*,
            COUNT(h.id_historia) AS total_historias
     FROM   epica e
     LEFT JOIN historia_usuario h ON h.id_epica = e.id_epica
     WHERE  e.id_proyecto = ?
     GROUP  BY e.id_epica
     ORDER  BY e.prioridad ASC`,
    [id_proyecto]
  );
  return rows;
}

async function findById(id_epica) {
  const [rows] = await pool.query(
    `SELECT e.*,
            COUNT(h.id_historia) AS total_historias
     FROM   epica e
     LEFT JOIN historia_usuario h ON h.id_epica = e.id_epica
     WHERE  e.id_epica = ?
     GROUP  BY e.id_epica`,
    [id_epica]
  );
  return rows[0] || null;
}

async function create({ id_proyecto, nombre, descripcion, categoria, prioridad }) {
  const [result] = await pool.query(
    `INSERT INTO epica (id_proyecto, nombre, descripcion, categoria, prioridad)
     VALUES (?, ?, ?, ?, ?)`,
    [id_proyecto, nombre, descripcion || null, categoria || null, prioridad || 3]
  );
  return findById(result.insertId);
}

async function update(id_epica, { nombre, descripcion, categoria, prioridad, estado }) {
  const actual = await findById(id_epica);
  if (!actual) return null;

  await pool.query(
    `UPDATE epica SET nombre=?, descripcion=?, categoria=?, prioridad=?, estado=?
     WHERE id_epica = ?`,
    [
      nombre ?? actual.nombre,
      descripcion ?? actual.descripcion,
      categoria ?? actual.categoria,
      prioridad ?? actual.prioridad,
      estado ?? actual.estado,
      id_epica,
    ]
  );
  return findById(id_epica);
}

async function remove(id_epica) {
  await pool.query(`DELETE FROM epica WHERE id_epica = ?`, [id_epica]);
}

module.exports = { findAll, findById, create, update, remove };
