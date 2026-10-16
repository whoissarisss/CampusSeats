import { User, SeatState, RoomReservation, ReservationRecord, AvatarConfig, Zone } from '../types';

export interface BackendState {
  zones: Zone[];
  seatsByZone: Record<string, SeatState[]>;
  roomReservations: Record<string, RoomReservation>;
  reservations: ReservationRecord[];
  activity: { id: string; text: string; time: string; type: 'in' | 'out' | 'room' }[];
  stats: {
    totalCapacity: number;
    totalOccupied: number;
    totalFree: number;
    occupancyPercent: number;
    reservedRoomsCount: number;
    roomBreakdown: {
      id: string;
      name: string;
      capacity: number;
      occupied: number;
      percent: number;
      isFullReserved: boolean;
    }[];
  };
}

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  database: string;
  autoReleaseEngine: string;
  uptimeSeconds: number;
  stats?: BackendState['stats'];
}

export const api = {
  // Check backend health & status
  async getHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Get full state
  async getState(): Promise<BackendState | null> {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.success) return null;
      return data;
    } catch {
      return null;
    }
  },

  // Live SSE listener with automatic fallback
  subscribeToEvents(onUpdate: (state: BackendState) => void): () => void {
    let evtSource: EventSource | null = null;
    let fallbackInterval: any = null;

    try {
      evtSource = new EventSource('/api/events');
      evtSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.zones && parsed.seatsByZone) {
            onUpdate(parsed);
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      evtSource.onerror = () => {
        // If SSE fails or reconnects, start short polling backup
        if (!fallbackInterval) {
          fallbackInterval = setInterval(async () => {
            const st = await api.getState();
            if (st) onUpdate(st);
          }, 3000);
        }
      };
    } catch {
      // Polling fallback
      fallbackInterval = setInterval(async () => {
        const st = await api.getState();
        if (st) onUpdate(st);
      }, 3000);
    }

    return () => {
      if (evtSource) {
        evtSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  },

  // User PIN login
  async login(pin: string, name?: string): Promise<{ success: boolean; user?: User; message?: string; state?: BackendState }> {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, name }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: 'No se pudo conectar con el servidor backend' };
    }
  },

  // Update avatar
  async updateAvatar(pin: string, avatar: AvatarConfig): Promise<{ success: boolean; state?: BackendState }> {
    try {
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, avatar }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Book a seat or full room
  async bookSeat(params: {
    pin: string;
    roomId: string;
    seatIndex: number;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isFullRoom?: boolean;
  }): Promise<{ success: boolean; message?: string; reservation?: ReservationRecord; state?: BackendState }> {
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: 'Error de conexión con el backend' };
    }
  },

  // Cancel reservation
  async cancelReservation(reservationId: string, pin: string): Promise<{ success: boolean; state?: BackendState }> {
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, pin }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Free user's active seat
  async freeActiveSeat(pin: string): Promise<{ success: boolean; freedCount?: number; state?: BackendState }> {
    try {
      const res = await fetch('/api/free-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Admin cancel full room reservation
  async adminCancelRoom(roomId: string, pin: string): Promise<{ success: boolean; state?: BackendState }> {
    try {
      const res = await fetch('/api/admin/cancel-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, pin }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },
};
