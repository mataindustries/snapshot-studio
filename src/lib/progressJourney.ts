import type {
  GrowthArchetype,
  RecommendedActionEffort,
  SnapshotGrowthFoundation,
} from '../types'
import { growthArchetypeBands } from './growthPlanning'

export type JourneyLevelStatus = 'completed' | 'current' | 'next' | 'future'

export type JourneyLevel = {
  archetype: GrowthArchetype
  status: JourneyLevelStatus
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
  estimatedEffort: RecommendedActionEffort
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

const effortRank: Record<RecommendedActionEffort, number> = {
  Small: 1,
  Medium: 2,
  Large: 3,
}

export function createProgressJourneyModel(
  foundation: SnapshotGrowthFoundation,
): ProgressJourneyModel {
  const actions = foundation.recommendedActions
  const remainingActions = actions.filter(
    (action) => action.status !== 'Completed' && action.status !== 'Skipped',
  )
  const estimatedEffort = remainingActions.reduce<RecommendedActionEffort>(
    (highest, action) =>
      effortRank[action.estimatedEffort] > effortRank[highest]
        ? action.estimatedEffort
        : highest,
    'Small',
  )
  const currentIndex = growthArchetypeBands.findIndex(
    (band) => band.name === foundation.currentArchetype,
  )
  const nextArchetype = foundation.nextArchetype ?? foundation.currentArchetype

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
    completeCount: actions.filter((action) => action.status === 'Completed').length,
    remainingCount: remainingActions.length,
    estimatedEffort,
    planningEstimateDisclaimer: foundation.planningEstimateDisclaimer,
  }
}

export function formatProgressJourneyText(model: ProgressJourneyModel) {
  const nextLabel = model.isMaintainingTopLevel
    ? `${model.nextArchetype} (maintenance focus)`
    : model.nextArchetype

  return `Progress and Archetype Journey

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
- Completed: ${model.completeCount}
- Remaining: ${model.remainingCount}
- Largest action size: ${model.estimatedEffort}

${model.planningEstimateDisclaimer}`
}
