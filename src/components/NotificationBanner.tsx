import React, { useEffect, useRef } from 'react';
import { SeatState, Zone } from '../types';
import { Bell, Clock, AlertTriangle, Check, ArrowRight } from 'lucide-react';

interface Props {
  activeSeat: SeatState | null;
  zone: Zone | null;
  remainingSeconds: number | null;
  onExtend?: () => void;
  onFreeEarly: () => void;
}

export const NotificationBanner: React.FC<Props> = ({
  activeSeat,
  zone,
  remainingSeconds,
  onExtend,
  onFreeEarly,
}) => {
  const audioPlayedRef = useRef(false);

  // Play a gentle alert chime using browser Web Audio API when remaining time <= 5 min (300s)
  const playAlertChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  useEffect(() => {
    if (remainingSeconds !== null && remainingSeconds <= 300 && remainingSeconds > 0) {
      if (!audioPlayedRef.current) {
        playAlertChime();
        audioPlayedRef.current = true;
      }
    } else if (remainingSeconds !== null && remainingSeconds > 300) {
      audioPlayedRef.current = false;
    }
  }, [remainingSeconds]);

  if (!activeSeat || remainingSeconds === null || remainingSeconds <= 0) {
    return null;
  }

  // Only show the 5-minute pre-expiration warning when <= 5 minutes (300 seconds)
  const isWarning5Min = remainingSeconds <= 300;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (!isWarning5Min) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-3 shadow-lg border-b border-amber-400/40 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center shrink-0 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-black text-sm tracking-wide">
              <span>⚠️ AVISO DE FINALIZACIÓN DE TURNO (5 MINUTOS RESTANTES)</span>
            </div>
            <p className="text-xs text-amber-100 mt-0.5">
              Te quedan <b>{timeStr} minutos</b> en la sala <b>{zone?.n || 'Asignada'}</b> (Puesto #{activeSeat.seatIndex + 1}).
              Por favor ve guardando tus proyectos y dejando tu estación de trabajo ordenada para el siguiente campuser.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black px-3 py-1 bg-black/30 rounded-lg border border-white/20">
            {timeStr}
          </span>
          <button
            onClick={onFreeEarly}
            className="px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white font-bold text-xs rounded-lg transition-colors border border-white/20"
          >
            Ya terminé / Salir
          </button>
        </div>
      </div>
    </div>
  );
};
