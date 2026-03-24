// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');

// POST /api/auth/register  — registrar nuevo usuario
router.post('/register', ctrl.register);

// POST /api/auth/login     — iniciar sesión, devuelve JWT
router.post('/login', ctrl.login);

module.exports = router;
