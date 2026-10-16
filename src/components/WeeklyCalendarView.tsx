import React, { useState } from 'react';
import { ReservationRecord, Zone, User } from '../types';
import { Calendar as CalendarIcon, Clock, MapPin, Trash2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  reservations: ReservationRecord[];
  currentUser: User;
  zones: Zone[];
  onCancelReservation: (reservationId: string) => void;
  onGoToRoom: (roomId: string) => void;
}

export const WeeklyCalendarView: React.FC<Props> = ({
  reservations,
  currentUser,
  zones,
  onCancelReservation,
  onGoToRoom,
}) => {
  // Generate 7 days starting from today
  const generateWeekDays = () => {
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();
  const [selectedDate, setSelectedDate] = useState<string>(weekDays[0].dateStr);

  // Filter reservations for current user and for selected date
  const userReservations = reservations.filter(
    (r) => r.pin === currentUser.pin && r.status === 'activa'
  );

  const selectedDayReservations = userReservations.filter((r) => r.date === selectedDate);

  const getZone = (id: string) => zones.find((z) => z.id === id);

  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-[#8b7bff]" />
            Agenda y Calendario Semanal
          </h1>
          <p className="text-[#9a9bd0] text-sm mt-1">
            Consulta tus puestos asignados en el plazo de los próximos 7 días habilitados.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Límite de Reserva: Máximo 7 días</span>
        </div>
      </div>

      {/* 7-Day Week Strip Selector */}
      <div className="grid grid-cols-7 gap-2 bg-[#15124a] p-2 rounded-2xl border border-[#2f2d78]">
        {weekDays.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          const countForDay = userReservations.filter((r) => r.date === day.dateStr).length;

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-[#5b3ff0] border-[#8b7bff] text-white shadow-lg scale-[1.02]'
                  : 'bg-[#1b1860] border-transparent text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80">
                {day.dayName}
              </span>
              <span className="text-lg font-bold mt-0.5">{day.dayNum}</span>

              {/* Indicator of reservation count on that day */}
              <div className="mt-1.5 flex items-center gap-1">
                {day.isToday && (
                  <span className="text-[9px] px-1 bg-white/20 rounded font-bold uppercase">
                    Hoy
                  </span>
                )}
                {countForDay > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#facc15]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Daily Reservations Content */}
      <div className="bg-[#15124a] border border-[#2f2d78] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2f2d78] mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Puestos para el día:</span>
            <span className="text-purple-300 font-mono">{selectedDate}</span>
          </h2>
          <span className="text-xs text-[#9a9bd0]">
            {selectedDayReservations.length} reserva(s) programada(s)
          </span>
        </div>

        {selectedDayReservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDayReservations.map((res) => {
              const zone = getZone(res.roomId);
              return (
                <div
                  key={res.id}
                  className="bg-[#1b1860] border border-[#2f2d78] hover:border-[#8b7bff]/60 rounded-xl p-5 shadow transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: zone?.c || '#8b5cf6' }}
                        />
                        <h3 className="text-base font-bold text-white">
                          {res.roomName}
                        </h3>
                      </div>
                      <p className="text-xs text-[#9a9bd0] mt-1">
                        {zone?.description || 'Espacio de trabajo Campusland'}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                      {res.isFullRoom
                        ? 'SALA COMPLETA'
                        : `SILLA #${(res.seatIndex ?? 0) + 1}`}
                    </span>
                  </div>

                  {/* Time slot badge */}
                  <div className="bg-[#0d0b2e] p-3 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Horario de turno:</span>
                    </div>
                    <span className="font-mono font-bold text-white text-sm bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30">
                      {res.startTime} - {res.endTime} ({res.durationMinutes} min)
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => onCancelReservation(res.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-950/50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => onGoToRoom(res.roomId)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#5b3ff0] hover:bg-[#6d5df0] rounded-lg transition-colors flex items-center gap-1.5 shadow"
                    >
                      <span>Ver Salón</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
              📅
            </div>
            <h3 className="text-base font-bold text-white">
              No tienes reservas para este día
            </h3>
            <p className="text-xs text-[#9a9bd0] max-w-sm">
              Puedes explorar la pestaña de Salones o el Mapa para elegir tu puesto en el horario que prefieras.
            </p>
          </div>
        )}
      </div>

      {/* Rules Notice */}
      <div className="p-4 bg-[#1b1860]/70 border border-[#2f2d78] rounded-xl text-xs text-[#9a9bd0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <b>Regla del Campus:</b> Cada campuser puede ocupar 1 solo puesto por intervalo de tiempo. Los puestos se liberan automáticamente en vivo al expirar.
          </span>
        </div>
      </div>
    </div>
  );
};
