import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pathlib import Path
from loguru import logger

from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCRequestHandler,
    SmallWebRTCRequest,
    SmallWebRTCPatchRequest,
    IceCandidate,
)

from app.core.config import settings
from app.services.cv_parser import CVParserService
from app.services.session_store import session_store
from app.agent.bot import InterviewAgentBuilder
from app.api.schemas import (
    CVUploadResponse,
    WebRTCOfferRequest,
    WebRTCOfferResponse,
    WebRTCPatchRequest,
    ChangeLanguageRequest,
    ChangeFocusRequest,
)

router = APIRouter(prefix="/interview", tags=["Interview"])

# Gestor de conexiones WebRTC P2P de Pipecat
webrtc_request_handler = SmallWebRTCRequestHandler(
    ice_servers=[IceServer(urls="stun:stun.l.google.com:19302")]
)

# Referencias a las tareas activas en background para evitar que el GC las recolecte
_active_bot_tasks: set[asyncio.Task] = set()

@router.post("/upload-cv", response_model=CVUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_cv(
    file: UploadFile | None = File(None),
    candidate_name: str = Form(default="Candidato"),
    custom_prompt: str = Form(default=""),
    language: str = Form(default="es"),
    focus_mode: str = Form(default="cv_based"),
    custom_topic: str = Form(default=""),
):
    """
    Endpoint para crear la sesión de entrevista. Soporta exclusivamente 2 modos:
    1. 'cv_based': Requiere adjuntar el currículum (.pdf / .docx) para evaluación personalizada.
    2. 'custom_topic': Práctica técnica sobre un tema específico sin subir CV.
    """
    selected_language = language.lower() if language and language.lower() in ["es", "en"] else "es"
    selected_focus = "custom_topic" if (focus_mode or "").lower() == "custom_topic" else "cv_based"
    selected_topic = (custom_topic or "").strip() or None

    extracted_text: str | None = None
    filename: str | None = None

    if selected_focus == "cv_based":
        if file is None or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Es obligatorio subir un archivo de currículum (.pdf o .docx) para la modalidad basada en CV."
            )

        filename = file.filename
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extensión no permitida: {ext}. Solo se admiten archivos .pdf y .docx."
            )

        file_bytes = await file.read()
        max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El archivo supera el tamaño máximo de {settings.MAX_FILE_SIZE_MB}MB."
            )

        try:
            extracted_text = CVParserService.parse_file(filename, file_bytes)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
        except Exception as e:
            logger.error(f"Error procesando CV: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno procesando el currículum."
            )
    else:
        # Modo 'custom_topic': no se pasa ni se procesa ningún CV
        if not selected_topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe indicar el tema o tecnología sobre el que desea practicar."
            )
        filename = f"tema_{selected_topic[:20].replace(' ', '_')}"
        extracted_text = None

    session = session_store.create_session(
        candidate_name=candidate_name.strip() or ("Candidate" if selected_language == "en" else "Candidato"),
        cv_filename=filename,
        cv_text=extracted_text,
        custom_prompt=custom_prompt.strip() or None,
        language=selected_language,
        focus_mode=selected_focus,
        custom_topic=selected_topic,
    )

    logger.info(
        f"Sesión creada para {session.candidate_name} [modo: {selected_focus}"
        f"{f', tema: {selected_topic}' if selected_topic else f', cv: {filename}'}]. SessionID: {session.session_id}"
    )

    preview = (extracted_text[:280] + "...") if (extracted_text and len(extracted_text) > 280) else (f"Práctica especializada: {selected_topic}" if selected_topic else "")

    return CVUploadResponse(
        session_id=session.session_id,
        candidate_name=session.candidate_name,
        cv_filename=session.cv_filename,
        character_count=len(extracted_text) if extracted_text else 0,
        text_preview=preview,
        message="Sesión de práctica configurada con éxito.",
        language=session.language,
        focus_mode=session.focus_mode,
        custom_topic=session.custom_topic,
    )

@router.post("/webrtc/offer", response_model=WebRTCOfferResponse)
async def webrtc_offer(payload: WebRTCOfferRequest):
    """
    Endpoint de señalización WebRTC (SDP Offer -> SDP Answer).
    Inicializa la conexión P2P con el navegador y lanza el pipeline de voz de Pipecat
    personalizado con el CV y el idioma de la sesión del candidato.
    """
    session = session_store.get_session(payload.session_id or "")
    if not session:
        # Crear sesión de respaldo en caso de reconexión o prueba directa
        session = session_store.create_session(
            candidate_name="Candidato",
            cv_filename="cv_general.pdf",
            cv_text="Desarrollador de software con experiencia en Python, React, APIs REST y arquitectura de sistemas.",
            language="es",
        )

    webrtc_req = SmallWebRTCRequest(
        sdp=payload.sdp,
        type=payload.type,
        pc_id=payload.pc_id,
        restart_pc=payload.restart_pc,
    )

    async def on_webrtc_connection(connection: SmallWebRTCConnection):
        transport = SmallWebRTCTransport(
            webrtc_connection=connection,
            params=TransportParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
            ),
        )

        task, runner = InterviewAgentBuilder.build_pipeline(
            session_id=session.session_id,
            candidate_name=session.candidate_name,
            cv_text=session.cv_text,
            transport=transport,
            webrtc_connection=connection,
            custom_prompt=session.custom_prompt,
            language=session.language,
            focus_mode=session.focus_mode,
            custom_topic=session.custom_topic,
        )

        bg_task = asyncio.create_task(runner.run(task))
        _active_bot_tasks.add(bg_task)
        bg_task.add_done_callback(_active_bot_tasks.discard)

    try:
        answer = await webrtc_request_handler.handle_web_request(
            request=webrtc_req,
            webrtc_connection_callback=on_webrtc_connection,
        )
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo generar la respuesta SDP para WebRTC.",
            )

        return WebRTCOfferResponse(
            sdp=answer["sdp"],
            type=answer["type"],
            pc_id=answer["pc_id"],
            session_id=session.session_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en señalización WebRTC: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error iniciando sesión WebRTC: {str(e)}",
        )

@router.patch("/webrtc/offer")
async def webrtc_patch(payload: WebRTCPatchRequest):
    """
    Endpoint para recibir candidatos Trickle ICE adicionales enviados por el navegador.
    """
    patch_req = SmallWebRTCPatchRequest(
        pc_id=payload.pc_id,
        candidates=[
            IceCandidate(
                candidate=c.candidate,
                sdp_mid=c.sdp_mid,
                sdp_mline_index=c.sdp_mline_index,
            )
            for c in payload.candidates
        ],
    )
    await webrtc_request_handler.handle_patch_request(patch_req)
    return {"status": "ok"}

@router.post("/session/{session_id}/language")
async def change_session_language(session_id: str, payload: ChangeLanguageRequest):
    """
    Endpoint para actualizar el idioma registrado de la sesión.
    """
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada.")
    lang = payload.language.lower()
    if lang not in ["es", "en"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Idioma inválido. Debe ser 'es' o 'en'.")
    session_store.update_language(session_id, lang)
    logger.info(f"Idioma de sesión {session_id} actualizado a {lang} vía REST API.")
    return {"status": "ok", "language": lang}

@router.post("/session/{session_id}/focus")
async def change_session_focus(session_id: str, payload: ChangeFocusRequest):
    """
    Endpoint para actualizar el enfoque de evaluación registrado de la sesión (cv_based o custom_topic).
    """
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada.")
    focus_mode = payload.focus_mode.lower()
    if focus_mode not in ["cv_based", "custom_topic"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enfoque inválido. Solo se admiten 'cv_based' o 'custom_topic'."
        )
    session_store.update_focus(session_id, focus_mode, payload.custom_topic)
    logger.info(
        f"Enfoque de sesión {session_id} actualizado a '{focus_mode}' "
        f"(tema: {payload.custom_topic}) vía REST API."
    )
    return {"status": "ok", "focus_mode": focus_mode, "custom_topic": payload.custom_topic}

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada.")
    return session
