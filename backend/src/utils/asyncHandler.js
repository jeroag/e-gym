/**
 * Envuelve un route handler async y pasa cualquier error lanzado a next(),
 * evitando tener que escribir try/catch en cada ruta.
 *
 * Uso:
 *   router.get('/ruta', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
