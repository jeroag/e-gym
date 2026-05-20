import { Router } from 'express'
import pool from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isMyClient } from '../utils/db-helpers.js'

const router = Router()

// GET /api/schedule/client/:clientId — entrenador ve la semana del cliente
router.get('/client/:clientId', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  if (!(await isMyClient(req.user.id, req.params.clientId))) {
    return res.status(403).json({ error: 'Cliente no autorizado' })
  }
  const { rows } = await pool.query(
    `SELECT ws.id, ws.day_of_week, ws.workout_id,
            w.name AS workout_name, w.description
     FROM workout_schedule ws
     JOIN workouts w ON w.id = ws.workout_id
     WHERE ws.client_id = $1
     ORDER BY ws.day_of_week`,
    [req.params.clientId]
  )
  res.json(rows)
}))

// PUT /api/schedule/client/:clientId — entrenador asigna/sobrescribe un día
// body: { day_of_week: 0-6, workout_id: uuid | null }
router.put('/client/:clientId', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  if (!(await isMyClient(req.user.id, req.params.clientId))) {
    return res.status(403).json({ error: 'Cliente no autorizado' })
  }
  const { day_of_week, workout_id } = req.body
  if (day_of_week == null || day_of_week < 0 || day_of_week > 6) {
    return res.status(400).json({ error: 'day_of_week debe ser 0-6' })
  }

  if (!workout_id) {
    // Borrar asignación del día
    await pool.query(
      `DELETE FROM workout_schedule WHERE client_id = $1 AND day_of_week = $2`,
      [req.params.clientId, day_of_week]
    )
    return res.json({ message: 'Día despejado' })
  }

  // Verificar que la rutina pertenezca al cliente (o sea del entrenador)
  const { rows: wRows } = await pool.query(
    `SELECT id FROM workouts WHERE id = $1 AND (client_id = $2 OR trainer_id = $3)`,
    [workout_id, req.params.clientId, req.user.id]
  )
  if (!wRows.length) return res.status(404).json({ error: 'Rutina no encontrada' })

  const { rows } = await pool.query(
    `INSERT INTO workout_schedule (trainer_id, client_id, workout_id, day_of_week)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (client_id, day_of_week)
     DO UPDATE SET workout_id = EXCLUDED.workout_id, trainer_id = EXCLUDED.trainer_id
     RETURNING *`,
    [req.user.id, req.params.clientId, workout_id, day_of_week]
  )
  res.json(rows[0])
}))

// GET /api/schedule/my — cliente ve su propia semana
router.get('/my', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ws.id, ws.day_of_week, ws.workout_id,
            w.name AS workout_name, w.description,
            json_agg(json_build_object(
              'id', we.id, 'sets', we.sets, 'reps', we.reps, 'rest_secs', we.rest_secs,
              'order_index', we.order_index, 'notes', we.notes,
              'exercise', json_build_object('id', e.id, 'name', e.name, 'muscle_group', e.muscle_group, 'video_url', e.video_url)
            ) ORDER BY we.order_index) FILTER (WHERE we.id IS NOT NULL) AS exercises
     FROM workout_schedule ws
     JOIN workouts w ON w.id = ws.workout_id
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     LEFT JOIN exercises e ON e.id = we.exercise_id
     WHERE ws.client_id = $1
     GROUP BY ws.id, ws.day_of_week, ws.workout_id, w.name, w.description
     ORDER BY ws.day_of_week`,
    [req.user.id]
  )
  res.json(rows)
}))

export default router
