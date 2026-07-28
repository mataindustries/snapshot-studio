import type { SnapshotForm } from '../types'

const genericPlaceholders = new Set([
  'business',
  'business name',
  'city',
  'industry',
  'niche',
  'service',
  'primary service',
  'main service',
  'website',
  'website url',
])

const displayAcronyms = new Map([
  ['ai', 'AI'],
  ['llc', 'LLC'],
  ['seo', 'SEO'],
  ['hvac', 'HVAC'],
  ['ac', 'AC'],
  ['usa', 'USA'],
])

export function isGenericPlaceholder(value: string) {
  return genericPlaceholders.has(value.trim().toLocaleLowerCase())
}

export function hasClientFacingValue(value: string) {
  return Boolean(value.trim()) && !isGenericPlaceholder(value)
}

export function formatReportDisplay(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''

  return trimmed
    .split(' ')
    .map((word) => {
      const parts = word.split(/([/-])/)
      return parts.map((part) => {
        if (part === '/' || part === '-') return part
        const lower = part.toLocaleLowerCase()
        const acronym = displayAcronyms.get(lower)
        if (acronym) return acronym
        if (/[a-z]/.test(part) && /[A-Z]/.test(part.slice(1))) return part
        return lower.charAt(0).toLocaleUpperCase() + lower.slice(1)
      }).join('')
    })
    .join(' ')
}

export function getRecommendationSubject(form: Pick<SnapshotForm, 'mainService' | 'niche'>) {
  if (hasClientFacingValue(form.mainService)) return formatReportDisplay(form.mainService)
  if (hasClientFacingValue(form.niche)) return formatReportDisplay(form.niche)
  return 'Primary service pending'
}

export const getDisplayService = getRecommendationSubject

export function getClientFacingCategoryLabel(
  form: Pick<SnapshotForm, 'mainService' | 'niche'>,
) {
  if (hasClientFacingValue(form.niche)) return formatReportDisplay(form.niche)
  if (hasClientFacingValue(form.mainService)) return formatReportDisplay(form.mainService)
  return 'Category pending'
}

export function getDisplayCity(form: Pick<SnapshotForm, 'city'>) {
  return hasClientFacingValue(form.city) ? formatReportDisplay(form.city) : 'Service area pending'
}

export function getDisplayBusinessName(form: Pick<SnapshotForm, 'businessName'>) {
  return hasClientFacingValue(form.businessName)
    ? formatReportDisplay(form.businessName)
    : 'Business name pending'
}

export function getMarketLabel(form: Pick<SnapshotForm, 'city' | 'mainService' | 'niche'>) {
  return getDisplayCity(form) + ' | ' + getClientFacingCategoryLabel(form)
}

export type AudienceNoun = {
  singular: 'patient' | 'homeowner' | 'customer'
  plural: 'patients' | 'homeowners' | 'customers'
}

export function getAudienceNoun(
  form: Pick<SnapshotForm, 'mainService' | 'niche'>,
): AudienceNoun {
  const signal = `${form.niche} ${form.mainService}`.toLocaleLowerCase()

  if (
    /\bdental\b|\bdentist\b|\borthodontist\b|\bmedical\b|\bclinic\b|\bmed spa\b|\bmedical spa\b/.test(signal)
  ) {
    return { singular: 'patient', plural: 'patients' }
  }
  if (
    /\bhvac\b|\bheating and air conditioning\b|\bcontractor\b|\bgeneral contractor\b|\bhome services\b|\bplumbing\b|\belectrician\b|\broofing\b|\blandscaping\b/.test(signal)
  ) {
    return { singular: 'homeowner', plural: 'homeowners' }
  }

  return { singular: 'customer', plural: 'customers' }
}

export function getCustomerAudience(
  form: Pick<SnapshotForm, 'mainService' | 'niche'>,
) {
  return getAudienceNoun(form).plural
}

export function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : value
}

export function firstCompleteSentence(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return ''

  const sentenceEnd = /[.!?](?=\s|$)/g
  let match = sentenceEnd.exec(normalized)
  while (match) {
    const candidate = normalized.slice(0, match.index + 1)
    if (!/\b(?:co|inc|corp|ltd|llc|dr|st|mr|ms|mrs)\.$/i.test(candidate)) {
      return candidate
    }
    match = sentenceEnd.exec(normalized)
  }
  return normalized
}

export function formatSentencePhrase(value: string) {
  return value.trim().split(' ').filter(Boolean).map((word) =>
    word.split(/([/-])/).map((part) => {
      if (part === '/' || part === '-') return part
      const acronym = displayAcronyms.get(part.toLocaleLowerCase())
      return acronym ?? part.toLocaleLowerCase()
    }).join(''),
  ).join(' ')
}

export function withIndefiniteArticle(value: string) {
  const phrase = formatSentencePhrase(value)
  const initialism = phrase.match(/^([A-Z]{2,})(?:[^A-Za-z]|$)/)?.[1] ?? ''
  const usesAn = /^[aeiou]/i.test(phrase) || /^[AEFHILMNORSX]/.test(initialism)
  return (usesAn ? 'an' : 'a') + ' ' + phrase
}

export type BusinessNameFitClass =
  | 'business-name-short'
  | 'business-name-medium'
  | 'business-name-long'
  | 'business-name-very-long'

export function getBusinessNameFitClass(value: string): BusinessNameFitClass {
  const length = value.trim().replace(/\s+/g, ' ').length
  if (length <= 24) return 'business-name-short'
  if (length <= 42) return 'business-name-medium'
  if (length <= 68) return 'business-name-long'
  return 'business-name-very-long'
}

export function isLikelyValidWebsiteUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed)
    return Boolean(url.hostname && (url.hostname.includes('.') || url.hostname === 'localhost'))
  } catch {
    return false
  }
}

export function isLikelyValidBookingUrl(value: string) {
  if (!value.trim()) return true
  return isLikelyValidWebsiteUrl(value)
}
