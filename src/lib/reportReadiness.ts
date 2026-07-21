import type { ReportOfferFields, Scores, SnapshotForm } from '../types'
import {
  hasClientFacingValue,
  isGenericPlaceholder,
  isLikelyValidBookingUrl,
  isLikelyValidWebsiteUrl,
} from './reportDisplay'
import { getValidFixedPrice } from './reportOffer'

export type ReportReadinessState = 'Ready to share' | 'Needs details' | 'Preliminary snapshot'

export type ReportReadinessResult = {
  state: ReportReadinessState
  warnings: string[]
}

export function getReportReadiness(input: {
  form: SnapshotForm
  scores: Scores
  offer: ReportOfferFields
  reportEvidenceCount: number
}): ReportReadinessResult {
  const warnings: string[] = []

  if (!hasClientFacingValue(input.form.businessName)) warnings.push('Business name is missing.')
  if (!hasClientFacingValue(input.form.city)) warnings.push('City is missing.')
  if (!hasClientFacingValue(input.form.niche)) warnings.push('Niche is missing.')
  if (!hasClientFacingValue(input.form.mainService)) {
    warnings.push(
      hasClientFacingValue(input.form.niche)
        ? 'Primary service is missing; recommendations will use the niche.'
        : 'Primary service is missing; recommendations will use Local Business.',
    )
  }
  if (!isLikelyValidWebsiteUrl(input.form.websiteUrl)) warnings.push('Website URL appears malformed.')

  const placeholderFields = [
    input.form.businessName,
    input.form.city,
    input.form.niche,
    input.form.mainService,
  ].filter((value) => value.trim() && isGenericPlaceholder(value))
  if (placeholderFields.length > 0) warnings.push('Replace generic temporary text before sharing.')

  const validScores = Object.values(input.scores).every(
    (score) => Number.isFinite(score) && score >= 0 && score <= 20,
  )
  if (!validScores) warnings.push('Score data is incomplete or invalid.')

  if (input.offer.offerMode === 'Fixed Price' && getValidFixedPrice(input.offer.fixedPrice) === null) {
    warnings.push('Fixed Price mode needs a valid amount.')
  }
  if (!input.offer.ctaContactLine.trim() && !input.offer.bookingUrl.trim()) {
    warnings.push('No contact line or booking URL is configured.')
  }
  if (!isLikelyValidBookingUrl(input.offer.bookingUrl)) warnings.push('Booking URL appears malformed.')

  const noEvidence = input.reportEvidenceCount === 0
  if (noEvidence) warnings.push('No evidence is attached; this will export as a preliminary Snapshot.')

  const materialWarnings = warnings.filter(
    (warning) => !warning.startsWith('No evidence is attached'),
  )

  return {
    state: materialWarnings.length > 0
      ? 'Needs details'
      : noEvidence
        ? 'Preliminary snapshot'
        : 'Ready to share',
    warnings,
  }
}
