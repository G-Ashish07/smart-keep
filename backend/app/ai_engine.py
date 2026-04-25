from fastapi import HTTPException, status

from app.config import Settings
from app.models import Note


def transform_note_with_gemini(note: Note, instruction: str, settings: Settings) -> str:
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured",
        )

    try:
        import google.generativeai as genai
        from google.api_core.exceptions import GoogleAPIError
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini client dependency is not installed",
        ) from exc

    prompt = (
        "You are transforming a private user note. Follow the instruction exactly, "
        "do not invent facts, and keep the response useful.\n\n"
        f"Instruction:\n{instruction}\n\n"
        f"Title:\n{note.title}\n\n"
        f"Content:\n{note.content}\n\n"
        f"Tags:\n{', '.join(note.tags)}"
    )

    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content(prompt)
        text = getattr(response, "text", None)
    except GoogleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini API request failed",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Gemini could not return text for this note",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini transform failed",
        ) from exc

    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Gemini returned an empty response",
        )

    return text
