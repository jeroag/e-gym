import jwt from 'jsonwebtoken'
import pool from '../db.js'

// Verifica nuestro propio JWT firmado con JWT_SECRET (HS256) y
// carga el usuario actual desde la tabla `users`.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type === 'refresh') throw new Error('refresh token usado como access')
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  const { rows } = await pool.query(
    'SELECT id, email, full_name, role, trainer_id, avatar_url FROM users WHERE id = $1',
    [decoded.sub]
  )
  if (!rows.length) return res.status(401).json({ error: 'Usuario no encontrado' })

  req.user = rows[0]
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' })
    }
    next()
  }
}
