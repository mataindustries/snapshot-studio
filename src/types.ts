export type Tone = 'friendly' | 'expert' | 'blunt'

export type CtaStyle = 'ask-permission' | 'send-snapshot' | 'book-call'

export type ScoreKey =
  | 'clearServices'
  | 'clearServiceArea'
  | 'trustProof'
  | 'helpfulContent'
  | 'readableStructure'

export type Scores = Record<ScoreKey, number>

export type RatingLabel = 'Strong' | 'Decent' | 'Needs work' | 'Weak'

export type SnapshotOutputs = {
  snapshot: string
  email: string
  text: string
  followUp: string
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
