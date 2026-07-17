import type { OfferMode, ReportOfferFields } from '../types'
import { isLikelyValidBookingUrl } from './reportDisplay'

export const defaultReportOffer: ReportOfferFields = {
  offerMode: 'Conversation',
  fixedPrice: '',
  currency: 'USD',
  customInvestmentText: '',
  ctaHeadline: 'Ready to take the first step?',
  ctaBody: 'Reply to review the highest-priority improvement and confirm the 48-Hour Visibility Sprint scope.',
  ctaLabel: 'Review the sprint',
  ctaContactLine: '',
  bookingUrl: '',
}

const offerModes: readonly OfferMode[] = [
  'Conversation',
  'Fixed Price',
  'Custom Estimate',
  'Hide Pricing',
]

export function normalizeOfferMode(value: unknown): OfferMode {
  return typeof value === 'string' && offerModes.includes(value as OfferMode)
    ? value as OfferMode
    : defaultReportOffer.offerMode
}

export function getValidFixedPrice(value: string) {
  const amount = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function formatFixedPrice(value: string, currency: string) {
  const amount = getValidFixedPrice(value)
  if (amount === null) return ''

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.trim().toUpperCase() || 'USD',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)
  } catch {
    return '$' + amount.toLocaleString()
  }
}

export function getInvestmentLine(offer: ReportOfferFields) {
  if (offer.offerMode === 'Hide Pricing') return ''
  if (offer.offerMode === 'Conversation') return 'Reply to review the implementation scope.'
  if (offer.offerMode === 'Fixed Price') {
    const price = formatFixedPrice(offer.fixedPrice, offer.currency)
    return price ? 'Investment: ' + price : ''
  }

  const customText = offer.customInvestmentText.trim().replace(/^investment:s*/i, '')
  return 'Investment: ' + (customText || 'Custom estimate after evidence review.')
}

export function getSafeBookingUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed || !isLikelyValidBookingUrl(trimmed)) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed
}

export function formatOfferAndCtaText(offer: ReportOfferFields) {
  const investment = getInvestmentLine(offer)
  const contact = offer.ctaContactLine.trim()
  const bookingUrl = getSafeBookingUrl(offer.bookingUrl)
  const lines = [
    'Next Step',
    '',
    offer.ctaHeadline.trim() || defaultReportOffer.ctaHeadline,
    offer.ctaBody.trim() || defaultReportOffer.ctaBody,
    'Action: ' + (offer.ctaLabel.trim() || defaultReportOffer.ctaLabel),
  ]
  if (contact) lines.push('Contact: ' + contact)
  if (bookingUrl) lines.push('Booking: ' + bookingUrl)
  if (investment) lines.push(investment)
  return lines.join('\n')
}
