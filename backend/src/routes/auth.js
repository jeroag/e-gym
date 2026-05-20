import { Router }  from 'express'
import bcrypt       from 'bcryptjs'
import jwt          from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import pool         from '../db.js'
import { asyncHandler }   from '../utils/asyncHandler.js'
import { addRevokedToken, isTokenRevoked } from '../utils/db-helpers.js'
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rate-limit.js'

const router = Router()

// Helpers ─────────────────────────────────────────────────
const ACCESS_TTL  = '15m'
const REFRESH_TTL = '30d'
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, jti: randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  )
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh', jti: randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TTL }
  )
}

function publicUser(row) {
  const { password_hash, ...rest } = row
  return rest
}

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
  const { full_name, email, password, role, license_code } = req.body

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }
  if (!['trainer', 'client'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  if (role === 'trainer') {
    const expected = process.env.TRAINER_LICENSE_CODE
    if (!expected) {
      return res.status(503).json({ error: 'Registro de entrenadores deshabilitado' })
    }
    if (license_code !== expected) {
      return res.status(403).json({ error: 'Código de licencia inválido' })
    }
  }

  const password_hash = await bcrypt.hash(password, 10)
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, avatar_url`,
      [email.toLowerCase().trim(), password_hash, full_name.trim(), role]
    )
    res.status(201).json({ message: 'Usuario creado correctamente', user: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese email ya está registrado' })
    }
    throw err
  }
}))

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  const { rows } = await pool.query(
    `SELECT id, email, password_hash, full_name, role, avatar_url
     FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  )
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' })

  res.json({
    access_token:  signAccess(user),
    refresh_token: signRefresh(user),
    user: publicUser(user)
  })
}))

// ── POST /api/auth/refresh ────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token requerido' })

  let decoded
  try {
    decoded = jwt.verify(refresh_token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Token expirado o inválido' })
  }

  if (decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Comprobar si el token fue revocado (logout previo)
  if (decoded.jti && await isTokenRevoked(decoded.jti)) {
    return res.status(401).json({ error: 'Token revocado' })
  }

  const { rows } = await pool.query(
    'SELECT id, role FROM users WHERE id = $1',
    [decoded.sub]
  )
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })

  // Revocar el token actual (rotación) antes de emitir uno nuevo
  if (decoded.jti) {
    const expiresAt = new Date(decoded.exp * 1000)
    await addRevokedToken(decoded.jti, expiresAt)
  }

  res.json({
    access_token:  signAccess(user),
    refresh_token: signRefresh(user)
  })
}))

// ── POST /api/auth/logout ─────────────────────────────────
// Invalida el refresh token añadiéndolo a la lista negra.
router.post('/logout', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body
  if (refresh_token) {
    try {
      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET)
      if (decoded.jti) {
        const expiresAt = new Date(decoded.exp * 1000)
        await addRevokedToken(decoded.jti, expiresAt)
      }
    } catch {
      // Token ya expirado o inválido — no hay nada que revocar
    }
  }
  res.json({ message: 'Sesión cerrada' })
}))

// ── POST /api/auth/forgot-password ───────────────────────
// TODO: implementar envío real de email con Resend/Nodemailer.
// De momento registra la petición y responde con mensaje genérico
// para no revelar si el email existe o no.
router.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  const { email } = req.body
  if (email) {
    console.log(`[forgot-password] solicitud para ${email}`)
  }
  res.json({ message: 'Si el email existe recibirás un enlace' })
})

export default router
