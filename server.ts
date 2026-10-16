import { GoogleGenAI } from '@google/genai';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { campusDB } from './server/db.ts';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini AI client if key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // --- REST API ENDPOINTS ---

  // 1. Health check & backend status
  app.get('/api/health', (_req, res) => {
    const state = campusDB.getFullState();
    res.json({
      status: 'ok',
      service: 'Campusland Real-Time Engine',
      version: '2.0.0',
      database: 'persistent (campus_data.json)',
      autoReleaseEngine: 'active (1000ms ticker)',
      uptimeSeconds: Math.round(process.uptime()),
      stats: state.stats,
    });
  });

  // 2. Full State (zones, seats, reservations, stats, activity)
  app.get('/api/state', (_req, res) => {
    try {
      const state = campusDB.getFullState();
      res.json({ success: true, ...state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Server-Sent Events (SSE) for live multi-client synchronization
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    const initialData = JSON.stringify(campusDB.getFullState());
    res.write(`data: ${initialData}\n\n`);

    // Subscribe to database changes
    const unsubscribe = campusDB.onStateChange((state) => {
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // 4. Login by PIN (with auto-registration if new)
  app.post('/api/login', (req, res) => {
    try {
      const { pin, name } = req.body;
      if (!pin || typeof pin !== 'string') {
        res.status(400).json({ success: false, message: 'PIN requerido' });
        return;
      }

      const cleanPin = pin.trim();
      const user = campusDB.loginOrRegister(cleanPin, name);
      const state = campusDB.getFullState();

      // Find user active reservations
      const userReservations = state.reservations.filter((r) => r.pin === cleanPin);

      res.json({
        success: true,
        user,
        reservations: userReservations,
        state,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Update user avatar
  app.post('/api/avatar', (req, res) => {
    try {
      const { pin, avatar } = req.body;
      if (!pin || !avatar) {
        res.status(400).json({ success: false, message: 'PIN y avatar requeridos' });
        return;
      }

      const ok = campusDB.updateAvatar(pin, avatar);
      if (!ok) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        return;
      }

      res.json({ success: true, avatar, state: campusDB.getFullState() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Book seat or entire room
  app.post('/api/book', (req, res) => {
    try {
      const { pin, roomId, seatIndex, date, startTime, endTime, durationMinutes, isFullRoom } = req.body;

      if (!pin || !roomId || !date || !startTime || !endTime) {
        res.status(400).json({ success: false, message: 'Campos requeridos incompletos' });
        return;
      }

      const result = campusDB.bookReservation({
        pin,
        roomId,
        seatIndex: Number(seatIndex),
        date,
        startTime,
        endTime,
        durationMinutes: Number(durationMinutes) || 60,
        isFullRoom: Boolean(isFullRoom),
      });

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
        return;
      }

      res.json({
        success: true,
        reservation: result.reservation,
        state: campusDB.getFullState(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Cancel a reservation
  app.post('/api/cancel', (req, res) => {
    try {
      const { reservationId, pin } = req.body;
      if (!reservationId || !pin) {
        res.status(400).json({ success: false, message: 'ID de reserva y PIN requeridos' });
        return;
      }

      const success = campusDB.cancelReservation(reservationId, pin);
      if (!success) {
        res.status(400).json({ success: false, message: 'No se pudo cancelar la reserva (sin permisos o no encontrada)' });
        return;
      }

      res.json({ success: true, state: campusDB.getFullState() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. Free active user seat immediately
  app.post('/api/free-seat', (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        res.status(400).json({ success: false, message: 'PIN requerido' });
        return;
      }

      const freedCount = campusDB.freeUserActiveSeat(pin);
      res.json({ success: true, freedCount, state: campusDB.getFullState() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 9. Admin cancel room reservation
  app.post('/api/admin/cancel-room', (req, res) => {
    try {
      const { roomId, pin } = req.body;
      const user = campusDB.getUserByPin(pin);
      if (!user || user.r !== 'directivo') {
        res.status(403).json({ success: false, message: 'Permiso denegado: solo directivos' });
        return;
      }

      const ok = campusDB.adminCancelRoomReservation(roomId);
      res.json({ success: ok, state: campusDB.getFullState() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 10. AI Chatbot endpoint with live campus state grounding
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Mensaje requerido' });
        return;
      }

      const liveState = campusDB.getFullState();
      const liveOccupancySummary = `
DATOS EN TIEMPO REAL DEL CAMPUS (Directo del Backend):
- Capacidad Total: ${liveState.stats.totalCapacity} puestos
- Ocupados Ahora: ${liveState.stats.totalOccupied} puestos (${liveState.stats.occupancyPercent}% de ocupación)
- Libres Ahora: ${liveState.stats.totalFree} puestos
- Estado por Salón:
${liveState.stats.roomBreakdown.map((r) => `  * ${r.name}: ${r.capacity} puestos (${r.occupied} ocupados, ${r.capacity - r.occupied} libres)${r.isFullReserved ? ' [SALA COMPLETA RESERVADA POR DIRECTIVO]' : ''}`).join('\n')}
`;

      const SYSTEM_INSTRUCTION = `
Eres Capi (o Astro), el asistente virtual oficial en versión chibi de Campusland.
Tu personalidad:
- Eres entusiasta, amigable, tecnológico y muy servicial ("campuser de corazón").
- Vistes la sudadera morada oficial con el logo del casco espacial de Campusland.
- Conoces perfectamente el campus, sus 9 salones (Artemis, Apolo, Spooki, Cosmos, Skilab, Auditorio, Blanca, Azul, Amarillas verdes), las reglas de ocupación y los horarios.

Capacidades oficiales de los salones de Campusland (Total: 277 puestos):
- Auditorio: 100 puestos
- Cosmos: 25 puestos
- Skilab: 20 puestos
- Spooki: 38 puestos
- Apolo: 34 puestos
- Blanca: 12 puestos
- Azul: 10 puestos
- Amarillas verdes: 6 puestos
- Artemis: 32 puestos

${liveOccupancySummary}

Reglas clave del campus que debes explicar con claridad:
1. Puestos y límites: Un campuser solo puede tener 1 puesto activo a la vez por rango de tiempo.
2. Política de 1 semana: No se pueden realizar reservas con más de 7 días de anticipación.
3. Desocupación automática: Cuando el tiempo elegido finaliza, el puesto se desocupa automáticamente por el sistema backend para que otro campuser pueda usarlo.
4. Puestos asignados a otros: Están protegidos y bloqueados con candado rojo. Nadie puede cambiarlos ni quitárselos.
5. Alerta de 5 minutos: El sistema avisa 5 minutos antes con sonido y notificación en pantalla para que el campuser guarde sus proyectos y deje el puesto limpio.
6. Administradores/Directivos: Tienen la potestad de reservar una sala entera para eventos o talleres.

Formato de respuestas:
- Sé conciso, visual y estructurado (usa viñetas y emojis temáticos como 🪐, 🎮, ⏰, 📅, 🔒, 🟢).
- Si te preguntan por ocupación en vivo, utiliza los datos reales de arriba.
- Responde siempre en español.
`;

      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Historial de conversación reciente: ${JSON.stringify(history || [])}\n\nPregunta del usuario: ${message}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        const reply = response.text || '¡Hola campuser! ¿En qué puedo ayudarte hoy en Campusland?';
        res.json({ reply });
        return;
      }

      // If no API key is provided, return null so client triggers smart local knowledge
      res.json({ reply: null, fallback: true });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      res.json({ reply: null, fallback: true, error: err.message });
    }
  });

  // Mount Vite middleware for client-side development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campusland server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
