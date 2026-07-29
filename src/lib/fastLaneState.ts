import type {
  FastLaneActivityEntry,
  FastLaneActivityType,
  FastLaneSession,
  FastLaneSource,
  FastLaneStep,
  SendKitBlockId,
} from '../types/fastLane'
import { leadToFastLaneDraft } from '../types/fastLane'
import type { Lead } from '../types'
import { leadStatuses } from './leads'
import { getDefaultFollowUpDate } from './sendKit'

const fastLaneStorageKey = 'snapshot-studio:fast-lane:v1'
const storageVersion = 1
const maximumSessions = 12
const maximumActivityEntries = 40
const activityTypes: FastLaneActivityType[] = [
  'Lead selected',
  'Lead saved',
  'Draft generated',
  'Draft applied',
  'Snapshot saved',
  'Proposal created',
  'Proposal saved',
  'Report copied',
  'Proposal copied',
  'Outreach marked sent',
  'Follow-up scheduled',
]
const sendKitBlockIds: SendKitBlockId[] = [
  'miniSnapshot',
  'reportEmail',
  'contactForm',
  'textMessage',
  'proposalEmail',
  'firstFollowUp',
  'phoneNotes',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
    : []
}

function stepValue(value: unknown): FastLaneStep {
  const step = typeof value === 'number' ? Math.round(value) : 1
  return Math.min(6, Math.max(1, step)) as FastLaneStep
}

function normalizeActivity(value: unknown): FastLaneActivityEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!isRecord(entry) || !activityTypes.includes(entry.type as FastLaneActivityType)) return []
    return [{
      id: stringValue(entry.id, crypto.randomUUID()),
      type: entry.type as FastLaneActivityType,
      occurredAt: stringValue(entry.occurredAt, new Date().toISOString()),
    }]
  }).slice(-maximumActivityEntries)
}

export function createFastLaneSession(
  source: FastLaneSource,
  lead?: Lead | null,
  associations: Partial<Pick<FastLaneSession, 'leadId' | 'intakeId' | 'snapshotId' | 'proposalId'>> = {},
): FastLaneSession {
  const now = new Date().toISOString()
  const activity = lead ? [createFastLaneActivity('Lead selected')] : []
  const selectedContactRoute = lead?.email.trim()
    ? 'Email'
    : lead?.contactFormUrl.trim()
      ? 'Contact Form'
      : lead?.phone.trim()
        ? 'Text'
        : undefined
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    status: 'active',
    sourceType: source.type,
    sourceId: source.id,
    isNewVersion: false,
    currentStep: 1,
    completedSteps: [],
    leadId: associations.leadId || (source.type === 'lead' ? source.id : undefined),
    intakeId: associations.intakeId || (source.type === 'intake' ? source.id : undefined),
    snapshotId: associations.snapshotId || (source.type === 'snapshot' ? source.id : undefined),
    proposalId: associations.proposalId,
    leadDraft: leadToFastLaneDraft(lead),
    evidenceIds: [],
    selectedContactRoute,
    followUpDate: getDefaultFollowUpDate(),
    noFollowUp: false,
    proposalSkipped: false,
    proposalIncluded: false,
    preliminarySnapshot: false,
    sendKitEdits: {},
    activity,
    createdAt: now,
    updatedAt: now,
  }
}

export function migrateFastLaneSession(value: unknown): FastLaneSession | null {
  if (!isRecord(value)) return null
  const fallback = createFastLaneSession({ type: 'blank' })
  const leadDraft = isRecord(value.leadDraft) ? value.leadDraft : {}
  const sendKitEdits = isRecord(value.sendKitEdits)
    ? Object.entries(value.sendKitEdits).reduce<Record<string, string>>((result, [key, item]) => {
        if (sendKitBlockIds.includes(key as SendKitBlockId) && typeof item === 'string') {
          result[key] = item
        }
        return result
      }, {})
    : {}
  const completedSteps = Array.isArray(value.completedSteps)
    ? Array.from(new Set(value.completedSteps.map(stepValue)))
    : []

  return {
    ...fallback,
    schemaVersion: 1,
    id: stringValue(value.id, fallback.id),
    status: value.status === 'completed' ? 'completed' : 'active',
    sourceType: ['lead', 'intake', 'snapshot', 'blank'].includes(String(value.sourceType))
      ? value.sourceType as FastLaneSession['sourceType']
      : 'blank',
    sourceId: optionalString(value.sourceId),
    isNewVersion: Boolean(value.isNewVersion),
    currentStep: stepValue(value.currentStep),
    completedSteps,
    leadId: optionalString(value.leadId),
    intakeId: optionalString(value.intakeId),
    snapshotId: optionalString(value.snapshotId),
    proposalId: optionalString(value.proposalId),
    leadDraft: {
      businessName: stringValue(leadDraft.businessName),
      websiteUrl: stringValue(leadDraft.websiteUrl),
      city: stringValue(leadDraft.city),
      niche: stringValue(leadDraft.niche),
      mainService: stringValue(leadDraft.mainService),
      email: stringValue(leadDraft.email),
      phone: stringValue(leadDraft.phone),
      contactFormUrl: stringValue(leadDraft.contactFormUrl),
      priority: ['High', 'Medium', 'Low'].includes(String(leadDraft.priority))
        ? leadDraft.priority as FastLaneSession['leadDraft']['priority']
        : 'Medium',
      status: leadStatuses.includes(leadDraft.status as FastLaneSession['leadDraft']['status'])
        ? leadDraft.status as FastLaneSession['leadDraft']['status']
        : 'Not reviewed',
    },
    evidenceIds: stringArray(value.evidenceIds),
    selectedContactRoute: ['Email', 'Contact Form', 'Text', 'Phone Notes']
      .includes(String(value.selectedContactRoute))
      ? value.selectedContactRoute as FastLaneSession['selectedContactRoute']
      : undefined,
    followUpDate: stringValue(value.followUpDate, getDefaultFollowUpDate()),
    noFollowUp: Boolean(value.noFollowUp),
    proposalSkipped: Boolean(value.proposalSkipped),
    proposalIncluded: Boolean(value.proposalIncluded),
    preliminarySnapshot: Boolean(value.preliminarySnapshot),
    sendKitEdits,
    activity: normalizeActivity(value.activity),
    createdAt: stringValue(value.createdAt, fallback.createdAt),
    updatedAt: stringValue(value.updatedAt, fallback.updatedAt),
    completedAt: optionalString(value.completedAt),
  }
}

function readSessions() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(fastLaneStorageKey) || 'null')
    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.sessions)
        ? parsed.sessions
        : []
    return values
      .map(migrateFastLaneSession)
      .filter((session): session is FastLaneSession => session !== null)
  } catch {
    return []
  }
}

function pruneSessions(sessions: FastLaneSession[]) {
  const ordered = [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  const active = ordered.filter((session) => session.status === 'active')
  const completed = ordered.filter((session) => session.status === 'completed')
  return [...active, ...completed].slice(0, maximumSessions)
}

function writeSessions(sessions: FastLaneSession[]) {
  const pruned = pruneSessions(sessions)
  localStorage.setItem(fastLaneStorageKey, JSON.stringify({
    version: storageVersion,
    sessions: pruned,
  }))
  return pruned
}

export function loadFastLaneSessions() {
  return readSessions()
}

export function getLatestFastLaneSession() {
  return readSessions().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
}

export function saveFastLaneSession(session: FastLaneSession) {
  const normalized = migrateFastLaneSession({
    ...session,
    updatedAt: new Date().toISOString(),
  })
  if (!normalized) return readSessions()
  return writeSessions([
    normalized,
    ...readSessions().filter((saved) => saved.id !== normalized.id),
  ])
}

export function discardFastLaneSession(sessionId: string) {
  return writeSessions(readSessions().filter((session) => session.id !== sessionId))
}

export function createFastLaneActivity(type: FastLaneActivityType): FastLaneActivityEntry {
  return { id: crypto.randomUUID(), type, occurredAt: new Date().toISOString() }
}

export function addFastLaneActivity(
  session: FastLaneSession,
  type: FastLaneActivityType,
) {
  return {
    ...session,
    activity: [...session.activity, createFastLaneActivity(type)].slice(-maximumActivityEntries),
  }
}
