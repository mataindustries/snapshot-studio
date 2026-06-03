import type { RatingLabel, Scores } from '../types'

export const scoreLabels = {
  visibility: 'Visibility',
  trust: 'Trust',
  conversion: 'Conversion',
  aiSearchReadiness: 'AI Search Readiness',
  competitorPosition: 'Competitor Position',
} as const

export const emptyScores: Scores = {
  visibility: 10,
  trust: 10,
  conversion: 10,
  aiSearchReadiness: 10,
  competitorPosition: 10,
}

export function getTotalScore(scores: Scores) {
  return Object.values(scores).reduce((sum, score) => sum + score, 0)
}

export function getRatingLabel(totalScore: number): RatingLabel {
  if (totalScore >= 82) return 'Strong'
  if (totalScore >= 66) return 'Decent'
  if (totalScore >= 46) return 'Needs work'
  return 'Weak'
}
