// src/utils/response.js
// Helpers para respuestas HTTP consistentes en todos los controladores

const ok      = (res, data, status = 200)  => res.status(status).json({ ok: true,  data });
const created = (res, data)                => res.status(201).json({ ok: true,  data });
const noContent = (res)                    => res.status(204).send();
const badRequest = (res, message)          => res.status(400).json({ ok: false, error: message });
const notFound   = (res, message = 'No encontrado') =>
  res.status(404).json({ ok: false, error: message });
const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
};

module.exports = { ok, created, noContent, badRequest, notFound, serverError };
