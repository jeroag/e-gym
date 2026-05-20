import rateLimit from 'express-rate-limit'

// Login: 10 intentos por IP cada 15 minutos.
// Cuenta solo las peticiones fallidas para no penalizar al usuario que acierta a la primera.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de login. Espera unos minutos.' }
})

// Registro: 5 cuentas por IP cada hora — frena scripts que crean usuarios en masa.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta IP. Inténtalo más tarde.' }
})

// Recuperar contraseña: 3 envíos por IP cada hora.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera una hora.' }
})

// Mensajes: 30 mensajes por usuario/IP cada 60 segundos — evita flood de mensajes.
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.user?.id ?? req.ip,
  message: { error: 'Estás enviando mensajes demasiado rápido. Espera un momento.' }
})
