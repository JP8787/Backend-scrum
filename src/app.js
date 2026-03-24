// src/app.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middlewares globales ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas por módulo ──────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/usuarios',  require('./routes/usuario.routes'));
app.use('/api/proyectos', require('./routes/proyecto.routes'));
app.use('/api/epicas',    require('./routes/epica.routes'));
app.use('/api/historias', require('./routes/historia.routes'));
app.use('/api/sprints',   require('./routes/sprint.routes'));
app.use('/api/tareas',    require('./routes/tarea.routes'));

// ── Ruta de salud ─────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Manejador de rutas no encontradas ─────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'Ruta no encontrada' })
);

// ── Manejador global de errores ───────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// ── Iniciar servidor ──────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`  Servidor corriendo en http://localhost:${PORT}`)
);

module.exports = app;
