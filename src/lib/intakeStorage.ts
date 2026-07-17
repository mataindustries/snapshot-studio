import type {
  BusinessIdentityIntake,
  BusinessIntakePayload,
  CompetitorContextIntake,
  DraftAnalysisResult,
  EvidenceSentiment,
  PublicProfileIntake,
  WebsiteContentIntake,
} from '../types'
import { clampIntakeStep } from './intakeReadiness'
import { normalizeWebsiteUrl } from './intakeParser'

const intakeStorageKey = 'snapshot-studio:intake-drafts:v1'

export const emptyBusinessIdentity: BusinessIdentityIntake = {
  businessName: '',
  websiteUrlRaw: '',
  websiteUrlNormalized: '',
  city: '',
  niche: '',
  primaryService: '',
  secondaryServices: '',
  phone: '',
  email: '',
  contactFormUrl: '',
  bookingUrl: '',
  businessAgeOrFoundingYear: '',
  ownerFamilyNote: '',
  serviceAreas: '',
  differentiators: '',
}

export const emptyWebsiteContent: WebsiteContentIntake = {
  homepageTitle: '',
  metaDescription: '',
  heroHeadline: '',
  heroSupportCopy: '',
  primaryCta: '',
  homepageBodyText: '',
  servicesListed: '',
  trustReviewCopy: '',
  faqText: '',
  aboutTeamCopy: '',
  footerContactDetails: '',
  pageText: '',
}

export const emptyPublicProfile: PublicProfileIntake = {
  googleRating: '',
  reviewCount: '',
  latestReviewRecency: '',
  profileCompletenessNotes: '',
  categories: '',
  hours: '',
  photos: '',
  socialProfiles: '',
  credentials: '',
  awards: '',
  financing: '',
  guarantees: '',
  emergencyAvailability: '',
  accessibilityLanguageSupport: '',
}

export const emptyCompetitorContext: CompetitorContextIntake = {
  competitors: [
    { name: '', url: '', notes: '' },
    { name: '', url: '', notes: '' },
  ],
  comparisonNotes: '',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringRecord(value: unknown) {
  if (!isRecord(value)) return {}
  return Object.entries(value).reduce<Record<string, string>>((record, [key, item]) => {
    if (typeof item === 'string' && item) record[key] = item
    return record
  }, {})
}

function sentimentRecord(value: unknown) {
  if (!isRecord(value)) return {}
  const sentiments: EvidenceSentiment[] = ['Strength', 'Opportunity', 'Neutral']
  return Object.entries(value).reduce<Record<string, EvidenceSentiment>>(
    (record, [key, item]) => {
      if (typeof item === 'string' && sentiments.includes(item as EvidenceSentiment)) {
        record[key] = item as EvidenceSentiment
      }
      return record
    },
    {},
  )
}

function normalizeDraft(value: unknown): DraftAnalysisResult | null {
  if (
    !isRecord(value)
    || value.engine !== 'deterministic-v1'
    || typeof value.generatedAt !== 'string'
    || typeof value.inputSignature !== 'string'
    || !isRecord(value.scoreSuggestions)
    || !Array.isArray(value.suggestedStrengthNotes)
    || !Array.isArray(value.suggestedStrategicAssets)
  ) {
    return null
  }
  return value as unknown as DraftAnalysisResult
}

export function createEmptyBusinessIntake(
  associations: { linkedLeadId?: string; linkedSnapshotId?: string } = {},
): BusinessIntakePayload {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    currentStep: 1,
    linkedLeadId: associations.linkedLeadId,
    linkedSnapshotId: associations.linkedSnapshotId,
    identity: { ...emptyBusinessIdentity },
    website: { ...emptyWebsiteContent },
    publicProfile: { ...emptyPublicProfile },
    competitorContext: {
      competitors: emptyCompetitorContext.competitors.map(
        (competitor) => ({ ...competitor }),
      ) as CompetitorContextIntake['competitors'],
      comparisonNotes: '',
    },
    observationClassifications: {},
    observationEvidenceLinks: {},
    draft: null,
  }
}

export function normalizeBusinessIntake(value: unknown): BusinessIntakePayload | null {
  if (!isRecord(value)) return null
  const fallback = createEmptyBusinessIntake()
  const identity = isRecord(value.identity) ? value.identity : {}
  const website = isRecord(value.website) ? value.website : {}
  const publicProfile = isRecord(value.publicProfile) ? value.publicProfile : {}
  const competitorContext = isRecord(value.competitorContext) ? value.competitorContext : {}
  const competitors = Array.isArray(competitorContext.competitors)
    ? competitorContext.competitors
    : []
  const firstCompetitor = isRecord(competitors[0]) ? competitors[0] : {}
  const secondCompetitor = isRecord(competitors[1]) ? competitors[1] : {}
  const websiteUrlRaw = stringValue(identity.websiteUrlRaw)
  const normalizedUrl = normalizeWebsiteUrl(websiteUrlRaw)

  return {
    schemaVersion: 1,
    id: stringValue(value.id, fallback.id),
    createdAt: stringValue(value.createdAt, fallback.createdAt),
    updatedAt: stringValue(value.updatedAt, fallback.updatedAt),
    currentStep: clampIntakeStep(numberValue(value.currentStep, 1)),
    linkedLeadId: optionalString(value.linkedLeadId),
    linkedSnapshotId: optionalString(value.linkedSnapshotId),
    appliedAt: optionalString(value.appliedAt),
    identity: {
      businessName: stringValue(identity.businessName),
      websiteUrlRaw,
      websiteUrlNormalized: normalizedUrl.valid
        ? normalizedUrl.normalized
        : stringValue(identity.websiteUrlNormalized),
      city: stringValue(identity.city),
      niche: stringValue(identity.niche),
      primaryService: stringValue(identity.primaryService),
      secondaryServices: stringValue(identity.secondaryServices),
      phone: stringValue(identity.phone),
      email: stringValue(identity.email),
      contactFormUrl: stringValue(identity.contactFormUrl),
      bookingUrl: stringValue(identity.bookingUrl),
      businessAgeOrFoundingYear: stringValue(identity.businessAgeOrFoundingYear),
      ownerFamilyNote: stringValue(identity.ownerFamilyNote),
      serviceAreas: stringValue(identity.serviceAreas),
      differentiators: stringValue(identity.differentiators),
    },
    website: {
      homepageTitle: stringValue(website.homepageTitle),
      metaDescription: stringValue(website.metaDescription),
      heroHeadline: stringValue(website.heroHeadline),
      heroSupportCopy: stringValue(website.heroSupportCopy),
      primaryCta: stringValue(website.primaryCta),
      homepageBodyText: stringValue(website.homepageBodyText),
      servicesListed: stringValue(website.servicesListed),
      trustReviewCopy: stringValue(website.trustReviewCopy),
      faqText: stringValue(website.faqText),
      aboutTeamCopy: stringValue(website.aboutTeamCopy),
      footerContactDetails: stringValue(website.footerContactDetails),
      pageText: stringValue(website.pageText),
    },
    publicProfile: {
      googleRating: stringValue(publicProfile.googleRating),
      reviewCount: stringValue(publicProfile.reviewCount),
      latestReviewRecency: stringValue(publicProfile.latestReviewRecency),
      profileCompletenessNotes: stringValue(publicProfile.profileCompletenessNotes),
      categories: stringValue(publicProfile.categories),
      hours: stringValue(publicProfile.hours),
      photos: stringValue(publicProfile.photos),
      socialProfiles: stringValue(publicProfile.socialProfiles),
      credentials: stringValue(publicProfile.credentials),
      awards: stringValue(publicProfile.awards),
      financing: stringValue(publicProfile.financing),
      guarantees: stringValue(publicProfile.guarantees),
      emergencyAvailability: stringValue(publicProfile.emergencyAvailability),
      accessibilityLanguageSupport: stringValue(
        publicProfile.accessibilityLanguageSupport,
      ),
    },
    competitorContext: {
      competitors: [
        {
          name: stringValue(firstCompetitor.name),
          url: stringValue(firstCompetitor.url),
          notes: stringValue(firstCompetitor.notes),
        },
        {
          name: stringValue(secondCompetitor.name),
          url: stringValue(secondCompetitor.url),
          notes: stringValue(secondCompetitor.notes),
        },
      ],
      comparisonNotes: stringValue(competitorContext.comparisonNotes),
    },
    observationClassifications: sentimentRecord(value.observationClassifications),
    observationEvidenceLinks: stringRecord(value.observationEvidenceLinks),
    draft: normalizeDraft(value.draft),
  }
}

function safelyParseIntakes(value: string | null): BusinessIntakePayload[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed
          .map(normalizeBusinessIntake)
          .filter((intake): intake is BusinessIntakePayload => intake !== null)
      : []
  } catch {
    return []
  }
}

export function loadIntakeDrafts() {
  try {
    return safelyParseIntakes(localStorage.getItem(intakeStorageKey))
  } catch {
    return []
  }
}

export function saveIntakeDraft(intake: BusinessIntakePayload) {
  const normalized = normalizeBusinessIntake({
    ...intake,
    updatedAt: new Date().toISOString(),
  })
  if (!normalized) return loadIntakeDrafts()

  const current = loadIntakeDrafts()
  const next = [
    normalized,
    ...current.filter((saved) => saved.id !== normalized.id),
  ]
  localStorage.setItem(intakeStorageKey, JSON.stringify(next))
  return next
}

export function deleteIntakeDraft(intakeId: string) {
  const next = loadIntakeDrafts().filter((intake) => intake.id !== intakeId)
  localStorage.setItem(intakeStorageKey, JSON.stringify(next))
  return next
}
