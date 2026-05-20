import { Router }   from 'express'
import pool          from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { messageLimiter } from '../middleware/rate-limit.js'
import { asyncHandler }   from '../utils/asyncHandler.js'

const router = Router()

const MAX_CONTENT_LENGTH = 2000

// POST /api/messages — enviar mensaje
router.post('/', requireAuth, messageLimiter, asyncHandler(async (req, res) => {
  const { receiver_id } = req.body
  const content = (req.body.content ?? '').trim()

  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Faltan campos' })
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ error: `El mensaje no puede superar ${MAX_CONTENT_LENGTH} caracteres` })
  }
  // Evitar que un usuario se envíe mensajes a sí mismo
  if (receiver_id === req.user.id) {
    return res.status(400).json({ error: 'No puedes enviarte mensajes a ti mismo' })
  }

  const { rows } = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [req.user.id, receiver_id, content]
  )
  res.status(201).json(rows[0])
}))

// GET /api/messages/conversation/:otherId — hilo entre el usuario actual y otro
router.get('/conversation/:otherId', requireAuth, asyncHandler(async (req, res) => {
  const me    = req.user.id
  const other = req.params.otherId

  const { rows } = await pool.query(
    `SELECT id, content, is_read, sent_at, sender_id, receiver_id
     FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY sent_at ASC`,
    [me, other]
  )

  // Marcar como leídos los mensajes que me llegaron del otro
  await pool.query(
    `UPDATE messages SET is_read = TRUE
     WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
    [me, other]
  )

  res.json(rows)
}))

// GET /api/messages/unread — contador de no leídos
router.get('/unread', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS unread
     FROM messages WHERE receiver_id = $1 AND is_read = FALSE`,
    [req.user.id]
  )
  res.json({ unread: rows[0].unread })
}))

export default router
