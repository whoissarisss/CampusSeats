import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarProps {
  config?: AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  isAnimated?: boolean;
}

export const AvatarChibi: React.FC<AvatarProps> = ({
  config,
  size = 'md',
  showBadge = false,
  className = '',
  isAnimated = false,
}) => {
  const c = config || {
    gender: 'femenino',
    skinColor: '#ffe0bd',
    hairStyle: 'largo_liso',
    hairColor: '#1e1b2e',
    hoodieColor: '#4c1d95',
    eyeStyle: 'anime_sparkle',
    accessory: 'ninguno',
    expression: 'sonrisa',
  };

  const dimMap = {
    xs: 26,
    sm: 36,
    md: 54,
    lg: 96,
    xl: 140,
  };
  const px = dimMap[size];

  // Dynamic SVG rendering based on chibi assets
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 120 135"
        width={px}
        height={px}
        className={`w-full h-full overflow-visible transition-transform duration-300 ${
          isAnimated ? 'hover:scale-105 active:scale-95' : ''
        }`}
      >
        <defs>
          <radialGradient id={`glow-${c.hoodieColor.replace('#', '')}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
          <filter id="chibi-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Soft ground shadow */}
        <ellipse cx="60" cy="126" rx="34" ry="7" fill="#000000" opacity="0.25" />

        {/* Legs and shoes */}
        <g id="legs">
          {/* Left leg and shoe */}
          <rect x="42" y="102" width="14" height="20" rx="6" fill="#18181b" />
          <ellipse cx="49" cy="122" rx="9" ry="5" fill="#09090b" />
          <path d="M43 122 Q49 119 55 122" stroke="#27272a" strokeWidth="1.5" fill="none" />

          {/* Right leg and shoe */}
          <rect x="64" y="102" width="14" height="20" rx="6" fill="#18181b" />
          <ellipse cx="71" cy="122" rx="9" ry="5" fill="#09090b" />
          <path d="M65 122 Q71 119 77 122" stroke="#27272a" strokeWidth="1.5" fill="none" />
        </g>

        {/* Backpack behind body if selected */}
        {c.accessory === 'mochila' && (
          <g id="backpack">
            <rect x="27" y="65" width="66" height="38" rx="12" fill="#1e1b4b" stroke="#0f172a" strokeWidth="2" />
            <rect x="35" y="70" width="50" height="14" rx="4" fill="#312e81" />
          </g>
        )}

        {/* Back Hair for Long Hair style */}
        {c.hairStyle === 'largo_liso' && (
          <path
            d="M24 45 C15 70 18 100 28 108 C36 104 35 75 35 60 C35 30 85 30 85 60 C85 75 84 104 92 108 C102 100 105 70 96 45 Z"
            fill={c.hairColor}
          />
        )}
        {c.hairStyle === 'coleta' && (
          <path
            d="M85 35 Q108 40 102 70 Q90 62 88 50 Z"
            fill={c.hairColor}
          />
        )}

        {/* Campuslands signature Hoodie Body */}
        <g id="hoodie-body" filter="url(#chibi-shadow)">
          {/* Main torso */}
          <path
            d="M32 62 C32 55 46 52 60 52 C74 52 88 55 88 62 L92 104 C92 107 88 110 82 110 L38 110 C32 110 28 107 28 104 Z"
            fill={c.hoodieColor}
          />

          {/* Hoodie Pocket in front (where hands go) */}
          <path
            d="M38 88 L82 88 L78 106 L42 106 Z"
            fill="#1e1035"
            opacity="0.35"
          />
          {/* Pocket hem & stitches */}
          <path d="M42 88 L46 104" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" fill="none" />
          <path d="M78 88 L74 104" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" fill="none" />

          {/* Hoodie Strings */}
          <path d="M53 58 C53 68 51 72 50 78" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" fill="none" />
          <circle cx="50" cy="79" r="1.5" fill="#a78bfa" />
          <path d="M67 58 C67 68 69 72 70 78" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" fill="none" />
          <circle cx="70" cy="79" r="1.5" fill="#a78bfa" />

          {/* CAMPUSLANDS Logo Icon on Left Chest */}
          <g id="campuslands-badge" transform="translate(68, 63) scale(0.7)">
            {/* Astronaut helmet icon */}
            <circle cx="10" cy="10" r="7" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.9" />
            <path d="M6 10 Q10 7 14 10" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.9" />
            <ellipse cx="10" cy="11" rx="4.5" ry="3" fill="#ffffff" opacity="0.85" />
            {/* Micro text representation */}
            <rect x="3" y="19" width="14" height="2" rx="1" fill="#ffffff" opacity="0.75" />
          </g>

          {/* Sleeves with hands tucked in hoodie pockets */}
          {/* Left sleeve */}
          <path
            d="M32 58 C24 66 18 80 20 92 C23 96 32 95 38 88 C34 78 35 68 36 60 Z"
            fill={c.hoodieColor}
            filter="brightness(0.9)"
          />
          {/* Right sleeve */}
          <path
            d="M88 58 C96 66 102 80 100 92 C97 96 88 95 82 88 C86 78 85 68 84 60 Z"
            fill={c.hoodieColor}
            filter="brightness(0.9)"
          />

          {/* Hoodie Collar / Neck opening */}
          <path
            d="M48 54 Q60 62 72 54 Q60 50 48 54 Z"
            fill="#18181b"
          />
        </g>

        {/* Credential / Lanyard Accessory */}
        {c.accessory === 'credencial' && (
          <g id="lanyard">
            <path d="M52 54 L58 74 L62 74 L68 54" stroke="#ec4899" strokeWidth="2" fill="none" />
            <rect x="54" y="73" width="12" height="16" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
            <rect x="56" y="75" width="8" height="6" rx="1" fill="#8b5cf6" />
            <rect x="56" y="83" width="8" height="1.5" fill="#334155" />
            <rect x="56" y="86" width="5" height="1" fill="#64748b" />
          </g>
        )}

        {/* Chibi Head & Face */}
        <g id="head" filter="url(#chibi-shadow)">
          {/* Cute chubby chibi head */}
          <path
            d="M26 36 C24 16 42 6 60 6 C78 6 96 16 94 36 C94 52 82 62 60 62 C38 62 26 52 26 36 Z"
            fill={c.skinColor}
          />
          {/* Soft blushing cheeks */}
          <ellipse cx="37" cy="45" rx="5" ry="3" fill="#fb7185" opacity="0.5" />
          <ellipse cx="83" cy="45" rx="5" ry="3" fill="#fb7185" opacity="0.5" />

          {/* Eyes based on eyeStyle */}
          {c.eyeStyle === 'anime_sparkle' ? (
            <g id="eyes-sparkle">
              {/* Left eye */}
              <ellipse cx="43" cy="38" rx="6.5" ry="8.5" fill="#18181b" />
              <circle cx="41.5" cy="35" r="2.8" fill="#ffffff" />
              <circle cx="45.5" cy="41" r="1.2" fill="#ffffff" />
              {/* Right eye */}
              <ellipse cx="77" cy="38" rx="6.5" ry="8.5" fill="#18181b" />
              <circle cx="75.5" cy="35" r="2.8" fill="#ffffff" />
              <circle cx="79.5" cy="41" r="1.2" fill="#ffffff" />
            </g>
          ) : c.eyeStyle === 'anime_dark' ? (
            <g id="eyes-dark">
              {/* Big dark anime eyes from male reference */}
              <ellipse cx="43" cy="38" rx="7" ry="8.5" fill="#0f172a" />
              <circle cx="42" cy="35" r="2.2" fill="#ffffff" opacity="0.9" />
              <circle cx="45" cy="41" r="1" fill="#ffffff" opacity="0.6" />
              <ellipse cx="77" cy="38" rx="7" ry="8.5" fill="#0f172a" />
              <circle cx="76" cy="35" r="2.2" fill="#ffffff" opacity="0.9" />
              <circle cx="79" cy="41" r="1" fill="#ffffff" opacity="0.6" />
            </g>
          ) : (
            <g id="eyes-happy">
              {/* Curved smiling anime eyes */}
              <path d="M37 38 Q43 32 49 38" stroke="#18181b" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M71 38 Q77 32 83 38" stroke="#18181b" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Eyebrows */}
          <path d="M38 27 Q44 25 49 28" stroke={c.hairColor} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M71 28 Q76 25 82 27" stroke={c.hairColor} strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Tiny chibi nose & mouth */}
          <circle cx="60" cy="42" r="0.8" fill="#f43f5e" opacity="0.6" />
          {c.expression === 'concentrado' ? (
            <path d="M57 48 L63 48" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          ) : c.expression === 'guiño' ? (
            <path d="M56 46 Q60 51 64 46" stroke="#18181b" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M57 47 Q60 51 63 47" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          )}

          {/* Glasses Accessory */}
          {c.accessory === 'gafas' && (
            <g id="glasses">
              <rect x="35" y="30" width="18" height="15" rx="3" fill="#ffffff" fillOpacity="0.25" stroke="#1e293b" strokeWidth="2" />
              <rect x="67" y="30" width="18" height="15" rx="3" fill="#ffffff" fillOpacity="0.25" stroke="#1e293b" strokeWidth="2" />
              <line x1="53" y1="36" x2="67" y2="36" stroke="#1e293b" strokeWidth="2" />
            </g>
          )}
        </g>

        {/* Front Hair with bangs & signature anime strands */}
        <g id="front-hair" filter="url(#chibi-shadow)">
          {c.hairStyle === 'corto_despeinado' || c.hairStyle === 'corto_moderno' ? (
            // Male messy styled hair with center parting
            <g>
              <path
                d="M26 32 C23 15 42 4 60 4 C80 4 97 15 94 32 C93 33 88 28 85 24 C82 32 78 38 72 40 C75 32 76 26 74 22 C68 34 62 42 58 42 C56 34 58 26 57 20 C52 32 46 40 40 40 C43 32 43 25 41 22 C37 28 32 34 26 32 Z"
                fill={c.hairColor}
              />
              {/* Ahoge / playful hair strand at top */}
              <path d="M57 5 Q52 -4 44 2 Q48 1 54 6" fill={c.hairColor} />
            </g>
          ) : (
            // Female/Long hair with soft layered bangs and side locks
            <g>
              <path
                d="M24 38 C22 14 42 4 60 4 C80 4 98 14 96 38 C94 40 91 32 89 26 C86 36 82 48 76 49 C79 36 78 26 76 20 C71 35 63 46 59 46 C57 36 59 26 58 20 C52 35 44 46 39 46 C41 34 40 24 37 20 C32 30 28 38 24 38 Z"
                fill={c.hairColor}
              />
              {/* Soft side lock left */}
              <path d="M25 36 C22 55 24 72 30 84 C33 75 31 55 31 40 Z" fill={c.hairColor} />
              {/* Soft side lock right */}
              <path d="M95 36 C98 55 96 72 90 84 C87 75 89 55 89 40 Z" fill={c.hairColor} />
              {/* Cute stray strand */}
              <path d="M58 4 Q54 -3 47 0 Q51 1 56 6" fill={c.hairColor} />
            </g>
          )}
        </g>

        {/* Headphones Accessory */}
        {c.accessory === 'audifonos' && (
          <g id="gaming-headset">
            {/* Top band */}
            <path d="M22 36 C20 10 40 -1 60 -1 C80 -1 100 10 98 36" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M22 36 C20 10 40 -1 60 -1 C80 -1 100 10 98 36" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Left earpad */}
            <rect x="17" y="28" width="9" height="18" rx="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="21.5" cy="37" r="2.5" fill="#38bdf8" />
            {/* Right earpad */}
            <rect x="94" y="28" width="9" height="18" rx="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="98.5" cy="37" r="2.5" fill="#38bdf8" />
            {/* Mic */}
            <path d="M22 43 Q24 55 38 56" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="39" cy="56" r="2" fill="#38bdf8" />
          </g>
        )}
      </svg>

      {/* Online / Active Badge Indicator */}
      {showBadge && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0d0b2e] rounded-full shadow-sm" />
      )}
    </div>
  );
};
