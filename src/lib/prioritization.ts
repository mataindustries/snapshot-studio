import type {
  ActionCategory,
  RecommendedActionEffort,
  RecommendedActionImpact,
  RecommendedActionPriority,
  ScoreKey,
  Scores,
} from '../types'

const impactWeight: Record<RecommendedActionImpact, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

const effortWeight: Record<RecommendedActionEffort, number> = {
  Small: 3,
  Medium: 2,
  Large: 1,
}

const categoryScoreKeys: Record<ActionCategory, readonly ScoreKey[]> = {
  Homepage: ['visibility', 'conversion'],
  Trust: ['trust'],
  Authority: ['competitorPosition', 'aiSearchReadiness'],
  'Local SEO': ['visibility', 'competitorPosition'],
  'Service Pages': ['visibility', 'aiSearchReadiness'],
  Reviews: ['trust'],
  Conversion: ['conversion'],
  'Google Business Profile': ['visibility', 'trust'],
  Content: ['aiSearchReadiness', 'competitorPosition'],
  FAQ: ['aiSearchReadiness'],
  'Mobile UX': ['conversion'],
  'Calls To Action': ['conversion'],
  'Internal Links': ['visibility', 'aiSearchReadiness'],
  Technical: ['visibility', 'aiSearchReadiness'],
  'Brand Positioning': ['competitorPosition'],
  'AI Readiness': ['aiSearchReadiness'],
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function getCategoryScore(category: ActionCategory, scores: Scores) {
  const keys = categoryScoreKeys[category]
  return keys.reduce((total, key) => total + scores[key], 0) / keys.length
}

export function calculateOpportunityScore(
  categoryScore: number,
  impact: RecommendedActionImpact,
) {
  const scoreGap = Math.max(0, 20 - categoryScore) / 20
  return clamp(scoreGap * 70 + (impactWeight[impact] / 3) * 30)
}

export function calculatePriorityScore(
  opportunityScore: number,
  impact: RecommendedActionImpact,
  effort: RecommendedActionEffort,
) {
  return clamp(
    opportunityScore * 0.55
    + (impactWeight[impact] / 3) * 30
    + (effortWeight[effort] / 3) * 15,
  )
}

export function getPriorityLabel(priorityScore: number): RecommendedActionPriority {
  if (priorityScore >= 70) return 'High'
  if (priorityScore >= 45) return 'Medium'
  return 'Low'
}

export function scoreAction(input: {
  category: ActionCategory
  scores: Scores
  impact: RecommendedActionImpact
  effort: RecommendedActionEffort
}) {
  const categoryScore = getCategoryScore(input.category, input.scores)
  const opportunityScore = calculateOpportunityScore(categoryScore, input.impact)
  const priorityScore = calculatePriorityScore(
    opportunityScore,
    input.impact,
    input.effort,
  )

  return {
    priority: getPriorityLabel(priorityScore),
    priorityScore,
    opportunityScore,
  }
}
