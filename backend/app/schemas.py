from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


BCRYPT_MAX_PASSWORD_BYTES = 72


def validate_bcrypt_password_size(password: str) -> str:
    if len(password.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
        raise ValueError("Password must be 72 bytes or fewer")
    return password


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt_limit(cls, password: str) -> str:
        return validate_bcrypt_password_size(password)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt_limit(cls, password: str) -> str:
        return validate_bcrypt_password_size(password)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    tags: list[str] | None = None


class NoteRead(NoteBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AITransformRequest(BaseModel):
    note_id: int
    instruction: str = Field(
        default="Summarize this note into concise, actionable bullet points.",
        min_length=1,
        max_length=500,
    )


class AITransformResponse(BaseModel):
    note_id: int
    result: str
