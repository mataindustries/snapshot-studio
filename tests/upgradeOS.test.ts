import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  ActionCategory,
  EvidenceItem,
  RecommendedAction,
  RecommendedActionStatus,
} from '../src/types.ts'
import { reportTerminology } from '../src/lib/reportTerminology.ts'
import {
  createUpgradeOSReportModel,
  prioritizeUpgradeMissions,
} from '../src/lib/upgradeOS.ts'

const categories: ActionCategory[] = [
  'Homepage',
  'Trust',
  'Service Pages',
  'FAQ',
  'Google Business Profile',
  'Calls To Action',
]

function action(
  index: number,
  overrides: Partial<RecommendedAction> = {},
): RecommendedAction {
  const category = overrides.category ?? categories[index % categories.length]
  const id = overrides.id ?? `action-${index + 1}`
  return {
    id,
    title: overrides.title ?? `Upgrade ${category} ${index + 1}`,
    description: overrides.description ?? `Complete the focused ${category} improvement.`,
    category,
    priority: overrides.priority ?? 'High',
    estimatedEffort: overrides.estimatedEffort ?? 'Small',
    estimatedImpact: overrides.estimatedImpact ?? 'High',
    estimatedHours: overrides.estimatedHours ?? 3,
    priorityScore: overrides.priorityScore ?? 70 + index,
    opportunityScore: overrides.opportunityScore ?? 60 + index,
    reason: overrides.reason ?? 'The recorded customer path has a visible constraint.',
    expectedOutcome: overrides.expectedOutcome ?? 'The customer path is easier to understand.',
    objective: overrides.objective ?? `Establish a clear ${category} standard ${index + 1}.`,
    businessValue: overrides.businessValue ?? 'Customers can make the next decision with less friction.',
    status: overrides.status ?? 'Not Started',
    blockedBy: overrides.blockedBy ?? [],
    unlocks: overrides.unlocks ?? [],
    recommendedOrder: overrides.recommendedOrder ?? index + 1,
    linkedEvidence: overrides.linkedEvidence ?? [],
    linkedEvidenceIds: overrides.linkedEvidenceIds ?? [],
    evidenceReference: overrides.evidenceReference,
    implementationNote: overrides.implementationNote,
    completionDate: overrides.completionDate,
    verificationMethod: overrides.verificationMethod,
    verificationStatus: overrides.verificationStatus,
    outcomeNote: overrides.outcomeNote,
  }
}

function evidence(
  id: string,
  actionId: string,
): EvidenceItem {
  return {
    id,
    evidenceType: 'Website',
    sentiment: 'Opportunity',
    title: 'Recorded first-screen constraint',
    sourceUrl: 'https://example.test',
    pageLabel: 'Homepage',
    observation: 'The service and location appear after the introductory message.',
    whyItMatters: 'A first-time visitor has to work to confirm fit.',
    recommendedChange: 'Lead with the service and location.',
    expectedOutcome: 'The first screen becomes easier to understand.',
    linkedActionIds: [actionId],
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
  }
}

function missionInput(actions: RecommendedAction[], evidenceItems: EvidenceItem[] = []) {
  return {
    actions,
    evidenceItems,
    primaryService: 'Emergency HVAC repair',
    city: 'Riverton',
  }
}

function modelInput(
  actions: RecommendedAction[],
  evidenceItems: EvidenceItem[] = [],
) {
  return {
    businessName: 'Harbor & Pine Heating Co.',
    city: 'Riverton',
    primaryService: 'Emergency HVAC repair',
    actions,
    evidenceItems,
    actionStatusHistory: [],
    currentArchetype: 'Reputation Magnet',
    currentHealthScore: 63,
    currentGrowthStage: 'Trusted Specialist' as const,
    nextGrowthStage: 'Community Favorite' as const,
    targetScoreLow: 65,
    targetScoreHigh: 79,
    nextEvolution: 'Carry customer trust into greater local visibility.',
    snapshotDate: '2026-06-18T18:30:00.000Z',
  }
}

test('mission selection is deterministic, unique, and limited to three', () => {
  const actions = categories.map((category, index) => action(index, {
    category,
    opportunityScore: index === 4 ? 98 : 45 + index,
  }))

  const first = prioritizeUpgradeMissions(missionInput(actions))
  const second = prioritizeUpgradeMissions(missionInput(actions))

  assert.deepEqual(first, second)
  assert.equal(first.length, 3)
  assert.equal(new Set(first.map((mission) => mission.sourceActionId)).size, 3)
  assert.ok(first.some((mission) => mission.sourceActionId === 'action-5'))
})

test('duplicate action identities and titles cannot create duplicate missions', () => {
  const original = action(0)
  const duplicateTitle = action(1, {
    id: 'different-id',
    title: original.title,
    objective: 'A different objective with the same visible title.',
  })
  const distinct = action(2)

  const missions = prioritizeUpgradeMissions(
    missionInput([original, duplicateTitle, distinct]),
  )

  assert.equal(missions.length, 2)
  assert.equal(new Set(missions.map((mission) => mission.title)).size, 2)
})

test('fewer than three valid findings remain graceful and unsupported work is not invented', () => {
  const actions = [
    action(0),
    action(1),
    action(3, { status: 'Deferred' }),
  ]

  const missions = prioritizeUpgradeMissions(missionInput(actions))

  assert.equal(missions.length, 2)
  assert.ok(missions.every((mission) => mission.sourceStatus !== 'Deferred'))
})

test('mission copy does not stop at a business-name abbreviation', () => {
  const description = 'Homeowners should instantly recognize that Harbor & Pine Heating Co. handles emergency heating and air conditioning repair in Riverton when speed and local availability shape the decision.'
  const supportingStep = 'Lead with that message, then add one credible proof point and a clear next step.'
  const missions = prioritizeUpgradeMissions(missionInput([
    action(0, { description: `${description} ${supportingStep}` }),
  ]))

  assert.equal(missions[0].actionSummary, `${description} ${supportingStep}`)
  assert.match(missions[0].actionPlan[1], /emergency HVAC repair.*Riverton/i)
  assert.doesNotMatch(missions[0].actionPlan[1], /Heating Co\.$/)
})

test('completed missions remain in the stable plan and await verification', () => {
  const completed = action(0, { status: 'Completed' })
  const model = createUpgradeOSReportModel(modelInput([completed]))

  assert.equal(model.missions[0].sourceStatus, 'Completed')
  assert.equal(model.impactLedger[0].status, 'Completed')
  assert.equal(model.achievements[0].status, 'In Progress')
})

test('verified canonical actions populate the existing Impact Ledger without inferred impact', () => {
  const completed = action(0, {
    status: 'Completed',
    implementationNote: 'Published the approved first-screen service message.',
    completionDate: '2026-06-20',
    verificationMethod: 'Reviewed the live page on phone and desktop.',
    verificationStatus: 'Verified',
    outcomeNote: 'The service, city, and request action are now visible on the first screen.',
    linkedEvidence: ['evidence-after'],
    linkedEvidenceIds: ['evidence-after'],
  })
  const afterEvidence = {
    ...evidence('evidence-after', completed.id),
    evidenceTiming: 'After' as const,
    title: 'Published first-screen state',
    observation: 'The live first screen names the service, city, and request action.',
  }
  const model = createUpgradeOSReportModel(modelInput([completed], [afterEvidence]))

  assert.equal(model.impactLedger[0].status, 'Verified')
  assert.equal(model.impactLedger[0].verificationMethod, completed.verificationMethod)
  assert.equal(model.impactLedger[0].businessImpact, completed.outcomeNote)
  assert.equal(model.impactLedger[0].verificationEvidence?.length, 1)
  assert.equal(model.achievements[0].status, 'Earned')
})

test('baseline evidence comes only from explicit evidence links', () => {
  const first = action(0)
  const second = action(1)
  const linkedEvidence = evidence('evidence-1', second.id)
  const missions = prioritizeUpgradeMissions(
    missionInput([first, second], [linkedEvidence]),
  )

  assert.equal(
    missions.find((mission) => mission.sourceActionId === first.id)?.evidence.length,
    0,
  )
  assert.equal(
    missions.find((mission) => mission.sourceActionId === second.id)?.evidence.length,
    1,
  )
})

test('dependency readiness affects ordering without changing canonical action data', () => {
  const blocked = action(0, {
    id: 'a-blocked',
    recommendedOrder: 1,
    priorityScore: 80,
    opportunityScore: 80,
    blockedBy: ['unfinished-dependency'],
  })
  const ready = action(1, {
    id: 'z-ready',
    recommendedOrder: 1,
    priorityScore: 80,
    opportunityScore: 80,
  })

  const missions = prioritizeUpgradeMissions(missionInput([blocked, ready]))

  assert.equal(missions[0].sourceActionId, ready.id)
  assert.deepEqual(blocked.blockedBy, ['unfinished-dependency'])
})

test('Snapshot 001 records the baseline and never fabricates future scores', () => {
  const actions = [action(0), action(1), action(2)]
  const model = createUpgradeOSReportModel(modelInput(actions))

  assert.equal(model.journey.snapshotNumber, '001')
  assert.equal(model.journey.targetScoreRange, '65–79/100 planning range')
  assert.equal(model.snapshotRecord[0].businessHealthScore, 63)
  assert.equal(model.snapshotRecord[0].status, 'Baseline Recorded')
  assert.ok(model.snapshotRecord.slice(1).every((entry) =>
    entry.businessHealthScore === null
    && entry.archetype === null
    && entry.status === 'To be recorded',
  ))
})

test('fresh Snapshot 001 ledger entries are Planned and verification remains pending', () => {
  const actions = [action(0), action(1), action(2)]
  const model = createUpgradeOSReportModel(modelInput(actions))

  assert.equal(model.impactLedger.length, 3)
  assert.ok(model.impactLedger.every((entry) => entry.status === 'Planned'))
  assert.ok(model.impactLedger.every((entry) =>
    entry.verificationEvidence?.length === 0
    && entry.verificationTiming.includes('next Snapshot'),
  ))
})

test('missing optional evidence and implementation notes do not break report generation', () => {
  const status: RecommendedActionStatus = 'Needs Review'
  const source = action(0, {
    status,
    linkedEvidence: [],
    linkedEvidenceIds: [],
    implementationNote: undefined,
  })
  const model = createUpgradeOSReportModel(modelInput([source]))

  assert.equal(model.missions.length, 1)
  assert.deepEqual(model.missions[0].evidence, [])
  assert.equal(model.impactLedger[0].actionTaken, undefined)
  assert.equal(model.impactLedger[0].status, 'In Progress')
})

test('important UpgradeOS report labels remain centralized', () => {
  assert.equal(reportTerminology.businessHealthScore, 'Business Health Score')
  assert.equal(reportTerminology.upgradeMissions, 'Upgrade Missions')
  assert.equal(reportTerminology.competitiveAssets, 'Competitive Assets')
  assert.equal(reportTerminology.constraints, 'Constraints')
  assert.equal(reportTerminology.operatingPriorities, 'Operating Priorities')
  assert.equal(reportTerminology.snapshotRecorded, 'Snapshot Recorded')
  assert.equal(reportTerminology.operatingManualCreated, 'Operating Manual Created')
})
