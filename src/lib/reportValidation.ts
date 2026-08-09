import type {
  EvidenceItem,
  RecommendedAction,
  ReportMode,
  ScoreKey,
  SnapshotKind,
  SnapshotForm,
} from '../types'
import type {
  BusinessAchievement,
  UpgradeMission,
} from '../types/upgradeOS'
import type {
  ExecutiveSummary,
  StrategicAsset,
} from './reportStory'
import {
  hasClientFacingValue,
} from './reportDisplay.ts'
import { harborPineDemoReport } from './harborPineDemoReport.ts'
import {
  isKnownDefaultScoreFailure,
  requiredScoreKeys,
} from './scoring.ts'
import {
  getEligibleUpgradeMissionCount,
} from './upgradeOS.ts'
import {
  isValidContactEmail,
  isValidHttpUrl,
  type ReportConfiguration,
} from './reportConfig.ts'

export type ReportValidationSection =
  | 'Personalization'
  | 'Scores'
  | 'Missions'
  | 'Configuration'
  | 'Output'

export type ReportValidationIssue = {
  code: string
  section: ReportValidationSection
  message: string
}

export type ReportValidationResult = {
  valid: boolean
  issues: ReportValidationIssue[]
}

export type ReportValidationInput = {
  reportMode: ReportMode
  snapshotId: string | null
  snapshotKind?: SnapshotKind
  baselineSnapshotId?: string
  reviewedScoreKeys?: ScoreKey[]
  archetype: string
  form: SnapshotForm
  scores: Partial<Record<ScoreKey, unknown>>
  actions: RecommendedAction[]
  missions: UpgradeMission[]
  achievements: BusinessAchievement[]
  strategicAssets: StrategicAsset[]
  executiveSummary: ExecutiveSummary
  evidenceItems: EvidenceItem[]
  configuration: ReportConfiguration
  resolvedOutput: unknown
}

export const forbiddenClientOutputPatterns = [
  { label: 'Local Business', pattern: /\blocal business\b/i },
  { label: 'Local Area', pattern: /\blocal area\b/i },
  { label: '[Category]', pattern: /\[category\]/i },
  { label: '[Business Name]', pattern: /\[business name\]/i },
  { label: '[City]', pattern: /\[city\]/i },
  { label: 'fictional', pattern: /\bfictional\b/i },
  { label: 'example domain', pattern: /\bexample\.(?:com|org|net)\b|\b(?:[a-z0-9-]+\.)+example\b/i },
  { label: 'upgradeos.example', pattern: /\bupgradeos\.example\b/i },
  { label: 'harborpine.example', pattern: /\bharborpine\.example\b/i },
  { label: 'demo-call', pattern: /\bdemo-call\b/i },
  { label: 'placeholder record', pattern: /\bplaceholder(?: record)?\b/i },
  { label: 'supplied process wording', pattern: /\bsupplied\b/i },
  { label: 'audit', pattern: /\baudit\b/i },
  { label: 'localhost', pattern: /\blocalhost\b/i },
  { label: 'loopback address', pattern: /\b(?:127(?:\.\d{1,3}){3}|0\.0\.0\.0)\b|(?:\[?::1\]?)/i },
  { label: 'GitHub link', pattern: /\b(?:[a-z0-9-]+\.)*github\.com\b/i },
  { label: 'repository path', pattern: /\bmataindustries\/snapshot-studio\b/i },
] as const

function normalizeForComparison(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizedWords(value: string) {
  return new Set(normalizeForComparison(value).split(' ').filter(Boolean))
}

function areNearDuplicates(left: string, right: string) {
  const leftWords = normalizedWords(left)
  const rightWords = normalizedWords(right)
  if (Math.min(leftWords.size, rightWords.size) < 4) {
    return normalizeForComparison(left) === normalizeForComparison(right)
  }
  const intersection = [...leftWords].filter((word) => rightWords.has(word)).length
  const union = new Set([...leftWords, ...rightWords]).size
  return union > 0 && intersection / union >= 0.86
}

function duplicatePairs(values: string[], near = false) {
  const pairs: Array<[number, number]> = []
  values.forEach((value, index) => {
    values.slice(index + 1).forEach((candidate, offset) => {
      const duplicate = near
        ? areNearDuplicates(value, candidate)
        : normalizeForComparison(value) === normalizeForComparison(candidate)
      if (duplicate) pairs.push([index, index + offset + 1])
    })
  })
  return pairs
}

function collectStrings(value: unknown, path = 'report'): Array<{
  path: string
  value: string
}> {
  if (typeof value === 'string') return [{ path, value }]
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`))
  }
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, item]) =>
    collectStrings(item, `${path}.${key}`),
  )
}

function addIssue(
  issues: ReportValidationIssue[],
  issue: ReportValidationIssue,
) {
  if (!issues.some((candidate) => candidate.code === issue.code)) {
    issues.push(issue)
  }
}

export function validateReportForRender(
  input: ReportValidationInput,
): ReportValidationResult {
  const issues: ReportValidationIssue[] = []

  if (input.reportMode === 'demo') {
    if (input.snapshotId !== harborPineDemoReport.ids.snapshot) {
      addIssue(issues, {
        code: 'demo-canonical-snapshot',
        section: 'Personalization',
        message: 'Demo Mode is available only for the canonical Harbor & Pine sample Snapshot.',
      })
    }

    const canonicalFields = [
      ['business-name', 'business name', input.form.businessName, harborPineDemoReport.business.name],
      ['city', 'city', input.form.city, harborPineDemoReport.business.city],
      ['category', 'category', input.form.niche, harborPineDemoReport.business.category],
      ['primary-service', 'primary service', input.form.mainService, harborPineDemoReport.business.primaryService],
    ] as const
    canonicalFields.forEach(([key, label, value, expected]) => {
      if (value.trim() !== expected) {
        addIssue(issues, {
          code: `demo-canonical-${key}`,
          section: 'Personalization',
          message: `Demo Mode requires the canonical Harbor & Pine ${label}.`,
        })
      }
    })

    if (input.form.websiteUrl.trim()) {
      addIssue(issues, {
        code: 'demo-business-url-present',
        section: 'Personalization',
        message: 'The canonical sample does not include a public business URL.',
      })
    }
    if (input.archetype !== harborPineDemoReport.archetype) {
      addIssue(issues, {
        code: 'demo-canonical-archetype',
        section: 'Scores',
        message: `The canonical sample must resolve to ${harborPineDemoReport.archetype}.`,
      })
    }
    requiredScoreKeys.forEach((key) => {
      if (input.scores[key] !== harborPineDemoReport.scores[key]) {
        addIssue(issues, {
          code: `demo-canonical-score-${key}`,
          section: 'Scores',
          message: `Demo Mode requires the canonical ${key} score.`,
        })
      }
    })
    if (input.evidenceItems.some((item) => item.sourceUrl.trim())) {
      addIssue(issues, {
        code: 'demo-source-url-present',
        section: 'Output',
        message: 'The canonical sample evidence uses source labels without public source URLs.',
      })
    }
    if (!collectStrings(input.resolvedOutput).some((entry) =>
      entry.value.includes(harborPineDemoReport.sampleLabel),
    )) {
      addIssue(issues, {
        code: 'demo-sample-label-missing',
        section: 'Output',
        message: `Demo Mode must display “${harborPineDemoReport.sampleLabel}.”`,
      })
    }
  }

  if (!hasClientFacingValue(input.form.businessName)) {
    addIssue(issues, {
      code: 'personalization-business-name',
      section: 'Personalization',
      message: 'Add a client-ready business name.',
    })
  }
  if (!hasClientFacingValue(input.form.city)) {
    addIssue(issues, {
      code: 'personalization-city',
      section: 'Personalization',
      message: 'Add the city or service area.',
    })
  }
  if (!hasClientFacingValue(input.form.niche)) {
    addIssue(issues, {
      code: 'personalization-category',
      section: 'Personalization',
      message: 'Add the business category.',
    })
  }

  requiredScoreKeys.forEach((key) => {
    const score = input.scores[key]
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      addIssue(issues, {
        code: `score-${key}-missing`,
        section: 'Scores',
        message: `${key} must contain a numeric score.`,
      })
    } else if (score < 0 || score > 20) {
      addIssue(issues, {
        code: `score-${key}-range`,
        section: 'Scores',
        message: `${key} must be between 0 and 20.`,
      })
    }
  })

  if (isKnownDefaultScoreFailure(input.scores)) {
    addIssue(issues, {
      code: 'scores-known-default-state',
      section: 'Scores',
      message: 'All five dimensions are still at the known default 10/20 state. Review the assessment before export.',
    })
  }

  if (input.snapshotKind === 'Follow-up') {
    if (!input.baselineSnapshotId || input.baselineSnapshotId === input.snapshotId) {
      addIssue(issues, {
        code: 'follow-up-baseline-link',
        section: 'Personalization',
        message: 'The Follow-Up Snapshot must retain a distinct baseline Snapshot link.',
      })
    }
    const reviewedScoreKeys = new Set(input.reviewedScoreKeys ?? [])
    if (requiredScoreKeys.some((key) => !reviewedScoreKeys.has(key))) {
      addIssue(issues, {
        code: 'follow-up-scores-unreviewed',
        section: 'Scores',
        message: 'Review all five current scores before exporting a Follow-Up Snapshot.',
      })
    }
  }

  const eligibleMissionCount = getEligibleUpgradeMissionCount(input.actions)
  if (eligibleMissionCount >= 3 && input.missions.length !== 3) {
    addIssue(issues, {
      code: 'missions-exactly-three',
      section: 'Missions',
      message: 'Exactly three Upgrade Missions are required when three or more valid actions exist.',
    })
  }

  const missionIds = input.missions.map((mission) => mission.id)
  if (duplicatePairs(missionIds).length > 0) {
    addIssue(issues, {
      code: 'missions-duplicate-ids',
      section: 'Missions',
      message: 'Upgrade Mission IDs must be unique.',
    })
  }

  const missionTitles = input.missions.map((mission) => mission.title)
  if (duplicatePairs(missionTitles).length > 0) {
    addIssue(issues, {
      code: 'missions-duplicate-titles',
      section: 'Missions',
      message: 'Upgrade Mission titles must be unique after normalization.',
    })
  }

  const missionPlans = input.missions.map((mission) => mission.actionPlan.join(' '))
  if (duplicatePairs(missionPlans).length > 0) {
    addIssue(issues, {
      code: 'missions-duplicate-action-plans',
      section: 'Missions',
      message: 'Each Upgrade Mission needs a distinct action plan.',
    })
  }

  const missionMilestoneFields: Array<{
    key: string
    label: string
    values: string[]
  }> = [
    {
      key: 'outcomes',
      label: 'primary outcomes',
      values: input.missions.map((mission) => mission.primaryBusinessOutcome),
    },
    {
      key: 'success-signals',
      label: 'success signals',
      values: input.missions.map((mission) => mission.successCriteria[0] ?? ''),
    },
  ]

  missionMilestoneFields.forEach(({ key, label, values }) => {
    if (duplicatePairs(values.filter(Boolean), true).length > 0) {
      addIssue(issues, {
        code: `missions-duplicate-${key}`,
        section: 'Missions',
        message: `Upgrade Mission ${label} must be meaningfully distinct.`,
      })
    }
  })

  const achievementFields: Array<{
    key: string
    label: string
    values: string[]
  }> = [
    {
      key: 'titles',
      label: 'titles',
      values: input.achievements.map((achievement) => achievement.title),
    },
    {
      key: 'descriptions',
      label: 'descriptions',
      values: input.achievements.map((achievement) => achievement.description),
    },
    {
      key: 'verification',
      label: 'verification requirements',
      values: input.achievements.flatMap((achievement) =>
        achievement.verificationRequirements,
      ),
    },
  ]

  achievementFields.forEach(({ key, label, values }) => {
    if (duplicatePairs(values, true).length > 0) {
      addIssue(issues, {
        code: `achievements-duplicate-${key}`,
        section: 'Missions',
        message: `Achievement ${label} must be meaningfully distinct.`,
      })
    }
  })

  const assetImpacts = input.strategicAssets.map((asset) => asset.whyItMatters)
  if (duplicatePairs(assetImpacts).length > 0) {
    addIssue(issues, {
      code: 'assets-duplicate-impact',
      section: 'Output',
      message: 'Competitive Asset customer-impact copy must be unique.',
    })
  }

  const assetNextUses = input.strategicAssets.map((asset) => asset.leverage)
  if (duplicatePairs(assetNextUses).length > 0) {
    addIssue(issues, {
      code: 'assets-duplicate-next-use',
      section: 'Output',
      message: 'Competitive Asset best-next-use copy must be unique.',
    })
  }

  const summaryFields = [
    input.executiveSummary.currentPosition,
    input.executiveSummary.largestOpportunity,
    input.executiveSummary.fastestWin,
    input.executiveSummary.longTermGoal,
  ]
  if (summaryFields.some((value) => /(?:\.{3}|…)\s*$/.test(value))) {
    addIssue(issues, {
      code: 'summary-trailing-ellipsis',
      section: 'Output',
      message: 'Executive Summary sentences must end naturally without an ellipsis.',
    })
  }

  if (
    input.configuration.CONTACT_EMAIL.trim()
    && !isValidContactEmail(input.configuration.CONTACT_EMAIL)
  ) {
    addIssue(issues, {
      code: 'configuration-contact-email-invalid',
      section: 'Configuration',
      message: 'CONTACT_EMAIL must be a public client-facing email address.',
    })
  }

  const configuredUrls = [
    ['CONSULTATION_URL', input.configuration.CONSULTATION_URL],
    ['BRAND_URL', input.configuration.BRAND_URL],
  ] as const
  configuredUrls.forEach(([label, value]) => {
    if (value.trim() && !isValidHttpUrl(value)) {
      addIssue(issues, {
        code: `configuration-${label.toLocaleLowerCase()}-invalid`,
        section: 'Configuration',
        message: `${label} must be a public http or https URL and cannot point to a development or source-code host.`,
      })
    }
  })

  collectStrings(input.resolvedOutput).forEach((entry, index) => {
    forbiddenClientOutputPatterns.forEach(({ label, pattern }) => {
      if (pattern.test(entry.value)) {
        addIssue(issues, {
          code: `output-forbidden-${index}-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          section: 'Output',
          message: `Remove “${label}” from ${entry.path}.`,
        })
      }
    })
  })

  return {
    valid: issues.length === 0,
    issues,
  }
}
