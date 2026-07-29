import type { PilotCampaign, PilotIndustry } from './pilotCampaign'

export type RevenueEventType =
  | 'Sample viewed'
  | 'Sample downloaded'
  | 'Pilot CTA clicked'
  | 'Intake started'
  | 'Lead submitted'
  | 'Outreach marked sent'
  | 'Reply recorded'
  | 'Call booked'
  | 'Proposal sent'
  | 'Won'

export type RevenueEvent = {
  id: string
  type: RevenueEventType
  occurredAt: string
  campaign?: PilotCampaign
  industry?: PilotIndustry
}

const storageKey = 'snapshot-studio:revenue-events:v1'
const eventTypes = new Set<RevenueEventType>([
  'Sample viewed',
  'Sample downloaded',
  'Pilot CTA clicked',
  'Intake started',
  'Lead submitted',
  'Outreach marked sent',
  'Reply recorded',
  'Call booked',
  'Proposal sent',
  'Won',
])
const campaigns = new Set<PilotCampaign>([
  'founding-client', 'direct-outreach', 'referral', 'sample',
])
const industries = new Set<PilotIndustry>([
  'hvac', 'dental', 'med-spa', 'roofing', 'tree-service', 'general',
])
const maximumEvents = 250

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeRevenueEvent(value: unknown): RevenueEvent | null {
  if (!isRecord(value) || !eventTypes.has(value.type as RevenueEventType)) return null
  return {
    id: typeof value.id === 'string' && value.id ? value.id : crypto.randomUUID(),
    type: value.type as RevenueEventType,
    occurredAt: typeof value.occurredAt === 'string' && value.occurredAt
      ? value.occurredAt
      : new Date().toISOString(),
    campaign: campaigns.has(value.campaign as PilotCampaign)
      ? value.campaign as PilotCampaign
      : undefined,
    industry: industries.has(value.industry as PilotIndustry)
      ? value.industry as PilotIndustry
      : undefined,
  }
}

export function readRevenueEvents(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(storageKey) || 'null')
    const values = isRecord(parsed) && Array.isArray(parsed.events) ? parsed.events : []
    return values
      .map(normalizeRevenueEvent)
      .filter((event): event is RevenueEvent => event !== null)
      .slice(-maximumEvents)
  } catch {
    return []
  }
}

export function recordRevenueEvent(
  event: Omit<RevenueEvent, 'id' | 'occurredAt'> & Partial<Pick<RevenueEvent, 'occurredAt'>>,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
) {
  const normalized = normalizeRevenueEvent({
    ...event,
    id: crypto.randomUUID(),
    occurredAt: event.occurredAt || new Date().toISOString(),
  })
  if (!normalized) return null
  const events = [...readRevenueEvents(storage), normalized].slice(-maximumEvents)
  try {
    storage.setItem(storageKey, JSON.stringify({ version: 1, events }))
    return normalized
  } catch {
    return null
  }
}
