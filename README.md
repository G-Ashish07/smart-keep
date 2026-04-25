# Smart Keep

Smart Keep is a full-stack note-taking app with authentication, user-owned notes, and an AI transform workflow powered by Gemini.

The project is split into a FastAPI backend and a React/Vite frontend.

## Features

- Email/password registration and login
- JWT bearer authentication
- Protected user profile endpoint
- Create, read, update, and delete notes
- Per-user note ownership and access control
- Gemini-powered note transformation endpoint
- React dashboard with protected routes, note creation, note cards, and API error handling

## Tech Stack

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic Settings
- JWT auth with `python-jose`
- Password hashing with `passlib` and `bcrypt`
- Google Generative AI SDK
- `uv` for Python dependency management

### Frontend

- React 18
- Vite
- React Router
- TanStack Query
- Axios
- Tailwind CSS
- Radix UI primitives
- lucide-react icons
- Sonner toasts

## Repository Structure

```text
smart-keep/
├── backend/
│   ├── app/
│   │   ├── ai_engine.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env.example
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

- Python 3.11 or newer
- `uv`
- Node.js 18 or newer
- npm
- PostgreSQL
- Gemini API key, only required for AI note transforms

## Backend Setup

From the repository root:

```bash
cd backend
uv sync
cp .env.example .env
```

Update `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/smart_keep
JWT_SECRET_KEY=change-this-to-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=
GEMINI_MODEL=gemma-3-27b-it
```

Create a local PostgreSQL database named `smart_keep`. One quick option with Docker is:

```bash
docker run --name smart-keep-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smart_keep \
  -p 5432:5432 \
  -d postgres:16
```

Start the API:

```bash
uv run uvicorn app.main:app --reload
```

The backend runs at:

- API: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- Swagger docs: `http://localhost:8000/docs`

Tables are currently created automatically on application startup. Add Alembic migrations before production deployment.

## Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

By default, the frontend calls `http://localhost:8000`. Override the API URL when needed:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Development Workflow

Run the backend:

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Run the frontend:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

Lint the frontend:

```bash
cd frontend
npm run lint
```

Preview the production frontend build:

```bash
cd frontend
npm run preview
```

## API Overview

### Health

- `GET /health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### Notes

- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/{note_id}`
- `PATCH /api/notes/{note_id}`
- `DELETE /api/notes/{note_id}`

### AI

- `POST /api/ai/transform`

All note and AI routes require a bearer token. The frontend stores the access token in `localStorage` and attaches it to API requests through the shared Axios client.

## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLAlchemy PostgreSQL connection string. |
| `JWT_SECRET_KEY` | Yes | Secret used to sign access tokens. Use a long random value outside local development. |
| `JWT_ALGORITHM` | No | JWT signing algorithm. Defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token lifetime in minutes. Defaults to `60`. |
| `GEMINI_API_KEY` | No | Gemini API key. Required only when using AI transforms. |
| `GEMINI_MODEL` | No | Gemini model name. Defaults to `gemma-3-27b-it`. |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No | Backend API base URL. Defaults to `http://localhost:8000`. |

## Notes for Production

- Replace `JWT_SECRET_KEY` with a strong secret.
- Configure CORS for the deployed frontend origin.
- Use managed PostgreSQL or a persistent database service.
- Add database migrations before schema changes are deployed.
- Keep `GEMINI_API_KEY` server-side only.
- Serve the built frontend from a static host or behind the same reverse proxy as the API.

## Module Docs

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
