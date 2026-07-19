import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Flag,
  Gauge,
  LogOut,
  Play,
  Save,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type {
  BusinessIntakePayload,
  EvidenceItem,
  Lead,
  LeadContactRoute,
  RecommendedAction,
  ReportOfferFields,
  SavedSnapshot,
  Scores,
  SnapshotForm,
  SnapshotOutputs,
} from '../types'
import type {
  FastLaneSession,
  FastLaneSource,
  FastLaneSourceType,
  FastLaneStep,
  SendKitBlockId,
} from '../types/fastLane'
import { fastLaneSteps, leadToFastLaneDraft } from '../types/fastLane'
import type { Proposal, ProposalType } from '../types/proposal'
import type { DraftApplication } from '../lib/draftApplication'
import { createFastLaneDraftApplication } from '../lib/draftApplication'
import { createDeterministicDraft } from '../lib/draftAnalysis'
import {
  getFastLaneStepReadiness,
  getAvailableContactRoutes,
} from '../lib/fastLaneReadiness'
import {
  addFastLaneActivity,
  createFastLaneSession,
  discardFastLaneSession,
  loadFastLaneSessions,
  saveFastLaneSession,
} from '../lib/fastLaneState'
import { normalizeWebsiteUrl, parseWebsiteText } from '../lib/intakeParser'
import { isEvidenceReportReady } from '../lib/evidence'
import {
  createProposalFromSnapshot,
  rebuildProposalType,
} from '../lib/proposalBuilder'
import { getProposalReadiness } from '../lib/proposalReadiness'
import { loadProposals, saveProposal } from '../lib/proposalStorage'
import type { ReportReadinessResult } from '../lib/reportReadiness'
import {
  createSendKit,
  getBestOutreachBlock,
  getDefaultFollowUpDate,
  type SendKitBlock,
} from '../lib/sendKit'
import { FastLaneProgress } from './FastLaneProgress'
import {
  FastLaneDraftStep,
  FastLaneLeadStep,
  FastLaneProposalStep,
  FastLaneResearchStep,
  FastLaneSendKitStep,
  FastLaneSnapshotStep,
} from './FastLaneSteps'
import './FastLane.css'

export type FastLaneLaunchRequest = { nonce: number; leadId: string }

export type FastLaneMarkSentInput = {
  leadId?: string
  leadDraft: FastLaneSession['leadDraft']
  route: LeadContactRoute
  contactedAt: string
  followUpDate?: string
  snapshotId: string
  proposalId?: string
  proposalIncluded: boolean
}

type FastLaneProps = {
  leads: Lead[]
  savedIntakes: BusinessIntakePayload[]
  savedSnapshots: SavedSnapshot[]
  intake: BusinessIntakePayload
  form: SnapshotForm
  scores: Scores
  reportOffer: ReportOfferFields
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
  strengths: string[]
  visibilityLeaks: string[]
  outputs: SnapshotOutputs
  totalScore: number
  horoscope: string
  growthStage: string
  highestOpportunity: string
  reportReadiness: ReportReadinessResult
  loadedSnapshotId: string | null
  launchRequest?: FastLaneLaunchRequest
  onActivateSource: (source: FastLaneSource, fresh: boolean, session?: FastLaneSession) => void
  onChangeIntake: (intake: BusinessIntakePayload) => void
  onSaveIntake: (intake?: BusinessIntakePayload) => void
  onApplyDraft: (application: DraftApplication) => void
  onSaveLead: (draft: FastLaneSession['leadDraft'], leadId?: string) => Lead
  onSaveSnapshot: () => SavedSnapshot | null
  onCreateEvidence: () => string
  onOpenEvidence: (evidenceId?: string) => void
  onProposalSaved: (proposalId: string, print?: boolean) => void
  onMarkOutreachSent: (input: FastLaneMarkSentInput) => Lead
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function intakeHasResearch(intake: BusinessIntakePayload) {
  return Boolean(
    intake.website.pageText.trim()
    || intake.website.heroHeadline.trim()
    || intake.website.primaryCta.trim()
    || intake.publicProfile.googleRating.trim()
    || intake.publicProfile.reviewCount.trim()
    || intake.identity.differentiators.trim()
    || intake.publicProfile.profileCompletenessNotes.trim()
    || intake.competitorContext.competitors.some((item) => item.notes.trim()),
  )
}

function sourceLabel(type: FastLaneSourceType) {
  if (type === 'lead') return 'Lead Queue item'
  if (type === 'intake') return 'Saved intake'
  if (type === 'snapshot') return 'Saved Snapshot'
  return 'Blank lead'
}

function splitTerms(value: string) {
  return value.split(/[\n,;|]/).map((item) => item.trim()).filter(Boolean)
}

export function FastLane(props: FastLaneProps) {
  const [sessions, setSessions] = useState<FastLaneSession[]>(() => loadFastLaneSessions())
  const [session, setSession] = useState<FastLaneSession | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [sourceType, setSourceType] = useState<FastLaneSourceType>('lead')
  const [sourceId, setSourceId] = useState(props.leads[0]?.id || '')
  const [includeScores, setIncludeScores] = useState(false)
  const [proposalDraft, setProposalDraft] = useState<Proposal | undefined>()
  const [proposalDirty, setProposalDirty] = useState(false)
  const [snapshotDirty, setSnapshotDirty] = useState(false)
  const [message, setMessage] = useState('')
  const handledLaunchNonce = useRef<number | undefined>(undefined)

  const storedProposals = loadProposals()
  const source = useMemo<FastLaneSource>(() => ({
    type: sourceType,
    id: sourceType === 'blank' ? undefined : sourceId || undefined,
  }), [sourceId, sourceType])

  const associations = useMemo(() => {
    let lead: Lead | undefined
    let intake: BusinessIntakePayload | undefined
    let snapshot: SavedSnapshot | undefined

    if (source.type === 'lead') {
      lead = props.leads.find((item) => item.id === source.id)
      intake = props.savedIntakes
        .filter((item) => item.linkedLeadId === lead?.id)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
      snapshot = props.savedSnapshots.find((item) => item.id === lead?.linkedSnapshotId)
        || props.savedSnapshots.find((item) => item.id === intake?.linkedSnapshotId)
    } else if (source.type === 'intake') {
      intake = props.savedIntakes.find((item) => item.id === source.id)
      lead = props.leads.find((item) => item.id === intake?.linkedLeadId)
      snapshot = props.savedSnapshots.find((item) => item.id === intake?.linkedSnapshotId)
    } else if (source.type === 'snapshot') {
      snapshot = props.savedSnapshots.find((item) => item.id === source.id)
      intake = props.savedIntakes.find((item) => item.linkedSnapshotId === snapshot?.id)
      lead = props.leads.find((item) => item.id === intake?.linkedLeadId)
        || props.leads.find((item) => item.linkedSnapshotId === snapshot?.id)
    }
    const proposal = storedProposals
      .filter((item) => item.snapshotId === snapshot?.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    const matchingSession = sessions
      .filter((item) => (
        (lead && item.leadId === lead.id)
        || (intake && item.intakeId === intake.id)
        || (snapshot && item.snapshotId === snapshot.id)
      ))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    return { lead, intake, snapshot, proposal, matchingSession }
  }, [props.leads, props.savedIntakes, props.savedSnapshots, sessions, source, storedProposals])

  const currentSnapshot = useMemo(() => {
    const id = session?.snapshotId || props.loadedSnapshotId
    return id ? props.savedSnapshots.find((item) => item.id === id) : undefined
  }, [props.loadedSnapshotId, props.savedSnapshots, session?.snapshotId])
  const currentProposal = proposalDraft
    || (session?.proposalId ? storedProposals.find((item) => item.id === session.proposalId) : undefined)

  const sendKit = useMemo(() => createSendKit({
    outputs: props.outputs,
    businessName: session?.leadDraft.businessName || props.form.businessName,
    primaryService: session?.leadDraft.mainService || props.form.mainService,
    proposal: currentProposal,
    snapshot: currentSnapshot,
  }), [currentProposal, currentSnapshot, props.form.businessName, props.form.mainService, props.outputs, session?.leadDraft])

  const readiness = useMemo(() => getFastLaneStepReadiness({
    lead: session?.leadDraft || leadToFastLaneDraft(),
    hasResearch: intakeHasResearch(props.intake),
    hasDraft: Boolean(props.intake.draft),
    hasSnapshot: Boolean(currentSnapshot),
    hasProposal: Boolean(currentProposal),
    proposalSkipped: Boolean(session?.proposalSkipped),
    hasOutreach: sendKit.some((block) => block.text.trim()),
  }), [currentProposal, currentSnapshot, props.intake, sendKit, session?.leadDraft, session?.proposalSkipped])

  const draftApplication = useMemo(() => createFastLaneDraftApplication({
    intake: props.intake,
    currentForm: props.form,
    currentScores: props.scores,
    currentOffer: props.reportOffer,
    currentStrengths: props.strengths,
    currentVisibilityLeaks: props.visibilityLeaks,
    includeScores,
    protectExisting: Boolean(currentSnapshot),
    allowOutreachAngle: Boolean(session?.leadId),
    currentOutreachAngle: session?.leadId
      ? props.leads.find((lead) => lead.id === session.leadId)?.suggestedAngle
      : undefined,
  }), [
    currentSnapshot,
    includeScores,
    props.form,
    props.intake,
    props.reportOffer,
    props.scores,
    props.strengths,
    props.visibilityLeaks,
    session?.leadId,
    props.leads,
  ])

  const proposalReadiness = currentProposal
    ? getProposalReadiness(currentProposal, currentSnapshot)
    : undefined
  const hasMeaningfulUnsavedWork = proposalDirty || snapshotDirty

  useEffect(() => {
    if (!props.launchRequest || props.launchRequest.nonce === handledLaunchNonce.current) return
    handledLaunchNonce.current = props.launchRequest.nonce
    const timer = window.setTimeout(() => {
      setSourceType('lead')
      setSourceId(props.launchRequest!.leadId)
      setExpanded(false)
      scrollToId('fast-lane')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [props.launchRequest])

  useEffect(() => {
    if (!expanded || !hasMeaningfulUnsavedWork) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [expanded, hasMeaningfulUnsavedWork])

  function commitSession(next: FastLaneSession) {
    const stamped = { ...next, updatedAt: new Date().toISOString() }
    setSession(stamped)
    const stored = saveFastLaneSession(stamped)
    setSessions(stored)
    return stamped
  }

  function resumeSession(saved: FastLaneSession) {
    const fallbackId = saved.sourceType === 'lead'
      ? saved.leadId
      : saved.sourceType === 'intake'
        ? saved.intakeId
        : saved.sourceType === 'snapshot'
          ? saved.snapshotId
          : undefined
    props.onActivateSource(
      { type: saved.sourceType, id: saved.sourceId || fallbackId },
      saved.isNewVersion,
      saved,
    )
    setSession(saved)
    setProposalDraft(saved.proposalId
      ? loadProposals().find((item) => item.id === saved.proposalId)
      : undefined)
    setIncludeScores(false)
    setProposalDirty(false)
    setSnapshotDirty(false)
    setExpanded(true)
    setMessage(saved.status === 'completed' ? 'Completed Fast Lane session resumed.' : 'Fast Lane session resumed.')
  }

  function startSource(fresh: boolean) {
    if (source.type !== 'blank' && !source.id) {
      setMessage(`Choose a ${sourceLabel(source.type).toLowerCase()} first.`)
      return
    }
    if (fresh && (associations.intake || associations.snapshot || associations.proposal)) {
      const approved = window.confirm(
        'Start a new Fast Lane version for this business? Existing records will remain unchanged. A duplicate Snapshot or proposal is created only if you explicitly save it.',
      )
      if (!approved) return
    }
    const related = fresh ? {} : {
      leadId: associations.lead?.id,
      intakeId: associations.intake?.id,
      snapshotId: associations.snapshot?.id,
      proposalId: associations.proposal?.id,
    }
    const base = createFastLaneSession(source, associations.lead, related)
    const leadDraft = associations.lead
      ? leadToFastLaneDraft(associations.lead)
      : associations.intake
        ? {
            ...base.leadDraft,
            businessName: associations.intake.identity.businessName,
            websiteUrl: associations.intake.identity.websiteUrlNormalized
              || associations.intake.identity.websiteUrlRaw,
            city: associations.intake.identity.city,
            niche: associations.intake.identity.niche,
            mainService: associations.intake.identity.primaryService,
            email: associations.intake.identity.email,
            phone: associations.intake.identity.phone,
            contactFormUrl: associations.intake.identity.contactFormUrl,
          }
        : associations.snapshot
          ? {
              ...base.leadDraft,
              businessName: associations.snapshot.businessName,
              websiteUrl: associations.snapshot.websiteUrl,
              city: associations.snapshot.city,
              niche: associations.snapshot.niche,
              mainService: associations.snapshot.mainService,
            }
          : base.leadDraft
    const routes = getAvailableContactRoutes(leadDraft)
    const next: FastLaneSession = {
      ...base,
      isNewVersion: fresh,
      intakeId: fresh ? undefined : base.intakeId,
      snapshotId: fresh ? undefined : base.snapshotId,
      proposalId: fresh ? undefined : base.proposalId,
      leadDraft,
      selectedContactRoute: routes[0],
      evidenceIds: fresh ? [] : associations.snapshot?.evidenceItems.map((item) => item.id) || [],
      preliminarySnapshot: !fresh && Boolean(
        associations.snapshot
        && !associations.snapshot.evidenceItems.some(isEvidenceReportReady),
      ),
    }
    props.onActivateSource(source, fresh, next)
    setSession(next)
    setSessions(saveFastLaneSession(next))
    setProposalDraft(fresh ? undefined : associations.proposal)
    setIncludeScores(false)
    setProposalDirty(false)
    setSnapshotDirty(false)
    setExpanded(true)
    setMessage(fresh ? 'New version started. Related saved records were not changed.' : 'Fast Lane started from the latest related records.')
  }

  function updateSession(values: Partial<FastLaneSession>) {
    if (!session) return
    commitSession({ ...session, ...values })
  }

  function completeStepAndMove(step: FastLaneStep) {
    if (!session) return
    const completedSteps = readiness[session.currentStep - 1].state === 'Blocked'
      ? session.completedSteps
      : Array.from(new Set([...session.completedSteps, session.currentStep]))
    if (session.currentStep === 1) syncIntakeWithLead(false)
    commitSession({ ...session, completedSteps, currentStep: step })
    scrollToId('fast-lane-workflow')
  }

  function changeLead(values: Partial<FastLaneSession['leadDraft']>) {
    if (!session) return
    const leadDraft = { ...session.leadDraft, ...values }
    if (values.websiteUrl !== undefined) {
      const normalized = normalizeWebsiteUrl(values.websiteUrl)
      if (normalized.valid && normalized.normalized === values.websiteUrl.trim()) {
        leadDraft.websiteUrl = normalized.normalized
      }
    }
    const routes = getAvailableContactRoutes(leadDraft)
    const selectedContactRoute = session.selectedContactRoute
      && routes.includes(session.selectedContactRoute)
      ? session.selectedContactRoute
      : routes[0]
    commitSession({ ...session, leadDraft, selectedContactRoute })
  }

  function chooseLead(lead: Lead) {
    if (!session) return
    if (session.leadId && session.leadId !== lead.id) {
      const approved = window.confirm(
        `Start a separate Fast Lane session for ${lead.businessName || 'this lead'}? The current session will remain saved, but unsaved Snapshot or proposal edits will not be persisted.`,
      )
      if (!approved) return
    }
    setSourceType('lead')
    setSourceId(lead.id)
    window.setTimeout(() => startLeadDirect(lead), 0)
  }

  function startLeadDirect(lead: Lead) {
    const leadIntake = props.savedIntakes
      .filter((item) => item.linkedLeadId === lead.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    const leadSnapshot = props.savedSnapshots.find((item) => item.id === lead.linkedSnapshotId)
      || props.savedSnapshots.find((item) => item.id === leadIntake?.linkedSnapshotId)
    const proposal = loadProposals().find((item) => item.snapshotId === leadSnapshot?.id)
    const base = createFastLaneSession(
      { type: 'lead', id: lead.id },
      lead,
      { leadId: lead.id, intakeId: leadIntake?.id, snapshotId: leadSnapshot?.id, proposalId: proposal?.id },
    )
    const next: FastLaneSession = {
      ...base,
      evidenceIds: leadSnapshot?.evidenceItems.map((item) => item.id) || [],
      preliminarySnapshot: Boolean(
        leadSnapshot && !leadSnapshot.evidenceItems.some(isEvidenceReportReady),
      ),
    }
    props.onActivateSource({ type: 'lead', id: lead.id }, false, next)
    setProposalDraft(proposal)
    setIncludeScores(false)
    setProposalDirty(false)
    setSnapshotDirty(false)
    commitSession(next)
    setMessage('Lead selected. Related records were reused when available.')
  }

  function syncIntakeWithLead(
    persist = true,
    sourceSession: FastLaneSession | null = session,
  ) {
    if (!sourceSession) return props.intake
    const normalizedWebsite = normalizeWebsiteUrl(sourceSession.leadDraft.websiteUrl)
    const next: BusinessIntakePayload = {
      ...props.intake,
      linkedLeadId: sourceSession.leadId || props.intake.linkedLeadId,
      updatedAt: new Date().toISOString(),
      identity: {
        ...props.intake.identity,
        businessName: sourceSession.leadDraft.businessName,
        websiteUrlRaw: sourceSession.leadDraft.websiteUrl,
        websiteUrlNormalized: normalizedWebsite.valid ? normalizedWebsite.normalized : '',
        city: sourceSession.leadDraft.city,
        niche: sourceSession.leadDraft.niche,
        primaryService: sourceSession.leadDraft.mainService,
        email: sourceSession.leadDraft.email,
        phone: sourceSession.leadDraft.phone,
        contactFormUrl: sourceSession.leadDraft.contactFormUrl,
      },
    }
    props.onChangeIntake(next)
    if (persist) props.onSaveIntake(next)
    return next
  }

  function saveLeadFromSession() {
    if (!session) return
    const normalized = normalizeWebsiteUrl(session.leadDraft.websiteUrl)
    const lead = props.onSaveLead({
      ...session.leadDraft,
      websiteUrl: normalized.valid ? normalized.normalized : session.leadDraft.websiteUrl.trim(),
    }, session.leadId)
    const next = addFastLaneActivity({
      ...session,
      leadId: lead.id,
      leadDraft: leadToFastLaneDraft(lead),
    }, 'Lead saved')
    commitSession(next)
    syncIntakeWithLead(true, next)
    setMessage(session.leadId ? 'Existing lead updated.' : 'Lead saved and linked to this session.')
  }

  function updateResearch(next: BusinessIntakePayload) {
    props.onChangeIntake(next)
    props.onSaveIntake(next)
    if (session && session.intakeId !== next.id) updateSession({ intakeId: next.id })
  }

  function attachScreenshot() {
    if (!session) return
    const evidenceId = props.onCreateEvidence()
    commitSession({
      ...session,
      evidenceIds: Array.from(new Set([...session.evidenceIds, evidenceId])),
    })
    props.onOpenEvidence(evidenceId)
    setMessage('Evidence draft created. Attach the screenshot in Evidence Manager.')
  }

  function generateDraft() {
    if (!session) return
    const extraction = parseWebsiteText(props.intake.website.pageText, {
      serviceTerms: [
        props.intake.identity.primaryService,
        ...splitTerms(props.intake.identity.secondaryServices),
        props.intake.identity.niche,
      ],
      locationTerms: [
        props.intake.identity.city,
        ...splitTerms(props.intake.identity.serviceAreas),
      ],
    })
    const next = {
      ...props.intake,
      draft: createDeterministicDraft(props.intake, extraction),
      updatedAt: new Date().toISOString(),
    }
    props.onChangeIntake(next)
    props.onSaveIntake(next)
    commitSession(addFastLaneActivity({ ...session, intakeId: next.id }, 'Draft generated'))
    setMessage('Deterministic draft generated from entered material.')
  }

  function applyDraft() {
    if (!session || !props.intake.draft) return
    if (includeScores && draftApplication.application.scorePatch) {
      const approved = window.confirm(
        'Replace the five current scores with the displayed suggested midpoints? All other protected values marked Retained will stay unchanged.',
      )
      if (!approved) return
    }
    props.onApplyDraft(draftApplication.application)
    const nextIntake = { ...props.intake, appliedAt: new Date().toISOString() }
    props.onChangeIntake(nextIntake)
    props.onSaveIntake(nextIntake)
    commitSession(addFastLaneActivity(session, 'Draft applied'))
    setSnapshotDirty(true)
    setMessage(includeScores ? 'Draft and confirmed score midpoints applied.' : 'Draft applied. Current scores were retained.')
  }

  function saveSnapshot(preliminary = false) {
    if (!session) return null
    const saved = props.onSaveSnapshot()
    if (!saved) {
      setMessage('Snapshot could not be saved. Review the storage message in Audit Profile.')
      return null
    }
    const next = addFastLaneActivity({
      ...session,
      snapshotId: saved.id,
      intakeId: props.intake.id,
      evidenceIds: props.evidenceItems.map((item) => item.id),
      preliminarySnapshot: preliminary || !props.evidenceItems.some(isEvidenceReportReady),
      isNewVersion: false,
    }, 'Snapshot saved')
    commitSession(next)
    setSnapshotDirty(false)
    setMessage(next.preliminarySnapshot ? 'Preliminary Snapshot saved with the evidence limitation visible.' : 'Snapshot saved and ready for proposal handoff.')
    return saved
  }

  function ensureSnapshot() {
    return currentSnapshot
      || saveSnapshot(!props.evidenceItems.some(isEvidenceReportReady))
      || undefined
  }

  function createProposal() {
    if (!session) return
    const snapshot = ensureSnapshot()
    if (!snapshot) return
    const existing = loadProposals().find((item) => item.snapshotId === snapshot.id)
    if (existing && !session.proposalId) {
      const resume = window.confirm('A proposal already exists for this Snapshot. Select OK to resume it. Select Cancel to keep Fast Lane unchanged.')
      if (!resume) return
      setProposalDraft(existing)
      commitSession({ ...session, proposalId: existing.id, proposalSkipped: false })
      setMessage('Existing proposal resumed without duplication.')
      return
    }
    const lead = session.leadId ? props.leads.find((item) => item.id === session.leadId) : undefined
    const proposal = createProposalFromSnapshot(snapshot, '48-Hour Visibility Sprint', lead)
    setProposalDraft(proposal)
    setProposalDirty(true)
    commitSession(addFastLaneActivity({ ...session, proposalSkipped: false }, 'Proposal created'))
    setMessage('Recommended proposal draft created. Save when the setup is ready.')
  }

  function useRecommendedScope(type: ProposalType) {
    if (!currentProposal || !currentSnapshot) return
    const defaults = createProposalFromSnapshot(currentSnapshot, type,
      session?.leadId ? props.leads.find((item) => item.id === session.leadId) : undefined)
    setProposalDraft({
      ...rebuildProposalType(currentProposal, currentSnapshot, type),
      proposalTitle: defaults.proposalTitle,
    })
    setProposalDirty(true)
    setMessage('Recommended unfinished-action scope applied. Completed and deferred actions remain excluded.')
  }

  function persistProposal(openAfter = false, print = false) {
    if (!session || !currentProposal) return undefined
    const nextProposals = saveProposal(currentProposal)
    const saved = nextProposals.find((item) => item.id === currentProposal.id) || currentProposal
    setProposalDraft(saved)
    setProposalDirty(false)
    commitSession(addFastLaneActivity({
      ...session,
      proposalId: saved.id,
      proposalSkipped: false,
    }, 'Proposal saved'))
    setMessage('Proposal saved in the existing Proposal Workspace.')
    if (openAfter) props.onProposalSaved(saved.id, print)
    return saved
  }

  function openProposal(print = false) {
    const proposal = proposalDirty ? persistProposal(false) : currentProposal
    if (!proposal) {
      setMessage('Create and save a proposal before opening its preview.')
      return
    }
    props.onProposalSaved(proposal.id, print)
  }

  function skipProposal() {
    if (!session) return
    if (proposalDirty && !window.confirm('Skip the proposal and discard the unsaved proposal draft? Saved proposals will remain unchanged.')) return
    setProposalDraft(undefined)
    setProposalDirty(false)
    commitSession({
      ...session,
      proposalId: undefined,
      proposalSkipped: true,
      proposalIncluded: false,
    })
    setMessage('Proposal skipped. Send Kit remains available.')
  }

  async function copyBlock(block: SendKitBlock) {
    if (!session) return
    try {
      await navigator.clipboard.writeText(block.text)
      const type = block.id === 'proposalEmail' ? 'Proposal copied' : 'Report copied'
      commitSession(addFastLaneActivity(session, type))
      setMessage(`${block.label} copied. Nothing was marked sent.`)
    } catch {
      setMessage('Clipboard access was unavailable. Select and copy the text manually.')
    }
  }

  function resetBlock(id: SendKitBlockId) {
    if (!session) return
    if (!window.confirm('Reset this edited copy to its generated version?')) return
    const edits = { ...session.sendKitEdits }
    delete edits[id]
    commitSession({ ...session, sendKitEdits: edits })
    setMessage('Generated version restored.')
  }

  function markSent() {
    if (!session?.selectedContactRoute || !currentSnapshot) return
    const originalDefault = getDefaultFollowUpDate(new Date(session.createdAt))
    const followUpDate = session.noFollowUp
      ? undefined
      : session.followUpDate === originalDefault
        ? getDefaultFollowUpDate()
        : session.followUpDate
    const included = session.proposalIncluded && Boolean(currentProposal)
    const approved = window.confirm([
      `Mark outreach sent to ${session.leadDraft.businessName}?`,
      `Route: ${session.selectedContactRoute}`,
      `Included: Snapshot${included ? ' and proposal' : ''}`,
      `Follow-up: ${followUpDate || 'Not scheduled'}`,
    ].join('\n'))
    if (!approved) return

    let proposal = currentProposal
    if (proposal && included) {
      proposal = { ...proposal, proposalStatus: 'Sent' }
      const nextProposals = saveProposal(proposal)
      proposal = nextProposals.find((item) => item.id === proposal?.id) || proposal
      setProposalDraft(proposal)
      setProposalDirty(false)
    }
    const contactedAt = new Date().toISOString()
    const lead = props.onMarkOutreachSent({
      leadId: session.leadId,
      leadDraft: session.leadDraft,
      route: session.selectedContactRoute,
      contactedAt,
      followUpDate,
      snapshotId: currentSnapshot.id,
      proposalId: proposal?.id,
      proposalIncluded: included,
    })
    let next = addFastLaneActivity({
      ...session,
      status: 'completed',
      completedSteps: [1, 2, 3, 4, 5, 6],
      leadId: lead.id,
      leadDraft: leadToFastLaneDraft(lead),
      proposalId: proposal?.id,
      followUpDate: followUpDate || session.followUpDate,
      completedAt: contactedAt,
    }, 'Outreach marked sent')
    if (followUpDate) next = addFastLaneActivity(next, 'Follow-up scheduled')
    commitSession(next)
    setMessage('Outreach marked sent. Lead, contact route, and follow-up metadata were updated.')
  }

  function saveProgress() {
    if (!session) return
    props.onSaveIntake(props.intake)
    commitSession({ ...session, intakeId: props.intake.id })
    setMessage(hasMeaningfulUnsavedWork
      ? 'Session and intake saved. Snapshot or proposal edits still need their dedicated Save action.'
      : 'Fast Lane progress saved locally.')
  }

  function exitFastLane() {
    if (hasMeaningfulUnsavedWork && !window.confirm('Exit Fast Lane with unsaved Snapshot or proposal changes? The session itself will remain available.')) return
    setExpanded(false)
    setMessage('Fast Lane session saved. Resume when ready.')
  }

  function discardSession() {
    if (!session || !window.confirm('Discard this Fast Lane session? Linked leads, intakes, Snapshots, evidence, and proposals will remain.')) return
    const nextSessions = discardFastLaneSession(session.id)
    setSessions(nextSessions)
    setSession(null)
    setProposalDraft(undefined)
    setExpanded(false)
    setMessage('Fast Lane session discarded. Source records were not changed.')
  }

  const activeStep = session?.currentStep || 1
  const currentReadiness = readiness[activeStep - 1]
  const saveLabel = hasMeaningfulUnsavedWork ? 'Unsaved app changes' : 'Session saved locally'

  return (
    <section className="fast-lane screen-only" id="fast-lane" aria-labelledby="fast-lane-title">
      <header className="fast-lane-hero">
        <div>
          <p className="section-kicker">One-screen operator workflow</p>
          <h2 id="fast-lane-title"><Sparkles size={23} /> Fast Lane</h2>
          <p>Turn one lead into a reviewed Snapshot, proposal, and outreach package without leaving the workflow.</p>
        </div>
        <div className="fast-lane-target"><span>Target completion</span><strong>5–10 minutes</strong><small>for a prepared lead</small></div>
      </header>

      {!expanded && (
        <section className="fast-lane-entry" aria-label="Start or resume Fast Lane">
          {sessions[0] && (
            <button className="fast-lane-resume-card" type="button" onClick={() => resumeSession(sessions[0])}>
              <Play size={19} />
              <span><strong>Resume latest session</strong><small>{sessions[0].leadDraft.businessName || 'Blank lead'} · Step {sessions[0].currentStep} {fastLaneSteps[sessions[0].currentStep - 1]} · {sessions[0].status}</small></span>
            </button>
          )}
          <div className="fast-lane-entry-grid">
            <label className="fast-lane-field">
              <span>Start from</span>
              <select value={sourceType} onChange={(event) => {
                const type = event.target.value as FastLaneSourceType
                setSourceType(type)
                setSourceId(type === 'lead' ? props.leads[0]?.id || '' : type === 'intake' ? props.savedIntakes[0]?.id || '' : type === 'snapshot' ? props.savedSnapshots[0]?.id || '' : '')
              }}>
                <option value="lead">Selected Lead Queue item</option>
                <option value="intake">Saved intake</option>
                <option value="snapshot">Saved Snapshot</option>
                <option value="blank">Blank lead</option>
              </select>
            </label>
            {sourceType === 'lead' && <label className="fast-lane-field"><span>Lead</span><select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Choose lead</option>{props.leads.map((lead) => <option value={lead.id} key={lead.id}>{lead.businessName || 'Untitled lead'} · {lead.city || 'No city'}</option>)}</select></label>}
            {sourceType === 'intake' && <label className="fast-lane-field"><span>Intake</span><select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Choose intake</option>{props.savedIntakes.map((item) => <option value={item.id} key={item.id}>{item.identity.businessName || 'Untitled intake'} · {new Date(item.updatedAt).toLocaleDateString()}</option>)}</select></label>}
            {sourceType === 'snapshot' && <label className="fast-lane-field"><span>Snapshot</span><select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Choose Snapshot</option>{props.savedSnapshots.map((item) => <option value={item.id} key={item.id}>{item.businessName || 'Untitled Snapshot'} · {new Date(item.createdAt).toLocaleDateString()}</option>)}</select></label>}
          </div>
          {sourceType !== 'blank' && sourceId && (
            <div className="fast-lane-related-records">
              <strong>Related records found</strong>
              <span>{associations.lead ? 'Lead' : 'No lead'} · {associations.intake ? 'Intake' : 'No intake'} · {associations.snapshot ? 'Snapshot' : 'No Snapshot'} · {associations.proposal ? 'Proposal' : 'No proposal'}</span>
              <small>Continue reuses stable IDs. Starting a new version changes nothing until you explicitly save.</small>
            </div>
          )}
          <div className="fast-lane-entry-actions">
            {associations.matchingSession && <button className="primary-button" type="button" onClick={() => resumeSession(associations.matchingSession!)}>Resume</button>}
            <button className="primary-button" type="button" onClick={() => startSource(false)}>{sourceType === 'blank' ? 'Start Fast Lane' : 'Continue from latest'}</button>
            {sourceType !== 'blank' && <button className="secondary-button" type="button" onClick={() => startSource(true)}>Start a new version</button>}
          </div>
        </section>
      )}

      {expanded && session && (
        <div className="fast-lane-workflow" id="fast-lane-workflow">
          <FastLaneProgress session={session} readiness={readiness} saveLabel={saveLabel} onStepChange={(step) => completeStepAndMove(step)} />
          <nav className="fast-lane-command-bar" aria-label="Fast Lane commands">
            <button type="button" onClick={saveProgress}><Save size={16} /> Save progress</button>
            <button type="button" onClick={() => scrollToId('client-report-preview')}><Gauge size={16} /> Preview report</button>
            <button type="button" disabled={!currentProposal} onClick={() => openProposal(false)}><Flag size={16} /> Preview proposal</button>
            <button type="button" onClick={() => {
              const block = getBestOutreachBlock(sendKit, session.selectedContactRoute)
              if (block) void copyBlock({ ...block, text: session.sendKitEdits[block.id] ?? block.text })
            }}><Copy size={16} /> Copy best outreach</button>
            <button type="button" onClick={() => completeStepAndMove(6)}><Send size={16} /> Open Send Kit</button>
            <button type="button" onClick={exitFastLane}><LogOut size={16} /> Exit Fast Lane</button>
          </nav>
          {message && <p className="fast-lane-message" role="status">{message}</p>}
          {session.status === 'completed' && <p className="fast-lane-complete"><CheckCircle2 size={18} /> Outreach recorded. This session can be reviewed or used as a reference for follow-up.</p>}

          <div className="fast-lane-step-frame">
            {activeStep === 1 && <FastLaneLeadStep session={session} leads={props.leads} readiness={currentReadiness} onLeadChange={changeLead} onChooseLead={chooseLead} onSaveLead={saveLeadFromSession} onOpenWorkspace={() => scrollToId('lead-queue')} />}
            {activeStep === 2 && <FastLaneResearchStep intake={props.intake} readiness={currentReadiness} evidenceCount={props.evidenceItems.length} onChange={updateResearch} onAttachScreenshot={attachScreenshot} onOpenWorkspace={() => scrollToId('operator-workspace')} />}
            {activeStep === 3 && <FastLaneDraftStep intake={props.intake} scores={props.scores} readiness={currentReadiness} changes={draftApplication.changes} includeScores={includeScores} onIncludeScoresChange={setIncludeScores} onGenerate={generateDraft} onApply={applyDraft} onReviewScores={() => scrollToId('audit-profile-workspace')} onEditDraft={() => completeStepAndMove(2)} onOpenWorkspace={() => scrollToId('operator-workspace')} />}
            {activeStep === 4 && <FastLaneSnapshotStep snapshot={currentSnapshot} form={props.form} totalScore={props.totalScore} horoscope={props.horoscope} growthStage={props.growthStage} highestOpportunity={props.highestOpportunity} reportReadiness={props.reportReadiness} evidenceItems={props.evidenceItems} actions={props.actions} readiness={currentReadiness} onSave={() => void saveSnapshot(false)} onUsePreliminary={() => void saveSnapshot(true)} onPreview={() => scrollToId('client-report-preview')} onPrint={() => window.print()} onOpenAudit={() => scrollToId('audit-profile-workspace')} onOpenActions={() => scrollToId('action-control-center')} onReturnDraft={() => completeStepAndMove(3)} />}
            {activeStep === 5 && <FastLaneProposalStep snapshot={currentSnapshot} proposal={currentProposal} proposalReadiness={proposalReadiness} readiness={currentReadiness} onCreate={createProposal} onChange={(proposal) => { setProposalDraft(proposal); setProposalDirty(true) }} onUseRecommended={useRecommendedScope} onSave={() => void persistProposal(false)} onPreview={() => openProposal(false)} onPrint={() => openProposal(true)} onOpenWorkspace={() => currentProposal ? openProposal(false) : scrollToId('proposal-workspace')} onSkip={skipProposal} />}
            {activeStep === 6 && <FastLaneSendKitStep session={session} blocks={sendKit} readiness={currentReadiness} snapshot={currentSnapshot} proposal={currentProposal} onRouteChange={(selectedContactRoute) => updateSession({ selectedContactRoute })} onEditBlock={(id, value) => updateSession({ sendKitEdits: { ...session.sendKitEdits, [id]: value } })} onResetBlock={resetBlock} onCopyBlock={(block) => void copyBlock(block)} onPrintReport={() => window.print()} onPrintProposal={() => openProposal(true)} onMarkSent={markSent} onFollowUpChange={(followUpDate) => updateSession({ followUpDate, noFollowUp: false })} onNoFollowUpChange={(noFollowUp) => updateSession({ noFollowUp })} onProposalIncludedChange={(proposalIncluded) => updateSession({ proposalIncluded })} />}
          </div>

          <nav className="fast-lane-mobile-nav" aria-label="Fast Lane step navigation">
            <button type="button" disabled={activeStep === 1} onClick={() => completeStepAndMove((activeStep - 1) as FastLaneStep)}><ArrowLeft size={18} /> Previous</button>
            <span>{activeStep}. {fastLaneSteps[activeStep - 1]}</span>
            <button type="button" disabled={activeStep === 6} onClick={() => completeStepAndMove((activeStep + 1) as FastLaneStep)}>Next <ArrowRight size={18} /></button>
          </nav>
          <footer className="fast-lane-session-actions">
            <button className="secondary-button" type="button" onClick={() => { saveProgress(); exitFastLane() }}><Save size={16} /> Save and exit</button>
            <button className="text-danger-button" type="button" onClick={discardSession}><Trash2 size={16} /> Discard session</button>
          </footer>
        </div>
      )}
      {!expanded && message && <p className="fast-lane-message" role="status">{message}</p>}
    </section>
  )
}
