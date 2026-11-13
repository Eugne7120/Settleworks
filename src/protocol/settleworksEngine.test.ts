import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialProtocolState,
  verifyProtocolInvariants,
  quoteCanonicalSwap,
  executeCanonicalSwap,
  materializeEngines,
  dissolveEngine,
  commissionEngine,
  claimEngineRewards,
  buyBazaarEngines,
  calculatePendingReward,
} from './settleworksEngine';

test('Initial Settleworks state satisfies all 4 core economic invariants (Chain ID 4663)', () => {
  const state = createInitialProtocolState();
  const report = verifyProtocolInvariants(state);
  assert.equal(report.allValid, true);
  assert.equal(report.invariantA_EconomicUnits.sum, 4663);
  assert.equal(report.invariantB_CollectionIds.sum, 4663);
  assert.equal(report.invariantC_EscrowBacking.controllerBalance, state.openCount);
});

test('Canonical curve swap applies 1% fee in USDG and splits 65/25/10 while preserving invariants', () => {
  const state = createInitialProtocolState();
  const quote = quoteCanonicalSwap(state, 'BUY_WORKS', 1000);
  assert.equal(quote.feeUSDG, 10);
  assert.equal(quote.enginesShareUSDG, 6.5);
  assert.equal(quote.treasuryShareUSDG, 2.5);
  assert.equal(quote.securityShareUSDG, 1.0);
  assert.ok(quote.outputAmount > 0);

  const next = executeCanonicalSwap(state, 'BUY_WORKS', 1000);
  assert.equal(next.userUSDG, state.userUSDG - 1000);
  assert.ok(next.userWORKS > state.userWORKS);
  assert.equal(verifyProtocolInvariants(next).allValid, true);
});

test('Materialize locks 1 WORKS in escrow, mints Open Engine, and Dissolve reverses it cleanly', () => {
  const state = createInitialProtocolState();
  const afterMat = materializeEngines(state, 1);

  assert.equal(afterMat.userWORKS, Number((state.userWORKS - 1).toFixed(4)));
  assert.equal(afterMat.openCount, state.openCount + 1);
  assert.equal(afterMat.reserveCount, state.reserveCount - 1);
  assert.equal(afterMat.controllerEscrowWorks, state.controllerEscrowWorks + 1);
  assert.equal(afterMat.worksTotalSupply, state.worksTotalSupply); // Materialize does NOT burn WORKS
  assert.equal(verifyProtocolInvariants(afterMat).allValid, true);

  // Dissolve an Open Engine owned by user (#1088)
  const afterDissolve = dissolveEngine(afterMat, 1088);
  assert.equal(afterDissolve.userWORKS, state.userWORKS);
  assert.equal(afterDissolve.openCount, state.openCount);
  assert.equal(afterDissolve.reserveCount, state.reserveCount);
  assert.equal(verifyProtocolInvariants(afterDissolve).allValid, true);
});

test('Commission permanently burns 1 WORKS from escrow, transitions Open -> Commissioned, and blocks Dissolve', () => {
  const state = createInitialProtocolState();
  // Engine #1088 is an Open Vault Engine (weight 1.75) owned by 'you'
  const afterComm = commissionEngine(state, 1088);

  assert.equal(afterComm.worksTotalSupply, state.worksTotalSupply - 1);
  assert.equal(afterComm.commissionedCount, state.commissionedCount + 1);
  assert.equal(afterComm.openCount, state.openCount - 1);
  assert.equal(afterComm.controllerEscrowWorks, state.controllerEscrowWorks - 1);
  assert.equal(afterComm.totalCommissionedWeight, Number((state.totalCommissionedWeight + 1.75).toFixed(2)));
  assert.equal(verifyProtocolInvariants(afterComm).allValid, true);

  // Attempting to Dissolve a Commissioned Engine must be a no-op
  const afterAttemptDissolve = dissolveEngine(afterComm, 1088);
  assert.equal(afterAttemptDissolve.commissionedCount, afterComm.commissionedCount);
});

test('Claim USDG and Settle Bazaar atomic NFT purchase preserve pending rewards and invariants', () => {
  const state = createInitialProtocolState();
  const afterClaim = claimEngineRewards(state, [3531]);
  assert.ok(afterClaim.userUSDG > state.userUSDG);
  assert.equal(verifyProtocolInvariants(afterClaim).allValid, true);

  // Buy Engine #4217 on Settle Bazaar (listed at 142.50 USDG with 11.84 USDG pending reward)
  const beforeEngine = afterClaim.engines.find((e) => e.id === 4217)!;
  const pendingBefore = calculatePendingReward(beforeEngine, afterClaim.accRewardPerWeight);
  assert.ok(pendingBefore >= 11.84);

  const afterBuy = buyBazaarEngines(afterClaim, [4217]);
  const boughtEngine = afterBuy.engines.find((e) => e.id === 4217)!;
  assert.equal(boughtEngine.owner, 'you');
  assert.equal(boughtEngine.listedPriceUSDG, null);
  // Pending reward must follow the NFT to the buyer
  const pendingAfter = calculatePendingReward(boughtEngine, afterBuy.accRewardPerWeight);
  assert.ok(pendingAfter >= pendingBefore);
  assert.equal(verifyProtocolInvariants(afterBuy).allValid, true);
});
