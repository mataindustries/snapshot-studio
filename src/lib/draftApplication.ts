import type {
  BusinessIntakePayload,
  ReportOfferFields,
  ScoreKey,
  Scores,
  SnapshotForm,
} from '../types'
import { getSuggestionMidpoint } from './draftAnalysis'
import { normalizeWebsiteUrl } from './intakeParser'
import { scoreLabels } from './scoring'

export type DraftApplication = {
  formPatch?: Partial<SnapshotForm>
  scorePatch?: Partial<Scores>
  strengths?: string[]
  visibilityLeaks?: string[]
  reportOfferPatch?: Partial<ReportOfferFields>
  outreachAngle?: string
}

export type DraftApplicationChange = {
  label: string
  from: string
  to: string
  protected?: boolean
}

const scoreKeys = Object.keys(scoreLabels) as ScoreKey[]

function hasValue(value: string | undefined) {
  return Boolean(value?.trim())
}

function show(value: string | undefined) {
  return value?.trim() || 'Not set'
}

export function createFastLaneDraftApplication(input: {
  intake: BusinessIntakePayload
  currentForm: SnapshotForm
  currentScores: Scores
  currentOffer: ReportOfferFields
  currentStrengths: string[]
  currentVisibilityLeaks: string[]
  includeScores: boolean
  protectExisting: boolean
  allowOutreachAngle: boolean
  currentOutreachAngle?: string
}) {
  const draft = input.intake.draft
  if (!draft) return { application: {} as DraftApplication, changes: [] as DraftApplicationChange[] }

  const application: DraftApplication = {}
  const changes: DraftApplicationChange[] = []
  const formPatch: Partial<SnapshotForm> = {}
  const offerPatch: Partial<ReportOfferFields> = {}
  const normalizedWebsite = normalizeWebsiteUrl(input.intake.identity.websiteUrlRaw)

  function considerForm(
    key: keyof SnapshotForm,
    label: string,
    nextValue: SnapshotForm[keyof SnapshotForm],
  ) {
    if (typeof nextValue !== 'string' || !nextValue.trim()) return
    const currentValue = input.currentForm[key]
    if (typeof currentValue !== 'string') return
    if (currentValue.trim() === nextValue.trim()) return
    const protectedValue = input.protectExisting && hasValue(currentValue)
      && currentValue.trim() !== nextValue.trim()
    changes.push({ label, from: show(currentValue), to: nextValue.trim(), protected: protectedValue })
    if (!protectedValue && currentValue.trim() !== nextValue.trim()) {
      Object.assign(formPatch, { [key]: nextValue.trim() })
    }
  }

  considerForm('businessName', 'Business name', input.intake.identity.businessName)
  if (normalizedWebsite.valid) {
    considerForm('websiteUrl', 'Website URL', normalizedWebsite.normalized)
  }
  considerForm('city', 'City', input.intake.identity.city)
  considerForm('niche', 'Niche', input.intake.identity.niche)
  considerForm('mainService', 'Recommendation subject', draft.suggestedRecommendationSubject)
  considerForm('notes', 'Strength notes', draft.suggestedStrengthNotes.join(' '))
  considerForm('weakness', 'Missed opportunity', draft.suggestedMissedOpportunity)

  const competitorUrls = input.intake.competitorContext.competitors.map((competitor) => {
    const normalized = normalizeWebsiteUrl(competitor.url)
    return normalized.valid ? normalized.normalized : competitor.url.trim()
  })
  considerForm('competitorUrl1', 'Competitor URL 1', competitorUrls[0])
  considerForm('competitorUrl2', 'Competitor URL 2', competitorUrls[1])
  considerForm(
    'competitorNote',
    'Competitor context',
    input.intake.competitorContext.comparisonNotes
      || input.intake.competitorContext.competitors.map((item) => item.notes).filter(Boolean).join(' '),
  )

  const contactLine = [input.intake.identity.email, input.intake.identity.phone]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' · ')
  if (contactLine) {
    const protectedValue = input.protectExisting
      && hasValue(input.currentOffer.ctaContactLine)
      && input.currentOffer.ctaContactLine.trim() !== contactLine
    changes.push({
      label: 'CTA contact line',
      from: show(input.currentOffer.ctaContactLine),
      to: contactLine,
      protected: protectedValue,
    })
    if (!protectedValue && input.currentOffer.ctaContactLine.trim() !== contactLine) {
      offerPatch.ctaContactLine = contactLine
    }
  }
  if (input.intake.identity.bookingUrl.trim()) {
    const nextValue = input.intake.identity.bookingUrl.trim()
    const protectedValue = input.protectExisting
      && hasValue(input.currentOffer.bookingUrl)
      && input.currentOffer.bookingUrl.trim() !== nextValue
    changes.push({
      label: 'Booking URL',
      from: show(input.currentOffer.bookingUrl),
      to: nextValue,
      protected: protectedValue,
    })
    if (!protectedValue && input.currentOffer.bookingUrl.trim() !== nextValue) {
      offerPatch.bookingUrl = nextValue
    }
  }

  const nextStrengths = draft.suggestedStrategicAssets.map((asset) => asset.title.trim()).filter(Boolean)
  const strengthsProtected = input.protectExisting && input.currentStrengths.some(hasValue)
  if (nextStrengths.join('|') !== input.currentStrengths.join('|')) {
    changes.push({
      label: "What You're Already Winning",
      from: input.currentStrengths.join('; ') || 'Not set',
      to: nextStrengths.join('; ') || 'Not set',
      protected: strengthsProtected,
    })
    if (!strengthsProtected && nextStrengths.length > 0) application.strengths = nextStrengths
  }

  const nextOpportunity = draft.suggestedPrimaryOpportunity.trim()
  const opportunityProtected = input.protectExisting && input.currentVisibilityLeaks.some(hasValue)
  if (nextOpportunity !== input.currentVisibilityLeaks.join(' ').trim()) {
    changes.push({
      label: 'Primary opportunity context',
      from: input.currentVisibilityLeaks.join('; ') || 'Not set',
      to: nextOpportunity || 'Not set',
      protected: opportunityProtected,
    })
    if (!opportunityProtected && nextOpportunity) application.visibilityLeaks = [nextOpportunity]
  }

  if (input.allowOutreachAngle && draft.suggestedOutreachAngle.trim()) {
    const current = input.currentOutreachAngle?.trim() || ''
    const next = draft.suggestedOutreachAngle.trim()
    if (current !== next) {
      const protectedValue = Boolean(current)
      if (!protectedValue) application.outreachAngle = next
      changes.push({
        label: 'Lead outreach angle',
        from: current || 'Not set',
        to: next,
        protected: protectedValue,
      })
    }
  }

  if (input.includeScores) {
    application.scorePatch = scoreKeys.reduce<Partial<Scores>>((patch, key) => {
      const nextValue = getSuggestionMidpoint(draft.scoreSuggestions[key])
      if (nextValue === input.currentScores[key]) return patch
      patch[key] = nextValue
      changes.push({
        label: scoreLabels[key] + ' score',
        from: String(input.currentScores[key]),
        to: String(nextValue),
      })
      return patch
    }, {})
    if (Object.keys(application.scorePatch).length === 0) delete application.scorePatch
  } else {
    scoreKeys.forEach((key) => changes.push({
      label: scoreLabels[key] + ' score',
      from: String(input.currentScores[key]),
      to: 'Keep current score',
      protected: true,
    }))
  }

  if (Object.keys(formPatch).length > 0) application.formPatch = formPatch
  if (Object.keys(offerPatch).length > 0) application.reportOfferPatch = offerPatch
  return { application, changes }
}
