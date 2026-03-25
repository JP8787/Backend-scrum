// src/services/sprint.service.js
const pool = require('../config/db');

// ── Sprints ────────────────────────────────────────────────────────────

async function findAll(id_proyecto) {
  const [rows] = await pool.query(
    `SELECT s.*,
            COUNT(DISTINCT sh.id_historia) AS total_historias,
            SUM(h.story_points)            AS story_points_total
     FROM   sprint s
     LEFT JOIN sprint_historia sh ON sh.id_sprint = s.id_sprint
     LEFT JOIN historia_usuario h  ON h.id_historia = sh.id_historia
     WHERE  s.id_proyecto = ?
     GROUP  BY s.id_sprint
     ORDER  BY s.fecha_inicio ASC`,
    [id_proyecto]
  );
  return rows;
}

async function findById(id_sprint) {
  const [rows] = await pool.query(
    `SELECT s.*,
            COUNT(DISTINCT sh.id_historia) AS total_historias,
            SUM(h.story_points)            AS story_points_total
     FROM   sprint s
     LEFT JOIN sprint_historia sh ON sh.id_sprint = s.id_sprint
     LEFT JOIN historia_usuario h  ON h.id_historia = sh.id_historia
     WHERE  s.id_sprint = ?
     GROUP  BY s.id_sprint`,
    [id_sprint]
  );
  if (!rows[0]) return null;

  // Traer las historias asignadas al sprint
  const [historias] = await pool.query(
    `SELECT h.id_historia, h.nombre, h.estado, h.prioridad,
            h.story_points, h.estimacion_dias,
            e.nombre AS epica_nombre
     FROM   sprint_historia sh
     JOIN   historia_usuario h ON h.id_historia = sh.id_historia
     JOIN   epica e            ON e.id_epica     = h.id_epica
     WHERE  sh.id_sprint = ?
     ORDER  BY h.prioridad ASC`,
    [id_sprint]
  );

  return { ...rows[0], historias };
}

async function create({ id_proyecto, nombre, meta, fecha_inicio, fecha_fin, velocidad_estimada }) {
  const [result] = await pool.query(
    `INSERT INTO sprint (id_proyecto, nombre, meta, fecha_inicio, fecha_fin, velocidad_estimada)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_proyecto, nombre, meta || null, fecha_inicio, fecha_fin, velocidad_estimada || null]
  );
  return findById(result.insertId);
}

async function update(id_sprint, { nombre, meta, fecha_inicio, fecha_fin, velocidad_estimada }) {
  const actual = await findById(id_sprint);
  if (!actual) return null;

  await pool.query(
    `UPDATE sprint SET nombre=?, meta=?, fecha_inicio=?, fecha_fin=?, velocidad_estimada=?
     WHERE id_sprint = ?`,
    [
      nombre ?? actual.nombre,
      meta ?? actual.meta,
      fecha_inicio ?? actual.fecha_inicio,
      fecha_fin ?? actual.fecha_fin,
      velocidad_estimada ?? actual.velocidad_estimada,
      id_sprint,
    ]
  );
  return findById(id_sprint);
}

async function cambiarEstado(id_sprint, estado) {
  // Si se completa, guardar velocidad real (story points terminados)
  if (estado === 'completado') {
    const [pts] = await pool.query(
      `SELECT COALESCE(SUM(h.story_points), 0) AS completados
       FROM   sprint_historia sh
       JOIN   historia_usuario h ON h.id_historia = sh.id_historia
       WHERE  sh.id_sprint = ? AND h.estado = 'terminado'`,
      [id_sprint]
    );
    await pool.query(
      `UPDATE sprint SET estado = ?, velocidad_real = ? WHERE id_sprint = ?`,
      [estado, pts[0].completados, id_sprint]
    );
  } else {
    await pool.query(`UPDATE sprint SET estado = ? WHERE id_sprint = ?`, [estado, id_sprint]);
  }
  return findById(id_sprint);
}

async function remove(id_sprint) {
  await pool.query(`DELETE FROM sprint WHERE id_sprint = ?`, [id_sprint]);
}

// ── Historias del sprint ───────────────────────────────────────────────

async function asignarHistoria(id_sprint, id_historia) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Insertar en tabla pivot
    await conn.query(
      `INSERT IGNORE INTO sprint_historia (id_sprint, id_historia) VALUES (?, ?)`,
      [id_sprint, id_historia]
    );
    // Actualizar FK en historia_usuario
    await conn.query(
      `UPDATE historia_usuario SET id_sprint = ? WHERE id_historia = ?`,
      [id_sprint, id_historia]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function quitarHistoria(id_sprint, id_historia) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `DELETE FROM sprint_historia WHERE id_sprint = ? AND id_historia = ?`,
      [id_sprint, id_historia]
    );
    await conn.query(
      `UPDATE historia_usuario SET id_sprint = NULL WHERE id_historia = ? AND id_sprint = ?`,
      [id_historia, id_sprint]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── Progreso del sprint (para el tablero Kanban) ──────────────────────

async function getProgreso(id_sprint) {
  const [rows] = await pool.query(
    `SELECT
       SUM(CASE WHEN t.estado = 'por_hacer'   THEN 1 ELSE 0 END) AS por_hacer,
       SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
       SUM(CASE WHEN t.estado = 'terminado'   THEN 1 ELSE 0 END) AS terminado,
       SUM(CASE WHEN t.estado = 'bloqueado'   THEN 1 ELSE 0 END) AS bloqueado,
       COUNT(t.id_tarea)                                         AS total_tareas,
       ROUND(
         SUM(CASE WHEN t.estado = 'terminado' THEN 1 ELSE 0 END)
         / NULLIF(COUNT(t.id_tarea), 0) * 100, 1
       ) AS porcentaje_completado
     FROM   sprint_historia sh
     JOIN   historia_usuario h ON h.id_historia = sh.id_historia
     JOIN   tarea t            ON t.id_historia = h.id_historia
     WHERE  sh.id_sprint = ?`,
    [id_sprint]
  );
  return rows[0];
}

module.exports = {
  findAll, findById, create, update, cambiarEstado, remove,
  asignarHistoria, quitarHistoria, getProgreso,
};
