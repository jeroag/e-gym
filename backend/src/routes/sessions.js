import { Router } from 'express'
import pool        from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isMyClient } from '../utils/db-helpers.js'

const router = Router()

// GET /api/sessions/client/:clientId — historial de un cliente (entrenador)
router.get('/client/:clientId', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  if (!(await isMyClient(req.user.id, req.params.clientId))) {
    return res.status(403).json({ error: 'Cliente no autorizado' })
  }
  const { rows } = await pool.query(
    `SELECT id, workout_id, workout_name, duration_secs, sets_completed,
            perceived_effort, started_at, finished_at
     FROM workout_sessions
     WHERE client_id = $1
     ORDER BY finished_at DESC
     LIMIT 30`,
    [req.params.clientId]
  )
  res.json(rows)
}))

// POST /api/sessions — guardar sesión de entrenamiento finalizada
router.post('/', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { workout_id, workout_name, duration_secs, sets_completed, started_at, perceived_effort } = req.body

  if (!workout_name?.trim()) {
    return res.status(400).json({ error: 'workout_name es obligatorio' })
  }

  const effort = perceived_effort != null ? Math.min(3, Math.max(1, Math.floor(perceived_effort))) : null

  const { rows: [session] } = await pool.query(
    `INSERT INTO workout_sessions
       (client_id, workout_id, workout_name, duration_secs, sets_completed, perceived_effort, started_at, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING id, workout_id, workout_name, duration_secs, sets_completed, perceived_effort, started_at, finished_at`,
    [
      req.user.id,
      workout_id   ?? null,
      workout_name.trim(),
      duration_secs   != null ? Math.max(0, Math.floor(duration_secs))   : 0,
      sets_completed  != null ? Math.max(0, Math.floor(sets_completed))  : 0,
      effort,
      started_at ?? new Date()
    ]
  )

  res.status(201).json(session)
}))

// GET /api/sessions/my — historial de entrenamientos del cliente (últimas 30 sesiones)
router.get('/my', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, workout_id, workout_name, duration_secs, sets_completed,
            perceived_effort, started_at, finished_at
     FROM workout_sessions
     WHERE client_id = $1
     ORDER BY finished_at DESC
     LIMIT 30`,
    [req.user.id]
  )
  res.json(rows)
}))

export default router
