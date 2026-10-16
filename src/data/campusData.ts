import { User, Zone, AvatarConfig } from '../types';

export const DEFAULT_AVATAR_FEMALE: AvatarConfig = {
  gender: 'femenino',
  skinColor: '#ffe0bd',
  hairStyle: 'largo_liso',
  hairColor: '#1e1b2e',
  hoodieColor: '#4c1d95',
  eyeStyle: 'anime_sparkle',
  accessory: 'ninguno',
  expression: 'sonrisa',
};

export const DEFAULT_AVATAR_MALE: AvatarConfig = {
  gender: 'masculino',
  skinColor: '#f7d0b3',
  hairStyle: 'corto_despeinado',
  hairColor: '#171717',
  hoodieColor: '#3b0764',
  eyeStyle: 'anime_dark',
  accessory: 'audifonos',
  expression: 'concentrado',
};

export const USERS: Record<string, User> = {
  '1001': {
    pin: '1001',
    n: 'Ana Gómez',
    r: 'estudiante',
    z: 'aul', // Artemis
    avatar: { ...DEFAULT_AVATAR_FEMALE },
  },
  '1002': {
    pin: '1002',
    n: 'Luis Pérez',
    r: 'estudiante',
    z: 'cwc', // Apolo
    avatar: { ...DEFAULT_AVATAR_MALE, hairStyle: 'corto_moderno' },
  },
  '1003': {
    pin: '1003',
    n: 'Sofía Ruiz',
    r: 'estudiante',
    z: 'cwn', // Spooki
    avatar: { ...DEFAULT_AVATAR_FEMALE, hairColor: '#312e81' },
  },
  '1004': {
    pin: '1004',
    n: 'Camilo Torres',
    r: 'estudiante',
    z: 'hun', // Cosmos
    avatar: { ...DEFAULT_AVATAR_MALE, hairColor: '#2e1065', accessory: 'gafas' },
  },
  '9001': {
    pin: '9001',
    n: 'Laura Gómez',
    r: 'directivo',
    cargo: 'Coordinadora Académica',
    avatar: { ...DEFAULT_AVATAR_FEMALE, accessory: 'credencial' },
  },
  '9002': {
    pin: '9002',
    n: 'Carlos Rojas',
    r: 'directivo',
    cargo: 'Director de Campus',
    avatar: { ...DEFAULT_AVATAR_MALE, accessory: 'credencial' },
  },
};

export const ZONES: Zone[] = [
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
