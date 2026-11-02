// frontend/src/core/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface UploadCVResponse {
  session_id: string;
  candidate_name: string;
  cv_filename: string;
  character_count: number;
  text_preview: string;
  message: string;
  language?: string;
}

export interface WebRTCOfferPayload {
  sdp: string;
  type: string;
  session_id?: string;
  pc_id?: string;
  restart_pc?: boolean;
}

export interface WebRTCOfferResponse {
  sdp: string;
  type: string;
  pc_id: string;
  session_id: string;
}

export const api = {
  /**
   * Sube el CV al backend de FastAPI, envía las reglas/prompt personalizado para el LLM,
   * el idioma seleccionado y extrae el texto del documento.
   */
  async uploadCV(
    file: File | null,
    candidateName: string,
    customPrompt?: string,
    language: string = 'es',
    focusMode: string = 'cv_based',
    customTopic?: string
  ): Promise<UploadCVResponse> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('candidate_name', candidateName);
    formData.append('language', language);
    formData.append('focus_mode', focusMode);
    if (customTopic && customTopic.trim()) {
      formData.append('custom_topic', customTopic.trim());
    }
    if (customPrompt && customPrompt.trim()) {
      formData.append('custom_prompt', customPrompt.trim());
    }

    const response = await fetch(`${API_BASE_URL}/interview/upload-cv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: 'Error al procesar el CV en el servidor' }));
      throw new Error(errorData.detail || `Error HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Actualiza el idioma de la sesión en el backend.
   */
  async changeSessionLanguage(sessionId: string, language: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/interview/session/${sessionId}/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
    } catch (err) {
      console.warn('No se pudo sincronizar el idioma por REST API:', err);
    }
  },

  /**
   * Actualiza el enfoque de la entrevista en el backend.
   */
  async changeSessionFocus(
    sessionId: string,
    focusMode: string,
    customTopic?: string
  ): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/interview/session/${sessionId}/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus_mode: focusMode, custom_topic: customTopic }),
      });
    } catch (err) {
      console.warn('No se pudo sincronizar el enfoque por REST API:', err);
    }
  },

  /**
   * Negocia la oferta SDP de WebRTC con el backend de Pipecat (SmallWebRTCTransport).
   */
  async sendWebRTCOffer(payload: WebRTCOfferPayload): Promise<WebRTCOfferResponse> {
    const response = await fetch(`${API_BASE_URL}/interview/webrtc/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: 'Error negociando conexión WebRTC con Pipecat' }));
      throw new Error(errorData.detail || `Error WebRTC HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Comprueba el estado de salud del backend FastAPI.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },
};
