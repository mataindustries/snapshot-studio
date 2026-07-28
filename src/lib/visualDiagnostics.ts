import type {
  EvidenceItem,
  RecommendedAction,
  RecommendedActionEffort,
  RecommendedActionImpact,
  RecommendedActionStatus,
  ScoreKey,
  Scores,
} from '../types'
import { isEvidenceReportReady } from './evidence.ts'
import type { ProgressJourneyModel } from './progressJourney'
import type { ConsultingRoadmap } from './roadmap'
import { getNextMilestone } from './actionProgress.ts'
import {
  areScoresDisplayable,
  normalizeScoreForDisplay,
  requiredScoreKeys,
} from './scoring.ts'

export type ScoreDiagnosticStatus = 'Foundation' | 'Developing' | 'Strong' | 'Leading'

export type ScoreDiagnostic = {
  key: ScoreKey
  label: string
  available: boolean
  score: number | null
  percentage: number | null
  status: ScoreDiagnosticStatus | null
}

export type OpportunityZoneKey =
  | 'quickWins'
  | 'strategicMoves'
  | 'maintenance'
  | 'largerBuilds'

export type OpportunityActionDiagnostic = {
  id: string
  title: string
  conciseTitle: string
  impact: RecommendedActionImpact
  effort: RecommendedActionEffort
  status: RecommendedActionStatus
  isNext: boolean
}

export type OpportunityZone = {
  key: OpportunityZoneKey
  label: string
  description: string
  actions: OpportunityActionDiagnostic[]
}

export type OpportunityMatrixDiagnostic = {
  actionCount: number
  nextActionTitle: string
  isImplementationComplete: boolean
  zones: OpportunityZone[]
}

export type MomentumStageState = 'current' | 'projected' | 'future'

export type MomentumStageDiagnostic = {
  order: 1 | 2 | 3 | 4
  title: string
  state: MomentumStageState
  stateLabel: string
  statusLabel: string
  growthStage: string
  scoreContext: string
  whatChanges: string
  verification: string
}

export type SprintPhaseDiagnostic = {
  phaseNumber: 1 | 2
  window: ConsultingRoadmap['sprint'][number]['window']
  mainAction: string
  description: string
  deliverable: string
  estimatedEffort: RecommendedActionEffort
  expectedGain: string
  status: RecommendedActionStatus
}

export type MonthWeekDiagnostic = {
  week: 1 | 2 | 3 | 4
  theme: 'Clarity' | 'Trust' | 'Authority' | 'AI Readiness'
  objective: string
  keyWork: string[]
  estimatedEffort: string
  milestone: string
  successSignal: string
  status: RecommendedActionStatus
}

export type PreliminaryEvidenceDiagnostic = {
  mode: 'preliminary'
  message: 'Preliminary review — evidence can be added during implementation planning.'
}

export type DocumentedEvidenceDiagnostic = {
  mode: 'documented'
  documentedObservationCount: number
  screenshotBackedRecommendationCount: number
  coveredRecommendationCount: number
  awaitingProofCount: number
  eligibleRecommendationCount: number
}

export type EvidenceDiagnostic =
  | PreliminaryEvidenceDiagnostic
  | DocumentedEvidenceDiagnostic

export type VisualDiagnostics = {
  scores: ScoreDiagnostic[]
  opportunityMatrix: OpportunityMatrixDiagnostic
  momentumTimeline: MomentumStageDiagnostic[]
  sprintPhases: SprintPhaseDiagnostic[]
  monthWeeks: MonthWeekDiagnostic[]
  evidence: EvidenceDiagnostic
}

const clientScoreLabels: Record<ScoreKey, string> = {
  visibility: 'Visibility',
  trust: 'Trust',
  conversion: 'Conversion',
  aiSearchReadiness: 'AI Search Readiness',
  competitorPosition: 'Competitive Position',
}

const monthThemeByWeek: Record<
  1 | 2 | 3 | 4,
  MonthWeekDiagnostic['theme']
> = {
  1: 'Clarity',
  2: 'Trust',
  3: 'Authority',
  4: 'AI Readiness',
}

const zoneDefinitions: Array<Omit<OpportunityZone, 'actions'>> = [
  {
    key: 'quickWins',
    label: 'Quick Wins',
    description: 'High impact · small effort',
  },
  {
    key: 'strategicMoves',
    label: 'Strategic Moves',
    description: 'High impact · medium or large effort',
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    description: 'Low or medium impact · small effort',
  },
  {
    key: 'largerBuilds',
    label: 'Larger Builds',
    description: 'Low or medium impact · medium or large effort',
  },
]

function getScoreStatus(percentage: number): ScoreDiagnosticStatus {
  if (percentage >= 85) return 'Leading'
  if (percentage >= 65) return 'Strong'
  if (percentage >= 40) return 'Developing'
  return 'Foundation'
}

export function createScoreDiagnostics(scores: Scores): ScoreDiagnostic[] {
  const scoresAvailable = areScoresDisplayable(scores)
  return requiredScoreKeys.map((key) => {
    const normalized = normalizeScoreForDisplay(scores[key])
    const available = scoresAvailable && normalized.available
    const percentage = available ? normalized.percentage : null

    return {
      key,
      label: clientScoreLabels[key],
      available,
      score: available ? normalized.score : null,
      percentage,
      status: percentage === null ? null : getScoreStatus(percentage),
    }
  })
}

function limitWords(value: string, maximum: number) {
  const words = value.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  return words.length <= maximum ? words.join(' ') : value.trim().replace(/\s+/g, ' ')
}

function opportunityZoneFor(action: RecommendedAction): OpportunityZoneKey {
  const highImpact = action.estimatedImpact === 'High'
  const smallEffort = action.estimatedEffort === 'Small'

  if (highImpact && smallEffort) return 'quickWins'
  if (highImpact) return 'strategicMoves'
  if (smallEffort) return 'maintenance'
  return 'largerBuilds'
}

function orderedActions(actions: RecommendedAction[]) {
  return [...actions].sort(
    (left, right) =>
      left.recommendedOrder - right.recommendedOrder
      || right.priorityScore - left.priorityScore,
  )
}

export function createOpportunityMatrix(
  actions: RecommendedAction[],
): OpportunityMatrixDiagnostic {
  const ordered = orderedActions(actions)
  const nextAction = getNextMilestone(actions)
  const candidates = ordered
  const selected = candidates.slice(0, 6)

  if (nextAction && !selected.some((action) => action.id === nextAction.id)) {
    if (selected.length === 6) selected[selected.length - 1] = nextAction
    else selected.push(nextAction)
  }

  const diagnostics = selected.map((action): OpportunityActionDiagnostic => ({
    id: action.id,
    title: action.title,
    conciseTitle: limitWords(action.title, 8),
    impact: action.estimatedImpact,
    effort: action.estimatedEffort,
    status: action.status,
    isNext: action.id === nextAction?.id,
  }))

  return {
    actionCount: diagnostics.length,
    nextActionTitle: nextAction?.title ?? '',
    isImplementationComplete: actions.length > 0
      && actions.every((action) => action.status === 'Completed'),
    zones: zoneDefinitions.map((zone) => ({
      ...zone,
      actions: diagnostics.filter((action) => {
        const source = selected.find((candidate) => candidate.id === action.id)
        return source ? opportunityZoneFor(source) === zone.key : false
      }),
    })),
  }
}

function aggregateStatus(
  actionIds: string[],
  actionById: Map<string, RecommendedAction>,
): RecommendedActionStatus {
  const statuses = actionIds
    .map((id) => actionById.get(id)?.status)
    .filter((status): status is RecommendedActionStatus => Boolean(status))
  if (statuses.length === 0) return 'Not Started'
  if (statuses.every((status) => status === 'Completed')) return 'Completed'
  if (statuses.some((status) => status === 'Needs Review')) return 'Needs Review'
  if (statuses.some((status) => status === 'In Progress' || status === 'Completed')) {
    return 'In Progress'
  }
  if (statuses.some((status) => status === 'Scheduled')) return 'Scheduled'
  if (statuses.every((status) => status === 'Deferred')) return 'Deferred'
  return 'Not Started'
}

function createSprintDiagnostics(
  roadmap: ConsultingRoadmap,
  actions: RecommendedAction[],
): SprintPhaseDiagnostic[] {
  const actionById = new Map(actions.map((action) => [action.id, action]))

  return roadmap.sprint.map((phase) => ({
    phaseNumber: phase.day,
    window: phase.window,
    mainAction: phase.actionIds.map((id) => actionById.get(id)?.title).find(Boolean)
      ?? phase.headline,
    description: phase.description,
    deliverable: phase.deliverable,
    estimatedEffort: phase.estimatedEffort,
    expectedGain: phase.expectedBusinessEffect,
    status: aggregateStatus(phase.actionIds, actionById),
  }))
}

function createMonthDiagnostics(
  roadmap: ConsultingRoadmap,
  actions: RecommendedAction[],
): MonthWeekDiagnostic[] {
  const actionById = new Map(actions.map((action) => [action.id, action]))

  return roadmap.weeks.map((week) => ({
    week: week.week,
    theme: monthThemeByWeek[week.week],
    objective: week.goal,
    keyWork: week.recommendedWork,
    estimatedEffort: week.estimatedEffort,
    milestone: week.milestone,
    successSignal: week.successSignal,
    status: aggregateStatus(week.actionIds, actionById),
  }))
}

function createMomentumTimeline(
  progress: ProgressJourneyModel,
  roadmap: ConsultingRoadmap,
  actions: RecommendedAction[],
  scoresAvailable: boolean,
): MomentumStageDiagnostic[] {
  const actionById = new Map(actions.map((action) => [action.id, action]))
  const sprintIds = roadmap.sprint.flatMap((phase) => phase.actionIds)
  const monthIds = roadmap.weeks.flatMap((week) => week.actionIds)
  const nextGrowthStage = progress.isMaintainingTopLevel
    ? `${progress.nextGrowthStage} · maintenance focus`
    : progress.nextGrowthStage
  const planningRange = scoresAvailable
    ? `${progress.targetScoreLow}–${progress.targetScoreHigh}/100 planning range — not guaranteed`
    : 'Planning range unavailable until the five-part assessment is reviewed.'

  return [
    {
      order: 1,
      title: 'Today',
      state: 'current',
      stateLabel: 'Current assessed position',
      statusLabel: 'Current position',
      growthStage: progress.currentGrowthStage,
      scoreContext: scoresAvailable
        ? `${progress.currentScore}/100 recorded assessment`
        : 'Score unavailable — assessment review required.',
      whatChanges: 'This is the saved baseline; no projected movement is included.',
      verification: 'Confirm the assessment against current public-facing evidence before treating every observation as verified.',
    },
    {
      order: 2,
      title: 'After the 48-Hour Sprint',
      state: 'projected',
      stateLabel: 'Projected planning state',
      statusLabel: aggregateStatus(sprintIds, actionById),
      growthStage: `${progress.currentGrowthStage} → ${nextGrowthStage} planning direction`,
      scoreContext: planningRange,
      whatChanges: roadmap.sprint.map((phase) => phase.headline).join('; '),
      verification: 'Confirm both deliverables, action statuses, and the resulting desktop and mobile experience.',
    },
    {
      order: 3,
      title: 'After the First-Month Plan',
      state: 'projected',
      stateLabel: 'Projected planning state',
      statusLabel: aggregateStatus(monthIds, actionById),
      growthStage: `${nextGrowthStage} planning direction`,
      scoreContext: planningRange,
      whatChanges: 'Clarity, trust, authority, and AI readiness build in sequence across four focused weeks.',
      verification: 'Review every weekly success signal; Growth Stage movement remains unconfirmed until the business is re-scored.',
    },
    {
      order: 4,
      title: 'Verified Follow-Up Snapshot',
      state: 'future',
      stateLabel: 'Future verification',
      statusLabel: 'Verification required',
      growthStage: 'To be confirmed by a new Snapshot',
      scoreContext: 'No future score is shown until a new assessment is completed.',
      whatChanges: 'A new Snapshot compares the implemented experience with today’s recorded baseline.',
      verification: 'Re-score all five categories and review current evidence before confirming measurable progress.',
    },
  ]
}

function evidenceLinkedToAction(action: RecommendedAction, evidence: EvidenceItem[]) {
  return evidence.filter(
    (item) =>
      item.linkedActionIds.includes(action.id)
      || action.linkedEvidenceIds.includes(item.id),
  )
}

export function createEvidenceDiagnostic(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
): EvidenceDiagnostic {
  const reportReadyEvidence = evidenceItems.filter(isEvidenceReportReady)

  if (reportReadyEvidence.length === 0) {
    return {
      mode: 'preliminary',
      message: 'Preliminary review — evidence can be added during implementation planning.',
    }
  }

  const eligibleActions = actions.filter((action) => action.status !== 'Deferred')
  const evidenceByAction = new Map(
    eligibleActions.map((action) => [
      action.id,
      evidenceLinkedToAction(action, reportReadyEvidence),
    ]),
  )
  const coveredRecommendationCount = eligibleActions.filter(
    (action) => (evidenceByAction.get(action.id)?.length ?? 0) > 0,
  ).length
  const screenshotBackedRecommendationCount = eligibleActions.filter(
    (action) => evidenceByAction.get(action.id)?.some((item) => Boolean(item.screenshotDataUrl)),
  ).length

  return {
    mode: 'documented',
    documentedObservationCount: reportReadyEvidence.length,
    screenshotBackedRecommendationCount,
    coveredRecommendationCount,
    awaitingProofCount: Math.max(0, eligibleActions.length - coveredRecommendationCount),
    eligibleRecommendationCount: eligibleActions.length,
  }
}

export function createVisualDiagnostics(input: {
  scores: Scores
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
  progress: ProgressJourneyModel
  roadmap: ConsultingRoadmap
}): VisualDiagnostics {
  return {
    scores: createScoreDiagnostics(input.scores),
    opportunityMatrix: createOpportunityMatrix(input.actions),
    momentumTimeline: createMomentumTimeline(
      input.progress,
      input.roadmap,
      input.actions,
      areScoresDisplayable(input.scores),
    ),
    sprintPhases: createSprintDiagnostics(input.roadmap, input.actions),
    monthWeeks: createMonthDiagnostics(input.roadmap, input.actions),
    evidence: createEvidenceDiagnostic(input.evidenceItems, input.actions),
  }
}

function displayScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1)
}

export function formatScoreDiagnosticsText(scores: ScoreDiagnostic[]) {
  return `Five-Part Business Health Assessment

${scores.map((score) =>
    score.available && score.score !== null && score.percentage !== null && score.status
      ? `- ${score.label}: ${displayScore(score.score)}/20 (${score.percentage}%) — ${score.status}`
      : `- ${score.label}: Score unavailable`,
  ).join('\n')}`
}

export function formatOpportunityMatrixText(matrix: OpportunityMatrixDiagnostic) {
  const zones = matrix.zones.map((zone) => {
    const actions = zone.actions.length > 0
      ? zone.actions.map((action) =>
          `- ${action.isNext ? 'Next action: ' : ''}${action.title} — ${action.impact} impact / ${action.effort} effort — ${action.status}`,
        ).join('\n')
      : '- No action in the current six-action view.'
    return `${zone.label} (${zone.description})\n${actions}`
  }).join('\n\n')

  return `Opportunity / Effort Matrix
Business impact: Low to High | Estimated effort: Small to Large

${zones}`
}

export function formatMomentumTimelineText(stages: MomentumStageDiagnostic[]) {
  return `Growth Momentum Timeline

${stages.map((stage) => `${stage.order}. ${stage.title} — ${stage.stateLabel}
- Status: ${stage.statusLabel}
- Growth Stage: ${stage.growthStage}
- Score context: ${stage.scoreContext}
- What changes: ${stage.whatChanges}
- Must verify: ${stage.verification}`).join('\n\n')}`
}

export function formatEvidenceDiagnosticText(evidence: EvidenceDiagnostic) {
  if (evidence.mode === 'preliminary') return evidence.message

  return `Evidence Coverage
- Documented observations: ${evidence.documentedObservationCount}
- Operating actions with evidence: ${evidence.coveredRecommendationCount}/${evidence.eligibleRecommendationCount}
- Screenshot-backed actions: ${evidence.screenshotBackedRecommendationCount}
- Operating actions awaiting proof: ${evidence.awaitingProofCount}
Counts use report-ready evidence and explicit action links only.`
}
