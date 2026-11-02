from pydantic import BaseModel
from typing import Optional

class CVUploadResponse(BaseModel):
    session_id: str
    candidate_name: str
    cv_filename: Optional[str] = None
    character_count: int = 0
    text_preview: str = ""
    message: str
    language: str = "es"
    focus_mode: str = "cv_based"
    custom_topic: Optional[str] = None

class SessionDetailResponse(BaseModel):
    session_id: str
    candidate_name: str
    cv_filename: Optional[str] = None
    status: str
    created_at: str
    transcripts_count: int
    language: Optional[str] = "es"
    focus_mode: Optional[str] = "cv_based"
    custom_topic: Optional[str] = None

class ChangeLanguageRequest(BaseModel):
    language: str

class ChangeFocusRequest(BaseModel):
    focus_mode: str
    custom_topic: Optional[str] = None

class WebRTCOfferRequest(BaseModel):
    sdp: str
    type: str
    pc_id: Optional[str] = None
    restart_pc: Optional[bool] = False
    session_id: Optional[str] = None

class WebRTCOfferResponse(BaseModel):
    sdp: str
    type: str
    pc_id: str
    session_id: str

class WebRTCIceCandidate(BaseModel):
    candidate: str
    sdp_mid: str
    sdp_mline_index: int

class WebRTCPatchRequest(BaseModel):
    pc_id: str
    candidates: list[WebRTCIceCandidate]
