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

export type SavedSnapshot = SnapshotForm & {
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
