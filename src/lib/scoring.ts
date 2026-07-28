import type { RatingLabel, ScoreKey, Scores } from '../types'

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

export const requiredScoreKeys: readonly ScoreKey[] = [
  'visibility',
  'trust',
  'conversion',
  'aiSearchReadiness',
  'competitorPosition',
]

export type NormalizedScoreDisplay = {
  available: boolean
  score: number | null
  percentage: number | null
}

export function normalizeScoreForDisplay(
  value: unknown,
  maximum = 20,
): NormalizedScoreDisplay {
  if (
    typeof value !== 'number'
    || !Number.isFinite(value)
    || value < 0
    || value > maximum
  ) {
    return {
      available: false,
      score: null,
      percentage: null,
    }
  }

  const score = Math.round(value * 10) / 10
  return {
    available: true,
    score,
    percentage: Math.round((score / maximum) * 100),
  }
}

export function isKnownDefaultScoreFailure(
  scores: Partial<Record<ScoreKey, unknown>>,
) {
  return requiredScoreKeys.every((key) => scores[key] === emptyScores[key])
}

export function areScoresDisplayable(
  scores: Partial<Record<ScoreKey, unknown>>,
) {
  return !isKnownDefaultScoreFailure(scores)
    && requiredScoreKeys.every((key) =>
      normalizeScoreForDisplay(scores[key]).available,
    )
}

export function normalizeScores(scores: Partial<Scores> | undefined): Scores {
  return requiredScoreKeys.reduce(
    (normalized, key) => {
      const value = scores?.[key]
      normalized[key] = typeof value === 'number' && Number.isFinite(value)
        ? Math.min(20, Math.max(0, value))
        : emptyScores[key]
      return normalized
    },
    { ...emptyScores },
  )
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
