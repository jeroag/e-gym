# E-GYM · Express.js + Vue.js + Postgres + pnpm

Backend Node/Express con auth propia (bcrypt + JWT), frontend Vue 3 + Pinia + Tailwind, base de datos cualquier Postgres (Supabase como DB, Neon, Railway, local…).

## Arranque rápido

### 1 · Base de datos
Crea una base de datos Postgres (en Supabase, Neon, Railway o local) y ejecuta `supabase/schema.sql` para crear las tablas.

### 2 · Variables de entorno
```powershell
cd backend
copy .env.example .env       # Windows
```
Edita `backend/.env` y rellena al menos:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=un_secret_largo_aleatorio
TRAINER_LICENSE_CODE=loquequieras
```
Y el frontend:
```powershell
cd ../frontend
copy .env.example .env
```
(Por defecto apunta a `http://localhost:3000/api`.)

### 3 · Instalar y arrancar
Desde la raíz del repo, con un solo comando:
```powershell
cd ..
pnpm install:all        # instala raíz + backend + frontend
pnpm dev                # arranca backend y frontend a la vez
```
- Backend → http://localhost:3000
- Frontend → http://localhost:5173
- Para parar todo: Ctrl+C en esa terminal.

Si prefieres terminales separadas:
```powershell
pnpm dev:back     # solo backend
pnpm dev:front    # solo frontend
```

---

## Variables de entorno

### backend/.env
```
DATABASE_URL=postgresql://user:pass@host:5432/egym
JWT_SECRET=cambia_este_secret_a_uno_largo_y_aleatorio
PORT=3000
FRONTEND_URL=http://localhost:5173
TRAINER_LICENSE_CODE=cambia_este_codigo
```

### frontend/.env
```
VITE_API_URL=http://localhost:3000/api
```

---

## Endpoints

| Método | Ruta | Rol |
|--------|------|-----|
| POST   | /api/auth/register             | Público (trainer requiere license_code) |
| POST   | /api/auth/login                | Público |
| POST   | /api/auth/refresh              | Público |
| POST   | /api/auth/logout               | Ambos |
| POST   | /api/auth/forgot-password      | Público |
| GET    | /api/users/me                  | Ambos |
| GET    | /api/users/clients             | Trainer |
| GET    | /api/users/clients/:id         | Trainer |
| POST   | /api/users/clients/:id         | Trainer |
| DELETE | /api/users/clients/:id         | Trainer |
| GET    | /api/workouts/my               | Client |
| GET    | /api/workouts/client/:id       | Trainer |
| POST   | /api/workouts                  | Trainer |
| PATCH  | /api/workouts/:id              | Trainer |
| DELETE | /api/workouts/:id              | Trainer |
| GET    | /api/exercises                 | Trainer |
| POST   | /api/exercises                 | Trainer |
| PATCH  | /api/exercises/:id             | Trainer |
| DELETE | /api/exercises/:id             | Trainer |
| POST   | /api/progress/log              | Client |
| GET    | /api/progress/exercise/:id     | Client |
| GET    | /api/progress/client/:id       | Trainer |
| GET    | /api/progress/body-metrics     | Client |
| POST   | /api/progress/body-metrics     | Client |
| GET    | /api/progress/muscle-distribution | Client |
| POST   | /api/messages                  | Ambos |
| GET    | /api/messages/conversation/:id | Ambos |
| GET    | /api/messages/unread           | Ambos |
| POST   | /api/sessions                  | Client |
| GET    | /api/sessions/my               | Client |
| GET    | /api/sessions/client/:id       | Trainer |
| GET    | /api/schedule/my               | Client |
| GET    | /api/schedule/client/:id       | Trainer |
| PUT    | /api/schedule/client/:id       | Trainer |

---

## Cómo obtener un DATABASE_URL con Supabase

1. Crea un proyecto en https://app.supabase.com.
2. **Project Settings → Database → Connection string** → modo *URI*.
3. Sustituye `[YOUR-PASSWORD]` por la contraseña del proyecto.
4. Pega la URL completa en `DATABASE_URL`.
5. Ve a **SQL Editor**, pega el contenido de `supabase/schema.sql` y ejecuta.

Listo. No necesitas las API keys de Supabase — el backend habla con Postgres directamente.
