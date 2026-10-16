import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface User {
  pin: string;
  n: string;
  r: 'estudiante' | 'directivo';
  z?: string;
  cargo?: string;
  avatar?: AvatarConfig;
}

export interface AvatarConfig {
  gender: 'femenino' | 'masculino';
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
  c: string;
  b: [number, number, number, number];
  p?: string;
  a?: [number, number, number, number];
  s: number;
  type: 'gamer' | 'auditorio' | 'cafe' | 'reunion' | 'oficina';
  description: string;
  specs: string[];
}

export interface SeatState {
  seatIndex: number;
  status: 0 | 1 | 2; // 0=Libre, 1=Seleccionado, 2=Ocupado
  occupantPin?: string;
  occupantName?: string;
  occupantAvatar?: AvatarConfig;
  startTime?: string;
  endTime?: string;
  date?: string;
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
}

export interface ReservationRecord {
  id: string;
  pin: string;
  userName: string;
  userRole: 'estudiante' | 'directivo';
  userAvatar?: AvatarConfig;
  roomId: string;
  roomName: string;
  seatIndex: number | null;
  isFullRoom?: boolean;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  createdAt: number;
  status: 'activa' | 'expirada' | 'cancelada';
}

export interface ActivityEvent {
  id: string;
  text: string;
  time: string;
  type: 'in' | 'out' | 'room';
  timestamp: number;
}

export interface CampusDatabase {
  users: Record<string, User>;
  zones: Zone[];
  seatsByZone: Record<string, SeatState[]>;
  roomReservations: Record<string, RoomReservation>;
  reservations: ReservationRecord[];
  activity: ActivityEvent[];
}

const DB_FILE = path.resolve(process.cwd(), 'campus_data.json');

// Exact Official Campusland Rooms & Capacities (277 total)
export const OFFICIAL_ZONES: Zone[] = [
  {
    id: 'aud',
    n: 'Auditorio',
    c: '#8b5cf6',
    p: 'M697 335 Q700 200 800 152 Q850 138 890 140 L892 330 Z',
    b: [697, 138, 195, 197],
    a: [715, 170, 170, 150],
    s: 100,
    type: 'auditorio',
    description: 'Salón principal para masterclasses, eventos institucionales y demos (100 puestos).',
    specs: ['Proyector láser 4K', 'Audio envolvente', 'Climatización dual', 'Podio interactivo']
  },
  {
    id: 'caf',
    n: 'Skilab',
    c: '#f59e0b',
    p: 'M895 140 Q990 140 1060 200 Q1100 240 1100 290 L1100 335 L895 335 Z',
    b: [895, 140, 205, 195],
    a: [905, 165, 185, 160],
    s: 20,
    type: 'gamer',
    description: 'Laboratorio de desarrollo avanzado y prototipado rápido de software.',
    specs: ['Estaciones i9 + RTX 4080', 'Monitores duales 144Hz', 'Sillas ergonómicas Pro']
  },
  {
    id: 'hun',
    n: 'Cosmos',
    c: '#ef4444',
    p: 'M880 340 L1100 340 L1110 465 L1085 545 L880 545 Z',
    b: [880, 340, 230, 205],
    s: 25,
    type: 'gamer',
    description: 'Salón de programación intensiva para módulos Frontend y DevOps.',
    specs: ['PC Gaming Core i7', 'Doble pantalla IPS', 'Lockers de almacenamiento']
  },
  {
    id: 'cwn',
    n: 'Spooki',
    c: '#14b8a6',
    b: [480, 425, 385, 65],
    s: 38,
    type: 'gamer',
    description: 'Espacio de trabajo colaborativo para proyectos y hackathons de campus.',
    specs: ['Equipos Ryzen 7', 'Fibra óptica 1Gbps', 'Lockers individuales']
  },
  {
    id: 'cwc',
    n: 'Apolo',
    c: '#3b82f6',
    b: [585, 520, 230, 280],
    s: 34,
    type: 'gamer',
    description: 'Aula especializada en desarrollo Backend, Inteligencia Artificial y Cloud.',
    specs: ['Monitores curvos 27"', 'Teclado mecánico y mouse gaming', 'Sillas Pro']
  },
  {
    id: 'aul',
    n: 'Artemis',
    c: '#ec4899',
    p: 'M300 598 L468 598 L468 768 L412 768 L412 838 L282 838 Z',
    b: [282, 598, 186, 240],
    a: [296, 606, 160, 156],
    s: 32,
    type: 'gamer',
    description: 'El salón insignia de entrenamiento intensivo con estaciones duales.',
    specs: ['Pantallas duales por puesto', 'Torres gaming RGB', 'Smart Board 85"', 'Lockers metálicos']
  },
  {
    id: 'reu',
    n: 'Blanca',
    c: '#f97316',
    b: [827, 575, 83, 60],
    s: 12,
    type: 'reunion',
    description: 'Sala de juntas ejecutivas, entrevistas técnicas y reuniones de equipo.',
    specs: ['Mesa de conferencia elíptica', 'Cámara 360° para videollamadas', 'Pizarra táctil']
  },
  {
    id: 'jun',
    n: 'Azul',
    c: '#06b6d4',
    b: [830, 638, 85, 88],
    s: 10,
    type: 'reunion',
    description: 'Sala de estudio grupal y sesiones 1-to-1 con mentores de tecnología.',
    specs: ['Pantalla interactiva', 'Mesa de coworking', 'Insonorización acústica']
  },
  {
    id: 'ofi',
    n: 'Amarillas verdes',
    c: '#eab308',
    b: [415, 772, 145, 93],
    s: 6,
    type: 'oficina',
    description: 'Oficinas de coordinación académica y dirección de Campusland.',
    specs: ['Acceso restringido', 'Terminal de gestión general']
  }
];

export const INITIAL_USERS: Record<string, User> = {
  '1001': {
    pin: '1001',
    n: 'Ana Gómez',
    r: 'estudiante',
    z: 'aul',
    avatar: {
      gender: 'femenino',
      skinColor: '#ffe0bd',
      hairStyle: 'largo_liso',
      hairColor: '#1e1b2e',
      hoodieColor: '#4c1d95',
      eyeStyle: 'anime_sparkle',
      accessory: 'ninguno',
      expression: 'sonrisa',
    },
  },
  '1002': {
    pin: '1002',
    n: 'Luis Pérez',
    r: 'estudiante',
    z: 'cwc',
    avatar: {
      gender: 'masculino',
      skinColor: '#f7d0b3',
      hairStyle: 'corto_moderno',
      hairColor: '#171717',
      hoodieColor: '#3b0764',
      eyeStyle: 'anime_dark',
      accessory: 'audifonos',
      expression: 'concentrado',
    },
  },
  '1003': {
    pin: '1003',
    n: 'Sofía Ruiz',
    r: 'estudiante',
    z: 'cwn',
    avatar: {
      gender: 'femenino',
      skinColor: '#ffe0bd',
      hairStyle: 'coleta',
      hairColor: '#312e81',
      hoodieColor: '#4c1d95',
      eyeStyle: 'anime_sparkle',
      accessory: 'gafas',
      expression: 'guiño',
    },
  },
  '1004': {
    pin: '1004',
    n: 'Camilo Torres',
    r: 'estudiante',
    z: 'hun',
    avatar: {
      gender: 'masculino',
      skinColor: '#e8b998',
      hairStyle: 'corto_despeinado',
      hairColor: '#2e1065',
      hoodieColor: '#18181b',
      eyeStyle: 'anime_dark',
      accessory: 'mochila',
      expression: 'sonrisa',
    },
  },
  '9001': {
    pin: '9001',
    n: 'Laura Gómez',
    r: 'directivo',
    cargo: 'Coordinadora Académica',
    avatar: {
      gender: 'femenino',
      skinColor: '#ffe0bd',
      hairStyle: 'largo_liso',
      hairColor: '#18181b',
      hoodieColor: '#4c1d95',
      eyeStyle: 'anime_sparkle',
      accessory: 'credencial',
      expression: 'sonrisa',
    },
  },
  '9002': {
    pin: '9002',
    n: 'Carlos Rojas',
    r: 'directivo',
    cargo: 'Director de Campus',
    avatar: {
      gender: 'masculino',
      skinColor: '#f7d0b3',
      hairStyle: 'corto_moderno',
      hairColor: '#171717',
      hoodieColor: '#1e1b4b',
      eyeStyle: 'anime_dark',
      accessory: 'credencial',
      expression: 'concentrado',
    },
  },
};

class CampusDBManager {
  private db: CampusDatabase;
  private emitter = new EventEmitter();

  constructor() {
    this.db = this.loadOrCreateDB();
    this.startBackgroundExpirationTicker();
  }

  public onStateChange(listener: (state: any) => void): () => void {
    this.emitter.on('change', listener);
    return () => {
      this.emitter.off('change', listener);
    };
  }

  private notifyChange() {
    try {
      this.emitter.emit('change', this.getFullState());
    } catch (e) {
      console.error('Error emitting state change:', e);
    }
  }

  private loadOrCreateDB(): CampusDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(data) as CampusDatabase;

        // Ensure zones are up to date with official capacities
        parsed.zones = OFFICIAL_ZONES;

        // Ensure all zones have exact seat array length
        OFFICIAL_ZONES.forEach((z) => {
          if (!parsed.seatsByZone[z.id] || parsed.seatsByZone[z.id].length !== z.s) {
            const existing = parsed.seatsByZone[z.id] || [];
            parsed.seatsByZone[z.id] = Array.from({ length: z.s }, (_, i) => {
              return existing[i] || { seatIndex: i, status: 0 };
            });
          }
        });

        return parsed;
      }
    } catch (e) {
      console.error('Error loading campus_data.json, initializing fresh store:', e);
    }

    // Default initialization
    const initialSeats: Record<string, SeatState[]> = {};
    OFFICIAL_ZONES.forEach((z) => {
      initialSeats[z.id] = Array.from({ length: z.s }, (_, i) => ({
        seatIndex: i,
        status: 0,
      }));
    });

    // Seed realistic demo occupancies
    if (initialSeats['aul']) {
      initialSeats['aul'][0] = { seatIndex: 0, status: 2, occupantName: 'Mateo Rojas', occupantPin: '5001', endTime: '18:30' };
      initialSeats['aul'][1] = { seatIndex: 1, status: 2, occupantName: 'David Silva', occupantPin: '5002', endTime: '17:00' };
      initialSeats['aul'][6] = { seatIndex: 6, status: 2, occupantName: 'Carolina Paz', occupantPin: '5003', endTime: '16:45' };
      initialSeats['aul'][10] = { seatIndex: 10, status: 2, occupantName: 'Esteban Cruz', occupantPin: '5004', endTime: '18:00' };
    }
    if (initialSeats['cwc']) {
      initialSeats['cwc'][2] = { seatIndex: 2, status: 2, occupantName: 'Javier Niño', occupantPin: '5005', endTime: '19:00' };
      initialSeats['cwc'][3] = { seatIndex: 3, status: 2, occupantName: 'Paula Vera', occupantPin: '5006', endTime: '17:30' };
    }

    const initialDB: CampusDatabase = {
      users: { ...INITIAL_USERS },
      zones: OFFICIAL_ZONES,
      seatsByZone: initialSeats,
      roomReservations: {},
      reservations: [],
      activity: [
        { id: '1', text: 'Mateo Rojas inició turno en Artemis - Puesto #1', time: 'Hace 15 min', type: 'in', timestamp: Date.now() - 900000 },
        { id: '2', text: 'David Silva reservó Puesto #2 en Artemis', time: 'Hace 10 min', type: 'in', timestamp: Date.now() - 600000 },
        { id: '3', text: 'Javier Niño ocupó Puesto #3 en Apolo', time: 'Hace 5 min', type: 'in', timestamp: Date.now() - 300000 },
      ],
    };

    this.saveToFile(initialDB);
    return initialDB;
  }

  private saveToFile(data?: CampusDatabase) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.db, null, 2), 'utf-8');
      this.notifyChange();
    } catch (e) {
      console.error('Error writing campus_data.json:', e);
    }
  }

  // Live Background Expiration Checker
  // Automatically desocupates seats when end time passes
  private startBackgroundExpirationTicker() {
    setInterval(() => {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      let changed = false;

      this.db.reservations.forEach((res) => {
        if (res.status === 'activa') {
          const isExpired = res.date < todayStr || (res.date === todayStr && res.endTime <= currentTimeStr);

          if (isExpired) {
            res.status = 'expirada';
            changed = true;

            // Free the seat
            if (res.seatIndex !== null && this.db.seatsByZone[res.roomId]) {
              const currentSeat = this.db.seatsByZone[res.roomId][res.seatIndex];
              if (currentSeat && currentSeat.occupantPin === res.pin) {
                this.db.seatsByZone[res.roomId][res.seatIndex] = {
                  seatIndex: res.seatIndex,
                  status: 0,
                };
              }
            }

            // If room reservation, remove it
            if (res.isFullRoom && this.db.roomReservations[res.roomId]) {
              delete this.db.roomReservations[res.roomId];
            }

            // Log event
            this.addActivity(
              `Turno finalizado para ${res.userName} en ${res.roomName} (${
                res.isFullRoom ? 'Sala Completa' : `Puesto #${(res.seatIndex ?? 0) + 1}`
              }) - Puesto liberado automáticamente`,
              'out'
            );
          }
        }
      });

      if (changed) {
        this.saveToFile();
      }
    }, 1000);
  }

  public getFullState() {
    // Calculate live occupancy stats
    let totalCapacity = 0;
    let totalOccupied = 0;

    const roomBreakdown = this.db.zones.map((z) => {
      totalCapacity += z.s;
      const sList = this.db.seatsByZone[z.id] || [];
      const occupied = sList.filter((s) => s.status === 2).length;
      totalOccupied += occupied;
      const percent = z.s > 0 ? Math.round((occupied / z.s) * 100) : 0;

      return {
        id: z.id,
        name: z.n,
        capacity: z.s,
        occupied,
        percent,
        isFullReserved: Boolean(this.db.roomReservations[z.id]),
      };
    });

    const totalFree = totalCapacity - totalOccupied;
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      zones: this.db.zones,
      seatsByZone: this.db.seatsByZone,
      roomReservations: this.db.roomReservations,
      reservations: this.db.reservations,
      activity: this.db.activity.slice(0, 20),
      stats: {
        totalCapacity,
        totalOccupied,
        totalFree,
        occupancyPercent,
        reservedRoomsCount: Object.keys(this.db.roomReservations).length,
        roomBreakdown,
      },
    };
  }

  public getUserByPin(pin: string): User | null {
    return this.db.users[pin] || null;
  }

  public loginOrRegister(pin: string, name?: string): User {
    if (this.db.users[pin]) {
      return this.db.users[pin];
    }
    const isDirectivo = pin.startsWith('9');
    const newUser: User = {
      pin,
      n: name || (isDirectivo ? `Directivo (${pin})` : `Campuser (${pin})`),
      r: isDirectivo ? 'directivo' : 'estudiante',
      cargo: isDirectivo ? 'Coordinador General' : undefined,
      z: 'aul',
      avatar: {
        gender: isDirectivo ? 'masculino' : 'femenino',
        skinColor: '#ffe0bd',
        hairStyle: isDirectivo ? 'corto_moderno' : 'largo_liso',
        hairColor: '#1e1b2e',
        hoodieColor: isDirectivo ? '#1e1b4b' : '#4c1d95',
        eyeStyle: 'anime_sparkle',
        accessory: isDirectivo ? 'credencial' : 'ninguno',
        expression: 'sonrisa',
      },
    };
    this.db.users[pin] = newUser;
    this.saveToFile();
    return newUser;
  }

  public updateAvatar(pin: string, avatar: AvatarConfig): boolean {
    if (!this.db.users[pin]) return false;
    this.db.users[pin].avatar = avatar;

    // Update avatar on active seats
    for (const zId in this.db.seatsByZone) {
      this.db.seatsByZone[zId].forEach((seat) => {
        if (seat.occupantPin === pin) {
          seat.occupantAvatar = avatar;
        }
      });
    }

    this.saveToFile();
    return true;
  }

  public bookReservation(data: {
    pin: string;
    roomId: string;
    seatIndex: number;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isFullRoom?: boolean;
  }): { success: boolean; message?: string; reservation?: ReservationRecord } {
    const user = this.db.users[data.pin];
    if (!user) return { success: false, message: 'Usuario no registrado' };

    const zone = this.db.zones.find((z) => z.id === data.roomId);
    if (!zone) return { success: false, message: 'Salón no encontrado' };

    // 1. Rule: Maximum 7 days in advance
    const chosenDate = new Date(data.date + 'T00:00:00');
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 7);
    limitDate.setHours(23, 59, 59, 999);

    if (chosenDate > limitDate) {
      return {
        success: false,
        message: 'Por política de Campusland, no se puede reservar con más de 1 semana de anticipación.',
      };
    }

    // 2. Administrator Full Room Reservation
    if (data.isFullRoom && user.r === 'directivo') {
      this.db.roomReservations[data.roomId] = {
        roomId: data.roomId,
        pin: user.pin,
        name: user.n,
        cargo: user.cargo,
        startTime: data.startTime,
        endTime: data.endTime,
        date: data.date,
      };

      const newRecord: ReservationRecord = {
        id: `res_${Date.now()}`,
        pin: user.pin,
        userName: user.n,
        userRole: user.r,
        userAvatar: user.avatar,
        roomId: data.roomId,
        roomName: zone.n,
        seatIndex: null,
        isFullRoom: true,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        createdAt: Date.now(),
        status: 'activa',
      };

      this.db.reservations.unshift(newRecord);
      this.addActivity(`${user.n} reservó toda la sala ${zone.n} para evento (${data.startTime} - ${data.endTime})`, 'room');
      this.saveToFile();
      return { success: true, reservation: newRecord };
    }

    // 3. Rule: Check if room is reserved by admin
    if (this.db.roomReservations[data.roomId] && user.r !== 'directivo') {
      return {
        success: false,
        message: `La sala ${zone.n} está reservada en su totalidad por ${this.db.roomReservations[data.roomId].name}.`,
      };
    }

    // 4. Rule: One seat per user at any given time
    const userConflict = this.db.reservations.find(
      (r) =>
        r.pin === user.pin &&
        r.status === 'activa' &&
        r.date === data.date &&
        r.startTime < data.endTime &&
        r.endTime > data.startTime
    );

    if (userConflict && user.r !== 'directivo') {
      return {
        success: false,
        message: `Ya tienes reservado el Puesto #${(userConflict.seatIndex ?? 0) + 1} en ${
          userConflict.roomName
        } para este horario (${userConflict.startTime} - ${userConflict.endTime}). Cada campuser puede ocupar 1 solo puesto a la vez.`,
      };
    }

    // 5. Rule: Puesto already occupied by someone else
    const roomSeats = this.db.seatsByZone[data.roomId] || [];
    const targetSeat = roomSeats[data.seatIndex];

    if (targetSeat && targetSeat.status === 2 && targetSeat.occupantPin !== user.pin) {
      return {
        success: false,
        message: 'Este puesto ya está asignado a otra persona y no puede cambiarse hasta que expire su turno.',
      };
    }

    // 6. Assign the seat
    this.db.seatsByZone[data.roomId][data.seatIndex] = {
      seatIndex: data.seatIndex,
      status: 2,
      occupantPin: user.pin,
      occupantName: user.n,
      occupantAvatar: user.avatar,
      startTime: data.startTime,
      endTime: data.endTime,
      date: data.date,
      durationMinutes: data.durationMinutes,
      reservationId: `res_${Date.now()}`,
    };

    const newRecord: ReservationRecord = {
      id: `res_${Date.now()}`,
      pin: user.pin,
      userName: user.n,
      userRole: user.r,
      userAvatar: user.avatar,
      roomId: data.roomId,
      roomName: zone.n,
      seatIndex: data.seatIndex,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      createdAt: Date.now(),
      status: 'activa',
    };

    this.db.reservations.unshift(newRecord);
    this.addActivity(`${user.n} reservó Puesto #${data.seatIndex + 1} en ${zone.n} hasta las ${data.endTime}`, 'in');
    this.saveToFile();

    return { success: true, reservation: newRecord };
  }

  public cancelReservation(reservationId: string, pin: string): boolean {
    const res = this.db.reservations.find((r) => r.id === reservationId);
    if (!res) return false;

    const user = this.db.users[pin];
    if (!user) return false;

    // Only owner or directivo can cancel
    if (res.pin !== pin && user.r !== 'directivo') return false;

    res.status = 'cancelada';

    // Free the seat
    if (res.seatIndex !== null && this.db.seatsByZone[res.roomId]) {
      const s = this.db.seatsByZone[res.roomId][res.seatIndex];
      if (s && s.occupantPin === res.pin) {
        this.db.seatsByZone[res.roomId][res.seatIndex] = {
          seatIndex: res.seatIndex,
          status: 0,
        };
      }
    }

    // Free room if full
    if (res.isFullRoom && this.db.roomReservations[res.roomId]) {
      delete this.db.roomReservations[res.roomId];
    }

    this.addActivity(`Reserva cancelada en ${res.roomName} por ${user.n}`, 'out');
    this.saveToFile();
    return true;
  }

  public freeUserActiveSeat(pin: string): number {
    let freedCount = 0;
    const user = this.db.users[pin];

    for (const zId in this.db.seatsByZone) {
      this.db.seatsByZone[zId].forEach((seat) => {
        if (seat.occupantPin === pin && seat.status === 2) {
          seat.status = 0;
          delete seat.occupantPin;
          delete seat.occupantName;
          delete seat.occupantAvatar;
          delete seat.startTime;
          delete seat.endTime;
          freedCount++;
        }
      });
    }

    this.db.reservations.forEach((r) => {
      if (r.pin === pin && r.status === 'activa') {
        r.status = 'expirada';
      }
    });

    if (freedCount > 0 && user) {
      this.addActivity(`${user.n} liberó su puesto voluntariamente`, 'out');
      this.saveToFile();
    }

    return freedCount;
  }

  public adminCancelRoomReservation(roomId: string): boolean {
    if (this.db.roomReservations[roomId]) {
      const room = this.db.roomReservations[roomId];
      delete this.db.roomReservations[roomId];

      this.db.reservations.forEach((r) => {
        if (r.roomId === roomId && r.isFullRoom && r.status === 'activa') {
          r.status = 'cancelada';
        }
      });

      this.addActivity(`Reserva de sala completa cancelada para ${roomId}`, 'out');
      this.saveToFile();
      return true;
    }
    return false;
  }

  private addActivity(text: string, type: 'in' | 'out' | 'room') {
    this.db.activity.unshift({
      id: String(Date.now()),
      text,
      time: 'Ahora',
      type,
      timestamp: Date.now(),
    });
    if (this.db.activity.length > 50) {
      this.db.activity = this.db.activity.slice(0, 50);
    }
  }
}

export const campusDB = new CampusDBManager();
