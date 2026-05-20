import pg from 'pg'

// Un único Pool reutilizado por toda la app.
// La connection string vive en DATABASE_URL (ver .env.example).
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Si la URL contiene "sslmode=require" (Supabase, Neon, Railway, etc.)
  // hay que aceptar el certificado tal cual.
  ssl: /sslmode=require|supabase\.co|neon\.tech|railway/i.test(process.env.DATABASE_URL ?? '')
    ? { rejectUnauthorized: false }
    : false
})

pool.on('error', err => {
  console.error('❌ Error inesperado en pool de Postgres:', err)
})

export default pool
