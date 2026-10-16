import React, { useState } from 'react';
import { AvatarConfig } from '../types';
import { AvatarChibi } from './AvatarChibi';
import { X, Check, Sparkles, User, Palette, Shirt, Glasses, Shuffle } from 'lucide-react';

interface Props {
  initialConfig?: AvatarConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: AvatarConfig) => void;
  userName: string;
}

const SKIN_TONES = [
  { name: 'Porcelana', hex: '#ffe0bd' },
  { name: 'Cálido', hex: '#f7d0b3' },
  { name: 'Trigueño', hex: '#e8b998' },
  { name: 'Moreno', hex: '#ba8564' },
  { name: 'Ébano', hex: '#875338' },
];

const HAIR_COLORS = [
  { name: 'Negro Azabache', hex: '#18181b' },
  { name: 'Castaño Oscuro', hex: '#3f2e24' },
  { name: 'Morado Cyber', hex: '#4c1d95' },
  { name: 'Azul Noche', hex: '#1e3a8a' },
  { name: 'Rubio Cenizo', hex: '#d97706' },
  { name: 'Rosa Pastel', hex: '#f43f5e' },
];

const HOODIE_COLORS = [
  { name: 'Campuslands Original', hex: '#4c1d95' },
  { name: 'Espacio Profundo', hex: '#311042' },
  { name: 'Tech Navy', hex: '#1e1b4b' },
  { name: 'Stealth Black', hex: '#18181b' },
  { name: 'Teal Hacker', hex: '#0f766e' },
  { name: 'Crimson Gamer', hex: '#881337' },
];

export const AvatarCustomizerModal: React.FC<Props> = ({
  initialConfig,
  isOpen,
  onClose,
  onSave,
  userName,
}) => {
  const [config, setConfig] = useState<AvatarConfig>(
    initialConfig || {
      gender: 'femenino',
      skinColor: '#ffe0bd',
      hairStyle: 'largo_liso',
      hairColor: '#1e1b2e',
      hoodieColor: '#4c1d95',
      eyeStyle: 'anime_sparkle',
      accessory: 'ninguno',
      expression: 'sonrisa',
    }
  );

  const [activeTab, setActiveTab] = useState<'base' | 'pelo' | 'ropa' | 'accesorios'>('base');

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randomHair = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randomHoodie = HOODIE_COLORS[Math.floor(Math.random() * HOODIE_COLORS.length)].hex;
    const styles = ['largo_liso', 'corto_despeinado', 'corto_moderno', 'coleta'];
    const accs = ['ninguno', 'audifonos', 'gafas', 'credencial', 'mochila'];
    const exprs = ['sonrisa', 'concentrado', 'guiño'];

    setConfig({
      gender: Math.random() > 0.5 ? 'femenino' : 'masculino',
      skinColor: randomSkin,
      hairStyle: styles[Math.floor(Math.random() * styles.length)],
      hairColor: randomHair,
      hoodieColor: randomHoodie,
      eyeStyle: Math.random() > 0.5 ? 'anime_sparkle' : 'anime_dark',
      accessory: accs[Math.floor(Math.random() * accs.length)],
      expression: exprs[Math.floor(Math.random() * exprs.length)],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#15124a] border border-[#2f2d78] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f2d78] bg-[#0d0b2e]/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8b7bff]" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Personalizar Avatar Chibi
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Left: Chibi Live Showcase */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#1b1860] to-[#0d0b2e] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#2f2d78]">
            <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 shadow-inner flex flex-col items-center">
              {/* Radial backdrop halo */}
              <div
                className="absolute inset-0 rounded-2xl opacity-20 filter blur-xl"
                style={{ backgroundColor: config.hoodieColor }}
              />

              <AvatarChibi config={config} size="xl" isAnimated />

              <div className="mt-4 text-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-500/30">
                  {config.gender === 'femenino' ? 'Chibi Femenino' : 'Chibi Masculino'}
                </span>
                <p className="mt-1.5 text-sm font-bold text-white">{userName}</p>
                <p className="text-xs text-[#9a9bd0]">Logo oficial Campuslands</p>
              </div>
            </div>

            <button
              onClick={handleRandomize}
              type="button"
              className="mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-[#2f2d78]/70 hover:bg-[#2f2d78] text-purple-200 rounded-lg border border-purple-400/20 transition-all hover:scale-105"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Combinación Aleatoria
            </button>
          </div>

          {/* Right: Customization Controls */}
          <div className="md:col-span-7 p-6 space-y-6">
            {/* Tabs */}
            <div className="flex rounded-xl bg-[#0d0b2e] p-1 border border-[#2f2d78]">
              {[
                { id: 'base', label: 'Personaje', icon: User },
                { id: 'pelo', label: 'Cabello', icon: Palette },
                { id: 'ropa', label: 'Sudadera', icon: Shirt },
                { id: 'accesorios', label: 'Detalles', icon: Glasses },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#5b3ff0] text-white shadow-md'
                        : 'text-[#9a9bd0] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB: BASE & GENDER */}
            {activeTab === 'base' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Estilo de Personaje Base
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          gender: 'femenino',
                          hairStyle: 'largo_liso',
                          eyeStyle: 'anime_sparkle',
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        config.gender === 'femenino'
                          ? 'border-[#8b7bff] bg-[#5b3ff0]/20 text-white'
                          : 'border-[#2f2d78] bg-[#1b1860] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-sm font-bold">Chibi Femenina</div>
                      <div className="text-xs text-[#9a9bd0]">
                        Cabello largo con mechones suaves
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          gender: 'masculino',
                          hairStyle: 'corto_despeinado',
                          eyeStyle: 'anime_dark',
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        config.gender === 'masculino'
                          ? 'border-[#8b7bff] bg-[#5b3ff0]/20 text-white'
                          : 'border-[#2f2d78] bg-[#1b1860] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-sm font-bold">Chibi Masculino</div>
                      <div className="text-xs text-[#9a9bd0]">
                        Corte moderno con mechón central
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Tono de Piel
                  </label>
                  <div className="flex gap-2">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.hex}
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, skinColor: tone.hex }))}
                        title={tone.name}
                        className={`w-9 h-9 rounded-full border-2 transition-transform ${
                          config.skinColor === tone.hex
                            ? 'scale-110 border-white ring-2 ring-purple-500'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: tone.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Expresión Facial
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sonrisa', label: 'Sonriente 😊' },
                      { id: 'concentrado', label: 'Hacker Pro 💻' },
                      { id: 'guiño', label: 'Guiño 😉' },
                    ].map((exp) => (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, expression: exp.id }))}
                        className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                          config.expression === exp.id
                            ? 'border-[#8b7bff] bg-[#5b3ff0]/30 text-white'
                            : 'border-[#2f2d78] bg-[#1b1860] text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {exp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HAIR */}
            {activeTab === 'pelo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Corte de Cabello
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'largo_liso', label: 'Largo con mechones' },
                      { id: 'corto_despeinado', label: 'Corto despeinado' },
                      { id: 'corto_moderno', label: 'Corte K-Pop con raya' },
                      { id: 'coleta', label: 'Coleta alta' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, hairStyle: style.id }))}
                        className={`p-2.5 text-xs font-semibold rounded-lg border text-left transition-all ${
                          config.hairStyle === style.id
                            ? 'border-[#8b7bff] bg-[#5b3ff0]/30 text-white'
                            : 'border-[#2f2d78] bg-[#1b1860] text-gray-300'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Color de Cabello
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.hex}
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, hairColor: hc.hex }))}
                        title={hc.name}
                        className={`w-9 h-9 rounded-full border-2 transition-transform ${
                          config.hairColor === hc.hex
                            ? 'scale-110 border-white ring-2 ring-purple-500'
                            : 'border-black/40 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hc.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HOODIE / CLOTHING */}
            {activeTab === 'ropa' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#1b1860] border border-[#2f2d78] rounded-xl text-xs text-[#eceaff]">
                  ✨ Todas las sudaderas incluyen el <b>estampado oficial de Campuslands</b>{' '}
                  con el casco espacial astronauta.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Color de la Sudadera
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {HOODIE_COLORS.map((hc) => (
                      <button
                        key={hc.hex}
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, hoodieColor: hc.hex }))}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          config.hoodieColor === hc.hex
                            ? 'border-[#8b7bff] bg-[#5b3ff0]/20 text-white'
                            : 'border-[#2f2d78] bg-[#1b1860] text-gray-300'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: hc.hex }}
                        />
                        <span className="text-xs font-medium">{hc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACCESSORIES */}
            {activeTab === 'accesorios' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Accesorios de Campuser
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'ninguno', label: 'Sin accesorios' },
                      { id: 'audifonos', label: '🎧 Audífonos Gamer RGB' },
                      { id: 'gafas', label: '👓 Lentes Tech de Código' },
                      { id: 'credencial', label: '🪪 Carnet / Lanyard Campus' },
                      { id: 'mochila', label: '🎒 Mochila de Laptop' },
                    ].map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, accessory: acc.id }))}
                        className={`p-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                          config.accessory === acc.id
                            ? 'border-[#8b7bff] bg-[#5b3ff0]/30 text-white shadow'
                            : 'border-[#2f2d78] bg-[#1b1860] text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#0d0b2e] border-t border-[#2f2d78]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(config);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5b3ff0] hover:bg-[#6d5df0] text-white text-sm font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" />
            Guardar y Aplicar al Mapa
          </button>
        </div>
      </div>
    </div>
  );
};
