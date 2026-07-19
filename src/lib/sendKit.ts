import type { LeadContactRoute, SavedSnapshot, SnapshotOutputs } from '../types'
import type { Proposal } from '../types/proposal'
import type { SendKitBlockId } from '../types/fastLane'
import { createProposalEmail, createProposalFollowUp } from './proposalCopy'

export type SendKitBlock = {
  id: SendKitBlockId
  label: string
  text: string
  showCharacterCount?: boolean
}

export function getDefaultFollowUpDate(from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let businessDays = 0
  while (businessDays < 2) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) businessDays += 1
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function contactFormCopy(email: string) {
  return email
    .replace(/^Subject:[^\n]*\n+/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function phoneNotes(input: {
  businessName: string
  primaryService: string
  miniSnapshot: string
}) {
  return [
    `Call ${input.businessName || 'the business'} about the prepared Snapshot.`,
    input.primaryService ? `Lead with: ${input.primaryService}.` : '',
    `Offer to send the short review; do not imply the website was remotely scanned.`,
    input.miniSnapshot ? `Snapshot cue: ${input.miniSnapshot.split('\n')[0]}` : '',
  ].filter(Boolean).join('\n')
}

export function createSendKit(input: {
  outputs: SnapshotOutputs
  businessName: string
  primaryService: string
  proposal?: Proposal
  snapshot?: SavedSnapshot
}): SendKitBlock[] {
  const proposalCopy = input.proposal
    ? createProposalEmail(input.proposal, input.snapshot)
    : null
  return [
    { id: 'miniSnapshot', label: 'Mini Snapshot', text: input.outputs.shareable },
    { id: 'reportEmail', label: 'Report delivery email', text: input.outputs.email },
    {
      id: 'contactForm',
      label: 'Contact-form version',
      text: contactFormCopy(input.outputs.email),
      showCharacterCount: true,
    },
    { id: 'textMessage', label: 'Text message', text: input.outputs.text, showCharacterCount: true },
    ...(proposalCopy ? [{
      id: 'proposalEmail' as const,
      label: 'Proposal delivery email',
      text: `Subject: ${proposalCopy.subject}\n\n${proposalCopy.body}`,
    }] : []),
    {
      id: 'firstFollowUp',
      label: 'First follow-up',
      text: input.proposal
        ? createProposalFollowUp(input.proposal)
        : `Hi ${input.businessName || 'there'} — just checking that the Snapshot came through. I’m happy to point you to the first improvement I would prioritize.`,
    },
    {
      id: 'phoneNotes',
      label: 'Phone notes',
      text: phoneNotes({
        businessName: input.businessName,
        primaryService: input.primaryService,
        miniSnapshot: input.outputs.shareable,
      }),
    },
  ]
}

export function getBestOutreachBlock(
  blocks: SendKitBlock[],
  route?: LeadContactRoute,
) {
  const preferred: Record<LeadContactRoute, SendKitBlockId> = {
    Email: 'reportEmail',
    'Contact Form': 'contactForm',
    Text: 'textMessage',
    'Phone Notes': 'phoneNotes',
  }
  return blocks.find((block) => block.id === (route ? preferred[route] : 'reportEmail'))
    || blocks.find((block) => block.text.trim())
}
