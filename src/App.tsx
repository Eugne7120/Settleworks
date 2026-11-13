/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Sun, Moon, ShieldCheck, Wallet } from 'lucide-react';
import {
  CollectionOffer,
  EngineItem,
  ProtocolState,
  buyBazaarEngines,
  claimEngineRewards,
  commissionEngine,
  createInitialProtocolState,
  dissolveEngine,
  executeCanonicalSwap,
  listEngineOnBazaar,
  materializeEngines,
  quoteCanonicalSwap,
  verifyProtocolInvariants,
} from './protocol/settleworksEngine';
import { NavTab, SanctuaryHero3D } from './components/SanctuaryHero3D';
import { OverviewSection } from './components/OverviewSection';
import { DeskView } from './components/DeskView';
import { BazaarView } from './components/BazaarView';
import { CanonicalSwapView } from './components/CanonicalSwapView';
import { RarityTracksView } from './components/RarityTracksView';
import { BlueprintInvariantsView } from './components/BlueprintInvariantsView';
import { EngineInspectorModal3D } from './components/EngineInspectorModal3D';

export default function App() {
  const [protocol, setProtocol] = useState<ProtocolState>(() => createInitialProtocolState());
  const [activeTab, setActiveTab] = useState<NavTab>('hall');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [inspectedEngineId, setInspectedEngineId] = useState<number | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Smooth GSAP Page Transition on tab change
  const handleNavigate = (nextTab: NavTab) => {
    if (nextTab === activeTab) return;
    const el = pageContainerRef.current;
    if (!el) {
      setActiveTab(nextTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    gsap.to(el, {
      opacity: 0,
      y: 10,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: () => {
        setActiveTab(nextTab);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        gsap.fromTo(
          el,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.28, ease: 'power3.out', clearProps: 'transform' }
        );
      },
    });
  };

  // Handlers wired end-to-end to pure Settleworks state machine
  const handleConnectToggle = () => {
    setProtocol((prev) => ({
      ...prev,
      walletConnected: !prev.walletConnected,
    }));
  };

  const handleExecuteSwap = (direction: 'BUY_WORKS' | 'SELL_WORKS', amount: number) => {
    setProtocol((prev) => executeCanonicalSwap(prev, direction, amount));
  };

  const handleMaterialize = (count = 1) => {
    setProtocol((prev) => materializeEngines(prev, count));
  };

  const handleBuyAndMaterialize = (count: number) => {
    setProtocol((prev) => {
      const neededWorks = Math.max(0, count - prev.userWORKS);
      let nextState = prev;
      if (neededWorks > 0) {
        const spot = prev.curveReserveUSDG / prev.curveReserveWORKS;
        const estUSDG = neededWorks * spot * 1.03;
        const q = quoteCanonicalSwap(prev, 'BUY_WORKS', estUSDG);
        if (q.outputAmount >= neededWorks && prev.userUSDG >= estUSDG) {
          nextState = executeCanonicalSwap(prev, 'BUY_WORKS', Number(estUSDG.toFixed(2)));
        }
      }
      return materializeEngines(nextState, count);
    });
  };

  const handleCommission = (engineId: number) => {
    setProtocol((prev) => commissionEngine(prev, engineId));
  };

  const handleDissolve = (engineId: number) => {
    setProtocol((prev) => dissolveEngine(prev, engineId));
  };

  const handleClaim = (engineIds?: number[]) => {
    setProtocol((prev) => claimEngineRewards(prev, engineIds));
  };

  const handleListEngine = (engineId: number, priceUSDG: number | null) => {
    setProtocol((prev) => listEngineOnBazaar(prev, engineId, priceUSDG));
  };

  const handleBuyBazaar = (engineIds: number[]) => {
    setProtocol((prev) => buyBazaarEngines(prev, engineIds));
  };

  const handlePlaceOffer = (offer: Omit<CollectionOffer, 'id'>) => {
    setProtocol((prev) => ({
      ...prev,
      offers: [
        {
          ...offer,
          id: `off-${Date.now()}`,
        },
        ...prev.offers,
      ],
    }));
  };

  const handleToggleGuardianPause = (type: 'materialize' | 'commission') => {
    setProtocol((prev) =>
      type === 'materialize'
        ? { ...prev, guardianPauseMaterialize: !prev.guardianPauseMaterialize }
        : { ...prev, guardianPauseCommission: !prev.guardianPauseCommission }
    );
  };

  const inspectedEngine: EngineItem | null =
    inspectedEngineId !== null
      ? protocol.engines.find((e) => e.id === inspectedEngineId) || null
      : null;

  const invariantReport = verifyProtocolInvariants(protocol);

  const navItems: Array<{ id: NavTab; label: string }> = [
    { id: 'hall', label: 'Hall' },
    { id: 'swap', label: 'Swap' },
    { id: 'desk', label: 'Desk' },
    { id: 'bazaar', label: 'Bazaar' },
    { id: 'Blueprint'.toLowerCase() as NavTab, label: 'Blueprint' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F5F4EF] text-[#111317] dark:bg-[#0B0D10] dark:text-[#F3F4F6] transition-colors duration-200"
      data-state={activeTab}
    >
      {/* Top Bar: Strict 3-Zone Contract (Brand Wordmark — 5 Nav Links — 1 Primary Action) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 bg-[#F5F4EF]/95 dark:bg-[#0B0D10]/95 border-b border-black/10 dark:border-white/10">
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#hall"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate('hall');
          }}
          className="text-base sm:text-lg font-mono font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Settleworks <span className="text-[#059669] dark:text-[#4FFFB0]">Engines</span>
        </a>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-mono text-slate-600 dark:text-slate-400"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(item.id);
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === item.id
                  ? 'text-slate-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#059669] dark:decoration-[#4FFFB0]'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Wallet Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleConnectToggle}
            className="px-4 py-2 text-xs font-mono font-semibold text-white bg-[#14171D] dark:bg-[#191E26] border border-black/10 dark:border-white/15 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
          >
            <Wallet className="w-3.5 h-3.5 text-[#4FFFB0]" />
            <span>
              {protocol.walletConnected
                ? `${protocol.walletAddress} · ${protocol.userUSDG.toFixed(0)} USDG`
                : 'Connect wallet'}
            </span>
          </button>
        </div>
      </header>

      {/* Secondary Workspace Utility Bar (Mobile Nav + Generations Tab + Invariant Status + Theme Switch) */}
      <div className="bg-[#ECEAE2] dark:bg-[#10141B] border-b border-black/10 dark:border-white/10 px-4 sm:px-8 py-2">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Mobile & Secondary View Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {(['hall', 'swap', 'desk', 'bazaar', 'rarity', 'blueprint'] as NavTab[]).map((tab) => {
              const labels: Record<NavTab, string> = {
                hall: '3D Sanctuary',
                swap: 'Canonical Swap',
                desk: `Desk (${protocol.engines.filter((e) => e.owner === 'you' && e.status !== 'Reserve').length})`,
                bazaar: 'Settle Bazaar (OTC)',
                rarity: 'Generations & Tracks',
                blueprint: 'Invariants & Blueprint',
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleNavigate(tab)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white dark:bg-[#4FFFB0] dark:text-[#091310] font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Right Telemetry & Theme Switch */}
          <div className="flex items-center gap-4 ml-auto">
            {protocol.walletConnected && (
              <div className="hidden sm:flex items-center gap-3 text-slate-600 dark:text-slate-300 tabular-nums">
                <span>
                  Liquid: <strong className="text-slate-900 dark:text-white">{protocol.userWORKS.toFixed(2)} $WORKS</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Balance: <strong className="text-slate-900 dark:text-white">{protocol.userUSDG.toFixed(2)} USDG</strong>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleNavigate('blueprint')}
              className="hidden lg:inline-flex items-center gap-1.5 text-[#059669] dark:text-[#4FFFB0] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Invariants: {invariantReport.allValid ? '4,663 / 4,663 Verified' : 'Check State'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181D26] border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Animated Page Container */}
      <main ref={pageContainerRef} className="flex-1">
        {activeTab === 'hall' && (
          <>
            <SanctuaryHero3D
              protocol={protocol}
              isDark={isDark}
              onNavigate={handleNavigate}
              onExecuteSwap={handleExecuteSwap}
              onMaterializeQuick={() => {
                if (protocol.userWORKS >= 1) {
                  handleMaterialize(1);
                } else {
                  handleBuyAndMaterialize(1);
                }
                handleNavigate('desk');
              }}
            />
            <OverviewSection protocol={protocol} onNavigate={handleNavigate} />
          </>
        )}

        {activeTab === 'swap' && (
          <CanonicalSwapView
            protocol={protocol}
            onExecuteSwap={handleExecuteSwap}
            onMaterialize={handleMaterialize}
          />
        )}

        {activeTab === 'desk' && (
          <DeskView
            protocol={protocol}
            onConnectToggle={handleConnectToggle}
            onMaterialize={handleMaterialize}
            onBuyAndMaterialize={handleBuyAndMaterialize}
            onCommission={handleCommission}
            onDissolve={handleDissolve}
            onClaim={handleClaim}
            onListEngine={handleListEngine}
            onInspect3D={(eng) => setInspectedEngineId(eng.id)}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'bazaar' && (
          <BazaarView
            protocol={protocol}
            onBuyEngines={handleBuyBazaar}
            onPlaceOffer={handlePlaceOffer}
            onInspect3D={(eng) => setInspectedEngineId(eng.id)}
          />
        )}

        {activeTab === 'rarity' && (
          <RarityTracksView
            protocol={protocol}
            onInspect3D={(eng) => setInspectedEngineId(eng.id)}
          />
        )}

        {activeTab === 'blueprint' && (
          <BlueprintInvariantsView
            protocol={protocol}
            onToggleGuardianPause={handleToggleGuardianPause}
          />
        )}
      </main>

      {/* Interactive 360° Three.js Engine Inspector Modal */}
      <EngineInspectorModal3D
        engine={inspectedEngine}
        accRewardPerWeight={protocol.accRewardPerWeight}
        userUSDG={protocol.userUSDG}
        onClose={() => setInspectedEngineId(null)}
        onCommission={handleCommission}
        onDissolve={handleDissolve}
        onClaim={(id) => handleClaim([id])}
        onBuyBazaar={(id) => handleBuyBazaar([id])}
      />

      {/* Footer with Mandatory Section 18 Independence & Risk Disclosure */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-[#ECEAE2]/70 dark:bg-[#090B0E] py-8 px-4 sm:px-8 font-mono text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="text-slate-800 dark:text-slate-200 font-semibold">
              Settleworks Protocol · 4,663 Settle Engines · Robinhood Chain (Chain ID 4663)
            </div>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
              Settleworks adalah proyek independen yang dibangun di Robinhood Chain dan tidak berafiliasi dengan, disponsori, atau didukung oleh Robinhood Markets. Reward bergantung sepenuhnya pada volume transaksi organik; tidak ada APY tetap atau dividen yang dijamin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('blueprint')}
              className="hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Invariants
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('rarity')}
              className="hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Generations
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('bazaar')}
              className="hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Settle Bazaar
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('desk')}
              className="hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Engine Desk
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
