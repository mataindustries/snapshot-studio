import type {
  InvestmentMode,
  Proposal,
  ProposalDeliverable,
  ProposalMilestone,
  ProposalStatus,
  ProposalType,
} from '../types/proposal'
import { createStableId } from './evidence'

const storageKey = 'snapshot-studio:proposals:v1'
const legacyStorageKey = 'snapshot-studio:proposals'
const storageVersion = 1

const statuses: ProposalStatus[] = ['Draft', 'Ready', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired']
const types: ProposalType[] = ['48-Hour Visibility Sprint', 'Custom Implementation', '30-Day Local Authority Buildout']
const modes: InvestmentMode[] = ['Fixed Price', 'Custom Estimate', 'Hide Pricing']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function optionalString(value: unknown) {
  const result = stringValue(value).trim()
  return result || undefined
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function deliverables(value: unknown): ProposalDeliverable[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((item, index) => ({
    ...item,
    id: stringValue(item.id, createStableId('proposal-deliverable', [index, stringValue(item.title)])),
    title: stringValue(item.title),
    description: stringValue(item.description),
    whyItMatters: stringValue(item.whyItMatters),
    completionDefinition: stringValue(item.completionDefinition),
    linkedActionId: optionalString(item.linkedActionId),
    linkedEvidenceIds: strings(item.linkedEvidenceIds),
  }))
}

function milestones(value: unknown): ProposalMilestone[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((item, index) => ({
    ...item,
    id: stringValue(item.id, createStableId('proposal-milestone', [index, stringValue(item.label)])),
    label: stringValue(item.label),
    details: stringValue(item.details),
  }))
}

export function migrateProposal(value: unknown, index = 0): Proposal | null {
  if (!isRecord(value)) return null
  const now = new Date(0).toISOString()
  const createdAt = stringValue(value.createdAt, now)
  const proposalType = types.includes(value.proposalType as ProposalType)
    ? value.proposalType as ProposalType
    : '48-Hour Visibility Sprint'
  const context = isRecord(value.snapshotContext) ? value.snapshotContext : {}

  return {
    ...value,
    id: stringValue(value.id, createStableId('proposal', [stringValue(value.snapshotId), createdAt, index])),
    snapshotId: stringValue(value.snapshotId),
    leadId: optionalString(value.leadId),
    createdAt,
    updatedAt: stringValue(value.updatedAt, createdAt),
    proposalStatus: statuses.includes(value.proposalStatus as ProposalStatus)
      ? value.proposalStatus as ProposalStatus
      : 'Draft',
    proposalType,
    proposalTitle: stringValue(value.proposalTitle, proposalType + ' Proposal'),
    clientBusinessName: stringValue(value.clientBusinessName),
    clientContactName: optionalString(value.clientContactName),
    clientEmail: optionalString(value.clientEmail),
    clientPhone: optionalString(value.clientPhone),
    preparedBy: stringValue(value.preparedBy, 'Sergio'),
    brandName: stringValue(value.brandName, 'Snapshot Studio'),
    contactLine: stringValue(value.contactLine),
    proposalSummary: stringValue(value.proposalSummary),
    selectedActionIds: strings(value.selectedActionIds),
    customDeliverables: deliverables(value.customDeliverables),
    timeline: stringValue(value.timeline),
    milestones: milestones(value.milestones),
    startWindow: optionalString(value.startWindow),
    investmentMode: modes.includes(value.investmentMode as InvestmentMode)
      ? value.investmentMode as InvestmentMode
      : 'Hide Pricing',
    fixedPrice: optionalString(value.fixedPrice),
    currency: stringValue(value.currency, 'USD'),
    customInvestmentText: optionalString(value.customInvestmentText),
    paymentTerms: stringValue(value.paymentTerms),
    assumptions: strings(value.assumptions),
    exclusions: strings(value.exclusions),
    clientResponsibilities: strings(value.clientResponsibilities),
    nextStepHeadline: stringValue(value.nextStepHeadline, 'Ready to begin the sprint?'),
    nextStepBody: stringValue(value.nextStepBody, 'Confirm the scope, preferred start window, and website access so implementation can begin.'),
    ctaLabel: stringValue(value.ctaLabel, 'Approve the scope'),
    bookingUrl: optionalString(value.bookingUrl),
    expirationDate: optionalString(value.expirationDate),
    notes: optionalString(value.notes),
    snapshotContext: {
      ...context,
      primaryService: stringValue(context.primaryService),
      city: stringValue(context.city),
      horoscopeName: stringValue(context.horoscopeName, 'Business Horoscope'),
      growthStage: stringValue(context.growthStage, 'Emerging Presence') as Proposal['snapshotContext']['growthStage'],
      currentScore: typeof context.currentScore === 'number' ? context.currentScore : 0,
      targetScoreLow: typeof context.targetScoreLow === 'number' ? context.targetScoreLow : 0,
      targetScoreHigh: typeof context.targetScoreHigh === 'number' ? context.targetScoreHigh : 0,
      biggestOpportunityTitle: stringValue(context.biggestOpportunityTitle),
      biggestOpportunitySummary: stringValue(context.biggestOpportunitySummary),
      roadmapThemes: strings(context.roadmapThemes),
    },
  }
}

function parse(raw: string | null): Proposal[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.proposals)
        ? parsed.proposals
        : []
    return values.map(migrateProposal).filter((item): item is Proposal => item !== null)
  } catch {
    return []
  }
}

function persist(proposals: Proposal[]) {
  localStorage.setItem(storageKey, JSON.stringify({ version: storageVersion, proposals }))
  return proposals
}

export function loadProposals() {
  try {
    const current = parse(localStorage.getItem(storageKey))
    if (current.length > 0 || localStorage.getItem(storageKey)) return current
    const legacy = parse(localStorage.getItem(legacyStorageKey))
    if (legacy.length > 0) persist(legacy)
    return legacy
  } catch {
    return []
  }
}

export function saveProposal(proposal: Proposal) {
  const normalized = migrateProposal({ ...proposal, updatedAt: new Date().toISOString() })
  if (!normalized) return loadProposals()
  return persist([normalized, ...loadProposals().filter((item) => item.id !== normalized.id)])
}

export function deleteProposal(proposalId: string) {
  return persist(loadProposals().filter((proposal) => proposal.id !== proposalId))
}

