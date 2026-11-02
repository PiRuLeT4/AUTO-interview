import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CandidateSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_name: str
    cv_filename: Optional[str] = None
    cv_text: Optional[str] = None
    custom_prompt: Optional[str] = None
    language: str = "es"  # "es" | "en"
    focus_mode: str = "cv_based"  # "cv_based" | "custom_topic"
    custom_topic: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().strftime("%d/%m/%Y, %H:%M"))
    status: str = "pending"  # pending | in_progress | completed

class SessionStore:
    """Almacén en memoria de la sesión activa para la práctica de entrevista."""
    def __init__(self):
        self._sessions: dict[str, CandidateSession] = {}

    def create_session(
        self,
        candidate_name: str,
        cv_filename: Optional[str] = None,
        cv_text: Optional[str] = None,
        custom_prompt: Optional[str] = None,
        language: str = "es",
        focus_mode: str = "cv_based",
        custom_topic: Optional[str] = None,
    ) -> CandidateSession:
        normalized_mode = "custom_topic" if (focus_mode or "").lower() == "custom_topic" else "cv_based"
        session = CandidateSession(
            candidate_name=candidate_name,
            cv_filename=cv_filename,
            cv_text=cv_text,
            custom_prompt=custom_prompt,
            language=language.lower() if language and language.lower() in ["es", "en"] else "es",
            focus_mode=normalized_mode,
            custom_topic=custom_topic.strip() if custom_topic else None,
        )
        self._sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[CandidateSession]:
        return self._sessions.get(session_id)

    def update_status(self, session_id: str, status: str):
        if session_id in self._sessions:
            self._sessions[session_id].status = status

    def update_language(self, session_id: str, language: str):
        if session_id in self._sessions:
            self._sessions[session_id].language = (
                language.lower() if language and language.lower() in ["es", "en"] else "es"
            )

    def update_focus(self, session_id: str, focus_mode: str, custom_topic: Optional[str] = None):
        if session_id in self._sessions:
            normalized_mode = "custom_topic" if (focus_mode or "").lower() == "custom_topic" else "cv_based"
            self._sessions[session_id].focus_mode = normalized_mode
            self._sessions[session_id].custom_topic = custom_topic.strip() if custom_topic else None

session_store = SessionStore()
