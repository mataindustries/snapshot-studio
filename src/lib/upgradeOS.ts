import type {
  ActionCategory,
  ActionStatusChange,
  EvidenceItem,
  GrowthStage,
  RecommendedAction,
  RecommendedActionEffort,
  RecommendedActionImpact,
  RecommendedActionStatus,
} from '../types'
import type {
  AchievementStatus,
  BusinessAchievement,
  ImpactLedgerEntry,
  ImpactLedgerStatus,
  SnapshotRecordCheckpoint,
  UpgradeJourney,
  UpgradeMission,
  UpgradeMissionEffort,
  UpgradeOSReportModel,
} from '../types/upgradeOS'
import { isEvidenceReportReady } from './evidence.ts'
import {
  firstCompleteSentence,
  formatSentencePhrase,
  type AudienceNoun,
} from './reportDisplay.ts'
import { reportTerminology } from './reportTerminology.ts'

export const upgradeOSEmptyStateText = {
  missions: `No supported ${reportTerminology.upgradeMissions} are ready yet. Confirm the current assessment before adding an operating priority.`,
  evidence: 'Baseline evidence is not yet linked. Record the current condition before implementation.',
  achievements: 'Operating milestones will appear when a supported Upgrade Mission is selected.',
} as const

type UpgradeOSReportInput = {
  businessName: string
  city: string
  primaryService: string
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
  actionStatusHistory: ActionStatusChange[]
  currentArchetype: string
  currentHealthScore: number | null
  audience?: AudienceNoun
  currentGrowthStage: GrowthStage
  nextGrowthStage: GrowthStage | null
  targetScoreLow: number
  targetScoreHigh: number
  nextEvolution: string
  snapshotDate: string
  snapshotNumber?: number
}

type MissionCandidate = {
  action: RecommendedAction
  evidence: EvidenceItem[]
  unresolvedDependencyIds: string[]
  rank: number
}

type SnapshotSequenceRecord = {
  id: string
  createdAt: string
  businessName: string
  websiteUrl: string
}

const impactWeight: Record<RecommendedActionImpact, number> = {
  High: 25,
  Medium: 16,
  Low: 8,
}

const effortWeight: Record<RecommendedActionEffort, number> = {
  Small: 15,
  Medium: 10,
  Large: 5,
}

const achievementFamilyByCategory: Record<
  ActionCategory,
  {
    id: string
    title: string
    description: string
  }
> = {
  Homepage: {
    id: 'first-screen-promise',
    title: 'First-Screen Promise Established',
    description: 'The primary service, local fit, proof, and next step work together at first glance.',
  },
  'Brand Positioning': {
    id: 'first-screen-promise',
    title: 'First-Screen Promise Established',
    description: 'The primary service, local fit, proof, and next step work together at first glance.',
  },
  Trust: {
    id: 'decision-point-proof',
    title: 'Decision-Point Proof Established',
    description: 'Specific, current proof supports the customer at the moment of choice.',
  },
  Reviews: {
    id: 'decision-point-proof',
    title: 'Decision-Point Proof Established',
    description: 'Specific, current proof supports the customer at the moment of choice.',
  },
  Conversion: {
    id: 'contact-path-standard',
    title: 'Contact Path Standard Established',
    description: 'The first contact step explains what happens next and works on desktop and mobile.',
  },
  'Calls To Action': {
    id: 'contact-path-standard',
    title: 'Contact Path Standard Established',
    description: 'The first contact step explains what happens next and works on desktop and mobile.',
  },
  'Mobile UX': {
    id: 'contact-path-standard',
    title: 'Contact Path Standard Established',
    description: 'The first contact step explains what happens next and works on desktop and mobile.',
  },
  'Service Pages': {
    id: 'service-authority-resource',
    title: 'Service Authority Resource Published',
    description: 'One complete service resource explains fit, process, proof, and the next step.',
  },
  Authority: {
    id: 'service-authority-resource',
    title: 'Service Authority Resource Published',
    description: 'One complete service resource explains fit, process, proof, and the next step.',
  },
  Content: {
    id: 'service-authority-resource',
    title: 'Service Authority Resource Published',
    description: 'One complete service resource explains fit, process, proof, and the next step.',
  },
  'Internal Links': {
    id: 'service-authority-resource',
    title: 'Service Authority Resource Published',
    description: 'One complete service resource explains fit, process, proof, and the next step.',
  },
  'Local SEO': {
    id: 'local-presence-aligned',
    title: 'Local Presence Aligned',
    description: 'The website and public profile present the same service, market, and contact facts.',
  },
  'Google Business Profile': {
    id: 'local-presence-aligned',
    title: 'Local Presence Aligned',
    description: 'The website and public profile present the same service, market, and contact facts.',
  },
  FAQ: {
    id: 'core-business-facts',
    title: 'Core Business Facts Structured',
    description: 'Direct answers make the service, location, process, and proof easier to interpret.',
  },
  'AI Readiness': {
    id: 'core-business-facts',
    title: 'Core Business Facts Structured',
    description: 'Direct answers make the service, location, process, and proof easier to interpret.',
  },
  Technical: {
    id: 'core-business-facts',
    title: 'Core Business Facts Structured',
    description: 'Direct answers make the service, location, process, and proof easier to interpret.',
  },
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

function normalizeWebsiteIdentity(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    const host = url.hostname.toLocaleLowerCase().replace(/^www\./, '')
    const path = url.pathname.replace(/\/+$/, '')
    return `${host}${path}`
  } catch {
    return normalizeKey(trimmed).replace(/\/+$/, '')
  }
}

export function getSnapshotSequenceNumber(
  snapshots: SnapshotSequenceRecord[],
  currentSnapshotId: string | null,
) {
  if (!currentSnapshotId) return 1
  const current = snapshots.find((snapshot) => snapshot.id === currentSnapshotId)
  if (!current) return 1

  const websiteIdentity = normalizeWebsiteIdentity(current.websiteUrl)
  const businessIdentity = normalizeKey(current.businessName)
  const related = snapshots
    .filter((snapshot) => websiteIdentity
      ? normalizeWebsiteIdentity(snapshot.websiteUrl) === websiteIdentity
      : Boolean(businessIdentity)
        && normalizeKey(snapshot.businessName) === businessIdentity,
    )
    .sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
      || left.id.localeCompare(right.id),
    )
  const position = related.findIndex((snapshot) => snapshot.id === currentSnapshotId)

  return position >= 0 ? position + 1 : 1
}

function ensureSentence(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return ''
  return /[.!?]$/.test(normalized) ? normalized : normalized + '.'
}

function withoutFinalPunctuation(value: string) {
  return value.trim().replace(/[.!?]+$/, '')
}

function lowerFirst(value: string) {
  const normalized = value.trim()
  return normalized
    ? normalized.charAt(0).toLocaleLowerCase() + normalized.slice(1)
    : normalized
}

function limitWords(value: string, maximum: number) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  const words = normalized.split(' ').filter(Boolean)
  if (words.length <= maximum) return words.join(' ')
  return firstCompleteSentence(normalized) || normalized
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to confirm'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'To be scheduled'
  date.setUTCDate(date.getUTCDate() + days)
  return formatDate(date.toISOString())
}

function evidenceForAction(action: RecommendedAction, evidenceItems: EvidenceItem[]) {
  return evidenceItems.filter(
    (item) =>
      isEvidenceReportReady(item)
      && (action.linkedEvidenceIds.includes(item.id)
        || item.linkedActionIds.includes(action.id)),
  )
}

function unresolvedDependencies(
  action: RecommendedAction,
  actionById: Map<string, RecommendedAction>,
) {
  return action.blockedBy.filter(
    (id) => actionById.get(id)?.status !== 'Completed',
  )
}

/**
 * Mission ranking does not alter assessment scores or canonical action priority.
 * It combines the action's existing opportunity signal with implementation
 * practicality, linked evidence, dependency readiness, and whether a visible
 * result can be checked within the 30–90 day operating window.
 */
function rankMissionCandidate(
  action: RecommendedAction,
  evidence: EvidenceItem[],
  unresolvedDependencyIds: string[],
) {
  const severity = clamp(action.opportunityScore, 0, 100) * 0.3
  const impact = impactWeight[action.estimatedImpact]
  const effort = effortWeight[action.estimatedEffort]
  const evidenceConfidence = evidence.length > 0
    ? evidence.some((item) => Boolean(item.screenshotDataUrl)) ? 15 : 12
    : 0
  const dependencyReadiness = unresolvedDependencyIds.length === 0
    ? 10
    : Math.max(0, 10 - unresolvedDependencyIds.length * 5)
  const visibleResult = action.estimatedHours <= 10
    && Boolean(action.expectedOutcome.trim() || action.businessValue.trim())
    ? 5
    : 2

  return severity
    + impact
    + effort
    + evidenceConfidence
    + dependencyReadiness
    + visibleResult
}

function deduplicateActions(actions: RecommendedAction[]) {
  const ids = new Set<string>()
  const titles = new Set<string>()
  const objectives = new Set<string>()

  return actions.filter((action) => {
    const id = normalizeKey(action.id)
    const title = normalizeKey(action.title)
    const objective = normalizeKey(action.objective)
    if (
      (id && ids.has(id))
      || (title && titles.has(title))
      || (objective && objectives.has(objective))
    ) {
      return false
    }
    if (id) ids.add(id)
    if (title) titles.add(title)
    if (objective) objectives.add(objective)
    return true
  })
}

function missionEffort(effort: RecommendedActionEffort): UpgradeMissionEffort {
  if (effort === 'Small') return 'Low'
  if (effort === 'Large') return 'High'
  return 'Medium'
}

function missionWindow(action: RecommendedAction) {
  if (action.estimatedEffort === 'Small') return '1–2 working days'
  if (action.estimatedEffort === 'Large') return '2–4 weeks'
  return '1–2 weeks'
}

function successCriteriaFor(
  category: ActionCategory,
  primaryService: string,
  city: string,
  audience: AudienceNoun,
) {
  const service = formatSentencePhrase(primaryService) || 'primary service'
  const singular = audience.singular

  if (category === 'Homepage' || category === 'Brand Positioning') {
    return [
      `A first-time reviewer can identify ${service}, ${city}, and the next step from the first screen.`,
      'The same primary promise appears on desktop and mobile without hidden context.',
    ]
  }
  if (category === 'Trust' || category === 'Reviews') {
    return [
      `Specific, attributable proof appears beside the primary ${singular} decision.`,
      'Every published review figure, credential, or result has been checked for accuracy.',
    ]
  }
  if (
    category === 'Conversion'
    || category === 'Calls To Action'
    || category === 'Mobile UX'
  ) {
    return [
      `The primary action explains what happens after a ${singular} calls, submits, or books.`,
      'A reviewer can complete the contact path on desktop and mobile without confusion.',
    ]
  }
  if (
    category === 'Service Pages'
    || category === 'Authority'
    || category === 'Content'
    || category === 'Internal Links'
  ) {
    return [
      `One complete ${service} resource explains fit, process, proof, and the next step.`,
      'Related entry pages lead to the resource through clear, useful links.',
    ]
  }
  if (category === 'Local SEO' || category === 'Google Business Profile') {
    return [
      `The website and public profile agree on ${service}, ${city}, and contact details.`,
      'A dated profile review confirms the priority fields and proof are current.',
    ]
  }
  if (category === 'FAQ' || category === 'AI Readiness') {
    return [
      `At least five common ${singular} questions have direct, plain-language answers.`,
      'Service, location, process, and proof can be summarized without inferring missing facts.',
    ]
  }

  return [
    `The recorded barrier is resolved in the live ${singular} experience.`,
    'A dated before-and-after check confirms the change on desktop and mobile.',
  ]
}

function verificationMethodFor(category: ActionCategory) {
  if (category === 'Google Business Profile' || category === 'Local SEO') {
    return 'Compare the website and public-profile facts, capture dated proof, and verify the result during the next Snapshot.'
  }
  if (category === 'Trust' || category === 'Reviews') {
    return 'Confirm each published proof point against its source, capture its final placement, and verify it during the next Snapshot.'
  }
  if (
    category === 'Conversion'
    || category === 'Calls To Action'
    || category === 'Mobile UX'
  ) {
    return 'Complete the inquiry path on desktop and mobile, save the result, and verify it during the next Snapshot.'
  }
  return 'Capture dated before-and-after evidence, check every success criterion, and verify the result during the next Snapshot.'
}

function implementationStepFor(
  category: ActionCategory,
  primaryService: string,
  city: string,
) {
  const service = formatSentencePhrase(primaryService)
  if (category === 'Homepage') {
    return `Lead with ${service}, ${city}, proof, and one clear next step.`
  }
  if (category === 'Trust' || category === 'Reviews') {
    return 'Place the strongest verified proof beside the primary decision point and confirm every claim against its source.'
  }
  if (category === 'Service Pages') {
    return 'Publish one complete service page covering fit, process, proof, common questions, and the next step.'
  }
  if (category === 'FAQ') {
    return 'Publish direct answers to the five questions most likely to delay first contact.'
  }
  if (category === 'Google Business Profile' || category === 'Local SEO') {
    return 'Align the primary service, service area, and contact facts across the website and public profile.'
  }
  if (
    category === 'Calls To Action'
    || category === 'Conversion'
    || category === 'Mobile UX'
  ) {
    return 'Use one clear action phrase and explain what happens immediately after the request.'
  }
  return `Complete the defined ${category.toLocaleLowerCase()} change and record the finished decision path.`
}

function formatBaselineEvidence(item: EvidenceItem) {
  const observation = item.observation.trim()
  const title = item.title.trim()
  if (title && observation) return limitWords(`${title}: ${observation}`, 34)
  return limitWords(observation || title, 34)
}

function createMission(
  candidate: MissionCandidate,
  index: number,
  actionById: Map<string, RecommendedAction>,
  primaryService: string,
  city: string,
  audience: AudienceNoun,
): UpgradeMission {
  const { action, evidence, unresolvedDependencyIds } = candidate
  const title = action.title.trim() || action.objective.trim() || `${action.category} operating upgrade`
  const objective = action.objective.trim() || action.description.trim() || title
  const actionSummary = action.description.trim() || objective
  const successCriteria = successCriteriaFor(action.category, primaryService, city, audience)
  const baselineStep = evidence[0]?.title.trim()
    ? `Confirm the recorded baseline against “${limitWords(evidence[0].title, 14)}.”`
    : `Capture a dated baseline of the current ${action.category.toLocaleLowerCase()} experience.`
  const dependencyWarnings = unresolvedDependencyIds.map((id) => {
    const dependency = actionById.get(id)
    return dependency
      ? `${dependency.title} must be completed or deliberately overridden first.`
      : 'A required predecessor must be resolved before this mission is treated as complete.'
  })

  return {
    id: `upgrade-mission-${action.id}`,
    sourceActionId: action.id,
    sourceStatus: action.status,
    title: limitWords(title, 14),
    objective: ensureSentence(limitWords(objective, 28)),
    category: action.category,
    priority: (index + 1) as 1 | 2 | 3,
    evidence: evidence.map(formatBaselineEvidence).filter(Boolean).slice(0, 3),
    actionSummary: ensureSentence(limitWords(actionSummary, 42)),
    actionPlan: [
      baselineStep,
      implementationStepFor(action.category, primaryService, city),
      'Record the finished result against the success criteria for the next Snapshot.',
    ],
    primaryBusinessOutcome: ensureSentence(limitWords(
      action.businessValue.trim() || action.expectedOutcome.trim(),
      20,
    )),
    expectedOutcome: ensureSentence(
      `If this works as intended, ${lowerFirst(
        action.expectedOutcome.trim() || action.businessValue.trim(),
      )}`,
    ),
    effort: missionEffort(action.estimatedEffort),
    timeEstimate: missionWindow(action),
    successCriteria,
    verificationMethod: verificationMethodFor(action.category),
    unresolvedDependencyIds,
    dependencyWarnings,
  }
}

export function prioritizeUpgradeMissions(input: {
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
  primaryService: string
  city: string
  audience?: AudienceNoun
}) {
  const audience = input.audience ?? { singular: 'customer', plural: 'customers' }
  const actionById = new Map(input.actions.map((action) => [action.id, action]))
  const eligibleActions = deduplicateActions(input.actions).filter(
    (action) => action.status !== 'Deferred',
  )
  const candidates = eligibleActions.map((action): MissionCandidate => {
    const evidence = evidenceForAction(action, input.evidenceItems)
    const unresolvedDependencyIds = unresolvedDependencies(action, actionById)
    return {
      action,
      evidence,
      unresolvedDependencyIds,
      rank: rankMissionCandidate(action, evidence, unresolvedDependencyIds),
    }
  })

  return candidates
    .sort(
      (left, right) =>
        right.rank - left.rank
        || right.action.priorityScore - left.action.priorityScore
        || left.action.recommendedOrder - right.action.recommendedOrder
        || left.action.id.localeCompare(right.action.id),
    )
    .slice(0, 3)
    .map((candidate, index) =>
      createMission(
        candidate,
        index,
        actionById,
        input.primaryService,
        input.city,
        audience,
      ),
    )
}

export function getEligibleUpgradeMissionCount(actions: RecommendedAction[]) {
  return deduplicateActions(actions).filter((action) => action.status !== 'Deferred').length
}

function ledgerStatus(status: RecommendedActionStatus): ImpactLedgerStatus {
  if (status === 'Completed') return 'Completed'
  if (
    status === 'Scheduled'
    || status === 'In Progress'
    || status === 'Needs Review'
  ) {
    return 'In Progress'
  }
  return 'Planned'
}

function completedDate(
  mission: UpgradeMission,
  history: ActionStatusChange[],
) {
  const latest = history
    .filter(
      (entry) =>
        entry.actionId === mission.sourceActionId
        && entry.newStatus === 'Completed',
    )
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt))[0]
  return latest ? formatDate(latest.changedAt) : undefined
}

function createImpactLedger(
  missions: UpgradeMission[],
  history: ActionStatusChange[],
) {
  return missions.map((mission): ImpactLedgerEntry => {
    const firstCriterion = withoutFinalPunctuation(mission.successCriteria[0] ?? '')
    return {
      missionId: mission.id,
      missionTitle: mission.title,
      status: ledgerStatus(mission.sourceStatus),
      baselineEvidence: mission.evidence,
      actionTaken: undefined,
      completionDate: mission.sourceStatus === 'Completed'
        ? completedDate(mission, history)
        : undefined,
      verificationEvidence: [],
      businessImpact: undefined,
      nextProofRequired: firstCriterion
        ? `Dated evidence that ${lowerFirst(firstCriterion)}.`
        : 'Dated before-and-after evidence tied to the mission objective.',
      verificationTiming: 'During the next Snapshot after implementation; completion alone is not verification.',
    }
  })
}

function achievementStatus(status: RecommendedActionStatus): AchievementStatus {
  return status === 'Not Started' || status === 'Deferred'
    ? 'Locked'
    : 'In Progress'
}

function createAchievements(
  missions: UpgradeMission[],
  audience: AudienceNoun,
) {
  const titleCounts = new Map<string, number>()
  return missions.map((mission): BusinessAchievement => {
    const family = achievementFamilyByCategory[mission.category]
    const count = titleCounts.get(family.title) ?? 0
    titleCounts.set(family.title, count + 1)
    const title = count === 0
      ? family.title
      : `${family.title} — ${mission.category} Mission ${mission.priority}`
    const familyDescription = family.description.replace(
      /\bthe customer\b/i,
      `the ${audience.singular}`,
    )
    const description = count === 0
      ? familyDescription
      : `Completion of “${mission.title}” establishes a distinct ${mission.category.toLocaleLowerCase()} operating standard.`
    return {
      id: `achievement-${mission.id}`,
      missionId: mission.id,
      title,
      description,
      verificationRequirements: [
        `For “${mission.title}”: ${mission.successCriteria[0]}`,
        `Dated evidence for “${mission.title}” reviewed during a follow-up Snapshot.`,
      ],
      status: achievementStatus(mission.sourceStatus),
    }
  })
}

function operatingFocus(missions: UpgradeMission[]) {
  if (missions.length === 0) {
    return 'Use the next 60–90 days to confirm the baseline and select the first improvement that can be implemented and verified.'
  }
  const unfinished = missions.filter((mission) => mission.sourceStatus !== 'Completed')
  if (unfinished.length === 0) {
    return 'All selected missions are marked complete. Use the next review window to capture proof and verify the work in a follow-up Snapshot.'
  }
  if (unfinished.length === 1) {
    return `For the next 60–90 days, prioritize “${withoutFinalPunctuation(unfinished[0].title)},” then capture proof for every completed mission.`
  }
  return `For the next 60–90 days, prioritize “${withoutFinalPunctuation(unfinished[0].title)},” then complete the remaining missions in order and capture proof as each one moves forward.`
}

function createJourney(
  input: UpgradeOSReportInput,
  missions: UpgradeMission[],
): UpgradeJourney {
  const snapshotNumber = String(input.snapshotNumber ?? 1).padStart(3, '0')
  const maintainingCurrentStage = input.nextGrowthStage === null
  const nextEvolutionTitle = maintainingCurrentStage
    ? `Strengthen ${input.currentGrowthStage}`
    : `Build toward ${input.nextGrowthStage}`

  return {
    businessName: input.businessName,
    snapshotNumber,
    snapshotDate: formatDate(input.snapshotDate),
    currentArchetype: input.currentArchetype,
    currentHealthScore: input.currentHealthScore,
    currentGrowthStage: input.currentGrowthStage,
    nextEvolutionTitle,
    nextEvolutionExplanation: ensureSentence(
      `${withoutFinalPunctuation(input.nextEvolution)}. This is a planning direction, not a predicted score or guaranteed stage change`,
    ),
    targetScoreRange: input.currentHealthScore === null
      ? 'Planning range unavailable until scores are reviewed'
      : `${input.targetScoreLow}–${input.targetScoreHigh}/100 planning range`,
    planningHorizon: '60–90 days',
    missions,
    operatingFocus: operatingFocus(missions),
    ownerLabel: 'Owner / team',
    reviewDate: addDays(input.snapshotDate, 90),
  }
}

function createSnapshotRecord(
  input: UpgradeOSReportInput,
): SnapshotRecordCheckpoint[] {
  const snapshotNumber = String(input.snapshotNumber ?? 1).padStart(3, '0')
  return [
    {
      id: `snapshot-${snapshotNumber}`,
      label: `Snapshot ${snapshotNumber}`,
      dateLabel: formatDate(input.snapshotDate),
      archetype: input.currentArchetype,
      businessHealthScore: input.currentHealthScore,
      status: 'Baseline Recorded',
    },
    {
      id: 'next-review',
      label: 'Next Review',
      dateLabel: addDays(input.snapshotDate, 60),
      archetype: null,
      businessHealthScore: null,
      status: 'To be recorded',
    },
    {
      id: 'verification-snapshot',
      label: 'Verification Snapshot',
      dateLabel: 'After mission evidence is ready',
      archetype: null,
      businessHealthScore: null,
      status: 'To be recorded',
    },
    {
      id: 'quarterly-snapshot',
      label: 'Quarterly Snapshot',
      dateLabel: addDays(input.snapshotDate, 90),
      archetype: null,
      businessHealthScore: null,
      status: 'To be recorded',
    },
  ]
}

export function createUpgradeOSReportModel(
  input: UpgradeOSReportInput,
): UpgradeOSReportModel {
  const audience = input.audience ?? { singular: 'customer', plural: 'customers' }
  const missions = prioritizeUpgradeMissions({
    actions: input.actions,
    evidenceItems: input.evidenceItems,
    primaryService: input.primaryService,
    city: input.city,
    audience,
  })

  return {
    journey: createJourney(input, missions),
    missions,
    impactLedger: createImpactLedger(
      missions,
      input.actionStatusHistory,
    ),
    achievements: createAchievements(missions, audience),
    snapshotRecord: createSnapshotRecord(input),
  }
}

export function formatUpgradeJourneyText(journey: UpgradeJourney) {
  const missions = journey.missions.length > 0
    ? journey.missions.map((mission) =>
        `${mission.priority}. ${mission.title}
   Outcome: ${mission.primaryBusinessOutcome}
   Effort: ${mission.effort}
   Window: ${mission.timeEstimate}
   Success signal: ${mission.successCriteria[0]}`,
      ).join('\n')
    : upgradeOSEmptyStateText.missions

  return `Your Upgrade Journey

Current Position
- Business: ${journey.businessName}
- Snapshot: ${journey.snapshotNumber}
- Snapshot date: ${journey.snapshotDate}
- Business Archetype: ${journey.currentArchetype}
- Business Health Score: ${journey.currentHealthScore === null
    ? 'Score unavailable'
    : `${journey.currentHealthScore}/100`}
- Growth Stage: ${journey.currentGrowthStage}

Next Evolution
- Target state: ${journey.nextEvolutionTitle}
- Planning horizon: ${journey.planningHorizon}
- Target range: ${journey.targetScoreRange}
- ${journey.nextEvolutionExplanation}

Top Upgrade Missions
${missions}

Operating Focus
${journey.operatingFocus}

Owner / team: ____________________
Review date: ${journey.reviewDate}`
}

export function formatUpgradeMissionsText(missions: UpgradeMission[]) {
  if (missions.length === 0) {
    return `${reportTerminology.upgradeMissions}\n\n${upgradeOSEmptyStateText.missions}`
  }

  return `${reportTerminology.upgradeMissions}

${missions.map((mission) => `Mission ${mission.priority} — ${mission.title}
Status: ${mission.sourceStatus}
Objective: ${mission.objective}
Evidence:
${mission.evidence.length > 0
    ? mission.evidence.map((item) => `- ${item}`).join('\n')
    : `- ${upgradeOSEmptyStateText.evidence}`}
Action Plan:
${mission.actionPlan.map((step, index) => `${index + 1}. ${step}`).join('\n')}
Expected Outcome: ${mission.expectedOutcome}
Success Criteria:
${mission.successCriteria.map((item) => `- ${item}`).join('\n')}
Verification Method: ${mission.verificationMethod}`).join('\n\n')}`
}

export function formatImpactLedgerText(entries: ImpactLedgerEntry[]) {
  if (entries.length === 0) {
    return 'Impact Ledger\n\nNo ledger entries are available until an Upgrade Mission is selected.'
  }

  return `Impact Ledger

${entries.map((entry) => `${entry.missionTitle} — ${entry.status}
- Baseline: ${entry.baselineEvidence[0] ?? upgradeOSEmptyStateText.evidence}
- Next proof required: ${entry.nextProofRequired}
- Verification timing: ${entry.verificationTiming}`).join('\n\n')}`
}

export function formatAchievementsText(achievements: BusinessAchievement[]) {
  if (achievements.length === 0) {
    return `Achievement Path\n\n${upgradeOSEmptyStateText.achievements}`
  }

  return `Achievement Path

${achievements.map((achievement) => `${achievement.title} — ${achievement.status}
${achievement.description}
Verification requirements:
${achievement.verificationRequirements.map((item) => `- ${item}`).join('\n')}`).join('\n\n')}`
}

export function formatSnapshotRecordText(
  checkpoints: SnapshotRecordCheckpoint[],
) {
  return `Snapshot Record

${checkpoints.map((checkpoint) => {
    const score = checkpoint.businessHealthScore === null
      ? 'To be recorded'
      : `${checkpoint.businessHealthScore}/100`
    const archetype = checkpoint.archetype ?? 'To be recorded'
    return `${checkpoint.label} — ${checkpoint.status}
- Date: ${checkpoint.dateLabel}
- Business Archetype: ${archetype}
- Business Health Score: ${score}`
  }).join('\n\n')}

This is the beginning of a measurable operating history.`
}
