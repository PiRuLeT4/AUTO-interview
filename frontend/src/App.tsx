import { useState, useEffect } from 'react';
import type { AppState } from './types';
import { LobbyView } from './features/lobby/LobbyView';
import { InterviewRoom } from './features/interview/InterviewRoom';
import { FinishedView } from './features/finished/FinishedView';
import { api } from './core/api';
import { Wifi, WifiOff } from 'lucide-react';
import { LanguageProvider, useLanguage, type InterviewLanguage, type InterviewFocusMode } from './core/i18n';

function AppContent() {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<AppState>('lobby');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [candidateName, setCandidateName] = useState('Alex Martínez');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [focusMode, setFocusMode] = useState<InterviewFocusMode>('cv_based');
  const [customTopic, setCustomTopic] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Verificar estado del backend FastAPI al cargar
  useEffect(() => {
    const checkApi = async () => {
      const isUp = await api.checkHealth();
      setBackendOnline(isUp);
    };
    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => clearInterval(interval);
  }, []);

  // Iniciar Práctica / Entrevista
  const handleStartInterview = async (data: {
    candidateName: string;
    cvFile: File | null;
    customPrompt?: string;
    language: InterviewLanguage;
    focusMode: InterviewFocusMode;
    customTopic?: string;
  }) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await api.uploadCV(
        data.cvFile,
        data.candidateName,
        data.customPrompt,
        data.language,
        data.focusMode,
        data.customTopic
      );
      setSessionId(result.session_id);
      setCandidateName(result.candidate_name);
      setCvFile(data.cvFile);
      setFocusMode(data.focusMode);
      setCustomTopic(data.customTopic);

      setCurrentView('interviewing');
    } catch (err) {
      console.warn('Backend no disponible o error configurando sesión:', err);
      setUploadError(
        err instanceof Error ? err.message : 'Error comunicando con el servidor FastAPI.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinishInterview = () => {
    setCurrentView('finished');
  };

  const handleRestart = () => {
    setSessionId(undefined);
    setCvFile(null);
    setFocusMode('cv_based');
    setCustomTopic(undefined);
    setUploadError(null);
    setCurrentView('lobby');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
      {/* Barra de Navegación Global */}
      <header className="border-b border-slate-800/90 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-2">
              {t.appTitle}
              <span className="text-[10px] font-medium tracking-wide uppercase bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                {t.badgeRole}
              </span>
            </h1>
          </div>
        </div>

        {/* Estado del Backend FastAPI */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
              backendOnline
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title={backendOnline ? t.serverConnected : t.serverDisconnected}
          >
            {backendOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>{t.serverConnected}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-slate-500" />
                <span>{t.serverDisconnected}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Área Principal de Contenido Dinámico */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {currentView === 'lobby' && (
          <LobbyView
            onStartInterview={handleStartInterview}
            isLoading={isUploading}
            error={uploadError}
          />
        )}

        {currentView === 'interviewing' && (
          <InterviewRoom
            sessionId={sessionId}
            candidateName={candidateName}
            cvFileName={cvFile?.name || 'curriculum.pdf'}
            focusMode={focusMode}
            customTopic={customTopic}
            onFinish={handleFinishInterview}
          />
        )}

        {currentView === 'finished' && (
          <FinishedView
            candidateName={candidateName}
            cvFileName={cvFile?.name || 'curriculum.pdf'}
            focusMode={focusMode}
            customTopic={customTopic}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
