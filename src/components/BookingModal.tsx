import React, { useState } from 'react';
import { Zone, User, SeatState, ReservationRecord } from '../types';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  zone: Zone;
  seatIndex: number;
  currentUser: User;
  existingReservations: ReservationRecord[];
  onConfirmBooking: (data: {
    roomId: string;
    seatIndex: number;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isFullRoom?: boolean;
  }) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
}

export const BookingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  zone,
  seatIndex,
  currentUser,
  existingReservations,
  onConfirmBooking,
}) => {
  // Today formatted as YYYY-MM-DD
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7); // Maximum 1 week policy

  const [date, setDate] = useState<string>(formatYMD(today));
  const [startTime, setStartTime] = useState<string>('08:00');
  const [duration, setDuration] = useState<number>(60); // minutes
  const [isFullRoom, setIsFullRoom] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser.r === 'directivo';

  // Compute End Time
  const calculateEndTime = (start: string, durationMin: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMin;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime(startTime, duration);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rule: Date cannot be greater than 7 days
    const chosenDate = new Date(date + 'T00:00:00');
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 7);
    limitDate.setHours(23, 59, 59, 999);

    if (chosenDate > limitDate) {
      setErrorMessage('Por política de Campusland, no se puede reservar a más de 1 semana de anticipación.');
      return;
    }

    // Rule: One seat per user at a time
    const userConflict = existingReservations.find(
      (r) =>
        r.pin === currentUser.pin &&
        r.status === 'activa' &&
        r.date === date &&
        r.startTime < endTime &&
        r.endTime > startTime
    );

    if (userConflict && !isAdmin) {
      setErrorMessage(
        `Ya tienes reservado el Puesto #${(userConflict.seatIndex ?? 0) + 1} en ${
          userConflict.roomName
        } para este horario (${userConflict.startTime} - ${userConflict.endTime}). Solo puedes tomar 1 puesto por horario.`
      );
      return;
    }

    const result = await onConfirmBooking({
      roomId: zone.id,
      seatIndex,
      date,
      startTime,
      endTime,
      durationMinutes: duration,
      isFullRoom: isAdmin ? isFullRoom : false,
    });

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message || 'Error al procesar la reserva.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#15124a] border border-[#2f2d78] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d0b2e] border-b border-[#2f2d78]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#8b7bff]" />
            <h3 className="text-base font-bold text-white">
              Reservar {isFullRoom ? 'Sala Completa' : `Puesto #${seatIndex + 1}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Room info pill */}
          <div className="p-3.5 bg-[#1b1860] border border-[#2f2d78] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-[#9a9bd0] uppercase tracking-wider font-semibold">
                Salón Seleccionado
              </span>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.c }} />
                {zone.n}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#9a9bd0]">Puesto</span>
              <p className="text-sm font-extrabold text-[#facc15]">
                {isFullRoom ? 'Toda la Sala' : `Silla #${seatIndex + 1}`}
              </p>
            </div>
          </div>

          {/* Admin Full Room Option */}
          {isAdmin && (
            <div className="p-3 bg-purple-900/30 border border-purple-500/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-purple-200">
                    Modo Administrador
                  </span>
                  <p className="text-[11px] text-purple-300/80">
                    Bloquear las {zone.s} sillas para evento o capacitación
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFullRoom}
                  onChange={(e) => setIsFullRoom(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Date Picker (Within 1 week limit) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#8b7bff]" />
                Fecha de Reserva (Máx. 1 semana)
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                Hasta {formatYMD(maxDate)}
              </span>
            </label>
            <input
              type="date"
              value={date}
              min={formatYMD(today)}
              max={formatYMD(maxDate)}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-[#1b1860] border border-[#2f2d78] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#8b7bff] transition-colors"
            />
          </div>

          {/* Schedule Picker (Start Time + Duration) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Hora de Inicio
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#1b1860] border border-[#2f2d78] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#8b7bff]"
              >
                {[
                  '07:00', '08:00', '09:00', '10:00', '11:00',
                  '12:00', '13:00', '14:00', '15:00', '16:00',
                  '17:00', '18:00', '19:00', '20:00', '21:00'
                ].map((t) => (
                  <option key={t} value={t}>
                    {t} hrs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Duración del Turno
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#1b1860] border border-[#2f2d78] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#8b7bff]"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
                <option value={240}>4 horas (Medio turno)</option>
                <option value={480}>8 horas (Jornada completa)</option>
              </select>
            </div>
          </div>

          {/* Summary time window */}
          <div className="p-3 bg-[#0d0b2e] rounded-xl border border-[#2f2d78] flex items-center justify-between text-xs">
            <span className="text-gray-400">Horario final calculado:</span>
            <span className="text-white font-bold font-mono text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/30">
              {startTime} ➔ {endTime}
            </span>
          </div>

          <div className="text-[11px] text-gray-400 bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1">
            <p className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Liberación automática garantizada
            </p>
            <p>
              El puesto quedará protegido durante este tiempo y se desocupará solo cuando el turno finalice.
              Recibirás un aviso 5 minutos antes para ir saliendo.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#5b3ff0] hover:bg-[#6d5df0] text-white text-sm font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Confirmar y Asignar Puesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
