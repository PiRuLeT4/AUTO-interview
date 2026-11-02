import React from 'react';
import { CheckCircle2, RotateCcw, FileText, User, PenTool } from 'lucide-react';
import { useLanguage, type InterviewFocusMode } from '../../core/i18n';

interface FinishedViewProps {
  candidateName: string;
  cvFileName?: string;
  focusMode?: InterviewFocusMode;
  customTopic?: string;
  onRestart: () => void;
}

export const FinishedView: React.FC<FinishedViewProps> = ({
  candidateName,
  cvFileName,
  focusMode = 'cv_based',
  customTopic,
  onRestart,
}) => {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-lg mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {t.finishedTitle}
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          {t.finishedSubtitle.replace('{name}', candidateName)}
        </p>
      </div>

      {/* Tarjeta Resumen Simple */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 text-left text-xs space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {t.candidateHeader || 'Candidato:'}
          </span>
          <span className="font-medium text-slate-200">
            {candidateName}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>{t.finishedSummaryCV}</span>
          {focusMode === 'custom_topic' ? (
            <span className="font-mono text-emerald-300 flex items-center gap-1.5 max-w-[240px] truncate">
              <PenTool className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {customTopic || 'Tema Personalizado'}
            </span>
          ) : (
            <span className="font-mono text-slate-200 flex items-center gap-1.5 max-w-[240px] truncate">
              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {cvFileName || 'curriculum.pdf'}
            </span>
          )}
        </div>
      </div>

      {/* Botón Nueva Sesión */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.finishedBtnRestart}</span>
        </button>
      </div>
    </div>
  );
};
