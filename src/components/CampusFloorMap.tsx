import React, { useState } from 'react';
import { Zone, User, SeatState, RoomReservation } from '../types';
import { AvatarChibi } from './AvatarChibi';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Eye } from 'lucide-react';

interface Props {
  zones: Zone[];
  seatsByZone: Record<string, SeatState[]>;
  roomReservations: Record<string, RoomReservation>;
  currentUser: User;
  onOpenRoom: (zoneId: string) => void;
  selectedZoneId?: string | null;
}

export const CampusFloorMap: React.FC<Props> = ({
  zones,
  seatsByZone,
  roomReservations,
  currentUser,
  onOpenRoom,
  selectedZoneId,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);

  // Find where current user is sitting (if anywhere)
  let userZoneId: string | null = null;
  let userSeatIndex: number | null = null;

  for (const [zId, seatList] of Object.entries(seatsByZone)) {
    const s = seatList.find((item) => item.occupantPin === currentUser.pin);
    if (s) {
      userZoneId = zId;
      userSeatIndex = s.seatIndex;
      break;
    }
  }

  const userZone = zones.find((z) => z.id === userZoneId);

  return (
    <div className="relative w-full h-[640px] bg-[#100e3a] border border-[#2f2d78] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Top Map Toolbar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#0d0b2e]/90 border-b border-[#2f2d78] z-10">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#8b7bff]" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Plano de Evacuación y Distribución en Vivo · Campuslands
            </h3>
            <p className="text-xs text-[#9a9bd0]">
              Haz clic en cualquier salón para ver sus puestos o entrar en detalle
            </p>
          </div>
        </div>

        {/* Live location badge if user has a seat */}
        {userZone && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-400/40 rounded-xl text-xs text-yellow-300 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>
              Tu ubicación actual: <b>{userZone.n}</b> (Puesto #{userSeatIndex! + 1})
            </span>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#1b1860] p-1 rounded-xl border border-[#2f2d78]">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            title="Alejar"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-purple-200 px-1">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
            title="Acercar"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Restablecer"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Architectural Canvas */}
      <div className="relative flex-1 overflow-auto bg-[#0a0826] cursor-grab active:cursor-grabbing p-4 flex items-center justify-center">
        <div
          className="transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 1269 952"
            width="1000"
            height="750"
            className="rounded-xl overflow-hidden shadow-2xl border border-[#3b3469]"
          >
            <defs>
              <pattern
                id="hall-grid"
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f1b4d" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Architectural Building Background */}
            <rect x="0" y="0" width="1269" height="952" fill="#0f0c33" />
            <rect x="0" y="0" width="1269" height="952" fill="url(#hall-grid)" opacity="0.6" />

            {/* Perimeter Building Walls from Evacuation Blueprint */}
            <path
              d="M 50 120 L 550 120 L 550 140 L 700 140 Q 850 130 1100 280 L 1110 560 L 890 560 L 890 770 L 660 770 L 660 880 L 250 880 L 250 580 L 50 580 Z"
              fill="#181548"
              stroke="#3b3780"
              strokeWidth="6"
            />

            {/* Hallway Evacuation Routes (Green subtle arrows path matching photo) */}
            <g id="evacuation-arrows" opacity="0.35">
              {[
                [200, 500], [280, 500], [380, 500], [480, 500], [580, 500],
                [650, 440], [650, 360], [650, 260],
                [760, 480], [820, 480], [900, 480],
                [600, 650], [600, 720],
              ].map(([ax, ay], idx) => (
                <path
                  key={`arr-${idx}`}
                  d={`M ${ax} ${ay} L ${ax + 12} ${ay - 5} L ${ax + 12} ${ay + 5} Z`}
                  fill="#10b981"
                />
              ))}
            </g>

            {/* Coworking Round Cafetería Tables in Central Open Hall */}
            <g id="cafe-tables" opacity="0.45">
              {[
                [500, 600], [580, 600], [660, 600],
                [520, 680], [600, 680], [680, 680],
                [540, 750], [620, 750],
              ].map(([tx, ty], i) => (
                <g key={`table-${i}`} transform={`translate(${tx}, ${ty})`}>
                  <polygon
                    points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8"
                    fill="#334155"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />
                  {/* Chairs around table */}
                  <circle cx="0" cy="-24" r="4" fill="#94a3b8" />
                  <circle cx="21" cy="-12" r="4" fill="#94a3b8" />
                  <circle cx="21" cy="12" r="4" fill="#94a3b8" />
                  <circle cx="0" cy="24" r="4" fill="#94a3b8" />
                  <circle cx="-21" cy="12" r="4" fill="#94a3b8" />
                  <circle cx="-21" cy="-12" r="4" fill="#94a3b8" />
                </g>
              ))}
            </g>

            {/* Staircases and Service Cores */}
            <g id="stairs" fill="#1e1b4b" stroke="#334155" strokeWidth="2">
              {/* Main stairs */}
              <rect x="160" y="560" width="80" height="90" rx="3" />
              {[0, 1, 2, 3, 4, 5, 6].map((st) => (
                <line key={`st-${st}`} x1="160" y1={570 + st * 11} x2="240" y2={570 + st * 11} stroke="#475569" strokeWidth="1.5" />
              ))}
              <text x="200" y="610" textAnchor="middle" fill="#94a3b8" fontSize="10">ESCALERAS</text>

              {/* Elevators */}
              <rect x="80" y="380" width="70" height="60" rx="2" />
              <text x="115" y="415" textAnchor="middle" fill="#64748b" fontSize="9">ASCENSOR</text>

              {/* Restrooms */}
              <rect x="80" y="460" width="70" height="90" rx="2" fill="#1e1b4b" />
              <text x="115" y="510" textAnchor="middle" fill="#64748b" fontSize="9">BAÑOS</text>
            </g>

            {/* ALL CAMPUS ROOM ZONES (INTERACTIVE) */}
            {zones.map((z) => {
              const [x, y, w, h] = z.b;
              const seats = seatsByZone[z.id] || [];
              const occupied = seats.filter((s) => s.status === 2).length;
              const free = z.s - occupied;
              const isRoomReserved = Boolean(roomReservations[z.id]);
              const isSelected = selectedZoneId === z.id;
              const isUserHere = userZoneId === z.id;

              return (
                <g
                  key={z.id}
                  onClick={() => onOpenRoom(z.id)}
                  onMouseEnter={() => setHoveredZone(z)}
                  onMouseLeave={() => setHoveredZone(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  {/* Zone Boundary Polygon / Rectangle */}
                  {z.p ? (
                    <path
                      d={z.p}
                      fill={z.c}
                      fillOpacity={isSelected ? 0.65 : isRoomReserved ? 0.45 : 0.28}
                      stroke={z.c}
                      strokeWidth={isSelected ? 5 : 2.5}
                      strokeDasharray={isRoomReserved ? '6 4' : 'none'}
                    />
                  ) : (
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx="8"
                      fill={z.c}
                      fillOpacity={isSelected ? 0.65 : isRoomReserved ? 0.45 : 0.28}
                      stroke={z.c}
                      strokeWidth={isSelected ? 5 : 2.5}
                      strokeDasharray={isRoomReserved ? '6 4' : 'none'}
                    />
                  )}

                  {/* Room Label & Real-Time Stats */}
                  <g transform={`translate(${x + w / 2}, ${y + h / 2})`}>
                    <rect
                      x="-65"
                      y="-22"
                      width="130"
                      height="44"
                      rx="8"
                      fill="#0d0b2e"
                      fillOpacity="0.85"
                      stroke={z.c}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill="#ffffff"
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: 800,
                        fontSize: w < 100 ? 11 : 13,
                      }}
                    >
                      {z.n}
                    </text>
                    <text
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fill={isRoomReserved ? '#c084fc' : '#a7f3d0'}
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: 600,
                        fontSize: 10,
                      }}
                    >
                      {isRoomReserved
                        ? '🔒 Reservada'
                        : `${free} libres / ${z.s}`}
                    </text>
                  </g>

                  {/* LIVE USER AVATAR LOCATOR BEACON ("ESTÁS AQUÍ") */}
                  {isUserHere && (
                    <g transform={`translate(${x + w / 2}, ${y + h / 2 - 38})`}>
                      {/* Animated radar rings */}
                      <circle cx="0" cy="0" r="28" fill="#facc15" fillOpacity="0.25" className="animate-ping" />
                      <circle cx="0" cy="0" r="18" fill="#facc15" fillOpacity="0.5" />

                      {/* Floating Marker Badge with Chibi Avatar */}
                      <g transform="translate(-16, -42)">
                        <rect x="-2" y="-2" width="36" height="36" rx="18" fill="#facc15" stroke="#000" strokeWidth="2" />
                        <foreignObject width="32" height="32" x="0" y="0">
                          <AvatarChibi config={currentUser.avatar} size="xs" />
                        </foreignObject>
                      </g>

                      {/* Location Tooltip Pill */}
                      <g transform="translate(0, -50)">
                        <rect x="-42" y="-14" width="84" height="18" rx="9" fill="#facc15" />
                        <text x="0" y="-1" textAnchor="middle" fill="#000000" fontSize="9" fontWeight="900">
                          📍 ¡ESTÁS AQUÍ!
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Map Legend Footer */}
      <div className="px-6 py-3 bg-[#0d0b2e] border-t border-[#2f2d78] flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[#9a9bd0] font-semibold">Zonas del Campus:</span>
          {zones.slice(0, 6).map((z) => (
            <button
              key={z.id}
              onClick={() => onOpenRoom(z.id)}
              className="flex items-center gap-1.5 hover:text-white text-gray-300 transition-colors"
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: z.c }} />
              <span>{z.n}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-purple-300">
          <Eye className="w-4 h-4 text-purple-400" />
          <span>Haz clic en un salón para entrar a la vista gamer</span>
        </div>
      </div>
    </div>
  );
};
