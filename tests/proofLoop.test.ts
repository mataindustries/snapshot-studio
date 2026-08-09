import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  EvidenceItem,
  RecommendedAction,
  SavedSnapshot,
  Scores,
} from '../src/types.ts'
import type { Proposal } from '../src/types/proposal.ts'
import { defaultReportOffer } from '../src/lib/reportOffer.ts'
import { createGrowthFoundation } from '../src/lib/growthPlanning.ts'
import {
  applyActionVerificationPatch,
  reconcileActionVerification,
} from '../src/lib/implementationVerification.ts'
import {
  createFollowUpSnapshot,
  createProofReportModel,
  followUpScoreKeys,
  formatProofReportText,
  validateProofReport,
} from '../src/lib/proofLoop.ts'
import {
  loadSnapshots,
  migrateSnapshot,
  saveSnapshot,
} from '../src/lib/storage.ts'

const scores: Scores = {
  visibility: 13,
  trust: 15,
  conversion: 11,
  aiSearchReadiness: 9,
  competitorPosition: 12,
}

function action(overrides: Partial<RecommendedAction> = {}): RecommendedAction {
  return {
    id: 'action-1',
    title: 'Clarify the first-screen service promise',
    description: 'Name the primary service, location, and next step on the first screen.',
    category: 'Homepage',
    priority: 'High',
    estimatedEffort: 'Small',
    estimatedImpact: 'High',
    estimatedHours: 3,
    priorityScore: 90,
    opportunityScore: 86,
    reason: 'The baseline first screen does not establish local service fit.',
    expectedOutcome: 'The service path becomes easier to understand.',
    objective: 'Establish a clear local service promise.',
    businessValue: 'A visitor can evaluate fit without hunting for basic details.',
    status: 'Not Started',
    blockedBy: [],
    unlocks: [],
    recommendedOrder: 1,
    linkedEvidence: ['evidence-before'],
    linkedEvidenceIds: ['evidence-before'],
    ...overrides,
  }
}

function evidence(
  id: string,
  evidenceTiming: 'Baseline' | 'After',
  overrides: Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id,
    evidenceType: 'Website',
    sentiment: evidenceTiming === 'Baseline' ? 'Opportunity' : 'Neutral',
    evidenceTiming,
    title: evidenceTiming === 'Baseline'
      ? 'Original first-screen message'
      : 'Updated first-screen message',
    sourceUrl: 'https://example.test',
    pageLabel: 'Homepage',
    observation: evidenceTiming === 'Baseline'
      ? 'The primary service and city are not visible in the first screen.'
      : 'The first screen now names emergency repair, Riverton, and one request action.',
    whyItMatters: 'A visitor needs an observable route to evaluate local service fit.',
    recommendedChange: 'Name the service, city, and one next step.',
    expectedOutcome: 'The visible offer becomes easier to understand.',
    linkedActionIds: ['action-1'],
    createdAt: evidenceTiming === 'Baseline'
      ? '2026-06-01T12:00:00.000Z'
      : '2026-06-15T12:00:00.000Z',
    updatedAt: evidenceTiming === 'Baseline'
      ? '2026-06-01T12:00:00.000Z'
      : '2026-06-15T12:00:00.000Z',
    ...overrides,
  }
}

function snapshot(overrides: Partial<SavedSnapshot> = {}): SavedSnapshot {
  return {
    businessName: 'Riverton Heating Co.',
    websiteUrl: 'https://example.test',
    city: 'Riverton',
    niche: 'Residential HVAC',
    mainService: 'Emergency heating repair',
    notes: 'Local availability is visible in reviewed business details.',
    weakness: 'The first-screen promise needs clarity.',
    competitorNote: '',
    competitorUrl1: '',
    competitorUrl2: '',
    tone: 'professional',
    ctaStyle: 'book-call',
    ...createGrowthFoundation(scores),
    recommendedActions: [action()],
    evidenceItems: [evidence('evidence-before', 'Baseline')],
    ...defaultReportOffer,
    id: 'snapshot-baseline',
    createdAt: '2026-06-01T12:00:00.000Z',
    scores: { ...scores },
    outputs: {
      snapshot: 'Snapshot output',
      email: 'Email output',
      text: 'Text output',
      shareable: 'Share output',
      upsell: 'Upsell output',
    },
    branding: {
      preparedBy: 'Sergio',
      brandName: 'Snapshot Studio',
      contactLine: 'sergio@example.test',
    },
    snapshotKind: 'Baseline',
    ...overrides,
  }
}

function acceptedProposal(source: SavedSnapshot): Proposal {
  return {
    id: 'proposal-accepted',
    snapshotId: source.id,
    createdAt: '2026-06-02T12:00:00.000Z',
    updatedAt: '2026-06-03T12:00:00.000Z',
    proposalStatus: 'Accepted',
    proposalType: 'Custom Implementation',
    proposalTitle: 'Approved first-screen implementation',
    clientBusinessName: source.businessName,
    preparedBy: source.branding?.preparedBy || 'Sergio',
    brandName: source.branding?.brandName || 'Snapshot Studio',
    contactLine: source.branding?.contactLine || '',
    proposalSummary: 'Implement the approved canonical Snapshot action.',
    selectedActionIds: ['action-1'],
    customDeliverables: [],
    timeline: 'One week',
    milestones: [],
    investmentMode: 'Fixed Price',
    fixedPrice: '297',
    currency: 'USD',
    paymentTerms: 'Due before implementation.',
    assumptions: [],
    exclusions: [],
    clientResponsibilities: [],
    nextStepHeadline: 'Approve implementation',
    nextStepBody: 'Confirm the approved scope and start window.',
    ctaLabel: 'Approve scope',
    snapshotContext: {
      primaryService: source.mainService,
      city: source.city,
      horoscopeName: 'Reputation Magnet',
      growthStage: source.currentArchetype,
      currentScore: source.currentScore,
      targetScoreLow: source.targetScoreLow,
      targetScoreHigh: source.targetScoreHigh,
      biggestOpportunityTitle: source.recommendedActions[0].title,
      biggestOpportunitySummary: source.recommendedActions[0].description,
      roadmapThemes: [source.recommendedActions[0].title],
    },
  }
}

test('completed and verified remain separate, and Verified requires method plus after support', () => {
  const completed = action({ status: 'Completed', verificationStatus: 'Not verified' })
  const baseline = evidence('evidence-before', 'Baseline')

  assert.equal(completed.status, 'Completed')
  assert.equal(completed.verificationStatus, 'Not verified')

  const unsupported = applyActionVerificationPatch(
    completed,
    { verificationStatus: 'Verified' },
    [baseline],
  )
  assert.match(unsupported.error ?? '', /verification method/i)
  assert.match(unsupported.error ?? '', /after-state/i)
  assert.equal(unsupported.action.verificationStatus, 'Not verified')

  const after = evidence('evidence-after', 'After')
  const supported = applyActionVerificationPatch(
    { ...completed, verificationMethod: 'Reviewed the live homepage on phone and desktop.' },
    { verificationStatus: 'Verified' },
    [baseline, after],
  )
  assert.equal(supported.error, undefined)
  assert.equal(supported.action.verificationStatus, 'Verified')

  const reopened = reconcileActionVerification(
    { ...supported.action, status: 'Needs Review' },
    [baseline, after],
  )
  assert.equal(reopened.status, 'Needs Review')
  assert.equal(reopened.verificationStatus, 'Ready for review')
})

test('legacy evidence migrates to Baseline while stable IDs and unknown fields survive', () => {
  const legacy = structuredClone(snapshot())
  delete legacy.evidenceItems[0].evidenceTiming
  legacy.recommendedActions[0].verificationStatus = 'Verified'
  ;(legacy as SavedSnapshot & { operatorExtension?: string }).operatorExtension = 'keep-me'

  const migrated = migrateSnapshot(legacy)

  assert.ok(migrated)
  assert.equal(migrated.evidenceItems[0].evidenceTiming, 'Baseline')
  assert.equal(migrated.evidenceItems[0].id, 'evidence-before')
  assert.equal(migrated.recommendedActions[0].id, 'action-1')
  assert.equal(migrated.recommendedActions[0].verificationStatus, 'Ready for review')
  assert.equal(
    (migrated as SavedSnapshot & { operatorExtension?: string }).operatorExtension,
    'keep-me',
  )
})

test('creating a Follow-Up Snapshot preserves the baseline and stable canonical links', () => {
  const baseline = snapshot()
  const original = structuredClone(baseline)
  const followUp = createFollowUpSnapshot(baseline, {
    id: 'snapshot-follow-up',
    createdAt: '2026-06-15T12:00:00.000Z',
    engagementProposalId: 'proposal-accepted',
  })

  assert.deepEqual(baseline, original)
  assert.equal(followUp.id, 'snapshot-follow-up')
  assert.notEqual(followUp.id, baseline.id)
  assert.equal(followUp.snapshotKind, 'Follow-up')
  assert.equal(followUp.baselineSnapshotId, baseline.id)
  assert.equal(followUp.engagementProposalId, 'proposal-accepted')
  assert.deepEqual(followUp.reviewedScoreKeys, [])
  assert.equal(followUp.recommendedActions[0].id, baseline.recommendedActions[0].id)
  assert.equal(followUp.evidenceItems[0].id, baseline.evidenceItems[0].id)
  assert.notEqual(followUp.recommendedActions[0], baseline.recommendedActions[0])
  assert.notEqual(followUp.evidenceItems[0], baseline.evidenceItems[0])

  followUp.recommendedActions[0].linkedEvidenceIds.push('evidence-after')
  assert.deepEqual(baseline.recommendedActions[0].linkedEvidenceIds, ['evidence-before'])
})

test('Proof Report derives accepted scope and claim-safe proof from canonical records', () => {
  const baseline = snapshot()
  const proposal = acceptedProposal(baseline)
  const followUp = createFollowUpSnapshot(baseline, {
    id: 'snapshot-follow-up',
    createdAt: '2026-06-15T12:00:00.000Z',
    engagementProposalId: proposal.id,
  })
  const after = evidence('evidence-after', 'After', {
    screenshotDataUrl: 'data:image/png;base64,AAAA',
    screenshotAltText: 'Updated homepage first screen',
  })
  followUp.evidenceItems.push(after)
  followUp.recommendedActions = [action({
    status: 'Completed',
    implementationNote: 'Published the approved first-screen service and location message.',
    completionDate: '2026-06-14',
    verificationMethod: 'Reviewed the published homepage at phone and desktop widths.',
    verificationStatus: 'Verified',
    outcomeNote: 'The published first screen now visibly states the service, city, and request action.',
    linkedEvidence: ['evidence-before', 'evidence-after'],
    linkedEvidenceIds: ['evidence-before', 'evidence-after'],
  })]
  followUp.reviewedScoreKeys = [...followUpScoreKeys]
  followUp.reviewDate = '2026-07-01'

  const input = { baseline, followUp, proposal }
  const validation = validateProofReport(input)
  const model = createProofReportModel(input)
  const text = formatProofReportText(model)

  assert.deepEqual(validation, { valid: true, issues: [] })
  assert.deepEqual(model.approvedScope, [action().title])
  assert.equal(model.completedActions[0].baselineEvidence.length, 1)
  assert.equal(model.completedActions[0].afterEvidence.length, 1)
  assert.equal(model.completedActions[0].verificationStatus, 'Verified')
  assert.match(text, /Baseline Snapshot: Jun 1, 2026/)
  assert.match(text, /Follow-Up Snapshot: Jun 15, 2026/)
  assert.match(text, /Reviewed the published homepage at phone and desktop widths/)
  assert.match(text, /No ranking, lead, booking, conversion, customer-behavior, or revenue change is implied/)
  assert.doesNotMatch(text, /action-1|evidence-before|evidence-after|data:image/i)

  const unverifiedModel = createProofReportModel({
    ...input,
    followUp: {
      ...followUp,
      recommendedActions: followUp.recommendedActions.map((item) => ({
        ...item,
        verificationStatus: 'Not verified',
        outcomeNote: undefined,
      })),
    },
  })
  assert.match(formatProofReportText(unverifiedModel), /Operator judgment — unverified: Not yet verified/)
})

test('Proof Report validation blocks missing scope linkage, score review, proof, and review date', () => {
  const baseline = snapshot()
  const followUp = createFollowUpSnapshot(baseline, {
    id: 'snapshot-follow-up',
    createdAt: '2026-06-15T12:00:00.000Z',
  })
  const result = validateProofReport({ baseline, followUp })

  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => /accepted proposal/i.test(issue)))
  assert.ok(result.issues.some((issue) => /five.*scores/i.test(issue)))
  assert.ok(result.issues.some((issue) => /completed canonical action/i.test(issue)))
  assert.ok(result.issues.some((issue) => /after-state/i.test(issue)))
  assert.ok(result.issues.some((issue) => /review date/i.test(issue)))
})

test('snapshot persistence writes a versioned envelope and still loads legacy raw arrays', () => {
  const memory = new Map<string, string>()
  const localStorageMock: Storage = {
    get length() { return memory.size },
    clear() { memory.clear() },
    getItem(key) { return memory.get(key) ?? null },
    key(index) { return Array.from(memory.keys())[index] ?? null },
    removeItem(key) { memory.delete(key) },
    setItem(key, value) { memory.set(key, value) },
  }
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  })

  try {
    saveSnapshot(snapshot())
    const envelope = JSON.parse(
      localStorageMock.getItem('snapshot-studio:snapshots') ?? '{}',
    ) as { version?: number; snapshots?: unknown[] }
    assert.equal(envelope.version, 2)
    assert.equal(envelope.snapshots?.length, 1)

    const legacy = structuredClone(snapshot({ id: 'legacy-snapshot' }))
    delete legacy.evidenceItems[0].evidenceTiming
    localStorageMock.setItem('snapshot-studio:snapshots', JSON.stringify([legacy]))
    const loaded = loadSnapshots()
    assert.equal(loaded[0].id, 'legacy-snapshot')
    assert.equal(loaded[0].evidenceItems[0].evidenceTiming, 'Baseline')
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'localStorage', descriptor)
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage
    }
  }
})
