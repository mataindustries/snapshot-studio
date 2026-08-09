import type { SavedSnapshot, ScoreKey, SnapshotKind } from '../types'
import { createStableId } from './evidence.ts'
import { normalizeGrowthFoundation } from './growthPlanning.ts'
import { defaultReportOffer, normalizeOfferMode } from './reportOffer.ts'
import { normalizeScores } from './scoring.ts'

const storageKey = 'snapshot-studio:snapshots'
const storageVersion = 2
const scoreKeys: readonly ScoreKey[] = [
  'visibility',
  'trust',
  'conversion',
  'aiSearchReadiness',
  'competitorPosition',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function optionalString(value: unknown) {
  const result = stringValue(value).trim()
  return result || undefined
}

function normalizeReviewedScoreKeys(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter(
        (key): key is ScoreKey => scoreKeys.includes(key as ScoreKey),
      )))
    : []
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
  const requestedBaselineSnapshotId = optionalString(value.baselineSnapshotId)
  const snapshotKind: SnapshotKind = value.snapshotKind === 'Follow-up'
    && requestedBaselineSnapshotId
    && requestedBaselineSnapshotId !== snapshotId
    ? 'Follow-up'
    : 'Baseline'

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
    snapshotKind,
    baselineSnapshotId: snapshotKind === 'Follow-up'
      ? requestedBaselineSnapshotId
      : undefined,
    engagementProposalId: optionalString(value.engagementProposalId),
    reviewedScoreKeys: snapshotKind === 'Follow-up'
      ? normalizeReviewedScoreKeys(value.reviewedScoreKeys)
      : undefined,
    ...reportOffer,
    ...growthFoundation,
  }
}

function safelyParseSnapshots(value: string | null): SavedSnapshot[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    const snapshots = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.snapshots)
        ? parsed.snapshots
        : []
    return snapshots
      .map((snapshot, index) => migrateSnapshot(snapshot, index))
      .filter((snapshot): snapshot is SavedSnapshot => snapshot !== null)
  } catch {
    return []
  }
}

function persistSnapshots(snapshots: SavedSnapshot[]) {
  localStorage.setItem(storageKey, JSON.stringify({
    version: storageVersion,
    snapshots,
  }))
  return snapshots
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

  return persistSnapshots(nextSnapshots)
}

export function deleteSnapshot(snapshotId: string): SavedSnapshot[] {
  const nextSnapshots = loadSnapshots().filter((snapshot) => snapshot.id !== snapshotId)
  return persistSnapshots(nextSnapshots)
}
