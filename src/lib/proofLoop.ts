import type {
  EvidenceItem,
  RecommendedAction,
  SavedSnapshot,
  ScoreKey,
  VerificationStatus,
} from '../types'
import type { Proposal } from '../types/proposal'
import {
  getEvidenceTiming,
  isEvidenceReportReady,
} from './evidence.ts'
import {
  getVerificationReadiness,
  isRelevantAfterEvidence,
  normalizeVerificationStatus,
} from './implementationVerification.ts'

export const followUpScoreKeys: readonly ScoreKey[] = [
  'visibility',
  'trust',
  'conversion',
  'aiSearchReadiness',
  'competitorPosition',
] as const

export type ProofEvidence = {
  title: string
  observation: string
  sourceLabel: string
  screenshotDataUrl?: string
  screenshotAltText?: string
}

export type ProofAction = {
  title: string
  category: string
  implementationStatus: RecommendedAction['status']
  implementationNote: string
  completionDate: string
  baselineEvidence: ProofEvidence[]
  afterEvidence: ProofEvidence[]
  verificationMethod: string
  verificationStatus: VerificationStatus
  outcomeNote: string
  outcomeLabel: 'Conservative outcome note' | 'Operator judgment — unverified'
}

export type ProofReportModel = {
  businessName: string
  marketLabel: string
  engagementTitle: string
  engagementStatus: string
  baselineDate: string
  followUpDate: string
  approvedScope: string[]
  completedActions: ProofAction[]
  incompleteOrUnverified: string[]
  nextAction: string
  reviewDate: string
  claimNote: string
}

export type ProofReportInput = {
  baseline: SavedSnapshot
  followUp: SavedSnapshot
  proposal?: Proposal
}

export type ProofReportValidation = {
  valid: boolean
  issues: string[]
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not recorded'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function cloneAction(action: RecommendedAction): RecommendedAction {
  return {
    ...action,
    blockedBy: [...action.blockedBy],
    unlocks: [...action.unlocks],
    linkedEvidence: [...action.linkedEvidence],
    linkedEvidenceIds: [...action.linkedEvidenceIds],
  }
}

function cloneEvidence(item: EvidenceItem): EvidenceItem {
  return {
    ...item,
    evidenceTiming: getEvidenceTiming(item),
    linkedActionIds: [...item.linkedActionIds],
  }
}

export function createFollowUpSnapshot(
  baseline: SavedSnapshot,
  options: {
    id?: string
    createdAt?: string
    engagementProposalId?: string
  } = {},
): SavedSnapshot {
  const createdAt = options.createdAt ?? new Date().toISOString()
  const baselineSnapshotId = baseline.snapshotKind === 'Follow-up'
    ? baseline.baselineSnapshotId || baseline.id
    : baseline.id

  return {
    ...baseline,
    id: options.id ?? crypto.randomUUID(),
    createdAt,
    snapshotKind: 'Follow-up',
    baselineSnapshotId,
    engagementProposalId: options.engagementProposalId,
    reviewedScoreKeys: [],
    reviewDate: '',
    scores: { ...baseline.scores },
    outputs: { ...baseline.outputs },
    branding: baseline.branding ? { ...baseline.branding } : undefined,
    strengths: [...baseline.strengths],
    visibilityLeaks: [...baseline.visibilityLeaks],
    recommendedActions: baseline.recommendedActions.map(cloneAction),
    actionStatusHistory: baseline.actionStatusHistory.map((entry) => ({ ...entry })),
    expectedOutcomes: [...baseline.expectedOutcomes],
    evidenceItems: baseline.evidenceItems.map(cloneEvidence),
  }
}

function actionIsLinkedToEvidence(action: RecommendedAction, item: EvidenceItem) {
  return action.linkedEvidenceIds.includes(item.id)
    || item.linkedActionIds.includes(action.id)
}

function evidenceForProof(
  action: RecommendedAction,
  evidenceItems: EvidenceItem[],
  timing: 'Baseline' | 'After',
) {
  return evidenceItems.filter((item) =>
    getEvidenceTiming(item) === timing
    && actionIsLinkedToEvidence(action, item)
    && (timing === 'Baseline'
      ? isEvidenceReportReady(item)
      : isRelevantAfterEvidence(item)),
  )
}

function proofEvidence(item: EvidenceItem): ProofEvidence {
  const sourceUrl = /^data:/i.test(item.sourceUrl.trim()) ? '' : item.sourceUrl.trim()
  return {
    title: item.title.trim() || 'Recorded observation',
    observation: item.observation.trim() || 'Screenshot evidence recorded; observation note pending.',
    sourceLabel: [item.pageLabel.trim(), sourceUrl].filter(Boolean).join(' — ')
      || 'Source not specified',
    screenshotDataUrl: item.screenshotDataUrl,
    screenshotAltText: item.screenshotAltText,
  }
}

function completionDate(
  action: RecommendedAction,
  followUp: SavedSnapshot,
) {
  if (action.completionDate?.trim()) return formatDate(action.completionDate)
  const latest = followUp.actionStatusHistory
    .filter((entry) => entry.actionId === action.id && entry.newStatus === 'Completed')
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt))[0]
  return latest ? formatDate(latest.changedAt) : 'Date not recorded'
}

function scopeActions(input: ProofReportInput) {
  const actionById = new Map(
    input.followUp.recommendedActions.map((action) => [action.id, action]),
  )
  const selectedIds = input.proposal?.selectedActionIds.length
    ? input.proposal.selectedActionIds
    : input.followUp.recommendedActions.map((action) => action.id)
  return selectedIds
    .map((id) => actionById.get(id))
    .filter((action): action is RecommendedAction => Boolean(action))
}

function approvedScope(input: ProofReportInput, actions: RecommendedAction[]) {
  const actionTitles = actions.map((action) => action.title)
  const customTitles = input.proposal?.customDeliverables.map((item) => item.title) ?? []
  return uniqueStrings([...actionTitles, ...customTitles])
}

function createProofAction(
  action: RecommendedAction,
  input: ProofReportInput,
): ProofAction {
  const verificationStatus = normalizeVerificationStatus(action.verificationStatus)
  return {
    title: action.title,
    category: action.category,
    implementationStatus: action.status,
    implementationNote: action.implementationNote?.trim() || 'Implementation note not recorded.',
    completionDate: completionDate(action, input.followUp),
    baselineEvidence: evidenceForProof(
      action,
      input.baseline.evidenceItems,
      'Baseline',
    ).map(proofEvidence),
    afterEvidence: evidenceForProof(
      action,
      input.followUp.evidenceItems,
      'After',
    ).map(proofEvidence),
    verificationMethod: action.verificationMethod?.trim() || 'Not yet recorded.',
    verificationStatus,
    outcomeNote: action.outcomeNote?.trim() || 'Not yet verified.',
    outcomeLabel: verificationStatus === 'Verified'
      ? 'Conservative outcome note'
      : 'Operator judgment — unverified',
  }
}

function openItems(
  input: ProofReportInput,
  actions: RecommendedAction[],
) {
  const items = actions.flatMap((action) => {
    const verificationStatus = normalizeVerificationStatus(action.verificationStatus)
    if (action.status !== 'Completed') {
      return [`${action.title} — implementation ${action.status.toLocaleLowerCase()}.`]
    }
    if (verificationStatus !== 'Verified') {
      return [`${action.title} — ${verificationStatus}.`]
    }
    return []
  })
  const trackedActionIds = new Set(actions.map((action) => action.id))
  const customItems = input.proposal?.customDeliverables
    .filter((item) => !item.linkedActionId || !trackedActionIds.has(item.linkedActionId))
    .map((item) => `${item.title} — completion is not recorded on a canonical action.`)
    ?? []
  return uniqueStrings([...items, ...customItems])
}

function recommendedNextAction(actions: RecommendedAction[]) {
  const ready = actions.find((action) =>
    action.status === 'Completed'
    && normalizeVerificationStatus(action.verificationStatus) === 'Ready for review',
  )
  if (ready) return `Review the recorded method and after evidence for “${ready.title}.”`

  const unverified = actions.find((action) =>
    action.status === 'Completed'
    && normalizeVerificationStatus(action.verificationStatus) === 'Not verified',
  )
  if (unverified) return `Capture after evidence and verify “${unverified.title}.”`

  const couldNotVerify = actions.find((action) =>
    action.status === 'Completed'
    && normalizeVerificationStatus(action.verificationStatus) === 'Could not verify',
  )
  if (couldNotVerify) return `Resolve the verification gap for “${couldNotVerify.title}.”`

  const incomplete = actions.find((action) => action.status !== 'Completed')
  if (incomplete) return `Complete “${incomplete.title}” and record the observable result.`

  return 'Review the next operating priority in a new, evidence-backed Snapshot.'
}

export function createProofReportModel(input: ProofReportInput): ProofReportModel {
  const actions = scopeActions(input)
  const completedActions = actions
    .filter((action) => action.status === 'Completed')
    .map((action) => createProofAction(action, input))

  return {
    businessName: input.followUp.businessName.trim() || 'Business name not recorded',
    marketLabel: uniqueStrings([
      input.followUp.mainService,
      input.followUp.city,
    ]).join(' · ') || 'Engagement details not recorded',
    engagementTitle: input.proposal?.proposalTitle.trim()
      || 'Snapshot implementation plan',
    engagementStatus: input.proposal?.proposalStatus === 'Accepted'
      ? 'Accepted proposal'
      : 'Proposal acceptance not recorded',
    baselineDate: formatDate(input.baseline.createdAt),
    followUpDate: formatDate(input.followUp.createdAt),
    approvedScope: approvedScope(input, actions),
    completedActions,
    incompleteOrUnverified: openItems(input, actions),
    nextAction: recommendedNextAction(actions),
    reviewDate: input.followUp.reviewDate.trim()
      ? formatDate(input.followUp.reviewDate)
      : 'Not scheduled',
    claimNote: 'Verification confirms only the observable implementation recorded here. No ranking, lead, booking, conversion, customer-behavior, or revenue change is implied without separately supplied evidence.',
  }
}

export function validateProofReport(input: ProofReportInput): ProofReportValidation {
  const issues: string[] = []
  const actions = scopeActions(input)
  const reviewedKeys = new Set(input.followUp.reviewedScoreKeys ?? [])

  if (input.followUp.snapshotKind !== 'Follow-up') {
    issues.push('Open a Follow-Up Snapshot before generating the Proof Report.')
  }
  if (
    !input.followUp.baselineSnapshotId
    || input.followUp.baselineSnapshotId !== input.baseline.id
    || input.followUp.id === input.baseline.id
  ) {
    issues.push('The Follow-Up Snapshot must retain a distinct stable link to its baseline.')
  }
  if (
    !input.proposal
    || input.proposal.proposalStatus !== 'Accepted'
    || input.proposal.snapshotId !== input.baseline.id
    || input.followUp.engagementProposalId !== input.proposal.id
  ) {
    issues.push('Link the Follow-Up Snapshot to an accepted proposal for approved scope.')
  }
  if (!input.followUp.businessName.trim()) {
    issues.push('Business identity is required.')
  }
  if (followUpScoreKeys.some((key) => !reviewedKeys.has(key))) {
    issues.push('Review all five Follow-Up Snapshot scores before client export.')
  }
  if (actions.length === 0) {
    issues.push('The accepted scope does not resolve to a canonical Snapshot action.')
  }
  if (!actions.some((action) => action.status === 'Completed')) {
    issues.push('Record at least one completed canonical action.')
  }
  if (!actions.some((action) =>
    evidenceForProof(action, input.followUp.evidenceItems, 'After').length > 0,
  )) {
    issues.push('Record at least one linked after-state observation or screenshot.')
  }
  if (!input.followUp.reviewDate.trim()) {
    issues.push('Set the next review date.')
  } else if (Number.isNaN(new Date(input.followUp.reviewDate).getTime())) {
    issues.push('Enter a valid next review date.')
  }

  actions.forEach((action) => {
    if (
      normalizeVerificationStatus(action.verificationStatus) === 'Verified'
      && !getVerificationReadiness(action, input.followUp.evidenceItems).ready
    ) {
      issues.push(`“${action.title}” no longer has enough support to remain Verified.`)
    }
  })

  return { valid: issues.length === 0, issues: uniqueStrings(issues) }
}

function formatEvidence(items: ProofEvidence[]) {
  return items.length > 0
    ? items.map((item) => `- ${item.title}: ${item.observation}`).join('\n')
    : '- Not yet verified.'
}

export function formatProofReportText(model: ProofReportModel) {
  const completed = model.completedActions.length > 0
    ? model.completedActions.map((action) => `${action.title} — ${action.verificationStatus}
Implementation: ${action.implementationNote}
Completion date: ${action.completionDate}
Baseline evidence:
${formatEvidence(action.baselineEvidence)}
After evidence:
${formatEvidence(action.afterEvidence)}
Verification method: ${action.verificationMethod}
${action.outcomeLabel}: ${action.outcomeNote}`).join('\n\n')
    : 'No completed actions are recorded.'
  const open = model.incompleteOrUnverified.length > 0
    ? model.incompleteOrUnverified.map((item) => `- ${item}`).join('\n')
    : '- No incomplete or unverified scope items are recorded.'

  return `UpgradeOS Proof Report

${model.businessName}
${model.marketLabel}
Engagement: ${model.engagementTitle} — ${model.engagementStatus}
Baseline Snapshot: ${model.baselineDate}
Follow-Up Snapshot: ${model.followUpDate}

Approved implementation scope
${model.approvedScope.map((item) => `- ${item}`).join('\n') || '- Scope not recorded.'}

Completed actions and proof
${completed}

Incomplete or still unverified
${open}

Recommended next action: ${model.nextAction}
Next review date: ${model.reviewDate}

${model.claimNote}`
}
