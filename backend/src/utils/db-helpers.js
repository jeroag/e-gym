import pool from '../db.js'

/**
 * Comprueba si `clientId` pertenece a `trainerId`.
 * Devuelve true/false sin lanzar errores de negocio.
 */
export async function isMyClient(trainerId, clientId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM users WHERE id = $1 AND trainer_id = $2 AND role = 'client'`,
    [clientId, trainerId]
  )
  return rows.length > 0
}

/**
 * Añade un JTI a la lista negra de tokens revocados.
 * @param {string} jti  - JWT ID único del token
 * @param {Date}   expiresAt - fecha en que el token expira (para GC automático)
 */
export async function addRevokedToken(jti, expiresAt) {
  await pool.query(
    `INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [jti, expiresAt]
  )
}

/**
 * Devuelve true si el JTI está en la lista negra (token revocado).
 */
export async function isTokenRevoked(jti) {
  const { rows } = await pool.query(
    `SELECT 1 FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()`,
    [jti]
  )
  return rows.length > 0
}

/**
 * Borra tokens expirados (limpieza de tabla). Llamar periódicamente.
 */
export async function purgeExpiredTokens() {
  await pool.query(`DELETE FROM revoked_tokens WHERE expires_at <= NOW()`)
}
