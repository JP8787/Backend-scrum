// src/services/historia.service.js
const pool = require('../config/db');

// ── Historias ─────────────────────────────────────────────────────────

async function findAll({ id_epica, id_sprint }) {
  let where = '1=1';
  const params = [];

  if (id_epica) { where += ' AND h.id_epica = ?';  params.push(id_epica); }
  if (id_sprint) { where += ' AND h.id_sprint = ?'; params.push(id_sprint); }

  const [rows] = await pool.query(
    `SELECT h.*,
            e.nombre   AS epica_nombre,
            s.nombre   AS sprint_nombre,
            COUNT(c.id_criterio) AS total_criterios,
            SUM(c.cumplido)      AS criterios_cumplidos
     FROM   historia_usuario h
     JOIN   epica e ON e.id_epica = h.id_epica
     LEFT JOIN sprint s          ON s.id_sprint = h.id_sprint
     LEFT JOIN criterio_aceptacion c ON c.id_historia = h.id_historia
     WHERE  ${where}
     GROUP  BY h.id_historia
     ORDER  BY h.prioridad ASC, h.fecha_creacion ASC`,
    params
  );
  return rows;
}

async function findById(id_historia) {
  const [rows] = await pool.query(
    `SELECT h.*,
            e.nombre AS epica_nombre,
            s.nombre AS sprint_nombre
     FROM   historia_usuario h
     JOIN   epica e ON e.id_epica = h.id_epica
     LEFT JOIN sprint s ON s.id_sprint = h.id_sprint
     WHERE  h.id_historia = ?`,
    [id_historia]
  );
  if (!rows[0]) return null;

  // Traer criterios de aceptación junto con la historia
  const criterios = await findCriterios(id_historia);
  return { ...rows[0], criterios };
}

async function create(datos) {
  const { id_epica, nombre, descripcion, como_quien, quiero, para,
          prioridad, story_points, estimacion_dias } = datos;

  const [result] = await pool.query(
    `INSERT INTO historia_usuario
       (id_epica, nombre, descripcion, como_quien, quiero, para,
        prioridad, story_points, estimacion_dias)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_epica, nombre, descripcion || null, como_quien || null,
     quiero || null, para || null,
     prioridad || 3, story_points || null, estimacion_dias || null]
  );
  return findById(result.insertId);
}

async function update(id_historia, datos) {
  const { nombre, descripcion, como_quien, quiero, para,
          prioridad, story_points, estimacion_dias, estado, id_sprint } = datos;

  await pool.query(
    `UPDATE historia_usuario
     SET nombre=?, descripcion=?, como_quien=?, quiero=?, para=?,
         prioridad=?, story_points=?, estimacion_dias=?, estado=?, id_sprint=?
     WHERE id_historia = ?`,
    [nombre, descripcion, como_quien, quiero, para,
     prioridad, story_points, estimacion_dias, estado, id_sprint || null,
     id_historia]
  );
  return findById(id_historia);
}

async function remove(id_historia) {
  await pool.query(`DELETE FROM historia_usuario WHERE id_historia = ?`, [id_historia]);
}

// ── Criterios de aceptación ───────────────────────────────────────────

async function findCriterios(id_historia) {
  const [rows] = await pool.query(
    `SELECT * FROM criterio_aceptacion WHERE id_historia = ? ORDER BY id_criterio ASC`,
    [id_historia]
  );
  return rows;
}

async function createCriterio(id_historia, descripcion) {
  const [result] = await pool.query(
    `INSERT INTO criterio_aceptacion (id_historia, descripcion) VALUES (?, ?)`,
    [id_historia, descripcion]
  );
  const [rows] = await pool.query(
    `SELECT * FROM criterio_aceptacion WHERE id_criterio = ?`, [result.insertId]
  );
  return rows[0];
}

async function toggleCriterio(id_criterio) {
  await pool.query(
    `UPDATE criterio_aceptacion
     SET cumplido = NOT cumplido
     WHERE id_criterio = ?`,
    [id_criterio]
  );
  const [rows] = await pool.query(
    `SELECT * FROM criterio_aceptacion WHERE id_criterio = ?`, [id_criterio]
  );
  return rows[0];
}

async function removeCriterio(id_criterio) {
  await pool.query(`DELETE FROM criterio_aceptacion WHERE id_criterio = ?`, [id_criterio]);
}

// ── Comentarios ───────────────────────────────────────────────────────

async function findComentarios(id_historia) {
  const [rows] = await pool.query(
    `SELECT ch.*, u.nombre AS autor
     FROM   comentario_historia ch
     JOIN   usuario u ON u.id_usuario = ch.id_usuario
     WHERE  ch.id_historia = ?
     ORDER  BY ch.fecha ASC`,
    [id_historia]
  );
  return rows;
}

async function createComentario(id_historia, id_usuario, comentario) {
  const [result] = await pool.query(
    `INSERT INTO comentario_historia (id_historia, id_usuario, comentario)
     VALUES (?, ?, ?)`,
    [id_historia, id_usuario, comentario]
  );
  const [rows] = await pool.query(
    `SELECT ch.*, u.nombre AS autor
     FROM   comentario_historia ch
     JOIN   usuario u ON u.id_usuario = ch.id_usuario
     WHERE  ch.id_comentario = ?`,
    [result.insertId]
  );
  return rows[0];
}

module.exports = {
  findAll, findById, create, update, remove,
  findCriterios, createCriterio, toggleCriterio, removeCriterio,
  findComentarios, createComentario,
};
