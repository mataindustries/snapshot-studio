import type { RatingLabel, Scores } from '../types'

export const scoreLabels = {
  clearServices: 'Clear services',
  clearServiceArea: 'Clear service area',
  trustProof: 'Trust proof',
  helpfulContent: 'Helpful FAQ/content',
  readableStructure: 'Google/AI-readable structure',
} as const

export const emptyScores: Scores = {
  clearServices: 0,
  clearServiceArea: 0,
  trustProof: 0,
  helpfulContent: 0,
  readableStructure: 0,
}

export function getTotalScore(scores: Scores) {
  return Object.values(scores).reduce((sum, score) => sum + score, 0)
}

export function getRatingLabel(totalScore: number): RatingLabel {
  if (totalScore >= 21) return 'Strong'
  if (totalScore >= 16) return 'Decent'
  if (totalScore >= 11) return 'Needs work'
  return 'Weak'
}
