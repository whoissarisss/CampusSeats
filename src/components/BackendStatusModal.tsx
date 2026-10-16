import React from 'react';
import { BackendHealth } from '../services/api';
import { X, Server, Database, Clock, ShieldCheck, Cpu, Activity, CheckCircle2, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  health: BackendHealth | null;
  isConnected: boolean;
}

export const BackendStatusModal: React.FC<Props> = ({ isOpen, onClose, health, isConnected }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#15124a] border border-[#2f2d78] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1b1860] border-b border-[#2f2d78] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Arquitectura y Estado del Backend
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isConnected ? 'En Línea' : 'Reconectando'}
                </span>
              </h3>
              <p className="text-xs text-[#9a9bd0]">
                Servidor Express en Node.js + Base de Datos Persistente + Sincronización SSE en Vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-300">
          {/* Status KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#0d0b2e] border border-[#2f2d78] rounded-2xl">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Servidor</span>
              </div>
              <div className="text-sm font-black text-white">Express 4.21</div>
              <div className="text-[10px] text-[#9a9bd0]">Puerto 3000 / tsx</div>
            </div>

            <div className="p-3 bg-[#0d0b2e] border border-[#2f2d78] rounded-2xl">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                <Database className="w-3.5 h-3.5" />
                <span>Persistencia</span>
              </div>
              <div className="text-sm font-black text-white">campus_data.json</div>
              <div className="text-[10px] text-[#9a9bd0]">File Store + In-Memory</div>
            </div>

            <div className="p-3 bg-[#0d0b2e] border border-[#2f2d78] rounded-2xl">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Ticker Expiración</span>
              </div>
              <div className="text-sm font-black text-white">1000ms</div>
              <div className="text-[10px] text-[#9a9bd0]">Auto-desocupación</div>
            </div>

            <div className="p-3 bg-[#0d0b2e] border border-[#2f2d78] rounded-2xl">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Uptime</span>
              </div>
              <div className="text-sm font-black text-white">
                {health?.uptimeSeconds ? `${health.uptimeSeconds}s` : 'Activo'}
              </div>
              <div className="text-[10px] text-[#9a9bd0]">Tiempo de actividad</div>
            </div>
          </div>

          {/* Engine Features */}
          <div className="p-4 bg-[#0d0b2e] border border-[#2f2d78] rounded-2xl space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Reglas de Negocio Implementadas en el Backend
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">1 puesto por campuser:</strong> Validación estricta para evitar dobles reservas simultáneas.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Límite de 1 semana:</strong> Impide reservas con más de 7 días de anticipación.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Desocupación automática:</strong> El proceso backend en segundo plano libera los puestos vencidos.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Privilegio Directivo:</strong> Permite a directores reservar salas completas (Auditorio, Apolo, etc.).
                </span>
              </div>
            </div>
          </div>

          {/* Official Room Capacities List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Distribución Oficial de Puestos (Total: 277)
              </h4>
              <span className="text-[11px] text-purple-300 font-mono">9 Salones Oficiales</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {[
                { name: 'Auditorio', cap: 100, color: 'text-purple-400' },
                { name: 'Spooki', cap: 38, color: 'text-teal-400' },
                { name: 'Apolo', cap: 34, color: 'text-blue-400' },
                { name: 'Artemis', cap: 32, color: 'text-pink-400' },
                { name: 'Cosmos', cap: 25, color: 'text-red-400' },
                { name: 'Skilab', cap: 20, color: 'text-amber-400' },
                { name: 'Blanca', cap: 12, color: 'text-orange-400' },
                { name: 'Azul', cap: 10, color: 'text-cyan-400' },
                { name: 'Amarillas verdes', cap: 6, color: 'text-yellow-400' },
              ].map((r) => (
                <div key={r.name} className="p-2 bg-[#0d0b2e]/60 border border-[#2f2d78] rounded-xl flex items-center justify-between">
                  <span className="font-medium text-white truncate mr-1">{r.name}</span>
                  <span className={`font-mono font-bold ${r.color}`}>{r.cap} p.</span>
                </div>
              ))}
            </div>
          </div>

          {/* REST API Endpoints List */}
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              Endpoints REST Disponibles
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 bg-[#0d0b2e] rounded-xl border border-[#2f2d78]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">GET</span>
                  <span className="text-white">/api/state</span>
                </div>
                <span className="text-[#9a9bd0] font-sans text-[10px]">Snapshot completo de salones y ocupación</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d0b2e] rounded-xl border border-[#2f2d78]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">GET</span>
                  <span className="text-white">/api/events</span>
                </div>
                <span className="text-[#9a9bd0] font-sans text-[10px]">Server-Sent Events (SSE) para sync en vivo</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d0b2e] rounded-xl border border-[#2f2d78]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">POST</span>
                  <span className="text-white">/api/book</span>
                </div>
                <span className="text-[#9a9bd0] font-sans text-[10px]">Reserva validada con desocupación programada</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d0b2e] rounded-xl border border-[#2f2d78]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">POST</span>
                  <span className="text-white">/api/free-seat</span>
                </div>
                <span className="text-[#9a9bd0] font-sans text-[10px]">Liberación inmediata del puesto activo</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d0b2e] rounded-xl border border-[#2f2d78]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">POST</span>
                  <span className="text-white">/api/chat</span>
                </div>
                <span className="text-[#9a9bd0] font-sans text-[10px]">Gemini 3.8 Flash conectado a ocupación real</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#1b1860] border-t border-[#2f2d78] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5b3ff0] hover:bg-[#6d5df0] font-bold text-xs text-white transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
