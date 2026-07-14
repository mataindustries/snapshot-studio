import type {
  GrowthArchetype,
  RecommendedAction,
  RecommendedActionDifficulty,
  SnapshotGrowthFoundation,
} from '../types'
import { growthArchetypeBands } from './growthPlanning'

export type JourneyLevelStatus = 'completed' | 'current' | 'next' | 'future'

export type JourneyLevel = {
  archetype: GrowthArchetype
  status: JourneyLevelStatus
}

export type ProgressMilestone = {
  label: 'Immediate win' | 'Trust-building move' | 'Authority-building move'
  action: string
}

export type ProgressJourneyModel = {
  currentArchetype: GrowthArchetype
  currentScore: number
  currentPositionMeaning: string
  nextArchetype: GrowthArchetype
  isMaintainingTopLevel: boolean
  targetScoreLow: number
  targetScoreHigh: number
  nextLevelMeaning: string
  levels: JourneyLevel[]
  actionCount: number
  completeCount: number
  remainingCount: number
  highestPriorityAction: string
  estimatedEffort: RecommendedActionDifficulty
  milestones: ProgressMilestone[]
  futureImprovements: string[]
  planningEstimateDisclaimer: string
}

const currentPositionMeanings: Record<GrowthArchetype, string> = {
  'Emerging Presence': 'The foundation is taking shape, with practical opportunities to make the business easier to find, understand, and trust.',
  'Clear Provider': 'The offer is understandable, and the next gains come from adding stronger proof and a more confident path to action.',
  'Trusted Specialist': 'Expertise is becoming visible, with room to turn that credibility into a more consistent local preference.',
  'Community Favorite': 'Strong local trust is working in your favor, and a clearer authority signal can extend that momentum.',
  'Local Authority': 'The business presents as a leading local choice, with focused refinements available to strengthen that position.',
  'Market Leader': 'The business has a mature visibility foundation, so progress is about maintaining clarity, proof, and relevance over time.',
}

const nextLevelMeanings: Record<GrowthArchetype, string> = {
  'Emerging Presence': 'The core business story becomes more visible and easier for potential customers to understand.',
  'Clear Provider': 'Services, location, and the next step become clearer at a glance.',
  'Trusted Specialist': 'Specific proof and expertise make the business feel like a safer, more credible choice.',
  'Community Favorite': 'Local relevance and customer proof work together to create stronger community preference.',
  'Local Authority': 'Consistent expertise, proof, and useful answers establish a stronger leadership signal in the market.',
  'Market Leader': 'A complete, well-supported presence makes the business easier to recognize as a category leader.',
}

const priorityRank: Record<RecommendedAction['priority'], number> = {
  High: 3,
  Moderate: 2,
  Low: 1,
}

const difficultyRank: Record<RecommendedActionDifficulty, number> = {
  High: 3,
  Moderate: 2,
  Low: 1,
}

function fallbackActions(steps: string[]): RecommendedAction[] {
  return steps.map((step, index) => ({
    title: step,
    description: step,
    priority: index === 0 ? 'High' : 'Moderate',
    difficulty: index === 2 || index === 3 || index === 5 ? 'Moderate' : 'Low',
    expectedOutcome: 'A clearer, more useful customer experience.',
    status: 'Not started',
  }))
}

function actionCopy(action: RecommendedAction | undefined, fallback: string) {
  if (!action) return fallback
  return action.title.trim() || action.description.trim() || fallback
}

function findAction(
  actions: RecommendedAction[],
  pattern: RegExp,
  fallbackIndex: number,
  fallback: string,
) {
  const matchingAction = actions.find((action) =>
    pattern.test(`${action.title} ${action.description} ${action.expectedOutcome}`),
  )
  return actionCopy(matchingAction ?? actions[fallbackIndex], fallback)
}

export function createProgressJourneyModel(
  foundation: SnapshotGrowthFoundation,
  fallbackSteps: string[],
): ProgressJourneyModel {
  const actions = foundation.recommendedActions.length > 0
    ? foundation.recommendedActions
    : fallbackActions(fallbackSteps)
  const remainingActions = actions.filter((action) => action.status !== 'Complete')
  const sortedRemaining = remainingActions
    .map((action, index) => ({ action, index }))
    .sort((left, right) =>
      priorityRank[right.action.priority] - priorityRank[left.action.priority]
      || difficultyRank[left.action.difficulty] - difficultyRank[right.action.difficulty]
      || left.index - right.index,
    )
    .map(({ action }) => action)
  const highestPriority = sortedRemaining[0]
  const estimatedEffort = remainingActions.reduce<RecommendedActionDifficulty>(
    (highest, action) =>
      difficultyRank[action.difficulty] > difficultyRank[highest] ? action.difficulty : highest,
    'Low',
  )
  const currentIndex = growthArchetypeBands.findIndex(
    (band) => band.name === foundation.currentArchetype,
  )
  const nextArchetype = foundation.nextArchetype ?? foundation.currentArchetype
  const immediateWin = actionCopy(
    sortedRemaining.find((action) => action.difficulty === 'Low') ?? sortedRemaining[0] ?? actions[0],
    'Keep the strongest customer-facing information current and easy to find.',
  )
  const trustMove = findAction(
    remainingActions.length > 0 ? remainingActions : actions,
    /trust|review|proof|credential|testimonial|case stud|before.?after|guarantee/i,
    1,
    'Place the strongest proof close to the point where customers decide to contact you.',
  )
  const authorityMove = findAction(
    remainingActions.length > 0 ? remainingActions : actions,
    /authorit|expert|search|answer|faq|service page|local|schema|guide/i,
    2,
    'Publish a focused, useful answer that demonstrates expertise in the primary service.',
  )

  const milestones: ProgressMilestone[] = [
    { label: 'Immediate win', action: immediateWin },
    { label: 'Trust-building move', action: trustMove },
    { label: 'Authority-building move', action: authorityMove },
  ]

  return {
    currentArchetype: foundation.currentArchetype,
    currentScore: foundation.currentScore,
    currentPositionMeaning: currentPositionMeanings[foundation.currentArchetype],
    nextArchetype,
    isMaintainingTopLevel: foundation.nextArchetype === null,
    targetScoreLow: foundation.targetScoreLow,
    targetScoreHigh: foundation.targetScoreHigh,
    nextLevelMeaning: foundation.nextArchetype
      ? nextLevelMeanings[foundation.nextArchetype]
      : 'The focus shifts to maintaining a clear, trusted, and useful presence as the market evolves.',
    levels: growthArchetypeBands.map((band, index) => ({
      archetype: band.name,
      status: index < currentIndex
        ? 'completed'
        : index === currentIndex
          ? 'current'
          : index === currentIndex + 1
            ? 'next'
            : 'future',
    })),
    actionCount: actions.length,
    completeCount: actions.filter((action) => action.status === 'Complete').length,
    remainingCount: remainingActions.length,
    highestPriorityAction: highestPriority
      ? actionCopy(highestPriority, 'Review the next recommended action.')
      : 'All recommended actions are complete; keep monitoring the strongest gains.',
    estimatedEffort,
    milestones,
    futureImprovements: milestones.map((milestone) => milestone.action),
    planningEstimateDisclaimer: foundation.planningEstimateDisclaimer,
  }
}

export function formatProgressJourneyText(model: ProgressJourneyModel) {
  const nextLabel = model.isMaintainingTopLevel
    ? `${model.nextArchetype} (maintenance focus)`
    : model.nextArchetype

  return `Progress Motivation and Archetype Journey

Current Position
- Current archetype: ${model.currentArchetype}
- Current score: ${model.currentScore}/100
- ${model.currentPositionMeaning}

Next Achievable Level
- Next archetype: ${nextLabel}
- Target planning range: ${model.targetScoreLow}-${model.targetScoreHigh}/100 (planning estimate)
- ${model.nextLevelMeaning}

Progress Journey
${model.levels.map((level) => `- ${level.archetype}: ${level.status}`).join('\n')}

Progress Summary
- Recommended actions: ${model.actionCount}
- Complete: ${model.completeCount}
- Remaining: ${model.remainingCount}
- Highest-priority action: ${model.highestPriorityAction}
- Estimated effort: ${model.estimatedEffort}

Three Milestones
${model.milestones.map((milestone) => `- ${milestone.label}: ${milestone.action}`).join('\n')}

Your next snapshot could look like this
- Current score: ${model.currentScore}/100
- Target planning range: ${model.targetScoreLow}-${model.targetScoreHigh}/100 (planning estimate)
- Current archetype: ${model.currentArchetype}
- Next archetype: ${nextLabel}
- Improvements:
${model.futureImprovements.map((improvement) => `  - ${improvement}`).join('\n')}

${model.planningEstimateDisclaimer}`
}
