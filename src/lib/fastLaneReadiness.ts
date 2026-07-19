import type { LeadContactRoute } from '../types'
import type {
  FastLaneLeadDraft,
  FastLaneReadinessState,
  FastLaneStep,
} from '../types/fastLane'

export type FastLaneStepReadiness = {
  step: FastLaneStep
  state: FastLaneReadinessState
  label: string
  warnings: string[]
}

export function getAvailableContactRoutes(lead: FastLaneLeadDraft): LeadContactRoute[] {
  const routes: LeadContactRoute[] = []
  if (lead.email.trim()) routes.push('Email')
  if (lead.contactFormUrl.trim()) routes.push('Contact Form')
  if (lead.phone.trim()) routes.push('Text', 'Phone Notes')
  return routes
}

export function getLeadReadiness(lead: FastLaneLeadDraft) {
  const missingEssentials = [
    !lead.businessName.trim() ? 'business name' : '',
    !lead.city.trim() ? 'city' : '',
    !lead.niche.trim() ? 'niche' : '',
    !lead.mainService.trim() ? 'primary service' : '',
  ].filter(Boolean)
  const contactRoutes = getAvailableContactRoutes(lead)

  if (contactRoutes.length === 0) {
    return {
      label: 'Contact route missing' as const,
      state: 'Blocked' as const,
      warnings: ['Add an email, contact-form URL, or phone number before Send Kit.'],
      contactRoutes,
    }
  }
  if (!lead.businessName.trim() || missingEssentials.length > 0) {
    return {
      label: 'Missing essentials' as const,
      state: 'Needs review' as const,
      warnings: missingEssentials.length > 0
        ? ['Still useful to add: ' + missingEssentials.join(', ') + '.']
        : [],
      contactRoutes,
    }
  }
  return {
    label: 'Ready' as const,
    state: 'Ready' as const,
    warnings: [],
    contactRoutes,
  }
}

export function getFastLaneStepReadiness(input: {
  lead: FastLaneLeadDraft
  hasResearch: boolean
  hasDraft: boolean
  hasSnapshot: boolean
  hasProposal: boolean
  proposalSkipped: boolean
  hasOutreach: boolean
}): FastLaneStepReadiness[] {
  const lead = getLeadReadiness(input.lead)
  return [
    { step: 1, state: lead.state, label: lead.label, warnings: lead.warnings },
    {
      step: 2,
      state: input.hasResearch ? 'Ready' : 'Optional',
      label: input.hasResearch ? 'Ready' : 'Optional',
      warnings: input.hasResearch ? [] : ['Outreach will be labeled preliminary without research.'],
    },
    {
      step: 3,
      state: input.hasDraft ? 'Ready' : 'Needs review',
      label: input.hasDraft ? 'Ready' : 'Needs review',
      warnings: input.hasDraft ? [] : ['Generate or review the deterministic draft.'],
    },
    {
      step: 4,
      state: input.hasSnapshot ? 'Ready' : 'Blocked',
      label: input.hasSnapshot ? 'Ready' : 'Blocked',
      warnings: input.hasSnapshot ? [] : ['Save a Snapshot or explicitly continue with a preliminary Snapshot.'],
    },
    {
      step: 5,
      state: input.hasProposal ? 'Ready' : input.proposalSkipped ? 'Optional' : 'Needs review',
      label: input.hasProposal ? 'Ready' : input.proposalSkipped ? 'Optional' : 'Needs review',
      warnings: input.hasProposal || input.proposalSkipped ? [] : ['Create a proposal or choose Skip proposal.'],
    },
    {
      step: 6,
      state: input.lead.businessName.trim() && lead.contactRoutes.length && input.hasSnapshot && input.hasOutreach
        ? 'Ready'
        : 'Blocked',
      label: input.lead.businessName.trim() && lead.contactRoutes.length && input.hasSnapshot && input.hasOutreach
        ? 'Ready'
        : 'Blocked',
      warnings: [
        !input.lead.businessName.trim() ? 'Business name is required.' : '',
        lead.contactRoutes.length === 0 ? 'One contact route is required.' : '',
        !input.hasSnapshot ? 'A saved or explicit preliminary Snapshot is required.' : '',
        !input.hasOutreach ? 'At least one outreach message is required.' : '',
      ].filter(Boolean),
    },
  ]
}
