import React, { useMemo, useState } from 'react';
import {
  EngineGeneration,
  EngineItem,
  GENERATION_SPECS,
  ProtocolState,
  calculatePendingReward,
  quoteCanonicalSwap,
} from '../protocol/settleworksEngine';
import { IsometricEngineArtwork } from './IsometricEngineArtwork';
import { NavTab } from './SanctuaryHero3D';

interface DeskViewProps {
  protocol: ProtocolState;
  onConnectToggle: () => void;
  onMaterialize: (count: number) => void;
  onBuyAndMaterialize: (count: number) => void;
  onCommission: (engineId: number) => void;
  onDissolve: (engineId: number) => void;
  onClaim: (engineIds?: number[]) => void;
  onListEngine: (engineId: number, priceUSDG: number | null) => void;
  onInspect3D: (engine: EngineItem) => void;
  onNavigate: (tab: NavTab) => void;
}

export const DeskView: React.FC<DeskViewProps> = ({
  protocol,
  onConnectToggle,
  onMaterialize,
  onBuyAndMaterialize,
  onCommission,
  onDissolve,
  onClaim,
  onListEngine,
  onInspect3D,
  onNavigate,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Commissioned'>('all');
  const [genFilter, setGenFilter] = useState<'all' | EngineGeneration>('all');
  const [sortBy, setSortBy] = useState<'id' | 'generation' | 'pending'>('id');
  const [materializeCount, setMaterializeCount] = useState<number>(1);
  const [listingDraftId, setListingDraftId] = useState<number | null>(null);
  const [listingPriceInput, setListingPriceInput] = useState<string>('155');
  const [deskNotice, setDeskNotice] = useState<string | null>(null);

  const ownedEngines = useMemo(
    () => protocol.engines.filter((e) => e.owner === 'you' && e.status !== 'Reserve'),
    [protocol.engines]
  );

  const totalUserPendingUSDG = useMemo(
    () =>
      ownedEngines.reduce(
        (sum, e) => sum + calculatePendingReward(e, protocol.accRewardPerWeight),
        0
      ),
    [ownedEngines, protocol.accRewardPerWeight]
  );

  const filteredEngines = useMemo(() => {
    return ownedEngines
      .filter((e) => (statusFilter === 'all' ? true : e.status === statusFilter))
      .filter((e) => (genFilter === 'all' ? true : e.generation === genFilter))
      .sort((a, b) => {
        if (sortBy === 'id') return a.id - b.id;
        if (sortBy === 'generation') return b.weight - a.weight;
        return (
          calculatePendingReward(b, protocol.accRewardPerWeight) -
          calculatePendingReward(a, protocol.accRewardPerWeight)
        );
      });
  }, [ownedEngines, statusFilter, genFilter, sortBy, protocol.accRewardPerWeight]);

  const spotPriceUSDG = protocol.curveReserveUSDG / protocol.curveReserveWORKS;
  const estimatedUSDGForUnits = Number((materializeCount * spotPriceUSDG * 1.015).toFixed(2));
  const canMaterializeDirectly = protocol.userWORKS >= materializeCount;

  const triggerNotice = (msg: string) => {
    setDeskNotice(msg);
    window.setTimeout(() => setDeskNotice(null), 4000);
  };

  const handleMaterializeAction = () => {
    if (!protocol.walletConnected) {
      onConnectToggle();
      return;
    }
    if (canMaterializeDirectly) {
      onMaterialize(materializeCount);
      triggerNotice(
        `Materialized ${materializeCount} Open Engine${materializeCount > 1 ? 's' : ''} (${materializeCount}.00 $WORKS locked in escrow)`
      );
    } else {
      onBuyAndMaterialize(materializeCount);
      triggerNotice(
        `Swapped USDG for $WORKS and materialized ${materializeCount} Open Engine${
          materializeCount > 1 ? 's' : ''
        }`
      );
    }
  };

  // Check quote for 1 WORKS
  const singleBuyQuote = quoteCanonicalSwap(protocol, 'BUY_WORKS', spotPriceUSDG);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-10">
      {/* Page Header (matching Screenshot 3) */}
      <div>
        <div className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
          DESK
        </div>
        <h1 className="mt-1.5 text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white">
          Your engines
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
          Commission an Open Engine to make it permanent and start earning USDG. Claim rewards, dissolve back to{' '}
          <code className="font-mono">1 $WORKS</code>, or materialize more.
        </p>
      </div>

      {/* Hardware Telemetry Banner (matching Screenshot 3!) */}
      <div className="mt-7 hardware-bezel rounded-2xl p-3">
        <div className="hardware-screen rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
          <div className="md:border-r md:border-white/10 md:pr-8">
            <div className="text-[10px] text-slate-400 tracking-wider">PAID TO HOLDERS</div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {protocol.totalRewardInUSDG.toLocaleString('en-US', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              <span className="text-xs font-normal text-slate-400">USDG</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              all time · 65% of protocol fees
            </div>
          </div>

          <div className="flex-1 text-xs sm:text-sm text-slate-300">
            {protocol.walletConnected ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span>
                  Owned: <strong className="text-white">{ownedEngines.length} Engines</strong>
                </span>
                <span>
                  Open Escrow:{' '}
                  <strong className="text-[#F59E0B]">
                    {ownedEngines.filter((e) => e.status === 'Open').length} W
                  </strong>
                </span>
                <span>
                  Commissioned:{' '}
                  <strong className="text-[#4FFFB0]">
                    {ownedEngines.filter((e) => e.status === 'Commissioned').length}
                  </strong>
                </span>
                <span>
                  Unclaimed:{' '}
                  <strong className="text-[#4FFFB0] tabular-nums">
                    +{totalUserPendingUSDG.toFixed(2)} USDG
                  </strong>
                </span>
              </div>
            ) : (
              <span>Connect a wallet to inspect, commission, or dissolve your Settle Engines.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {protocol.walletConnected ? (
              <button
                type="button"
                disabled={totalUserPendingUSDG <= 0}
                onClick={() => {
                  onClaim();
                  triggerNotice(`Claimed +${totalUserPendingUSDG.toFixed(2)} USDG to your wallet`);
                }}
                className="px-4 py-2 rounded bg-[#4FFFB0]/20 border border-[#4FFFB0] text-[#4FFFB0] hover:bg-[#4FFFB0] hover:text-[#091310] disabled:opacity-40 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                [ CLAIM {totalUserPendingUSDG.toFixed(2)} USDG ]
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectToggle}
                className="px-4 py-2 rounded bg-[#4FFFB0]/20 border border-[#4FFFB0] text-[#4FFFB0] hover:bg-[#4FFFB0] hover:text-[#091310] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                [ CONNECT WALLET ]
              </button>
            )}
          </div>
        </div>
      </div>

      {deskNotice && (
        <div
          role="status"
          className="mt-4 px-4 py-2.5 rounded-xl bg-[#0B1014] border border-[#4FFFB0]/40 text-[#4FFFB0] font-mono text-xs flex items-center justify-between"
        >
          <span>{deskNotice}</span>
          <button
            type="button"
            onClick={() => setDeskNotice(null)}
            className="text-slate-400 hover:text-white ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Layout (matching Screenshot 3: Left Engine Grid + Right Materialize & Rewards Sidebar) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Engine Inventory (8 cols) */}
        <div className="lg:col-span-8">
          {/* Controls Row: Segmented Status Filter + Generation Select + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
            {/* Segmented Tab Bar: All | Open | Commissioned */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-[#141820] border border-slate-300/80 dark:border-white/10">
              {(['all', 'Open', 'Commissioned'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-[#222834] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>

            {/* Right Filters: Generation Select + Sort Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="desk-gen-select" className="sr-only">
                Filter by generation
              </label>
              <select
                id="desk-gen-select"
                value={genFilter}
                onChange={(e) => setGenFilter(e.target.value as 'all' | EngineGeneration)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-[#141820] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 focus:outline-none"
              >
                <option value="all">All generations</option>
                <option value="Relay">Relay (1.00×)</option>
                <option value="Ledger">Ledger (1.25×)</option>
                <option value="Vault">Vault (1.75×)</option>
                <option value="Prime">Prime (3.00×)</option>
              </select>

              {(['id', 'generation', 'pending'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortBy(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sortBy === mode
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/15 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  by {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Engine Cards Grid */}
          {!protocol.walletConnected ? (
            <div className="py-24 text-center font-mono text-sm text-slate-500">
              Engines appear here once a wallet is connected.
            </div>
          ) : filteredEngines.length === 0 ? (
            <div className="py-20 text-center bg-white/50 dark:bg-[#12161E]/50 rounded-2xl border border-slate-200 dark:border-white/10 mt-6 p-6">
              <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
                No engines match the active filter. Materialize an Open Engine using the panel on the right.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredEngines.map((engine) => {
                const pending = calculatePendingReward(engine, protocol.accRewardPerWeight);
                const genSpec = GENERATION_SPECS[engine.generation];
                const isListingThis = listingDraftId === engine.id;

                return (
                  <div
                    key={engine.id}
                    className="group bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200/90 dark:border-white/10 p-3 flex flex-col justify-between transition-all hover:border-slate-400 dark:hover:border-white/25"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onInspect3D(engine)}
                        className="w-full text-left focus:outline-none cursor-pointer"
                      >
                        <IsometricEngineArtwork
                          engine={engine}
                          className="w-full aspect-square rounded-xl"
                        />
                      </button>

                      <div className="mt-3 px-1">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onInspect3D(engine)}
                            className="font-mono font-bold text-sm text-slate-900 dark:text-white hover:underline cursor-pointer"
                          >
                            Engine #{engine.id}
                          </button>
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {engine.generation} · {genSpec.weight.toFixed(2)}×
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between font-mono text-xs">
                          {engine.status === 'Commissioned' ? (
                            <span className="text-[#059669] dark:text-[#4FFFB0] tabular-nums">
                              +{pending.toFixed(4)} USDG unclaimed
                            </span>
                          ) : (
                            <span className="text-[#D97706] dark:text-[#F59E0B]">
                              Escrow: 1.00 $WORKS (Reversible)
                            </span>
                          )}
                          {engine.listedPriceUSDG && (
                            <span className="text-[#0284C7] dark:text-[#38BDF8] tabular-nums">
                              Listed {engine.listedPriceUSDG} USDG
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Interactive Controls */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                      {engine.status === 'Open' ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onCommission(engine.id);
                              triggerNotice(
                                `Commissioned Engine #${engine.id}! 1.00 $WORKS burned; ${engine.weight.toFixed(2)}x weight active.`
                              );
                            }}
                            className="py-1.5 px-2 rounded-lg bg-[#4FFFB0] text-[#091310] font-mono text-[11px] font-semibold hover:bg-[#3be89b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Commission
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDissolve(engine.id);
                              triggerNotice(
                                `Dissolved Open Engine #${engine.id} → +1.00 $WORKS returned to wallet.`
                              );
                            }}
                            className="py-1.5 px-2 rounded-lg border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-mono text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Dissolve (1W)
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={pending <= 0}
                            onClick={() => {
                              onClaim([engine.id]);
                              triggerNotice(
                                `Claimed +${pending.toFixed(2)} USDG from Engine #${engine.id}`
                              );
                            }}
                            className="py-1.5 px-2 rounded-lg bg-[#4FFFB0] text-[#091310] disabled:opacity-40 font-mono text-[11px] font-semibold hover:bg-[#3be89b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Claim USDG
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (engine.listedPriceUSDG) {
                                onListEngine(engine.id, null);
                                triggerNotice(`Unlisted Engine #${engine.id} from Settle Bazaar`);
                              } else {
                                setListingDraftId(isListingThis ? null : engine.id);
                              }
                            }}
                            className="py-1.5 px-2 rounded-lg border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-mono text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {engine.listedPriceUSDG ? 'Unlist' : 'List on Bazaar'}
                          </button>
                        </div>
                      )}

                      {isListingThis && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="number"
                            min="1"
                            value={listingPriceInput}
                            onChange={(e) => setListingPriceInput(e.target.value)}
                            aria-label={`Listing price in USDG for Engine #${engine.id}`}
                            className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const p = parseFloat(listingPriceInput);
                              if (p > 0) {
                                onListEngine(engine.id, p);
                                setListingDraftId(null);
                                triggerNotice(`Listed Engine #${engine.id} at ${p.toFixed(2)} USDG`);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#38BDF8] text-[#081018] font-mono text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onInspect3D(engine)}
                        className="w-full py-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Inspect 3D Chamber →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Materialize More Engines & Reward Rates (4 cols — matching Screenshot 3!) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Materialize / Buy Box */}
          <div className="bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
            <div className="text-[11px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              MATERIALIZE MORE ENGINES
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 dark:bg-[#0D1016] border border-slate-300/80 dark:border-white/15 px-4 py-3 font-mono">
              <input
                type="number"
                min={1}
                max={10}
                value={materializeCount}
                onChange={(e) =>
                  setMaterializeCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                }
                aria-label="Number of engines to materialize"
                className="w-24 bg-transparent text-2xl font-bold text-slate-900 dark:text-white focus:outline-none tabular-nums"
              />
              <span className="px-2.5 py-1 rounded bg-slate-200 dark:bg-white/10 text-xs text-slate-700 dark:text-slate-300">
                $WORKS
              </span>
            </div>

            {/* +1 / +3 / +5 quick unit buttons (matching Screenshot 3) */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[1, 3, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaterializeCount(n)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                      materializeCount === n
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                        : 'border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Bal: {protocol.userWORKS.toFixed(2)} W
              </div>
            </div>

            <button
              type="button"
              onClick={handleMaterializeAction}
              className="mt-4 w-full py-3 px-4 rounded-xl bg-[#4FFFB0] text-[#091310] font-mono text-sm font-bold hover:bg-[#3be89b] shadow-lg shadow-[#4FFFB0]/10 transition-colors cursor-pointer"
            >
              {canMaterializeDirectly
                ? `Materialize ${materializeCount} Engine${materializeCount > 1 ? 's' : ''} (${materializeCount} W)`
                : `Buy & Materialize (~${estimatedUSDGForUnits} USDG)`}
            </button>

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => onNavigate('swap')}
                className="text-[#0284C7] dark:text-[#4FFFB0] hover:underline cursor-pointer"
              >
                CANONICAL SWAP →
              </button>
              <span className="text-slate-500 tabular-nums">
                1 W ≈ {singleBuyQuote.effectivePriceUSDG.toFixed(2)} USDG
              </span>
            </div>
          </div>

          {/* REWARDS Breakdown Panel (matching Screenshot 3 bottom-right!) */}
          <div className="bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 font-mono">
            <div className="text-[11px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              REWARDS
            </div>

            <div className="mt-3 flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#4FFFB0]/20 border border-[#4FFFB0]/50 text-[#059669] dark:text-[#4FFFB0] text-xs font-bold flex items-center justify-center">
                  U
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">USDG</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                0.4820 / weight · 24h
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              Additional pre-funded Reward Tracks (ETH, Partner USDG, or gated Stock Token tracks) appear as separate claimable rows below.
            </p>

            {/* Generation Rates */}
            <div className="mt-4 space-y-2.5 text-xs">
              {(['Relay', 'Ledger', 'Vault', 'Prime'] as EngineGeneration[]).map((gen) => {
                const spec = GENERATION_SPECS[gen];
                const estDay = (0.482 * spec.weight).toFixed(3);
                const commForGen = Math.round(
                  protocol.commissionedCount *
                    (gen === 'Relay' ? 0.4 : gen === 'Ledger' ? 0.3 : gen === 'Vault' ? 0.2 : 0.1)
                );
                return (
                  <div key={gen} className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      <span
                        className="inline-block w-2 h-2 rounded-xs mr-2"
                        style={{ backgroundColor: spec.colorHex }}
                      />
                      {gen} · {commForGen} comm
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      ≈{estDay} USDG/day
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Rewards to holders · all time
                </span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {protocol.totalRewardInUSDG.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}{' '}
                  USDG
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total commissioned weight</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {protocol.totalCommissionedWeight.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
