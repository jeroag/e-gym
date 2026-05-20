import { Router }   from 'express'
import pool          from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

// GET /api/users/peer/:id — info mínima de un usuario con el que tengo relación
router.get('/peer/:id', requireAuth, asyncHandler(async (req, res) => {
  const me      = req.user
  const otherId = req.params.id

  let allowed = false
  if (me.role === 'client' && me.trainer_id === otherId) {
    allowed = true
  } else if (me.role === 'trainer') {
    const { rows } = await pool.query(
      `SELECT 1 FROM users WHERE id = $1 AND trainer_id = $2 AND role = 'client'`,
      [otherId, me.id]
    )
    allowed = rows.length > 0
  }
  if (!allowed) return res.status(403).json({ error: 'No tienes acceso a este usuario' })

  const { rows } = await pool.query(
    `SELECT id, full_name, role, avatar_url FROM users WHERE id = $1`,
    [otherId]
  )
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(rows[0])
}))

// GET /api/users/clients — lista de clientes del entrenador autenticado (incluye last_session)
router.get('/clients', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.avatar_url, u.created_at,
            MAX(ws.finished_at) AS last_session
     FROM users u
     LEFT JOIN workout_sessions ws ON ws.client_id = u.id
     WHERE u.trainer_id = $1 AND u.role = 'client'
     GROUP BY u.id, u.full_name, u.email, u.avatar_url, u.created_at
     ORDER BY u.full_name`,
    [req.user.id]
  )
  res.json(rows)
}))

// GET /api/users/clients/:id — ficha de un cliente del entrenador
router.get('/clients/:id', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, avatar_url, phone, created_at
     FROM users WHERE id = $1 AND trainer_id = $2 AND role = 'client'`,
    [req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' })
  res.json(rows[0])
}))

// POST /api/users/clients/:id — vincular un cliente existente al entrenador
router.post('/clients/:id', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, role, trainer_id FROM users WHERE id = $1',
    [req.params.id]
  )
  const client = rows[0]
  if (!client) return res.status(404).json({ error: 'Usuario no encontrado' })
  if (client.role !== 'client') return res.status(400).json({ error: 'El usuario no es un cliente' })
  if (client.trainer_id)        return res.status(400).json({ error: 'El cliente ya tiene entrenador' })

  await pool.query(
    'UPDATE users SET trainer_id = $1 WHERE id = $2',
    [req.user.id, req.params.id]
  )
  res.json({ message: 'Cliente añadido correctamente' })
}))

// DELETE /api/users/clients/:id — desvincular un cliente
router.delete('/clients/:id', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'UPDATE users SET trainer_id = NULL WHERE id = $1 AND trainer_id = $2',
    [req.params.id, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' })
  res.json({ message: 'Cliente desvinculado' })
}))

// ── Notas privadas del entrenador ────────────────────────────────────────────

// GET /api/users/clients/:id/notes — lista de notas sobre un cliente
router.get('/clients/:id/notes', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  // Verify the client belongs to this trainer
  const { rows: check } = await pool.query(
    `SELECT 1 FROM users WHERE id = $1 AND trainer_id = $2 AND role = 'client'`,
    [req.params.id, req.user.id]
  )
  if (!check.length) return res.status(404).json({ error: 'Cliente no encontrado' })

  const { rows } = await pool.query(
    `SELECT id, content, created_at FROM trainer_notes
     WHERE trainer_id = $1 AND client_id = $2
     ORDER BY created_at DESC`,
    [req.user.id, req.params.id]
  )
  res.json(rows)
}))

// POST /api/users/clients/:id/notes — crear nota
router.post('/clients/:id/notes', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'El contenido es obligatorio' })

  // Verify the client belongs to this trainer
  const { rows: check } = await pool.query(
    `SELECT 1 FROM users WHERE id = $1 AND trainer_id = $2 AND role = 'client'`,
    [req.params.id, req.user.id]
  )
  if (!check.length) return res.status(404).json({ error: 'Cliente no encontrado' })

  const { rows } = await pool.query(
    `INSERT INTO trainer_notes (trainer_id, client_id, content)
     VALUES ($1, $2, $3) RETURNING id, content, created_at`,
    [req.user.id, req.params.id, content.trim()]
  )
  res.status(201).json(rows[0])
}))

// DELETE /api/users/clients/:id/notes/:noteId — eliminar nota
router.delete('/clients/:id/notes/:noteId', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM trainer_notes WHERE id = $1 AND trainer_id = $2 AND client_id = $3`,
    [req.params.noteId, req.user.id, req.params.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Nota no encontrada' })
  res.json({ message: 'Nota eliminada' })
}))

export default router
