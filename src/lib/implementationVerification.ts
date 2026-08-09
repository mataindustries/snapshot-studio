import type {
  EvidenceItem,
  RecommendedAction,
  VerificationStatus,
} from '../types'
import { getEvidenceTiming } from './evidence.ts'

export const verificationStatusOptions: readonly VerificationStatus[] = [
  'Not verified',
  'Ready for review',
  'Verified',
  'Could not verify',
] as const

export type ActionVerificationPatch = Partial<Pick<
  RecommendedAction,
  | 'implementationNote'
  | 'completionDate'
  | 'verificationMethod'
  | 'verificationStatus'
  | 'outcomeNote'
>>

export type VerificationReadiness = {
  ready: boolean
  missing: string[]
  afterEvidence: EvidenceItem[]
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function normalizeVerificationStatus(value: unknown): VerificationStatus {
  return typeof value === 'string'
    && verificationStatusOptions.includes(value as VerificationStatus)
    ? value as VerificationStatus
    : 'Not verified'
}

export function normalizeCompletionDate(value: unknown) {
  return optionalText(value)
}

export function getLinkedAfterEvidence(
  action: RecommendedAction,
  evidenceItems: EvidenceItem[],
) {
  const linkedIds = new Set(action.linkedEvidenceIds)
  return evidenceItems.filter((item) =>
    getEvidenceTiming(item) === 'After'
    && (item.linkedActionIds.includes(action.id) || linkedIds.has(item.id)),
  )
}

export function isRelevantAfterEvidence(item: EvidenceItem) {
  return Boolean(item.observation.trim() || item.screenshotDataUrl)
}

export function getVerificationReadiness(
  action: RecommendedAction,
  evidenceItems: EvidenceItem[],
): VerificationReadiness {
  const afterEvidence = getLinkedAfterEvidence(action, evidenceItems)
    .filter(isRelevantAfterEvidence)
  const missing: string[] = []

  if (action.status !== 'Completed') missing.push('completed action status')
  if (!action.verificationMethod?.trim()) missing.push('verification method')
  if (afterEvidence.length === 0) missing.push('linked after-state observation or screenshot')

  return {
    ready: missing.length === 0,
    missing,
    afterEvidence,
  }
}

export function reconcileActionVerification(
  action: RecommendedAction,
  evidenceItems: EvidenceItem[],
): RecommendedAction {
  const verificationStatus = normalizeVerificationStatus(action.verificationStatus)
  if (verificationStatus !== 'Verified') {
    return { ...action, verificationStatus }
  }

  const readiness = getVerificationReadiness(action, evidenceItems)
  return readiness.ready
    ? { ...action, verificationStatus }
    : { ...action, verificationStatus: 'Ready for review' }
}

export function applyActionVerificationPatch(
  action: RecommendedAction,
  patch: ActionVerificationPatch,
  evidenceItems: EvidenceItem[],
): { action: RecommendedAction; error?: string } {
  const candidate: RecommendedAction = {
    ...action,
    ...patch,
    implementationNote: optionalText(
      patch.implementationNote === undefined
        ? action.implementationNote
        : patch.implementationNote,
    ),
    completionDate: normalizeCompletionDate(
      patch.completionDate === undefined ? action.completionDate : patch.completionDate,
    ),
    verificationMethod: optionalText(
      patch.verificationMethod === undefined
        ? action.verificationMethod
        : patch.verificationMethod,
    ),
    verificationStatus: normalizeVerificationStatus(
      patch.verificationStatus === undefined
        ? action.verificationStatus
        : patch.verificationStatus,
    ),
    outcomeNote: optionalText(
      patch.outcomeNote === undefined ? action.outcomeNote : patch.outcomeNote,
    ),
  }

  if (patch.verificationStatus === 'Verified') {
    const readiness = getVerificationReadiness(candidate, evidenceItems)
    if (!readiness.ready) {
      return {
        action: {
          ...candidate,
          verificationStatus: normalizeVerificationStatus(action.verificationStatus),
        },
        error: `Verified requires ${readiness.missing.join(', ')}.`,
      }
    }
  }

  return { action: reconcileActionVerification(candidate, evidenceItems) }
}
