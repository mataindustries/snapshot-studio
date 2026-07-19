import type {
  Lead,
  LeadContactRoute,
  LeadPriority,
  LeadStatus,
} from '../types'

export const fastLaneSteps = [
  'Lead',
  'Research',
  'Draft',
  'Snapshot',
  'Proposal',
  'Send Kit',
] as const

export type FastLaneStep = 1 | 2 | 3 | 4 | 5 | 6
export type FastLaneStepTitle = typeof fastLaneSteps[number]
export type FastLaneSourceType = 'lead' | 'intake' | 'snapshot' | 'blank'
export type FastLaneSessionStatus = 'active' | 'completed'
export type FastLaneReadinessState = 'Ready' | 'Needs review' | 'Optional' | 'Blocked'

export type FastLaneActivityType =
  | 'Lead selected'
  | 'Lead saved'
  | 'Draft generated'
  | 'Draft applied'
  | 'Snapshot saved'
  | 'Proposal created'
  | 'Proposal saved'
  | 'Report copied'
  | 'Proposal copied'
  | 'Outreach marked sent'
  | 'Follow-up scheduled'

export type FastLaneActivityEntry = {
  id: string
  type: FastLaneActivityType
  occurredAt: string
}

export type FastLaneLeadDraft = Pick<Lead,
  | 'businessName'
  | 'websiteUrl'
  | 'city'
  | 'niche'
  | 'mainService'
  | 'email'
  | 'phone'
  | 'contactFormUrl'
> & {
  priority: LeadPriority
  status: LeadStatus
}

export type SendKitBlockId =
  | 'miniSnapshot'
  | 'reportEmail'
  | 'contactForm'
  | 'textMessage'
  | 'proposalEmail'
  | 'firstFollowUp'
  | 'phoneNotes'

export type FastLaneSession = {
  schemaVersion: 1
  id: string
  status: FastLaneSessionStatus
  sourceType: FastLaneSourceType
  sourceId?: string
  isNewVersion: boolean
  currentStep: FastLaneStep
  completedSteps: FastLaneStep[]
  leadId?: string
  intakeId?: string
  snapshotId?: string
  proposalId?: string
  leadDraft: FastLaneLeadDraft
  evidenceIds: string[]
  selectedContactRoute?: LeadContactRoute
  followUpDate: string
  noFollowUp: boolean
  proposalSkipped: boolean
  proposalIncluded: boolean
  preliminarySnapshot: boolean
  sendKitEdits: Partial<Record<SendKitBlockId, string>>
  activity: FastLaneActivityEntry[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type FastLaneSource = {
  type: FastLaneSourceType
  id?: string
}

export function leadToFastLaneDraft(lead?: Lead | null): FastLaneLeadDraft {
  return {
    businessName: lead?.businessName || '',
    websiteUrl: lead?.websiteUrl || '',
    city: lead?.city || '',
    niche: lead?.niche || '',
    mainService: lead?.mainService || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    contactFormUrl: lead?.contactFormUrl || '',
    priority: lead?.priority || 'Medium',
    status: lead?.status || 'Not reviewed',
  }
}
