import type { GrowthStage } from '../types'

export type ProposalStatus =
  | 'Draft'
  | 'Ready'
  | 'Sent'
  | 'Viewed'
  | 'Accepted'
  | 'Declined'
  | 'Expired'

export type ProposalType =
  | '48-Hour Visibility Sprint'
  | 'Custom Implementation'
  | '30-Day Local Authority Buildout'

export type InvestmentMode = 'Fixed Price' | 'Custom Estimate' | 'Hide Pricing'

export type ProposalDeliverable = {
  id: string
  title: string
  description: string
  whyItMatters: string
  completionDefinition: string
  linkedActionId?: string
  linkedEvidenceIds: string[]
}

export type ProposalMilestone = {
  id: string
  label: string
  details: string
}

export type ProposalSnapshotContext = {
  primaryService: string
  city: string
  horoscopeName: string
  growthStage: GrowthStage
  currentScore: number
  targetScoreLow: number
  targetScoreHigh: number
  biggestOpportunityTitle: string
  biggestOpportunitySummary: string
  roadmapThemes: string[]
}

export type Proposal = {
  id: string
  snapshotId: string
  leadId?: string
  createdAt: string
  updatedAt: string
  proposalStatus: ProposalStatus
  proposalType: ProposalType
  proposalTitle: string
  clientBusinessName: string
  clientContactName?: string
  clientEmail?: string
  clientPhone?: string
  preparedBy: string
  brandName: string
  contactLine: string
  proposalSummary: string
  selectedActionIds: string[]
  customDeliverables: ProposalDeliverable[]
  timeline: string
  milestones: ProposalMilestone[]
  startWindow?: string
  investmentMode: InvestmentMode
  fixedPrice?: string
  currency: string
  customInvestmentText?: string
  paymentTerms: string
  assumptions: string[]
  exclusions: string[]
  clientResponsibilities: string[]
  nextStepHeadline: string
  nextStepBody: string
  ctaLabel: string
  bookingUrl?: string
  expirationDate?: string
  notes?: string
  snapshotContext: ProposalSnapshotContext
}

