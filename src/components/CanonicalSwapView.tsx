import React, { useState } from 'react';
import {
  ProtocolState,
  quoteCanonicalSwap,
} from '../protocol/settleworksEngine';
import { ArrowDownUp, ShieldCheck, Layers } from 'lucide-react';

interface CanonicalSwapViewProps {
  protocol: ProtocolState;
  onExecuteSwap: (direction: 'BUY_WORKS' | 'SELL_WORKS', amount: number) => void;
  onMaterialize: (count: number) => void;
}

export const CanonicalSwapView: React.FC<CanonicalSwapViewProps> = ({
  protocol,
  onExecuteSwap,
  onMaterialize,
}) => {
  const [direction, setDirection] = useState<'BUY_WORKS' | 'SELL_WORKS'>('BUY_WORKS');
  const [amountInput, setAmountInput] = useState<string>('500');
  const [activeSubTab, setActiveSubTab] = useState<'swap' | 'bridge'>('swap');
  const [swapFeedback, setSwapFeedback] = useState<string | null>(null);

  const numericAmount = parseFloat(amountInput) || 0;
  const quote = quoteCanonicalSwap(protocol, direction, numericAmount);
  const kConstant = protocol.curveReserveUSDG * protocol.curveReserveWORKS;

  const handleFlipDirection = () => {
    if (direction === 'BUY_WORKS') {
      setDirection('SELL_WORKS');
      setAmountInput('1');
    } else {
      setDirection('BUY_WORKS');
      setAmountInput('500');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setSwapFeedback('Enter an amount greater than 0.');
      return;
    }
    if (direction === 'BUY_WORKS' && numericAmount > protocol.userUSDG) {
      setSwapFeedback('Insufficient USDG balance.');
      return;
    }
    if (direction === 'SELL_WORKS' && numericAmount > protocol.userWORKS) {
      setSwapFeedback('Insufficient $WORKS balance.');
      return;
    }

    onExecuteSwap(direction, numericAmount);
    setSwapFeedback(
      direction === 'BUY_WORKS'
        ? `Confirmed: Acquired +${quote.outputAmount.toFixed(4)} $WORKS (${quote.enginesShareUSDG.toFixed(
            2
          )} USDG streamed to Commissioned Engines)`
        : `Confirmed: Received +${quote.outputAmount.toFixed(2)} USDG (${quote.enginesShareUSDG.toFixed(
            2
          )} USDG streamed to Commissioned Engines)`
    );
    window.setTimeout(() => setSwapFeedback(null), 5000);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Canonical Curve Swap & Materialize Console (7 cols) */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400">
                CANONICAL CONSTANT-PRODUCT VAULT
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">
                Liquid $WORKS & Bridge Terminal
              </h1>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-[#141820] border border-slate-300 dark:border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('swap')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'swap'
                    ? 'bg-white dark:bg-[#222834] text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Canonical Swap
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('bridge')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'bridge'
                    ? 'bg-white dark:bg-[#222834] text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Chain 4663 Bridge
              </button>
            </div>
          </div>

          {activeSubTab === 'swap' ? (
            <div className="hardware-bezel rounded-2xl p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="hardware-screen rounded-xl p-5 sm:p-6 font-mono">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-white/10">
                  <span>PAIR: $WORKS / USDG</span>
                  <span>0% TRANSFER TAX · 1.00% CANONICAL FEE</span>
                </div>

                {/* Input Box */}
                <div className="mt-4 bg-black/40 border border-white/15 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <label htmlFor="canonical-swap-input">
                      {direction === 'BUY_WORKS' ? 'YOU PAY (USDG)' : 'YOU SELL ($WORKS)'}
                    </label>
                    <span className="tabular-nums">
                      Balance:{' '}
                      {direction === 'BUY_WORKS'
                        ? `${protocol.userUSDG.toFixed(2)} USDG`
                        : `${protocol.userWORKS.toFixed(4)} $WORKS`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <input
                      id="canonical-swap-input"
                      type="number"
                      step="any"
                      min="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white focus:outline-none tabular-nums"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAmountInput(
                            direction === 'BUY_WORKS'
                              ? String(Math.floor(protocol.userUSDG * 0.5))
                              : String(Number((protocol.userWORKS * 0.5).toFixed(2)))
                          )
                        }
                        className="px-2 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAmountInput(
                            direction === 'BUY_WORKS'
                              ? String(protocol.userUSDG)
                              : String(protocol.userWORKS)
                          )
                        }
                        className="px-2 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20 text-[#4FFFB0] cursor-pointer"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>

                {/* Flip Button */}
                <div className="my-3 flex justify-center">
                  <button
                    type="button"
                    onClick={handleFlipDirection}
                    aria-label="Switch Buy and Sell direction"
                    className="p-2.5 rounded-xl bg-[#161E27] border border-white/15 text-[#4FFFB0] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <ArrowDownUp className="w-4 h-4" />
                  </button>
                </div>

                {/* Output Box */}
                <div className="bg-black/40 border border-white/15 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {direction === 'BUY_WORKS'
                        ? 'YOU RECEIVE ($WORKS)'
                        : 'YOU RECEIVE (USDG)'}
                    </span>
                    <span className="tabular-nums">
                      Effective: {quote.effectivePriceUSDG.toFixed(2)} USDG / W
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-bold text-[#4FFFB0] tabular-nums">
                      {direction === 'BUY_WORKS'
                        ? quote.outputAmount.toFixed(4)
                        : quote.outputAmount.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-300">
                      {direction === 'BUY_WORKS' ? '$WORKS' : 'USDG'}
                    </span>
                  </div>
                </div>

                {/* On-Chain Fee Split Breakdown */}
                <div className="mt-4 p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Canonical Trading Fee (1.00%)</span>
                    <span className="text-white tabular-nums">{quote.feeUSDG.toFixed(2)} USDG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">→ 65% to Commissioned Engines</span>
                    <span className="text-[#4FFFB0] tabular-nums">
                      +{quote.enginesShareUSDG.toFixed(2)} USDG
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">→ 25% Protocol Treasury / 10% Security</span>
                    <span className="text-slate-300 tabular-nums">
                      {(quote.treasuryShareUSDG + quote.securityShareUSDG).toFixed(2)} USDG
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price Impact</span>
                    <span className="text-slate-300 tabular-nums">
                      {quote.priceImpactPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {swapFeedback && (
                  <div
                    role="status"
                    className="mt-3 p-3 rounded-lg bg-[#4FFFB0]/15 border border-[#4FFFB0]/40 text-[#4FFFB0] text-xs"
                  >
                    {swapFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-4 w-full py-3.5 px-4 rounded-xl bg-[#4FFFB0] text-[#091310] font-bold text-sm hover:bg-[#3be89b] transition-colors cursor-pointer"
                >
                  {direction === 'BUY_WORKS'
                    ? `[ SWAP USDG FOR ${quote.outputAmount.toFixed(3)} $WORKS ]`
                    : `[ SELL $WORKS FOR ${quote.outputAmount.toFixed(2)} USDG ]`}
                </button>
              </form>
            </div>
          ) : (
            /* Robinhood Chain (4663) Bridging Panel (Section 18 Compliance!) */
            <div className="hardware-bezel rounded-2xl p-3 sm:p-4">
              <div className="hardware-screen rounded-xl p-5 sm:p-6 font-mono space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <div className="text-xs text-[#4FFFB0] font-semibold">
                    ROBINHOOD CHAIN (ID 4663) · BRIDGING ROUTES & TRUST MODELS
                  </div>
                  <p className="text-xs text-slate-400 font-sans mt-1">
                    Settleworks discloses exact settlement times and trust assumptions for every bridge route. Not all routes are instant or trustless.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-[#4FFFB0]/30">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        Canonical Arbitrum Rollup Bridge (Default Trustless)
                      </span>
                      <span className="text-[#4FFFB0]">RECOMMENDED</span>
                    </div>
                    <div className="mt-1.5 text-slate-400 font-sans">
                      Deposit ~10 minutes · Withdrawal ~7 days challenge window · Secured directly by Ethereum L1 blobs & canonical rollup contracts.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        Third-Party Liquidity Routers (Relay / Across / Stargate / CCIP)
                      </span>
                      <span className="text-[#F59E0B]">EXTERNAL RISK</span>
                    </div>
                    <div className="mt-1.5 text-slate-400 font-sans">
                      Deposit ~1–3 minutes · Carries third-party relayer, oracle, or liquidity pool trust assumptions. Verify official USDG contract registry address on Chain 4663 before bridging.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Constant-Product Liquidity Proof & Instant Materialize (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-[#4FFFB0]" />
              <span>PERMANENTLY LOCKED CANONICAL VAULT</span>
            </div>
            <p className="mt-2 text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
              100% of initial <code className="font-mono">$WORKS</code> supply is seeded into the Canonical Curve. There are no LP tokens, no <code className="font-mono">withdrawLiquidity</code> function, and zero team token allocation.
            </p>

            <div className="mt-4 space-y-2.5 text-xs pt-3 border-t border-slate-200 dark:border-white/10">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserve USDG (Q)</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {protocol.curveReserveUSDG.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  USDG
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserve $WORKS (T)</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {protocol.curveReserveWORKS.toFixed(4)} $WORKS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invariant Product (k = Q × T)</span>
                <span className="font-semibold text-[#0284C7] dark:text-[#38BDF8] tabular-nums">
                  {(kConstant / 1_000_000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>DIRECT CONTROLLER ESCROW (MATERIALIZE)</span>
            </div>
            <p className="mt-2 text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
              Have whole <code className="font-mono">$WORKS</code> units in your wallet? Lock <code className="font-mono">1.00 $WORKS</code> in EngineController to draw a verifiable Open Engine from the remaining {protocol.reserveCount} Reserve IDs.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-500">Your Liquid $WORKS</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {protocol.userWORKS.toFixed(4)} W
              </span>
            </div>
            <button
              type="button"
              disabled={protocol.userWORKS < 1}
              onClick={() => {
                onMaterialize(1);
                setSwapFeedback('Materialized 1 Open Engine (1.00 $WORKS locked in EngineController)');
              }}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-40 font-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Lock 1.00 $WORKS → Materialize Open Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
