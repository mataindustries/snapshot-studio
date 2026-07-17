export type Tone = 'fun' | 'professional' | 'spicy' | 'premium' | 'friendly' | 'expert' | 'blunt'

export type CtaStyle = 'ask-permission' | 'send-snapshot' | 'book-call'

export type ScoreKey =
  | 'visibility'
  | 'trust'
  | 'conversion'
  | 'aiSearchReadiness'
  | 'competitorPosition'

export type Scores = Record<ScoreKey, number>

export type RatingLabel = 'Strong' | 'Decent' | 'Needs work' | 'Weak'

export type SnapshotOutputs = {
  snapshot: string
  email: string
  text: string
  shareable: string
  upsell: string
}

export type BrandingFields = {
  preparedBy: string
  brandName: string
  contactLine: string
}

export type OpportunityLevel = 'Low' | 'Moderate' | 'Strong' | 'High'

export type GrowthStage =
  | 'Emerging Presence'
  | 'Clear Provider'
  | 'Trusted Specialist'
  | 'Community Favorite'
  | 'Local Authority'
  | 'Market Leader'

export type ActionCategory =
  | 'Homepage'
  | 'Trust'
  | 'Authority'
  | 'Local SEO'
  | 'Service Pages'
  | 'Reviews'
  | 'Conversion'
  | 'Google Business Profile'
  | 'Content'
  | 'FAQ'
  | 'Mobile UX'
  | 'Calls To Action'
  | 'Internal Links'
  | 'Technical'
  | 'Brand Positioning'
  | 'AI Readiness'

export type RecommendedActionPriority = 'Low' | 'Medium' | 'High'

export type RecommendedActionEffort = 'Small' | 'Medium' | 'Large'

export type RecommendedActionImpact = 'Low' | 'Medium' | 'High'

export type RecommendedActionStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Skipped'
  | 'Needs Review'

export type RecommendedAction = {
  id: string
  title: string
  description: string
  category: ActionCategory
  priority: RecommendedActionPriority
  estimatedEffort: RecommendedActionEffort
  estimatedImpact: RecommendedActionImpact
  estimatedHours: number
  priorityScore: number
  opportunityScore: number
  reason: string
  expectedOutcome: string
  objective: string
  businessValue: string
  status: RecommendedActionStatus
  blockedBy: string[]
  unlocks: string[]
  recommendedOrder: number
  linkedEvidence: string[]
  // Existing evidence features continue to use this field as their storage contract.
  linkedEvidenceIds: string[]
  evidenceReference?: string
  implementationNote?: string
}

export type EvidenceType =
  | 'Website'
  | 'Google Business Profile'
  | 'Social Profile'
  | 'Search Result'
  | 'Competitor'
  | 'Review Platform'
  | 'Conversion Path'
  | 'Other'

export type EvidenceSentiment = 'Strength' | 'Opportunity' | 'Neutral'

export type EvidenceItem = {
  id: string
  evidenceType: EvidenceType
  sentiment: EvidenceSentiment
  title: string
  sourceUrl: string
  pageLabel: string
  observation: string
  whyItMatters: string
  recommendedChange: string
  expectedOutcome: string
  screenshotDataUrl?: string
  screenshotFileName?: string
  screenshotAltText?: string
  beforeCaption?: string
  proposedAfterCaption?: string
  annotationLabel?: string
  linkedActionIds: string[]
  createdAt: string
  updatedAt: string
  // Retained for backwards compatibility with Prompt 1 snapshots.
  screenshotPlaceholder?: string
}

export type ProgressStatus =
  | 'Not started'
  | 'Planning'
  | 'In progress'
  | 'Monitoring'
  | 'Complete'

export type SnapshotGrowthFoundation = {
  currentScore: number
  targetScoreLow: number
  targetScoreHigh: number
  opportunityLevel: OpportunityLevel
  currentArchetype: GrowthStage
  nextArchetype: GrowthStage | null
  strengths: string[]
  visibilityLeaks: string[]
  recommendedActions: RecommendedAction[]
  expectedOutcomes: string[]
  evidenceItems: EvidenceItem[]
  progressStatus: ProgressStatus
  includeIncompleteEvidence: boolean
  reviewDate: string
  methodologyNote: string
  planningEstimateDisclaimer: string
}

export type SnapshotForm = {
  businessName: string
  websiteUrl: string
  city: string
  niche: string
  mainService: string
  notes: string
  weakness: string
  competitorNote: string
  competitorUrl1: string
  competitorUrl2: string
  tone: Tone
  ctaStyle: CtaStyle
}

export type OfferMode = 'Conversation' | 'Fixed Price' | 'Custom Estimate' | 'Hide Pricing'

export type ReportOfferFields = {
  offerMode: OfferMode
  fixedPrice: string
  currency: string
  customInvestmentText: string
  ctaHeadline: string
  ctaBody: string
  ctaLabel: string
  ctaContactLine: string
  bookingUrl: string
}

export type SavedSnapshot = SnapshotForm & SnapshotGrowthFoundation & ReportOfferFields & {
  id: string
  createdAt: string
  scores: Scores
  outputs: SnapshotOutputs
  branding?: BrandingFields
}

export type LeadPriority = 'High' | 'Medium' | 'Low'

export type LeadStatus =
  | 'Not reviewed'
  | 'Snapshot made'
  | 'Sent'
  | 'Replied'
  | 'Call booked'
  | 'Paid'
  | 'Not interested'

export type Lead = {
  id: string
  createdAt: string
  businessName: string
  websiteUrl: string
  city: string
  niche: string
  mainService: string
  phone: string
  email: string
  contactFormUrl: string
  leadSource: string
  priority: LeadPriority
  researchNotes: string
  suggestedAngle: string
  status: LeadStatus
  lastContactedAt: string
  linkedSnapshotId?: string
}
