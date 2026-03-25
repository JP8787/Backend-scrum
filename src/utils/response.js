// src/utils/response.js
// Helpers para respuestas HTTP consistentes en todos los controladores

const ok      = (res, data, status = 200)  => res.status(status).json({ ok: true,  data });
const created = (res, data)                => res.status(201).json({ ok: true,  data });
const noContent = (res)                    => res.status(204).send();
const badRequest = (res, message)          => res.status(400).json({ ok: false, error: message });
const notFound   = (res, message = 'No encontrado') =>
  res.status(404).json({ ok: false, error: message });

function mapSqlError(err) {
  if (!err?.code) return null;

  const badRequestCodes = new Set([
    'ER_BAD_NULL_ERROR',
    'ER_TRUNCATED_WRONG_VALUE',
    'ER_NO_REFERENCED_ROW_2',
    'ER_NO_DEFAULT_FOR_FIELD',
  ]);

  const conflictCodes = new Set([
    'ER_DUP_ENTRY',
    'ER_ROW_IS_REFERENCED_2',
  ]);

  if (badRequestCodes.has(err.code)) {
    return { status: 400, message: 'Datos inválidos o incompletos para esta operación' };
  }

  if (conflictCodes.has(err.code)) {
    return { status: 409, message: 'La operación entra en conflicto con datos relacionados existentes' };
  }

  return null;
}

const serverError = (res, err) => {
  console.error(err);
  const mapped = mapSqlError(err);
  if (mapped) {
    return res.status(mapped.status).json({ ok: false, error: mapped.message });
  }
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
};

module.exports = { ok, created, noContent, badRequest, notFound, serverError };
