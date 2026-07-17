import type { SavedSnapshot } from '../types'
import { createStableId } from './evidence'
import { normalizeGrowthFoundation } from './growthPlanning'
import { defaultReportOffer, normalizeOfferMode } from './reportOffer'
import { normalizeScores } from './scoring'

const storageKey = 'snapshot-studio:snapshots'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeOutputs(value: unknown): SavedSnapshot['outputs'] {
  const outputs = isRecord(value) ? value : {}
  return {
    snapshot: stringValue(outputs.snapshot),
    email: stringValue(outputs.email),
    text: stringValue(outputs.text),
    shareable: stringValue(outputs.shareable),
    upsell: stringValue(outputs.upsell),
  }
}

function normalizeBranding(value: unknown): SavedSnapshot['branding'] {
  if (!isRecord(value)) return undefined
  return {
    preparedBy: stringValue(value.preparedBy),
    brandName: stringValue(value.brandName),
    contactLine: stringValue(value.contactLine),
  }
}

function normalizeReportOffer(
  value: Record<string, unknown>,
  branding: SavedSnapshot['branding'],
) {
  const fixedPrice = typeof value.fixedPrice === 'number' && Number.isFinite(value.fixedPrice)
    ? value.fixedPrice.toString()
    : stringValue(value.fixedPrice)

  return {
    offerMode: normalizeOfferMode(value.offerMode),
    fixedPrice,
    currency: stringValue(value.currency, defaultReportOffer.currency),
    customInvestmentText: stringValue(value.customInvestmentText),
    ctaHeadline: stringValue(value.ctaHeadline, defaultReportOffer.ctaHeadline),
    ctaBody: stringValue(value.ctaBody, defaultReportOffer.ctaBody),
    ctaLabel: stringValue(value.ctaLabel, defaultReportOffer.ctaLabel),
    ctaContactLine: stringValue(value.ctaContactLine, branding?.contactLine || ''),
    bookingUrl: stringValue(value.bookingUrl),
  }
}

export function migrateSnapshot(value: unknown, index = 0): SavedSnapshot | null {
  if (!isRecord(value)) return null

  const createdAt = stringValue(value.createdAt, new Date(0).toISOString())
  const snapshotId = stringValue(
    value.id,
    createStableId('snapshot', [
      stringValue(value.businessName),
      stringValue(value.websiteUrl),
      createdAt,
      index,
    ]),
  )
  const scores = normalizeScores(
    isRecord(value.scores) ? value.scores as Partial<SavedSnapshot['scores']> : undefined,
  )
  const growthFoundation = normalizeGrowthFoundation(value, scores)
  const tone = ['fun', 'professional', 'spicy', 'premium', 'friendly', 'expert', 'blunt'].includes(
    stringValue(value.tone),
  )
    ? value.tone as SavedSnapshot['tone']
    : 'fun'
  const ctaStyle = ['ask-permission', 'send-snapshot', 'book-call'].includes(
    stringValue(value.ctaStyle),
  )
    ? value.ctaStyle as SavedSnapshot['ctaStyle']
    : 'ask-permission'
  const branding = normalizeBranding(value.branding)
  const reportOffer = normalizeReportOffer(value, branding)

  return {
    ...value,
    id: snapshotId,
    createdAt,
    businessName: stringValue(value.businessName),
    websiteUrl: stringValue(value.websiteUrl),
    city: stringValue(value.city),
    niche: stringValue(value.niche),
    mainService: stringValue(value.mainService),
    notes: stringValue(value.notes),
    weakness: stringValue(value.weakness),
    competitorNote: stringValue(value.competitorNote),
    competitorUrl1: stringValue(value.competitorUrl1),
    competitorUrl2: stringValue(value.competitorUrl2),
    tone,
    ctaStyle,
    scores,
    outputs: normalizeOutputs(value.outputs),
    branding,
    ...reportOffer,
    ...growthFoundation,
  }
}

function safelyParseSnapshots(value: string | null): SavedSnapshot[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed
          .map((snapshot, index) => migrateSnapshot(snapshot, index))
          .filter((snapshot): snapshot is SavedSnapshot => snapshot !== null)
      : []
  } catch {
    return []
  }
}

export function loadSnapshots(): SavedSnapshot[] {
  try {
    return safelyParseSnapshots(localStorage.getItem(storageKey))
  } catch {
    return []
  }
}

export function isStorageQuotaError(error: unknown) {
  if (!(error instanceof DOMException)) return false
  return error.name === 'QuotaExceededError'
    || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error.code === 22
    || error.code === 1014
}

export function saveSnapshot(snapshot: SavedSnapshot): SavedSnapshot[] {
  const normalizedSnapshot = migrateSnapshot(snapshot)
  if (!normalizedSnapshot) return loadSnapshots()

  const snapshots = loadSnapshots()
  const nextSnapshots = [
    normalizedSnapshot,
    ...snapshots.filter((saved) => saved.id !== normalizedSnapshot.id),
  ]

  localStorage.setItem(storageKey, JSON.stringify(nextSnapshots))
  return nextSnapshots
}

export function deleteSnapshot(snapshotId: string): SavedSnapshot[] {
  const nextSnapshots = loadSnapshots().filter((snapshot) => snapshot.id !== snapshotId)
  localStorage.setItem(storageKey, JSON.stringify(nextSnapshots))
  return nextSnapshots
}
