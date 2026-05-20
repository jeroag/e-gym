import { Router }   from 'express'
import pool          from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// GET /api/exercises — catálogo accesible al usuario.
// Trainer: propios + globales. Cliente: globales + los del entrenador asignado.
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  let query, params
  if (req.user.role === 'trainer') {
    query = `SELECT id, name, description, muscle_group, video_url, created_at,
                    (trainer_id IS NULL) AS is_global
             FROM exercises
             WHERE trainer_id = $1 OR trainer_id IS NULL
             ORDER BY (trainer_id IS NULL) DESC, name`
    params = [req.user.id]
  } else {
    query = `SELECT id, name, description, muscle_group, video_url, created_at,
                    (trainer_id IS NULL) AS is_global
             FROM exercises
             WHERE trainer_id IS NULL OR trainer_id = $1
             ORDER BY (trainer_id IS NULL) DESC, name`
    params = [req.user.trainer_id ?? null]
  }
  const { rows } = await pool.query(query, params)
  res.json(rows)
}))

// POST /api/exercises — nuevo ejercicio (solo entrenadores)
router.post('/', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { name, description, muscle_group, video_url } = req.body
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' })

  const { rows } = await pool.query(
    `INSERT INTO exercises (trainer_id, name, description, muscle_group, video_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, muscle_group, video_url, created_at`,
    [req.user.id, name, description ?? null, muscle_group ?? null, video_url ?? null]
  )
  res.status(201).json(rows[0])
}))

// PATCH /api/exercises/:id
router.patch('/:id', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { name, description, muscle_group, video_url } = req.body
  const { rows } = await pool.query(
    `UPDATE exercises
     SET name         = COALESCE($1, name),
         description  = COALESCE($2, description),
         muscle_group = COALESCE($3, muscle_group),
         video_url    = COALESCE($4, video_url)
     WHERE id = $5 AND trainer_id = $6
     RETURNING id, name, description, muscle_group, video_url, created_at`,
    [name, description, muscle_group, video_url, req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Ejercicio no encontrado' })
  res.json(rows[0])
}))

// DELETE /api/exercises/:id
router.delete('/:id', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM exercises WHERE id = $1 AND trainer_id = $2',
    [req.params.id, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Ejercicio no encontrado' })
  res.json({ message: 'Ejercicio eliminado' })
}))

export default router
