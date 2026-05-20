-- ============================================================
-- E-GYM · PostgreSQL Schema (sin Supabase Auth)
-- Vale para cualquier Postgres: Supabase, Neon, Railway, local…
-- ============================================================

-- ── Enum de roles ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('trainer', 'client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Extensión para UUIDs ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: users
-- Tabla propia, con hash de contraseña y rol.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'client',
  avatar_url    TEXT,
  phone         TEXT,
  trainer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.trainer_id IS 'FK al entrenador; NULL si el propio usuario ES el entrenador';

-- ============================================================
-- TABLA: exercises  (catálogo)
-- trainer_id = NULL  → ejercicio GLOBAL compartido con todos los entrenadores
-- trainer_id = uuid  → ejercicio privado de ese entrenador
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  muscle_group TEXT,
  video_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la columna ya existía con NOT NULL, lo eliminamos (idempotente).
DO $$ BEGIN
  ALTER TABLE exercises ALTER COLUMN trainer_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Evita duplicados al re-ejecutar el seed de ejercicios globales.
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_global_name
  ON exercises (name) WHERE trainer_id IS NULL;

-- ============================================================
-- TABLA: workouts  (cabecera de rutina)
-- trainer_id NULL → la rutina la creó el propio cliente (auto-asignada)
-- ============================================================
CREATE TABLE IF NOT EXISTS workouts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  scheduled_date DATE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotente: si la columna ya era NOT NULL, lo quitamos
DO $$ BEGIN
  ALTER TABLE workouts ALTER COLUMN trainer_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================
-- TABLA: workout_exercises  (detalle de ejercicios de una rutina)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  sets        INT NOT NULL DEFAULT 3,
  reps        INT NOT NULL DEFAULT 10,
  rest_secs   INT NOT NULL DEFAULT 60,
  notes       TEXT,
  order_index INT NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLA: progress_logs  (registros del cliente por serie)
-- ============================================================
CREATE TABLE IF NOT EXISTS progress_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number          INT NOT NULL,
  weight_kg           NUMERIC(6,2),
  reps_done           INT,
  notes               TEXT,
  logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: body_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS body_metrics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg    NUMERIC(5,2),
  body_fat_pct NUMERIC(4,2),
  chest_cm     NUMERIC(5,2),
  waist_cm     NUMERIC(5,2),
  hips_cm      NUMERIC(5,2),
  measured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: revoked_tokens
-- Lista negra de refresh tokens revocados (logout real).
-- El campo jti corresponde al claim "jti" del JWT.
-- ============================================================
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT        PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_trainer        ON users(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workouts_client      ON workouts(client_id);
CREATE INDEX IF NOT EXISTS idx_workouts_trainer     ON workouts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_progress_client      ON progress_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_exercise    ON progress_logs(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_client  ON body_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver    ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender      ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_exp   ON revoked_tokens(expires_at);

-- Índice único para el upsert atómico de progress_logs.
-- Garantiza que no existan dos logs del mismo cliente, ejercicio y serie en el mismo día.
-- Permite usar ON CONFLICT (client_id, workout_exercise_id, set_number, (logged_at::date)).
CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_logs_daily_upsert
  ON progress_logs (client_id, workout_exercise_id, set_number, (logged_at::date));

-- ============================================================
-- TRIGGER: auto updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_workouts_updated_at ON workouts;
CREATE TRIGGER trg_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
