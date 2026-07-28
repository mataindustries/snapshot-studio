import type {
  BusinessIntakePayload,
  EvidenceItem,
  Lead,
  SavedSnapshot,
  Scores,
  SnapshotForm,
} from '../types'
import type { Proposal } from '../types/proposal'
import type { FastLaneSession } from '../types/fastLane'
import { planRecommendations } from './actionPlanner'
import { createDeterministicDraft } from './draftAnalysis'
import {
  discardFastLaneSession,
  loadFastLaneSessions,
  saveFastLaneSession,
} from './fastLaneState'
import { createGrowthFoundation } from './growthPlanning'
import {
  deleteIntakeDraft,
  loadIntakeDrafts,
  saveIntakeDraft,
} from './intakeStorage'
import { parseWebsiteText } from './intakeParser'
import { filterClientFacingStrengths, isClientFacingStrength } from './clientStrengths'
import { loadLeads, persistLeads } from './leads'
import { createProposalFromSnapshot } from './proposalBuilder'
import { deleteProposal, loadProposals, saveProposal } from './proposalStorage'
import { getTotalScore } from './scoring'
import { deleteSnapshot, loadSnapshots, saveSnapshot } from './storage'
import { generateOutputs } from '../templates/snapshotTemplates'

export const contestDemoIds = {
  lead: 'contest-demo-lead-harbor-pine',
  intake: 'contest-demo-intake-harbor-pine',
  snapshot: 'contest-demo-snapshot-harbor-pine',
  proposal: 'contest-demo-proposal-harbor-pine',
  fastLaneSession: 'contest-demo-fast-lane-harbor-pine',
  homepageEvidence: 'contest-demo-evidence-homepage',
  trustEvidence: 'contest-demo-evidence-trust',
} as const

const createdAt = '2026-06-16T16:00:00.000Z'
const reviewedAt = '2026-06-18T18:30:00.000Z'
const websiteUrl = ''
const demoBiggestStrength = 'Customers consistently mention respectful technicians, clear arrival updates, and tidy work areas.'

export type ContestDemoData = {
  lead: Lead
  intake: BusinessIntakePayload
  snapshot: SavedSnapshot
  proposal: Proposal
  fastLaneSession: FastLaneSession
}

function createDemoForm(): SnapshotForm {
  return {
    businessName: 'Harbor & Pine Heating Co.',
    websiteUrl,
    city: 'Riverton',
    niche: 'Residential HVAC',
    mainService: 'Emergency heating and air conditioning repair',
    notes: demoBiggestStrength,
    weakness: 'The first screen leads with a broad comfort promise before naming emergency HVAC repair, Riverton, or the response process.',
    competitorNote: 'Nearby competitors make same-day availability and financing easier to compare from the first screen.',
    competitorUrl1: '',
    competitorUrl2: '',
    tone: 'premium',
    ctaStyle: 'book-call',
  }
}

function createDemoScores(): Scores {
  return {
    visibility: 14,
    trust: 17,
    conversion: 11,
    aiSearchReadiness: 9,
    competitorPosition: 12,
  }
}

function createDemoLead(): Lead {
  return {
    id: contestDemoIds.lead,
    createdAt,
    businessName: 'Harbor & Pine Heating Co.',
    websiteUrl,
    city: 'Riverton',
    niche: 'Residential HVAC',
    mainService: 'Emergency heating and air conditioning repair',
    phone: '',
    email: '',
    contactFormUrl: '',
    leadSource: 'Starter Workspace',
    priority: 'High',
    researchNotes: demoBiggestStrength,
    suggestedAngle: 'Lead with the gap between strong customer proof and the vague first-screen service promise.',
    status: 'Snapshot made',
    lastContactedAt: '',
    linkedSnapshotId: contestDemoIds.snapshot,
    nextFollowUpDate: '',
    outreachActivity: [],
  }
}

function createDemoIntake(): BusinessIntakePayload {
  const pageText = `Harbor & Pine Heating Co.
Comfort starts here.
Emergency furnace and air conditioning repair for Riverton homeowners.
Request service online.
Same-day appointments when the schedule allows.
4.8 average rating from 126 customer reviews.
Licensed and insured residential HVAC technicians.
What happens after I request service?
We confirm the issue, arrival window, and diagnostic fee before dispatch.`
  const base: BusinessIntakePayload = {
    schemaVersion: 1,
    id: contestDemoIds.intake,
    createdAt,
    updatedAt: reviewedAt,
    currentStep: 7,
    linkedLeadId: contestDemoIds.lead,
    linkedSnapshotId: contestDemoIds.snapshot,
    appliedAt: reviewedAt,
    identity: {
      businessName: 'Harbor & Pine Heating Co.',
      websiteUrlRaw: websiteUrl,
      websiteUrlNormalized: websiteUrl,
      city: 'Riverton',
      niche: 'Residential HVAC',
      primaryService: 'Emergency heating and air conditioning repair',
      secondaryServices: 'Furnace repair; AC repair; seasonal maintenance',
      phone: '',
      email: '',
      contactFormUrl: '',
      bookingUrl: '',
      businessAgeOrFoundingYear: 'Serving local homeowners since 2012',
      ownerFamilyNote: 'Locally operated service team.',
      serviceAreas: 'Riverton; Eastbank; Cedar Grove',
      differentiators: 'Respectful technicians, clear arrival updates, tidy work areas, and practical repair options.',
    },
    website: {
      homepageTitle: 'Harbor & Pine Heating Co. | Riverton HVAC Service',
      metaDescription: 'Residential heating and air conditioning repair for Riverton and nearby communities.',
      heroHeadline: 'Comfort starts here.',
      heroSupportCopy: 'Responsive local HVAC help from respectful, licensed technicians.',
      primaryCta: 'Request service',
      homepageBodyText: 'Emergency repair, maintenance, and replacement guidance for Riverton homeowners.',
      servicesListed: 'Furnace repair, air conditioning repair, maintenance, and replacement consultations.',
      trustReviewCopy: '4.8 average rating from 126 customer reviews. Licensed and insured.',
      faqText: 'What happens after I request service? We confirm the issue, arrival window, and diagnostic fee before dispatch.',
      aboutTeamCopy: 'A locally operated HVAC team serving Riverton since 2012.',
      footerContactDetails: '',
      pageText,
    },
    publicProfile: {
      googleRating: '4.8',
      reviewCount: '126',
      latestReviewRecency: 'Recent review noted during the operator review.',
      profileCompletenessNotes: 'Services and hours are present; emergency response expectations and review themes could be more explicit.',
      categories: 'HVAC contractor; heating repair service; air conditioning repair service',
      hours: 'Monday–Saturday, with after-hours requests accepted by form',
      photos: 'Team, service vehicles, and equipment photos noted',
      socialProfiles: 'Public social profile noted; content cadence not assessed',
      credentials: 'Licensed and insured claim recorded in the reviewed source material',
      awards: 'No awards entered',
      financing: 'Financing mentioned on an interior service section',
      guarantees: 'Workmanship language noted; terms require confirmation',
      emergencyAvailability: 'Same-day appointments when the schedule allows',
      accessibilityLanguageSupport: 'Not entered',
    },
    competitorContext: {
      competitors: [
        {
          name: 'Northstar Comfort',
          url: '',
          notes: 'Competitor presents same-day availability and financing prominently.',
        },
        {
          name: 'Cedar Air & Heat',
          url: '',
          notes: 'Competitor organizes repair services and FAQs more clearly.',
        },
      ],
      comparisonNotes: 'Harbor & Pine has stronger review proof, while the comparison set makes response expectations easier to scan.',
    },
    observationClassifications: {},
    observationEvidenceLinks: {},
    draft: null,
  }
  const extraction = parseWebsiteText(pageText, {
    serviceTerms: ['emergency heating repair', 'air conditioning repair', 'furnace repair'],
    locationTerms: ['Riverton', 'Eastbank', 'Cedar Grove'],
  })
  const headingObservation = extraction.observations.find((item) => item.kind === 'Heading')
    ?? extraction.observations[0]
  const trustObservation = extraction.observations.find((item) => item.kind === 'Trust phrase')
    ?? extraction.observations[1]
  const observationEvidenceLinks = {
    ...(headingObservation ? { [headingObservation.id]: contestDemoIds.homepageEvidence } : {}),
    ...(trustObservation ? { [trustObservation.id]: contestDemoIds.trustEvidence } : {}),
  }
  const observationClassifications = {
    ...(headingObservation ? { [headingObservation.id]: 'Opportunity' as const } : {}),
    ...(trustObservation ? { [trustObservation.id]: 'Strength' as const } : {}),
  }
  const reviewedIntake = {
    ...base,
    observationClassifications,
    observationEvidenceLinks,
  }
  return {
    ...reviewedIntake,
    draft: {
      ...createDeterministicDraft(reviewedIntake, extraction),
      generatedAt: reviewedAt,
    },
  }
}

function createDemoEvidence(actionIds: string[]): EvidenceItem[] {
  return [
    {
      id: contestDemoIds.homepageEvidence,
      evidenceType: 'Website',
      sentiment: 'Opportunity',
      title: 'The first-screen promise is broader than the urgent service need',
      sourceUrl: websiteUrl,
      pageLabel: 'Homepage first screen',
      observation: 'The recorded headline says “Comfort starts here” before naming emergency HVAC repair or Riverton.',
      whyItMatters: 'A homeowner with a failed furnace should recognize service fit and local availability before comparing another provider.',
      recommendedChange: 'Lead with emergency heating and air conditioning repair in Riverton, then support it with one proof point and the request-service action.',
      expectedOutcome: 'The primary service, market, and next step become clear at a glance.',
      beforeCaption: 'Broad comfort message leads the page.',
      proposedAfterCaption: 'Specific emergency HVAC service and Riverton context lead the page.',
      annotationLabel: 'First-screen clarity opportunity',
      linkedActionIds: actionIds[0] ? [actionIds[0]] : [],
      createdAt,
      updatedAt: reviewedAt,
      intakeDraftId: contestDemoIds.intake,
    },
    {
      id: contestDemoIds.trustEvidence,
      evidenceType: 'Google Business Profile',
      sentiment: 'Strength',
      title: 'Strong review proof is available for the decision point',
      sourceUrl: websiteUrl,
      pageLabel: 'Operator-entered public-profile notes',
      observation: 'A 4.8 average across 126 reviews is recorded, with recurring mentions of respectful technicians and clear arrival updates.',
      whyItMatters: 'Specific homeowner proof can reduce hesitation when it appears beside the service request rather than later in the page.',
      recommendedChange: 'Place a concise review proof block beside the primary request-service action and confirm the figures before client delivery.',
      expectedOutcome: 'Visitors see a concrete reason to trust the next step before leaving to compare alternatives.',
      beforeCaption: 'Useful proof exists away from the main decision.',
      proposedAfterCaption: 'Review proof supports the request-service action.',
      annotationLabel: 'Decision-point trust asset',
      linkedActionIds: actionIds[1] ? [actionIds[1]] : [],
      createdAt,
      updatedAt: reviewedAt,
      intakeDraftId: contestDemoIds.intake,
    },
  ]
}

export function createContestDemoData(): ContestDemoData {
  const form = createDemoForm()
  const scores = createDemoScores()
  const baseActions = planRecommendations({ form, scores })
  const evidenceItems = createDemoEvidence(baseActions.map((action) => action.id))
  const recommendedActions = baseActions.map((action, index) => {
    const linkedEvidenceIds = evidenceItems
      .filter((item) => item.linkedActionIds.includes(action.id))
      .map((item) => item.id)
    return {
      ...action,
      status: index === 0
        ? 'Completed' as const
        : index === 1
          ? 'In Progress' as const
          : 'Not Started' as const,
      linkedEvidence: linkedEvidenceIds,
      linkedEvidenceIds,
      implementationNote: index === 0
        ? 'Revised first-screen copy has been reviewed internally.'
        : index === 1
          ? 'Proof selection and placement are in progress.'
          : undefined,
    }
  })
  const foundation = createGrowthFoundation(scores)
  const totalScore = getTotalScore(scores)
  const snapshot: SavedSnapshot = {
    ...form,
    ...foundation,
    id: contestDemoIds.snapshot,
    createdAt: reviewedAt,
    scores,
    outputs: generateOutputs(form, scores, totalScore),
    branding: {
      preparedBy: 'Snapshot Studio',
      brandName: 'Snapshot Studio',
      contactLine: '',
    },
    offerMode: 'Fixed Price',
    fixedPrice: '1850',
    currency: 'USD',
    customInvestmentText: '',
    ctaHeadline: 'Start with the highest-impact friction points',
    ctaBody: 'Confirm the 48-Hour Visibility Sprint scope, access, and approval window. After implementation, generate a follow-up Snapshot to verify progress.',
    ctaLabel: 'Review the sprint scope',
    ctaContactLine: '',
    bookingUrl: '',
    strengths: [
      demoBiggestStrength,
      'Residential emergency HVAC repair is clearly defined for Riverton and nearby service areas.',
      'A direct request-service path already exists and can support clearer expectations.',
    ],
    visibilityLeaks: [
      'Emergency repair, Riverton relevance, and response expectations appear after the broad first-screen promise.',
    ],
    operatorDraftAppliedAt: reviewedAt,
    recommendedActions,
    actionStatusHistory: [
      {
        actionId: recommendedActions[0].id,
        previousStatus: 'Not Started',
        newStatus: 'In Progress',
        changedAt: '2026-06-18T17:15:00.000Z',
      },
      {
        actionId: recommendedActions[0].id,
        previousStatus: 'In Progress',
        newStatus: 'Completed',
        changedAt: '2026-06-18T18:00:00.000Z',
      },
      {
        actionId: recommendedActions[1].id,
        previousStatus: 'Not Started',
        newStatus: 'In Progress',
        changedAt: reviewedAt,
      },
    ],
    expectedOutcomes: recommendedActions.map((action) => action.expectedOutcome),
    evidenceItems,
    includeIncompleteEvidence: false,
    progressStatus: 'In progress',
    reviewDate: '2026-07-16',
  }
  const lead = createDemoLead()
  const generatedProposal = createProposalFromSnapshot(
    snapshot,
    '48-Hour Visibility Sprint',
    lead,
  )
  const proposal: Proposal = {
    ...generatedProposal,
    id: contestDemoIds.proposal,
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
    proposalStatus: 'Ready',
    preparedBy: 'Snapshot Studio',
    contactLine: '',
    fixedPrice: '1850',
    currency: 'USD',
    paymentTerms: '50% to schedule; 50% after the implementation review.',
    startWindow: 'Within five business days of approval',
    notes: 'Prepared from the reviewed Snapshot scope.',
  }
  const fastLaneSession: FastLaneSession = {
    schemaVersion: 1,
    id: contestDemoIds.fastLaneSession,
    status: 'active',
    sourceType: 'lead',
    sourceId: contestDemoIds.lead,
    isNewVersion: false,
    currentStep: 6,
    completedSteps: [1, 2, 3, 4, 5],
    leadId: contestDemoIds.lead,
    intakeId: contestDemoIds.intake,
    snapshotId: contestDemoIds.snapshot,
    proposalId: contestDemoIds.proposal,
    leadDraft: {
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      city: lead.city,
      niche: lead.niche,
      mainService: lead.mainService,
      email: lead.email,
      phone: lead.phone,
      contactFormUrl: lead.contactFormUrl,
      priority: lead.priority,
      status: lead.status,
    },
    evidenceIds: evidenceItems.map((item) => item.id),
    selectedContactRoute: 'Phone Notes',
    followUpDate: '2026-07-21',
    noFollowUp: false,
    proposalSkipped: false,
    proposalIncluded: true,
    preliminarySnapshot: false,
    sendKitEdits: {},
    activity: [{
      id: 'contest-demo-activity-lead-selected',
      type: 'Lead selected',
      occurredAt: createdAt,
    }],
    createdAt,
    updatedAt: reviewedAt,
  }
  return {
    lead,
    intake: createDemoIntake(),
    snapshot,
    proposal,
    fastLaneSession,
  }
}

export function installContestDemo() {
  const data = createContestDemoData()
  persistLeads([
    data.lead,
    ...loadLeads().filter((lead) => lead.id !== contestDemoIds.lead),
  ])
  saveIntakeDraft(data.intake)
  saveSnapshot(data.snapshot)
  saveProposal(data.proposal)
  saveFastLaneSession(data.fastLaneSession)
  return data
}

export function getContestDemoData(): ContestDemoData | null {
  const lead = loadLeads().find((item) => item.id === contestDemoIds.lead)
  const intake = loadIntakeDrafts().find((item) => item.id === contestDemoIds.intake)
  const snapshot = loadSnapshots().find((item) => item.id === contestDemoIds.snapshot)
  const proposal = loadProposals().find((item) => item.id === contestDemoIds.proposal)
  const fastLaneSession = loadFastLaneSessions()
    .find((item) => item.id === contestDemoIds.fastLaneSession)
  if (!lead || !intake || !snapshot || !proposal || !fastLaneSession) return null
  return { lead, intake, snapshot, proposal, fastLaneSession }
}

export function refreshContestDemoClientCopy(data: ContestDemoData) {
  const knownLegacyStrengths = new Set([
    'Strong review proof gives the business a credible trust foundation.',
    ['Strong ', 'fictional ', 'review proof gives the business a credible trust foundation.'].join(''),
  ])
  const snapshotNeedsRepair = !isClientFacingStrength(data.snapshot.notes)
    || knownLegacyStrengths.has(data.snapshot.strengths[0]?.trim() || '')
  const leadNeedsRepair = !isClientFacingStrength(data.lead.researchNotes)

  if (!snapshotNeedsRepair && !leadNeedsRepair) return data

  const lead = leadNeedsRepair
    ? { ...data.lead, researchNotes: demoBiggestStrength }
    : data.lead
  const snapshotBase = snapshotNeedsRepair
    ? {
        ...data.snapshot,
        notes: isClientFacingStrength(data.snapshot.notes)
          ? data.snapshot.notes
          : demoBiggestStrength,
        strengths: [
          demoBiggestStrength,
          ...filterClientFacingStrengths(data.snapshot.strengths)
            .filter((strength) => strength !== demoBiggestStrength
              && !knownLegacyStrengths.has(strength)),
        ].slice(0, 3),
      }
    : data.snapshot
  const snapshot = snapshotNeedsRepair
    ? {
        ...snapshotBase,
        outputs: generateOutputs(
          snapshotBase,
          snapshotBase.scores,
          getTotalScore(snapshotBase.scores),
        ),
      }
    : snapshotBase

  if (leadNeedsRepair) {
    persistLeads([lead, ...loadLeads().filter((item) => item.id !== lead.id)])
  }
  if (snapshotNeedsRepair) saveSnapshot(snapshot)

  return { ...data, lead, snapshot }
}

export function resetContestDemo() {
  const allIntakes = loadIntakeDrafts()
  const allSessions = loadFastLaneSessions()
  const allProposals = loadProposals()
  const intakeIds = new Set([
    contestDemoIds.intake,
    ...allIntakes
      .filter((intake) => intake.linkedLeadId === contestDemoIds.lead)
      .map((intake) => intake.id),
  ])
  const directlyLinkedSessions = allSessions.filter((session) =>
    session.id === contestDemoIds.fastLaneSession
    || session.leadId === contestDemoIds.lead
    || Boolean(session.intakeId && intakeIds.has(session.intakeId)),
  )
  directlyLinkedSessions.forEach((session) => {
    if (session.intakeId) intakeIds.add(session.intakeId)
  })
  const demoIntakes = allIntakes.filter((intake) => intakeIds.has(intake.id))
  const snapshotIds = new Set([
    contestDemoIds.snapshot,
    ...demoIntakes.map((intake) => intake.linkedSnapshotId).filter((id): id is string => Boolean(id)),
    ...directlyLinkedSessions
      .map((session) => session.snapshotId)
      .filter((id): id is string => Boolean(id)),
  ])
  const directlyLinkedProposalIds = new Set([
    contestDemoIds.proposal,
    ...directlyLinkedSessions
      .map((session) => session.proposalId)
      .filter((id): id is string => Boolean(id)),
  ])
  allProposals
    .filter((proposal) =>
      directlyLinkedProposalIds.has(proposal.id)
      || proposal.leadId === contestDemoIds.lead,
    )
    .forEach((proposal) => snapshotIds.add(proposal.snapshotId))
  const demoProposals = allProposals.filter((proposal) =>
    proposal.id === contestDemoIds.proposal
    || proposal.leadId === contestDemoIds.lead
    || directlyLinkedProposalIds.has(proposal.id)
    || snapshotIds.has(proposal.snapshotId),
  )
  const proposalIds = new Set(demoProposals.map((proposal) => proposal.id))

  allSessions
    .filter((session) =>
      session.leadId === contestDemoIds.lead
      || Boolean(session.intakeId && intakeIds.has(session.intakeId))
      || Boolean(session.snapshotId && snapshotIds.has(session.snapshotId))
      || Boolean(session.proposalId && proposalIds.has(session.proposalId)),
    )
    .forEach((session) => discardFastLaneSession(session.id))
  demoProposals.forEach((proposal) => deleteProposal(proposal.id))
  snapshotIds.forEach((snapshotId) => deleteSnapshot(snapshotId))
  demoIntakes.forEach((intake) => deleteIntakeDraft(intake.id))
  persistLeads(loadLeads().filter((lead) => lead.id !== contestDemoIds.lead))
  return installContestDemo()
}

export function isContestDemoInstalled() {
  return Boolean(getContestDemoData())
}
