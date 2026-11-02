from typing import Any
from loguru import logger
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.frames.frames import (
    Frame,
    InterimTranscriptionFrame,
    TextFrame,
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)

class TranscriptObserver(FrameProcessor):
    """
    Observer del pipeline de Pipecat que intercepta eventos de estado de voz
    (cuándo empieza/termina de hablar el usuario o el bot) y fragmentos de texto en vivo
    para transmitirlos por el DataChannel de WebRTC hacia el frontend en React.
    """

    def __init__(self, session_id: str, webrtc_connection: Any | None = None):
        super().__init__()
        self.session_id = session_id
        self.webrtc_connection = webrtc_connection

    def _send_ui_event(self, payload: dict[str, Any]):
        if self.webrtc_connection is not None:
            try:
                self.webrtc_connection.send_app_message(payload)
            except Exception as e:
                logger.debug(f"[{self.session_id}] No se pudo enviar evento UI por DataChannel: {e}")

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        # 1. Estados de habla en tiempo real para animar la esfera en React
        if isinstance(frame, UserStartedSpeakingFrame):
            self._send_ui_event({"type": "state", "state": "listening"})

        elif isinstance(frame, UserStoppedSpeakingFrame):
            self._send_ui_event({"type": "state", "state": "thinking"})

        elif isinstance(frame, BotStartedSpeakingFrame):
            self._send_ui_event({"type": "state", "state": "speaking"})

        elif isinstance(frame, BotStoppedSpeakingFrame):
            self._send_ui_event({"type": "state", "state": "listening"})

        # 2. Subtítulos parciales mientras el candidato habla
        elif isinstance(frame, InterimTranscriptionFrame):
            text = frame.text.strip()
            if text:
                self._send_ui_event({
                    "type": "interim_transcript",
                    "sender": "user",
                    "text": text,
                })

        # 3. Streaming de tokens del LLM para subtítulos en vivo del bot
        elif isinstance(frame, TextFrame):
            if frame.text:
                self._send_ui_event({
                    "type": "bot_utterance_chunk",
                    "text": frame.text,
                })

        # Propagar el frame sin alterar el flujo del pipeline
        await self.push_frame(frame, direction)
