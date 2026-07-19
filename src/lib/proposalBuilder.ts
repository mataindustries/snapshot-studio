import type { Lead, RecommendedAction, SavedSnapshot } from '../types'
import type {
  Proposal,
  ProposalDeliverable,
  ProposalMilestone,
  ProposalType,
} from '../types/proposal'
import { createStableId } from './evidence'
import { createConsultingRoadmap } from './roadmap'
import { createReportStory } from './reportStory'
import { getTotalScore } from './scoring'
import { buildBusinessHoroscope } from '../templates/snapshotTemplates'

const assumptions = [
  'Existing website access is available.',
  'The client provides timely feedback.',
  'Work is limited to the selected pages and deliverables.',
  'Existing hosting and site infrastructure remain in place.',
]

const exclusions = [
  'Full website redesign',
  'Ongoing SEO retainers',
  'Paid advertising',
  'Custom backend development',
  'Legal, medical, or regulatory review',
  'Third-party platform fees',
]

const responsibilities = [
  'Provide website access.',
  'Approve copy and design direction.',
  'Provide logos, credentials, reviews, or proof when needed.',
  'Respond during the approval window.',
]

function orderedActions(snapshot: SavedSnapshot) {
  return [...snapshot.recommendedActions].sort(
    (left, right) => left.recommendedOrder - right.recommendedOrder
      || right.priorityScore - left.priorityScore,
  )
}

function defaultSprintActionIds(actions: RecommendedAction[]) {
  const source = actions.filter(
    (action) => action.status !== 'Completed' && action.status !== 'Deferred',
  )
  const picked: RecommendedAction[] = []
  const add = (categories: RecommendedAction['category'][]) => {
    const match = source.find(
      (action) => categories.includes(action.category) && !picked.includes(action),
    )
    if (match) picked.push(match)
  }

  add(['Homepage', 'Brand Positioning', 'Calls To Action'])
  add(['Trust', 'Conversion', 'Reviews'])
  add(['Mobile UX', 'Technical', 'Calls To Action'])
  return picked.slice(0, 3).map((action) => action.id)
}

function defaultActionIds(snapshot: SavedSnapshot, proposalType: ProposalType) {
  const actions = orderedActions(snapshot)
  if (proposalType === '48-Hour Visibility Sprint') return defaultSprintActionIds(actions)
  if (proposalType === '30-Day Local Authority Buildout') {
    const usableIds = new Set(actions
      .filter((action) => action.status !== 'Completed' && action.status !== 'Deferred')
      .map((action) => action.id))
    const roadmap = createConsultingRoadmap(actions)
    return Array.from(new Set(roadmap.weeks.flatMap((week) => week.actionIds)))
      .filter((id) => usableIds.has(id))
  }
  return actions
    .filter((action) => action.status !== 'Completed' && action.status !== 'Deferred')
    .slice(0, 4)
    .map((action) => action.id)
}

function defaultCustomDeliverables(
  snapshot: SavedSnapshot,
  proposalType: ProposalType,
  selectedActionIds: string[],
): ProposalDeliverable[] {
  if (proposalType !== '48-Hour Visibility Sprint') return []
  const selectedIds = new Set(selectedActionIds)
  const hasVerificationAction = snapshot.recommendedActions.some((action) =>
    selectedIds.has(action.id) && ['Mobile UX', 'Technical'].includes(action.category),
  )
  if (hasVerificationAction) return []

  const service = snapshot.mainService.trim() || 'primary service'
  const city = snapshot.city.trim() || 'the local market'
  return [{
    id: createStableId('proposal-deliverable', [snapshot.id, 'mobile-verification']),
    title: 'Mobile contact-path review',
    description: `Verify the ${service} message, proof, and contact path for ${city} on common mobile and desktop views.`,
    whyItMatters: 'A clear implementation can still lose inquiries if the final contact path breaks or becomes difficult on a smaller screen.',
    completionDefinition: 'The selected changes and primary contact path are reviewed on desktop and mobile, with final issues documented or corrected.',
    linkedEvidenceIds: [],
  }]
}

function milestonesFor(snapshot: SavedSnapshot, proposalType: ProposalType): ProposalMilestone[] {
  if (proposalType === '48-Hour Visibility Sprint') {
    return [
      {
        id: createStableId('milestone', ['sprint', 1]),
        label: 'Window 1 — Hours 0–24',
        details: 'Evidence review, copy and structure decisions, and an approval checkpoint.',
      },
      {
        id: createStableId('milestone', ['sprint', 2]),
        label: 'Window 2 — Hours 24–48',
        details: 'Implementation, desktop and mobile verification, and an updated Snapshot.',
      },
    ]
  }

  const roadmap = createConsultingRoadmap(snapshot.recommendedActions)
  if (proposalType === '30-Day Local Authority Buildout') {
    return roadmap.weeks.map((week) => ({
      id: createStableId('milestone', ['buildout', week.week]),
      label: `Phase ${week.week} — ${week.theme}`,
      details: `${week.goal} Milestone: ${week.milestone}`,
    }))
  }

  return [
    {
      id: createStableId('milestone', ['custom', 1]),
      label: 'Phase 1 — Confirm scope and access',
      details: 'Review evidence, confirm priorities, collect access, and approve the implementation direction.',
    },
    {
      id: createStableId('milestone', ['custom', 2]),
      label: 'Phase 2 — Implement and review',
      details: 'Complete the selected deliverables, review on desktop and mobile, and document outcomes.',
    },
  ]
}

export function actionToDeliverable(
  action: RecommendedAction,
  snapshot: Pick<SavedSnapshot, 'mainService' | 'city'>,
): ProposalDeliverable {
  const service = snapshot.mainService.trim() || 'primary service'
  const city = snapshot.city.trim() || 'the local market'
  return {
    id: createStableId('deliverable', [action.id]),
    title: action.title,
    description: action.description
      .replace(/primary service/gi, service)
      .replace(/local market/gi, city),
    whyItMatters: action.reason,
    completionDefinition: action.expectedOutcome || action.businessValue,
    linkedActionId: action.id,
    linkedEvidenceIds: [...action.linkedEvidenceIds],
  }
}

export function createProposalFromSnapshot(
  snapshot: SavedSnapshot,
  proposalType: ProposalType = '48-Hour Visibility Sprint',
  lead?: Lead,
): Proposal {
  const now = new Date().toISOString()
  const totalScore = getTotalScore(snapshot.scores)
  const roadmap = createConsultingRoadmap(snapshot.recommendedActions)
  const story = createReportStory({
    form: snapshot,
    scores: snapshot.scores,
    actions: roadmap.priorityMatrix,
    evidenceItems: snapshot.evidenceItems,
    operatorStrengths: snapshot.strengths,
    operatorOpportunity: snapshot.visibilityLeaks[0],
  })
  const horoscope = buildBusinessHoroscope(snapshot, snapshot.scores, totalScore)
  const title = proposalType === '48-Hour Visibility Sprint'
    ? '48-Hour Visibility Sprint Proposal'
    : proposalType === '30-Day Local Authority Buildout'
      ? '30-Day Local Authority Buildout Proposal'
      : 'Custom Implementation Proposal'
  const validPrice = Number(snapshot.fixedPrice) > 0
  const investmentMode: Proposal['investmentMode'] = snapshot.offerMode === 'Fixed Price' && validPrice
    ? 'Fixed Price'
    : snapshot.offerMode === 'Custom Estimate' && snapshot.customInvestmentText.trim()
      ? 'Custom Estimate'
      : 'Hide Pricing'
  const selectedActionIds = defaultActionIds(snapshot, proposalType)

  return {
    id: crypto.randomUUID(),
    snapshotId: snapshot.id,
    leadId: lead?.id,
    createdAt: now,
    updatedAt: now,
    proposalStatus: 'Draft',
    proposalType,
    proposalTitle: title,
    clientBusinessName: snapshot.businessName,
    clientEmail: lead?.email || undefined,
    clientPhone: lead?.phone || undefined,
    preparedBy: snapshot.branding?.preparedBy || 'Sergio',
    brandName: snapshot.branding?.brandName || 'Snapshot Studio',
    contactLine: snapshot.branding?.contactLine || snapshot.ctaContactLine || lead?.email || lead?.phone || '',
    proposalSummary: `A focused implementation plan to make ${snapshot.businessName || 'the business'} easier to understand, trust, and contact for ${snapshot.mainService || 'its primary service'} in ${snapshot.city || 'its local market'}.`,
    selectedActionIds,
    customDeliverables: defaultCustomDeliverables(snapshot, proposalType, selectedActionIds),
    timeline: proposalType === '48-Hour Visibility Sprint'
      ? 'Two focused implementation windows across 48 hours.'
      : 'Milestone timing will be confirmed after scope, access, and approvals are in place.',
    milestones: milestonesFor(snapshot, proposalType),
    investmentMode,
    fixedPrice: investmentMode === 'Fixed Price' ? snapshot.fixedPrice : undefined,
    currency: snapshot.currency || 'USD',
    customInvestmentText: snapshot.customInvestmentText || undefined,
    paymentTerms: '',
    assumptions: [...assumptions],
    exclusions: [...exclusions],
    clientResponsibilities: [...responsibilities],
    nextStepHeadline: 'Ready to turn this plan into visible progress?',
    nextStepBody: 'Confirm the scope, preferred start window, and website access. After implementation, a new Snapshot will verify progress and identify the next milestone.',
    ctaLabel: 'Start the highest-impact work',
    bookingUrl: snapshot.bookingUrl || undefined,
    snapshotContext: {
      primaryService: snapshot.mainService,
      city: snapshot.city,
      horoscopeName: horoscope.archetype,
      growthStage: snapshot.currentArchetype,
      currentScore: snapshot.currentScore,
      targetScoreLow: snapshot.targetScoreLow,
      targetScoreHigh: snapshot.targetScoreHigh,
      biggestOpportunityTitle: story.featuredOpportunity.title,
      biggestOpportunitySummary: `${story.featuredOpportunity.currentSituation} ${story.featuredOpportunity.recommendedFirstMove}`,
      roadmapThemes: roadmap.weeks.map((week) => week.theme),
    },
  }
}

export function duplicateProposal(proposal: Proposal): Proposal {
  const now = new Date().toISOString()
  return {
    ...proposal,
    id: crypto.randomUUID(),
    proposalStatus: 'Draft',
    proposalTitle: proposal.proposalTitle + ' — Copy',
    createdAt: now,
    updatedAt: now,
    selectedActionIds: [...proposal.selectedActionIds],
    customDeliverables: proposal.customDeliverables.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      linkedEvidenceIds: [...item.linkedEvidenceIds],
    })),
    milestones: proposal.milestones.map((item) => ({ ...item, id: crypto.randomUUID() })),
    assumptions: [...proposal.assumptions],
    exclusions: [...proposal.exclusions],
    clientResponsibilities: [...proposal.clientResponsibilities],
  }
}

export function rebuildProposalType(
  proposal: Proposal,
  snapshot: SavedSnapshot,
  proposalType: ProposalType,
): Proposal {
  return {
    ...proposal,
    proposalType,
    selectedActionIds: defaultActionIds(snapshot, proposalType),
    milestones: milestonesFor(snapshot, proposalType),
    timeline: proposalType === '48-Hour Visibility Sprint'
      ? 'Two focused implementation windows across 48 hours.'
      : 'Milestone timing will be confirmed after scope, access, and approvals are in place.',
  }
}
