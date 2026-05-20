import { Router }   from 'express'
import pool          from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isMyClient }   from '../utils/db-helpers.js'

const router = Router()

// POST /api/progress/log — cliente registra una serie
// Usa ON CONFLICT para upsert atómico (evita race conditions).
router.post('/log', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { workout_exercise_id, set_number, weight_kg, reps_done, notes, rpe } = req.body
  if (!workout_exercise_id || set_number == null) {
    return res.status(400).json({ error: 'workout_exercise_id y set_number son obligatorios' })
  }
  if (rpe != null && (rpe < 1 || rpe > 10)) {
    return res.status(400).json({ error: 'RPE debe ser entre 1 y 10' })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Upsert atómico: si ya existe un log hoy para esa serie, lo actualiza.
  // Requiere el índice único: idx_progress_logs_daily_upsert
  const { rows } = await pool.query(
    `INSERT INTO progress_logs (client_id, workout_exercise_id, set_number, weight_kg, reps_done, notes, rpe, logged_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (client_id, workout_exercise_id, set_number, utc_date(logged_at))
     DO UPDATE SET
       weight_kg  = EXCLUDED.weight_kg,
       reps_done  = EXCLUDED.reps_done,
       notes      = EXCLUDED.notes,
       rpe        = EXCLUDED.rpe,
       logged_at  = NOW()
     RETURNING *`,
    [req.user.id, workout_exercise_id, set_number, weight_kg ?? null, reps_done ?? null, notes ?? null, rpe ?? null]
  )

  const isNew = rows[0].logged_at === rows[0].logged_at // siempre true; usamos rowCount
  res.status(201).json(rows[0])
}))

// DELETE /api/progress/log/:id — desmarcar serie
router.delete('/log/:id', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM progress_logs WHERE id = $1 AND client_id = $2`,
    [req.params.id, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'No encontrado' })
  res.json({ message: 'Eliminado' })
}))

// GET /api/progress/today — logs de hoy del cliente
router.get('/today', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const { rows } = await pool.query(
    `SELECT id, workout_exercise_id, set_number, weight_kg, reps_done, notes, logged_at
     FROM progress_logs
     WHERE client_id = $1 AND utc_date(logged_at) = $2::date`,
    [req.user.id, today]
  )
  res.json(rows)
}))

// GET /api/progress/last/:workoutExerciseId — último log (días anteriores) para mostrar como "anterior"
router.get('/last/:workoutExerciseId', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT set_number, weight_kg, reps_done, logged_at
     FROM progress_logs
     WHERE client_id = $1 AND workout_exercise_id = $2
       AND logged_at::date < CURRENT_DATE
     ORDER BY logged_at DESC
     LIMIT 20`,
    [req.user.id, req.params.workoutExerciseId]
  )
  res.json(rows)
}))

// GET /api/progress/last-batch?ids=uuid1,uuid2,...
// Batch del endpoint anterior — resuelve N workout_exercises en una sola query.
// Evita el patrón N+1 del Dashboard del cliente.
router.get('/last-batch', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const raw = req.query.ids ?? ''
  const ids  = raw.split(',').map(s => s.trim()).filter(Boolean)

  if (!ids.length) return res.json({})

  // Validación básica de formato UUID
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (ids.some(id => !uuidRe.test(id))) {
    return res.status(400).json({ error: 'IDs inválidos' })
  }

  const { rows } = await pool.query(
    `SELECT DISTINCT ON (workout_exercise_id, set_number)
            workout_exercise_id, set_number, weight_kg, reps_done, logged_at
     FROM progress_logs
     WHERE client_id = $1
       AND workout_exercise_id = ANY($2::uuid[])
       AND logged_at::date < CURRENT_DATE
     ORDER BY workout_exercise_id, set_number, logged_at DESC`,
    [req.user.id, ids]
  )

  // Agrupar en { workout_exercise_id: [{ set_number, weight_kg, ... }] }
  const result = {}
  for (const r of rows) {
    if (!result[r.workout_exercise_id]) result[r.workout_exercise_id] = []
    result[r.workout_exercise_id].push(r)
  }
  res.json(result)
}))

// GET /api/progress/exercise/:exerciseId — historial del cliente para un ejercicio
router.get('/exercise/:exerciseId', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT pl.set_number, pl.weight_kg, pl.reps_done, pl.notes, pl.logged_at,
            e.name AS exercise_name, e.muscle_group
     FROM progress_logs pl
     JOIN workout_exercises we ON we.id = pl.workout_exercise_id
     JOIN exercises e          ON e.id = we.exercise_id
     WHERE pl.client_id = $1 AND e.id = $2
     ORDER BY pl.logged_at ASC`,
    [req.user.id, req.params.exerciseId]
  )
  res.json(rows)
}))

// GET /api/progress/personal-records — máximo peso por ejercicio del cliente (1 query, sin N+1)
router.get('/personal-records', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.id, e.name, e.muscle_group,
            MAX(pl.weight_kg)::numeric(6,2) AS max_weight
     FROM progress_logs pl
     JOIN workout_exercises we ON we.id = pl.workout_exercise_id
     JOIN exercises e          ON e.id = we.exercise_id
     WHERE pl.client_id = $1 AND pl.weight_kg IS NOT NULL AND pl.weight_kg > 0
     GROUP BY e.id, e.name, e.muscle_group
     ORDER BY max_weight DESC
     LIMIT 6`,
    [req.user.id]
  )
  res.json(rows)
}))

// GET /api/progress/client/:clientId — entrenador ve el progreso de un cliente suyo
router.get('/client/:clientId', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  if (!(await isMyClient(req.user.id, req.params.clientId))) {
    return res.status(403).json({ error: 'Cliente no autorizado' })
  }

  const { rows } = await pool.query(
    `SELECT pl.id, pl.set_number, pl.weight_kg, pl.reps_done, pl.notes, pl.logged_at,
            we.sets, we.reps,
            e.id AS exercise_id, e.name AS exercise_name, e.muscle_group
     FROM progress_logs pl
     JOIN workout_exercises we ON we.id = pl.workout_exercise_id
     JOIN exercises e          ON e.id = we.exercise_id
     WHERE pl.client_id = $1
     ORDER BY pl.logged_at DESC
     LIMIT 200`,
    [req.params.clientId]
  )
  res.json(rows)
}))

// POST /api/progress/body-metrics — cliente registra medidas corporales
router.post('/body-metrics', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm } = req.body

  // Validación de rangos básicos
  if (weight_kg    != null && (weight_kg    < 0 || weight_kg    > 500))   return res.status(400).json({ error: 'Peso inválido' })
  if (body_fat_pct != null && (body_fat_pct < 0 || body_fat_pct > 100))   return res.status(400).json({ error: '% grasa inválido (0-100)' })
  if (chest_cm     != null && (chest_cm     < 0 || chest_cm     > 300))   return res.status(400).json({ error: 'Medida de pecho inválida' })
  if (waist_cm     != null && (waist_cm     < 0 || waist_cm     > 300))   return res.status(400).json({ error: 'Medida de cintura inválida' })
  if (hips_cm      != null && (hips_cm      < 0 || hips_cm      > 300))   return res.status(400).json({ error: 'Medida de cadera inválida' })

  const { rows } = await pool.query(
    `INSERT INTO body_metrics (client_id, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.id, weight_kg ?? null, body_fat_pct ?? null, chest_cm ?? null, waist_cm ?? null, hips_cm ?? null]
  )
  res.status(201).json(rows[0])
}))

// GET /api/progress/body-metrics — historial del cliente autenticado
router.get('/body-metrics', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM body_metrics WHERE client_id = $1 ORDER BY measured_at ASC`,
    [req.user.id]
  )
  res.json(rows)
}))

// GET /api/progress/feed — actividad reciente de TODOS los clientes del trainer (últimas 24h)
router.get('/feed', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const { rows } = await pool.query(
    `SELECT pl.id, pl.set_number, pl.weight_kg, pl.reps_done, pl.notes, pl.logged_at,
            u.id   AS client_id, u.full_name AS client_name,
            e.id   AS exercise_id, e.name AS exercise_name, e.muscle_group
     FROM progress_logs pl
     JOIN users u              ON u.id = pl.client_id
     JOIN workout_exercises we ON we.id = pl.workout_exercise_id
     JOIN exercises e          ON e.id = we.exercise_id
     WHERE u.trainer_id = $1
       AND pl.logged_at >= NOW() - INTERVAL '24 hours'
     ORDER BY pl.logged_at DESC
     LIMIT $2`,
    [req.user.id, limit]
  )
  res.json(rows)
}))

// GET /api/progress/week-stats — series totales de los clientes del trainer en los últimos 7 días
router.get('/week-stats', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS sets
     FROM progress_logs pl
     JOIN users u ON u.id = pl.client_id
     WHERE u.trainer_id = $1
       AND pl.logged_at >= NOW() - INTERVAL '7 days'`,
    [req.user.id]
  )
  res.json({ sets: rows[0].sets })
}))

// GET /api/progress/client/:clientId/body-metrics — entrenador ve métricas de su cliente
router.get('/client/:clientId/body-metrics', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  if (!(await isMyClient(req.user.id, req.params.clientId))) {
    return res.status(403).json({ error: 'Cliente no autorizado' })
  }

  const { rows } = await pool.query(
    `SELECT * FROM body_metrics WHERE client_id = $1 ORDER BY measured_at ASC`,
    [req.params.clientId]
  )
  res.json(rows)
}))

// ── Objetivos por ejercicio ──────────────────────────────────────────────────

// GET /api/progress/goals — todos los objetivos del cliente
router.get('/goals', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT eg.id, eg.exercise_id, eg.target_weight_kg, eg.created_at,
            e.name AS exercise_name, e.muscle_group
     FROM exercise_goals eg
     JOIN exercises e ON e.id = eg.exercise_id
     WHERE eg.client_id = $1
     ORDER BY e.name`,
    [req.user.id]
  )
  res.json(rows)
}))

// PUT /api/progress/goals/:exerciseId — crear o actualizar objetivo
router.put('/goals/:exerciseId', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { target_weight_kg } = req.body
  if (!target_weight_kg || target_weight_kg <= 0) {
    return res.status(400).json({ error: 'Peso objetivo inválido' })
  }
  const { rows } = await pool.query(
    `INSERT INTO exercise_goals (client_id, exercise_id, target_weight_kg)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_id, exercise_id)
     DO UPDATE SET target_weight_kg = EXCLUDED.target_weight_kg, created_at = NOW()
     RETURNING *`,
    [req.user.id, req.params.exerciseId, target_weight_kg]
  )
  res.json(rows[0])
}))

// DELETE /api/progress/goals/:exerciseId — eliminar objetivo
router.delete('/goals/:exerciseId', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM exercise_goals WHERE client_id = $1 AND exercise_id = $2`,
    [req.user.id, req.params.exerciseId]
  )
  if (!rowCount) return res.status(404).json({ error: 'Objetivo no encontrado' })
  res.json({ message: 'Objetivo eliminado' })
}))

// GET /api/progress/volume-weekly — series por grupo muscular por semana (últimas 8 semanas)
router.get('/volume-weekly', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('week', pl.logged_at), 'YYYY-MM-DD') AS week_start,
       COALESCE(e.muscle_group, 'other') AS muscle_group,
       COUNT(*) AS sets
     FROM progress_logs pl
     JOIN workout_exercises we ON we.id = pl.workout_exercise_id
     JOIN exercises e          ON e.id = we.exercise_id
     WHERE pl.client_id = $1
       AND pl.logged_at >= NOW() - INTERVAL '8 weeks'
     GROUP BY week_start, muscle_group
     ORDER BY week_start ASC`,
    [req.user.id]
  )
  res.json(rows)
}))

// GET /api/progress/muscle-distribution — % de series por grupo muscular
router.get('/muscle-distribution', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(e.muscle_group, 'other') AS group, COUNT(*) AS count
     FROM progress_logs pl
     JOIN workout_exercises we ON we.id = pl.workout_exercise_id
     JOIN exercises e          ON e.id = we.exercise_id
     WHERE pl.client_id = $1
     GROUP BY e.muscle_group`,
    [req.user.id]
  )
  const dist = Object.fromEntries(rows.map(r => [r.group, Number(r.count)]))
  res.json(dist)
}))

export default router
