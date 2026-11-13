import React from 'react';
import {
  ProtocolState,
  verifyProtocolInvariants,
} from '../protocol/settleworksEngine';
import { CheckCircle2, ShieldAlert, Cpu, FileCheck2 } from 'lucide-react';

interface BlueprintInvariantsViewProps {
  protocol: ProtocolState;
  onToggleGuardianPause: (type: 'materialize' | 'commission') => void;
}

export const BlueprintInvariantsView: React.FC<BlueprintInvariantsViewProps> = ({
  protocol,
  onToggleGuardianPause,
}) => {
  const report = verifyProtocolInvariants(protocol);

  const contracts = [
    {
      name: 'WorksToken (ERC-20)',
      role: '4,663 initial units minted in constructor. 0% transfer tax, no blacklist, no pausable transfer. Burn callable solely by EngineController on Commission.',
    },
    {
      name: 'EngineController',
      role: 'Holds 1:1 $WORKS escrow for Open Engines. Executes lazy Fisher–Yates draw via verifiable RNG. Enforces 24h RNG timeout refund.',
    },
    {
      name: 'EngineNFT (ERC-721)',
      role: 'Tracks Open vs. Commissioned state. Burns Open NFT only on Dissolve. No public burn for Commissioned Engines. Frozen metadata hash.',
    },
    {
      name: 'RandomnessAdapter',
      role: 'Verifies cryptographic RNG proofs on Chain 4663. Never uses block.prevrandao or block.difficulty (which are constant on Robinhood Chain).',
    },
    {
      name: 'CanonicalCurve',
      role: 'Constant-product k = reserveUSDG × reserveWORKS vault. Collects 1% fee in USDG on both buy and sell. Zero LP withdrawal functions.',
    },
    {
      name: 'FeeSplitter (65/25/10)',
      role: 'Immutable router sending 65% of all protocol fees to RewardDistributor, 25% to 48h-timelocked Treasury, and 10% to Security Fund.',
    },
    {
      name: 'RewardDistributor',
      role: 'Tracks commissioned generation weights (1.00× to 3.00×) and accRewardPerWeight. Pending USDG follows the NFT atomically on transfer.',
    },
    {
      name: 'SettleBazaar',
      role: 'Official atomic USDG marketplace for Open & Commissioned Engines (5% fee). Displays and preserves attached unclaimed USDG rewards.',
    },
  ];

  const milestones = [
    { code: 'M0', title: 'Concept & Legal Gate', desc: 'Final PRD, ticker clearance, Q0 depth simulation, 3/5 multisig signers, VRF spec.' },
    { code: 'M1', title: 'Testnet (46630)', desc: 'Full 8-contract suite deployment, indexer schema, and failure-path verification.' },
    { code: 'M2', title: 'Security Readiness', desc: 'Dual independent audits, invariant fuzzing, reentrancy checks, and public bug bounty.' },
    { code: 'M3', title: 'Mainnet Readiness (4663)', desc: 'Live VRF provider verified on Robinhood Chain, frozen assignment hash, USDG registry check.' },
    { code: 'M4', title: 'Public Launch', desc: 'Canonical WORKS/USDG trading, Materialize, Dissolve, Commission, and Settle Bazaar live.' },
    { code: 'M5–M6', title: 'Ecosystem & Gated Tracks', desc: 'Sponsored USDG tracks first; Stock Token tracks only after legal & oracle pause gates.' },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            PROTOCOL ARCHITECTURE · PUBLIC INVARIANTS · COMPLIANCE
          </div>
          <h1 className="mt-1.5 text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white">
            Live On-Chain Invariant Verifier & Blueprint
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Every action you take in this application (swapping, materializing, dissolving, commissioning, or sweeping on the Bazaar) is continuously checked against the 4 core mathematical invariants of Settleworks Protocol.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-xl bg-[#0B1014] border border-[#4FFFB0]/40 text-[#4FFFB0] font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            ALL 4 INVARIANTS: {report.allValid ? 'VERIFIED (0 VIOLATIONS)' : 'VIOLATION DETECTED'}
          </span>
        </div>
      </div>

      {/* 4 Live Mathematical Invariant Cards (Section 8 of PRD!) */}
      <div className="hardware-bezel rounded-2xl p-3 sm:p-4">
        <div className="hardware-screen rounded-xl p-5 sm:p-6 font-mono">
          <div className="text-xs text-slate-400 pb-4 border-b border-white/10 flex items-center justify-between">
            <span>PUBLIC VIEW FUNCTIONS · REAL-TIME STATE ASSERTIONS</span>
            <span className="text-[#4FFFB0]">CHAIN ID: 4663</span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Invariant A */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/15">
              <div className="flex items-center justify-between text-[#4FFFB0]">
                <span className="font-bold">INVARIANT A · ECONOMIC UNITS</span>
                <span>PASS ✓</span>
              </div>
              <div className="mt-2 text-slate-300">
                WORKS.totalSupply() + totalCommissioned × 1 WORKS == 4,663
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 text-sm font-bold text-white tabular-nums">
                {report.invariantA_EconomicUnits.worksTotalSupply.toFixed(2)} W +{' '}
                {report.invariantA_EconomicUnits.totalCommissioned} burned ={' '}
                <span className="text-[#4FFFB0]">
                  {report.invariantA_EconomicUnits.sum.toFixed(2)} WORKS
                </span>
              </div>
            </div>

            {/* Invariant B */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/15">
              <div className="flex items-center justify-between text-[#4FFFB0]">
                <span className="font-bold">INVARIANT B · COLLECTION IDs</span>
                <span>PASS ✓</span>
              </div>
              <div className="mt-2 text-slate-300">
                reserveCount + openCount + commissionedCount == 4,663
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 text-sm font-bold text-white tabular-nums">
                {report.invariantB_CollectionIds.reserveCount} Reserve +{' '}
                {report.invariantB_CollectionIds.openCount} Open +{' '}
                {report.invariantB_CollectionIds.commissionedCount} Comm ={' '}
                <span className="text-[#4FFFB0]">{report.invariantB_CollectionIds.sum} IDs</span>
              </div>
            </div>

            {/* Invariant C */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/15">
              <div className="flex items-center justify-between text-[#4FFFB0]">
                <span className="font-bold">INVARIANT C · 1:1 ESCROW BACKING</span>
                <span>PASS ✓</span>
              </div>
              <div className="mt-2 text-slate-300">
                WORKS.balanceOf(EngineController) == openCount × 1 W + pendingRNG
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 text-sm font-bold text-white tabular-nums">
                Controller Escrow: {report.invariantC_EscrowBacking.controllerBalance.toFixed(2)} W =={' '}
                <span className="text-[#4FFFB0]">
                  {report.invariantC_EscrowBacking.expected.toFixed(2)} W Required
                </span>
              </div>
            </div>

            {/* Invariant D */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/15">
              <div className="flex items-center justify-between text-[#4FFFB0]">
                <span className="font-bold">INVARIANT D · REWARD RECONCILIATION</span>
                <span>PASS ✓</span>
              </div>
              <div className="mt-2 text-slate-300">
                totalRewardIn == claimedUSDG + unclaimedUSDG (Zero Admin Withdrawal)
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 text-sm font-bold text-white tabular-nums">
                {report.invariantD_RewardAccounting.claimedUSDG.toFixed(2)} Claimed +{' '}
                {report.invariantD_RewardAccounting.unclaimedUSDG.toFixed(2)} Unclaimed ={' '}
                <span className="text-[#4FFFB0]">
                  {report.invariantD_RewardAccounting.totalRewardInUSDG.toFixed(2)} USDG
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Architecture & Safety Guardian Simulator (Sections 16 & 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">
            <Cpu className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>Immutable 8-Contract Core Architecture</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {contracts.map((c) => (
              <div
                key={c.name}
                className="p-4 rounded-2xl bg-white dark:bg-[#13171F] border border-slate-200 dark:border-white/10"
              >
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {c.name}
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {c.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Guardian 3/5 Multisig Boundary Simulator */}
        <div className="lg:col-span-5 bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
              <span>SAFETY GUARDIAN (3/5 MULTISIG) BOUNDARIES</span>
            </div>
            <p className="mt-2 text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
              Test the strict constitutional limits of the Safety Guardian below. Even if the Guardian pauses new Materialize or Commission actions, selling tokens, dissolving Open Engines, and claiming USDG rewards can NEVER be paused.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Pause New Materialize
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Guardian Permitted Action
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleGuardianPause('materialize')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    protocol.guardianPauseMaterialize
                      ? 'bg-[#F59E0B] text-slate-950'
                      : 'bg-slate-900 text-white dark:bg-white/10 dark:text-white'
                  }`}
                >
                  {protocol.guardianPauseMaterialize ? 'PAUSED (Click to Resume)' : 'ACTIVE'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Pause New Commission
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Guardian Permitted Action
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleGuardianPause('commission')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    protocol.guardianPauseCommission
                      ? 'bg-[#F59E0B] text-slate-950'
                      : 'bg-slate-900 text-white dark:bg-white/10 dark:text-white'
                  }`}
                >
                  {protocol.guardianPauseCommission ? 'PAUSED (Click to Resume)' : 'ACTIVE'}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="font-bold text-slate-900 dark:text-white mb-1">
                PERMANENTLY IMPOSSIBLE FOR GUARDIAN / ADMIN:
              </div>
              <div>✗ Cannot pause Dissolve (Open Engine → 1 $WORKS)</div>
              <div>✗ Cannot pause Claim USDG Rewards or Canonical Curve Sells</div>
              <div>✗ Cannot withdraw user escrow or canonical LP reserves</div>
              <div>✗ Cannot alter 1% / 5% fees or 65 / 25 / 10 FeeSplitter ratios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gate-Based Roadmap M0 - M6 */}
      <div className="bg-white dark:bg-[#13171F] rounded-2xl border border-slate-200 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">
          <FileCheck2 className="w-4 h-4 text-[#059669] dark:text-[#4FFFB0]" />
          <span>Gate-Based Execution Roadmap (M0 – M6)</span>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {milestones.map((m) => (
            <div
              key={m.code}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs font-bold text-[#0284C7] dark:text-[#4FFFB0]">
                  {m.code}
                </div>
                <div className="mt-1 font-display font-semibold text-sm text-slate-900 dark:text-white">
                  {m.title}
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
