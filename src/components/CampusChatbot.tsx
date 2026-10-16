import React, { useState, useEffect, useRef } from 'react';
import { Zone, SeatState, RoomReservation, User } from '../types';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  HelpCircle,
  Clock,
  Calendar,
  Lock,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface Props {
  zones: Zone[];
  seatsByZone: Record<string, SeatState[]>;
  roomReservations: Record<string, RoomReservation>;
  currentUser: User | null;
  onNavigateToRoom: (roomId: string) => void;
  onNavigateToView: (view: 'salones' | 'mapa' | 'calendario' | 'ocupacion' | 'reservas') => void;
  onOpenBooking: (roomId: string, seatIndex?: number) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  avatarState?: 'idle' | 'happy' | 'thinking' | 'explaining';
  suggestedCards?: {
    type: 'room_card' | 'rule_card' | 'occupancy_card';
    data?: any;
  }[];
  quickReplies?: string[];
}

export const CampusChatbot: React.FC<Props> = ({
  zones,
  seatsByZone,
  roomReservations,
  currentUser,
  onNavigateToRoom,
  onNavigateToView,
  onOpenBooking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botMood, setBotMood] = useState<'idle' | 'happy' | 'thinking' | 'explaining'>('idle');
  const [showFloatingHint, setShowFloatingHint] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `¡Hola ${currentUser ? currentUser.n.split(' ')[0] : 'Campuser'}! 🪐 Soy **Capi**, tu guía y asistente virtual oficial de Campusland.\n\n¿En qué puedo ayudarte hoy? Pregúntame sobre disponibilidad de salones, cómo reservar puestos, el aviso de 5 minutos o la ocupación en vivo.`,
      time: 'Ahora',
      avatarState: 'happy',
      quickReplies: [
        '🎮 ¿Qué salones tienen puestos libres?',
        '⏰ ¿Cómo funciona el aviso de 5 minutos?',
        '📅 ¿Puedo reservar para mañana?',
        '🔒 ¿Por qué no puedo cambiar una silla ocupada?',
        '👥 ¿Cómo reservar una sala completa?',
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowFloatingHint(false);
    }
  }, [messages, isOpen]);

  // Voice speech synthesis helper
  const speakText = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown tags
      const clean = text.replace(/[*_#`]/g, '').slice(0, 180);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Smart local campus knowledge responder when offline or as instant rich fallback
  const getSmartLocalResponse = (query: string): { text: string; cards?: any[]; mood: 'happy' | 'explaining' } => {
    const q = query.toLowerCase();

    // 1. Room inquiries (Artemis, Apolo, Spooki, Cosmos, etc.)
    const matchedZone = zones.find(
      (z) => q.includes(z.n.toLowerCase()) || q.includes(z.id.toLowerCase())
    );

    if (matchedZone) {
      const sList = seatsByZone[matchedZone.id] || [];
      const occupied = sList.filter((s) => s.status === 2).length;
      const free = matchedZone.s - occupied;
      const isReserved = Boolean(roomReservations[matchedZone.id]);

      return {
        text: `El salón **${matchedZone.n}** cuenta con **${matchedZone.s} estaciones Pro** de entrenamiento intensivo.\n\n` +
          `• **Estado actual:** ${isReserved ? '🔒 Sala completa reservada para evento' : `🟢 ${free} puestos disponibles (${occupied} ocupados)`}\n` +
          `• **Equipamiento:** ${matchedZone.specs?.join(', ') || 'Pantallas duales, PC Gamer, lockers'}\n\n` +
          `Puedes abrir la vista de salón para elegir tu silla en el horario deseado:`,
        cards: [
          {
            type: 'room_card',
            data: { zone: matchedZone, free, occupied, isReserved },
          },
        ],
        mood: 'happy',
      };
    }

    // 2. 5-minute pre-expiration notification
    if (q.includes('5 min') || q.includes('aviso') || q.includes('notificacion') || q.includes('alerta') || q.includes('termina')) {
      return {
        text: `⏰ **Aviso de 5 minutos antes de finalizar:**\n\n` +
          `• Cuando a tu turno le resten exactamente **5 minutos**, el sistema activa una alerta visual destacada en la parte superior y un sonido de campana suave.\n` +
          `• Esto te da tiempo suficiente para guardar tus commits en Git, cerrar sesión y dejar la estación limpia para el siguiente campuser.\n` +
          `• Cuando el cronómetro llegue a 00:00, el puesto se **desocupará automáticamente** en el mapa en tiempo real.`,
        cards: [{ type: 'rule_card', data: { rule: 'timer' } }],
        mood: 'explaining',
      };
    }

    // 3. One seat per user rule
    if (q.includes('1 puesto') || q.includes('un puesto') || q.includes('cambiar') || q.includes('silla ocupada') || q.includes('bloqueada') || q.includes('candado')) {
      return {
        text: `🔒 **Protección y Regla de Puestos en Campusland:**\n\n` +
          `• **Puestos Ocupados (Rojos):** Si una silla ya fue asignada a otro estudiante, queda **bloqueada** y nadie más puede tomarla ni cambiarla durante su horario.\n` +
          `• **Límite de 1 puesto:** Cada campuser puede tener reservada **1 sola silla por intervalo de horario**. Si intentas apartar dos puestos a la misma hora, el sistema protegerá la equidad del campus y te pedirá liberar el primero.\n` +
          `• Al terminar el horario elegido, la silla vuelve a ponerse verde (libre) automáticamente.`,
        cards: [{ type: 'rule_card', data: { rule: 'single_seat' } }],
        mood: 'explaining',
      };
    }

    // 4. One week calendar limitation
    if (q.includes('semana') || q.includes('calendario') || q.includes('dias') || q.includes('anticipacion') || q.includes('mañana')) {
      return {
        text: `📅 **Política de Reservas (Máximo 7 días):**\n\n` +
          `• Puedes agendar tu puesto desde hoy hasta un plazo máximo de **una semana (7 días continuos)**.\n` +
          `• El calendario te muestra tus puestos activos día por día en la pestaña **Calendario (7d)**.\n` +
          `• No se permite agendar a más de una semana para evitar puestos fantasmas y asegurar que todos tengan oportunidad de estudiar.`,
        cards: [{ type: 'rule_card', data: { rule: 'calendar' } }],
        mood: 'happy',
      };
    }

    // 5. Full room booking (directivos/administradores)
    if (q.includes('sala completa') || q.includes('sala entera') || q.includes('directivo') || q.includes('administrador') || q.includes('evento')) {
      return {
        text: `👥 **Reserva de Sala Completa:**\n\n` +
          `• Los usuarios con rol de **Directivo o Coordinador** (como Laura Gómez o Carlos Rojas) tienen permiso especial para reservar una **sala entera** con un solo clic.\n` +
          `• Esto bloquea todas las sillas de esa aula para workshops, capacitaciones o mantenimiento institucional.\n` +
          `• En cualquier momento, el directivo puede liberar la sala completa o cancelar la reserva.`,
        cards: [{ type: 'rule_card', data: { rule: 'admin' } }],
        mood: 'explaining',
      };
    }

    // 6. Occupancy overview
    if (q.includes('ocupacion') || q.includes('libre') || q.includes('aforo') || q.includes('cuantos') || q.includes('disponible')) {
      let totalCap = 0;
      let totalOcc = 0;
      zones.forEach((z) => {
        totalCap += z.s;
        const sList = seatsByZone[z.id] || [];
        totalOcc += sList.filter((s) => s.status === 2).length;
      });
      const totalFree = totalCap - totalOcc;
      const pct = Math.round((totalOcc / totalCap) * 100);

      return {
        text: `📊 **Ocupación en Tiempo Real en Campusland:**\n\n` +
          `• Aforo general: **${pct}%** (${totalOcc} puestos en uso de ${totalCap} totales).\n` +
          `• Puestos libres ahora mismo: **${totalFree} sillas disponibles**.\n` +
          `• Salones más activos: **Artemis** y **Apolo**.\n\n` +
          `Puedes abrir el panel de Ocupación para ver los gráficos interactivos:`,
        cards: [{ type: 'occupancy_card', data: { totalCap, totalOcc, totalFree, pct } }],
        mood: 'happy',
      };
    }

    // Default friendly response
    return {
      text: `¡Claro que sí! 🪐 En Campusland puedes reservar tus puestos en los 9 salones (Artemis, Apolo, Spooki, Cosmos, Skilab, Auditorio, Blanca, Azul y Amarillas verdes).\n\n` +
        `Recuerda que cuentas con:\n` +
        `• 🟢 **Sillas verdes:** Libres para agendar hasta por 8 horas.\n` +
        `• 🔴 **Sillas rojas:** Puestos ocupados que se liberan automáticamente cuando vence el turno.\n` +
        `• 🟡 **Sillas doradas:** Tu puesto asignado donde verás sentado a tu **Avatar Chibi**.\n` +
        `• ⏰ **Alerta previa de 5 minutos** para avisarte antes de que concluya tu horario.`,
      mood: 'happy',
    };
  };

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setBotMood('thinking');
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      // 1. Try server-side Gemini API route first
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      const data = await res.json();

      if (data && data.reply) {
        // Successful response from Gemini
        const botReply: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatarState: 'happy',
          quickReplies: [
            '🎮 Ver salones disponibles',
            '🗺️ Ver mapa en vivo',
            '⏰ ¿Cómo funciona el aviso de 5 min?',
            '📊 Ocupación en tiempo real',
          ],
        };
        setMessages((prev) => [...prev, botReply]);
        setBotMood('happy');
        speakText(data.reply);
      } else {
        // Trigger smart local knowledge engine with rich cards
        const local = getSmartLocalResponse(text);
        const botReply: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: local.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatarState: local.mood,
          suggestedCards: local.cards,
          quickReplies: [
            '🎮 Ver puestos de Artemis',
            '🗺️ Ver mapa general',
            '📅 Calendario de la semana',
            '📊 Panel de aforo en vivo',
          ],
        };
        setMessages((prev) => [...prev, botReply]);
        setBotMood(local.mood);
        speakText(local.text);
      }
    } catch (err) {
      // Local fallback on any network error
      const local = getSmartLocalResponse(text);
      const botReply: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: local.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatarState: local.mood,
        suggestedCards: local.cards,
      };
      setMessages((prev) => [...prev, botReply]);
      setBotMood('happy');
    } finally {
      setIsLoading(false);
      setTimeout(() => setBotMood('idle'), 4000);
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (BOTTOM RIGHT) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 animate-in slide-in-from-bottom duration-300">
          {/* Speech balloon hint */}
          {showFloatingHint && (
            <div className="bg-[#15124a] border border-[#5b3ff0]/60 text-white text-xs px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md max-w-xs flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                ¡Hola! Soy <b>Capi</b> 🪐 ¿Dudas sobre salones o tu puesto?
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFloatingHint(false);
                }}
                className="text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Floating Avatar Button with Chibi Artwork */}
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 p-2 bg-gradient-to-r from-[#4c1d95] via-[#5b3ff0] to-[#8b7bff] hover:scale-105 active:scale-95 text-white rounded-full shadow-[0_0_25px_rgba(91,63,240,0.6)] border-2 border-white/20 transition-all duration-300"
            title="Abrir Asistente Virtual Capi"
          >
            {/* Chibi Icon Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0d0b2e] border-2 border-yellow-300 shadow flex items-center justify-center">
              <svg viewBox="0 0 120 135" className="w-12 h-12 scale-125 translate-y-1">
                {/* Simplified Astro chibi face */}
                <ellipse cx="60" cy="50" rx="34" ry="34" fill="#f7d0b3" />
                <path d="M26 40 C23 15 42 4 60 4 C80 4 97 15 94 40 C93 42 85 30 74 25 C68 36 58 46 58 24 C52 34 40 46 38 24 Z" fill="#18181b" />
                <ellipse cx="45" cy="48" rx="6.5" ry="8" fill="#0f172a" />
                <circle cx="43" cy="45" r="2.2" fill="#fff" />
                <ellipse cx="75" cy="48" rx="6.5" ry="8" fill="#0f172a" />
                <circle cx="73" cy="45" r="2.2" fill="#fff" />
                <path d="M56 58 Q60 62 64 58" stroke="#18181b" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Purple hoodie collar */}
                <path d="M28 85 C35 75 85 75 92 85 L92 120 L28 120 Z" fill="#4c1d95" />
                <circle cx="60" cy="98" r="6" stroke="#fff" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            <span className="hidden sm:inline font-extrabold text-xs pr-2 tracking-wide">
              Preguntar a Capi ✨
            </span>

            {/* Pulsing online badge */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0d0b2e] rounded-full animate-pulse" />
          </button>
        </div>
      )}

      {/* CHAT WINDOW MODAL */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-[#15124a]/95 border border-[#4c1d95] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[430px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Visual Header with Animated Chibi Avatar */}
          <div className="bg-gradient-to-r from-[#1e144a] via-[#311a75] to-[#1e144a] p-4 border-b border-[#3b2b85] flex items-center justify-between relative overflow-hidden">
            {/* Ambient light glow */}
            <div className="absolute -left-6 -top-6 w-32 h-32 bg-[#8b7bff]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              {/* Dynamic Animated Avatar Frame */}
              <div className="relative w-12 h-12 rounded-2xl bg-[#0d0b2e] border-2 border-[#8b7bff] shadow-lg flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 120 135"
                  className={`w-12 h-12 transition-transform duration-300 ${
                    botMood === 'thinking'
                      ? 'animate-pulse'
                      : botMood === 'happy'
                      ? 'scale-110'
                      : ''
                  }`}
                >
                  <ellipse cx="60" cy="50" rx="34" ry="34" fill="#f7d0b3" />
                  <path
                    d="M26 40 C23 15 42 4 60 4 C80 4 97 15 94 40 C93 42 85 30 74 25 C68 36 58 46 58 24 C52 34 40 46 38 24 Z"
                    fill="#18181b"
                  />
                  <ellipse cx="45" cy="48" rx="6.5" ry="8" fill="#0f172a" />
                  <circle cx="43" cy="45" r="2.2" fill="#fff" />
                  <ellipse cx="75" cy="48" rx="6.5" ry="8" fill="#0f172a" />
                  <circle cx="73" cy="45" r="2.2" fill="#fff" />
                  {botMood === 'happy' ? (
                    <path d="M55 58 Q60 64 65 58" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  ) : (
                    <path d="M56 59 L64 59" stroke="#18181b" strokeWidth="2" strokeLinecap="round" fill="none" />
                  )}
                  <ellipse cx="38" cy="54" rx="4" ry="2" fill="#fb7185" opacity="0.6" />
                  <ellipse cx="82" cy="54" rx="4" ry="2" fill="#fb7185" opacity="0.6" />
                  <path d="M28 85 C35 75 85 75 92 85 L92 120 L28 120 Z" fill="#4c1d95" />
                  <circle cx="60" cy="98" r="6" stroke="#fff" strokeWidth="1.5" fill="none" />
                </svg>

                {/* Mood sparkles */}
                <span className="absolute -top-1 -right-1 text-[10px]">✨</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white tracking-wide">Capi Chibi</h3>
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 bg-[#5b3ff0] text-purple-200 rounded border border-purple-400/30">
                    Asistente Campus
                  </span>
                </div>
                <p className="text-[11px] text-[#9a9bd0] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {botMood === 'thinking' ? 'Consultando Campusland...' : 'En línea · Conoce todos los salones'}
                </p>
              </div>
            </div>

            {/* Actions: Voice toggle, Expand, Close */}
            <div className="flex items-center gap-1 text-gray-300 relative z-10">
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                title={isVoiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                className={`p-1.5 rounded-lg transition-colors ${
                  isVoiceEnabled ? 'bg-purple-600 text-white' : 'hover:bg-white/10'
                }`}
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar'}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar chat"
                className="p-1.5 hover:bg-red-500/30 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0d0b2e]/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-[#5b3ff0] text-white rounded-br-none'
                      : 'bg-[#1b1860] border border-[#2f2d78] text-[#eceaff] rounded-bl-none'
                  }`}
                >
                  {/* Text with simple markdown bullet points support */}
                  <div className="space-y-1.5 whitespace-pre-line">
                    {msg.text}
                  </div>

                  {/* VISUAL CARDS EMBEDDED IN CHAT */}
                  {msg.suggestedCards && msg.suggestedCards.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {msg.suggestedCards.map((card, cIdx) => {
                        if (card.type === 'room_card') {
                          const z = card.data.zone as Zone;
                          return (
                            <div
                              key={cIdx}
                              className="p-3 bg-[#0d0b2e] border border-[#8b7bff]/50 rounded-xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-3.5 h-3.5 rounded-full shrink-0"
                                  style={{ backgroundColor: z.c }}
                                />
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{z.n}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                      {card.data.free} libres
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    Capacidad: {z.s} puestos
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  onNavigateToRoom(z.id);
                                  onNavigateToView('mapa');
                                }}
                                className="px-3 py-1.5 bg-[#5b3ff0] hover:bg-[#6d5df0] text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow"
                              >
                                <span>Ver Sala</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        }

                        if (card.type === 'rule_card') {
                          return (
                            <div
                              key={cIdx}
                              className="p-3 bg-gradient-to-r from-purple-950/60 to-[#0d0b2e] border border-purple-500/40 rounded-xl text-xs space-y-1"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                                <ShieldCheck className="w-4 h-4 text-purple-400" />
                                <span>Norma Institucional Campusland</span>
                              </div>
                              <p className="text-[11px] text-gray-300">
                                Los puestos son intransferibles durante el turno y se desocupan automáticamente por reloj.
                              </p>
                            </div>
                          );
                        }

                        if (card.type === 'occupancy_card') {
                          const occ = card.data;
                          return (
                            <div
                              key={cIdx}
                              className="p-3 bg-[#0d0b2e] border border-[#2f2d78] rounded-xl text-xs space-y-2"
                            >
                              <div className="flex justify-between font-bold">
                                <span>Ocupación Global</span>
                                <span className="text-purple-300 font-mono">{occ.pct}%</span>
                              </div>
                              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-purple-500"
                                  style={{ width: `${occ.pct}%` }}
                                />
                              </div>
                              <button
                                onClick={() => onNavigateToView('ocupacion')}
                                className="w-full py-1 text-center font-bold text-purple-300 hover:text-white bg-purple-900/30 rounded-lg text-[11px] transition-colors"
                              >
                                Abrir Monitor de Aforo →
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 mt-1 text-right">{msg.time}</div>
                </div>

                {/* Quick Reply Chips on latest message */}
                {msg.quickReplies && msg.id === messages[messages.length - 1].id && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.quickReplies.map((qr, qrIdx) => (
                      <button
                        key={qrIdx}
                        onClick={() => handleSendMessage(qr)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-[#1b1860] hover:bg-[#23207d] text-purple-200 border border-[#2f2d78] hover:border-[#8b7bff] rounded-full transition-all"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading Animation */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-purple-300 bg-[#1b1860] border border-[#2f2d78] px-3.5 py-2.5 rounded-2xl rounded-bl-none w-max animate-pulse">
                <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                <span>Capi está pensando...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Drawer Bar */}
          <div className="px-4 py-2 bg-[#0d0b2e] border-t border-[#2f2d78] flex items-center gap-2 overflow-x-auto text-[11px] text-gray-400 whitespace-nowrap">
            <span className="font-bold text-purple-400 shrink-0">💡 Sugeridos:</span>
            <button
              onClick={() => handleSendMessage('¿Cómo funciona el aviso de 5 minutos?')}
              className="hover:text-white hover:underline shrink-0"
            >
              Aviso 5 min
            </button>
            <span>•</span>
            <button
              onClick={() => handleSendMessage('¿Qué puestos hay en Artemis?')}
              className="hover:text-white hover:underline shrink-0"
            >
              Puestos Artemis
            </button>
            <span>•</span>
            <button
              onClick={() => handleSendMessage('¿Por qué no puedo reservar más de 1 semana?')}
              className="hover:text-white hover:underline shrink-0"
            >
              Límite 1 semana
            </button>
            <span>•</span>
            <button
              onClick={() => handleSendMessage('¿Cómo se reserva una sala completa?')}
              className="hover:text-white hover:underline shrink-0"
            >
              Sala completa
            </button>
          </div>

          {/* Input Footer Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#15124a] border-t border-[#2f2d78] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Hazle una pregunta a Capi sobre el campus..."
              className="flex-1 bg-[#1b1860] border border-[#2f2d78] focus:border-[#8b7bff] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-400 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-[#5b3ff0] hover:bg-[#6d5df0] disabled:opacity-50 text-white rounded-xl shadow transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
