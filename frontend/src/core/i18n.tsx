import React, { createContext, useContext, useState, useMemo } from 'react';

export type InterviewLanguage = 'es' | 'en';

export type InterviewFocusMode = 'cv_based' | 'custom_topic';

export interface PromptPreset {
  name: string;
  prompt: string;
}

export const PROMPT_PRESETS_ES: PromptPreset[] = [
  {
    name: 'Estándar',
    prompt: `Eres un entrevistador técnico senior evaluando a un candidato para un puesto de software.

REGLAS Y OBJETIVOS DE LA ENTREVISTA:
1. Realiza una entrevista técnica profesional, estructurada y dinámica basada en la experiencia y tecnologías del currículum.
2. Haz exactamente una pregunta clara a la vez para permitir que el candidato elabore su respuesta.
3. Evalúa la profundidad técnica, las decisiones de arquitectura tomadas, los problemas difíciles resueltos y las buenas prácticas.
4. Si el candidato da una respuesta superficial o genérica, repregúntale con curiosidad profesional solicitando detalles técnicos concretos.
5. Mantén un tono formal, motivador, empático y respetuoso en todo momento.
6. Habla exclusivamente en español.`,
  },
  {
    name: 'Arquitectura & Sistemas',
    prompt: `Eres un Principal Software Architect evaluando a un ingeniero senior.

REGLAS Y OBJETIVOS DE LA ENTREVISTA:
1. Enfócate exclusivamente en diseño de sistemas, escalabilidad, resiliencia y decisiones de arquitectura basadas en su CV.
2. Haz preguntas sobre trade-offs (concurrencia, bases de datos SQL vs NoSQL, particionamiento, microservicios vs monolitos).
3. Haz una sola pregunta técnica concisa por turno.
4. Desafía amablemente sus decisiones arquitectónicas para evaluar cómo las defiende o adapta.
5. Mantén un tono analítico, formal y profesional.
6. Habla exclusivamente en español.`,
  },
  {
    name: 'Algoritmos & Código',
    prompt: `Eres un evaluador técnico enfocado en lógica y resolución de problemas algorítmicos.

REGLAS Y OBJETIVOS DE LA ENTREVISTA:
1. Evalúa el conocimiento de estructuras de datos, complejidad temporal/espacial (Big-O) y optimización en las tecnologías que el candidato domina según su CV.
2. Plantea escenarios reales y casos de fallo de memoria o rendimiento.
3. Haz exactamente una pregunta clara a la vez.
4. Si el candidato propone una solución ingenua, pregúntale cómo optimizaría cuellos de botella.
5. Mantén un tono estructurado y colaborativo.
6. Habla exclusivamente en español.`,
  },
  {
    name: 'Conductual & Liderazgo',
    prompt: `Eres un Hiring Manager evaluando competencias conductuales, liderazgo y trabajo en equipo.

REGLAS Y OBJETIVOS DE LA ENTREVISTA:
1. Utiliza el método STAR (Situación, Tarea, Acción, Resultado) para indagar en proyectos pasados de su currículum.
2. Pregunta sobre resolución de desacuerdos técnicos, gestión de plazos críticos y mentoría a otros ingenieros.
3. Haz exactamente una pregunta por intervención.
4. Indaga en cómo aprende de los errores y cómo colabora con producto y diseño.
5. Mantén un tono empático, cálido y profesional.
6. Habla exclusivamente en español.`,
  },
  {
    name: 'Profesor / Mentor',
    prompt: `Eres un profesor y mentor técnico senior que evalúa al estudiante/candidato de forma pedagógica y práctica.

REGLAS Y OBJETIVOS DE LA SESIÓN:
1. Formula preguntas técnicas progresivas (de menor a mayor dificultad).
2. Si el candidato dice "no lo sé", duda o responde de forma errónea/imprecisa, CORRÍGELO AMABLEMENTE: explícale de forma clara, directa y concisa (en 1 o 2 frases) el concepto correcto y por qué funciona así.
3. Tras corregirlo o validar su respuesta correcta, haz una pregunta de seguimiento o plantea un nuevo concepto para continuar evaluando su aprendizaje.
4. Mantén un tono pedagógico, paciente, motivador y constructivo.
5. Haz exactamente una sola pregunta por intervención.
6. Habla exclusivamente en español.`,
  },
  {
    name: 'Personalizado',
    prompt: '',
  },
];

export const PROMPT_PRESETS_EN: PromptPreset[] = [
  {
    name: 'Standard Technical',
    prompt: `You are a senior technical interviewer evaluating a candidate for a software engineering position.

INTERVIEW RULES AND OBJECTIVES:
1. Conduct a professional, structured, and dynamic technical interview based on the experience and technologies in the resume.
2. Ask exactly one clear question at a time to allow the candidate to elaborate their response.
3. Evaluate technical depth, architectural trade-offs, complex problems solved, and engineering best practices.
4. If the candidate gives a shallow or generic response, follow up with professional curiosity asking for concrete technical details.
5. Maintain a formal, encouraging, empathetic, and respectful tone at all times.
6. Speak exclusively in English.`,
  },
  {
    name: 'Systems & Architecture',
    prompt: `You are a Principal Software Architect evaluating a senior engineer.

INTERVIEW RULES AND OBJECTIVES:
1. Focus exclusively on system design, scalability, resiliency, and architectural decisions based on their resume.
2. Ask questions about trade-offs (concurrency, SQL vs NoSQL, partitioning, microservices vs monoliths).
3. Ask exactly one concise technical question per turn.
4. Politely challenge their architectural decisions to assess how they defend or adapt them.
5. Maintain an analytical, formal, and professional tone.
6. Speak exclusively in English.`,
  },
  {
    name: 'Algorithms & Code',
    prompt: `You are a technical interviewer focused on logic and algorithmic problem-solving.

INTERVIEW RULES AND OBJECTIVES:
1. Evaluate knowledge of data structures, time and space complexity (Big-O), and optimization in the technologies the candidate knows from their resume.
2. Present realistic scenarios and memory or performance bottlenecks.
3. Ask exactly one clear question at a time.
4. If the candidate proposes a naive solution, ask how they would optimize critical paths.
5. Maintain a structured and collaborative tone.
6. Speak exclusively in English.`,
  },
  {
    name: 'Behavioral & Leadership',
    prompt: `You are a Hiring Manager evaluating behavioral competencies, leadership, and teamwork.

INTERVIEW RULES AND OBJECTIVES:
1. Use the STAR method (Situation, Task, Action, Result) to explore past projects from the candidate's resume.
2. Ask about resolving technical disagreements, handling critical deadlines, and mentoring team members.
3. Ask exactly one question per intervention.
4. Inquire into how they learn from mistakes and collaborate with cross-functional partners.
5. Maintain an empathetic, warm, and professional tone.
6. Speak exclusively in English.`,
  },
  {
    name: 'Teacher / Mentor',
    prompt: `You are a senior technical professor and mentor evaluating the student/candidate in a pedagogical, supportive manner.

RULES AND OBJECTIVES OF THE SESSION:
1. Ask progressive technical questions (from fundamentals to advanced concepts).
2. If the candidate says "I don't know", hesitates, or answers incorrectly/imprecisely, POLITELY CORRECT THEM: explain the correct concept and rationale concisely (in 1 or 2 clear sentences).
3. After correcting or validating their correct response, ask a follow-up question or introduce a related concept to keep testing and strengthening their understanding.
4. Maintain an encouraging, patient, constructive, and educational tone.
5. Ask exactly one question per spoken turn.
6. Speak exclusively in English.`,
  },
  {
    name: 'Custom',
    prompt: '',
  },
];

export const translations = {
  es: {
    // Nav & Global
    appTitle: 'AI-Interview',
    badgeRole: 'Entrevista Profesional',
    serverConnected: 'Servidor Conectado',
    serverDisconnected: 'Servidor Desconectado',

    // LobbyView
    lobbyBadge: 'Sesión de Entrevista Técnica',
    lobbyTitle: 'Bienvenido a tu Entrevista',
    lobbySubtitle: 'Sube tu currículum, selecciona el idioma y personaliza las reglas antes de comenzar la sesión de voz en vivo.',
    languageSelectLabel: 'Idioma de la Entrevista',
    languageOptionEs: 'Español',
    languageOptionEn: 'English (Inglés)',
    lobbyFocusLabel: 'Enfoque de la Práctica',
    lobbyFocusCvOptional: 'Modo conceptual: No es obligatorio subir tu CV.',
    candidateNameLabel: 'Nombre Completo (Opcional)',
    candidateNamePlaceholder: 'Ej. Alex Martínez',
    cvLabel: 'Currículum Vitae (Requerido)',
    promptLabel: 'Reglas de la Entrevista (Prompt del LLM)',
    promptReset: 'Restablecer',
    promptCollapse: 'Contraer',
    promptExpand: 'Modificar reglas',
    promptHint: 'Personaliza el rol del entrevistador, la dificultad o el tipo de preguntas que formulará el modelo durante la llamada.',
    promptPlaceholder: 'Escribe aquí las instrucciones y reglas para el entrevistador...',
    promptFooterCV: 'El currículum del candidato se anexará automáticamente a estas reglas.',
    promptFooterTopic: 'El tema personalizado se anexará automáticamente a estas reglas.',
    promptFooterChars: 'caracteres',
    promptViewEdit: 'Ver / Editar',
    noticeMic: 'Se solicitará acceso a tu micrófono para la conversación en vivo.',
    noticePrivacy: 'La sesión es confidencial y se almacena únicamente con fines de selección.',
    btnStart: 'Comenzar Entrevista',
    btnStarting: 'Analizando currículum y reglas...',

    // CV Upload Zone
    cvDropzoneTitle: 'Arrastra y suelta tu currículum aquí',
    cvDropzoneOr: 'o haz clic para examinar archivos',
    cvDropzoneFormats: 'Admite formatos PDF y DOCX (máx. 5MB)',
    cvSelectedLabel: 'Currículum seleccionado',
    cvChangeFile: 'Cambiar archivo',
    cvRemoveFile: 'Eliminar archivo',
    cvErrorFormat: 'Formato no válido. Solo se admiten archivos PDF o DOCX.',
    cvErrorSize: 'El archivo es demasiado grande. Máximo permitido: 5MB.',

    // InterviewRoom
    candidateHeader: 'Candidato:',
    cvHeader: 'CV:',
    connConnected: 'Conexión Estable',
    connConnecting: 'Conectando audio...',
    connDisconnected: 'Desconectado',
    retryBtn: 'Reintentar',
    btnChangeLanguage: 'Idioma',

    // AgentPresence States
    agentIdleLabel: 'Conectando audio de la sala...',
    agentIdleIndicator: 'En espera',
    agentListeningLabel: 'Escuchando tu respuesta...',
    agentListeningIndicator: 'Tu Turno',
    agentThinkingLabel: 'Procesando evaluación...',
    agentThinkingIndicator: 'Evaluando',
    agentSpeakingLabel: 'Entrevistador formulando pregunta...',
    agentSpeakingIndicator: 'Entrevistador',

    // LiveTranscripts
    transcriptHeader: 'Transcripción de la Conversación',
    transcriptLive: 'En directo',
    transcriptConnecting: 'Conectando canal de audio... El entrevistador iniciará la conversación en breve.',
    speakerAgent: 'Entrevistador',
    speakerUser: 'Tú',
    candidateSpeaking: 'Tú (hablando...)',

    // ControlBar
    controlLive: 'EN VIVO',
    controlDuration: 'Duración:',
    controlMute: 'Silenciar',
    controlMuted: 'Micrófono Silenciado',
    controlEnd: 'Finalizar Entrevista',

    // Focus / Modo de Entrevista
    btnChangeFocus: 'Enfoque',
    activeFocusPrefix: 'Enfoque',
    topicHeader: 'Tema:',
    modalFocusTitle: 'Cambiar Enfoque de la Entrevista',
    modalFocusDescription: 'Elige qué deseas practicar. El entrevistador adaptará sus siguientes preguntas en tiempo real.',
    focusOptionCVTitle: 'Basado en Currículum',
    focusOptionCVDesc: 'Preguntas sobre tu experiencia, cargos y proyectos previos descritos en tu CV.',
    focusOptionCustomTitle: 'Tema Personalizado',
    focusOptionCustomDesc: 'Escribe cualquier tecnología, framework o concepto sobre el que quieras ser entrevistado, sin subir un CV.',
    focusCustomPlaceholder: 'Ej. Docker & Kubernetes, Concurrencia en Go, Optimización PostgreSQL, React 19...',
    focusCustomSuggestionsLabel: 'Sugerencias rápidas:',
    modalFocusNotice: 'El entrevistador reconocerá el cambio de forma natural y formulará la siguiente pregunta sobre este enfoque.',
    modalFocusBtnApply: 'Aplicar Enfoque',
    modalFocusBtnCancel: 'Cancelar',

    // Language Modal
    modalLangTitle: 'Cambiar Idioma de la Entrevista',
    modalLangDescription: 'Selecciona el idioma deseado. La voz del entrevistador de IA, el reconocimiento de voz y toda la interfaz se adaptarán en tiempo real.',
    modalLangOptionEsTitle: 'Español',
    modalLangOptionEsDesc: 'Entrevista en español con voz natural y reconocimiento de voz en castellano.',
    modalLangOptionEnTitle: 'English',
    modalLangOptionEnDesc: 'Interview in English with natural voice and fluent speech recognition.',
    modalLangNotice: 'El cambio surtirá efecto de inmediato durante la llamada en curso.',
    modalLangBtnApply: 'Aplicar Cambio',
    modalLangBtnCancel: 'Cancelar',

    // FinishedView
    finishedBadge: 'Práctica Finalizada',
    finishedTitle: '¡Práctica Completada!',
    finishedSubtitle: 'Gracias, {name}. Has completado tu sesión de práctica técnica con el entrevistador de IA.',
    finishedSummaryCV: 'Currículum / Enfoque',
    finishedBtnRestart: 'Iniciar Nueva Práctica',
  },

  en: {
    // Nav & Global
    appTitle: 'AI-Interview',
    badgeRole: 'Professional Interview',
    serverConnected: 'Server Connected',
    serverDisconnected: 'Server Disconnected',

    // LobbyView
    lobbyBadge: 'Technical Interview Session',
    lobbyTitle: 'Welcome to your Interview',
    lobbySubtitle: 'Upload your resume, select the language, and customize rules before starting the real-time voice call.',
    languageSelectLabel: 'Interview Language',
    languageOptionEs: 'Español (Spanish)',
    languageOptionEn: 'English',
    lobbyFocusLabel: 'Practice Focus',
    lobbyFocusCvOptional: 'Concept mode: Uploading a resume is optional.',
    candidateNameLabel: 'Full Name (Optional)',
    candidateNamePlaceholder: 'e.g. Alex Martinez',
    cvLabel: 'Resume / CV (Required)',
    promptLabel: 'Interview Rules (LLM Prompt)',
    promptReset: 'Reset',
    promptCollapse: 'Collapse',
    promptExpand: 'Modify rules',
    promptHint: 'Customize the interviewer role, technical depth, or question types that the AI model will focus on.',
    promptPlaceholder: 'Enter instructions and evaluation rules for the interviewer here...',
    promptFooterCV: "The candidate's resume will automatically be appended to these rules.",
    promptFooterTopic: 'The custom topic will automatically be appended to these rules.',
    promptFooterChars: 'characters',
    promptViewEdit: 'View / Edit',
    noticeMic: 'Microphone permission will be requested for live voice conversation.',
    noticePrivacy: 'This session is confidential and stored solely for evaluation purposes.',
    btnStart: 'Start Interview',
    btnStarting: 'Analyzing resume and rules...',

    // CV Upload Zone
    cvDropzoneTitle: 'Drag and drop your resume here',
    cvDropzoneOr: 'or click to browse files',
    cvDropzoneFormats: 'Supports PDF and DOCX formats (max. 5MB)',
    cvSelectedLabel: 'Selected resume',
    cvChangeFile: 'Change file',
    cvRemoveFile: 'Remove file',
    cvErrorFormat: 'Invalid file format. Only PDF and DOCX files are allowed.',
    cvErrorSize: 'The file is too large. Maximum size allowed: 5MB.',

    // InterviewRoom
    candidateHeader: 'Candidate:',
    cvHeader: 'CV:',
    connConnected: 'Stable Connection',
    connConnecting: 'Connecting audio...',
    connDisconnected: 'Disconnected',
    retryBtn: 'Retry',
    btnChangeLanguage: 'Language',

    // AgentPresence States
    agentIdleLabel: 'Connecting room audio...',
    agentIdleIndicator: 'Standby',
    agentListeningLabel: 'Listening to your answer...',
    agentListeningIndicator: 'Your Turn',
    agentThinkingLabel: 'Processing evaluation...',
    agentThinkingIndicator: 'Evaluating',
    agentSpeakingLabel: 'Interviewer asking question...',
    agentSpeakingIndicator: 'Interviewer',

    // LiveTranscripts
    transcriptHeader: 'Conversation Transcript',
    transcriptLive: 'Live',
    transcriptConnecting: 'Connecting audio channel... The interviewer will start the conversation shortly.',
    speakerAgent: 'Interviewer',
    speakerUser: 'You',
    candidateSpeaking: 'You (speaking...)',

    // ControlBar
    controlLive: 'LIVE',
    controlDuration: 'Duration:',
    controlMute: 'Mute',
    controlMuted: 'Microphone Muted',
    controlEnd: 'End Interview',

    // Focus / Interview Mode
    btnChangeFocus: 'Focus',
    activeFocusPrefix: 'Focus',
    topicHeader: 'Topic:',
    modalFocusTitle: 'Change Interview Focus',
    modalFocusDescription: 'Choose what you want to practice. The interviewer will adapt their next questions in real time.',
    focusOptionCVTitle: 'Resume & Experience',
    focusOptionCVDesc: 'Questions on past roles, achievements, and tech stack listed in your resume.',
    focusOptionCustomTitle: 'Custom Topic',
    focusOptionCustomDesc: 'Type any framework, technology, or topic you want to be quizzed on without uploading a resume.',
    focusCustomPlaceholder: 'e.g. Docker & Kubernetes, Go concurrency, PostgreSQL query tuning, React 19...',
    focusCustomSuggestionsLabel: 'Quick suggestions:',
    modalFocusNotice: 'The interviewer will acknowledge the transition naturally and ask the next question on this focus.',
    modalFocusBtnApply: 'Apply Focus',
    modalFocusBtnCancel: 'Cancel',

    // Language Modal
    modalLangTitle: 'Change Interview Language',
    modalLangDescription: "Select your preferred language. The AI interviewer's voice, speech recognition, and all interface text will adapt in real time.",
    modalLangOptionEsTitle: 'Español (Spanish)',
    modalLangOptionEsDesc: 'Interview in Spanish with natural voice and Spanish speech recognition.',
    modalLangOptionEnTitle: 'English',
    modalLangOptionEnDesc: 'Interview in English with natural voice and fluent speech recognition.',
    modalLangNotice: 'The change will take effect immediately during the active call.',
    modalLangBtnApply: 'Apply Change',
    modalLangBtnCancel: 'Cancel',

    // FinishedView
    finishedBadge: 'Practice Finished',
    finishedTitle: 'Practice Complete!',
    finishedSubtitle: 'Thank you, {name}. You have finished your technical interview practice session with the AI interviewer.',
    finishedSummaryCV: 'Resume / Focus',
    finishedBtnRestart: 'Start New Practice',
  },
};

interface LanguageContextType {
  language: InterviewLanguage;
  setLanguage: (lang: InterviewLanguage) => void;
  t: typeof translations.es;
  presets: PromptPreset[];
  defaultPrompt: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'auto_interview_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<InterviewLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'es' || saved === 'en') return saved;
    } catch {}
    return 'es';
  });

  const setLanguage = (lang: InterviewLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  };

  const t = translations[language];
  const presets = language === 'en' ? PROMPT_PRESETS_EN : PROMPT_PRESETS_ES;
  const defaultPrompt = presets[0].prompt;

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      presets,
      defaultPrompt,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
