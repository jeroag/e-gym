import { Router }   from 'express'
import pool          from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isMyClient }   from '../utils/db-helpers.js'

const router = Router()

// Carga los ejercicios de una rutina y los pega como array en el objeto workout.
async function attachExercises(workouts) {
  if (!workouts.length) return workouts
  const ids = workouts.map(w => w.id)
  const { rows } = await pool.query(
    `SELECT we.id, we.workout_id, we.sets, we.reps, we.rest_secs, we.notes, we.order_index, we.superset_group,
            e.id AS exercise_id, e.name AS exercise_name, e.muscle_group, e.video_url, e.description
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ANY($1::uuid[])
     ORDER BY we.order_index`,
    [ids]
  )
  const byWorkout = new Map(workouts.map(w => [w.id, { ...w, exercises: [] }]))
  for (const r of rows) {
    byWorkout.get(r.workout_id).exercises.push({
      id: r.id,
      sets: r.sets,
      reps: r.reps,
      rest_secs: r.rest_secs,
      notes: r.notes,
      order_index: r.order_index,
      superset_group: r.superset_group,
      exercise: {
        id: r.exercise_id,
        name: r.exercise_name,
        description: r.description,
        muscle_group: r.muscle_group,
        video_url: r.video_url
      }
    })
  }
  return Array.from(byWorkout.values())
}

// GET /api/workouts/my — cliente ve sus rutinas
router.get('/my', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, trainer_id, name, description, scheduled_date, is_active, created_at,
            (trainer_id IS NULL) AS self_created
     FROM workouts
     WHERE client_id = $1 AND is_active = TRUE
     ORDER BY scheduled_date NULLS LAST, created_at DESC`,
    [req.user.id]
  )
  res.json(await attachExercises(rows))
}))

// GET /api/workouts/client/:clientId — entrenador ve rutinas de un cliente suyo
router.get('/client/:clientId', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  if (!(await isMyClient(req.user.id, req.params.clientId))) {
    return res.status(403).json({ error: 'Cliente no autorizado' })
  }

  const { rows } = await pool.query(
    `SELECT id, trainer_id, name, description, scheduled_date, is_active, created_at,
            (trainer_id IS NULL) AS self_created
     FROM workouts
     WHERE client_id = $1 AND (trainer_id = $2 OR trainer_id IS NULL)
     ORDER BY created_at DESC`,
    [req.params.clientId, req.user.id]
  )
  res.json(await attachExercises(rows))
}))

// POST /api/workouts — crear rutina
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { client_id, name, description, scheduled_date, exercises = [] } = req.body
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let trainerIdToSet = null
    let clientIdToSet  = null

    if (req.user.role === 'trainer') {
      if (!client_id) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'client_id es obligatorio' })
      }
      if (!(await isMyClient(req.user.id, client_id))) {
        await client.query('ROLLBACK')
        return res.status(403).json({ error: 'Ese cliente no es tuyo' })
      }
      trainerIdToSet = req.user.id
      clientIdToSet  = client_id
    } else {
      trainerIdToSet = null
      clientIdToSet  = req.user.id
    }

    const { rows: [workout] } = await client.query(
      `INSERT INTO workouts (trainer_id, client_id, name, description, scheduled_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, trainer_id, client_id, name, description, scheduled_date, is_active, created_at`,
      [trainerIdToSet, clientIdToSet, name, description ?? null, scheduled_date ?? null]
    )

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      await client.query(
        `INSERT INTO workout_exercises
           (workout_id, exercise_id, sets, reps, rest_secs, notes, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [workout.id, ex.exercise_id, ex.sets ?? 3, ex.reps ?? 10, ex.rest_secs ?? 60, ex.notes ?? null, i]
      )
    }

    await client.query('COMMIT')
    res.status(201).json(workout)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}))

// Helper: ¿puede este user editar/borrar esta rutina?
async function canEditWorkout(user, workoutId) {
  const { rows } = await pool.query(
    `SELECT trainer_id, client_id FROM workouts WHERE id = $1`,
    [workoutId]
  )
  if (!rows.length) return false
  const w = rows[0]
  if (user.role === 'trainer') return w.trainer_id === user.id
  if (user.role === 'client')  return w.client_id === user.id && w.trainer_id === null
  return false
}

// PATCH /api/workouts/:id
router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  if (!(await canEditWorkout(req.user, req.params.id))) {
    return res.status(403).json({ error: 'No puedes editar esta rutina' })
  }
  const { name, description, scheduled_date, is_active } = req.body
  const { rows } = await pool.query(
    `UPDATE workouts SET
       name           = COALESCE($1, name),
       description    = COALESCE($2, description),
       scheduled_date = COALESCE($3, scheduled_date),
       is_active      = COALESCE($4, is_active)
     WHERE id = $5
     RETURNING id, trainer_id, client_id, name, description, scheduled_date, is_active, created_at`,
    [name, description, scheduled_date, is_active, req.params.id]
  )
  res.json(rows[0])
}))

// DELETE /api/workouts/:id
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  if (!(await canEditWorkout(req.user, req.params.id))) {
    return res.status(403).json({ error: 'No puedes borrar esta rutina' })
  }
  await pool.query('DELETE FROM workouts WHERE id = $1', [req.params.id])
  res.json({ message: 'Rutina eliminada' })
}))

// POST /api/workouts/:id/duplicate — duplicar rutina (solo entrenadores)
router.post('/:id/duplicate', requireAuth, requireRole('trainer'), asyncHandler(async (req, res) => {
  const { client_id } = req.body

  const { rows: [src] } = await pool.query(
    `SELECT * FROM workouts WHERE id = $1 AND trainer_id = $2`,
    [req.params.id, req.user.id]
  )
  if (!src) return res.status(404).json({ error: 'Rutina no encontrada' })

  const targetClientId = client_id ?? src.client_id
  if (!(await isMyClient(req.user.id, targetClientId))) {
    return res.status(403).json({ error: 'Ese cliente no es tuyo' })
  }

  const { rows: exercises } = await pool.query(
    `SELECT * FROM workout_exercises WHERE workout_id = $1 ORDER BY order_index`,
    [req.params.id]
  )

  const cl = await pool.connect()
  try {
    await cl.query('BEGIN')
    const { rows: [dup] } = await cl.query(
      `INSERT INTO workouts (trainer_id, client_id, name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, trainer_id, client_id, name, description, scheduled_date, is_active, created_at`,
      [req.user.id, targetClientId, `${src.name} (copia)`, src.description]
    )
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      await cl.query(
        `INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_secs, notes, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [dup.id, ex.exercise_id, ex.sets, ex.reps, ex.rest_secs, ex.notes, i]
      )
    }
    await cl.query('COMMIT')
    res.status(201).json(dup)
  } catch (e) {
    await cl.query('ROLLBACK')
    throw e
  } finally {
    cl.release()
  }
}))

// PATCH /api/workouts/:id/exercises/reorder — reordenar ejercicios
router.patch('/:id/exercises/reorder', requireAuth, asyncHandler(async (req, res) => {
  if (!(await canEditWorkout(req.user, req.params.id))) {
    return res.status(403).json({ error: 'No puedes editar esta rutina' })
  }
  const { orders } = req.body  // [{ id, order_index }]
  if (!Array.isArray(orders) || !orders.length) {
    return res.status(400).json({ error: 'orders es obligatorio' })
  }
  const cl = await pool.connect()
  try {
    await cl.query('BEGIN')
    for (const { id, order_index } of orders) {
      await cl.query(
        `UPDATE workout_exercises SET order_index = $1 WHERE id = $2 AND workout_id = $3`,
        [order_index, id, req.params.id]
      )
    }
    await cl.query('COMMIT')
    res.json({ ok: true })
  } catch (e) {
    await cl.query('ROLLBACK')
    throw e
  } finally {
    cl.release()
  }
}))

// POST /api/workouts/:id/exercises — añadir ejercicio a una rutina existente (durante el entreno)
router.post('/:id/exercises', requireAuth, asyncHandler(async (req, res) => {
  if (!(await canEditWorkout(req.user, req.params.id))) {
    return res.status(403).json({ error: 'No puedes editar esta rutina' })
  }

  const { exercise_id, sets, reps, rest_secs, notes } = req.body
  if (!exercise_id) return res.status(400).json({ error: 'exercise_id es obligatorio' })

  // Calcular el order_index siguiente
  const { rows: [{ next_idx }] } = await pool.query(
    `SELECT COALESCE(MAX(order_index), -1) + 1 AS next_idx
     FROM workout_exercises WHERE workout_id = $1`,
    [req.params.id]
  )

  const { rows: [we] } = await pool.query(
    `INSERT INTO workout_exercises
       (workout_id, exercise_id, sets, reps, rest_secs, notes, order_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, workout_id, exercise_id, sets, reps, rest_secs, notes, order_index`,
    [req.params.id, exercise_id, sets ?? 3, reps ?? 10, rest_secs ?? 60, notes ?? null, next_idx]
  )

  // Devolver el ejercicio completo (con datos de exercises)
  const { rows: [exercise] } = await pool.query(
    `SELECT id, name, muscle_group, video_url, description FROM exercises WHERE id = $1`,
    [exercise_id]
  )

  res.status(201).json({ ...we, exercise: exercise ?? null })
}))

// PATCH /api/workouts/:id/exercises/:weId — actualizar propiedades de un ejercicio (incl. superset_group)
router.patch('/:id/exercises/:weId', requireAuth, asyncHandler(async (req, res) => {
  if (!(await canEditWorkout(req.user, req.params.id))) {
    return res.status(403).json({ error: 'No puedes editar esta rutina' })
  }
  const { sets, reps, rest_secs, notes, superset_group } = req.body
  const { rows } = await pool.query(
    `UPDATE workout_exercises SET
       sets           = COALESCE($1, sets),
       reps           = COALESCE($2, reps),
       rest_secs      = COALESCE($3, rest_secs),
       notes          = COALESCE($4, notes),
       superset_group = $5
     WHERE id = $6 AND workout_id = $7
     RETURNING *`,
    [sets, reps, rest_secs, notes, superset_group ?? null, req.params.weId, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Ejercicio no encontrado' })
  res.json(rows[0])
}))

// DELETE /api/workouts/:workoutId/exercises/:weId — eliminar ejercicio de una rutina
router.delete('/:id/exercises/:weId', requireAuth, asyncHandler(async (req, res) => {
  if (!(await canEditWorkout(req.user, req.params.id))) {
    return res.status(403).json({ error: 'No puedes editar esta rutina' })
  }
  const { rowCount } = await pool.query(
    `DELETE FROM workout_exercises WHERE id = $1 AND workout_id = $2`,
    [req.params.weId, req.params.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Ejercicio no encontrado en la rutina' })
  res.json({ message: 'Ejercicio eliminado de la rutina' })
}))

export default router
