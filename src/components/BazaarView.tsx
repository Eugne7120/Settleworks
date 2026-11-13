import React, { useMemo, useState } from 'react';
import {
  CollectionOffer,
  EngineGeneration,
  EngineItem,
  GENERATION_SPECS,
  ProtocolState,
  calculatePendingReward,
} from '../protocol/settleworksEngine';
import { IsometricEngineArtwork } from './IsometricEngineArtwork';
import { Search, Grid, LayoutGrid, SlidersHorizontal, ChevronDown, Plus, Check } from 'lucide-react';

interface BazaarViewProps {
  protocol: ProtocolState;
  onBuyEngines: (engineIds: number[]) => void;
  onPlaceOffer: (offer: Omit<CollectionOffer, 'id'>) => void;
  onInspect3D: (engine: EngineItem) => void;
}

export const BazaarView: React.FC<BazaarViewProps> = ({
  protocol,
  onBuyEngines,
  onPlaceOffer,
  onInspect3D,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'listed' | 'unlisted' | 'owned'>('listed');
  const [selectedGenerations, setSelectedGenerations] = useState<EngineGeneration[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'price_asc' | 'price_desc' | 'reward_desc' | 'weight_desc'>('price_asc');
  const [denseGrid, setDenseGrid] = useState<boolean>(false);
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);
  const [selectedChassis, setSelectedChassis] = useState<string | null>(null);

  // Sweep & Selection state
  const [sweepMode, setSweepMode] = useState<'buy' | 'sell'>('buy');
  const [sweepCount, setSweepCount] = useState<number>(0);
  const [manualSelectedIds, setManualSelectedIds] = useState<number[]>([]);

  // Offer Modal state
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [offerPriceInput, setOfferPriceInput] = useState<string>('138.50');
  const [offerQtyInput, setOfferQtyInput] = useState<string>('1');
  const [offerGenTarget, setOfferGenTarget] = useState<EngineGeneration | 'ANY'>('ANY');
  const [bazaarNotice, setBazaarNotice] = useState<string | null>(null);

  const visibleCatalog = useMemo(
    () => protocol.engines.filter((e) => e.status !== 'Reserve'),
    [protocol.engines]
  );

  const listedCatalog = useMemo(
    () => visibleCatalog.filter((e) => e.listedPriceUSDG !== null),
    [visibleCatalog]
  );

  const floorPriceUSDG = useMemo(() => {
    const prices = listedCatalog
      .map((e) => e.listedPriceUSDG)
      .filter((p): p is number => p !== null);
    return prices.length > 0 ? Math.min(...prices) : 142.5;
  }, [listedCatalog]);

  const topOfferUSDG = useMemo(() => {
    return protocol.offers.length > 0
      ? Math.max(...protocol.offers.map((o) => o.priceUSDG))
      : 138.0;
  }, [protocol.offers]);

  const filteredEngines = useMemo(() => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const q = searchQuery.trim().toLowerCase();

    return visibleCatalog
      .filter((e) => {
        if (statusFilter === 'listed' && e.listedPriceUSDG === null) return false;
        if (statusFilter === 'unlisted' && e.listedPriceUSDG !== null) return false;
        if (statusFilter === 'owned' && e.owner !== 'you') return false;
        if (selectedGenerations.length > 0 && !selectedGenerations.includes(e.generation)) {
          return false;
        }
        if (Number.isFinite(min) && (e.listedPriceUSDG === null || e.listedPriceUSDG < min)) {
          return false;
        }
        if (Number.isFinite(max) && (e.listedPriceUSDG === null || e.listedPriceUSDG > max)) {
          return false;
        }
        if (selectedChassis && e.traits.chassis !== selectedChassis) {
          return false;
        }
        if (q) {
          const matchId = String(e.id).includes(q);
          const matchGen = e.generation.toLowerCase().includes(q);
          const matchTrait =
            e.traits.chassis.toLowerCase().includes(q) ||
            e.traits.display.toLowerCase().includes(q) ||
            e.traits.platen.toLowerCase().includes(q);
          return matchId || matchGen || matchTrait;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'price_asc') {
          return (a.listedPriceUSDG ?? 999999) - (b.listedPriceUSDG ?? 999999);
        }
        if (sortOrder === 'price_desc') {
          return (b.listedPriceUSDG ?? 0) - (a.listedPriceUSDG ?? 0);
        }
        if (sortOrder === 'weight_desc') {
          return b.weight - a.weight;
        }
        return (
          calculatePendingReward(b, protocol.accRewardPerWeight) -
          calculatePendingReward(a, protocol.accRewardPerWeight)
        );
      });
  }, [
    visibleCatalog,
    statusFilter,
    selectedGenerations,
    minPrice,
    maxPrice,
    selectedChassis,
    searchQuery,
    sortOrder,
    protocol.accRewardPerWeight,
  ]);

  const buyableSorted = useMemo(
    () =>
      filteredEngines.filter((e) => e.listedPriceUSDG !== null && e.owner !== 'you'),
    [filteredEngines]
  );

  const highlightedSelectedIds = useMemo(() => {
    if (manualSelectedIds.length > 0) return manualSelectedIds;
    if (sweepCount > 0) {
      return buyableSorted.slice(0, sweepCount).map((e) => e.id);
    }
    return [];
  }, [manualSelectedIds, sweepCount, buyableSorted]);

  const activeBuyIds = useMemo(() => {
    if (highlightedSelectedIds.length > 0) return highlightedSelectedIds;
    return buyableSorted.length > 0 ? [buyableSorted[0].id] : [];
  }, [highlightedSelectedIds, buyableSorted]);

  const activeTotalUSDG = useMemo(() => {
    const idSet = new Set(activeBuyIds);
    return buyableSorted
      .filter((e) => idSet.has(e.id))
      .reduce((sum, e) => sum + (e.listedPriceUSDG || 0), 0);
  }, [activeBuyIds, buyableSorted]);

  const toggleGenFilter = (gen: EngineGeneration) => {
    setSelectedGenerations((prev) =>
      prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen]
    );
  };

  const toggleManualSelect = (id: number) => {
    setSweepCount(0);
    setManualSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const triggerBazaarNotice = (msg: string) => {
    setBazaarNotice(msg);
    window.setTimeout(() => setBazaarNotice(null), 4000);
  };

  const handleSweepOrFloorPurchase = () => {
    if (activeBuyIds.length === 0) return;
    if (protocol.userUSDG < activeTotalUSDG) {
      triggerBazaarNotice('Insufficient USDG balance for this purchase');
      return;
    }
    onBuyEngines(activeBuyIds);
    setManualSelectedIds([]);
    setSweepCount(0);
    triggerBazaarNotice(
      `Purchased ${activeBuyIds.length} Engine${activeBuyIds.length > 1 ? 's' : ''} (#${activeBuyIds.join(
        ', #'
      )}) for ${activeTotalUSDG.toFixed(2)} USDG (including attached rewards!)`
    );
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(offerPriceInput);
    const q = parseInt(offerQtyInput, 10);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(q) || q <= 0) return;
    onPlaceOffer({
      maker: protocol.walletAddress,
      priceUSDG: Number(p.toFixed(2)),
      quantity: q,
      targetGeneration: offerGenTarget,
    });
    setShowOfferModal(false);
    triggerBazaarNotice(
      `Placed ${offerGenTarget === 'ANY' ? 'Collection' : offerGenTarget} Offer: ${p.toFixed(
        2
      )} USDG × ${q}`
    );
  };

  const traitCategories = [
    {
      name: 'Chassis',
      count: 5,
      options: ['Carbon Anodized', 'Titanium Brushed', 'Porcelain Ceramic', 'Cobalt Alloy', 'Obsidian Cast'],
    },
    { name: 'Platen', count: 4, options: ['Dual Thermal Tape', 'Magnetic Spool', 'Optical Matrix', 'Quartz Cylinder'] },
    { name: 'Display', count: 4, options: ['Cobalt Phosphor', 'Amber Vector', 'Ice Matrix', 'Emerald Telemetry'] },
    { name: 'Seal', count: 4, options: ['Unbroken Escrow', 'Cobalt Ignited', 'Amber Sovereign', 'Platinum Engraved'] },
    { name: 'Finish', count: 4, options: ['Satin Industrial', 'Mirror Chamber', 'Matte Bead-Blast', 'Machined Billet'] },
    { name: 'Backdrop', count: 5, options: ['Mint Laboratory', 'Warm Parchment', 'Cool Titanium', 'Amber Drafting', 'Obsidian Blueprint'] },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 pb-28">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Filter Sidebar (matching Screenshots 1, 2, 4!) */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[248px] shrink-0 space-y-6 font-sans text-xs">
            {/* Status Filter Section */}
            <div>
              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white mb-2.5">
                <span>Status</span>
                <span className="text-slate-400">^</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                      : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('listed')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === 'listed'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                      : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Listed {listedCatalog.length}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('unlisted')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === 'unlisted'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                      : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Not listed
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('owned')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === 'owned'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold'
                      : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Owned by you {visibleCatalog.filter((e) => e.owner === 'you').length}
                </button>
              </div>
            </div>

            {/* Generation Filter Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white mb-3">
                <span>Generation</span>
                <span className="text-slate-400">^</span>
              </div>
              <div className="space-y-2.5 font-mono">
                {(['Relay', 'Ledger', 'Vault', 'Prime'] as EngineGeneration[]).map((gen) => {
                  const spec = GENERATION_SPECS[gen];
                  const count = visibleCatalog.filter((e) => e.generation === gen).length;
                  const checked = selectedGenerations.includes(gen);
                  return (
                    <label
                      key={gen}
                      className="flex items-center justify-between cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGenFilter(gen)}
                          className="rounded border-slate-400 text-slate-900 focus:ring-0"
                        />
                        <span
                          className="w-2 h-2 rounded-xs inline-block"
                          style={{ backgroundColor: spec.colorHex }}
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">{gen}</span>
                        <span className="text-slate-500">· w {spec.weight}</span>
                      </span>
                      <span className="text-slate-400 tabular-nums">{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price, USDG Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white mb-2.5">
                <span>Price, USDG</span>
                <span className="text-slate-400">^</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <input
                  type="number"
                  placeholder="Min"
                  aria-label="Minimum Price in USDG"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#12161E] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  aria-label="Maximum Price in USDG"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#12161E] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Traits Accordion Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white mb-2">
                <span>Traits</span>
                {selectedChassis && (
                  <button
                    type="button"
                    onClick={() => setSelectedChassis(null)}
                    className="text-[11px] font-mono text-[#0284C7] dark:text-[#4FFFB0] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-200/70 dark:divide-white/5">
                {traitCategories.map((cat) => (
                  <div key={cat.name} className="py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTrait(expandedTrait === cat.name ? null : cat.name)
                      }
                      className="w-full flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-0.5 cursor-pointer"
                    >
                      <span className="font-medium">{cat.name}</span>
                      <span className="font-mono text-slate-400">{cat.count}</span>
                    </button>
                    {expandedTrait === cat.name && (
                      <div className="mt-2 space-y-1 pl-2 border-l border-slate-300 dark:border-white/15">
                        {cat.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setSelectedChassis(selectedChassis === opt ? null : opt)
                            }
                            className={`block w-full text-left py-1 px-2 rounded text-[11px] font-mono transition-colors ${
                              selectedChassis === opt
                                ? 'bg-[#4FFFB0]/20 text-[#059669] dark:text-[#4FFFB0] font-semibold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Right Main Bazaar Column */}
        <div className="flex-1 min-w-0 w-full">
          {/* Top Hardware Telemetry Console (matching Screenshot 1 & 4!) */}
          <div className="hardware-bezel rounded-2xl p-3">
            <div className="hardware-screen rounded-xl px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 font-mono">
              <div className="lg:border-r lg:border-white/10 lg:pr-4">
                <div className="text-[10px] text-slate-400 tracking-wider">FLOOR</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-[#4FFFB0] tabular-nums">
                  {floorPriceUSDG.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">USDG</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  ≈ 1.00 $WORKS
                </div>
              </div>

              <div className="lg:border-r lg:border-white/10 lg:pr-4">
                <div className="text-[10px] text-slate-400 tracking-wider">TOP OFFER</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white tabular-nums">
                  {topOfferUSDG.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">USDG</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {protocol.offers.reduce((s, o) => s + o.quantity, 0)} engines wanted
                </div>
              </div>

              <div className="lg:border-r lg:border-white/10 lg:pr-4">
                <div className="text-[10px] text-slate-400 tracking-wider">LISTED</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white tabular-nums">
                  {listedCatalog.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  {protocol.bazaarSalesCount} sales · ${(protocol.bazaarVolumeUSDG / 1000).toFixed(1)}k vol
                </div>
              </div>

              <div className="lg:border-r lg:border-white/10 lg:pr-4">
                <div className="text-[10px] text-slate-400 tracking-wider">HOLDERS</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white tabular-nums">
                  612
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">5% Bazaar settlement fee</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 tracking-wider">
                  COMMISSIONED ENGINES
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-white tabular-nums">
                  {protocol.commissionedCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  weight {protocol.totalCommissionedWeight.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {bazaarNotice && (
            <div
              role="status"
              className="mt-4 px-4 py-2.5 rounded-xl bg-[#0B1014] border border-[#4FFFB0]/40 text-[#4FFFB0] font-mono text-xs flex items-center justify-between"
            >
              <span>{bazaarNotice}</span>
              <button
                type="button"
                onClick={() => setBazaarNotice(null)}
                className="text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Search & Toolbar Row (matching Screenshot 1 & 4!) */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Toggle filter sidebar"
                className="px-3 py-2 rounded-lg bg-white dark:bg-[#141820] border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-mono text-xs cursor-pointer"
              >
                {sidebarOpen ? '«' : <SlidersHorizontal className="w-4 h-4" />}
              </button>

              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by id or trait"
                  aria-label="Search engines by id or trait"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-[#141820] border border-slate-300 dark:border-white/15 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tabular-nums">
                {filteredEngines.length} ITEMS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  aria-label="Sort engines"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white dark:bg-[#141820] border border-slate-300 dark:border-white/15 text-xs font-mono text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="price_asc">Price low to high</option>
                  <option value="price_desc">Price high to low</option>
                  <option value="reward_desc">Unclaimed USDG high to low</option>
                  <option value="weight_desc">Generation weight high to low</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => setDenseGrid(false)}
                aria-label="Standard grid density"
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  !denseGrid
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                    : 'bg-white dark:bg-[#141820] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/15'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDenseGrid(true)}
                aria-label="Compact grid density"
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  denseGrid
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                    : 'bg-white dark:bg-[#141820] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/15'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Bazaar Grid: Card 1 = OFFERS · ANY ENGINE Hardware Card + Engine Cards */}
          <div
            className={`mt-5 grid gap-4 ${
              denseGrid
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}
          >
            {/* First Slot: Hardware OFFERS · ANY ENGINE Orderbook Widget (matching Screenshots 1, 2, 4!) */}
            <div className="hardware-bezel rounded-2xl p-2.5 flex flex-col justify-between min-h-[290px]">
              <div className="hardware-screen rounded-xl p-3.5 flex-1 flex flex-col justify-between font-mono">
                <div>
                  <div className="text-[10px] tracking-widest text-slate-400">
                    OFFERS · ANY ENGINE
                  </div>
                  <div className="mt-1.5 text-xl font-bold text-white tabular-nums">
                    {topOfferUSDG.toFixed(2)} USDG
                  </div>

                  {/* Bid Depth Bars */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {protocol.offers.slice(0, 3).map((off) => (
                      <div
                        key={off.id}
                        className="relative flex items-center justify-between px-2 py-1 rounded bg-[#4FFFB0]/10 border border-[#4FFFB0]/20 text-slate-200 tabular-nums"
                      >
                        <span>{off.priceUSDG.toFixed(2)}</span>
                        <span className="text-slate-400">×{off.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(true)}
                    className="w-full py-2 px-3 rounded bg-[#4FFFB0]/20 border border-[#4FFFB0] text-[#4FFFB0] hover:bg-[#4FFFB0] hover:text-[#091310] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    [ MAKE OFFER ]
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(true)}
                    className="w-full py-1.5 px-3 rounded border border-white/15 text-slate-300 hover:bg-white/10 text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    [ VIEW OFFERS ({protocol.offers.length}) ]
                  </button>
                </div>
              </div>
            </div>

            {/* Engine Listing Cards */}
            {filteredEngines.map((engine) => {
              const pending = calculatePendingReward(engine, protocol.accRewardPerWeight);
              const genSpec = GENERATION_SPECS[engine.generation];
              const isSelected = highlightedSelectedIds.includes(engine.id);

              return (
                <div
                  key={engine.id}
                  className={`group flex flex-col justify-between rounded-2xl transition-all ${
                    isSelected
                      ? 'ring-2 ring-[#4FFFB0] bg-white dark:bg-[#151B24]'
                      : 'hover:-translate-y-0.5'
                  }`}
                >
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={`Inspect 3D model of Engine #${engine.id}`}
                      onClick={() => onInspect3D(engine)}
                      className="w-full text-left focus:outline-none cursor-pointer"
                    >
                      <IsometricEngineArtwork
                        engine={engine}
                        compact={denseGrid}
                        className="w-full aspect-square rounded-2xl"
                      />
                    </button>

                    {/* Top-right Sweep Selection Button (matching Screenshot 2 `+` button on hover!) */}
                    {engine.listedPriceUSDG !== null && engine.owner !== 'you' && (
                      <button
                        type="button"
                        onClick={() => toggleManualSelect(engine.id)}
                        aria-label={`Select Engine #${engine.id} for purchase`}
                        className={`absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#4FFFB0] text-[#091310] shadow-md'
                            : 'bg-white/90 dark:bg-[#11151C]/90 text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 shadow-sm'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Card Footer Metadata (matching Screenshots 1, 2, 4!) */}
                  <div className="pt-2.5 px-1 font-mono">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onInspect3D(engine)}
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
                      >
                        Engine #{engine.id}
                      </button>
                      {engine.owner === 'you' && (
                        <span className="text-[10px] text-[#0284C7] dark:text-[#38BDF8]">
                          YOU
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 tabular-nums">
                        {engine.listedPriceUSDG !== null
                          ? `${engine.listedPriceUSDG.toFixed(2)} USDG`
                          : 'Unlisted'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-xs inline-block"
                          style={{ backgroundColor: genSpec.colorHex }}
                        />
                        {engine.generation}
                      </span>
                    </div>

                    <div className="mt-0.5 text-[11px] tabular-nums">
                      {engine.status === 'Commissioned' ? (
                        <span className="text-[#059669] dark:text-[#4FFFB0]">
                          +{pending.toFixed(5)} USDG unclaimed
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          Open · 1.00 $WORKS escrow
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Floating Sweep Bar (matching Screenshot 1 & 4!) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-[740px]">
        <div className="bg-[#181C23]/95 text-white border border-white/15 rounded-2xl px-3.5 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {/* Buy / Sell Toggle */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setSweepMode('buy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                sweepMode === 'buy'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSweepMode('sell')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                sweepMode === 'sell'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Sweep Slider */}
          <div className="flex items-center gap-3 flex-1 min-w-[160px] max-w-[260px]">
            <label htmlFor="bazaar-sweep-range" className="text-slate-300 whitespace-nowrap">
              Sweep
            </label>
            <input
              id="bazaar-sweep-range"
              type="range"
              min={0}
              max={Math.min(8, buyableSorted.length)}
              value={sweepCount}
              onChange={(e) => {
                setManualSelectedIds([]);
                setSweepCount(Number(e.target.value));
              }}
              className="sweep-slider w-full"
            />
            <span className="w-4 text-right font-bold text-[#4FFFB0] tabular-nums">
              {manualSelectedIds.length > 0 ? manualSelectedIds.length : sweepCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowOfferModal(true)}
            className="text-slate-300 hover:text-white px-2 py-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Make collection offer
          </button>

          <button
            type="button"
            disabled={activeBuyIds.length === 0}
            onClick={handleSweepOrFloorPurchase}
            className="px-4 py-2 rounded-xl bg-[#4FFFB0] text-[#091310] font-bold hover:bg-[#3be89b] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
          >
            {activeBuyIds.length > 1
              ? `Sweep ${activeBuyIds.length} · ${activeTotalUSDG.toFixed(2)} USDG`
              : `Buy floor · ${activeTotalUSDG.toFixed(2)} USDG`}
          </button>
        </div>
      </div>

      {/* Collection Offer Modal */}
      {showOfferModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
        >
          <div className="w-full max-w-md bg-[#12161E] text-white border border-white/15 rounded-2xl p-6 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 id="offer-modal-title" className="text-base font-bold">
                SETTLE BAZAAR · COLLECTION OFFER
              </h2>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="mt-4 space-y-4 text-xs">
              <div>
                <label htmlFor="offer-gen" className="block text-slate-400 mb-1">
                  TARGET GENERATION CLASS
                </label>
                <select
                  id="offer-gen"
                  value={offerGenTarget}
                  onChange={(e) => setOfferGenTarget(e.target.value as EngineGeneration | 'ANY')}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                >
                  <option value="ANY">Any Generation (Collection Offer)</option>
                  <option value="Relay">Relay Only (1.00×)</option>
                  <option value="Ledger">Ledger Only (1.25×)</option>
                  <option value="Vault">Vault Only (1.75×)</option>
                  <option value="Prime">Prime Only (3.00×)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="offer-price" className="block text-slate-400 mb-1">
                    OFFER PRICE (USDG)
                  </label>
                  <input
                    id="offer-price"
                    type="number"
                    step="0.1"
                    min="1"
                    value={offerPriceInput}
                    onChange={(e) => setOfferPriceInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="offer-qty" className="block text-slate-400 mb-1">
                    QUANTITY
                  </label>
                  <input
                    id="offer-qty"
                    type="number"
                    min="1"
                    max="20"
                    value={offerQtyInput}
                    onChange={(e) => setOfferQtyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/10 text-[11px] text-slate-400">
                5% Settle Bazaar fee applies only upon seller acceptance (3.25% to Commissioned Engines, 1.25% Treasury, 0.50% Security Fund).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/15 text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#4FFFB0] text-[#091310] font-bold hover:bg-[#3be89b]"
                >
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
