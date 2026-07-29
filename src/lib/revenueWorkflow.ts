import type {
  Lead,
  LeadActivityEntry,
  LeadContactRoute,
  LeadPriority,
  LeadStatus,
} from '../types'
import type { Proposal } from '../types/proposal'
import { isValidContactEmail, isValidHttpUrl } from './reportConfig.ts'

export type RevenueContactAction = {
  kind: 'email' | 'call' | 'website' | 'contact-form'
  label: string
  href: string
}

export type RevenueActionKind =
  | 'Research'
  | 'First outreach'
  | 'Follow up'
  | 'Reply'
  | 'Call prep'
  | 'Proposal follow-up'

export type RevenueAction = {
  id: string
  leadId: string
  businessName: string
  kind: RevenueActionKind
  title: string
  reason: string
  dueDate?: string
  isOverdue: boolean
  priority: LeadPriority
  contactActions: RevenueContactAction[]
  score: number
}

export type RevenueFunnelSnapshot = {
  researched: number
  contacted: number
  replied: number
  calls: number
  proposals: number
  won: number
}

export type LeadProgressUpdate = {
  status: LeadStatus
  occurredAt?: string
  nextFollowUpDate?: string
  contactRoute?: LeadContactRoute
  includedSnapshot?: boolean
  includedProposal?: boolean
}

const terminalStatuses = new Set<LeadStatus>([
  'Won',
  'Lost',
  'Paid',
  'Not interested',
])

const priorityWeight: Record<LeadPriority, number> = {
  High: 30,
  Medium: 20,
  Low: 10,
}

function localDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addBusinessDays(from: Date, count: number) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let remaining = Math.max(0, Math.round(count))
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) remaining -= 1
  }
  return localDateString(date)
}

export function getRevenueFollowUpDefaults(from = new Date()) {
  return {
    first: addBusinessDays(from, 2),
    second: addBusinessDays(from, 5),
  }
}

export function phoneHref(value: string) {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return ''
  const prefix = trimmed.startsWith('+') ? '+' : ''
  return `tel:${prefix}${digits}`
}

export function getRevenueContactActions(lead: Lead): RevenueContactAction[] {
  const actions: RevenueContactAction[] = []
  if (isValidContactEmail(lead.email)) {
    actions.push({ kind: 'email', label: 'Email', href: `mailto:${lead.email.trim()}` })
  }
  const callHref = phoneHref(lead.phone)
  if (callHref) actions.push({ kind: 'call', label: 'Call', href: callHref })
  if (isValidHttpUrl(lead.contactFormUrl)) {
    actions.push({
      kind: 'contact-form',
      label: 'Contact form',
      href: lead.contactFormUrl.trim(),
    })
  }
  if (isValidHttpUrl(lead.websiteUrl)) {
    actions.push({ kind: 'website', label: 'Website', href: lead.websiteUrl.trim() })
  }
  return actions
}

export function getLeadPipelineLabel(lead: Lead, proposal?: Proposal) {
  if (lead.status === 'Paid' || lead.status === 'Won') return 'Won'
  if (lead.status === 'Not interested' || lead.status === 'Lost') return 'Lost'
  if (lead.status === 'Not now') return 'Not now'
  if (lead.status === 'Proposal sent' || proposal?.proposalStatus === 'Sent') {
    return 'Proposal sent'
  }
  if (lead.status === 'Call booked') return 'Call booked'
  if (lead.status === 'Replied') return 'Replied'
  if (lead.status === 'Sent') return 'Contacted'
  if (lead.status === 'Snapshot made') return 'Ready to contact'
  return 'Research'
}

function proposalForLead(lead: Lead, proposals: Proposal[]) {
  return proposals
    .filter((proposal) => proposal.leadId === lead.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
}

function dueWeight(dueDate: string | undefined, today: string) {
  if (!dueDate) return { score: 0, isOverdue: false }
  if (dueDate < today) return { score: 180, isOverdue: true }
  if (dueDate === today) return { score: 140, isOverdue: false }
  return { score: -40, isOverdue: false }
}

function actionForLead(lead: Lead, proposal: Proposal | undefined, today: string): RevenueAction | null {
  if (terminalStatuses.has(lead.status)) return null
  const due = dueWeight(lead.nextFollowUpDate, today)
  const contactActions = getRevenueContactActions(lead)
  const businessName = lead.businessName.trim() || 'Untitled prospect'
  const common = {
    id: `revenue-action:${lead.id}`,
    leadId: lead.id,
    businessName,
    dueDate: lead.nextFollowUpDate || undefined,
    isOverdue: due.isOverdue,
    priority: lead.priority,
    contactActions,
  }

  if (lead.status === 'Not now') {
    return {
      ...common,
      kind: 'Follow up',
      title: `Revisit ${businessName}`,
      reason: lead.nextFollowUpDate
        ? 'The conversation is paused until the operator-selected revisit date.'
        : 'The conversation is paused, but no revisit date is recorded.',
      score: 320 + due.score + priorityWeight[lead.priority],
    }
  }

  if (lead.status === 'Call booked') {
    return {
      ...common,
      kind: 'Call prep',
      title: `Prepare the discovery call for ${businessName}`,
      reason: 'A call is booked. Review evidence, define the decision, and confirm the pilot fit.',
      score: 900 + due.score + priorityWeight[lead.priority],
    }
  }
  if (lead.status === 'Replied') {
    return {
      ...common,
      kind: 'Reply',
      title: `Respond to ${businessName}`,
      reason: 'A reply is recorded. Move the conversation toward a focused 15-minute discovery call.',
      score: 850 + due.score + priorityWeight[lead.priority],
    }
  }
  if (lead.status === 'Proposal sent' || proposal?.proposalStatus === 'Sent') {
    return {
      ...common,
      kind: 'Proposal follow-up',
      title: `Follow up on the proposal for ${businessName}`,
      reason: lead.nextFollowUpDate
        ? 'The proposal is out and the next follow-up is scheduled.'
        : 'The proposal is out, but no next follow-up is recorded.',
      score: 780 + due.score + priorityWeight[lead.priority],
    }
  }
  if (lead.status === 'Sent') {
    return {
      ...common,
      kind: 'Follow up',
      title: `Follow up with ${businessName}`,
      reason: lead.nextFollowUpDate
        ? 'Initial outreach is recorded. Use the scheduled follow-up instead of restarting the pitch.'
        : 'Initial outreach is recorded, but the next action has not been scheduled.',
      score: 700 + due.score + priorityWeight[lead.priority],
    }
  }
  if (lead.status === 'Snapshot made') {
    return {
      ...common,
      kind: 'First outreach',
      title: `Send the reviewed Snapshot to ${businessName}`,
      reason: contactActions.length > 0
        ? 'The Snapshot is ready and a valid recorded contact route is available.'
        : 'The Snapshot is ready, but a valid contact route still needs to be recorded.',
      score: 600 + priorityWeight[lead.priority],
    }
  }
  return {
    ...common,
    kind: 'Research',
    title: `Finish the contact brief for ${businessName}`,
    reason: contactActions.length > 0
      ? 'Confirm one source-backed reason to contact before personalizing outreach.'
      : 'Record a valid contact route and one source-backed reason to contact.',
    score: 400 + priorityWeight[lead.priority],
  }
}

export function buildTodaysRevenueActions(input: {
  leads: Lead[]
  proposals: Proposal[]
  now?: Date
  limit?: number
}) {
  const today = localDateString(input.now ?? new Date())
  const limit = Math.max(1, Math.min(10, input.limit ?? 10))
  return input.leads
    .map((lead) => actionForLead(lead, proposalForLead(lead, input.proposals), today))
    .filter((action): action is RevenueAction => action !== null)
    .sort((left, right) => right.score - left.score
      || (left.dueDate || '9999').localeCompare(right.dueDate || '9999')
      || left.businessName.localeCompare(right.businessName))
    .slice(0, limit)
}

export function createRevenueFunnelSnapshot(leads: Lead[], proposals: Proposal[]): RevenueFunnelSnapshot {
  return {
    researched: leads.filter((lead) => lead.status !== 'Not reviewed').length,
    contacted: leads.filter((lead) => [
      'Sent', 'Replied', 'Call booked', 'Proposal sent', 'Won', 'Lost', 'Not now',
      'Paid', 'Not interested',
    ].includes(lead.status)).length,
    replied: leads.filter((lead) => [
      'Replied', 'Call booked', 'Proposal sent', 'Won', 'Paid',
    ].includes(lead.status)).length,
    calls: leads.filter((lead) => [
      'Call booked', 'Proposal sent', 'Won', 'Paid',
    ].includes(lead.status)).length,
    proposals: proposals.filter((proposal) => [
      'Sent', 'Viewed', 'Accepted', 'Declined',
    ].includes(proposal.proposalStatus)).length,
    won: leads.filter((lead) => lead.status === 'Won' || lead.status === 'Paid').length,
  }
}

function activityTypeForStatus(status: LeadStatus): LeadActivityEntry['type'] {
  if (status === 'Sent') return 'Outreach sent'
  if (status === 'Replied') return 'Reply recorded'
  if (status === 'Call booked') return 'Call booked'
  if (status === 'Proposal sent') return 'Proposal sent'
  if (status === 'Won' || status === 'Paid') return 'Won'
  if (status === 'Lost' || status === 'Not interested') return 'Lost'
  if (status === 'Not now') return 'Not now'
  return 'Status changed'
}

export function applyLeadProgressUpdate(lead: Lead, update: LeadProgressUpdate): Lead {
  const occurredAt = update.occurredAt || new Date().toISOString()
  const nextFollowUpDate = terminalStatuses.has(update.status)
    ? ''
    : update.nextFollowUpDate ?? lead.nextFollowUpDate ?? ''
  const activity: LeadActivityEntry = {
    id: crypto.randomUUID(),
    type: activityTypeForStatus(update.status),
    occurredAt,
    contactRoute: update.contactRoute,
    followUpDate: nextFollowUpDate || undefined,
    includedSnapshot: update.includedSnapshot,
    includedProposal: update.includedProposal,
    previousStatus: lead.status,
    newStatus: update.status,
  }
  const followUpActivity: LeadActivityEntry[] = nextFollowUpDate
    && nextFollowUpDate !== lead.nextFollowUpDate
    ? [{
        id: crypto.randomUUID(),
        type: 'Follow-up scheduled',
        occurredAt,
        contactRoute: update.contactRoute,
        followUpDate: nextFollowUpDate,
        previousStatus: lead.status,
        newStatus: update.status,
      }]
    : []
  return {
    ...lead,
    status: update.status,
    lastContactedAt: update.status === 'Sent' ? occurredAt : lead.lastContactedAt,
    lastContactRoute: update.contactRoute ?? lead.lastContactRoute,
    nextFollowUpDate,
    outreachActivity: [
      ...(lead.outreachActivity || []),
      activity,
      ...followUpActivity,
    ].slice(-50),
  }
}
