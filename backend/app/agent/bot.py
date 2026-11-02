import os
import uuid
from datetime import datetime
from typing import Any
from loguru import logger

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
    LLMContext,
    UserTurnMessageAddedMessage,
    AssistantTurnStoppedMessage,
)
from pipecat.frames.frames import LLMRunFrame
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import BaseTransport

import app.core.config
from app.agent.prompts import get_interviewer_system_prompt, get_focus_switch_instruction
from app.agent.observers import TranscriptObserver
from app.services.session_store import session_store

class InterviewAgentBuilder:
    """
    Constructor del pipeline de voz de Pipecat para la entrevista técnica en vivo.
    Orquesta:
    - WebRTC Audio Input + Silero VAD
    - Deepgram STT (Español o Inglés, Nova-2)
    - NVIDIA NIM (Llama 3.1 70B) / OpenAI LLM
    - Deepgram Aura-2 TTS / Cartesia TTS (Español / Inglés, ultra baja latencia)
    - Sincronización de eventos y transcripciones por DataChannel hacia React
    """

    @staticmethod
    def build_pipeline(
        session_id: str,
        candidate_name: str,
        cv_text: str,
        transport: BaseTransport,
        webrtc_connection: Any | None = None,
        custom_prompt: str | None = None,
        language: str = "es",
        focus_mode: str = "cv_based",
        custom_topic: str | None = None,
    ) -> tuple[PipelineTask, PipelineRunner]:
        current_language = language.lower() if language and language.lower() in ["es", "en"] else "es"
        current_focus = (focus_mode or "cv_based").lower()
        logger.info(
            f"Ensamblando pipeline de Pipecat para sesión {session_id} "
            f"({candidate_name}) en idioma '{current_language}' y enfoque '{current_focus}'..."
        )

        # 1. Credenciales desde .env
        deepgram_key = os.getenv("DEEPGRAM_API_KEY", "")
        cartesia_key = os.getenv("CARTESIA_API_KEY", "")
        nvidia_key = os.getenv("NVIDIA_API_KEY", "")
        openai_key = os.getenv("OPENAI_API_KEY", "")

        # 2. STT: Deepgram con idioma configurable (ES / EN)
        if not deepgram_key:
            logger.warning("DEEPGRAM_API_KEY no detectada en .env.")

        stt_lang = Language.EN if current_language == "en" else Language.ES
        stt = DeepgramSTTService(
            api_key=deepgram_key,
            settings=DeepgramSTTService.Settings(
                language=stt_lang,
                model="nova-2",
                smart_format=True,
                interim_results=True,
            ),
        )

        # 3. LLM: NVIDIA NIM (Llama 3.1) u OpenAI
        if nvidia_key and not openai_key:
            logger.info("Usando NVIDIA NIM LLM (nvidia/nemotron-3.5-bolt-e4b) para el entrevistador.")
            llm = OpenAILLMService(
                api_key=nvidia_key,
                base_url="https://integrate.api.nvidia.com/v1",
                settings=OpenAILLMService.Settings(model="nvidia/nemotron-3.5-bolt-e4b"),
            )
        else:
            logger.info("Usando OpenAI LLM (gpt-4o-mini) para el entrevistador.")
            llm = OpenAILLMService(
                api_key=openai_key,
                settings=OpenAILLMService.Settings(model="gpt-4o-mini"),
            )

        # 4. TTS: Deepgram Aura (recomendado para aprovechar créditos gratuitos), Cartesia u OpenAI
        tts_provider = os.getenv("TTS_PROVIDER", "deepgram").strip().lower()

        def get_deepgram_voice_for_lang(lang: str) -> str:
            if lang == "en":
                return os.getenv("DEEPGRAM_VOICE_ID_EN", "aura-2-luna-en")
            return os.getenv("DEEPGRAM_VOICE_ID", "aura-2-nestor-es")

        current_voice = get_deepgram_voice_for_lang(current_language)

        if tts_provider == "deepgram" and deepgram_key:
            logger.info(f"Usando Deepgram Aura TTS en {current_language} (voz: {current_voice}).")
            tts = DeepgramTTSService(
                api_key=deepgram_key,
                settings=DeepgramTTSService.Settings(
                    voice=current_voice,
                ),
            )
        elif tts_provider == "cartesia" and cartesia_key:
            logger.info(f"Usando Cartesia TTS en {current_language} (baja latencia).")
            cartesia_voice = os.getenv("CARTESIA_VOICE_ID")
            cart_lang = Language.EN if current_language == "en" else Language.ES
            tts = CartesiaTTSService(
                api_key=cartesia_key,
                settings=CartesiaTTSService.Settings(
                    voice=cartesia_voice,
                    model="sonic-2",
                    language=cart_lang,
                ),
            )
        elif deepgram_key:
            logger.info(f"Usando Deepgram Aura TTS en {current_language} (voz: {current_voice}).")
            tts = DeepgramTTSService(
                api_key=deepgram_key,
                settings=DeepgramTTSService.Settings(
                    voice=current_voice,
                ),
            )
        elif cartesia_key:
            logger.info(f"Usando Cartesia TTS en {current_language} (fallback).")
            cartesia_voice = os.getenv("CARTESIA_VOICE_ID")
            cart_lang = Language.EN if current_language == "en" else Language.ES
            tts = CartesiaTTSService(
                api_key=cartesia_key,
                settings=CartesiaTTSService.Settings(
                    voice=cartesia_voice,
                    model="sonic-2",
                    language=cart_lang,
                ),
            )
        else:
            logger.info("Usando OpenAI TTS (alloy).")
            tts = OpenAITTSService(api_key=openai_key, voice="alloy")

        # 5. System Prompt con el CV o el tema especializado inyectado y reglas en el idioma seleccionado
        system_prompt = get_interviewer_system_prompt(
            candidate_name=candidate_name,
            cv_text=cv_text,
            custom_rules=custom_prompt,
            language=current_language,
            focus_mode=current_focus,
            custom_topic=custom_topic,
        )

        context = LLMContext([{"role": "system", "content": system_prompt}])

        # 6. Par de Agregadores (Usuario + Asistente) con Silero VAD integrado
        context_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(
                vad_analyzer=SileroVADAnalyzer(),
            ),
        )
        user_aggregator = context_aggregator.user()
        assistant_aggregator = context_aggregator.assistant()

        # Helper para emitir eventos JSON por el DataChannel de WebRTC hacia React
        def send_ui_event(payload: dict[str, Any]):
            if webrtc_connection is not None:
                try:
                    webrtc_connection.send_app_message(payload)
                except Exception as e:
                    logger.debug(f"[{session_id}] Error enviando mensaje UI: {e}")

        # 7. Eventos de turno de conversación para sincronización en tiempo real con React
        @user_aggregator.event_handler("on_user_turn_started")
        async def on_user_turn_started(aggregator, strategy):
            send_ui_event({"type": "state", "state": "listening"})

        @user_aggregator.event_handler("on_user_turn_message_added")
        async def on_user_turn_message_added(aggregator, message: UserTurnMessageAddedMessage):
            text = (message.content or "").strip()
            if text:
                logger.info(f"[{session_id}] [Candidato]: {text}")
                send_ui_event({
                    "type": "transcript",
                    "message": {
                        "id": str(uuid.uuid4()),
                        "sender": "user",
                        "text": text,
                        "timestamp": datetime.now().strftime("%H:%M"),
                    },
                })
                send_ui_event({"type": "state", "state": "thinking"})

        @assistant_aggregator.event_handler("on_assistant_turn_started")
        async def on_assistant_turn_started(aggregator):
            send_ui_event({"type": "state", "state": "speaking"})

        @assistant_aggregator.event_handler("on_assistant_turn_stopped")
        async def on_assistant_turn_stopped(aggregator, message: AssistantTurnStoppedMessage):
            text = (message.content or "").strip()
            if text:
                logger.info(f"[{session_id}] [Entrevistador]: {text}")
                send_ui_event({
                    "type": "transcript",
                    "message": {
                        "id": str(uuid.uuid4()),
                        "sender": "agent",
                        "text": text,
                        "timestamp": datetime.now().strftime("%H:%M"),
                    },
                })
            send_ui_event({"type": "state", "state": "listening"})

        # 8. Observer para eventos de voz intermedios
        transcript_observer = TranscriptObserver(
            session_id=session_id,
            webrtc_connection=webrtc_connection,
        )

        # 9. Ensamblaje del Pipeline
        pipeline = Pipeline([
            transport.input(),           # Audio entrante del navegador por WebRTC
            stt,                         # Deepgram Speech-to-Text
            transcript_observer,         # Captura transcripciones intermedias y estados
            user_aggregator,             # Agrega el turno del candidato al contexto
            llm,                         # Genera la respuesta / pregunta del entrevistador
            tts,                         # Sintetiza la voz con Deepgram Aura / Cartesia
            transport.output(),          # Envía el audio de vuelta al navegador por WebRTC
            assistant_aggregator,        # Registra la respuesta del bot en el contexto
        ])

        task = PipelineTask(
            pipeline=pipeline,
            params=PipelineParams(
                allow_interruptions=True,
                enable_usage_metrics=True,
            ),
        )

        # 10. Gestión de cambio de idioma en tiempo real desde el DataChannel
        if webrtc_connection is not None:
            @webrtc_connection.event_handler("app-message")
            async def on_app_message(conn, message: dict[str, Any]):
                nonlocal current_language
                if isinstance(message, dict) and message.get("type") == "change_language":
                    new_lang = (message.get("language") or "es").lower()
                    if new_lang in ["es", "en"] and new_lang != current_language:
                        logger.info(
                            f"[{session_id}] Cambio dinámico de idioma solicitado: {current_language} -> {new_lang}"
                        )
                        current_language = new_lang
                        session_store.update_language(session_id, new_lang)

                        # Actualizar STT
                        try:
                            new_stt_lang = Language.EN if new_lang == "en" else Language.ES
                            if hasattr(stt, "set_language"):
                                await stt.set_language(new_stt_lang)
                            logger.info(f"[{session_id}] STT actualizado a {new_stt_lang}")
                        except Exception as e:
                            logger.warning(f"[{session_id}] No se pudo actualizar STT: {e}")

                        # Actualizar TTS
                        try:
                            if hasattr(tts, "set_voice"):
                                new_v = get_deepgram_voice_for_lang(new_lang)
                                await tts.set_voice(new_v)
                                logger.info(f"[{session_id}] TTS voz actualizada a {new_v}")
                        except Exception as e:
                            logger.warning(f"[{session_id}] No se pudo actualizar TTS: {e}")

                        # Inyectar instrucción del sistema al LLM
                        if new_lang == "en":
                            instruction = (
                                "SYSTEM UPDATE: The candidate has switched the interview language to English. "
                                "From this exact moment forward, you MUST conduct the interview and ask all questions ONLY in English. "
                                "Briefly acknowledge the language switch in English, and continue the interview with the next technical question."
                            )
                        else:
                            instruction = (
                                "ACTUALIZACIÓN DEL SISTEMA: El candidato ha cambiado el idioma de la entrevista a español. "
                                "A partir de este momento DEBES conducir la entrevista y formular todas las preguntas ÚNICAMENTE en español. "
                                "Reconoce brevemente el cambio de idioma en español y continúa la entrevista con la siguiente pregunta técnica."
                            )
                        context.add_message({"role": "system", "content": instruction})

                        send_ui_event({"type": "language_changed", "language": new_lang})
                        # Provocar turno para responder inmediatamente en el nuevo idioma
                        await task.queue_frames([LLMRunFrame()])

                elif isinstance(message, dict) and message.get("type") == "change_focus":
                    new_focus = (message.get("focus_mode") or "cv_based").lower()
                    custom_topic = (message.get("custom_topic") or "").strip() or None
                    logger.info(
                        f"[{session_id}] Cambio dinámico de enfoque solicitado: {new_focus} (tema: {custom_topic})"
                    )
                    session_store.update_focus(session_id, new_focus, custom_topic)

                    focus_instruction = get_focus_switch_instruction(
                        focus_mode=new_focus,
                        language=current_language,
                        custom_topic=custom_topic,
                    )
                    context.add_message({"role": "system", "content": focus_instruction})
                    send_ui_event({
                        "type": "focus_changed",
                        "focus_mode": new_focus,
                        "custom_topic": custom_topic,
                    })
                    # Provocar turno para que el entrevistador cambie de tema y formule la primera pregunta
                    await task.queue_frames([LLMRunFrame()])

        # 11. Eventos de ciclo de vida de la conexión WebRTC
        @transport.event_handler("on_client_connected")
        async def on_client_connected(transport_instance, client):
            logger.info(
                f"[{session_id}] Cliente WebRTC conectado ({candidate_name}). "
                f"Iniciando saludo del entrevistador en '{current_language}'..."
            )
            session_store.update_status(session_id, "in_progress")
            send_ui_event({"type": "state", "state": "thinking"})
            # Disparar el primer turno del LLM para que salude al candidato
            await task.queue_frames([LLMRunFrame()])

        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport_instance, client):
            logger.info(f"[{session_id}] Cliente WebRTC desconectado ({candidate_name}). Cerrando pipeline...")
            session_store.update_status(session_id, "completed")
            await task.cancel()

        runner = PipelineRunner(handle_sigint=False)
        return task, runner
