import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'

import authRoutes      from './routes/auth.js'
import usersRoutes     from './routes/users.js'
import workoutsRoutes  from './routes/workouts.js'
import exercisesRoutes from './routes/exercises.js'
import progressRoutes  from './routes/progress.js'
import messagesRoutes  from './routes/messages.js'
import sessionsRoutes  from './routes/sessions.js'
import scheduleRoutes  from './routes/schedule.js'
import { purgeExpiredTokens } from './utils/db-helpers.js'

const app = express()

// ── Seguridad ─────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())

// ── Rutas ─────────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/users',     usersRoutes)
app.use('/api/workouts',  workoutsRoutes)
app.use('/api/exercises', exercisesRoutes)
app.use('/api/progress',  progressRoutes)
app.use('/api/messages',  messagesRoutes)
app.use('/api/sessions',  sessionsRoutes)
app.use('/api/schedule',  scheduleRoutes)

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── Manejador global de errores ───────────────────────────
// Captura cualquier error lanzado por asyncHandler en las rutas.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Error no controlado:', err)
  const status  = err.status ?? err.statusCode ?? 500
  const message = status < 500 ? err.message : 'Error interno del servidor'
  res.status(status).json({ error: message })
})

// ── Limpieza periódica de tokens revocados (cada 6 h) ────
setInterval(() => {
  purgeExpiredTokens().catch(e => console.error('purgeExpiredTokens:', e))
}, 6 * 60 * 60 * 1000)

// ── Arranque ──────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`🚀 E-GYM API corriendo en http://localhost:${PORT}`)
})
