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
  return 'Local Business'
}

export const getDisplayService = getRecommendationSubject

export function getClientFacingCategoryLabel(
  form: Pick<SnapshotForm, 'mainService' | 'niche'>,
) {
  return getRecommendationSubject(form)
}

export function getDisplayCity(form: Pick<SnapshotForm, 'city'>) {
  return hasClientFacingValue(form.city) ? formatReportDisplay(form.city) : 'Local Area'
}

export function getDisplayBusinessName(form: Pick<SnapshotForm, 'businessName'>) {
  return hasClientFacingValue(form.businessName)
    ? formatReportDisplay(form.businessName)
    : 'Local Business'
}

export function getMarketLabel(form: Pick<SnapshotForm, 'city' | 'mainService' | 'niche'>) {
  return getDisplayCity(form) + ' | ' + getClientFacingCategoryLabel(form)
}

export function getCustomerAudience(
  form: Pick<SnapshotForm, 'mainService' | 'niche'>,
) {
  const signal = `${form.niche} ${form.mainService}`.toLocaleLowerCase()

  if (/dental|dentist|orthodont|periodont|endodont|implant|veneers|teeth/.test(signal)) {
    return 'patients'
  }
  if (/attorney|lawyer|legal|law firm/.test(signal)) return 'potential clients'
  if (/plumb|hvac|heating|air condition|electric|roof|remodel|landscap|pest/.test(signal)) {
    return 'homeowners'
  }
  if (/medical|clinic|therapy|therapist|chiropract|optometr|health/.test(signal)) {
    return 'patients'
  }
  if (/restaurant|cafe|bakery|catering/.test(signal)) return 'local diners'
  if (/real estate|realtor|mortgage/.test(signal)) return 'local buyers and sellers'

  return 'prospective customers'
}

export function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : value
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
