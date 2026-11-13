import React, { useState } from 'react';
import {
  EngineGeneration,
  EngineItem,
  GENERATION_SPECS,
  ProtocolState,
  buildDeterministicTraits,
} from '../protocol/settleworksEngine';
import { IsometricEngineArtwork } from './IsometricEngineArtwork';
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RarityTracksViewProps {
  protocol: ProtocolState;
  onInspect3D: (engine: EngineItem) => void;
}

export const RarityTracksView: React.FC<RarityTracksViewProps> = ({
  protocol,
  onInspect3D,
}) => {
  const [selectedGen, setSelectedGen] = useState<EngineGeneration>('Prime');

  const archetypeEngines: Record<EngineGeneration, EngineItem> = {
    Relay: {
      id: 3531,
      generation: 'Relay',
      weight: 1.0,
      status: 'Commissioned',
      owner: 'you',
      listedPriceUSDG: null,
      rewardDebtPerWeight: protocol.accRewardPerWeight,
      unsettledRewardUSDG: 18.45,
      totalClaimedUSDG: 42.1,
      commissionedAtBlock: 1923531,
      traits: buildDeterministicTraits(3531, 'Commissioned'),
    },
    Ledger: {
      id: 4415,
      generation: 'Ledger',
      weight: 1.25,
      status: 'Commissioned',
      owner: 'you',
      listedPriceUSDG: null,
      rewardDebtPerWeight: protocol.accRewardPerWeight,
      unsettledRewardUSDG: 31.2,
      totalClaimedUSDG: 64.0,
      commissionedAtBlock: 1924415,
      traits: buildDeterministicTraits(4415, 'Commissioned'),
    },
    Vault: {
      id: 1403,
      generation: 'Vault',
      weight: 1.75,
      status: 'Commissioned',
      owner: '0x5c2...88a',
      listedPriceUSDG: 155.0,
      rewardDebtPerWeight: protocol.accRewardPerWeight,
      unsettledRewardUSDG: 42.6,
      totalClaimedUSDG: 88.5,
      commissionedAtBlock: 1921403,
      traits: buildDeterministicTraits(1403, 'Commissioned'),
    },
    Prime: {
      id: 4660,
      generation: 'Prime',
      weight: 3.0,
      status: 'Commissioned',
      owner: 'you',
      listedPriceUSDG: null,
      rewardDebtPerWeight: protocol.accRewardPerWeight,
      unsettledRewardUSDG: 94.8,
      totalClaimedUSDG: 162.4,
      commissionedAtBlock: 1924660,
      traits: buildDeterministicTraits(4660, 'Commissioned'),
    },
  };

  const activeArchetype = archetypeEngines[selectedGen];
  const activeSpec = GENERATION_SPECS[selectedGen];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-12">
      {/* Header */}
      <div>
        <div className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
          GENERATIONS · WEIGHTS · TRACKVAULT
        </div>
        <h1 className="mt-1.5 text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white">
          4,663 Settle Engines & Reward Tracks
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Total collection supply is anchored to Robinhood Chain ID <strong className="font-mono">4663</strong>. Generation class determines base visual architecture, reward weight multiplier, and future Reward Track eligibility. Cosmetic hardware traits never alter economic weight.
        </p>
      </div>

      {/* 4 Generation Archetype Cards + Interactive 3D Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['Relay', 'Ledger', 'Vault', 'Prime'] as EngineGeneration[]).map((gen) => {
            const spec = GENERATION_SPECS[gen];
            const isSelected = selectedGen === gen;
            return (
              <div
                key={gen}
                onClick={() => setSelectedGen(gen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedGen(gen);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-[#161C26] border-[#0284C7] dark:border-[#4FFFB0] ring-1 ring-[#0284C7] dark:ring-[#4FFFB0]'
                    : 'bg-white/80 dark:bg-[#12161E] border-slate-200 dark:border-white/10 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs inline-block"
                        style={{ backgroundColor: spec.colorHex }}
                      />
                      {spec.name}
                    </span>
                    <span className="text-sm font-bold text-[#0284C7] dark:text-[#4FFFB0] tabular-nums">
                      {spec.weight.toFixed(2)}× weight
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {spec.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10 font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fixed Supply</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {spec.supply.toLocaleString()} ({spec.proportionLabel})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Track Eligibility</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                      {spec.name} Class
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Generation Showcase Card */}
        <div className="lg:col-span-5 bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs mb-3">
            <span className="text-slate-500 dark:text-slate-400 uppercase">
              ARCHETYPE PREVIEW · {activeSpec.name.toUpperCase()}
            </span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {activeSpec.supply} / 4,663 IDs
            </span>
          </div>

          <IsometricEngineArtwork
            engine={activeArchetype}
            className="w-full max-h-[280px] aspect-square mx-auto rounded-2xl"
          />

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="font-mono text-xs">
              <div className="text-slate-500">Cosmetic Trait Policy</div>
              <div className="text-slate-900 dark:text-white font-semibold mt-0.5">
                0% impact on reward weight
              </div>
            </div>
            <button
              type="button"
              onClick={() => onInspect3D(activeArchetype)}
              className="px-4 py-2.5 rounded-xl bg-[#4FFFB0] text-[#091310] font-mono text-xs font-bold hover:bg-[#3be89b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Inspect {activeSpec.name} in 3D →
            </button>
          </div>
        </div>
      </div>

      {/* Modular TrackVault & Stock Token Gate Matrix (Sections 14 & 15 of PRD!) */}
      <div className="hardware-bezel rounded-2xl p-3 sm:p-4">
        <div className="hardware-screen rounded-xl p-5 sm:p-6 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="text-xs text-[#4FFFB0] font-bold">
                TRACKVAULT · MODULAR REWARD TRACKS & COMPLIANCE GATES
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Core protocol fees always pay in USDG. Additional partner or Stock Token tracks use isolated TrackVault contracts funded upfront in raw ERC-20 token units.
              </p>
            </div>
            <span className="text-xs text-slate-400">CHAINLINK ORACLE + SEQUENCER UPTIME GUARDED</span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Track 1: Core USDG Fee Track */}
            <div className="p-4 rounded-xl bg-black/40 border border-[#4FFFB0]/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#4FFFB0]">
                  <span className="font-bold">01 · CORE USDG FEE STREAM</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="mt-2 text-white font-semibold">
                  Eligible: All Commissioned (Relay, Ledger, Vault, Prime)
                </div>
                <p className="mt-2 text-slate-400 font-sans leading-relaxed">
                  Funded continuously by 65% of Canonical Curve (1%) and Settle Bazaar (5%) fees in official registry USDG.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[11px]">
                <span className="text-slate-400">STATUS</span>
                <span className="text-[#4FFFB0] font-bold">ACTIVE AT LAUNCH</span>
              </div>
            </div>

            {/* Track 2: Ecosystem Sponsored USDG / ETH Track */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#38BDF8]">
                  <span className="font-bold">02 · ECOSYSTEM SPONSOR TRACKS</span>
                  <span>M5 EXPANSION</span>
                </div>
                <div className="mt-2 text-white font-semibold">
                  Eligible: Configurable by Generation (e.g., Vault & Prime)
                </div>
                <p className="mt-2 text-slate-400 font-sans leading-relaxed">
                  Requires 100% upfront ERC-20 funding locked in TrackVault with fixed start/end block schedule. Zero reliance on off-chain treasury promises.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[11px]">
                <span className="text-slate-400">STATUS</span>
                <span className="text-[#38BDF8]">READY FOR PARTNER FUNDING</span>
              </div>
            </div>

            {/* Track 3: Gated Stock Token Tracks (Section 14 & 15) */}
            <div className="p-4 rounded-xl bg-black/40 border border-[#F59E0B]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#F59E0B]">
                  <span className="font-bold">03 · STOCK TOKEN TRACKS</span>
                  <Lock className="w-4 h-4" />
                </div>
                <div className="mt-2 text-white font-semibold">
                  Broad / Tech / Defensive / Premier Classes
                </div>
                <p className="mt-2 text-slate-400 font-sans leading-relaxed">
                  Tokenised debt securities on Robinhood Chain. Strictly inactive in MVP until legal memos, jurisdiction geoblocking, and corporate-action `oraclePaused()` checks pass.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">MVP GATE</span>
                <span className="text-[#F59E0B] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> GATED (M6)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
