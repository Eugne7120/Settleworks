import React from 'react';
import { EngineItem, GENERATION_SPECS } from '../protocol/settleworksEngine';

interface IsometricEngineArtworkProps {
  engine: EngineItem;
  className?: string;
  compact?: boolean;
}

const BACKDROP_PALETTES: Record<
  EngineItem['traits']['backdrop'],
  { bgLight: string; bgDark: string; plinthTop: string; plinthSide: string }
> = {
  'Mint Laboratory': {
    bgLight: 'bg-[#DFF2EC]',
    bgDark: 'dark:bg-[#132220]',
    plinthTop: '#DCECE7',
    plinthSide: '#B8CEC7',
  },
  'Warm Parchment': {
    bgLight: 'bg-[#F2E9DC]',
    bgDark: 'dark:bg-[#221D17]',
    plinthTop: '#EFE6D8',
    plinthSide: '#CFC2B0',
  },
  'Cool Titanium': {
    bgLight: 'bg-[#E2EAF4]',
    bgDark: 'dark:bg-[#141C26]',
    plinthTop: '#E4ECF5',
    plinthSide: '#BCC8D8',
  },
  'Amber Drafting': {
    bgLight: 'bg-[#F4E3DC]',
    bgDark: 'dark:bg-[#241917]',
    plinthTop: '#F0DFD8',
    plinthSide: '#D1B8AE',
  },
  'Obsidian Blueprint': {
    bgLight: 'bg-[#E5E7EB]',
    bgDark: 'dark:bg-[#14171C]',
    plinthTop: '#D1D5DB',
    plinthSide: '#9CA3AF',
  },
};

const CHASSIS_PALETTES: Record<
  EngineItem['traits']['chassis'],
  { top: string; left: string; right: string; trim: string }
> = {
  'Carbon Anodized': {
    top: '#3B424C',
    left: '#262B33',
    right: '#191D23',
    trim: '#64748B',
  },
  'Titanium Brushed': {
    top: '#E2E6EC',
    left: '#C6CDD7',
    right: '#9AA3B0',
    trim: '#475569',
  },
  'Porcelain Ceramic': {
    top: '#F4F3EE',
    left: '#DCDAD0',
    right: '#B8B5A8',
    trim: '#78716C',
  },
  'Cobalt Alloy': {
    top: '#5E859E',
    left: '#41647A',
    right: '#2B4556',
    trim: '#38BDF8',
  },
  'Obsidian Cast': {
    top: '#2C3038',
    left: '#1D2026',
    right: '#121418',
    trim: '#F59E0B',
  },
};

export const IsometricEngineArtwork: React.FC<IsometricEngineArtworkProps> = ({
  engine,
  className = '',
  compact = false,
}) => {
  const backdrop = BACKDROP_PALETTES[engine.traits.backdrop];
  const chassis = CHASSIS_PALETTES[engine.traits.chassis];
  const genSpec = GENERATION_SPECS[engine.generation];
  const isCommissioned = engine.status === 'Commissioned';

  const screenGlowColor =
    engine.traits.display === 'Amber Vector'
      ? '#F59E0B'
      : engine.traits.display === 'Emerald Telemetry'
      ? '#34D399'
      : '#38BDF8';

  const sealColor = isCommissioned ? (engine.id % 2 === 0 ? '#38BDF8' : '#F59E0B') : '#64748B';

  return (
    <div
      className={`relative overflow-hidden select-none ${backdrop.bgLight} ${backdrop.bgDark} engine-card-grid-light dark:engine-card-grid-dark transition-transform duration-300 ${className}`}
    >
      {/* Top-left Status Tag matching reference UI ("LIT" -> "COMMISSIONED" or "OPEN") */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <span
          className={`px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider rounded ${
            isCommissioned
              ? 'bg-[#0B1014]/85 text-[#4FFFB0] border border-[#4FFFB0]/30'
              : 'bg-[#0B1014]/70 text-slate-300 border border-white/15'
          }`}
        >
          {isCommissioned ? 'COMMISSIONED' : 'OPEN · 1W'}
        </span>
      </div>

      {/* Top-right Weight / Serial micro-readout */}
      {!compact && (
        <div className="absolute top-3 right-3 z-10 text-[10px] font-mono text-slate-600 dark:text-slate-400">
          {genSpec.weight.toFixed(2)}×
        </div>
      )}

      {/* Isometric Precision Instrument SVG */}
      <svg
        viewBox="0 0 260 240"
        className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04]"
        role="img"
        aria-label={`Settleworks ${engine.generation} Engine #${engine.id}`}
      >
        <defs>
          <radialGradient id={`shadow-${engine.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
            <stop offset="75%" stopColor="rgba(0,0,0,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`crt-${engine.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#071018" />
            <stop offset="100%" stopColor="#0F1E2A" />
          </linearGradient>
        </defs>

        {/* Ground Contact Shadow */}
        <ellipse cx="130" cy="188" rx="82" ry="36" fill={`url(#shadow-${engine.id})`} />

        {/* Isometric Base Plinth (Precision Slab) */}
        <g>
          {/* Plinth Bottom Wall */}
          <polygon
            points="54,168 130,206 206,168 206,178 130,216 54,178"
            fill={backdrop.plinthSide}
            stroke="#334155"
            strokeWidth="0.8"
          />
          {/* Plinth Top Face */}
          <polygon
            points="130,130 206,168 130,206 54,168"
            fill={backdrop.plinthTop}
            stroke="#475569"
            strokeWidth="0.9"
          />
          {/* Engraved Serial Platen on Plinth Front-Left */}
          <polygon
            points="66,172 118,198 118,203 66,177"
            fill="#1E293B"
            opacity="0.85"
          />
        </g>

        {/* Generation-Specific 3D Isometric Instrument Architecture */}
        {engine.generation === 'Vault' || engine.generation === 'Prime' ? (
          /* TWIN-TOWER MONOLITH + TERMINAL (Vault & Prime Archetypes — matching tall server + terminal in ref) */
          <g>
            {/* Rear Tall Custody Tower */}
            <g>
              {/* Tower Top */}
              <polygon
                points="116,42 156,62 126,77 86,57"
                fill={chassis.top}
                stroke="#1E293B"
                strokeWidth="1"
              />
              {/* Tower Left Face (with vertical cooling slits & reel ports) */}
              <polygon
                points="86,57 126,77 126,164 86,144"
                fill={chassis.left}
                stroke="#1E293B"
                strokeWidth="1"
              />
              {/* Tower Right Face */}
              <polygon
                points="126,77 156,62 156,149 126,164"
                fill={chassis.right}
                stroke="#1E293B"
                strokeWidth="1"
              />
              {/* Dual Magnetic Spools / Gauge Dials on Tower Left Face */}
              <ellipse
                cx="99"
                cy="82"
                rx="7"
                ry="9"
                transform="rotate(-18 99 82)"
                fill="#0F172A"
                stroke={sealColor}
                strokeWidth="1.2"
              />
              <circle cx="99" cy="82" r="2.5" fill={sealColor} />
              <ellipse
                cx="114"
                cy="90"
                rx="7"
                ry="9"
                transform="rotate(-18 114 90)"
                fill="#0F172A"
                stroke={sealColor}
                strokeWidth="1.2"
              />
              <circle cx="114" cy="90" r="2.5" fill={sealColor} />

              {/* Ventilation Engravings */}
              <line x1="92" y1="108" x2="120" y2="122" stroke="#0F172A" strokeWidth="1.6" />
              <line x1="92" y1="114" x2="120" y2="128" stroke="#0F172A" strokeWidth="1.6" />
              <line x1="92" y1="120" x2="120" y2="134" stroke="#0F172A" strokeWidth="1.6" />

              {/* Prime Sovereign Pediment / Gyroscope Crown */}
              {engine.generation === 'Prime' && (
                <g>
                  <polygon
                    points="116,26 146,49 126,59 96,44"
                    fill="#F59E0B"
                    opacity="0.9"
                    stroke="#1E293B"
                    strokeWidth="0.9"
                  />
                  <circle
                    cx="121"
                    cy="48"
                    r="5"
                    fill={isCommissioned ? '#38BDF8' : '#475569'}
                    stroke="#0F172A"
                    strokeWidth="1"
                  />
                </g>
              )}
            </g>

            {/* Front Precision Terminal Unit */}
            <g>
              {/* Terminal Top */}
              <polygon
                points="146,84 184,103 158,116 120,97"
                fill={chassis.top}
                stroke="#1E293B"
                strokeWidth="1"
              />
              {/* Terminal Left (Screen Face) */}
              <polygon
                points="120,97 158,116 158,168 120,149"
                fill={chassis.left}
                stroke="#1E293B"
                strokeWidth="1"
              />
              {/* Terminal Right (Receipt Platen Face) */}
              <polygon
                points="158,116 184,103 184,155 158,168"
                fill={chassis.right}
                stroke="#1E293B"
                strokeWidth="1"
              />
              {/* Inset CRT / OLED Screen */}
              <polygon
                points="125,104 153,118 153,146 125,132"
                fill={`url(#crt-${engine.id})`}
                stroke={isCommissioned ? screenGlowColor : '#475569'}
                strokeWidth="1.2"
              />
              {/* Live Waveform on Screen */}
              <polyline
                points="128,122 133,118 137,126 142,116 146,129 150,124"
                fill="none"
                stroke={isCommissioned ? screenGlowColor : '#64748B'}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Keyboard Deck */}
              <polygon
                points="120,149 158,168 142,178 104,159"
                fill={chassis.top}
                stroke="#1E293B"
                strokeWidth="1"
              />
              <polygon
                points="108,158 140,174 146,170 114,154"
                fill="#0F172A"
              />
            </g>
          </g>
        ) : (
          /* COMPACT & WIDE-PLATEN PRECISION TERMINAL (Relay & Ledger Archetypes — matching classic isometric computer in ref) */
          <g>
            {/* Under-Monitor Settlement Deck / Escrow Base */}
            <polygon
              points="132,118 188,146 144,168 88,140"
              fill={chassis.top}
              stroke="#1E293B"
              strokeWidth="1"
            />
            <polygon
              points="88,140 144,168 144,182 88,154"
              fill={chassis.left}
              stroke="#1E293B"
              strokeWidth="1"
            />
            <polygon
              points="144,168 188,146 188,160 144,182"
              fill={chassis.right}
              stroke="#1E293B"
              strokeWidth="1"
            />

            {/* Upper Precision CRT / Telemetry Housing */}
            <polygon
              points="136,56 184,80 150,97 102,73"
              fill={chassis.top}
              stroke="#1E293B"
              strokeWidth="1"
            />
            {/* Front-Left Screen Face */}
            <polygon
              points="102,73 150,97 150,147 102,123"
              fill={chassis.left}
              stroke="#1E293B"
              strokeWidth="1"
            />
            {/* Right Housing Wall (with Receipt Slot) */}
            <polygon
              points="150,97 184,80 184,130 150,147"
              fill={chassis.right}
              stroke="#1E293B"
              strokeWidth="1"
            />

            {/* Inset Dark Phosphor Display */}
            <polygon
              points="108,81 144,99 144,135 108,117"
              fill={`url(#crt-${engine.id})`}
              stroke={isCommissioned ? screenGlowColor : '#475569'}
              strokeWidth="1.3"
            />

            {/* Screen Telemetry Readout */}
            {engine.generation === 'Ledger' ? (
              <g>
                <line x1="113" y1="93" x2="138" y2="105" stroke={screenGlowColor} strokeWidth="1.5" opacity="0.9" />
                <line x1="113" y1="100" x2="134" y2="110" stroke={screenGlowColor} strokeWidth="1.5" opacity="0.7" />
                <line x1="113" y1="107" x2="139" y2="120" stroke={screenGlowColor} strokeWidth="1.5" opacity="0.85" />
                <line x1="113" y1="114" x2="129" y2="122" stroke="#F59E0B" strokeWidth="1.5" />
              </g>
            ) : (
              <polyline
                points="112,102 118,98 123,110 129,99 135,116 141,111"
                fill="none"
                stroke={isCommissioned ? screenGlowColor : '#64748B'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Mechanical Keyboard Wedge */}
            <polygon
              points="102,126 148,149 130,161 84,138"
              fill={chassis.top}
              stroke="#1E293B"
              strokeWidth="1"
            />
            {/* Keycap Matrix */}
            <polygon
              points="90,137 130,157 141,149 101,129"
              fill="#0F172A"
              stroke={chassis.trim}
              strokeWidth="0.6"
            />
            <line x1="96" y1="135" x2="134" y2="154" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="100" y1="132" x2="138" y2="151" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 2" />

            {/* Top Commissioning Antenna / Seal Module */}
            <line x1="144" y1="74" x2="144" y2="54" stroke="#334155" strokeWidth="1.5" />
            <circle
              cx="144"
              cy="52"
              r="3.5"
              fill={sealColor}
              stroke="#0F172A"
              strokeWidth="0.9"
            />
          </g>
        )}

        {/* Iconic Cascading Settlement Ledger Receipt Tape (Signature Visual Motif!) */}
        <g>
          {/* Slot on right side */}
          <line x1="164" y1="126" x2="176" y2="120" stroke="#090D12" strokeWidth="2.5" />
          {/* Curling Paper Strip */}
          <path
            d="M 165 126 Q 174 145, 170 162 T 182 184 L 192 178 Q 182 160, 185 142 T 175 120 Z"
            fill="#F8FAFC"
            stroke="#64748B"
            strokeWidth="0.9"
          />
          {/* Printed hash lines on tape */}
          <line x1="169" y1="134" x2="177" y2="130" stroke="#334155" strokeWidth="1" />
          <line x1="171" y1="141" x2="179" y2="137" stroke="#38BDF8" strokeWidth="1" />
          <line x1="172" y1="149" x2="180" y2="145" stroke="#334155" strokeWidth="1" />
          <line x1="173" y1="157" x2="181" y2="153" stroke="#F59E0B" strokeWidth="1" />
          <line x1="176" y1="166" x2="184" y2="162" stroke="#334155" strokeWidth="1" />
        </g>

        {/* Commissioning Seal Disc on Front Corner of Plinth */}
        <g>
          <ellipse
            cx="130"
            cy="192"
            rx="10"
            ry="5.5"
            fill="#0F172A"
            stroke={sealColor}
            strokeWidth="1.4"
          />
          <ellipse cx="130" cy="191" rx="5" ry="2.5" fill={sealColor} />
        </g>
      </svg>
    </div>
  );
};
