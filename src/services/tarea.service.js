// src/services/tarea.service.js
const pool = require('../config/db');

// ── Tareas ────────────────────────────────────────────────────────────

async function findAll({ id_historia, id_sprint }) {
  let joins  = '';
  let where  = '1=1';
  const params = [];

  if (id_sprint) {
    // Traer todas las tareas de todas las historias del sprint
    joins += ' JOIN sprint_historia sh ON sh.id_historia = t.id_historia';
    where += ' AND sh.id_sprint = ?';
    params.push(id_sprint);
  }

  if (id_historia) {
    where += ' AND t.id_historia = ?';
    params.push(id_historia);
  }

  const [rows] = await pool.query(
    `SELECT t.*,
            h.nombre  AS historia_nombre,
            GROUP_CONCAT(u.nombre) AS asignados
     FROM   tarea t
     JOIN   historia_usuario h ON h.id_historia = t.id_historia
     ${joins}
     LEFT JOIN tarea_usuario tu ON tu.id_tarea   = t.id_tarea
     LEFT JOIN usuario u        ON u.id_usuario  = tu.id_usuario
     WHERE  ${where}
     GROUP  BY t.id_tarea
     ORDER  BY t.estado ASC, t.orden_columna ASC, t.prioridad ASC`,
    params
  );
  return rows;
}

async function findById(id_tarea) {
  const [rows] = await pool.query(
    `SELECT t.*, h.nombre AS historia_nombre
     FROM   tarea t
     JOIN   historia_usuario h ON h.id_historia = t.id_historia
     WHERE  t.id_tarea = ?`,
    [id_tarea]
  );
  if (!rows[0]) return null;

  const [asignados] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.email, tu.es_responsable
     FROM   tarea_usuario tu
     JOIN   usuario u ON u.id_usuario = tu.id_usuario
     WHERE  tu.id_tarea = ?`,
    [id_tarea]
  );

  const [etiquetas] = await pool.query(
    `SELECT e.*
     FROM   tarea_etiqueta te
     JOIN   etiqueta e ON e.id_etiqueta = te.id_etiqueta
     WHERE  te.id_tarea = ?`,
    [id_tarea]
  );

  return { ...rows[0], asignados, etiquetas };
}

async function create(datos) {
  const { id_historia, nombre, descripcion, tipo, estado, prioridad,
          story_points, estimacion_dias, fecha_inicio, fecha_fin_est } = datos;

  const [result] = await pool.query(
    `INSERT INTO tarea
       (id_historia, nombre, descripcion, tipo, estado, prioridad,
        story_points, estimacion_dias, fecha_inicio, fecha_fin_est)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_historia, nombre, descripcion || null,
      tipo || 'RF', estado || 'por_hacer', prioridad || 'media',
      story_points || null, estimacion_dias || null,
      fecha_inicio || null, fecha_fin_est || null,
    ]
  );
  return findById(result.insertId);
}

async function update(id_tarea, datos) {
  const actual = await findById(id_tarea);
  if (!actual) return null;

  const { nombre, descripcion, tipo, prioridad,
          story_points, estimacion_dias, fecha_inicio, fecha_fin_est } = datos;

  await pool.query(
    `UPDATE tarea
     SET nombre=?, descripcion=?, tipo=?, prioridad=?,
         story_points=?, estimacion_dias=?, fecha_inicio=?, fecha_fin_est=?
     WHERE id_tarea = ?`,
    [
      nombre ?? actual.nombre,
      descripcion ?? actual.descripcion,
      tipo ?? actual.tipo,
      prioridad ?? actual.prioridad,
      story_points ?? actual.story_points,
      estimacion_dias ?? actual.estimacion_dias,
      fecha_inicio ?? actual.fecha_inicio,
      fecha_fin_est ?? actual.fecha_fin_est,
      id_tarea,
    ]
  );
  return findById(id_tarea);
}

/**
 * Cambia el estado de una tarea en el tablero Kanban.
 * También registra el cambio en historial_tarea y crea una notificación
 * para cada usuario asignado a la tarea.
 */
async function cambiarEstado(id_tarea, estadoNuevo, id_usuario_cambio) {
  const tarea = await findById(id_tarea);
  if (!tarea) return null;

  const estadoAnterior = tarea.estado;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Actualizar estado en tarea
    const fechaFin = estadoNuevo === 'terminado' ? new Date() : null;
    await conn.query(
      `UPDATE tarea SET estado = ?, fecha_fin_real = ? WHERE id_tarea = ?`,
      [estadoNuevo, fechaFin, id_tarea]
    );

    // 2. Registrar en historial
    await conn.query(
      `INSERT INTO historial_tarea
         (id_tarea, id_usuario, estado_anterior, estado_nuevo)
       VALUES (?, ?, ?, ?)`,
      [id_tarea, id_usuario_cambio, estadoAnterior, estadoNuevo]
    );

    // 3. Notificar a los asignados de la tarea
    if (tarea.asignados && tarea.asignados.length > 0) {
      const [asignados] = await conn.query(
        `SELECT id_usuario FROM tarea_usuario WHERE id_tarea = ?`, [id_tarea]
      );
      for (const a of asignados) {
        await conn.query(
          `INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje)
           VALUES (?, 'informativa', ?, ?)`,
          [
            a.id_usuario,
            `Tarea actualizada: ${tarea.nombre}`,
            `La tarea "${tarea.nombre}" cambió de "${estadoAnterior}" a "${estadoNuevo}".`,
          ]
        );
      }
    }

    await conn.commit();
    return findById(id_tarea);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function remove(id_tarea) {
  await pool.query(`DELETE FROM tarea WHERE id_tarea = ?`, [id_tarea]);
}

// ── Asignados ─────────────────────────────────────────────────────────

async function findAsignados(id_tarea) {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.email, tu.es_responsable, tu.fecha_asignacion
     FROM   tarea_usuario tu
     JOIN   usuario u ON u.id_usuario = tu.id_usuario
     WHERE  tu.id_tarea = ?`,
    [id_tarea]
  );
  return rows;
}

async function asignarUsuario(id_tarea, id_usuario, es_responsable) {
  await pool.query(
    `INSERT IGNORE INTO tarea_usuario (id_tarea, id_usuario, es_responsable)
     VALUES (?, ?, ?)`,
    [id_tarea, id_usuario, es_responsable ? 1 : 0]
  );
}

async function quitarUsuario(id_tarea, id_usuario) {
  await pool.query(
    `DELETE FROM tarea_usuario WHERE id_tarea = ? AND id_usuario = ?`,
    [id_tarea, id_usuario]
  );
}

// ── Historial ─────────────────────────────────────────────────────────

async function findHistorial(id_tarea) {
  const [rows] = await pool.query(
    `SELECT ht.*, u.nombre AS usuario_nombre
     FROM   historial_tarea ht
     JOIN   usuario u ON u.id_usuario = ht.id_usuario
     WHERE  ht.id_tarea = ?
     ORDER  BY ht.fecha ASC`,
    [id_tarea]
  );
  return rows;
}

// ── Comentarios ───────────────────────────────────────────────────────

async function findComentarios(id_tarea) {
  const [rows] = await pool.query(
    `SELECT ct.*, u.nombre AS autor
     FROM   comentario_tarea ct
     JOIN   usuario u ON u.id_usuario = ct.id_usuario
     WHERE  ct.id_tarea = ?
     ORDER  BY ct.fecha ASC`,
    [id_tarea]
  );
  return rows;
}

async function createComentario(id_tarea, id_usuario, comentario) {
  const [result] = await pool.query(
    `INSERT INTO comentario_tarea (id_tarea, id_usuario, comentario) VALUES (?, ?, ?)`,
    [id_tarea, id_usuario, comentario]
  );
  const [rows] = await pool.query(
    `SELECT ct.*, u.nombre AS autor
     FROM   comentario_tarea ct
     JOIN   usuario u ON u.id_usuario = ct.id_usuario
     WHERE  ct.id_comentario = ?`,
    [result.insertId]
  );
  return rows[0];
}

// ── Etiquetas ─────────────────────────────────────────────────────────

async function addEtiqueta(id_tarea, id_etiqueta) {
  await pool.query(
    `INSERT IGNORE INTO tarea_etiqueta (id_tarea, id_etiqueta) VALUES (?, ?)`,
    [id_tarea, id_etiqueta]
  );
}

async function removeEtiqueta(id_tarea, id_etiqueta) {
  await pool.query(
    `DELETE FROM tarea_etiqueta WHERE id_tarea = ? AND id_etiqueta = ?`,
    [id_tarea, id_etiqueta]
  );
}

module.exports = {
  findAll, findById, create, update, cambiarEstado, remove,
  findAsignados, asignarUsuario, quitarUsuario,
  findHistorial,
  findComentarios, createComentario,
  addEtiqueta, removeEtiqueta,
};
