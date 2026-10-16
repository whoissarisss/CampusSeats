import React, { useState } from 'react';
import { Zone, SeatState, RoomReservation } from '../types';
import { Activity, Users, Shield, ArrowUpRight, Flame, Clock } from 'lucide-react';

interface Props {
  zones: Zone[];
  seatsByZone: Record<string, SeatState[]>;
  roomReservations: Record<string, RoomReservation>;
  onOpenRoom: (zoneId: string) => void;
  recentActivity: { id: string; text: string; time: string; type: 'in' | 'out' | 'room' }[];
}

export const RealTimeOccupancyPanel: React.FC<Props> = ({
  zones,
  seatsByZone,
  roomReservations,
  onOpenRoom,
  recentActivity,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Compute global metrics
  let totalCapacity = 0;
  let totalOccupied = 0;

  zones.forEach((z) => {
    totalCapacity += z.s;
    const sList = seatsByZone[z.id] || [];
    totalOccupied += sList.filter((s) => s.status === 2).length;
  });

  const totalFree = totalCapacity - totalOccupied;
  const globalPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const filteredZones = zones.filter((z) => {
    if (filterType === 'all') return true;
    return z.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#8b7bff] animate-pulse" />
            Panel de Ocupación en Tiempo Real
          </h1>
          <p className="text-[#9a9bd0] text-sm mt-1">
            Monitoreo en vivo de capacidad, afluencia y disponibilidad por salón en Campusland.
          </p>
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-xs font-bold text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>SISTEMA EN VIVO</span>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#15124a] border border-[#2f2d78] rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-[#9a9bd0] uppercase font-semibold">Ocupación Total</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{globalPercent}%</span>
            <span className="text-xs text-purple-300 font-semibold">aforo activo</span>
          </div>
          <div className="w-full bg-[#0d0b2e] h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${globalPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-[#15124a] border border-[#2f2d78] rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-[#9a9bd0] uppercase font-semibold">Puestos Libres</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-400">{totalFree}</span>
            <span className="text-xs text-gray-400">sillas disponibles</span>
          </div>
          <p className="text-[11px] text-[#9a9bd0] mt-3">Listas para reservar de inmediato</p>
        </div>

        <div className="bg-[#15124a] border border-[#2f2d78] rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-[#9a9bd0] uppercase font-semibold">Puestos Ocupados</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-red-400">{totalOccupied}</span>
            <span className="text-xs text-gray-400">campusers activos</span>
          </div>
          <p className="text-[11px] text-[#9a9bd0] mt-3">Con temporizador de turno activo</p>
        </div>

        <div className="bg-[#15124a] border border-[#2f2d78] rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-[#9a9bd0] uppercase font-semibold">Capacidad Total</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{totalCapacity}</span>
            <span className="text-xs text-purple-300">en 9 salones</span>
          </div>
          <p className="text-[11px] text-[#9a9bd0] mt-3">Distribuidos en el campus</p>
        </div>
      </div>

      {/* Main Grid: Room Occupancy Breakdown & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Room Status List */}
        <div className="lg:col-span-8 bg-[#15124a] border border-[#2f2d78] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2f2d78]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Estado de Salones y Aulas
            </h2>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-[#0d0b2e] p-1 rounded-xl border border-[#2f2d78] text-xs">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'gamer', label: 'Gamer' },
                { id: 'reunion', label: 'Reunión' },
                { id: 'auditorio', label: 'Auditorio' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    filterType === f.id
                      ? 'bg-[#5b3ff0] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredZones.map((z) => {
              const sList = seatsByZone[z.id] || [];
              const occupied = sList.filter((s) => s.status === 2).length;
              const free = z.s - occupied;
              const percent = z.s > 0 ? Math.round((occupied / z.s) * 100) : 0;
              const isRoomReserved = Boolean(roomReservations[z.id]);

              return (
                <div
                  key={z.id}
                  onClick={() => onOpenRoom(z.id)}
                  className="p-4 bg-[#1b1860] hover:bg-[#201d6d] border border-[#2f2d78] hover:border-[#8b7bff] rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: z.c }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                          {z.n}
                          {isRoomReserved && (
                            <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-purple-900 text-purple-200 border border-purple-500/40">
                              🔒 SALA RESERVADA
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-[#9a9bd0]">
                          {z.description || 'Puestos Pro'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-white">
                        {free} libres <span className="text-gray-400 font-normal">/ {z.s}</span>
                      </span>
                      <div className="text-[11px] text-purple-300 font-mono">
                        {percent}% ocupado
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#0d0b2e] h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent > 80
                          ? 'bg-red-500'
                          : percent > 50
                          ? 'bg-yellow-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Activity Stream Ticker */}
        <div className="lg:col-span-4 bg-[#15124a] border border-[#2f2d78] rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2f2d78]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Actividad en Vivo
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Actualización continua</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-[#1b1860] border border-white/5 rounded-xl text-xs space-y-1 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold ${
                        act.type === 'in'
                          ? 'text-emerald-400'
                          : act.type === 'out'
                          ? 'text-amber-400'
                          : 'text-purple-400'
                      }`}
                    >
                      {act.type === 'in'
                        ? '🟢 Entrada de Puesto'
                        : act.type === 'out'
                        ? '🟡 Tiempo Finalizado'
                        : '🔒 Reserva de Sala'}
                    </span>
                    <span className="text-[10px] text-gray-400">{act.time}</span>
                  </div>
                  <p className="text-gray-200">{act.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">
                Esperando eventos de ocupación...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
