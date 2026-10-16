export interface User {
  pin: string;
  n: string;
  r: 'estudiante' | 'directivo';
  z?: string; // id de zona preferida
  cargo?: string;
  avatar?: AvatarConfig;
}

export type AvatarGender = 'femenino' | 'masculino';

export interface AvatarConfig {
  gender: AvatarGender;
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  hoodieColor: string;
  eyeStyle: string;
  accessory: string;
  expression: string;
}

export interface Zone {
  id: string;
  n: string;
  c: string; // color hex
  b: [number, number, number, number]; // [x, y, w, h]
  p?: string; // svg path
  a?: [number, number, number, number]; // alternate inner bounding box
  s: number; // expected seats capacity
  type?: 'gamer' | 'auditorio' | 'cafe' | 'reunion' | 'oficina';
  description?: string;
  specs?: string[];
}

export interface SeatState {
  seatIndex: number;
  status: 0 | 1 | 2; // 0=Libre, 1=Seleccionada, 2=Ocupada
  occupantPin?: string;
  occupantName?: string;
  occupantAvatar?: AvatarConfig;
  startTime?: string; // ISO string or HH:mm
  endTime?: string;   // ISO string or HH:mm
  date?: string;      // YYYY-MM-DD
  durationMinutes?: number;
  reservationId?: string;
}

export interface RoomReservation {
  roomId: string;
  pin: string;
  name: string;
  cargo?: string;
  startTime: string;
  endTime: string;
  date: string;
  reason?: string;
}

export interface ReservationRecord {
  id: string;
  pin: string;
  userName: string;
  userRole: 'estudiante' | 'directivo';
  userAvatar?: AvatarConfig;
  roomId: string;
  roomName: string;
  seatIndex: number | null; // null si es sala completa
  isFullRoom?: boolean;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  createdAt: number;
  status: 'activa' | 'expirada' | 'cancelada';
}

export interface OccupancyStats {
  totalCapacity: number;
  occupiedSeats: number;
  reservedRoomsCount: number;
  freeSeats: number;
  occupancyPercent: number;
  roomBreakdown: {
    id: string;
    name: string;
    capacity: number;
    occupied: number;
    percent: number;
    isFullReserved: boolean;
  }[];
}
