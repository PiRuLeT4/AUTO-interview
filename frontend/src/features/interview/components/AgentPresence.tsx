import React, { useEffect, useState } from 'react';
import type { AgentState } from '../../../types';
import { UserCheck, Mic, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from '../../../core/i18n';

interface AgentPresenceProps {
  state: AgentState;
  audioFrequencies?: number[];
}

export const AgentPresence: React.FC<AgentPresenceProps> = ({ state, audioFrequencies }) => {
  const { t } = useLanguage();
  const BAR_COUNT = 40;

  // Amplitudes de respaldo animadas cuando el agente habla
  const [speakingAmplitudes, setSpeakingAmplitudes] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 6)
  );

  useEffect(() => {
    if (state !== 'speaking') return;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setSpeakingAmplitudes(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const wave1 = Math.sin((i / BAR_COUNT) * Math.PI * 4 + step * 0.25);
          const wave2 = Math.cos((i / BAR_COUNT) * Math.PI * 8 - step * 0.35);
          const noise = Math.random() * 0.35;
          const combined = Math.max(0, (wave1 + wave2 + noise) / 2);
          return Math.round(6 + combined * 30);
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [state]);

  // Combinar la frecuencia real de Web Audio API con la animación armónica
  const hasRealAudioActivity =
    audioFrequencies && audioFrequencies.some((val) => val > 8);

  const baseRestingAmplitude = state === 'listening' ? 8 : 4;
  const activeBars = hasRealAudioActivity
    ? audioFrequencies
    : state === 'speaking'
      ? speakingAmplitudes
      : Array.from({ length: BAR_COUNT }, () => baseRestingAmplitude);

  const stateConfig = {
    idle: {
      label: t.agentIdleLabel,
      textColor: 'text-slate-400',
      badgeBg: 'bg-slate-800/80 border-slate-700 text-slate-300',
      barColor: 'bg-slate-700',
      centerBg: 'bg-slate-900 border-slate-800',
      indicatorText: t.agentIdleIndicator,
    },
    listening: {
      label: t.agentListeningLabel,
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
      barColor: 'bg-emerald-500',
      centerBg: 'bg-slate-900 border-emerald-500/30',
      indicatorText: t.agentListeningIndicator,
    },
    thinking: {
      label: t.agentThinkingLabel,
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
      barColor: 'bg-amber-400',
      centerBg: 'bg-slate-900 border-amber-500/30',
      indicatorText: t.agentThinkingIndicator,
    },
    speaking: {
      label: t.agentSpeakingLabel,
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
      barColor: 'bg-blue-500',
      centerBg: 'bg-slate-900 border-blue-500/30',
      indicatorText: t.agentSpeakingIndicator,
    },
  }[state];

  const isActiveVoice = state === 'speaking' || (state === 'listening' && hasRealAudioActivity);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 select-none">
      {/* Contenedor principal de visualización de audio */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
        {/* Anillo sutil de actividad vocal */}
        {state === 'speaking' && (
          <div className="absolute inset-2 rounded-full border border-blue-500/20 animate-pulse [animation-duration:2s] pointer-events-none" />
        )}

        {/* ONDA RADIAL CIRCULAR */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {activeBars.map((amplitude, i) => {
            const rotation = (i * 360) / BAR_COUNT;
            return (
              <div
                key={i}
                className="absolute origin-bottom flex flex-col items-center justify-end"
                style={{
                  height: '115px',
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <div
                  className={`w-1 rounded-full ${stateConfig.barColor} transition-all duration-75`}
                  style={{
                    height: `${amplitude}px`,
                    opacity: isActiveVoice ? 0.95 : 0.35,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Núcleo central / Representación del Entrevistador */}
        <div
          className={`relative z-10 flex flex-col items-center justify-center w-36 h-36 rounded-full border shadow-md transition-all duration-300 backdrop-blur-md ${stateConfig.centerBg} ${
            isActiveVoice ? 'scale-[1.02]' : 'scale-100'
          }`}
        >
          {state === 'listening' ? (
            <Mic className="w-9 h-9 text-emerald-400 animate-pulse" />
          ) : state === 'thinking' ? (
            <Loader2 className="w-9 h-9 text-amber-400 animate-spin [animation-duration:2s]" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-9 h-9 text-blue-400" />
          ) : (
            <UserCheck className={`w-9 h-9 ${stateConfig.textColor}`} />
          )}

          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300 mt-2">
            {stateConfig.indicatorText}
          </span>
        </div>
      </div>

      {/* Indicador inferior de estado */}
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium tracking-wide shadow-sm transition-colors duration-200 ${stateConfig.badgeBg}`}
      >
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span>{stateConfig.label}</span>
      </div>
    </div>
  );
};
