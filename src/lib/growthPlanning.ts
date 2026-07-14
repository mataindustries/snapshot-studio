import type {
  EvidenceItem,
  EvidenceType,
  GrowthArchetype,
  OpportunityLevel,
  ProgressStatus,
  RecommendedAction,
  RecommendedActionDifficulty,
  RecommendedActionPriority,
  RecommendedActionStatus,
  Scores,
  SnapshotGrowthFoundation,
} from '../types'
import { getTotalScore } from './scoring'

type ArchetypeBand = {
  name: GrowthArchetype
  scoreLow: number
  scoreHigh: number
}

export const growthArchetypeBands: readonly ArchetypeBand[] = [
  { name: 'Emerging Presence', scoreLow: 0, scoreHigh: 34 },
  { name: 'Clear Provider', scoreLow: 35, scoreHigh: 49 },
  { name: 'Trusted Specialist', scoreLow: 50, scoreHigh: 64 },
  { name: 'Community Favorite', scoreLow: 65, scoreHigh: 79 },
  { name: 'Local Authority', scoreLow: 80, scoreHigh: 89 },
  { name: 'Market Leader', scoreLow: 90, scoreHigh: 100 },
] as const

export const growthArchetypes = growthArchetypeBands.map((band) => band.name)

export const defaultMethodologyNote =
  'Scores and archetypes are planning aids derived from Snapshot Studio\'s five manually assessed visibility categories. Validate the assessment against dated evidence and review it again after changes are implemented.'

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
const actionPriorities: readonly RecommendedActionPriority[] = ['Low', 'Moderate', 'High']
const actionDifficulties: readonly RecommendedActionDifficulty[] = ['Low', 'Moderate', 'High']
const actionStatuses: readonly RecommendedActionStatus[] = [
  'Not started',
  'Planned',
  'In progress',
  'Complete',
]
const evidenceTypes: readonly EvidenceType[] = [
  'Website',
  'Google Profile',
  'Social',
  'Competitor',
  'Search result',
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

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? clampScore(value) : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeRecommendedAction(value: unknown): RecommendedAction | null {
  if (!isRecord(value)) return null

  return {
    title: stringValue(value.title),
    description: stringValue(value.description),
    priority: isOneOf(value.priority, actionPriorities) ? value.priority : 'Moderate',
    difficulty: isOneOf(value.difficulty, actionDifficulties) ? value.difficulty : 'Moderate',
    expectedOutcome: stringValue(value.expectedOutcome),
    status: isOneOf(value.status, actionStatuses) ? value.status : 'Not started',
    evidenceReference: optionalString(value.evidenceReference),
    implementationNote: optionalString(value.implementationNote),
  }
}

function normalizeEvidenceItem(value: unknown): EvidenceItem | null {
  if (!isRecord(value)) return null

  return {
    title: stringValue(value.title),
    sourceUrl: stringValue(value.sourceUrl),
    observation: stringValue(value.observation),
    screenshotPlaceholder: optionalString(value.screenshotPlaceholder),
    evidenceType: isOneOf(value.evidenceType, evidenceTypes) ? value.evidenceType : 'Website',
  }
}

export function getCurrentArchetype(score: number): GrowthArchetype {
  const normalizedScore = clampScore(score)
  return growthArchetypeBands.find((band) => normalizedScore <= band.scoreHigh)?.name
    ?? 'Market Leader'
}

export function getNextArchetype(currentArchetype: GrowthArchetype): GrowthArchetype | null {
  const currentIndex = growthArchetypeBands.findIndex((band) => band.name === currentArchetype)
  return growthArchetypeBands[currentIndex + 1]?.name ?? null
}

export function recommendArchetypes(scores: Scores) {
  const currentScore = clampScore(getTotalScore(scores))
  const currentArchetype = getCurrentArchetype(currentScore)
  return {
    currentScore,
    currentArchetype,
    nextArchetype: getNextArchetype(currentArchetype),
  }
}

export function getOpportunityLevel(score: number): OpportunityLevel {
  const normalizedScore = clampScore(score)
  if (normalizedScore >= 90) return 'Low'
  if (normalizedScore >= 80) return 'Moderate'
  if (normalizedScore >= 50) return 'Strong'
  return 'High'
}

export function getPlanningTargetRange(currentArchetype: GrowthArchetype) {
  const nextArchetype = getNextArchetype(currentArchetype)
  const targetBand = growthArchetypeBands.find(
    (band) => band.name === (nextArchetype ?? currentArchetype),
  ) ?? growthArchetypeBands[growthArchetypeBands.length - 1]

  return {
    targetScoreLow: targetBand.scoreLow,
    targetScoreHigh: targetBand.scoreHigh,
  }
}

export function createGrowthFoundation(scores: Scores): SnapshotGrowthFoundation {
  const archetypes = recommendArchetypes(scores)
  const targetRange = getPlanningTargetRange(archetypes.currentArchetype)

  return {
    ...archetypes,
    ...targetRange,
    opportunityLevel: getOpportunityLevel(archetypes.currentScore),
    strengths: [],
    visibilityLeaks: [],
    recommendedActions: [],
    expectedOutcomes: [],
    evidenceItems: [],
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

  const currentArchetype = isOneOf(value.currentArchetype, growthArchetypes)
    ? value.currentArchetype
    : defaults.currentArchetype
  const nextArchetype = value.nextArchetype === null
    ? null
    : isOneOf(value.nextArchetype, growthArchetypes)
      ? value.nextArchetype
      : defaults.nextArchetype

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
    recommendedActions: Array.isArray(value.recommendedActions)
      ? value.recommendedActions
          .map(normalizeRecommendedAction)
          .filter((action): action is RecommendedAction => action !== null)
      : [],
    expectedOutcomes: stringArray(value.expectedOutcomes),
    evidenceItems: Array.isArray(value.evidenceItems)
      ? value.evidenceItems
          .map(normalizeEvidenceItem)
          .filter((item): item is EvidenceItem => item !== null)
      : [],
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
    recommendedActions: existing.recommendedActions,
    expectedOutcomes: existing.expectedOutcomes,
    evidenceItems: existing.evidenceItems,
    progressStatus: existing.progressStatus,
    reviewDate: existing.reviewDate,
    methodologyNote: existing.methodologyNote,
    planningEstimateDisclaimer: existing.planningEstimateDisclaimer,
  }
}
