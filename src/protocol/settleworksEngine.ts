/**
 * Settleworks Protocol — Pure Core Economic Engine, State Machine & Invariants
 * Target Network: Robinhood Chain Mainnet (Chain ID 4663)
 */

export type EngineGeneration = 'Relay' | 'Ledger' | 'Vault' | 'Prime';
export type EngineStatus = 'Reserve' | 'Open' | 'Commissioned';

export interface GenerationSpec {
  name: EngineGeneration;
  supply: number;
  proportionLabel: string;
  weight: number;
  colorHex: string;
  accentHex: string;
  badgeClass: string;
  description: string;
  eligibleTrack: string;
}

export const GENERATION_SPECS: Record<EngineGeneration, GenerationSpec> = {
  Relay: {
    name: 'Relay',
    supply: 1865,
    proportionLabel: '40%',
    weight: 1.0,
    colorHex: '#38BDF8',
    accentHex: '#0284C7',
    badgeClass: 'text-[#38BDF8]',
    description: 'High-frequency routing & value-flow settlement unit with dual telemetry spools.',
    eligibleTrack: 'Broad Market Track (Tokenized ETFs - Gated)',
  },
  Ledger: {
    name: 'Ledger',
    supply: 1398,
    proportionLabel: '30%',
    weight: 1.25,
    colorHex: '#F59E0B',
    accentHex: '#D97706',
    badgeClass: 'text-[#F59E0B]',
    description: 'Continuous thermal settlement printer, cryptographic receipt platen & archive core.',
    eligibleTrack: 'Technology Sector Track (Gated)',
  },
  Vault: {
    name: 'Vault',
    supply: 933,
    proportionLabel: '20%',
    weight: 1.75,
    colorHex: '#A78BFA',
    accentHex: '#7C3AED',
    badgeClass: 'text-[#A78BFA]',
    description: 'Armored twin-tower custody & escrow verification monolith with dual-key interlock.',
    eligibleTrack: 'Defensive Reserve Track (Gated)',
  },
  Prime: {
    name: 'Prime',
    supply: 467,
    proportionLabel: '10%',
    weight: 3.0,
    colorHex: '#34D399',
    accentHex: '#059669',
    badgeClass: 'text-[#34D399]',
    description: 'Monumental sovereign settlement engine with triple gyroscope core & highest weight.',
    eligibleTrack: 'Premier Multi-Asset Sponsored Track',
  },
};

export interface EngineTraits {
  chassis: 'Carbon Anodized' | 'Titanium Brushed' | 'Porcelain Ceramic' | 'Cobalt Alloy' | 'Obsidian Cast';
  platen: 'Dual Thermal Tape' | 'Magnetic Spool' | 'Optical Matrix' | 'Quartz Cylinder';
  display: 'Cobalt Phosphor' | 'Amber Vector' | 'Ice Matrix' | 'Emerald Telemetry';
  seal: 'Unbroken Escrow' | 'Cobalt Ignited' | 'Amber Sovereign' | 'Platinum Engraved';
  finish: 'Satin Industrial' | 'Mirror Chamber' | 'Matte Bead-Blast' | 'Machined Billet';
  backdrop: 'Mint Laboratory' | 'Warm Parchment' | 'Cool Titanium' | 'Amber Drafting' | 'Obsidian Blueprint';
}

export interface EngineItem {
  id: number;
  generation: EngineGeneration;
  weight: number;
  status: EngineStatus;
  owner: string | null; // 'you' | '0x...' | null (if Reserve)
  listedPriceUSDG: number | null; // null if not listed on Settle Bazaar
  rewardDebtPerWeight: number;
  unsettledRewardUSDG: number;
  totalClaimedUSDG: number;
  commissionedAtBlock: number | null;
  traits: EngineTraits;
}

export interface CollectionOffer {
  id: string;
  maker: string;
  priceUSDG: number;
  quantity: number;
  targetGeneration: EngineGeneration | 'ANY';
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: 'MATERIALIZE' | 'COMMISSION' | 'DISSOLVE' | 'BUY_BAZAAR' | 'SWAP_BUY' | 'SWAP_SELL' | 'CLAIM';
  engineId?: number;
  generation?: EngineGeneration;
  amountText: string;
}

export interface ProtocolState {
  chainId: 4663;
  initialEconomicUnits: 4663;
  // Token & Escrow accounting
  worksTotalSupply: number; // Initially 4663, decreases ONLY on Commission
  controllerEscrowWorks: number; // Must equal openCount * 1 + pendingRngWorks
  pendingRngWorks: number;
  // Counts across 4,663 IDs
  reserveCount: number;
  openCount: number;
  commissionedCount: number;
  totalCommissionedWeight: number;
  // Canonical Curve (k = reserveUSDG * reserveWORKS)
  curveReserveUSDG: number;
  curveReserveWORKS: number;
  // Reward & Fee Splitter accounting (65% Engines / 25% Treasury / 10% Security Fund)
  accRewardPerWeight: number;
  totalRewardInUSDG: number;
  totalRewardClaimedUSDG: number;
  treasuryBalanceUSDG: number;
  securityFundBalanceUSDG: number;
  volume30dUSDG: number;
  bazaarSalesCount: number;
  bazaarVolumeUSDG: number;
  // User wallet state
  walletConnected: boolean;
  walletAddress: string;
  userUSDG: number;
  userWORKS: number;
  // Safety Guardian (3/5 multisig) limited pause state
  guardianPauseMaterialize: boolean;
  guardianPauseCommission: boolean;
  // Catalog of visible/active engines (plus aggregate background counts)
  engines: EngineItem[];
  offers: CollectionOffer[];
  activities: ActivityEvent[];
}

export interface SwapQuote {
  direction: 'BUY_WORKS' | 'SELL_WORKS';
  inputAmount: number;
  feeUSDG: number;
  enginesShareUSDG: number;
  treasuryShareUSDG: number;
  securityShareUSDG: number;
  outputAmount: number;
  spotPriceBeforeUSDG: number;
  effectivePriceUSDG: number;
  priceImpactPct: number;
}

export interface InvariantReport {
  invariantA_EconomicUnits: {
    valid: boolean;
    worksTotalSupply: number;
    totalCommissioned: number;
    sum: number;
    expected: 4663;
  };
  invariantB_CollectionIds: {
    valid: boolean;
    reserveCount: number;
    openCount: number;
    commissionedCount: number;
    sum: number;
    expected: 4663;
  };
  invariantC_EscrowBacking: {
    valid: boolean;
    controllerBalance: number;
    openCount: number;
    pendingRngWorks: number;
    expected: number;
  };
  invariantD_RewardAccounting: {
    valid: boolean;
    totalRewardInUSDG: number;
    claimedUSDG: number;
    unclaimedUSDG: number;
    sum: number;
  };
  allValid: boolean;
}

const CHASSIS_LIST: EngineTraits['chassis'][] = [
  'Carbon Anodized',
  'Titanium Brushed',
  'Porcelain Ceramic',
  'Cobalt Alloy',
  'Obsidian Cast',
];
const PLATEN_LIST: EngineTraits['platen'][] = [
  'Dual Thermal Tape',
  'Magnetic Spool',
  'Optical Matrix',
  'Quartz Cylinder',
];
const DISPLAY_LIST: EngineTraits['display'][] = [
  'Cobalt Phosphor',
  'Amber Vector',
  'Ice Matrix',
  'Emerald Telemetry',
];
const FINISH_LIST: EngineTraits['finish'][] = [
  'Satin Industrial',
  'Mirror Chamber',
  'Matte Bead-Blast',
  'Machined Billet',
];
const BACKDROP_LIST: EngineTraits['backdrop'][] = [
  'Mint Laboratory',
  'Warm Parchment',
  'Cool Titanium',
  'Amber Drafting',
  'Obsidian Blueprint',
];

export function buildDeterministicTraits(id: number, status: EngineStatus): EngineTraits {
  const h = (id * 2654435761) >>> 0;
  return {
    chassis: CHASSIS_LIST[h % CHASSIS_LIST.length],
    platen: PLATEN_LIST[(h >>> 3) % PLATEN_LIST.length],
    display: DISPLAY_LIST[(h >>> 6) % DISPLAY_LIST.length],
    seal:
      status === 'Commissioned'
        ? id % 3 === 0
          ? 'Amber Sovereign'
          : 'Cobalt Ignited'
        : 'Unbroken Escrow',
    finish: FINISH_LIST[(h >>> 9) % FINISH_LIST.length],
    backdrop: BACKDROP_LIST[id % BACKDROP_LIST.length],
  };
}

export function determineGenerationById(id: number): EngineGeneration {
  const mod = id % 10;
  if (mod === 0) return 'Prime'; // 10%
  if (mod === 1 || mod === 2) return 'Vault'; // 20%
  if (mod >= 3 && mod <= 5) return 'Ledger'; // 30%
  return 'Relay'; // 40%
}

export function calculatePendingReward(engine: EngineItem, accRewardPerWeight: number): number {
  if (engine.status !== 'Commissioned') return 0;
  const delta = Math.max(0, accRewardPerWeight - engine.rewardDebtPerWeight);
  return Number((engine.weight * delta + engine.unsettledRewardUSDG).toFixed(4));
}

/**
 * Constant-Product Canonical Curve Swap Quote
 * Trading fee is strictly 1% in USDG on both Buy and Sell.
 */
export function quoteCanonicalSwap(
  state: Pick<ProtocolState, 'curveReserveUSDG' | 'curveReserveWORKS'>,
  direction: 'BUY_WORKS' | 'SELL_WORKS',
  inputAmount: number
): SwapQuote {
  const R_U = state.curveReserveUSDG;
  const R_W = state.curveReserveWORKS;
  const spotPriceBeforeUSDG = R_U / R_W;

  if (!Number.isFinite(inputAmount) || inputAmount <= 0) {
    return {
      direction,
      inputAmount: 0,
      feeUSDG: 0,
      enginesShareUSDG: 0,
      treasuryShareUSDG: 0,
      securityShareUSDG: 0,
      outputAmount: 0,
      spotPriceBeforeUSDG,
      effectivePriceUSDG: spotPriceBeforeUSDG,
      priceImpactPct: 0,
    };
  }

  const k = R_U * R_W;

  if (direction === 'BUY_WORKS') {
    const grossUSDG = inputAmount;
    const feeUSDG = grossUSDG * 0.01;
    const swapInputUSDG = grossUSDG - feeUSDG;
    const newReserveUSDG = R_U + swapInputUSDG;
    const newReserveWORKS = k / newReserveUSDG;
    const worksOut = Math.max(0, R_W - newReserveWORKS);
    const effectivePriceUSDG = worksOut > 0 ? grossUSDG / worksOut : spotPriceBeforeUSDG;
    const spotAfter = newReserveUSDG / newReserveWORKS;
    const priceImpactPct = ((spotAfter - spotPriceBeforeUSDG) / spotPriceBeforeUSDG) * 100;

    return {
      direction,
      inputAmount: grossUSDG,
      feeUSDG,
      enginesShareUSDG: feeUSDG * 0.65,
      treasuryShareUSDG: feeUSDG * 0.25,
      securityShareUSDG: feeUSDG * 0.1,
      outputAmount: worksOut,
      spotPriceBeforeUSDG,
      effectivePriceUSDG,
      priceImpactPct,
    };
  } else {
    const worksIn = inputAmount;
    const newReserveWORKS = R_W + worksIn;
    const newReserveUSDG = k / newReserveWORKS;
    const grossUSDGOut = Math.max(0, R_U - newReserveUSDG);
    const feeUSDG = grossUSDGOut * 0.01;
    const netUSDGOut = grossUSDGOut - feeUSDG;
    const effectivePriceUSDG = worksIn > 0 ? netUSDGOut / worksIn : spotPriceBeforeUSDG;
    const spotAfter = newReserveUSDG / newReserveWORKS;
    const priceImpactPct = Math.abs(((spotPriceBeforeUSDG - spotAfter) / spotPriceBeforeUSDG) * 100);

    return {
      direction,
      inputAmount: worksIn,
      feeUSDG,
      enginesShareUSDG: feeUSDG * 0.65,
      treasuryShareUSDG: feeUSDG * 0.25,
      securityShareUSDG: feeUSDG * 0.1,
      outputAmount: netUSDGOut,
      spotPriceBeforeUSDG,
      effectivePriceUSDG,
      priceImpactPct,
    };
  }
}

function distributeFeeUSDG(state: ProtocolState, feeUSDG: number): ProtocolState {
  if (feeUSDG <= 0) return state;
  const enginesShare = feeUSDG * 0.65;
  const treasuryShare = feeUSDG * 0.25;
  const securityShare = feeUSDG * 0.1;

  const deltaAcc =
    state.totalCommissionedWeight > 0 ? enginesShare / state.totalCommissionedWeight : 0;

  return {
    ...state,
    accRewardPerWeight: state.accRewardPerWeight + deltaAcc,
    totalRewardInUSDG: Number((state.totalRewardInUSDG + enginesShare).toFixed(4)),
    treasuryBalanceUSDG: Number((state.treasuryBalanceUSDG + treasuryShare).toFixed(4)),
    securityFundBalanceUSDG: Number((state.securityFundBalanceUSDG + securityShare).toFixed(4)),
  };
}

/**
 * Execute Canonical Swap (BUY_WORKS or SELL_WORKS)
 */
export function executeCanonicalSwap(
  state: ProtocolState,
  direction: 'BUY_WORKS' | 'SELL_WORKS',
  inputAmount: number
): ProtocolState {
  const quote = quoteCanonicalSwap(state, direction, inputAmount);
  if (quote.inputAmount <= 0 || quote.outputAmount <= 0) return state;

  if (direction === 'BUY_WORKS') {
    if (state.userUSDG < quote.inputAmount) return state;
    const swapInputUSDG = quote.inputAmount - quote.feeUSDG;
    const nextState = distributeFeeUSDG(state, quote.feeUSDG);
    return {
      ...nextState,
      curveReserveUSDG: Number((state.curveReserveUSDG + swapInputUSDG).toFixed(4)),
      curveReserveWORKS: Number((state.curveReserveWORKS - quote.outputAmount).toFixed(4)),
      userUSDG: Number((state.userUSDG - quote.inputAmount).toFixed(4)),
      userWORKS: Number((state.userWORKS + quote.outputAmount).toFixed(4)),
      volume30dUSDG: Number((state.volume30dUSDG + quote.inputAmount).toFixed(2)),
      activities: [
        {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: 'Just now',
          actor: state.walletAddress,
          action: 'SWAP_BUY',
          amountText: `Bought ${quote.outputAmount.toFixed(2)} $WORKS for ${quote.inputAmount.toFixed(2)} USDG`,
        },
        ...state.activities.slice(0, 19),
      ],
    };
  } else {
    if (state.userWORKS < quote.inputAmount) return state;
    const grossUSDGOut = quote.outputAmount + quote.feeUSDG;
    const nextState = distributeFeeUSDG(state, quote.feeUSDG);
    return {
      ...nextState,
      curveReserveWORKS: Number((state.curveReserveWORKS + quote.inputAmount).toFixed(4)),
      curveReserveUSDG: Number((state.curveReserveUSDG - grossUSDGOut).toFixed(4)),
      userWORKS: Number((state.userWORKS - quote.inputAmount).toFixed(4)),
      userUSDG: Number((state.userUSDG + quote.outputAmount).toFixed(4)),
      volume30dUSDG: Number((state.volume30dUSDG + grossUSDGOut).toFixed(2)),
      activities: [
        {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: 'Just now',
          actor: state.walletAddress,
          action: 'SWAP_SELL',
          amountText: `Sold ${quote.inputAmount.toFixed(2)} $WORKS for ${quote.outputAmount.toFixed(2)} USDG`,
        },
        ...state.activities.slice(0, 19),
      ],
    };
  }
}

/**
 * FR-02: Materialize 1 $WORKS -> 1 Open Engine (Escrow locked, reversible)
 */
export function materializeEngines(state: ProtocolState, count = 1): ProtocolState {
  if (state.guardianPauseMaterialize) return state;
  const units = Math.floor(count);
  if (units <= 0 || state.userWORKS < units || state.reserveCount < units) return state;

  let updatedEngines = [...state.engines];
  const mintedIds: number[] = [];

  for (let i = 0; i < units; i++) {
    // Find a Reserve engine in catalog or create a deterministic Reserve draw
    const existingReserveIdx = updatedEngines.findIndex((e) => e.status === 'Reserve');
    if (existingReserveIdx !== -1) {
      const target = updatedEngines[existingReserveIdx];
      updatedEngines[existingReserveIdx] = {
        ...target,
        status: 'Open',
        owner: 'you',
        listedPriceUSDG: null,
        traits: buildDeterministicTraits(target.id, 'Open'),
      };
      mintedIds.push(target.id);
    } else {
      const usedIds = new Set(updatedEngines.map((e) => e.id));
      let candidateId = 3100 + updatedEngines.length * 17;
      while (usedIds.has(candidateId) || candidateId > 4663) {
        candidateId = ((candidateId + 73) % 4663) + 1;
      }
      const gen = determineGenerationById(candidateId);
      const spec = GENERATION_SPECS[gen];
      const newEngine: EngineItem = {
        id: candidateId,
        generation: gen,
        weight: spec.weight,
        status: 'Open',
        owner: 'you',
        listedPriceUSDG: null,
        rewardDebtPerWeight: state.accRewardPerWeight,
        unsettledRewardUSDG: 0,
        totalClaimedUSDG: 0,
        commissionedAtBlock: null,
        traits: buildDeterministicTraits(candidateId, 'Open'),
      };
      updatedEngines = [newEngine, ...updatedEngines];
      mintedIds.push(candidateId);
    }
  }

  return {
    ...state,
    userWORKS: Number((state.userWORKS - units).toFixed(4)),
    controllerEscrowWorks: state.controllerEscrowWorks + units,
    reserveCount: state.reserveCount - units,
    openCount: state.openCount + units,
    engines: updatedEngines,
    activities: [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        actor: state.walletAddress,
        action: 'MATERIALIZE',
        engineId: mintedIds[0],
        amountText: `Materialized ${units} Open Engine${units > 1 ? 's' : ''} (#${mintedIds.join(', #')})`,
      },
      ...state.activities.slice(0, 19),
    ],
  };
}

/**
 * FR-03: Dissolve Open Engine -> Burns Open NFT, returns 1 $WORKS from escrow to owner, ID returns to Reserve.
 * Commissioned Engines CANNOT be dissolved.
 */
export function dissolveEngine(state: ProtocolState, engineId: number): ProtocolState {
  const target = state.engines.find((e) => e.id === engineId);
  if (!target || target.status !== 'Open' || target.owner !== 'you') {
    return state;
  }

  const updatedEngines = state.engines.map((e) =>
    e.id === engineId
      ? {
          ...e,
          status: 'Reserve' as const,
          owner: null,
          listedPriceUSDG: null,
          traits: buildDeterministicTraits(e.id, 'Reserve'),
        }
      : e
  );

  return {
    ...state,
    userWORKS: Number((state.userWORKS + 1).toFixed(4)),
    controllerEscrowWorks: state.controllerEscrowWorks - 1,
    openCount: state.openCount - 1,
    reserveCount: state.reserveCount + 1,
    engines: updatedEngines,
    activities: [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        actor: state.walletAddress,
        action: 'DISSOLVE',
        engineId,
        generation: target.generation,
        amountText: `Dissolved Open Engine #${engineId} → 1.00 $WORKS unlocked`,
      },
      ...state.activities.slice(0, 19),
    ],
  };
}

/**
 * FR-04: Commission Open Engine -> Burns 1 $WORKS permanently from escrow, transitions to Commissioned Engine,
 * registers generation weight, sets rewardDebtPerWeight to current accumulator.
 */
export function commissionEngine(state: ProtocolState, engineId: number): ProtocolState {
  if (state.guardianPauseCommission) return state;
  const target = state.engines.find((e) => e.id === engineId);
  if (!target || target.status !== 'Open' || target.owner !== 'you') {
    return state;
  }

  const updatedEngines = state.engines.map((e) =>
    e.id === engineId
      ? {
          ...e,
          status: 'Commissioned' as const,
          rewardDebtPerWeight: state.accRewardPerWeight,
          unsettledRewardUSDG: 0,
          commissionedAtBlock: 1948210,
          traits: buildDeterministicTraits(e.id, 'Commissioned'),
        }
      : e
  );

  return {
    ...state,
    worksTotalSupply: state.worksTotalSupply - 1,
    controllerEscrowWorks: state.controllerEscrowWorks - 1,
    openCount: state.openCount - 1,
    commissionedCount: state.commissionedCount + 1,
    totalCommissionedWeight: Number((state.totalCommissionedWeight + target.weight).toFixed(2)),
    engines: updatedEngines,
    activities: [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        actor: state.walletAddress,
        action: 'COMMISSION',
        engineId,
        generation: target.generation,
        amountText: `Commissioned ${target.generation} Engine #${engineId} (${target.weight.toFixed(2)}x weight)`,
      },
      ...state.activities.slice(0, 19),
    ],
  };
}

/**
 * FR-05: Claim pending USDG rewards for one or all user-owned Commissioned Engines
 */
export function claimEngineRewards(state: ProtocolState, engineIds?: number[]): ProtocolState {
  let totalClaimedNow = 0;

  const updatedEngines = state.engines.map((e) => {
    const isTarget =
      e.owner === 'you' &&
      e.status === 'Commissioned' &&
      (!engineIds || engineIds.includes(e.id));
    if (!isTarget) return e;

    const pending = calculatePendingReward(e, state.accRewardPerWeight);
    if (pending <= 0) return e;

    totalClaimedNow += pending;
    return {
      ...e,
      rewardDebtPerWeight: state.accRewardPerWeight,
      unsettledRewardUSDG: 0,
      totalClaimedUSDG: Number((e.totalClaimedUSDG + pending).toFixed(4)),
    };
  });

  if (totalClaimedNow <= 0) return state;

  const roundedClaim = Number(totalClaimedNow.toFixed(4));
  return {
    ...state,
    userUSDG: Number((state.userUSDG + roundedClaim).toFixed(4)),
    totalRewardClaimedUSDG: Number((state.totalRewardClaimedUSDG + roundedClaim).toFixed(4)),
    engines: updatedEngines,
    activities: [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        actor: state.walletAddress,
        action: 'CLAIM',
        amountText: `Claimed ${roundedClaim.toFixed(2)} USDG from Commissioned Engines`,
      },
      ...state.activities.slice(0, 19),
    ],
  };
}

/**
 * FR-07: Buy an Engine on Settle Bazaar (5% fee in USDG, split 65/25/10, pending rewards transfer atomically with NFT!)
 */
export function buyBazaarEngines(state: ProtocolState, engineIds: number[]): ProtocolState {
  const targets = state.engines.filter(
    (e) =>
      engineIds.includes(e.id) &&
      e.listedPriceUSDG !== null &&
      e.owner !== 'you' &&
      e.status !== 'Reserve'
  );
  if (targets.length === 0) return state;

  const totalCostUSDG = targets.reduce((sum, e) => sum + (e.listedPriceUSDG || 0), 0);
  if (state.userUSDG < totalCostUSDG) return state;

  const totalFeeUSDG = totalCostUSDG * 0.05; // 5% Settle Bazaar fee
  const boughtSet = new Set(targets.map((e) => e.id));

  // Snapshot pending rewards BEFORE accRewardPerWeight increases from this trade's fee
  const updatedEngines = state.engines.map((e) => {
    if (!boughtSet.has(e.id)) return e;
    const preservedPending = calculatePendingReward(e, state.accRewardPerWeight);
    return {
      ...e,
      owner: 'you',
      listedPriceUSDG: null,
      unsettledRewardUSDG: preservedPending,
      rewardDebtPerWeight:
        state.accRewardPerWeight +
        (state.totalCommissionedWeight > 0
          ? (totalFeeUSDG * 0.65) / state.totalCommissionedWeight
          : 0),
    };
  });

  const afterFeeState = distributeFeeUSDG(state, totalFeeUSDG);

  return {
    ...afterFeeState,
    userUSDG: Number((state.userUSDG - totalCostUSDG).toFixed(4)),
    bazaarSalesCount: state.bazaarSalesCount + targets.length,
    bazaarVolumeUSDG: Number((state.bazaarVolumeUSDG + totalCostUSDG).toFixed(2)),
    volume30dUSDG: Number((state.volume30dUSDG + totalCostUSDG).toFixed(2)),
    engines: updatedEngines,
    activities: [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        actor: state.walletAddress,
        action: 'BUY_BAZAAR',
        engineId: targets[0].id,
        generation: targets[0].generation,
        amountText:
          targets.length === 1
            ? `Acquired Engine #${targets[0].id} for ${totalCostUSDG.toFixed(2)} USDG`
            : `Swept ${targets.length} Engines for ${totalCostUSDG.toFixed(2)} USDG`,
      },
      ...state.activities.slice(0, 19),
    ],
  };
}

/**
 * List or unlist a user-owned Engine on Settle Bazaar
 */
export function listEngineOnBazaar(
  state: ProtocolState,
  engineId: number,
  priceUSDG: number | null
): ProtocolState {
  const target = state.engines.find((e) => e.id === engineId);
  if (!target || target.owner !== 'you' || target.status === 'Reserve') return state;

  return {
    ...state,
    engines: state.engines.map((e) =>
      e.id === engineId
        ? { ...e, listedPriceUSDG: priceUSDG && priceUSDG > 0 ? Number(priceUSDG.toFixed(2)) : null }
        : e
    ),
  };
}

/**
 * Verify all 4 Public Economic Invariants from Section 8 of the Settleworks Blueprint
 */
export function verifyProtocolInvariants(state: ProtocolState): InvariantReport {
  const sumA = Number((state.worksTotalSupply + state.commissionedCount * 1).toFixed(4));
  const validA = Math.abs(sumA - 4663) < 1e-4;

  const sumB = state.reserveCount + state.openCount + state.commissionedCount;
  const validB = sumB === 4663;

  const expectedEscrow = state.openCount * 1 + state.pendingRngWorks;
  const validC = Math.abs(state.controllerEscrowWorks - expectedEscrow) < 1e-4;

  const unclaimedUSDG = Number(
    Math.max(0, state.totalRewardInUSDG - state.totalRewardClaimedUSDG).toFixed(4)
  );
  const sumD = Number((state.totalRewardClaimedUSDG + unclaimedUSDG).toFixed(4));
  const validD = Math.abs(sumD - state.totalRewardInUSDG) < 1e-2;

  return {
    invariantA_EconomicUnits: {
      valid: validA,
      worksTotalSupply: state.worksTotalSupply,
      totalCommissioned: state.commissionedCount,
      sum: sumA,
      expected: 4663,
    },
    invariantB_CollectionIds: {
      valid: validB,
      reserveCount: state.reserveCount,
      openCount: state.openCount,
      commissionedCount: state.commissionedCount,
      sum: sumB,
      expected: 4663,
    },
    invariantC_EscrowBacking: {
      valid: validC,
      controllerBalance: state.controllerEscrowWorks,
      openCount: state.openCount,
      pendingRngWorks: state.pendingRngWorks,
      expected: expectedEscrow,
    },
    invariantD_RewardAccounting: {
      valid: validD,
      totalRewardInUSDG: state.totalRewardInUSDG,
      claimedUSDG: state.totalRewardClaimedUSDG,
      unclaimedUSDG,
      sum: sumD,
    },
    allValid: validA && validB && validC && validD,
  };
}

/**
 * Create deterministic initial seed state matching Settleworks Protocol PRD (Chain ID 4663)
 */
export function createInitialProtocolState(): ProtocolState {
  const commissionedCount = 2183;
  const openCount = 822;
  const reserveCount = 4663 - commissionedCount - openCount; // 1658
  const worksTotalSupply = 4663 - commissionedCount; // 2480 WORKS remaining in circulation + escrow

  const accRewardPerWeight = 14.2;

  const seedRaw: Array<{
    id: number;
    gen: EngineGeneration;
    status: EngineStatus;
    owner: string | null;
    price: number | null;
    unsettled: number;
  }> = [
    // User's owned engines (visible in Desk immediately)
    { id: 3531, gen: 'Relay', status: 'Commissioned', owner: 'you', price: null, unsettled: 18.45 },
    { id: 4415, gen: 'Ledger', status: 'Commissioned', owner: 'you', price: null, unsettled: 31.2 },
    { id: 1088, gen: 'Vault', status: 'Open', owner: 'you', price: null, unsettled: 0 },
    { id: 4660, gen: 'Prime', status: 'Commissioned', owner: 'you', price: null, unsettled: 94.8 },
    { id: 2104, gen: 'Relay', status: 'Open', owner: 'you', price: null, unsettled: 0 },
    // Listed on Settle Bazaar (matching reference UI grid density & variety)
    { id: 4217, gen: 'Relay', status: 'Commissioned', owner: '0x91a...4c2', price: 142.5, unsettled: 11.84 },
    { id: 2592, gen: 'Ledger', status: 'Commissioned', owner: '0x3b8...19f', price: 146.0, unsettled: 24.15 },
    { id: 2866, gen: 'Relay', status: 'Commissioned', owner: '0x77d...e01', price: 148.2, unsettled: 9.42 },
    { id: 1403, gen: 'Vault', status: 'Commissioned', owner: '0x5c2...88a', price: 155.0, unsettled: 42.6 },
    { id: 704, gen: 'Ledger', status: 'Commissioned', owner: '0x8a1...3f0', price: 158.5, unsettled: 19.3 },
    { id: 3232, gen: 'Relay', status: 'Open', owner: '0x44f...c12', price: 139.0, unsettled: 0 },
    { id: 255, gen: 'Vault', status: 'Commissioned', owner: '0x19e...77b', price: 164.0, unsettled: 51.9 },
    { id: 3552, gen: 'Prime', status: 'Commissioned', owner: '0x6d0...99c', price: 210.0, unsettled: 112.4 },
    { id: 3645, gen: 'Ledger', status: 'Open', owner: '0x22b...41a', price: 144.0, unsettled: 0 },
    { id: 3572, gen: 'Vault', status: 'Commissioned', owner: '0x99a...11d', price: 169.5, unsettled: 38.75 },
    { id: 4248, gen: 'Prime', status: 'Commissioned', owner: '0xbc4...02e', price: 225.0, unsettled: 134.1 },
    { id: 2559, gen: 'Relay', status: 'Commissioned', owner: '0x71c...55f', price: 149.9, unsettled: 14.2 },
    { id: 1890, gen: 'Ledger', status: 'Commissioned', owner: '0x38f...60a', price: 161.0, unsettled: 27.8 },
    { id: 812, gen: 'Vault', status: 'Open', owner: '0x51d...83b', price: 152.0, unsettled: 0 },
    { id: 4001, gen: 'Prime', status: 'Commissioned', owner: '0x09a...74e', price: 242.0, unsettled: 168.5 },
    // Reserve pool items ready for Materialize draw
    { id: 1142, gen: 'Ledger', status: 'Reserve', owner: null, price: null, unsettled: 0 },
    { id: 2980, gen: 'Vault', status: 'Reserve', owner: null, price: null, unsettled: 0 },
    { id: 4110, gen: 'Prime', status: 'Reserve', owner: null, price: null, unsettled: 0 },
    { id: 619, gen: 'Relay', status: 'Reserve', owner: null, price: null, unsettled: 0 },
  ];

  const engines: EngineItem[] = seedRaw.map((item) => {
    const spec = GENERATION_SPECS[item.gen];
    return {
      id: item.id,
      generation: item.gen,
      weight: spec.weight,
      status: item.status,
      owner: item.owner,
      listedPriceUSDG: item.price,
      rewardDebtPerWeight: accRewardPerWeight,
      unsettledRewardUSDG: item.unsettled,
      totalClaimedUSDG: item.status === 'Commissioned' ? Number((item.id % 45 + 12.4).toFixed(2)) : 0,
      commissionedAtBlock: item.status === 'Commissioned' ? 1920000 + item.id : null,
      traits: buildDeterministicTraits(item.id, item.status),
    };
  });

  const offers: CollectionOffer[] = [
    { id: 'off-1', maker: '0x88e1...31a9', priceUSDG: 138.0, quantity: 2, targetGeneration: 'ANY' },
    { id: 'off-2', maker: '0x42c0...99b1', priceUSDG: 135.5, quantity: 4, targetGeneration: 'Relay' },
    { id: 'off-3', maker: '0x19f4...77d2', priceUSDG: 148.0, quantity: 1, targetGeneration: 'Vault' },
    { id: 'off-4', maker: '0x73a8...04c6', priceUSDG: 195.0, quantity: 1, targetGeneration: 'Prime' },
  ];

  const activities: ActivityEvent[] = [
    {
      id: 'act-init-1',
      timestamp: '2m ago',
      actor: '0xabb2...cd10',
      action: 'COMMISSION',
      engineId: 2149,
      generation: 'Vault',
      amountText: 'Commissioned Vault Engine #2149 (1.75x weight)',
    },
    {
      id: 'act-init-2',
      timestamp: '9m ago',
      actor: '0x56c2...8a8b',
      action: 'BUY_BAZAAR',
      engineId: 2202,
      generation: 'Ledger',
      amountText: 'Acquired Engine #2202 (+24.15 USDG pending) for 146.00 USDG',
    },
    {
      id: 'act-init-3',
      timestamp: '18m ago',
      actor: '0xada5...f7cb',
      action: 'MATERIALIZE',
      engineId: 3232,
      generation: 'Relay',
      amountText: 'Materialized Open Engine #3232 (1.00 $WORKS locked in escrow)',
    },
    {
      id: 'act-init-4',
      timestamp: '31m ago',
      actor: '0x19e0...77b4',
      action: 'CLAIM',
      amountText: 'Claimed 84.50 USDG from 3 Commissioned Engines',
    },
  ];

  return {
    chainId: 4663,
    initialEconomicUnits: 4663,
    worksTotalSupply,
    controllerEscrowWorks: openCount,
    pendingRngWorks: 0,
    reserveCount,
    openCount,
    commissionedCount,
    totalCommissionedWeight: 3410.5,
    curveReserveUSDG: 231400,
    curveReserveWORKS: 1658,
    accRewardPerWeight,
    totalRewardInUSDG: 48420.0,
    totalRewardClaimedUSDG: 39180.5,
    treasuryBalanceUSDG: 18623.08,
    securityFundBalanceUSDG: 7449.23,
    volume30dUSDG: 1428500,
    bazaarSalesCount: 950,
    bazaarVolumeUSDG: 138450,
    walletConnected: true,
    walletAddress: '0x4663...8f9a',
    userUSDG: 4250.0,
    userWORKS: 3.45,
    guardianPauseMaterialize: false,
    guardianPauseCommission: false,
    engines,
    offers,
    activities,
  };
}
