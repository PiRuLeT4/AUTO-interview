import React, { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Radio, Target, Globe } from 'lucide-react';
import { useLanguage } from '../../../core/i18n';

interface ControlBarProps {
  onHangup: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenFocusModal?: () => void;
  onOpenLangModal?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onHangup,
  isMuted = false,
  onToggleMute,
  onOpenFocusModal,
  onOpenLangModal,
}) => {
  const { t, language } = useLanguage();
  const [seconds, setSeconds] = useState(0);

  // Cronómetro de la llamada
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-xl px-4 sm:px-5 py-3 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Indicador de En Vivo & Tiempo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-medium">
          <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
          <span>{t.controlLive}</span>
        </div>
        <span className="text-xs font-mono text-slate-300 font-medium">
          {t.controlDuration} {formatTimer(seconds)}
        </span>
      </div>

      {/* Botones de acción centrales */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        {/* Botón de Enfoque / Modo */}
        {onOpenFocusModal && (
          <button
            type="button"
            onClick={onOpenFocusModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
            title={t.modalFocusTitle}
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>{t.btnChangeFocus}</span>
          </button>
        )}

        {/* Botón de Idioma */}
        {onOpenLangModal && (
          <button
            type="button"
            onClick={onOpenLangModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors cursor-pointer"
            title={t.modalLangTitle}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>{language === 'es' ? 'ES' : 'EN'}</span>
          </button>
        )}

        {/* Toggle Micrófono */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isMuted
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title={isMuted ? t.controlMuted : t.controlMute}
        >
          {isMuted ? (
            <>
              <MicOff className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{t.controlMuted}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-slate-200" />
              <span className="hidden sm:inline">{t.controlMute}</span>
            </>
          )}
        </button>

        {/* Botón Colgar / Finalizar */}
        <button
          type="button"
          onClick={onHangup}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
          title={t.controlEnd}
        >
          <PhoneOff className="w-4 h-4" />
          <span>{t.controlEnd}</span>
        </button>
      </div>
    </div>
  );
};
