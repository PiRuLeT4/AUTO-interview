import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentState, TranscriptMessage } from '../../../types';
import { api } from '../../../core/api';

export type WebRTCConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebRTCInterviewParams {
  sessionId?: string;
  initialFocus?: string;
  initialTopic?: string;
}

const BAR_COUNT = 40;

export function useWebRTCInterview({ sessionId, initialFocus = 'cv_based', initialTopic }: UseWebRTCInterviewParams) {
  const [connectionStatus, setConnectionStatus] = useState<WebRTCConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState('');
  const [userInterimText, setUserInterimText] = useState('');
  const [currentFocus, setCurrentFocus] = useState<string>(initialFocus);
  const [customTopic, setCustomTopic] = useState<string | undefined>(initialTopic);
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 6)
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // Referencias para Web Audio API (espectro de voz real)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const botAnalyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const agentStateRef = useRef<AgentState>('idle');

  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.srcObject = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // Bucle de análisis de frecuencias reales (60fps con Web Audio API)
  const startFrequencyLoop = useCallback(() => {
    const freqData = new Uint8Array(64);

    const updateBars = () => {
      const currentState = agentStateRef.current;
      const activeAnalyser =
        currentState === 'speaking'
          ? botAnalyserRef.current
          : currentState === 'listening'
            ? micAnalyserRef.current
            : null;

      if (activeAnalyser) {
        activeAnalyser.getByteFrequencyData(freqData);
        const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
          // Mapear las frecuencias vocales humanas (bins 1..32) alrededor del círculo
          const binIndex = (i % 24) + 1;
          const val = freqData[binIndex] || 0;
          const normalized = val / 255;
          return Math.round(6 + normalized * 36);
        });
        setAudioFrequencies(bars);
      } else {
        setAudioFrequencies((prev) =>
          prev.map((h) => (h > 6 ? Math.max(6, Math.round(h * 0.85)) : 6))
        );
      }

      rafRef.current = requestAnimationFrame(updateBars);
    };

    rafRef.current = requestAnimationFrame(updateBars);
  }, []);

  const connect = useCallback(async () => {
    cleanup();
    setConnectionStatus('connecting');
    setErrorMessage(null);

    try {
      // 1. Solicitar micrófono del usuario con cancelación de eco y supresión de ruido
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = localStream;

      // Inicializar Web Audio API para analizar la voz del micrófono
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const micSource = audioCtx.createMediaStreamSource(localStream);
      const micAnalyser = audioCtx.createAnalyser();
      micAnalyser.fftSize = 128;
      micAnalyser.smoothingTimeConstant = 0.75;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;

      // 2. Crear RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      // 3. Añadir Transceivers en el orden esperado por SmallWebRTCConnection:
      // Index 0: Audio (sendrecv con el track del micrófono)
      // Index 1: Video (recvonly para mantener alineación de transceivers)
      const audioTrack = localStream.getAudioTracks()[0];
      pc.addTransceiver(audioTrack, { direction: 'sendrecv', streams: [localStream] });
      pc.addTransceiver('video', { direction: 'recvonly' });

      // 4. Recibir el track de audio remoto (la voz de Cartesia TTS desde Pipecat)
      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          const remoteStream = event.streams[0] || new MediaStream([event.track]);

          if (!remoteAudioElRef.current) {
            const audioEl = new Audio();
            audioEl.autoplay = true;
            remoteAudioElRef.current = audioEl;
          }
          remoteAudioElRef.current.srcObject = remoteStream;
          remoteAudioElRef.current.play().catch((err) => {
            console.warn('Autoplay bloqueado temporalmente:', err);
          });

          // Conectar el stream remoto al analizador de espectro para animar la onda circular
          if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            try {
              const botSource = audioCtxRef.current.createMediaStreamSource(remoteStream);
              const botAnalyser = audioCtxRef.current.createAnalyser();
              botAnalyser.fftSize = 128;
              botAnalyser.smoothingTimeConstant = 0.7;
              botSource.connect(botAnalyser);
              botAnalyserRef.current = botAnalyser;
            } catch (e) {
              console.debug('Error conectando analizador remoto:', e);
            }
          }
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setConnectionStatus('connected');
        } else if (state === 'failed' || state === 'closed') {
          setConnectionStatus('disconnected');
        }
      };

      // 5. Crear DataChannel para sincronización de estados, subtítulos y keep-alive
      const dc = pc.createDataChannel('pipecat');
      dcRef.current = dc;

      dc.onopen = () => {
        setConnectionStatus('connected');
        // Enviar ping cada 1s según requiere SmallWebRTCConnection.is_connected()
        pingIntervalRef.current = window.setInterval(() => {
          if (dc.readyState === 'open') {
            dc.send(`ping:${Date.now()}`);
          }
        }, 1000);
      };

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state' && data.state) {
            setAgentState(data.state as AgentState);
            if (data.state === 'listening') {
              setCurrentUtterance('');
            }
          } else if (data.type === 'transcript' && data.message) {
            const msg: TranscriptMessage = data.message;
            setTranscripts((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            if (msg.sender === 'agent') {
              setCurrentUtterance('');
            } else {
              setUserInterimText('');
            }
          } else if (data.type === 'bot_utterance_chunk' && data.text) {
            setCurrentUtterance((prev) => prev + data.text);
          } else if (data.type === 'interim_transcript' && data.text) {
            setUserInterimText(data.text);
          } else if (data.type === 'focus_changed' && data.focus_mode) {
            setCurrentFocus(data.focus_mode);
            setCustomTopic(data.custom_topic);
          }
        } catch {
          // Ignorar mensajes no JSON
        }
      };

      // 6. Crear oferta SDP y esperar gathering de candidatos ICE locales
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
          return;
        }
        const timeout = window.setTimeout(() => {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }, 1500);
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            window.clearTimeout(timeout);
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
      });

      const localDesc = pc.localDescription;
      if (!localDesc) {
        throw new Error('No se pudo generar la descripción SDP local.');
      }

      // 7. Enviar SDP Offer a FastAPI (/api/interview/webrtc/offer) y recibir SDP Answer
      const answer = await api.sendWebRTCOffer({
        sdp: localDesc.sdp,
        type: localDesc.type,
        session_id: sessionId,
      });

      await pc.setRemoteDescription(
        new RTCSessionDescription({ sdp: answer.sdp, type: answer.type as RTCSdpType })
      );

      // Iniciar bucle de espectro de audio real
      startFrequencyLoop();
    } catch (err) {
      console.error('Error conectando WebRTC:', err);
      setConnectionStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo acceder al micrófono o conectar con el servidor WebRTC.'
      );
    }
  }, [cleanup, sessionId, startFrequencyLoop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 0);
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [connect, cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    const nextMuted = !isMuted;
    audioTrack.enabled = !nextMuted;
    setIsMuted(nextMuted);

    // Notificar a SmallWebRTCConnection sobre el estado del track de micrófono
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(
        JSON.stringify({
          type: 'signalling',
          message: {
            type: 'trackStatus',
            receiver_index: 0,
            enabled: !nextMuted,
          },
        })
      );
    }
  }, [isMuted]);

  const changeLanguage = useCallback((newLang: 'es' | 'en') => {
    // 1. Enviar evento al agente por el DataChannel de WebRTC
    if (dcRef.current && dcRef.current.readyState === 'open') {
      try {
        dcRef.current.send(
          JSON.stringify({
            type: 'change_language',
            language: newLang,
          })
        );
      } catch (e) {
        console.warn('Error enviando cambio de idioma por DataChannel:', e);
      }
    }
    // 2. Sincronizar en el backend mediante REST API si tenemos sessionId
    if (sessionId) {
      api.changeSessionLanguage(sessionId, newLang);
    }
  }, [sessionId]);

  const changeInterviewFocus = useCallback((focusMode: string, topic?: string) => {
    setCurrentFocus(focusMode);
    setCustomTopic(topic);

    // 1. Enviar evento al agente por el DataChannel de WebRTC
    if (dcRef.current && dcRef.current.readyState === 'open') {
      try {
        dcRef.current.send(
          JSON.stringify({
            type: 'change_focus',
            focus_mode: focusMode,
            custom_topic: topic,
          })
        );
      } catch (e) {
        console.warn('Error enviando cambio de enfoque por DataChannel:', e);
      }
    }
    // 2. Sincronizar en el backend mediante REST API si tenemos sessionId
    if (sessionId) {
      api.changeSessionFocus(sessionId, focusMode, topic);
    }
  }, [sessionId]);

  return {
    connectionStatus,
    errorMessage,
    agentState,
    isMuted,
    transcripts,
    currentUtterance,
    userInterimText,
    audioFrequencies,
    currentFocus,
    customTopic,
    toggleMute,
    changeLanguage,
    changeInterviewFocus,
    disconnect: cleanup,
    retryConnection: connect,
  };
}
