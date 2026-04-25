# Smart Keep Backend

FastAPI backend with JWT authentication, user-owned notes, and a protected Gemini transform endpoint.

## Run locally

```bash
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload
```

Set `DATABASE_URL`, `JWT_SECRET_KEY`, and `GEMINI_API_KEY` in `.env`.

## API overview

- `POST /api/auth/register` creates a user.
- `POST /api/auth/login` returns a bearer token.
- `GET /api/users/me` returns the authenticated user.
- `GET /api/notes` lists only the authenticated user's notes.
- `POST /api/notes` creates a note owned by the authenticated user.
- `GET /api/notes/{note_id}` reads only an owned note.
- `PATCH /api/notes/{note_id}` updates only an owned note.
- `DELETE /api/notes/{note_id}` deletes only an owned note.
- `POST /api/ai/transform` transforms an owned note with Gemini.

Tables are created on app startup for this first backend phase. Add Alembic migrations before production deployments.
