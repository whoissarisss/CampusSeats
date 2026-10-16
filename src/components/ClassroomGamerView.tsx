import React, { useState } from 'react';
import { Zone, User, SeatState, RoomReservation } from '../types';
import { AvatarChibi } from './AvatarChibi';
import { Lock, Clock, Info, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface Props {
  zone: Zone;
  seats: SeatState[];
  currentPin: string;
  currentUser: User;
  roomReservation?: RoomReservation;
  onSelectSeat: (seatIndex: number) => void;
  onFreeMySeat: () => void;
  onAdminToggleSeat?: (seatIndex: number) => void;
  onReserveFullRoom?: () => void;
  onCancelFullRoom?: () => void;
  nowTimeMinutes: number;
}

export const ClassroomGamerView: React.FC<Props> = ({
  zone,
  seats,
  currentPin,
  currentUser,
  roomReservation,
  onSelectSeat,
  onFreeMySeat,
  onAdminToggleSeat,
  onReserveFullRoom,
  onCancelFullRoom,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<SeatState | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const isAdmin = currentUser.r === 'directivo';
  const totalCapacity = zone.s;
  const isFullReserved = Boolean(roomReservation);

  // Categorize seats
  const occupiedCount = seats.filter((s) => s.status === 2).length;
  const freeCount = totalCapacity - occupiedCount;

  // Find user's own seat in this room
  const mySeat = seats.find((s) => s.occupantPin === currentPin);

  // Generate layout coordinates for gamer desks matching image:
  // 4 rows on left, 4 rows on right, 2 seats per desk unit, 4 seats per island row = 32 seats
  // Generate layout coordinates for gamer desks, auditorium rows or conference tables:
  const generateSeatPositions = () => {
    const positions: { index: number; x: number; y: number; facing: 'up' | 'down'; deskId: string }[] = [];
    const total = zone.s;

    // 1. AUDITORIO THEATER / LECTURE LAYOUT (100 seats)
    if (zone.type === 'auditorio' || total >= 60) {
      let seatIdx = 0;
      // 10 rows of 10 seats (5 on left, center aisle, 5 on right)
      for (let r = 0; r < 10; r++) {
        const y = 250 + r * 64;
        // Left section (5 seats)
        for (let c = 0; c < 5; c++) {
          if (seatIdx < total) {
            positions.push({
              index: seatIdx++,
              x: 130 + c * 52,
              y,
              facing: 'down',
              deskId: `AUD_L_${r}_${c}`,
            });
          }
        }
        // Right section (5 seats)
        for (let c = 0; c < 5; c++) {
          if (seatIdx < total) {
            positions.push({
              index: seatIdx++,
              x: 580 + c * 52,
              y,
              facing: 'down',
              deskId: `AUD_R_${r}_${c}`,
            });
          }
        }
      }
      return positions;
    }

    // 2. MEETING / EXECUTIVE BOARDROOM LAYOUT (Blanca 12, Azul 10, Amarillas verdes 6)
    if (zone.type === 'reunion' || zone.type === 'oficina' || total <= 14) {
      const centerX = 470;
      const centerY = 500;
      const rx = total <= 6 ? 150 : 230;
      const ry = total <= 6 ? 90 : 130;

      for (let i = 0; i < total; i++) {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
        const x = Math.round(centerX + rx * Math.cos(angle));
        const y = Math.round(centerY + ry * Math.sin(angle));
        positions.push({
          index: i,
          x,
          y,
          facing: y > centerY ? 'up' : 'down',
          deskId: `CONF_${i}`,
        });
      }
      return positions;
    }

    // 3. GAMER PRO CLASSROOMS (Artemis 32, Apolo 34, Spooki 38, Cosmos 25, Skilab 20)
    const leftX1 = 160;
    const leftX2 = 280;
    const rightX1 = 660;
    const rightX2 = 780;

    const rowYStarts = [220, 390, 560, 720];

    let seatIdx = 0;
    for (let r = 0; r < 4; r++) {
      const y = rowYStarts[r];
      if (seatIdx < total) positions.push({ index: seatIdx++, x: leftX1, y: y - 48, facing: 'down', deskId: `L${r}A` });
      if (seatIdx < total) positions.push({ index: seatIdx++, x: leftX2, y: y - 48, facing: 'down', deskId: `L${r}B` });
      if (seatIdx < total) positions.push({ index: seatIdx++, x: leftX1, y: y + 48, facing: 'up', deskId: `L${r}C` });
      if (seatIdx < total) positions.push({ index: seatIdx++, x: leftX2, y: y + 48, facing: 'up', deskId: `L${r}D` });

      if (seatIdx < total) positions.push({ index: seatIdx++, x: rightX1, y: y - 48, facing: 'down', deskId: `R${r}A` });
      if (seatIdx < total) positions.push({ index: seatIdx++, x: rightX2, y: y - 48, facing: 'down', deskId: `R${r}B` });
      if (seatIdx < total) positions.push({ index: seatIdx++, x: rightX1, y: y + 48, facing: 'up', deskId: `R${r}C` });
      if (seatIdx < total) positions.push({ index: seatIdx++, x: rightX2, y: y + 48, facing: 'up', deskId: `R${r}D` });
    }

    // Remaining seats (for Spooki 38 and Apolo 34)
    const extraSlots = [
      { x: 160, y: 850 }, { x: 280, y: 850 },
      { x: 660, y: 850 }, { x: 780, y: 850 },
      { x: 380, y: 850 }, { x: 560, y: 850 },
      { x: 420, y: 220 }, { x: 520, y: 220 }
    ];

    let extraIdx = 0;
    while (seatIdx < total) {
      const slot = extraSlots[extraIdx % extraSlots.length];
      positions.push({
        index: seatIdx++,
        x: slot.x,
        y: slot.y,
        facing: 'up',
        deskId: `EXTRA_${seatIdx}`,
      });
      extraIdx++;
    }

    return positions;
  };

  const seatPositions = generateSeatPositions();

  const handleSeatClick = (seatIndex: number) => {
    if (isFullReserved && !isAdmin) {
      return;
    }

    const seat = seats[seatIndex] || { seatIndex, status: 0 };
    const isMine = seat.occupantPin === currentPin;
    const isOccupiedByOther = seat.status === 2 && !isMine;

    if (isAdmin && onAdminToggleSeat) {
      onAdminToggleSeat(seatIndex);
      return;
    }

    if (isOccupiedByOther) {
      // Cannot take a seat occupied by another user
      return;
    }

    if (isMine) {
      // Option to free
      return;
    }

    // Open booking modal
    onSelectSeat(seatIndex);
  };

  return (
    <div className="flex flex-col h-full bg-[#15124a] border border-[#2f2d78] rounded-2xl shadow-xl overflow-hidden">
      {/* Top Header Pill like in the Artemis Image */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#0d0b2e]/90 border-b border-[#2f2d78] backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-8 rounded-full"
            style={{ backgroundColor: zone.c }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold uppercase tracking-wider text-white">
                {zone.n}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Salón Gamer Pro
              </span>
            </div>
            <p className="text-xs text-[#9a9bd0]">{zone.description}</p>
          </div>
        </div>

        {/* Legend bar matching image */}
        <div className="flex items-center gap-4 bg-[#1b1860] px-4 py-2 rounded-xl border border-[#2f2d78] text-xs">
          <span className="text-gray-300 font-semibold">
            Capacidad: <b className="text-white">{totalCapacity}</b>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-emerald-300 font-bold">Disponible ({freeCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span className="text-red-300 font-bold">Ocupado ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-yellow-300 shadow-[0_0_10px_#facc15] animate-pulse" />
            <span className="text-amber-300 font-bold">Tu Puesto</span>
          </div>
        </div>

        {/* Room reservation status & Admin actions */}
        <div className="flex items-center gap-2">
          {isFullReserved && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/60 border border-purple-500/50 rounded-xl text-xs text-purple-200">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>
                Sala reservada por <b>{roomReservation?.name}</b>
              </span>
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              {isFullReserved ? (
                <button
                  onClick={onCancelFullRoom}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Liberar Sala Completa
                </button>
              ) : (
                <button
                  onClick={onReserveFullRoom}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Reservar Sala Entera
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Classroom Canvas View */}
      <div className="relative flex-1 bg-[#1a162b] overflow-auto flex items-center justify-center p-4">
        {/* SVG Classroom Floor Plan matching the Artemis layout */}
        <div className="relative w-full max-w-4xl aspect-[840/1000] rounded-2xl overflow-hidden border-2 border-[#3b3469] shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <svg
            viewBox="0 0 940 1020"
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Floor Wood Planks Pattern */}
              <pattern
                id="wood-floor"
                width="120"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <rect width="120" height="40" fill="#c48a56" />
                <rect x="0" y="0" width="120" height="1" fill="#b07640" />
                <rect x="0" y="0" width="1" height="40" fill="#b07640" />
                <rect x="60" y="20" width="60" height="20" fill="#bc7f49" />
                <rect x="0" y="0" width="60" height="20" fill="#cb915f" />
                <path d="M0 20 L120 20" stroke="#ad723c" strokeWidth="1" />
              </pattern>

              {/* Glowing Totem Filter */}
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Floor */}
            <rect x="0" y="0" width="940" height="1020" fill="url(#wood-floor)" />

            {/* Classroom Enclosing Walls */}
            <rect x="30" y="30" width="880" height="920" rx="14" fill="none" stroke="#2a254d" strokeWidth="16" />
            <rect x="38" y="38" width="864" height="904" rx="8" fill="none" stroke="#71717a" strokeWidth="2" opacity="0.3" />

            {/* TOP AREA: Metal Lockers (Top-Left) */}
            <g id="lockers" transform="translate(60, 48)">
              <rect x="0" y="0" width="240" height="85" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={`locker-${i}`} transform={`translate(${i * 40}, 0)`}>
                  <rect x="0" y="0" width="40" height="85" fill="none" stroke="#64748b" strokeWidth="2" />
                  <line x1="8" y1="20" x2="32" y2="20" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="8" y1="26" x2="32" y2="26" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="8" y1="32" x2="32" y2="32" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="30" cy="52" r="3" fill="#334155" />
                </g>
              ))}
            </g>

            {/* Trash can left */}
            <circle cx="330" cy="115" r="14" fill="#64748b" stroke="#334155" strokeWidth="2" />
            <circle cx="330" cy="115" r="9" fill="#1e293b" />

            {/* TOP CENTER: Teacher / Instructor Desk */}
            <g id="instructor-desk" transform="translate(380, 110)">
              {/* Desk Surface */}
              <rect x="0" y="0" width="160" height="70" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />
              {/* Dual monitors for teacher */}
              <rect x="25" y="10" width="48" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <rect x="80" y="10" width="48" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              {/* Keyboard & Mousepad */}
              <rect x="45" y="32" width="65" height="18" rx="2" fill="#334155" />
              {/* Small desk plant */}
              <circle cx="140" cy="22" r="7" fill="#16a34a" />
              {/* Instructor Chair (Gold/Black) */}
              <rect x="62" y="-42" width="36" height="34" rx="8" fill="#18181b" stroke="#eab308" strokeWidth="3" />
              <path d="M68 -42 L68 -15 M92 -42 L92 -15" stroke="#eab308" strokeWidth="2" />
            </g>

            {/* Filing Cabinet */}
            <rect x="555" y="70" width="55" height="50" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
            <circle cx="582" cy="85" r="3" fill="#475569" />
            <circle cx="582" cy="105" r="3" fill="#475569" />

            {/* TOP RIGHT: Huge Presentation Wall Display */}
            <g id="presentation-screen" transform="translate(635, 48)">
              <rect x="0" y="0" width="180" height="90" rx="6" fill="#09090b" stroke="#334155" strokeWidth="4" />
              {/* Glowing code dashboard screen */}
              <rect x="8" y="8" width="164" height="74" rx="3" fill="#111827" />
              <rect x="18" y="18" width="40" height="25" rx="2" fill="#1f2937" />
              <rect x="66" y="18" width="95" height="5" fill="#38bdf8" />
              <rect x="66" y="28" width="70" height="4" fill="#818cf8" />
              <rect x="66" y="36" width="85" height="4" fill="#34d399" />
              <rect x="18" y="50" width="143" height="18" rx="2" fill="#1e1b4b" stroke="#4338ca" strokeWidth="1" />
            </g>

            {/* Potted Plant Top Right */}
            <g transform="translate(835, 95)">
              <rect x="0" y="10" width="24" height="24" rx="4" fill="#d97706" />
              <circle cx="12" cy="8" r="14" fill="#15803d" />
              <circle cx="6" cy="4" r="8" fill="#22c55e" />
              <circle cx="18" cy="4" r="8" fill="#22c55e" />
            </g>

            {/* 1. CENTER TOTEM / KIOSK (Only for Gamer Classrooms like Artemis, Apolo, Spooki, etc.) */}
            {zone.type === 'gamer' && (
              <g id="center-totem" transform="translate(415, 340)">
                <rect
                  x="-10"
                  y="-10"
                  width="130"
                  height="240"
                  rx="20"
                  fill="#38bdf8"
                  opacity="0.18"
                  filter="url(#neon-glow)"
                />
                <rect
                  x="0"
                  y="0"
                  width="110"
                  height="220"
                  rx="16"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                />
                <rect x="12" y="14" width="86" height="100" rx="8" fill="#020617" />
                <circle cx="55" cy="64" r="24" fill="#38bdf8" fillOpacity="0.08" />
                <text
                  x="55"
                  y="160"
                  textAnchor="middle"
                  fill="#38bdf8"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: '2px',
                  }}
                >
                  {zone.n.toUpperCase()}
                </text>
                <line x1="20" y1="175" x2="90" y2="175" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
              </g>
            )}

            {/* 2. AUDITORIUM MAIN STAGE & LECTURE PODIUM (for Auditorio 100) */}
            {zone.type === 'auditorio' && (
              <g id="auditorium-stage" transform="translate(260, 80)">
                <rect x="0" y="0" width="420" height="90" rx="12" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="3.5" />
                <rect x="15" y="12" width="390" height="66" rx="8" fill="#0f0c29" stroke="#6366f1" strokeWidth="1.5" />
                <text x="210" y="48" textAnchor="middle" fill="#c7d2fe" fontSize="15" fontWeight="bold">
                  ESCENARIO PRINCIPAL · AUDITORIO (100 PUESTOS)
                </text>
                <rect x="190" y="54" width="40" height="18" rx="3" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
                <circle cx="210" cy="57" r="2" fill="#ef4444" />
              </g>
            )}

            {/* 3. CONFERENCE / BOARDROOM TABLE (for Blanca 12, Azul 10, Amarillas verdes 6) */}
            {(zone.type === 'reunion' || zone.type === 'oficina') && (
              <g id="conference-table" transform="translate(470, 500)">
                <ellipse cx="0" cy="0" rx={zone.s <= 6 ? 130 : 200} ry={zone.s <= 6 ? 70 : 100} fill="#1e1b4b" stroke="#cbd5e1" strokeWidth="4" />
                <ellipse cx="0" cy="0" rx={zone.s <= 6 ? 110 : 180} ry={zone.s <= 6 ? 50 : 80} fill="#0f172a" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="0" y="5" textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="bold">
                  MESA EJECUTIVA · {zone.n.toUpperCase()} ({zone.s} PUESTOS)
                </text>
              </g>
            )}

            {/* DESKS (LEFT AND RIGHT ISLANDS - ONLY FOR GAMER CLASSROOMS) */}
            {zone.type === 'gamer' && [0, 1, 2, 3].map((r) => {
              const y = [220, 390, 560, 720][r];
              return (
                <React.Fragment key={`desk-row-${r}`}>
                  {/* Left Desk Table Surface (Twin dual stations) */}
                  <g id={`desk-left-${r}`}>
                    <rect x="100" y={y - 25 + 4} width="240" height="50" rx="8" fill="#000000" opacity="0.15" />
                    <rect
                      x="100"
                      y={y - 25}
                      width="240"
                      height="50"
                      rx="8"
                      fill="#f8fafc"
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                    />
                    <circle cx="160" cy={y} r="5" fill="#64748b" />
                    <circle cx="280" cy={y} r="5" fill="#64748b" />

                    {/* Monitors Left Station (Dual monitors) */}
                    <rect x="110" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="162" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="110" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="162" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />

                    <rect x="124" y={y - 22} width="40" height="7" rx="1.5" fill="#334155" />
                    <rect x="124" y={y + 15} width="40" height="7" rx="1.5" fill="#334155" />

                    {/* Monitors Right Station (Dual monitors) */}
                    <rect x="230" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="282" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="230" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="282" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />

                    <rect x="244" y={y - 22} width="40" height="7" rx="1.5" fill="#334155" />
                    <rect x="244" y={y + 15} width="40" height="7" rx="1.5" fill="#334155" />

                    <rect x="94" y={y - 20} width="12" height="40" rx="2" fill="#1e293b" />
                    <rect x="334" y={y - 20} width="12" height="40" rx="2" fill="#1e293b" />
                  </g>

                  {/* Right Desk Table Surface */}
                  <g id={`desk-right-${r}`}>
                    <rect x="600" y={y - 25 + 4} width="240" height="50" rx="8" fill="#000000" opacity="0.15" />
                    <rect
                      x="600"
                      y={y - 25}
                      width="240"
                      height="50"
                      rx="8"
                      fill="#f8fafc"
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                    />
                    <circle cx="660" cy={y} r="5" fill="#64748b" />
                    <circle cx="780" cy={y} r="5" fill="#64748b" />

                    {/* Monitors */}
                    <rect x="610" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="662" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="610" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="662" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />

                    <rect x="624" y={y - 22} width="40" height="7" rx="1.5" fill="#334155" />
                    <rect x="624" y={y + 15} width="40" height="7" rx="1.5" fill="#334155" />

                    {/* Right Pair Monitors */}
                    <rect x="730" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="782" y={y - 12} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="730" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <rect x="782" y={y + 4} width="46" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />

                    <rect x="744" y={y - 22} width="40" height="7" rx="1.5" fill="#334155" />
                    <rect x="744" y={y + 15} width="40" height="7" rx="1.5" fill="#334155" />

                    <rect x="594" y={y - 20} width="12" height="40" rx="2" fill="#1e293b" />
                    <rect x="834" y={y - 20} width="12" height="40" rx="2" fill="#1e293b" />
                  </g>
                </React.Fragment>
              );
            })}

            {/* AUDITORIUM DESK ROWS (when 100 seats in Auditorio) */}
            {zone.type === 'auditorio' && (
              <g id="auditorium-desk-strips">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => {
                  const y = 250 + r * 64;
                  return (
                    <g key={`aud-desk-${r}`}>
                      <rect x="105" y={y - 15} width="270" height="12" rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />
                      <rect x="555" y={y - 15} width="270" height="12" rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />
                    </g>
                  );
                })}
              </g>
            )}

            {/* BOTTOM RIGHT: Help Desk / Technical Support Pod */}
            <g id="tech-pod" transform="translate(680, 810)">
              <rect x="0" y="0" width="130" height="60" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
              <rect x="35" y="8" width="48" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <rect x="42" y="26" width="34" height="14" rx="2" fill="#38bdf8" />
              <circle cx="105" cy="20" r="8" fill="#10b981" />
            </g>

            {/* BOTTOM ENTRANCE: Glass Sliding Doors */}
            <g id="glass-entrance" transform="translate(360, 930)">
              <rect x="0" y="0" width="220" height="40" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="3" />
              <line x1="110" y1="0" x2="110" y2="40" stroke="#0284c7" strokeWidth="3" />
              <rect x="98" y="14" width="8" height="12" rx="2" fill="#e2e8f0" />
              <rect x="114" y="14" width="8" height="12" rx="2" fill="#e2e8f0" />
              {/* Floor Welcome Rug */}
              <rect x="40" y="-18" width="140" height="14" rx="3" fill="#1e1b4b" opacity="0.8" />
            </g>

            {/* INTERACTIVE GAMER CHAIRS */}
            {seatPositions.map((sp) => {
              const seat = seats[sp.index] || { seatIndex: sp.index, status: 0 };
              const isMine = seat.occupantPin === currentPin;
              const isOccupied = seat.status === 2 && !isMine;
              const isAvailable = seat.status === 0 && !isFullReserved;

              // Color configuration
              // Green for Available, Red for Occupied, Golden for My Seat
              let chairColor = '#22c55e'; // Green available
              let accentColor = '#15803d';
              let glowEffect = '';

              if (isFullReserved && !isMine) {
                chairColor = '#a855f7'; // Purple reserved
                accentColor = '#7e22ce';
              } else if (isOccupied) {
                chairColor = '#ef4444'; // Red occupied
                accentColor = '#b91c1c';
              } else if (isMine) {
                chairColor = '#facc15'; // Golden own seat
                accentColor = '#ca8a04';
                glowEffect = 'url(#neon-glow)';
              }

              return (
                <g
                  key={`chair-${sp.index}`}
                  transform={`translate(${sp.x}, ${sp.y})`}
                  onClick={() => handleSeatClick(sp.index)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    setHoveredSeat(seat);
                  }}
                  onMouseLeave={() => setHoveredSeat(null)}
                  className={`cursor-pointer transition-transform duration-200 hover:scale-125 ${
                    isMine ? 'animate-bounce' : ''
                  }`}
                  style={{ transformOrigin: `${sp.x}px ${sp.y}px` }}
                >
                  {/* Golden Pulse Aura for My Seat */}
                  {isMine && (
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill="#facc15"
                      fillOpacity="0.4"
                      filter={glowEffect}
                    />
                  )}

                  {/* Gamer Chair Base / Wheels */}
                  <g opacity="0.6">
                    <line x1="-18" y1="-18" x2="18" y2="18" stroke="#18181b" strokeWidth="4" />
                    <line x1="-18" y1="18" x2="18" y2="-18" stroke="#18181b" strokeWidth="4" />
                    <circle cx="-16" cy="-16" r="3" fill="#09090b" />
                    <circle cx="16" cy="16" r="3" fill="#09090b" />
                    <circle cx="-16" cy="16" r="3" fill="#09090b" />
                    <circle cx="16" cy="-16" r="3" fill="#09090b" />
                  </g>

                  {/* Seat Cushion */}
                  <ellipse cx="0" cy="0" rx="20" ry="17" fill="#18181b" stroke={accentColor} strokeWidth="3" />
                  <ellipse cx="0" cy="0" rx="14" ry="12" fill={chairColor} />

                  {/* Headrest & Side wings (Gamer Bucket Seat) */}
                  {sp.facing === 'down' ? (
                    <g>
                      <path
                        d="M -16 -10 Q 0 -22 16 -10 L 14 -4 Q 0 -14 -14 -4 Z"
                        fill="#09090b"
                        stroke={chairColor}
                        strokeWidth="1.5"
                      />
                      <rect x="-8" y="-19" width="16" height="8" rx="3" fill={chairColor} />
                    </g>
                  ) : (
                    <g>
                      <path
                        d="M -16 10 Q 0 22 16 10 L 14 4 Q 0 14 -14 4 Z"
                        fill="#09090b"
                        stroke={chairColor}
                        strokeWidth="1.5"
                      />
                      <rect x="-8" y="11" width="16" height="8" rx="3" fill={chairColor} />
                    </g>
                  )}

                  {/* Armrests */}
                  <rect x="-24" y="-8" width="5" height="16" rx="2.5" fill="#27272a" />
                  <rect x="19" y="-8" width="5" height="16" rx="2.5" fill="#27272a" />

                  {/* Seat Number Tag */}
                  <circle cx="0" cy="0" r="8" fill="#0f172a" opacity="0.85" />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    style={{ fontSize: '9px', fontWeight: 'bold' }}
                  >
                    {sp.index + 1}
                  </text>

                  {/* If this is My Seat, show avatar badge! */}
                  {isMine && (
                    <g transform="translate(-14, -36)">
                      <rect x="-2" y="-2" width="32" height="32" rx="16" fill="#facc15" />
                      <foreignObject width="28" height="28" x="0" y="0">
                        <AvatarChibi config={currentUser.avatar} size="xs" />
                      </foreignObject>
                    </g>
                  )}

                  {/* If occupied by other student and has avatar */}
                  {isOccupied && seat.occupantAvatar && (
                    <g transform="translate(-10, -28) scale(0.7)">
                      <circle cx="15" cy="15" r="16" fill="#ef4444" />
                      <foreignObject width="30" height="30" x="0" y="0">
                        <AvatarChibi config={seat.occupantAvatar} size="xs" />
                      </foreignObject>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Seat Details Tooltip */}
        {hoveredSeat && tooltipPos && (
          <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3.5 py-2.5 bg-[#0d0b2e]/95 border border-[#4c1d95] rounded-xl shadow-2xl backdrop-blur-md text-xs text-white max-w-xs transition-opacity duration-150"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1 mb-1.5 font-bold">
              <span className="text-purple-300">
                Puesto #{hoveredSeat.seatIndex + 1}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                  hoveredSeat.occupantPin === currentPin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : hoveredSeat.status === 2
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {hoveredSeat.occupantPin === currentPin
                  ? 'Tu Asignación'
                  : hoveredSeat.status === 2
                  ? 'Ocupado'
                  : 'Libre'}
              </span>
            </div>

            {hoveredSeat.occupantPin === currentPin ? (
              <div className="space-y-1 text-emerald-300">
                <p>Estás sentado aquí.</p>
                {hoveredSeat.endTime && (
                  <p className="flex items-center gap-1 text-[11px] text-gray-300">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Turno hasta: <b>{hoveredSeat.endTime}</b>
                  </p>
                )}
              </div>
            ) : hoveredSeat.status === 2 ? (
              <div className="space-y-1">
                <p className="text-red-300 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  Asignado a: <b>{hoveredSeat.occupantName || 'Campuser'}</b>
                </p>
                {hoveredSeat.endTime && (
                  <p className="text-gray-300 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    Finaliza a las: <b>{hoveredSeat.endTime}</b>
                  </p>
                )}
                <p className="text-[10px] text-gray-400 italic">
                  * No se puede cambiar. Se liberará automáticamente al terminar su tiempo.
                </p>
              </div>
            ) : (
              <p className="text-emerald-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Haz clic para elegir horario y reservar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Footer for the Room */}
      <div className="px-6 py-3 bg-[#0d0b2e] border-t border-[#2f2d78] flex flex-wrap items-center justify-between text-xs gap-3">
        {mySeat ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-300">
              Tienes la <b>Silla #{mySeat.seatIndex + 1}</b> en este salón.
            </span>
            {mySeat.endTime && (
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Vence a las {mySeat.endTime}
              </span>
            )}
            <button
              onClick={onFreeMySeat}
              className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
            >
              Liberar mi puesto
            </button>
          </div>
        ) : (
          <div className="text-gray-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-purple-400" />
            <span>
              Toca cualquier silla verde para seleccionar tu horario y reservar. Máximo 1 puesto por usuario.
            </span>
          </div>
        )}

        <div className="text-[#9a9bd0] text-[11px]">
          Desocupación automática por temporizador en tiempo real
        </div>
      </div>
    </div>
  );
};
