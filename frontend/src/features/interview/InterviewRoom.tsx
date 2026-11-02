import React, { useState } from 'react';
import { AgentPresence } from './components/AgentPresence';
import { LiveTranscripts } from './components/LiveTranscripts';
import { ControlBar } from './components/ControlBar';
import { useWebRTCInterview } from './hooks/useWebRTCInterview';
import {
  AlertCircle,
  RefreshCw,
  Wifi,
  Globe,
  X,
  Check,
  Sparkles,
  Target,
  FileText,
  PenTool,
} from 'lucide-react';
import { useLanguage, type InterviewLanguage, type InterviewFocusMode } from '../../core/i18n';

interface InterviewRoomProps {
  sessionId?: string;
  candidateName: string;
  cvFileName?: string;
  focusMode?: InterviewFocusMode;
  customTopic?: string;
  onFinish: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  sessionId,
  candidateName,
  cvFileName,
  focusMode: initialFocus = 'cv_based',
  customTopic: initialTopic,
  onFinish,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<InterviewLanguage>(language);

  const {
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
    disconnect,
    retryConnection,
  } = useWebRTCInterview({ sessionId, initialFocus, initialTopic });

  const [selectedFocus, setSelectedFocus] = useState<InterviewFocusMode>(
    (currentFocus as InterviewFocusMode) || initialFocus || 'cv_based'
  );
  const [customTopicInput, setCustomTopicInput] = useState(customTopic || initialTopic || '');

  const handleHangup = () => {
    disconnect();
    onFinish();
  };

  const openLangModal = () => {
    setSelectedLang(language);
    setIsLangModalOpen(true);
  };

  const handleApplyLanguage = () => {
    if (selectedLang !== language) {
      setLanguage(selectedLang);
      changeLanguage(selectedLang);
    }
    setIsLangModalOpen(false);
  };

  const openFocusModal = () => {
    setSelectedFocus((currentFocus as InterviewFocusMode) || initialFocus || 'cv_based');
    setCustomTopicInput(customTopic || initialTopic || '');
    setIsFocusModalOpen(true);
  };

  const handleApplyFocus = () => {
    changeInterviewFocus(selectedFocus, customTopicInput.trim() || undefined);
    setIsFocusModalOpen(false);
  };

  const getFocusBadgeLabel = () => {
    if (currentFocus === 'custom_topic') {
      return customTopic || initialTopic || t.focusOptionCustomTitle;
    }
    return t.focusOptionCVTitle;
  };

  const focusOptions = [
    {
      id: 'cv_based' as InterviewFocusMode,
      title: t.focusOptionCVTitle,
      description: t.focusOptionCVDesc,
      icon: FileText,
      iconColor: 'text-blue-400',
      badge: 'CV',
    },
    {
      id: 'custom_topic' as InterviewFocusMode,
      title: t.focusOptionCustomTitle,
      description: t.focusOptionCustomDesc,
      icon: PenTool,
      iconColor: 'text-emerald-400',
      badge: 'Tema',
    },
  ];

  const quickSuggestions = [
    'Docker & Kubernetes',
    'Concurrencia & Threads',
    'SQL vs NoSQL',
    'REST vs GraphQL',
    'Caché & Redis',
    'React 19 & Server Components',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-between min-h-[calc(100vh-10rem)] py-4 px-4 space-y-6">
      {/* Barra de contexto superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/70 border border-slate-800 px-4 py-2.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">{t.candidateHeader}</span>
          <span className="font-semibold text-slate-200">{candidateName}</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Selector modal de Enfoque */}
          <button
            type="button"
            onClick={openFocusModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700/80 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title={t.modalFocusTitle}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-normal">{t.activeFocusPrefix}:</span>
            <span className="font-semibold text-emerald-300 max-w-[140px] truncate">
              {getFocusBadgeLabel()}
            </span>
          </button>

          {/* Selector modal de Idioma */}
          <button
            type="button"
            onClick={openLangModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700/80 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title={t.modalLangTitle}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'es' ? 'ES' : 'EN'}</span>
          </button>

          {/* Indicador de Conexión WebRTC */}
          <div className="flex items-center gap-1.5">
            <Wifi
              className={`w-3.5 h-3.5 ${
                connectionStatus === 'connected'
                  ? 'text-emerald-400'
                  : connectionStatus === 'connecting'
                    ? 'text-amber-400 animate-pulse'
                    : 'text-rose-400'
              }`}
            />
            <span className="font-medium text-[11px] hidden sm:inline">
              {connectionStatus === 'connected'
                ? t.connConnected
                : connectionStatus === 'connecting'
                  ? t.connConnecting
                  : t.connDisconnected}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
            {currentFocus === 'custom_topic' ? (
              <>
                <span className="text-slate-500">{t.topicHeader || 'Tema:'}</span>
                <span className="font-mono text-emerald-400 truncate max-w-[160px]">
                  {customTopic || initialTopic || 'Tema Personalizado'}
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-500">{t.cvHeader}</span>
                <span className="font-mono text-blue-400 truncate max-w-[160px]">{cvFileName || 'curriculum.pdf'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alerta en caso de fallo de permisos de micrófono o red WebRTC */}
      {connectionStatus === 'error' && errorMessage && (
        <div className="flex items-center justify-between gap-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={retryConnection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.retryBtn}</span>
          </button>
        </div>
      )}

      {/* Zona Central: Presencia del Agente con Espectro de Voz Real */}
      <div className="flex-1 flex items-center justify-center">
        <AgentPresence state={agentState} audioFrequencies={audioFrequencies} />
      </div>

      {/* Zona Inferior: Subtítulos en vivo y Controles */}
      <div className="space-y-4">
        <LiveTranscripts
          transcripts={transcripts}
          currentUtterance={currentUtterance}
          userInterimText={userInterimText}
        />
        <ControlBar
          onHangup={handleHangup}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenFocusModal={openFocusModal}
          onOpenLangModal={openLangModal}
        />
      </div>

      {/* Modal para Cambiar Enfoque de la Entrevista */}
      {isFocusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-left max-h-[90vh] flex flex-col">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-white tracking-tight">
                  {t.modalFocusTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFocusModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Descripción */}
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.modalFocusDescription}
            </p>

            {/* Opciones de Enfoque */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {focusOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedFocus === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedFocus(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-2 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/60 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 ${opt.iconColor}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {opt.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                          {opt.badge}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 pl-9">
                      {opt.description}
                    </p>

                    {/* Campo adicional si se selecciona 'custom_topic' */}
                    {opt.id === 'custom_topic' && isSelected && (
                      <div className="pt-2 pl-9 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={customTopicInput}
                          onChange={(e) => setCustomTopicInput(e.target.value)}
                          placeholder={t.focusCustomPlaceholder}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                        />
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-medium">
                            {t.focusCustomSuggestionsLabel}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {quickSuggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setCustomTopicInput(sug)}
                                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Aviso informativo */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{t.modalFocusNotice}</span>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsFocusModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                {t.modalFocusBtnCancel}
              </button>
              <button
                type="button"
                onClick={handleApplyFocus}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                {t.modalFocusBtnApply}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Cambiar Idioma en Tiempo Real */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-white tracking-tight">
                  {t.modalLangTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Descripción */}
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.modalLangDescription}
            </p>

            {/* Opciones de Idioma */}
            <div className="space-y-3">
              {/* Opción Español */}
              <button
                type="button"
                onClick={() => setSelectedLang('es')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedLang === 'es'
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      ES
                    </span>
                    <span className="text-sm font-medium text-white">
                      {t.modalLangOptionEsTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-7">
                    {t.modalLangOptionEsDesc}
                  </p>
                </div>
                {selectedLang === 'es' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>

              {/* Opción Inglés */}
              <button
                type="button"
                onClick={() => setSelectedLang('en')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedLang === 'en'
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      EN
                    </span>
                    <span className="text-sm font-medium text-white">
                      {t.modalLangOptionEnTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-7">
                    {t.modalLangOptionEnDesc}
                  </p>
                </div>
                {selectedLang === 'en' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            </div>

            {/* Aviso de sincronización en tiempo real */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-400" />
              <span>{t.modalLangNotice}</span>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                {t.modalLangBtnCancel}
              </button>
              <button
                type="button"
                onClick={handleApplyLanguage}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                {t.modalLangBtnApply}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
