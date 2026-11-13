import React from 'react';
import { ProtocolState } from '../protocol/settleworksEngine';
import { NavTab } from './SanctuaryHero3D';

interface OverviewSectionProps {
  protocol: ProtocolState;
  onNavigate: (tab: NavTab) => void;
}

const ASCII_ENGINE_SEAL = `
            . : · · · · · · : .
        . :   +   %   #   %   +   : .
      :   *   $   WORKS   $   *   :
    ·   +   #   [ 4 6 6 3 ]   #   +   ·
   :   %   *   ═════════════   *   %   :
   ·   #   $   SETTLE ENGINE   $   #   ·
   :   %   *   ═════════════   *   %   :
    ·   +   #   65% USDG FEE  #   +   ·
      :   *   $   FLOW    $   *   :
        . :   +   %   #   %   +   : .
            . : · · · · · · : .
`;

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  protocol,
  onNavigate,
}) => {
  return (
    <section className="max-w-[1360px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      {/* Top Split: Headline + Subtle Technical ASCII Matrix (matching Screenshot 5!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7">
          <div className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            SETTLEWORKS PROTOCOL · CHAIN ID 4663
          </div>
          <h1
            className="mt-3 text-4xl sm:text-5xl lg:text-[54px] font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            4,663 engines. Materialize one, commission it, earn USDG.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Lock a whole <code className="font-mono font-semibold text-slate-900 dark:text-white">$WORKS</code> unit in escrow to materialize a verifiable Open Engine. Dissolve it back into{' '}
            <code className="font-mono">1 $WORKS</code> at any time, or Commission it permanently to share 65% of organic protocol fees in USDG.
          </p>
        </div>

        <div className="hidden lg:flex lg:col-span-5 justify-end">
          <pre
            aria-hidden="true"
            className="font-mono text-[11px] leading-[1.35] text-slate-400 dark:text-slate-600 select-none"
          >
            {ASCII_ENGINE_SEAL}
          </pre>
        </div>
      </div>

      {/* Hardware Telemetry Bezel (matching Screenshot 5 dark console!) */}
      <div className="mt-10 hardware-bezel rounded-2xl p-3 sm:p-4">
        <div className="hardware-screen rounded-xl p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pb-5 border-b border-white/10 font-mono">
            <div>
              <div className="text-[11px] text-slate-400 tracking-wider">PAID TO HOLDERS</div>
              <div className="mt-1.5 text-xl sm:text-2xl font-bold text-[#4FFFB0] tabular-nums">
                {protocol.totalRewardInUSDG.toLocaleString('en-US', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                <span className="text-sm font-normal">USDG</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 tracking-wider">30D VOLUME</div>
              <div className="mt-1.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
                ${(protocol.volume30dUSDG / 1000).toFixed(1)}k
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 tracking-wider">CANONICAL RESERVE</div>
              <div className="mt-1.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
                ${(protocol.curveReserveUSDG / 1000).toFixed(1)}k
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 tracking-wider">WORKS BURNED</div>
              <div className="mt-1.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
                {protocol.commissionedCount}.0
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 tracking-wider">COMMISSIONED</div>
              <div className="mt-1.5 text-xl sm:text-2xl font-bold text-[#4FFFB0] tabular-nums">
                {protocol.commissionedCount}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 tracking-wider">RESERVE IDS</div>
              <div className="mt-1.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
                {protocol.reserveCount}
              </div>
            </div>
          </div>

          <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-300">
              <span className="text-[#4FFFB0] font-semibold">IMMUTABLE FEE SPLITTER</span> · 65% to Commissioned Engines · 25% Protocol Treasury · 10% Security Fund ·{' '}
              <span className="text-slate-400">0% Transfer Tax</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('blueprint')}
              className="text-[#4FFFB0] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Verify On-Chain Invariants ↗
            </button>
          </div>
        </div>
      </div>

      {/* 01 / 02 / 03 Lifecycle Columns (matching Screenshot 5!) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div className="border-t border-slate-300 dark:border-white/15 pt-5">
          <div className="text-xs font-mono font-bold text-[#0284C7] dark:text-[#4FFFB0]">01</div>
          <h2 className="mt-2 text-xl font-display font-semibold text-slate-900 dark:text-white">
            Materialize $WORKS
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Acquire liquid <code className="font-mono">$WORKS</code> via the constant-product canonical vault with zero whitelist or launch tax. Lock 1 <code className="font-mono">$WORKS</code> in escrow to draw a verifiable Open Engine from the 4,663 reserve.
          </p>
        </div>

        <div className="border-t border-slate-300 dark:border-white/15 pt-5">
          <div className="text-xs font-mono font-bold text-[#0284C7] dark:text-[#4FFFB0]">02</div>
          <h2 className="mt-2 text-xl font-display font-semibold text-slate-900 dark:text-white">
            Dissolve or Commission
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every Open Engine is backed 1:1 and can be Dissolved back into 1 <code className="font-mono">$WORKS</code> at any time. Or perform a one-way Commission—burning the escrowed token to ignite its permanent reward seal.
          </p>
        </div>

        <div className="border-t border-slate-300 dark:border-white/15 pt-5">
          <div className="text-xs font-mono font-bold text-[#0284C7] dark:text-[#4FFFB0]">03</div>
          <h2 className="mt-2 text-xl font-display font-semibold text-slate-900 dark:text-white">
            Earn Organic USDG
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            65% of canonical trading fees (1%) and Settle Bazaar NFT fees (5%) flow directly to Commissioned Engines in USDG by generation weight (<code className="font-mono">1.00×</code> to <code className="font-mono">3.00×</code>). Claim anytime with zero lock-up.
          </p>
        </div>
      </div>

      {/* Bottom Action Bar (matching Screenshot 5 buttons) */}
      <div className="mt-10 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('swap')}
          className="px-5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-[#4FFFB0] text-[#091310] hover:bg-[#3be89b] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Buy $WORKS
        </button>
        <button
          type="button"
          onClick={() => onNavigate('desk')}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-medium bg-white dark:bg-[#151921] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Desk ({protocol.engines.filter((e) => e.owner === 'you').length})
        </button>
        <button
          type="button"
          onClick={() => onNavigate('bazaar')}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-medium bg-white dark:bg-[#151921] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Settle Bazaar
        </button>
        <button
          type="button"
          onClick={() => onNavigate('rarity')}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-medium bg-white dark:bg-[#151921] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Generations & Tracks
        </button>
        <button
          type="button"
          onClick={() => onNavigate('blueprint')}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-medium bg-white dark:bg-[#151921] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Blueprint & Invariants
        </button>
      </div>
    </section>
  );
};
