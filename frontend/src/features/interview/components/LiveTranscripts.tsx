import React, { useEffect, useRef } from 'react';
import type { TranscriptMessage } from '../../../types';
import { UserCheck, User } from 'lucide-react';
import { useLanguage } from '../../../core/i18n';

interface LiveTranscriptsProps {
  transcripts: TranscriptMessage[];
  currentUtterance?: string;
  userInterimText?: string;
}

export const LiveTranscripts: React.FC<LiveTranscriptsProps> = ({
  transcripts,
  currentUtterance,
  userInterimText,
}) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, currentUtterance, userInterimText]);

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col h-52 sm:h-60 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Cabecera sutil */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold tracking-wide uppercase text-[11px] text-slate-300">
          {t.transcriptHeader}
        </span>
        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t.transcriptLive}
        </span>
      </div>

      {/* Lista de mensajes */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-sm scroll-smooth">
        {transcripts.length === 0 && !currentUtterance && !userInterimText && (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            {t.transcriptConnecting}
          </div>
        )}

        {transcripts.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                  isAgent
                    ? 'bg-slate-800 text-slate-200 border border-slate-700/80'
                    : 'bg-blue-600 text-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <span className={`text-[10px] font-semibold ${isAgent ? 'text-blue-400' : 'text-blue-200'}`}>
                    {isAgent ? t.speakerAgent : t.speakerUser}
                  </span>
                  <span className={`text-[9px] font-mono ${isAgent ? 'text-slate-400' : 'text-blue-200/80'}`}>
                    {msg.timestamp}
                  </span>
                </div>
                <p>{msg.text}</p>
              </div>
              {!isAgent && (
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Subtítulo parcial mientras habla el candidato */}
        {userInterimText && (
          <div className="flex items-start gap-2.5 justify-end">
            <div className="bg-blue-600/30 border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-blue-100 italic">
              <span className="block text-[10px] font-semibold text-blue-300 mb-0.5">
                {t.candidateSpeaking}
              </span>
              {userInterimText}...
            </div>
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Subtítulo en progreso del entrevistador */}
        {currentUtterance && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-300 italic">
              <span className="block text-[10px] font-semibold text-blue-400 mb-0.5">
                {t.speakerAgent}
              </span>
              {currentUtterance}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
