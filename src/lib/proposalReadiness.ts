import type { SavedSnapshot } from '../types'
import type { Proposal } from '../types/proposal'

export type ProposalReadiness = {
  state: 'Draft' | 'Needs details' | 'Ready to send'
  warnings: string[]
}

export function getProposalReadiness(
  proposal: Proposal,
  snapshot?: SavedSnapshot,
): ProposalReadiness {
  const warnings: string[] = []
  const actionIds = new Set(snapshot?.recommendedActions.map((action) => action.id) ?? [])
  const linkedActions = proposal.selectedActionIds.filter((id) => actionIds.has(id))
  const deliverableCount = linkedActions.length + proposal.customDeliverables.filter(
    (item) => item.title.trim() && item.description.trim(),
  ).length

  if (!proposal.clientBusinessName.trim()) warnings.push('Add the client business name.')
  if (!proposal.proposalTitle.trim()) warnings.push('Add a proposal title.')
  if (proposal.selectedActionIds.length === 0) warnings.push('Select at least one scope action.')
  if (deliverableCount === 0) warnings.push('Add at least one deliverable.')
  if (proposal.investmentMode === 'Fixed Price' && !(Number(proposal.fixedPrice) > 0)) {
    warnings.push('Enter a valid fixed price or choose another investment mode.')
  }
  if (proposal.investmentMode === 'Custom Estimate' && !proposal.customInvestmentText?.trim()) {
    warnings.push('Add custom estimate wording.')
  }
  if (!proposal.timeline.trim() || proposal.milestones.length === 0) warnings.push('Complete the timeline.')
  if (!proposal.contactLine.trim() && !proposal.bookingUrl?.trim()) warnings.push('Add a contact line or booking URL.')
  if (!proposal.ctaLabel.trim() || !proposal.nextStepBody.trim()) warnings.push('Complete the next-step CTA.')
  if (!proposal.snapshotContext.primaryService.trim()) warnings.push('Add the primary service fallback.')
  if (!snapshot) warnings.push('Linked Snapshot is no longer available.')
  if (snapshot && linkedActions.length !== proposal.selectedActionIds.length) {
    warnings.push('One or more linked actions are no longer available.')
  }

  return {
    state: warnings.length === 0
      ? 'Ready to send'
      : proposal.clientBusinessName.trim() && deliverableCount > 0
        ? 'Needs details'
        : 'Draft',
    warnings,
  }
}

