import React, { useState, useEffect, useMemo } from 'react';
import { User, Zone, SeatState, RoomReservation, ReservationRecord, AvatarConfig } from './types';
import { USERS, ZONES } from './data/campusData';
import { AvatarChibi } from './components/AvatarChibi';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { ClassroomGamerView } from './components/ClassroomGamerView';
import { CampusFloorMap } from './components/CampusFloorMap';
import { BookingModal } from './components/BookingModal';
import { WeeklyCalendarView } from './components/WeeklyCalendarView';
import { RealTimeOccupancyPanel } from './components/RealTimeOccupancyPanel';
import { NotificationBanner } from './components/NotificationBanner';
import { CampusChatbot } from './components/CampusChatbot';
import { BackendStatusModal } from './components/BackendStatusModal';
import { api, BackendHealth } from './services/api';
import {
  LayoutGrid,
  Map as MapIcon,
  Calendar as CalendarIcon,
  Activity,
  Bookmark,
  LogOut,
  UserCheck,
  Sparkles,
  Search,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Maximize2,
  Lock,
  Server,
  Database,
  Radio,
} from 'lucide-react';

export default function App() {
  // 1. Current Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Backend Live State
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);

  // 2. Navigation & Views
  // 'salones' | 'mapa' | 'calendario' | 'ocupacion' | 'reservas'
  const [currentView, setCurrentView] = useState<'salones' | 'mapa' | 'calendario' | 'ocupacion' | 'reservas'>('salones');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mapSubView, setMapSubView] = useState<'mapa_general' | 'salon_gamer'>('salon_gamer');

  // 3. Search & Filters for Salones
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<string>('');

  // 4. Modal States
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    zoneId: string;
    seatIndex: number;
  }>({ isOpen: false, zoneId: 'aul', seatIndex: 0 });

  // 5. Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 6. Data Stores (Persistent in localStorage)
  const [seatsByZone, setSeatsByZone] = useState<Record<string, SeatState[]>>(() => {
    const initial: Record<string, SeatState[]> = {};

    try {
      const stored = localStorage.getItem('cl_seats_v4');
      if (stored) {
        const parsed = JSON.parse(stored);
        ZONES.forEach((z) => {
          if (parsed[z.id] && parsed[z.id].length === z.s) {
            initial[z.id] = parsed[z.id];
          } else {
            const existing = parsed[z.id] || [];
            initial[z.id] = Array.from({ length: z.s }, (_, i) => {
              return existing[i] || { seatIndex: i, status: 0 };
            });
          }
        });
        return initial;
      }
    } catch (e) {}

    // Default setup with exact capacities
    ZONES.forEach((z) => {
      initial[z.id] = Array.from({ length: z.s }, (_, i) => ({
        seatIndex: i,
        status: 0,
      }));
    });

    // Seed some initial occupied seats
    if (initial['aul']) {
      initial['aul'][0] = { seatIndex: 0, status: 2, occupantName: 'Mateo Rojas', occupantPin: '5001', endTime: '18:30' };
      initial['aul'][1] = { seatIndex: 1, status: 2, occupantName: 'David Silva', occupantPin: '5002', endTime: '16:00' };
      initial['aul'][6] = { seatIndex: 6, status: 2, occupantName: 'Carolina Paz', occupantPin: '5003', endTime: '17:15' };
      initial['aul'][10] = { seatIndex: 10, status: 2, occupantName: 'Esteban Cruz', occupantPin: '5004', endTime: '15:45' };
    }
    if (initial['cwc']) {
      initial['cwc'][2] = { seatIndex: 2, status: 2, occupantName: 'Javier Niño', occupantPin: '5005', endTime: '17:00' };
      initial['cwc'][3] = { seatIndex: 3, status: 2, occupantName: 'Paula Vera', occupantPin: '5006', endTime: '16:30' };
    }
    return initial;
  });

  const [roomReservations, setRoomReservations] = useState<Record<string, RoomReservation>>(() => {
    try {
      const stored = localStorage.getItem('cl_rooms_v4');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  const [allReservations, setAllReservations] = useState<ReservationRecord[]>(() => {
    try {
      const stored = localStorage.getItem('cl_reservations_v4');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [recentActivity, setRecentActivity] = useState<
    { id: string; text: string; time: string; type: 'in' | 'out' | 'room' }[]
  >(() => {
    return [
      { id: '1', text: 'Mateo Rojas ocupó Puesto #1 en Artemis', time: 'Hace 12 min', type: 'in' },
      { id: '2', text: 'David Silva reservó Puesto #2 en Artemis', time: 'Hace 8 min', type: 'in' },
      { id: '3', text: 'Javier Niño inició turno en Apolo', time: 'Hace 4 min', type: 'in' },
    ];
  });

  // Current system clock
  const [currentClock, setCurrentClock] = useState(new Date());

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('cl_seats_v4', JSON.stringify(seatsByZone));
    } catch (e) {}
  }, [seatsByZone]);

  useEffect(() => {
    try {
      localStorage.setItem('cl_rooms_v4', JSON.stringify(roomReservations));
    } catch (e) {}
  }, [roomReservations]);

  useEffect(() => {
    try {
      localStorage.setItem('cl_reservations_v4', JSON.stringify(allReservations));
    } catch (e) {}
  }, [allReservations]);

  // Sincronización en tiempo real con el backend Express y SSE
  useEffect(() => {
    // 1. Obtener estado de salud del backend
    api.getHealth().then((h) => {
      if (h) {
        setBackendHealth(h);
        setIsBackendConnected(true);
      }
    });

    // 2. Cargar estado inicial desde el backend
    api.getState().then((st) => {
      if (st) {
        if (st.seatsByZone) setSeatsByZone(st.seatsByZone);
        if (st.roomReservations) setRoomReservations(st.roomReservations);
        if (st.reservations) setAllReservations(st.reservations);
        if (st.activity) setRecentActivity(st.activity);
      }
    });

    // 3. Suscripción en vivo por Server-Sent Events (SSE)
    const unsubscribe = api.subscribeToEvents((st) => {
      setIsBackendConnected(true);
      if (st.seatsByZone) setSeatsByZone(st.seatsByZone);
      if (st.roomReservations) setRoomReservations(st.roomReservations);
      if (st.reservations) setAllReservations(st.reservations);
      if (st.activity) setRecentActivity(st.activity);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Live timer tick every 1000ms:
  // Checks for expired seat reservations and pre-expiration 5 min warning
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentClock(now);

      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      // Check all active reservations for expiration
      let hasSeatUpdates = false;
      const updatedSeats = { ...seatsByZone };

      allReservations.forEach((res) => {
        if (res.status === 'activa') {
          // Compare dates & times
          const isPast = res.date < todayStr || (res.date === todayStr && res.endTime <= currentTimeStr);

          if (isPast) {
            // Expire reservation
            res.status = 'expirada';
            hasSeatUpdates = true;

            // Free the seat
            if (res.seatIndex !== null && updatedSeats[res.roomId]) {
              const seat = updatedSeats[res.roomId][res.seatIndex];
              if (seat && seat.occupantPin === res.pin) {
                updatedSeats[res.roomId][res.seatIndex] = {
                  seatIndex: res.seatIndex,
                  status: 0,
                };
              }
            }

            // If room reservation, free it
            if (res.isFullRoom) {
              setRoomReservations((prev) => {
                const next = { ...prev };
                delete next[res.roomId];
                return next;
              });
            }

            // Log activity
            setRecentActivity((prev) => [
              {
                id: String(Date.now()),
                text: `Turno de ${res.userName} finalizado en ${res.roomName} (Puesto #${
                  (res.seatIndex ?? 0) + 1
                }) - Puesto liberado automáticamente`,
                time: 'Ahora',
                type: 'out',
              },
              ...prev.slice(0, 15),
            ]);

            if (currentUser && currentUser.pin === res.pin) {
              showToast(
                `Tu tiempo en la sala ${res.roomName} ha terminado. El puesto ha quedado desocupado automáticamente.`
              );
            }
          }
        }
      });

      if (hasSeatUpdates) {
        setSeatsByZone(updatedSeats);
        setAllReservations([...allReservations]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [allReservations, seatsByZone, currentUser]);

  // Compute remaining seconds for current user's active seat
  const activeUserSeatInfo = useMemo(() => {
    if (!currentUser) return null;

    for (const [zId, seatList] of Object.entries(seatsByZone)) {
      const s = seatList.find((item) => item.occupantPin === currentUser.pin);
      if (s && s.endTime) {
        const zone = ZONES.find((z) => z.id === zId) || null;

        // Calculate remaining seconds
        const [endH, endM] = s.endTime.split(':').map(Number);
        const now = currentClock;
        const endDate = new Date(now);
        endDate.setHours(endH, endM, 0, 0);

        const diffSec = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / 1000));

        return {
          seat: s,
          zone,
          remainingSeconds: diffSec,
        };
      }
    }
    return null;
  }, [currentUser, seatsByZone, currentClock]);

  // Login handler con backend
  const handleLogin = async (pinToUse?: string) => {
    const pin = (pinToUse || pinInput).trim();
    if (!pin) {
      setLoginError('Por favor ingresa tu PIN de acceso');
      return;
    }

    try {
      const res = await api.login(pin);
      if (res.success && res.user) {
        const loggedUser: User = res.user;

        // Recover saved custom avatar from localStorage if available
        const savedAvatarKey = `cl_avatar_${pin}`;
        try {
          const savedAvatar = localStorage.getItem(savedAvatarKey);
          if (savedAvatar) {
            loggedUser.avatar = JSON.parse(savedAvatar);
            api.updateAvatar(pin, loggedUser.avatar!);
          }
        } catch (e) {}

        setCurrentUser(loggedUser);
        setPinInput('');
        setLoginError('');

        if (res.state) {
          if (res.state.seatsByZone) setSeatsByZone(res.state.seatsByZone);
          if (res.state.roomReservations) setRoomReservations(res.state.roomReservations);
          if (res.state.reservations) setAllReservations(res.state.reservations);
          if (res.state.activity) setRecentActivity(res.state.activity);
        }

        if (loggedUser.r === 'directivo') {
          setCurrentView('ocupacion');
          showToast(`Bienvenido(a) ${loggedUser.n} · Modo Directivo / Administrador activo.`);
        } else {
          setSelectedZoneId(loggedUser.z || 'aul');
          setCurrentView('calendario');
          showToast(`¡Hola ${loggedUser.n.split(' ')[0]}! Has iniciado sesión en Campusland.`);
        }
        return;
      }
    } catch (e) {}

    // Fallback local
    const u = USERS[pin];
    if (!u) {
      setLoginError('PIN no registrado. Usa 1001, 1002, 1003 o 9001.');
      return;
    }

    const savedAvatarKey = `cl_avatar_${pin}`;
    let avatarConfig = u.avatar;
    try {
      const savedAvatar = localStorage.getItem(savedAvatarKey);
      if (savedAvatar) avatarConfig = JSON.parse(savedAvatar);
    } catch (e) {}

    const loggedUser: User = {
      ...u,
      avatar: avatarConfig,
    };

    setCurrentUser(loggedUser);
    setPinInput('');
    setLoginError('');

    if (loggedUser.r === 'directivo') {
      setCurrentView('ocupacion');
      showToast(`Bienvenido(a) ${loggedUser.n} · Modo Directivo / Administrador activo.`);
    } else {
      setSelectedZoneId(loggedUser.z || 'aul');
      setCurrentView('calendario');
      showToast(`¡Hola ${loggedUser.n.split(' ')[0]}! Has iniciado sesión en Campusland.`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedZoneId(null);
    setPinInput('');
  };

  // Save Avatar Customization persistente en backend
  const handleSaveAvatar = async (newAvatar: AvatarConfig) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatar: newAvatar };
    setCurrentUser(updatedUser);

    try {
      localStorage.setItem(`cl_avatar_${currentUser.pin}`, JSON.stringify(newAvatar));
    } catch (e) {}

    await api.updateAvatar(currentUser.pin, newAvatar);
    showToast('¡Avatar Chibi actualizado y sincronizado en el servidor!');
  };

  // Free current user's seat early en el backend
  const handleFreeMySeat = async () => {
    if (!currentUser) return;

    try {
      const res = await api.freeActiveSeat(currentUser.pin);
      if (res.success && res.state) {
        if (res.state.seatsByZone) setSeatsByZone(res.state.seatsByZone);
        if (res.state.reservations) setAllReservations(res.state.reservations);
        if (res.state.activity) setRecentActivity(res.state.activity);
        showToast('Has liberado tu puesto. Ha quedado disponible para otro campuser.');
        return;
      }
    } catch (e) {}

    // Local fallback
    let freedCount = 0;
    const updatedSeats = { ...seatsByZone };

    for (const zId in updatedSeats) {
      updatedSeats[zId] = updatedSeats[zId].map((seat) => {
        if (seat.occupantPin === currentUser.pin) {
          freedCount++;
          return {
            seatIndex: seat.seatIndex,
            status: 0,
          };
        }
        return seat;
      });
    }

    setAllReservations((prev) =>
      prev.map((r) =>
        r.pin === currentUser.pin && r.status === 'activa'
          ? { ...r, status: 'expirada' }
          : r
      )
    );

    setSeatsByZone(updatedSeats);

    if (freedCount > 0) {
      showToast('Has liberado tu puesto. Ha quedado disponible para otro campuser.');
      setRecentActivity((prev) => [
        {
          id: String(Date.now()),
          text: `${currentUser.n} liberó su puesto voluntariamente`,
          time: 'Ahora',
          type: 'out',
        },
        ...prev.slice(0, 15),
      ]);
    }
  };

  // Booking Confirmation Logic integrado con el Backend
  const handleConfirmBooking = async (data: {
    roomId: string;
    seatIndex: number;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isFullRoom?: boolean;
  }) => {
    if (!currentUser) return { success: false, message: 'No has iniciado sesión' };

    try {
      const res = await api.bookSeat({
        pin: currentUser.pin,
        roomId: data.roomId,
        seatIndex: data.seatIndex,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        isFullRoom: data.isFullRoom,
      });

      if (!res.success) {
        return { success: false, message: res.message || 'Error en reserva' };
      }

      if (res.state) {
        if (res.state.seatsByZone) setSeatsByZone(res.state.seatsByZone);
        if (res.state.roomReservations) setRoomReservations(res.state.roomReservations);
        if (res.state.reservations) setAllReservations(res.state.reservations);
        if (res.state.activity) setRecentActivity(res.state.activity);
      }

      const zone = ZONES.find((z) => z.id === data.roomId);
      showToast(
        data.isFullRoom
          ? `¡Sala ${zone?.n || ''} reservada por completo para tu evento!`
          : `¡Puesto #${data.seatIndex + 1} en ${zone?.n || ''} reservado hasta las ${data.endTime}!`
      );
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Error de comunicación con el servidor backend' };
    }
  };

  // Cancel reservation en el backend
  const handleCancelReservation = async (reservationId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.cancelReservation(reservationId, currentUser.pin);
      if (res.state) {
        if (res.state.seatsByZone) setSeatsByZone(res.state.seatsByZone);
        if (res.state.roomReservations) setRoomReservations(res.state.roomReservations);
        if (res.state.reservations) setAllReservations(res.state.reservations);
        if (res.state.activity) setRecentActivity(res.state.activity);
      }
      showToast('Reserva cancelada con éxito.');
      return;
    } catch (e) {}

    // Fallback local
    const targetRes = allReservations.find((r) => r.id === reservationId);
    if (!targetRes) return;
    targetRes.status = 'cancelada';

    if (targetRes.seatIndex !== null && seatsByZone[targetRes.roomId]) {
      setSeatsByZone((prev) => ({
        ...prev,
        [targetRes.roomId]: prev[targetRes.roomId].map((s, idx) =>
          idx === targetRes.seatIndex ? { seatIndex: idx, status: 0 } : s
        ),
      }));
    }

    if (targetRes.isFullRoom) {
      setRoomReservations((prev) => {
        const next = { ...prev };
        delete next[targetRes.roomId];
        return next;
      });
    }

    setAllReservations([...allReservations]);
    showToast(`Reserva en ${targetRes.roomName} cancelada.`);
  };

  // Selected Room for detailed inspection
  const activeZone = ZONES.find((z) => z.id === (selectedZoneId || 'aul')) || ZONES[5];

  // Filtered rooms for "Salones" view
  const filteredRooms = ZONES.filter((z) => {
    const matchesSearch =
      !searchQuery ||
      z.n.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(z.s).includes(searchQuery);

    const matchesCap =
      !capacityFilter ||
      (capacityFilter === 's' && z.s <= 20) ||
      (capacityFilter === 'm' && z.s > 20 && z.s <= 40) ||
      (capacityFilter === 'l' && z.s > 40);

    return matchesSearch && matchesCap;
  });

  // If not logged in, render the Campusland Login screen with demo cards
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0b2e] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5b3ff0]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ec4899]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Backend Status Top Right Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={() => setIsBackendModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15124a]/90 hover:bg-[#1b1860] border border-[#2f2d78] text-xs font-semibold text-emerald-400 backdrop-blur-md transition-all shadow-lg hover:border-emerald-500/50"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Backend Express En Línea</span>
            <Server className="w-3.5 h-3.5 text-purple-400 ml-0.5" />
          </button>
        </div>

        <div className="w-full max-w-md bg-[#15124a] border border-[#2f2d78] rounded-3xl p-8 shadow-2xl relative z-10 text-center flex flex-col items-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5b3ff0] to-[#8b7bff] flex items-center justify-center text-3xl shadow-lg mb-3">
            🪐
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            Campus<b className="text-[#8b7bff]">land</b>
          </h1>
          <p className="text-xs text-[#9a9bd0] mt-1.5 max-w-xs">
            Sistema Inteligente de Salones, Puestos Gamer y Control de Ocupación en Vivo
          </p>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="w-full mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 text-left">
                Digita tu PIN de acceso o acerca tu carnet
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full text-center text-3xl tracking-[0.4em] font-mono bg-[#1b1860] border border-[#2f2d78] focus:border-[#8b7bff] rounded-2xl py-3 px-4 text-white outline-none transition-all shadow-inner"
              />
            </div>

            {loginError && (
              <div className="text-xs font-semibold text-red-400 bg-red-950/50 border border-red-500/40 rounded-xl p-2.5 flex items-center justify-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#5b3ff0] hover:bg-[#6d5df0] text-white text-base font-bold rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Ingresar al Campus →
            </button>
          </form>

          {/* Demo PINs Helper */}
          <div className="w-full mt-6 pt-5 border-t border-[#2f2d78] text-left">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#9a9bd0] block mb-2">
              PINs Rápidos de Demostración:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleLogin('1001')}
                className="p-2.5 rounded-xl bg-[#1b1860] hover:bg-[#23207d] border border-[#2f2d78] text-left transition-all group"
              >
                <div className="font-bold text-white group-hover:text-purple-300">1001 · Ana Gómez</div>
                <div className="text-[11px] text-[#9a9bd0]">Estudiante (Artemis)</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('1002')}
                className="p-2.5 rounded-xl bg-[#1b1860] hover:bg-[#23207d] border border-[#2f2d78] text-left transition-all group"
              >
                <div className="font-bold text-white group-hover:text-purple-300">1002 · Luis Pérez</div>
                <div className="text-[11px] text-[#9a9bd0]">Estudiante (Apolo)</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('9001')}
                className="p-2.5 rounded-xl bg-[#1b1860] hover:bg-[#23207d] border border-[#2f2d78] text-left transition-all group"
              >
                <div className="font-bold text-purple-300">9001 · Laura Gómez</div>
                <div className="text-[11px] text-yellow-300">Coordinadora (Admin)</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('9002')}
                className="p-2.5 rounded-xl bg-[#1b1860] hover:bg-[#23207d] border border-[#2f2d78] text-left transition-all group"
              >
                <div className="font-bold text-purple-300">9002 · Carlos Rojas</div>
                <div className="text-[11px] text-yellow-300">Director de Campus</div>
              </button>
            </div>
          </div>
        </div>

        <BackendStatusModal
          isOpen={isBackendModalOpen}
          onClose={() => setIsBackendModalOpen(false)}
          health={backendHealth}
          isConnected={isBackendConnected}
        />
      </div>
    );
  }

  // LOGGED IN USER INTERFACE
  return (
    <div className="min-h-screen bg-[#0d0b2e] text-[#eceaff] flex flex-col font-sans">
      {/* 5-minute Pre-expiration Alert Banner */}
      <NotificationBanner
        activeSeat={activeUserSeatInfo?.seat || null}
        zone={activeUserSeatInfo?.zone || null}
        remainingSeconds={activeUserSeatInfo?.remainingSeconds ?? null}
        onFreeEarly={handleFreeMySeat}
      />

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2.5 bg-[#312e81] border border-[#6d5df0] rounded-xl shadow-2xl text-xs sm:text-sm font-semibold text-white animate-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#0d0b2e]/90 border-b border-[#2f2d78] backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Mobile Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5b3ff0] to-[#8b7bff] flex items-center justify-center text-xl shadow-md">
            🪐
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Campus<b className="text-[#8b7bff]">land</b>
              {currentUser.r === 'directivo' && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                  Directivo
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#9a9bd0] hidden sm:block">
              {currentClock.toLocaleTimeString()} · Gestión Inteligente de Salones
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9a9bd0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Buscar salón, capacidad, especificaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#15124a] border border-[#2f2d78] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#8b7bff] transition-colors"
            />
          </div>
        </div>

        {/* User Identity Chip with Custom Chibi Avatar & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Backend Status Pill */}
          <button
            onClick={() => setIsBackendModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#15124a] hover:bg-[#1b1860] border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm group"
            title="Ver estado y arquitectura del Backend Express"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] hidden sm:inline">Backend</span>
            <Server className="w-3.5 h-3.5 text-purple-300 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#15124a] hover:bg-[#1b1860] border border-[#2f2d78] hover:border-[#8b7bff] transition-all group"
            title="Personalizar mi Avatar Chibi"
          >
            <div className="relative">
              <AvatarChibi config={currentUser.avatar} size="sm" isAnimated />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1">
                {currentUser.n}
                <Sparkles className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-[10px] text-[#9a9bd0]">
                {currentUser.r === 'directivo'
                  ? currentUser.cargo || 'Directivo'
                  : 'Estudiante Campus'}
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-red-300 hover:text-white bg-[#1b1860] hover:bg-red-600/70 border border-[#2f2d78] rounded-xl transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-56 bg-[#0d0b2e] border-b md:border-b-0 md:border-r border-[#2f2d78] p-3 flex md:flex-col justify-around md:justify-start gap-1.5 shrink-0 z-20">
          <button
            onClick={() => setCurrentView('salones')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'salones'
                ? 'bg-[#5b3ff0] text-white shadow-lg'
                : 'text-[#9a9bd0] hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Salones</span>
          </button>

          <button
            onClick={() => setCurrentView('mapa')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'mapa'
                ? 'bg-[#5b3ff0] text-white shadow-lg'
                : 'text-[#9a9bd0] hover:text-white hover:bg-white/5'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Mapa en Vivo</span>
          </button>

          <button
            onClick={() => setCurrentView('calendario')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'calendario'
                ? 'bg-[#5b3ff0] text-white shadow-lg'
                : 'text-[#9a9bd0] hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendario (7d)</span>
          </button>

          <button
            onClick={() => setCurrentView('ocupacion')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'ocupacion'
                ? 'bg-[#5b3ff0] text-white shadow-lg'
                : 'text-[#9a9bd0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ocupación</span>
          </button>

          <button
            onClick={() => setCurrentView('reservas')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'reservas'
                ? 'bg-[#5b3ff0] text-white shadow-lg'
                : 'text-[#9a9bd0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Mis Reservas</span>
          </button>

          {/* Slogan */}
          <div className="hidden md:block mt-auto p-4 rounded-xl bg-[#15124a] border border-[#2f2d78] text-[11px] text-[#8b7bff] italic">
            "Tu espacio, tus ideas, nuestro campus."
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* VIEW: SALONES */}
          {currentView === 'salones' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Salones y Aulas de Entrenamiento
                  </h1>
                  <p className="text-[#9a9bd0] text-sm mt-1">
                    Encuentra tu estación gamer ideal y reserva tu horario en Campusland.
                  </p>
                </div>

                {/* Capacity Filter */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#9a9bd0]" />
                  <select
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value)}
                    className="bg-[#15124a] border border-[#2f2d78] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8b7bff]"
                  >
                    <option value="">Todas las capacidades</option>
                    <option value="s">Hasta 20 puestos</option>
                    <option value="m">21 a 40 puestos</option>
                    <option value="l">Más de 40 puestos</option>
                  </select>
                </div>
              </div>

              {/* Grid of Room Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((z) => {
                  const sList = seatsByZone[z.id] || [];
                  const occupied = sList.filter((s) => s.status === 2).length;
                  const free = z.s - occupied;
                  const isRoomReserved = Boolean(roomReservations[z.id]);

                  return (
                    <div
                      key={z.id}
                      className="bg-[#15124a] border border-[#2f2d78] hover:border-[#8b7bff]/70 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
                    >
                      {/* Room Card Header with Color & Badges */}
                      <div className="p-5 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: z.c }}
                            />
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                              {z.n}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1b1860] border border-[#2f2d78] text-purple-200">
                            👥 Cap. {z.s}
                          </span>
                        </div>

                        <p className="text-xs text-[#9a9bd0] mt-2 line-clamp-2">
                          {z.description || 'Ambiente tecnológico Pro'}
                        </p>

                        {/* Specs badges */}
                        {z.specs && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {z.specs.slice(0, 2).map((sp, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats & Actions */}
                      <div className="p-5 pt-3 border-t border-[#2f2d78]/60 bg-[#0d0b2e]/40 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-400">Estado actual:</span>
                          {isRoomReserved ? (
                            <span className="text-purple-300 font-bold flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              Sala Reservada
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              {free} sillas libres
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedZoneId(z.id);
                            setMapSubView('salon_gamer');
                            setCurrentView('mapa');
                          }}
                          className="w-full py-2.5 bg-[#5b3ff0] hover:bg-[#6d5df0] text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                        >
                          <span>Ver Estaciones y Puestos</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: MAPA & SALON GAMER DETAIL */}
          {currentView === 'mapa' && (
            <div className="space-y-4">
              {/* Switch Bar: General Building Blueprint vs Detailed Gamer Classroom */}
              <div className="flex flex-wrap items-center justify-between bg-[#15124a] p-2 rounded-2xl border border-[#2f2d78] gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapSubView('salon_gamer')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      mapSubView === 'salon_gamer'
                        ? 'bg-[#5b3ff0] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🎮 Vista de Salón Gamer ({activeZone.n})
                  </button>

                  <button
                    onClick={() => setMapSubView('mapa_general')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      mapSubView === 'mapa_general'
                        ? 'bg-[#5b3ff0] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🗺️ Plano General del Edificio
                  </button>
                </div>

                {/* Quick Salón Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#9a9bd0] hidden sm:inline">Salón activo:</span>
                  <select
                    value={activeZone.id}
                    onChange={(e) => {
                      setSelectedZoneId(e.target.value);
                      setMapSubView('salon_gamer');
                    }}
                    className="bg-[#1b1860] border border-[#2f2d78] rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
                  >
                    {ZONES.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.n} ({z.s} puestos)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-view Content */}
              {mapSubView === 'salon_gamer' ? (
                <ClassroomGamerView
                  zone={activeZone}
                  seats={seatsByZone[activeZone.id] || []}
                  currentPin={currentUser.pin}
                  currentUser={currentUser}
                  roomReservation={roomReservations[activeZone.id]}
                  onSelectSeat={(seatIndex) => {
                    setBookingModalState({
                      isOpen: true,
                      zoneId: activeZone.id,
                      seatIndex,
                    });
                  }}
                  onFreeMySeat={handleFreeMySeat}
                  onAdminToggleSeat={(seatIndex) => {
                    // Directivo quick toggle or view
                    setBookingModalState({
                      isOpen: true,
                      zoneId: activeZone.id,
                      seatIndex,
                    });
                  }}
                  onReserveFullRoom={() => {
                    setBookingModalState({
                      isOpen: true,
                      zoneId: activeZone.id,
                      seatIndex: 0,
                    });
                  }}
                  onCancelFullRoom={() => {
                    setRoomReservations((prev) => {
                      const next = { ...prev };
                      delete next[activeZone.id];
                      return next;
                    });
                    showToast(`Reserva de sala completa cancelada para ${activeZone.n}.`);
                  }}
                  nowTimeMinutes={currentClock.getHours() * 60 + currentClock.getMinutes()}
                />
              ) : (
                <CampusFloorMap
                  zones={ZONES}
                  seatsByZone={seatsByZone}
                  roomReservations={roomReservations}
                  currentUser={currentUser}
                  onOpenRoom={(zId) => {
                    setSelectedZoneId(zId);
                    setMapSubView('salon_gamer');
                  }}
                  selectedZoneId={selectedZoneId}
                />
              )}
            </div>
          )}

          {/* VIEW: CALENDARIO SEMANAL */}
          {currentView === 'calendario' && (
            <WeeklyCalendarView
              reservations={allReservations}
              currentUser={currentUser}
              zones={ZONES}
              onCancelReservation={handleCancelReservation}
              onGoToRoom={(roomId) => {
                setSelectedZoneId(roomId);
                setMapSubView('salon_gamer');
                setCurrentView('mapa');
              }}
            />
          )}

          {/* VIEW: OCUPACION EN TIEMPO REAL */}
          {currentView === 'ocupacion' && (
            <RealTimeOccupancyPanel
              zones={ZONES}
              seatsByZone={seatsByZone}
              roomReservations={roomReservations}
              onOpenRoom={(zId) => {
                setSelectedZoneId(zId);
                setMapSubView('salon_gamer');
                setCurrentView('mapa');
              }}
              recentActivity={recentActivity}
            />
          )}

          {/* VIEW: MIS RESERVAS */}
          {currentView === 'reservas' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <Bookmark className="w-8 h-8 text-[#8b7bff]" />
                    Historial y Reservas de {currentUser.n}
                  </h1>
                  <p className="text-[#9a9bd0] text-sm mt-1">
                    Control de puestos asignados y salas bloqueadas en Campusland.
                  </p>
                </div>
              </div>

              {/* Active Reservations list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allReservations.filter((r) => r.pin === currentUser.pin).length > 0 ? (
                  allReservations
                    .filter((r) => r.pin === currentUser.pin)
                    .map((res) => (
                      <div
                        key={res.id}
                        className="p-5 bg-[#15124a] border border-[#2f2d78] rounded-2xl shadow-lg flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-bold text-white">{res.roomName}</h3>
                            <span className="text-xs text-[#9a9bd0] font-mono">
                              Fecha: {res.date}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                              res.status === 'activa'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-700/40 text-gray-400 border border-gray-600/30'
                            }`}
                          >
                            {res.status === 'activa' ? 'ACTIVA' : 'FINALIZADA'}
                          </span>
                        </div>

                        <div className="bg-[#1b1860] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <span className="text-gray-300">
                            {res.isFullRoom
                              ? '🔒 Toda la Sala Reservada'
                              : `Silla Asignada: #${(res.seatIndex ?? 0) + 1}`}
                          </span>
                          <span className="font-mono font-bold text-white">
                            {res.startTime} - {res.endTime}
                          </span>
                        </div>

                        {res.status === 'activa' && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                            <button
                              onClick={() => handleCancelReservation(res.id)}
                              className="px-3 py-1.5 text-xs font-bold text-red-300 hover:text-white bg-red-950/50 hover:bg-red-600 rounded-lg transition-all"
                            >
                              Cancelar Reserva
                            </button>
                            <button
                              onClick={() => {
                                setSelectedZoneId(res.roomId);
                                setMapSubView('salon_gamer');
                                setCurrentView('mapa');
                              }}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#5b3ff0] hover:bg-[#6d5df0] rounded-lg transition-all"
                            >
                              Ir al Puesto →
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="col-span-2 py-16 bg-[#15124a] rounded-2xl border border-[#2f2d78] text-center space-y-2">
                    <p className="text-base font-bold text-white">No tienes reservas activas</p>
                    <p className="text-xs text-[#9a9bd0]">
                      Visita la sección de Salones o el Mapa para elegir tu próximo horario de estudio.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Booking Schedule Modal */}
      <BookingModal
        isOpen={bookingModalState.isOpen}
        onClose={() => setBookingModalState((prev) => ({ ...prev, isOpen: false }))}
        zone={ZONES.find((z) => z.id === bookingModalState.zoneId) || ZONES[5]}
        seatIndex={bookingModalState.seatIndex}
        currentUser={currentUser}
        existingReservations={allReservations}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Chibi Avatar Customizer Modal */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        initialConfig={currentUser.avatar}
        onSave={handleSaveAvatar}
        userName={currentUser.n}
      />

      {/* Visual Chibi AI Chatbot (Capi) */}
      <CampusChatbot
        zones={ZONES}
        seatsByZone={seatsByZone}
        roomReservations={roomReservations}
        currentUser={currentUser}
        onNavigateToRoom={(roomId) => {
          setSelectedZoneId(roomId);
          setMapSubView('salon_gamer');
          setCurrentView('mapa');
        }}
        onNavigateToView={(view) => {
          setCurrentView(view);
        }}
        onOpenBooking={(roomId, seatIndex = 0) => {
          setBookingModalState({
            isOpen: true,
            zoneId: roomId,
            seatIndex,
          });
        }}
      />

      {/* Backend Architecture & Status Inspector Modal */}
      <BackendStatusModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        health={backendHealth}
        isConnected={isBackendConnected}
      />
    </div>
  );
}
