import type {
  GrowthStage,
  OpportunityLevel,
  ProgressStatus,
  RecommendedAction,
  Scores,
  SnapshotGrowthFoundation,
} from '../types'
import {
  normalizeEvidenceItem,
  synchronizeEvidenceLinks,
} from './evidence.ts'
import { normalizeRecommendedAction } from './actionPlanner.ts'
import { normalizeActionStatusHistory } from './actionProgress.ts'
import { reconcileActionVerification } from './implementationVerification.ts'
import { getTotalScore } from './scoring.ts'

type GrowthStageBand = {
  name: GrowthStage
  scoreLow: number
  scoreHigh: number
}

export const growthStageBands: readonly GrowthStageBand[] = [
  { name: 'Emerging Presence', scoreLow: 0, scoreHigh: 34 },
  { name: 'Clear Provider', scoreLow: 35, scoreHigh: 49 },
  { name: 'Trusted Specialist', scoreLow: 50, scoreHigh: 64 },
  { name: 'Community Favorite', scoreLow: 65, scoreHigh: 79 },
  { name: 'Local Authority', scoreLow: 80, scoreHigh: 89 },
  { name: 'Market Leader', scoreLow: 90, scoreHigh: 100 },
] as const

export const growthStages = growthStageBands.map((band) => band.name)

export const defaultMethodologyNote =
  'Scores and growth stages are planning aids derived from Snapshot Studio\'s five manually assessed visibility categories. Validate the assessment against dated evidence and review it again after changes are implemented.'

export const defaultPlanningEstimateDisclaimer =
  'Target score ranges are planning estimates only. They do not guarantee search rankings, revenue, lead volume, or inclusion in AI-generated results.'

const opportunityLevels: readonly OpportunityLevel[] = ['Low', 'Moderate', 'Strong', 'High']
const progressStatuses: readonly ProgressStatus[] = [
  'Not started',
  'Planning',
  'In progress',
  'Monitoring',
  'Complete',
]
function clampScore(score: number) {
  return Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? clampScore(value) : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function getCurrentGrowthStage(score: number): GrowthStage {
  const normalizedScore = clampScore(score)
  return growthStageBands.find((band) => normalizedScore <= band.scoreHigh)?.name
    ?? 'Market Leader'
}

export function getNextGrowthStage(currentGrowthStage: GrowthStage): GrowthStage | null {
  const currentIndex = growthStageBands.findIndex((band) => band.name === currentGrowthStage)
  return growthStageBands[currentIndex + 1]?.name ?? null
}

export function recommendGrowthStages(scores: Scores) {
  const currentScore = clampScore(getTotalScore(scores))
  const currentGrowthStage = getCurrentGrowthStage(currentScore)
  return {
    currentScore,
    currentArchetype: currentGrowthStage,
    nextArchetype: getNextGrowthStage(currentGrowthStage),
  }
}

export function getOpportunityLevel(score: number): OpportunityLevel {
  const normalizedScore = clampScore(score)
  if (normalizedScore >= 90) return 'Low'
  if (normalizedScore >= 80) return 'Moderate'
  if (normalizedScore >= 50) return 'Strong'
  return 'High'
}

export function getPlanningTargetRange(currentGrowthStage: GrowthStage) {
  const nextGrowthStage = getNextGrowthStage(currentGrowthStage)
  const targetBand = growthStageBands.find(
    (band) => band.name === (nextGrowthStage ?? currentGrowthStage),
  ) ?? growthStageBands[growthStageBands.length - 1]

  return {
    targetScoreLow: targetBand.scoreLow,
    targetScoreHigh: targetBand.scoreHigh,
  }
}

export function createGrowthFoundation(scores: Scores): SnapshotGrowthFoundation {
  const growthStagePlan = recommendGrowthStages(scores)
  const targetRange = getPlanningTargetRange(growthStagePlan.currentArchetype)

  return {
    ...growthStagePlan,
    ...targetRange,
    opportunityLevel: getOpportunityLevel(growthStagePlan.currentScore),
    strengths: [],
    visibilityLeaks: [],
    recommendedActions: [],
    actionStatusHistory: [],
    expectedOutcomes: [],
    evidenceItems: [],
    includeIncompleteEvidence: false,
    progressStatus: 'Not started',
    reviewDate: '',
    methodologyNote: defaultMethodologyNote,
    planningEstimateDisclaimer: defaultPlanningEstimateDisclaimer,
  }
}

export function normalizeGrowthFoundation(
  value: unknown,
  scores: Scores,
): SnapshotGrowthFoundation {
  const defaults = createGrowthFoundation(scores)
  if (!isRecord(value)) return defaults

  const currentArchetype = isOneOf(value.currentArchetype, growthStages)
    ? value.currentArchetype
    : defaults.currentArchetype
  const nextArchetype = value.nextArchetype === null
    ? null
    : isOneOf(value.nextArchetype, growthStages)
      ? value.nextArchetype
      : defaults.nextArchetype

  const recommendedActions = Array.isArray(value.recommendedActions)
    ? value.recommendedActions
        .map((action, index) => normalizeRecommendedAction(action, index, scores))
        .filter((action): action is RecommendedAction => action !== null)
    : []
  const evidenceItems = Array.isArray(value.evidenceItems)
    ? value.evidenceItems
        .map(normalizeEvidenceItem)
        .filter((item): item is NonNullable<ReturnType<typeof normalizeEvidenceItem>> => item !== null)
    : []
  const actionsWithLegacyLinks = recommendedActions.map((action) => {
    if (!action.evidenceReference || action.linkedEvidenceIds.length > 0) return action
    const legacyMatch = evidenceItems.find((item) =>
      item.id === action.evidenceReference
      || item.title === action.evidenceReference
      || item.sourceUrl === action.evidenceReference,
    )
    return legacyMatch ? { ...action, linkedEvidenceIds: [legacyMatch.id] } : action
  })
  const linkedItems = synchronizeEvidenceLinks(evidenceItems, actionsWithLegacyLinks)

  return {
    currentScore: numberValue(value.currentScore, defaults.currentScore),
    targetScoreLow: numberValue(value.targetScoreLow, defaults.targetScoreLow),
    targetScoreHigh: numberValue(value.targetScoreHigh, defaults.targetScoreHigh),
    opportunityLevel: isOneOf(value.opportunityLevel, opportunityLevels)
      ? value.opportunityLevel
      : defaults.opportunityLevel,
    currentArchetype,
    nextArchetype,
    strengths: stringArray(value.strengths),
    visibilityLeaks: stringArray(value.visibilityLeaks),
    operatorDraftAppliedAt: typeof value.operatorDraftAppliedAt === 'string'
      ? value.operatorDraftAppliedAt
      : undefined,
    recommendedActions: linkedItems.actions.map((action) => ({
      ...reconcileActionVerification(action, linkedItems.evidenceItems),
      linkedEvidence: action.linkedEvidenceIds,
    })),
    actionStatusHistory: normalizeActionStatusHistory(value.actionStatusHistory),
    expectedOutcomes: stringArray(value.expectedOutcomes),
    evidenceItems: linkedItems.evidenceItems,
    includeIncompleteEvidence: typeof value.includeIncompleteEvidence === 'boolean'
      ? value.includeIncompleteEvidence
      : defaults.includeIncompleteEvidence,
    progressStatus: isOneOf(value.progressStatus, progressStatuses)
      ? value.progressStatus
      : defaults.progressStatus,
    reviewDate: stringValue(value.reviewDate),
    methodologyNote: stringValue(value.methodologyNote, defaultMethodologyNote),
    planningEstimateDisclaimer: stringValue(
      value.planningEstimateDisclaimer,
      defaultPlanningEstimateDisclaimer,
    ),
  }
}

export function refreshGrowthFoundation(
  scores: Scores,
  existing?: SnapshotGrowthFoundation,
): SnapshotGrowthFoundation {
  const derived = createGrowthFoundation(scores)
  if (!existing) return derived

  return {
    ...derived,
    strengths: existing.strengths,
    visibilityLeaks: existing.visibilityLeaks,
    operatorDraftAppliedAt: existing.operatorDraftAppliedAt,
    recommendedActions: existing.recommendedActions,
    actionStatusHistory: existing.actionStatusHistory,
    expectedOutcomes: existing.expectedOutcomes,
    evidenceItems: existing.evidenceItems,
    includeIncompleteEvidence: existing.includeIncompleteEvidence,
    progressStatus: existing.progressStatus,
    reviewDate: existing.reviewDate,
    methodologyNote: existing.methodologyNote,
    planningEstimateDisclaimer: existing.planningEstimateDisclaimer,
  }
}
