import type {
  GrowthArchetype,
  SnapshotGrowthFoundation,
} from '../types'
import { growthArchetypeBands } from './growthPlanning'

export type ProgressJourneyModel = {
  currentArchetype: GrowthArchetype
  currentScore: number
  currentPositionMeaning: string
  nextArchetype: GrowthArchetype
  isMaintainingTopLevel: boolean
  targetScoreLow: number
  targetScoreHigh: number
  nextLevelMeaning: string
  longTermGoal: string
  longTermGoalMeaning: string
  completeCount: number
  remainingCount: number
  nextRecommendedAction: string
  planningEstimateDisclaimer: string
  verificationNote: string
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

export function createProgressJourneyModel(
  foundation: SnapshotGrowthFoundation,
): ProgressJourneyModel {
  const actions = [...foundation.recommendedActions].sort(
    (left, right) =>
      left.recommendedOrder - right.recommendedOrder
      || right.priorityScore - left.priorityScore,
  )
  const remainingActions = actions.filter(
    (action) => action.status !== 'Completed' && action.status !== 'Skipped',
  )
  const currentIndex = growthArchetypeBands.findIndex(
    (band) => band.name === foundation.currentArchetype,
  )
  const nextArchetype = foundation.nextArchetype ?? foundation.currentArchetype
  const longTermGoal = currentIndex < 3
    ? 'Local Authority'
    : currentIndex === 3
      ? 'Market Leader'
      : 'Sustained Market Leadership'

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
    longTermGoal,
    longTermGoalMeaning: longTermGoal === 'Local Authority'
      ? 'Build a consistent local presence where clarity, proof, expertise, and useful answers reinforce one another.'
      : longTermGoal === 'Market Leader'
        ? 'Extend local authority into a complete, well-supported category-leading presence.'
        : 'Maintain clarity, current proof, useful information, and regular review as the market evolves.',
    completeCount: actions.filter((action) => action.status === 'Completed').length,
    remainingCount: remainingActions.length,
    nextRecommendedAction: remainingActions[0]?.title
      ?? 'Run an updated Snapshot to verify progress and identify the next refinement.',
    planningEstimateDisclaimer: foundation.planningEstimateDisclaimer,
    verificationNote: 'Verified progress requires another Snapshot after implementation.',
  }
}

export function formatProgressJourneyText(model: ProgressJourneyModel) {
  const nextLabel = model.isMaintainingTopLevel
    ? `${model.nextArchetype} (maintenance focus)`
    : model.nextArchetype

  return `Current → Next Level Journey

Current archetype
- Current archetype: ${model.currentArchetype}
- Current score: ${model.currentScore}/100
- ${model.currentPositionMeaning}

Next archetype
- Next archetype: ${nextLabel}
- Projected planning range: ${model.targetScoreLow}-${model.targetScoreHigh}/100
- ${model.nextLevelMeaning}

Long-term goal
- ${model.longTermGoal}
- ${model.longTermGoalMeaning}

Progress Summary
- Completed: ${model.completeCount}
- Remaining: ${model.remainingCount}
- Next recommended action: ${model.nextRecommendedAction}

${model.planningEstimateDisclaimer}
${model.verificationNote}`
}
