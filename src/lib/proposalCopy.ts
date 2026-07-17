import type { SavedSnapshot } from '../types'
import type { Proposal } from '../types/proposal'

function opportunitySentence(proposal: Proposal) {
  return proposal.snapshotContext.biggestOpportunityTitle.trim()
    ? `The Snapshot identified ${proposal.snapshotContext.biggestOpportunityTitle.trim().toLowerCase()} as the highest-priority opportunity.`
    : 'The Snapshot identified a focused opportunity to make the business easier to understand, trust, and contact.'
}

export function createProposalEmail(proposal: Proposal, snapshot?: SavedSnapshot) {
  const actionCount = proposal.selectedActionIds.filter((id) =>
    snapshot?.recommendedActions.some((action) => action.id === id),
  ).length
  const deliverableCount = actionCount + proposal.customDeliverables.length
  const subject = `${proposal.proposalType} proposal for ${proposal.clientBusinessName || 'your business'}`
  const greeting = proposal.clientContactName?.trim()
    ? `Hi ${proposal.clientContactName.trim()},`
    : 'Hi,'
  const body = `${greeting}

Thank you for reviewing the Snapshot. ${opportunitySentence(proposal)}

I’ve prepared a concise ${proposal.proposalType} proposal with ${deliverableCount || 'the selected'} focused deliverables, the implementation timeline, investment details where applicable, and the practical next step.

Please review the scope and reply with your preferred start window or any questions. ${proposal.bookingUrl?.trim() ? `You can also use ${proposal.bookingUrl.trim()}.` : ''}

${proposal.preparedBy || proposal.brandName}`

  return { subject, body }
}

export function createProposalFollowUp(proposal: Proposal) {
  return `Hi${proposal.clientContactName?.trim() ? ` ${proposal.clientContactName.trim()}` : ''} — just checking that the ${proposal.proposalType} proposal for ${proposal.clientBusinessName || 'your business'} reached you. I’m happy to clarify the scope or start window; there’s no pressure, and a quick yes/no update is helpful.`
}

