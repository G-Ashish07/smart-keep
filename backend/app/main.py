from urllib.parse import parse_qs

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai_engine import transform_note_with_gemini
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    hash_password,
)
from app.config import Settings, get_settings
from app.database import Base, engine, get_db
from app.models import Note, User
from app.schemas import (
    AITransformRequest,
    AITransformResponse,
    LoginRequest,
    NoteCreate,
    NoteRead,
    NoteUpdate,
    Token,
    UserCreate,
    UserRead,
)


app = FastAPI(title="Smart Keep API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    email = payload.email.lower()
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(email=email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


async def parse_login_payload(request: Request) -> LoginRequest:
    content_type = request.headers.get("content-type", "")
    try:
        if "application/x-www-form-urlencoded" in content_type:
            form = parse_qs((await request.body()).decode("utf-8"))
            return LoginRequest.model_validate(
                {
                    "email": (form.get("username") or form.get("email") or [None])[0],
                    "password": (form.get("password") or [None])[0],
                }
            )
        return LoginRequest.model_validate(await request.json())
    except (ValidationError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required",
        ) from None


@app.post("/api/auth/login", response_model=Token)
async def login_user(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Token:
    payload = await parse_login_payload(request)
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id), settings=settings)
    return Token(access_token=access_token)


@app.get("/api/users/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@app.get("/api/notes", response_model=list[NoteRead])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Note]:
    return list(
        db.scalars(
            select(Note)
            .where(Note.owner_id == current_user.id)
            .order_by(Note.created_at.desc())
        )
    )


@app.post("/api/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = Note(owner_id=current_user.id, **payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_owned_note(note_id: int, db: Session, current_user: User) -> Note:
    note = db.scalar(
        select(Note).where(Note.id == note_id, Note.owner_id == current_user.id)
    )
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    return note


@app.get("/api/notes/{note_id}", response_model=NoteRead)
def read_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    return get_owned_note(note_id, db, current_user)


@app.patch("/api/notes/{note_id}", response_model=NoteRead)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = get_owned_note(note_id, db, current_user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    note = get_owned_note(note_id, db, current_user)
    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/ai/transform", response_model=AITransformResponse)
def transform_note(
    payload: AITransformRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AITransformResponse:
    note = get_owned_note(payload.note_id, db, current_user)
    result = transform_note_with_gemini(note, payload.instruction, settings)
    return AITransformResponse(note_id=note.id, result=result)
