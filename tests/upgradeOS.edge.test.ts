import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  ActionStatusChange,
  EvidenceItem,
  RecommendedAction,
} from '../src/types.ts'
import {
  createUpgradeOSReportModel,
  getSnapshotSequenceNumber,
  prioritizeUpgradeMissions,
} from '../src/lib/upgradeOS.ts'

function makeAction(
  overrides: Partial<RecommendedAction> = {},
): RecommendedAction {
  return {
    id: 'homepage-action',
    title: 'Clarify the first-screen promise',
    description: 'Lead with the primary service, market, proof, and next step.',
    category: 'Homepage',
    priority: 'High',
    estimatedEffort: 'Small',
    estimatedImpact: 'High',
    estimatedHours: 4,
    priorityScore: 92,
    opportunityScore: 88,
    reason: 'The first screen delays the clearest service and market details.',
    expectedOutcome: 'The first screen is easier for a new visitor to understand.',
    objective: 'Make service fit and the next step clear at first glance.',
    businessValue: 'Customers can confirm fit before comparing another provider.',
    status: 'Not Started',
    blockedBy: [],
    unlocks: [],
    recommendedOrder: 1,
    linkedEvidence: [],
    linkedEvidenceIds: [],
    ...overrides,
  }
}

function makeEvidence(
  id: string,
  actionId: string,
  overrides: Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id,
    evidenceType: 'Website',
    sentiment: 'Opportunity',
    title: 'Recorded first-screen constraint',
    sourceUrl: 'https://harborpine.example',
    pageLabel: 'Homepage',
    observation: 'The service and city appear after the introductory message.',
    whyItMatters: 'A new visitor has to work to confirm fit.',
    recommendedChange: 'Lead with the service, city, proof, and next step.',
    expectedOutcome: 'The first screen becomes easier to understand.',
    linkedActionIds: [actionId],
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
    ...overrides,
  }
}

function createModel(
  actions: RecommendedAction[],
  evidenceItems: EvidenceItem[] = [],
  actionStatusHistory: ActionStatusChange[] = [],
  snapshotNumber?: number,
) {
  return createUpgradeOSReportModel({
    businessName: 'Harbor & Pine Heating Co.',
    city: 'Riverton',
    primaryService: 'Emergency Heating And Air Conditioning Repair',
    actions,
    evidenceItems,
    actionStatusHistory,
    currentArchetype: 'Reputation Magnet',
    currentHealthScore: 63,
    currentGrowthStage: 'Trusted Specialist',
    nextGrowthStage: 'Community Favorite',
    targetScoreLow: 65,
    targetScoreHigh: 79,
    nextEvolution: 'Carry customer trust into greater local visibility.',
    snapshotDate: '2026-06-18T18:30:00.000Z',
    snapshotNumber,
  })
}

test('incomplete linked evidence never becomes mission proof or confidence', () => {
  const source = makeAction({ linkedEvidenceIds: ['draft-evidence'] })
  const incomplete = makeEvidence('draft-evidence', source.id, {
    observation: '',
  })
  const unrelatedReady = makeEvidence('ready-evidence', 'another-action')

  const missions = prioritizeUpgradeMissions({
    actions: [source],
    evidenceItems: [incomplete, unrelatedReady],
    primaryService: 'Emergency HVAC repair',
    city: 'Riverton',
  })

  assert.deepEqual(missions[0].evidence, [])
  assert.match(missions[0].actionPlan[0], /Capture a dated baseline/)
})

test('reopened work has no stale completion, action-taken, or verified impact', () => {
  const source = makeAction({
    status: 'In Progress',
    implementationNote: 'Use the approved first-screen copy.',
  })
  const history: ActionStatusChange[] = [
    {
      actionId: source.id,
      previousStatus: 'In Progress',
      newStatus: 'Completed',
      changedAt: '2026-06-19T12:00:00.000Z',
    },
    {
      actionId: source.id,
      previousStatus: 'Completed',
      newStatus: 'In Progress',
      changedAt: '2026-06-20T12:00:00.000Z',
    },
  ]

  const entry = createModel([source], [], history).impactLedger[0]

  assert.equal(entry.status, 'In Progress')
  assert.equal(entry.completionDate, undefined)
  assert.equal(entry.actionTaken, undefined)
  assert.equal(entry.businessImpact, undefined)
})

test('client mission prose uses sentence case and never exposes dependency IDs', () => {
  const source = makeAction({
    blockedBy: ['legacy-action-storage-id'],
    expectedOutcome: 'Visitors recognize the urgent service and next step faster.',
    businessValue: 'Customers can confirm service fit before comparing.',
  })
  const mission = createModel([source]).missions[0]

  assert.match(
    mission.successCriteria[0],
    /emergency heating and air conditioning repair/,
  )
  assert.doesNotMatch(mission.successCriteria[0], /Emergency Heating And/)
  assert.match(mission.expectedOutcome, /visitors recognize the urgent service/)
  assert.doesNotMatch(mission.dependencyWarnings[0], /legacy-action-storage-id/)
})

test('same-business saved history produces a stable sequence number', () => {
  const snapshots = [
    {
      id: 'snapshot-002',
      createdAt: '2026-06-20T12:00:00.000Z',
      businessName: 'Harbor & Pine Heating Co.',
      websiteUrl: 'https://www.harborpine.example/',
    },
    {
      id: 'unrelated',
      createdAt: '2026-06-17T12:00:00.000Z',
      businessName: 'Another Company',
      websiteUrl: 'https://another.example',
    },
    {
      id: 'snapshot-001',
      createdAt: '2026-06-18T12:00:00.000Z',
      businessName: 'Harbor & Pine Heating Co.',
      websiteUrl: 'harborpine.example',
    },
  ]

  assert.equal(getSnapshotSequenceNumber(snapshots, 'snapshot-002'), 2)
  const model = createModel([makeAction()], [], [], 2)
  assert.equal(model.journey.snapshotNumber, '002')
  assert.equal(model.snapshotRecord[0].label, 'Snapshot 002')
})

test('an all-deferred assessment stays empty and fabricates no future result', () => {
  const model = createModel([
    makeAction({ status: 'Deferred' }),
  ])

  assert.deepEqual(model.missions, [])
  assert.deepEqual(model.impactLedger, [])
  assert.deepEqual(model.achievements, [])
  assert.ok(model.snapshotRecord.slice(1).every((checkpoint) =>
    checkpoint.businessHealthScore === null
    && checkpoint.archetype === null,
  ))
})
