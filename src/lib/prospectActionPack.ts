import type { EvidenceItem, Lead, SavedSnapshot } from '../types'
import type { Proposal } from '../types/proposal'
import type { PilotSample } from './pilotCampaign'
import { getNextMilestone } from './actionProgress.ts'
import { isEvidenceReportReady } from './evidence.ts'
import { getBestSampleManual } from './pilotCampaign.ts'
import { isValidHttpUrl } from './reportConfig.ts'

export type SourceLinkedEvidence = {
  id: string
  title: string
  observation: string
  sourceLabel: string
  sourceUrl: string
}

export type ProspectActionPackModel = {
  businessName: string
  missingInformation: string[]
  contactRationale: string
  verifiedEvidence: SourceLinkedEvidence[]
  evidenceNotice: string
  sample: PilotSample
  outreachAngle: string
  emailSubject: string
  firstEmail: string
  followUpEmail: string
  linkedInMessage: string
  voicemail: string
  callOpener: string
  discoveryCall: string[]
  proposalStarter: {
    title: string
    investment: string
    includes: string[]
    excludes: string[]
    distinction: string
  }
  nextRecommendedAction: string
  operatorNote?: string
}

export function getSourceLinkedEvidence(evidenceItems: EvidenceItem[]) {
  return evidenceItems
    .filter((item) => isEvidenceReportReady(item) && isValidHttpUrl(item.sourceUrl))
    .map((item) => ({
      id: item.id,
      title: item.title.trim(),
      observation: item.observation.trim(),
      sourceLabel: item.pageLabel.trim() || item.evidenceType,
      sourceUrl: item.sourceUrl.trim(),
    }))
}

function missingProspectInformation(lead: Lead) {
  const fields: string[] = []
  if (!lead.businessName.trim()) fields.push('business name')
  if (!lead.niche.trim()) fields.push('category')
  if (!lead.city.trim()) fields.push('city or market')
  if (!lead.mainService.trim()) fields.push('primary service')
  return fields
}

function businessIdentity(lead: Lead) {
  const businessName = lead.businessName.trim() || 'your business'
  const category = lead.niche.trim() || 'local-business'
  const service = lead.mainService.trim()
  const city = lead.city.trim()
  const serviceContext = service && city
    ? `${service} in ${city}`
    : service || (city ? `${category} in ${city}` : category)
  return { businessName, category, serviceContext }
}

function conservativeNextAction(lead: Lead, snapshot?: SavedSnapshot, proposal?: Proposal) {
  if (lead.status === 'Won' || lead.status === 'Paid') return 'Confirm kickoff and record the agreed pilot scope.'
  if (lead.status === 'Lost' || lead.status === 'Not interested') return 'No action. Keep the outcome recorded.'
  if (lead.status === 'Not now') return 'Wait until the operator-selected follow-up date.'
  if (lead.status === 'Proposal sent' || proposal?.proposalStatus === 'Sent') {
    return 'Send the scheduled proposal follow-up; record the response without changing the original scope.'
  }
  if (lead.status === 'Call booked') return 'Use the 15-minute structure below and confirm whether the $297 pilot is the right next step.'
  if (lead.status === 'Replied') return 'Reply while the conversation is active and offer the 15-minute discovery call.'
  if (lead.status === 'Sent') return 'Use the first follow-up on the recorded date; do not resend the opening pitch.'
  if (snapshot) return 'Review the source-linked evidence, then send the first message through a valid recorded route.'
  return 'Verify one reason to contact, one contact route, and the business identity before sending outreach.'
}

export function createProspectActionPack(input: {
  lead: Lead
  snapshot?: SavedSnapshot
  proposal?: Proposal
}): ProspectActionPackModel {
  const { lead, snapshot, proposal } = input
  const identity = businessIdentity(lead)
  const missingInformation = missingProspectInformation(lead)
  const verifiedEvidence = getSourceLinkedEvidence(snapshot?.evidenceItems ?? [])
  const sample = getBestSampleManual(lead.niche, lead.mainService)
  const nextMilestone = snapshot ? getNextMilestone(snapshot.recommendedActions) : undefined
  const planningPriority = nextMilestone?.title.trim()
  const sourcePoint = verifiedEvidence[0]
  const contactRationale = sourcePoint
    ? `${verifiedEvidence.length} source-linked observation${verifiedEvidence.length === 1 ? ' is' : 's are'} recorded. Reopen the source before using a specific claim.`
    : snapshot
      ? 'A reviewed Snapshot is linked, but no public source URL qualifies as source-linked outreach evidence.'
      : 'No source-linked contact rationale is recorded yet. Verify one business-specific reason before sending.'
  const outreachAngle = sourcePoint
    ? `Lead with the recorded ${sourcePoint.sourceLabel.toLocaleLowerCase()} observation, then ask permission to share the ${sample.label.toLocaleLowerCase()}.`
    : planningPriority
      ? `Offer the sample around “${planningPriority}” as a reviewed planning priority—not as a proven website fact.`
      : `Lead with the relevant ${sample.label.toLocaleLowerCase()} and ask what operating priority matters most now.`
  const subject = `${identity.businessName}: a practical 60–90 day operating plan`
  const firstEmail = `Hi ${identity.businessName} team,

I’m reaching out with a concise UpgradeOS example for ${identity.category} businesses. It shows how a reviewed Business Archetype, five-part Business Health Score, and three Upgrade Missions become a practical 60–90 day operating plan.

The current founding-client pilot is $297. It includes the reviewed operating manual and delivery conversation; implementation is separate.

Would it be useful if I sent the ${sample.label.toLocaleLowerCase()} for context?`
  const followUpEmail = `Hi ${identity.businessName} team,

Following up on the UpgradeOS sample I offered for ${identity.serviceContext}. The $297 founding-client pilot is intentionally narrow: one reviewed Business Operating Manual, three prioritized missions, and a 60–90 day roadmap.

If that is relevant, I can walk through the approach in 15 minutes. If not, a quick “not now” is helpful too.`
  const linkedInMessage = `I put together a concise UpgradeOS sample for ${identity.category} businesses: a Business Archetype, Business Health Score, and three concrete Upgrade Missions. The founding-client assessment pilot is $297, with implementation kept separate. Open to a short look?`
  const voicemail = `Hi, I’m calling with UpgradeOS about ${identity.businessName}. I have a concise ${identity.category} operating-manual sample and a tightly scoped $297 founding-client pilot. I’ll send a short note so you can decide whether it is relevant. No need to call back unless you want the 15-minute walkthrough.`
  const callOpener = `I’ll keep this brief: UpgradeOS turns reviewed business information into a Business Archetype, three prioritized missions, and a 60–90 day operating roadmap. I’m not calling with a generic SEO package. Can I ask one question to see whether the $297 founding-client pilot is relevant?`

  return {
    businessName: identity.businessName,
    missingInformation,
    contactRationale,
    verifiedEvidence,
    evidenceNotice: verifiedEvidence.length > 0
      ? 'Only source-linked, report-ready observations are shown here. Recheck each source before outreach.'
      : 'Research notes and recommendation copy are not treated as verified evidence.',
    sample,
    outreachAngle,
    emailSubject: subject,
    firstEmail,
    followUpEmail,
    linkedInMessage,
    voicemail,
    callOpener,
    discoveryCall: [
      '0–2 min — Confirm the owner’s immediate operating priority and whether this is the right conversation.',
      '2–6 min — Ask how prospects currently discover, evaluate, and contact the business.',
      '6–10 min — Review one source-backed constraint or state clearly that further verification is needed.',
      '10–13 min — Explain the $297 pilot: reviewed manual, three missions, roadmap, and delivery conversation.',
      '13–15 min — Confirm fit, decision-maker, timing, and one explicit next action.',
    ],
    proposalStarter: {
      title: '$297 Founding-Client Assessment Pilot',
      investment: '$297 one-time',
      includes: [
        'Reviewed Business Operating Manual',
        'Business Archetype and five-part assessment',
        'Three prioritized Upgrade Missions',
        '60–90 day operating roadmap',
        'Delivery and review conversation',
      ],
      excludes: [
        'Website or campaign implementation',
        'Ongoing marketing or paid media',
        'Guaranteed rankings, leads, or revenue outcomes',
      ],
      distinction: 'This campaign pilot is separate from larger implementation proposals and does not replace their pricing or scope.',
    },
    nextRecommendedAction: conservativeNextAction(lead, snapshot, proposal),
    operatorNote: lead.researchNotes.trim() || lead.suggestedAngle.trim()
      ? 'Operator note available — verify it against a public source before using it as an outreach claim.'
      : undefined,
  }
}
