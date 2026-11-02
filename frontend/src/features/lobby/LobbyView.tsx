import React, { useState, useEffect } from 'react';
import { CVUploadZone } from './components/CVUploadZone';
import {
  Mic,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sliders,
  RotateCcw,
  Globe,
  Target,
  FileText,
  PenTool,
} from 'lucide-react';
import { useLanguage, type InterviewLanguage, type InterviewFocusMode } from '../../core/i18n';

interface LobbyViewProps {
  onStartInterview: (data: {
    candidateName: string;
    cvFile: File | null;
    customPrompt?: string;
    language: InterviewLanguage;
    focusMode: InterviewFocusMode;
    customTopic?: string;
  }) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onStartInterview,
  isLoading = false,
  error = null,
}) => {
  const { language, setLanguage, t, presets, defaultPrompt } = useLanguage();
  const [candidateName, setCandidateName] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [focusMode, setFocusMode] = useState<InterviewFocusMode>('cv_based');
  const [customTopic, setCustomTopic] = useState('');
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [userEditedPrompt, setUserEditedPrompt] = useState(false);

  // Cuando cambia el idioma, si el usuario no ha escrito un prompt personalizado a mano,
  // adaptamos el prompt al nuevo idioma por defecto
  useEffect(() => {
    if (!userEditedPrompt) {
      setPrompt(defaultPrompt);
    }
  }, [defaultPrompt, userEditedPrompt]);

  const isCustomized = prompt.trim() !== defaultPrompt.trim();

  const handleLanguageChange = (newLang: InterviewLanguage) => {
    if (newLang === language) return;
    setLanguage(newLang);
    if (!userEditedPrompt) {
      const targetPresets = presets;
      if (targetPresets.length > 0) {
        setPrompt(targetPresets[0].prompt);
      }
    }
  };

  const isCvRequired = focusMode === 'cv_based';
  const isReadyToStart = (isCvRequired ? cvFile !== null : customTopic.trim().length > 0) && !isLoading;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToStart) return;
    await onStartInterview({
      candidateName: candidateName.trim() || (language === 'en' ? 'Candidate' : 'Candidato'),
      cvFile: isCvRequired ? cvFile : null,
      customPrompt: prompt.trim(),
      language,
      focusMode,
      customTopic: !isCvRequired ? customTopic.trim() : undefined,
    });
  };

  const focusButtons = [
    {
      id: 'cv_based' as InterviewFocusMode,
      title: t.focusOptionCVTitle,
      description: t.focusOptionCVDesc,
      icon: FileText,
      color: 'text-blue-400',
      activeBorder: 'border-blue-500/50 bg-blue-500/10',
    },
    {
      id: 'custom_topic' as InterviewFocusMode,
      title: t.focusOptionCustomTitle,
      description: t.focusOptionCustomDesc,
      icon: PenTool,
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-500/50 bg-emerald-500/10',
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
    <div className="w-full max-w-2xl mx-auto py-10 px-4">
      {/* Encabezado */}
      <div className="text-center mb-8 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
          <span>{t.lobbyBadge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          {t.lobbyTitle}
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          {t.lobbySubtitle}
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleStart} className="space-y-6">
          {/* Selector Principal de Idioma */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                {t.languageSelectLabel}
              </span>
              <span className="text-[11px] font-normal text-slate-400 normal-case">
                {language === 'es' ? 'Voz y reconocimiento en español' : 'Voice and recognition in English'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                  language === 'es'
                    ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-xs'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                  ES
                </span>
                <span>{t.languageOptionEs}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                  language === 'en'
                    ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-xs'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                  EN
                </span>
                <span>{t.languageOptionEn}</span>
              </button>
            </div>
          </div>

          {/* Selector de Enfoque de la Práctica (Exactamente 2 opciones) */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                {t.lobbyFocusLabel}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {focusButtons.map((btn) => {
                const IconComp = btn.icon;
                const isSelected = focusMode === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => {
                      setFocusMode(btn.id);
                      if (btn.id === 'custom_topic') {
                        setCvFile(null);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? `${btn.activeBorder} text-white shadow-xs`
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${btn.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold block text-slate-100">{btn.title}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {btn.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de Nombre */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              {t.candidateNameLabel}
            </label>
            <input
              id="name"
              type="text"
              placeholder={t.candidateNamePlaceholder}
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-colors disabled:opacity-50"
            />
          </div>

          {/* Estado dinámico: Si es Basado en CV -> Se muestra ÚNICAMENTE la zona de subida de CV */}
          {focusMode === 'cv_based' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>{t.cvLabel}</span>
              </label>
              <CVUploadZone
                selectedFile={cvFile}
                onFileSelect={(file) => setCvFile(file)}
                onFileRemove={() => setCvFile(null)}
              />
            </div>
          )}

          {/* Estado dinámico: Si es Tema Personalizado -> Se muestra ÚNICAMENTE el input del tema (CV upload totalmente borrado) */}
          {focusMode === 'custom_topic' && (
            <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-3 animate-in fade-in duration-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                  {t.focusOptionCustomTitle} ({language === 'es' ? 'Requerido' : 'Required'})
                </span>
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={t.focusCustomPlaceholder}
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  {t.focusCustomSuggestionsLabel}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setCustomTopic(sug)}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors cursor-pointer ${
                        customTopic === sug
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reglas e Instrucciones de la Entrevista (Prompt Personalizable) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.promptLabel}</span>
              </label>
              <div className="flex items-center gap-2">
                {isCustomized && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(defaultPrompt);
                      setUserEditedPrompt(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
                    title={t.promptReset}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.promptReset}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {isPromptExpanded ? t.promptCollapse : t.promptExpand}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {t.promptHint}
            </p>

            {/* Selector de Presets Rápidos */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {presets.map((preset) => {
                const isActive = prompt.trim() === preset.prompt.trim();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                      setUserEditedPrompt(preset.prompt !== defaultPrompt);
                      setIsPromptExpanded(true);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Área de Texto del Prompt */}
            {isPromptExpanded ? (
              <div className="relative mt-2">
                <textarea
                  id="prompt"
                  rows={7}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setUserEditedPrompt(true);
                  }}
                  disabled={isLoading}
                  placeholder={t.promptPlaceholder}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 text-xs leading-relaxed font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors disabled:opacity-50 resize-y min-h-[140px]"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                  <span>{focusMode === 'cv_based' ? t.promptFooterCV : t.promptFooterTopic}</span>
                  <span>{prompt.length} {t.promptFooterChars}</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsPromptExpanded(true)}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span className="truncate max-w-[480px] italic">
                  &ldquo;{prompt.split('\n')[0]}&rdquo;
                </span>
                <span className="text-[11px] text-blue-400 shrink-0 ml-2 font-medium">{t.promptViewEdit}</span>
              </div>
            )}
          </div>

          {/* Feedback de error del backend */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Aviso de Micrófono & Privacidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400">
              <Mic className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{t.noticeMic}</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <span>{t.noticePrivacy}</span>
            </div>
          </div>

          {/* Botón CTA Iniciar */}
          <button
            type="submit"
            disabled={!isReadyToStart}
            className={`w-full py-3 px-6 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isReadyToStart
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{t.btnStarting}</span>
              </>
            ) : (
              <>
                <span>{t.btnStart}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
