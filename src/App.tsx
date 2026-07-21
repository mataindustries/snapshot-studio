import { useCallback, useMemo, useState } from 'react'
import {
  Briefcase,
  CalendarDays,
  Clipboard,
  Copy,
  Download,
  FilePlus2,
  FileText,
  Filter,
  ListChecks,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react'
import './App.css'
import { ActionControlCenter } from './components/ActionControlCenter'
import { DemoTour } from './components/DemoTour'
import { OperatorHeader } from './components/OperatorHeader'
import './components/ContestPreparation.css'
import { AuthorityRoadmap } from './components/AuthorityRoadmap'
import { SprintPlan } from './components/SprintPlan'
import { EvidenceManager } from './components/EvidenceManager'
import {
  FastLane,
  type FastLaneLaunchRequest,
  type FastLaneMarkSentInput,
} from './components/FastLane'
import {
  OperatorWorkspace,
} from './components/OperatorWorkspace'
import type { DraftApplication } from './lib/draftApplication'
import { EvidenceReport } from './components/EvidenceReport'
import { ProgressJourneyReport } from './components/ProgressJourneyReport'
import { ReportReadiness } from './components/ReportReadiness'
import { ImplementationPathsReport } from './components/ImplementationPathsReport'
import { PoweredByFooter } from './components/PoweredByFooter'
import {
  ProposalWorkspace,
  type ProposalCreationRequest,
  type ProposalFocusRequest,
} from './components/ProposalWorkspace'
import {
  BiggestOpportunityReport,
  ExecutiveSummaryReport,
  StrategicAssetsReport,
} from './components/ReportStrategy'
import './components/PremiumReportDesign.css'
import {
  appendActionStatusHistory,
  formatActionStatusText,
  getBlockingActions,
  getNextMilestone,
  requiresDependencyOverride,
} from './lib/actionProgress'
import {
  createEvidenceItem,
  formatEvidenceReportText,
  getEvidenceForAction,
  getReportEvidence,
} from './lib/evidence'
import { planRecommendations } from './lib/actionPlanner'
import { createGrowthFoundation, refreshGrowthFoundation } from './lib/growthPlanning'
import {
  createProgressJourneyModel,
  formatProgressJourneyText,
  type ProgressJourneyModel,
} from './lib/progressJourney'
import { createConsultingRoadmap } from './lib/roadmap'
import {
  createExecutiveSummary,
  createReportStory,
  formatFeaturedOpportunityText,
  formatImplementationPathsText,
  formatStrategicAssetsText,
  preliminaryEvidenceNote,
  upgradeOsSupportingText,
  type ExecutiveSummary,
  type ReportStory,
} from './lib/reportStory'
import {
  getClientFacingCategoryLabel,
  getDisplayBusinessName,
  getDisplayCity,
  getMarketLabel,
} from './lib/reportDisplay'
import {
  defaultReportOffer,
  formatOfferAndCtaText,
} from './lib/reportOffer'
import { getReportReadiness } from './lib/reportReadiness'
import {
  createVisualDiagnostics,
  formatEvidenceDiagnosticText,
  formatMomentumTimelineText,
  formatOpportunityMatrixText,
  formatScoreDiagnosticsText,
  type VisualDiagnostics,
} from './lib/visualDiagnostics'
import { emptyScores, getRatingLabel, getTotalScore, normalizeScores, scoreLabels } from './lib/scoring'
import { deleteSnapshot, isStorageQuotaError, loadSnapshots, saveSnapshot } from './lib/storage'
import {
  createEmptyBusinessIntake,
  deleteIntakeDraft,
  loadIntakeDrafts,
  saveIntakeDraft,
} from './lib/intakeStorage'
import { normalizeWebsiteUrl } from './lib/intakeParser'
import {
  contestDemoIds,
  getContestDemoData,
  installContestDemo,
  refreshContestDemoClientCopy,
  isContestDemoInstalled,
  resetContestDemo,
} from './lib/contestDemo'
import {
  clearDemoTourDismissal,
  isDemoTourDismissed,
  type DemoTourStep,
} from './lib/demoTour'
import {
  createLead,
  emptyLeadInput,
  leadPriorities,
  leadStatuses,
  leadsToCsv,
  loadLeads,
  parseLeadTable,
  persistLeads,
  saveLead,
  type LeadInput,
  type ParsedLead,
} from './lib/leads'
import { buildBusinessHoroscope, generateOutputs } from './templates/snapshotTemplates'
import type {
  ActionStatusChange,
  BrandingFields,
  BusinessIntakePayload,
  EvidenceItem,
  EvidenceSentiment,
  Lead,
  LeadPriority,
  LeadStatus,
  OfferMode,
  ReportOfferFields,
  RecommendedAction,
  RecommendedActionStatus,
  SavedSnapshot,
  ScoreKey,
  Scores,
  SnapshotForm,
  SnapshotOutputs,
  Tone,
  WebsiteExtractionObservation,
} from './types'
import type { FastLaneSession, FastLaneSource } from './types/fastLane'

const emptyForm: SnapshotForm = {
  businessName: '',
  websiteUrl: '',
  city: '',
  niche: '',
  mainService: '',
  notes: '',
  weakness: '',
  competitorNote: '',
  competitorUrl1: '',
  competitorUrl2: '',
  tone: 'fun',
  ctaStyle: 'ask-permission',
}

const defaultBranding: BrandingFields = {
  preparedBy: 'Sergio',
  brandName: 'Snapshot Studio',
  contactLine: '',
}

const outputLabels: Array<{
  key: keyof SnapshotOutputs
  title: string
  icon: typeof FileText
}> = [
  { key: 'snapshot', title: 'Business Archetype report', icon: FileText },
  { key: 'text', title: 'Short text message', icon: MessageSquare },
  { key: 'email', title: 'Short cold email', icon: Send },
  { key: 'shareable', title: 'Shareable result', icon: Clipboard },
  { key: 'upsell', title: 'Premium upsell', icon: FileText },
]

const scoreKeys = Object.keys(scoreLabels) as ScoreKey[]

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
}

function normalizeToneValue(tone: Tone | undefined): Tone {
  if (tone === 'friendly') return 'fun'
  if (tone === 'expert') return 'professional'
  if (tone === 'blunt') return 'spicy'
  return tone || 'fun'
}

function getReportRating(totalScore: number) {
  if (totalScore >= 82) return 'Strong local authority'
  if (totalScore >= 66) return 'Established growth foundation'
  if (totalScore >= 46) return 'Practical improvement opportunity'
  return 'Foundation-building stage'
}

function buildReportText({
  form,
  branding,
  offer,
  totalScore,
  reportRating,
  reportDate,
  horoscope,
  scores,
  reportStory,
  executiveSummary,
  visualDiagnostics,
  actions,
  progressJourney,
  evidenceText,
}: {
  form: SnapshotForm
  branding: BrandingFields
  offer: ReportOfferFields
  totalScore: number
  reportRating: string
  reportDate: string
  horoscope: ReturnType<typeof buildBusinessHoroscope>
  scores: Scores
  reportStory: ReportStory
  executiveSummary: ExecutiveSummary
  visualDiagnostics: VisualDiagnostics
  actions: RecommendedAction[]
  progressJourney: ProgressJourneyModel
  evidenceText: string
}) {
  const businessName = getDisplayBusinessName(form)
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const preparedBy = valueOrFallback(branding.preparedBy, defaultBranding.preparedBy)
  const brandName = valueOrFallback(branding.brandName, defaultBranding.brandName)
  const contactLine = branding.contactLine.trim()
  const contact = contactLine ? `\n${contactLine}` : ''
  const categoryScores = scoreKeys.map((key) => `- ${scoreLabels[key]}: ${scores[key]}/20`).join('\n')
  const evidenceSection = evidenceText ? '\n\n' + evidenceText : ''
  const preliminarySection = evidenceText ? '' : '\n' + preliminaryEvidenceNote
  const sprintSummary = visualDiagnostics.sprintPhases.map((phase) =>
    phase.window + ' [' + phase.status + '] — ' + phase.mainAction
      + '\nDeliverable: ' + phase.deliverable,
  ).join('\n\n')
  const monthSummary = visualDiagnostics.monthWeeks.map((week) =>
    'Week ' + week.week + ' — ' + week.theme + ' [' + week.status + ']'
      + '\n' + week.objective
      + '\nSuccess signal: ' + week.successSignal,
  ).join('\n\n')

  return `Your Business Archetype

${businessName} — ${city} | ${industry}
${horoscope.archetype}
${horoscope.archetypeExplanation}
Biggest Strength: ${horoscope.biggestStrength}
Blind Spot: ${horoscope.blindSpot}

Current Score
${totalScore}/100 — ${reportRating}

Biggest Opportunity
${reportStory.featuredOpportunity.title}
${reportStory.featuredOpportunity.currentSituation}
Expected Outcome: ${executiveSummary.expectedOutcome}

Fastest Win
${horoscope.fastestWin}

48-Hour Sprint
${sprintSummary}

One Month Roadmap
${monthSummary}

Prepared by: ${preparedBy}, ${brandName}${contact}
Date: ${reportDate}

Executive Score Detail
${categoryScores}

${formatScoreDiagnosticsText(visualDiagnostics.scores)}

${formatEvidenceDiagnosticText(visualDiagnostics.evidence)}

${formatStrategicAssetsText(reportStory.strategicAssets)}

${formatFeaturedOpportunityText(reportStory.featuredOpportunity)}

${formatOpportunityMatrixText(visualDiagnostics.opportunityMatrix)}

${formatActionStatusText(actions)}

${formatMomentumTimelineText(visualDiagnostics.momentumTimeline)}

${formatProgressJourneyText(progressJourney)}
${evidenceSection}

${formatImplementationPathsText()}

${formatOfferAndCtaText(offer)}

${preliminarySection}
Snapshot Studio
Powered by UpgradeOS
${upgradeOsSupportingText}

Generate your own Snapshot Studio report.`
}

function formatDate(value: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function downloadCsv(filename: string, leads: Lead[]) {
  const blob = new Blob([leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function App() {
  const [form, setForm] = useState<SnapshotForm>(emptyForm)
  const [branding, setBranding] = useState<BrandingFields>(defaultBranding)
  const [reportOffer, setReportOffer] = useState<ReportOfferFields>(defaultReportOffer)
  const [scores, setScores] = useState<Scores>(emptyScores)
  const [foundationDraft, setFoundationDraft] = useState(() => createGrowthFoundation(emptyScores))
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() => loadSnapshots())
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads())
  const [leadDraft, setLeadDraft] = useState<LeadInput>(emptyLeadInput)
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [savedIntakes, setSavedIntakes] = useState<BusinessIntakePayload[]>(
    () => loadIntakeDrafts(),
  )
  const [intake, setIntake] = useState<BusinessIntakePayload>(
    () => createEmptyBusinessIntake(),
  )
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState<ParsedLead[]>([])
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'All'>('All')
  const [nicheFilter, setNicheFilter] = useState('All')
  const [leadSearch, setLeadSearch] = useState('')
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [storageMessage, setStorageMessage] = useState('')
  const [hasUnsavedProgress, setHasUnsavedProgress] = useState(false)
  const [intakeStorageMessage, setIntakeStorageMessage] = useState('')
  const [proposalCreationRequest, setProposalCreationRequest] = useState<ProposalCreationRequest>()
  const [proposalFocusRequest, setProposalFocusRequest] = useState<ProposalFocusRequest>()
  const [fastLaneLaunchRequest, setFastLaneLaunchRequest] = useState<FastLaneLaunchRequest>()
  const [contestDemoInstalled, setContestDemoInstalled] = useState(
    () => isContestDemoInstalled(),
  )
  const [contestDemoMessage, setContestDemoMessage] = useState('')
  const [contestDataRevision, setContestDataRevision] = useState(0)
  const [demoTourRestartNonce, setDemoTourRestartNonce] = useState(0)
  const [interactionMessage, setInteractionMessage] = useState('')

  const totalScore = useMemo(() => getTotalScore(scores), [scores])
  const rating = getRatingLabel(totalScore)
  const reportRating = getReportRating(totalScore)
  const reportDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )
  const horoscope = useMemo(
    () => buildBusinessHoroscope(form, scores, totalScore),
    [form, scores, totalScore],
  )
  const outputs = useMemo(
    () => generateOutputs(form, scores, totalScore),
    [form, scores, totalScore],
  )
  const plannedActions = useMemo(
    () => planRecommendations({
      form,
      scores,
      existingActions: foundationDraft.recommendedActions,
    }),
    [form, foundationDraft.recommendedActions, scores],
  )
  const growthFoundation = useMemo(() => {
    const refreshed = refreshGrowthFoundation(scores, foundationDraft)
    return {
      ...refreshed,
      recommendedActions: plannedActions,
    }
  }, [foundationDraft, plannedActions, scores])
  const reportEvidence = useMemo(
    () => getReportEvidence(
      growthFoundation.evidenceItems,
      growthFoundation.includeIncompleteEvidence,
    ),
    [growthFoundation.evidenceItems, growthFoundation.includeIncompleteEvidence],
  )
  const reportReadiness = useMemo(
    () => getReportReadiness({
      form,
      scores,
      offer: reportOffer,
      reportEvidenceCount: reportEvidence.length,
    }),
    [form, reportEvidence.length, reportOffer, scores],
  )
  const roadmap = useMemo(
    () => createConsultingRoadmap(growthFoundation.recommendedActions),
    [growthFoundation.recommendedActions],
  )
  const reportStory = useMemo(
    () => createReportStory({
      form,
      scores,
      actions: roadmap.priorityMatrix,
      evidenceItems: reportEvidence,
      operatorStrengths: growthFoundation.operatorDraftAppliedAt
        ? growthFoundation.strengths
        : undefined,
      operatorOpportunity: growthFoundation.operatorDraftAppliedAt
        ? growthFoundation.visibilityLeaks[0]
        : undefined,
    }),
    [
      form,
      growthFoundation.strengths,
      growthFoundation.visibilityLeaks,
      growthFoundation.operatorDraftAppliedAt,
      reportEvidence,
      roadmap.priorityMatrix,
      scores,
    ],
  )
  const progressJourney = useMemo(
    () => createProgressJourneyModel(growthFoundation),
    [growthFoundation],
  )
  const executiveSummary = useMemo(
    () => createExecutiveSummary({
      form,
      opportunity: reportStory.featuredOpportunity,
      progress: progressJourney,
      roadmap,
    }),
    [form, progressJourney, reportStory.featuredOpportunity, roadmap],
  )
  const visualDiagnostics = useMemo(
    () => createVisualDiagnostics({
      scores,
      actions: growthFoundation.recommendedActions,
      evidenceItems: growthFoundation.evidenceItems,
      progress: progressJourney,
      roadmap,
    }),
    [
      growthFoundation.evidenceItems,
      growthFoundation.recommendedActions,
      progressJourney,
      roadmap,
      scores,
    ],
  )
  const evidenceText = useMemo(
    () => formatEvidenceReportText(reportEvidence, growthFoundation.recommendedActions),
    [growthFoundation.recommendedActions, reportEvidence],
  )
  const reportText = useMemo(
    () => buildReportText({
      form,
      branding,
      offer: reportOffer,
      totalScore,
      reportRating,
      reportDate,
      horoscope,
      scores,
      reportStory,
      executiveSummary,
      visualDiagnostics,
      actions: growthFoundation.recommendedActions,
      progressJourney,
      evidenceText,
    }),
    [
      branding,
      reportOffer,
      evidenceText,
      executiveSummary,
      form,
      growthFoundation.recommendedActions,
      horoscope,
      progressJourney,
      reportStory,
      reportDate,
      reportRating,
      scores,
      totalScore,
      visualDiagnostics,
    ],
  )
  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeLeadId) ?? null,
    [activeLeadId, leads],
  )
  const proposalSnapshots = useMemo(() => {
    if (!loadedId) return savedSnapshots
    const loadedSnapshot = savedSnapshots.find((snapshot) => snapshot.id === loadedId)
    if (!loadedSnapshot) return savedSnapshots
    const openSnapshot: SavedSnapshot = {
      ...loadedSnapshot,
      recommendedActions: growthFoundation.recommendedActions,
      actionStatusHistory: growthFoundation.actionStatusHistory,
    }
    return savedSnapshots.map((snapshot) =>
      snapshot.id === loadedId ? openSnapshot : snapshot,
    )
  }, [
    growthFoundation.actionStatusHistory,
    growthFoundation.recommendedActions,
    loadedId,
    savedSnapshots,
  ])
  const nicheOptions = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.niche).filter(Boolean))).sort(),
    [leads],
  )
  const filteredLeads = useMemo(() => {
    const query = leadSearch.trim().toLowerCase()

    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter
      const matchesNiche = nicheFilter === 'All' || lead.niche === nicheFilter
      const searchable = `${lead.businessName} ${lead.city} ${lead.niche}`.toLowerCase()
      return matchesStatus && matchesPriority && matchesNiche && searchable.includes(query)
    })
  }, [leadSearch, leads, nicheFilter, priorityFilter, statusFilter])
  const leadStats = useMemo(
    () => ({
      total: leads.length,
      sent: leads.filter((lead) => lead.status === 'Sent').length,
      replies: leads.filter((lead) => lead.status === 'Replied' || lead.status === 'Call booked').length,
      paid: leads.filter((lead) => lead.status === 'Paid').length,
    }),
    [leads],
  )

  function updateField<K extends keyof SnapshotForm>(field: K, value: SnapshotForm[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateBranding<K extends keyof BrandingFields>(field: K, value: BrandingFields[K]) {
    setBranding((current) => ({ ...current, [field]: value }))
  }

  function updateReportOffer<K extends keyof ReportOfferFields>(
    field: K,
    value: ReportOfferFields[K],
  ) {
    setReportOffer((current) => ({ ...current, [field]: value }))
  }

  function updateScore(field: ScoreKey, value: number) {
    setScores((current) => ({ ...current, [field]: value }))
  }

  function updateEvidenceLayer(
    evidenceItems: EvidenceItem[],
    actions: RecommendedAction[],
  ) {
    setFoundationDraft({
      ...growthFoundation,
      evidenceItems,
      recommendedActions: actions.map((action) => ({
        ...action,
        linkedEvidence: action.linkedEvidenceIds,
      })),
    })
    setStorageMessage('Evidence draft updated. Save the snapshot to keep it after refresh.')
  }

  function applyActionStatuses(
    actionIds: string[],
    newStatus: RecommendedActionStatus,
  ) {
    const targetIds = new Set(actionIds)
    const targetActions = growthFoundation.recommendedActions.filter(
      (action) => targetIds.has(action.id) && action.status !== newStatus,
    )
    if (targetActions.length === 0) {
      setStorageMessage('No action status changes were needed.')
      return false
    }

    const blockers = Array.from(new Map(
      targetActions.flatMap((action) =>
        getBlockingActions(action, growthFoundation.recommendedActions)
          .filter((blocker) => !(newStatus === 'Completed' && targetIds.has(blocker.id))),
      ).map((blocker) => [blocker.id, blocker]),
    ).values())
    if (
      blockers.length > 0
      && requiresDependencyOverride(newStatus)
      && !window.confirm(
        'This action is blocked by unfinished work: '
          + blockers.map((blocker) => blocker.title).join('; ')
          + '. Update the selected status anyway? Dependencies will remain unchanged.',
      )
    ) {
      return false
    }

    const changedAt = new Date().toISOString()
    const changes: ActionStatusChange[] = targetActions.map((action) => ({
      actionId: action.id,
      previousStatus: action.status,
      newStatus,
      changedAt,
    }))
    setFoundationDraft({
      ...growthFoundation,
      recommendedActions: growthFoundation.recommendedActions.map((action) =>
        targetIds.has(action.id) ? { ...action, status: newStatus } : action,
      ),
      actionStatusHistory: appendActionStatusHistory(
        growthFoundation.actionStatusHistory,
        changes,
      ),
    })
    setHasUnsavedProgress(true)
    setStorageMessage('Unsaved progress changes')
    return true
  }

  function updateActionStatus(
    actionId: string,
    status: RecommendedActionStatus,
  ) {
    applyActionStatuses([actionId], status)
  }

  function startNextAction() {
    const nextAction = getNextMilestone(growthFoundation.recommendedActions)
    if (!nextAction) {
      setStorageMessage('No unblocked action is available to start.')
      return
    }
    applyActionStatuses([nextAction.id], 'In Progress')
  }

  function completeNextAction() {
    const nextAction = getNextMilestone(growthFoundation.recommendedActions)
    if (!nextAction) {
      setStorageMessage('No unblocked action is available to complete.')
      return
    }
    applyActionStatuses([nextAction.id], 'Completed')
  }

  function resetActionStatuses() {
    const changedActions = growthFoundation.recommendedActions.filter(
      (action) => action.status !== 'Not Started',
    )
    if (changedActions.length === 0) {
      setStorageMessage('All action statuses are already reset.')
      return
    }
    if (!window.confirm(
      'Reset every action to Not Started? Evidence links and recommendations will remain unchanged.',
    )) return
    applyActionStatuses(
      changedActions.map((action) => action.id),
      'Not Started',
    )
  }

  function completeSprintPhase(phaseNumber: 1 | 2) {
    const phase = roadmap.sprint.find((item) => item.day === phaseNumber)
    if (!phase || phase.actionIds.length === 0) {
      setStorageMessage(`Sprint step ${phaseNumber} has no assigned action.`)
      return
    }
    applyActionStatuses(phase.actionIds, 'Completed')
  }

  function updateIncludeIncompleteEvidence(includeIncompleteEvidence: boolean) {
    setFoundationDraft({
      ...growthFoundation,
      includeIncompleteEvidence,
    })
  }

  function viewActionEvidence(actionId: string) {
    const evidence = getEvidenceForAction(actionId, reportEvidence)[0]
      ?? getEvidenceForAction(actionId, growthFoundation.evidenceItems)[0]
    if (!evidence) return

    const target = document.getElementById('evidence-' + evidence.id)
      ?? document.getElementById('evidence-manager-item-' + evidence.id)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function updateLeadDraft<K extends keyof LeadInput>(field: K, value: LeadInput[K]) {
    setLeadDraft((current) => ({ ...current, [field]: value }))
  }

  function updateLeadList(nextLeads: Lead[]) {
    try {
      setLeads(persistLeads(nextLeads))
      setInteractionMessage('')
    } catch (error) {
      setLeads(nextLeads)
      setInteractionMessage(
        isStorageQuotaError(error)
          ? 'Browser storage is full. Lead changes remain open for this session but will not survive a refresh until space is cleared.'
          : 'Lead changes remain open in this tab, but browser storage is unavailable. Keep the tab open and try saving again before refreshing.',
      )
    }
  }

  function updateIntakeDraft(nextIntake: BusinessIntakePayload) {
    setIntake(nextIntake)
    setIntakeStorageMessage('')
  }

  function handleSaveIntake(intakeToSave: BusinessIntakePayload = intake) {
    const associatedIntake: BusinessIntakePayload = {
      ...intakeToSave,
      linkedLeadId: intakeToSave.linkedLeadId || activeLeadId || undefined,
      linkedSnapshotId: loadedId || intakeToSave.linkedSnapshotId,
      updatedAt: new Date().toISOString(),
    }

    try {
      const nextIntakes = saveIntakeDraft(associatedIntake)
      const savedIntake = nextIntakes.find((saved) => saved.id === associatedIntake.id)
        || associatedIntake
      setSavedIntakes(nextIntakes)
      setIntake(savedIntake)
      setIntakeStorageMessage('Intake saved in this browser.')
    } catch (error) {
      setIntakeStorageMessage(
        isStorageQuotaError(error)
          ? 'Browser storage is full. Remove large evidence screenshots or an old intake, then try again.'
          : 'Intake could not be saved. The current in-memory draft is still open.',
      )
    }
  }

  function handleResumeIntake(intakeId: string) {
    const savedIntake = savedIntakes.find((saved) => saved.id === intakeId)
    if (!savedIntake) return
    const linkedSnapshot = savedIntake.linkedSnapshotId
      ? savedSnapshots.find((snapshot) => snapshot.id === savedIntake.linkedSnapshotId)
      : undefined
    if (linkedSnapshot) {
      handleLoadSnapshot(linkedSnapshot)
      setIntakeStorageMessage('Saved intake and its associated snapshot resumed.')
      return
    }
    setIntake(savedIntake)
    if (savedIntake.linkedLeadId) setActiveLeadId(savedIntake.linkedLeadId)
    setIntakeStorageMessage('Saved intake resumed.')
  }

  function handleClearIntake() {
    try {
      setSavedIntakes(deleteIntakeDraft(intake.id))
    } catch {
      setSavedIntakes((current) => current.filter((saved) => saved.id !== intake.id))
    }
    setIntake(createEmptyBusinessIntake())
    setIntakeStorageMessage('Intake cleared. Existing snapshots and evidence were not changed.')
  }

  function handleUseLeadDetailsForIntake() {
    if (!activeLead) return
    const normalizedWebsite = normalizeWebsiteUrl(activeLead.websiteUrl)
    setIntake((current) => ({
      ...current,
      linkedLeadId: activeLead.id,
      updatedAt: new Date().toISOString(),
      identity: {
        ...current.identity,
        businessName: activeLead.businessName,
        websiteUrlRaw: activeLead.websiteUrl,
        websiteUrlNormalized: normalizedWebsite.valid ? normalizedWebsite.normalized : '',
        city: activeLead.city,
        niche: activeLead.niche,
        primaryService: activeLead.mainService,
        phone: activeLead.phone,
        email: activeLead.email,
        contactFormUrl: activeLead.contactFormUrl,
      },
    }))
    setIntakeStorageMessage('Selected lead details copied into the intake.')
  }

  function handleApplyDraft(application: DraftApplication) {
    if (application.formPatch) {
      setForm((current) => ({ ...current, ...application.formPatch }))
    }
    if (application.scorePatch) {
      setScores((current) => normalizeScores({ ...current, ...application.scorePatch }))
    }
    if (application.reportOfferPatch) {
      setReportOffer((current) => ({ ...current, ...application.reportOfferPatch }))
    }
    if (application.strengths || application.visibilityLeaks) {
      setFoundationDraft((current) => ({
        ...current,
        strengths: application.strengths ?? current.strengths,
        visibilityLeaks: application.visibilityLeaks ?? current.visibilityLeaks,
        operatorDraftAppliedAt: new Date().toISOString(),
      }))
    }
    if (application.outreachAngle && activeLeadId) {
      updateLeadList(
        leads.map((lead) => lead.id === activeLeadId
          ? { ...lead, suggestedAngle: application.outreachAngle || lead.suggestedAngle }
          : lead),
      )
    }
    setStorageMessage('Approved intake draft values applied. Save the snapshot to keep them.')
  }

  function openEvidenceManager(evidenceId?: string) {
    window.setTimeout(() => {
      const item = evidenceId
        ? document.getElementById('evidence-manager-item-' + evidenceId)
        : null
      const toggle = item?.querySelector<HTMLButtonElement>('.evidence-expand-button')
      if (toggle?.getAttribute('aria-expanded') === 'false') toggle.click()
      const target = item || document.getElementById('evidence-manager-title')
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  function createObservationEvidence(
    observation: WebsiteExtractionObservation,
    sentiment: EvidenceSentiment,
    caption?: string,
  ) {
    const base = createEvidenceItem()
    const normalizedSourceUrl = normalizeWebsiteUrl(intake.identity.websiteUrlRaw)
    const item: EvidenceItem = {
      ...base,
      evidenceType: 'Website',
      sentiment,
      title: observation.kind + ': ' + observation.text.slice(0, 72),
      sourceUrl: normalizedSourceUrl.valid ? normalizedSourceUrl.normalized : '',
      pageLabel: 'Operator-pasted page text',
      observation: observation.text,
      beforeCaption: caption,
      intakeDraftId: intake.id,
      intakeObservationId: observation.id,
    }
    setFoundationDraft({
      ...growthFoundation,
      evidenceItems: [...growthFoundation.evidenceItems, item],
    })
    return item.id
  }

  function createBlankIntakeEvidence() {
    const normalizedSourceUrl = normalizeWebsiteUrl(intake.identity.websiteUrlRaw)
    const item: EvidenceItem = {
      ...createEvidenceItem(),
      title: 'Intake screenshot',
      sourceUrl: normalizedSourceUrl.valid ? normalizedSourceUrl.normalized : '',
      pageLabel: 'Operator intake',
      intakeDraftId: intake.id,
    }
    setFoundationDraft({
      ...growthFoundation,
      evidenceItems: [...growthFoundation.evidenceItems, item],
    })
    return item.id
  }

  function updateWorkspaceEvidenceSentiment(
    evidenceId: string,
    sentiment: EvidenceSentiment,
  ) {
    setFoundationDraft({
      ...growthFoundation,
      evidenceItems: growthFoundation.evidenceItems.map((item) =>
        item.id === evidenceId
          ? { ...item, sentiment, updatedAt: new Date().toISOString() }
          : item,
      ),
    })
  }

  async function copyText(label: string, text: string) {
    if (!navigator.clipboard?.writeText) {
      setInteractionMessage('Clipboard access is unavailable in this browser. Select the text and copy it manually.')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(label)
      setInteractionMessage('')
      window.setTimeout(() => setCopiedKey(null), 1600)
    } catch {
      setInteractionMessage('Clipboard permission was denied. Select the text and copy it manually.')
    }
  }

  function printReport() {
    if (typeof window.print !== 'function') {
      setInteractionMessage('Print / Save PDF is unavailable in this browser. Open the app in a desktop browser with printing enabled.')
      return
    }
    setInteractionMessage('')
    window.print()
  }

  function copyAllOutputs() {
    const allOutputs = outputLabels
      .map(({ key, title }) => `${title}\n\n${outputs[key]}`)
      .join('\n\n---\n\n')

    void copyText('all', allOutputs)
  }

  function handleSaveSnapshot(): SavedSnapshot | null {
    const now = new Date().toISOString()
    const existingSnapshot = loadedId
      ? savedSnapshots.find((snapshot) => snapshot.id === loadedId)
      : undefined
    const snapshot: SavedSnapshot = {
      ...(existingSnapshot ?? {}),
      ...form,
      ...growthFoundation,
      ...reportOffer,
      id: loadedId ?? crypto.randomUUID(),
      createdAt: now,
      scores,
      outputs,
      branding,
    }

    try {
      setSavedSnapshots(saveSnapshot(snapshot))
      setLoadedId(snapshot.id)
      setFoundationDraft(growthFoundation)
      setHasUnsavedProgress(false)
      setStorageMessage('Snapshot saved in this browser.')
    } catch (error) {
      setStorageMessage(
        isStorageQuotaError(error)
          ? 'Browser storage is full. Remove or replace large screenshots, then save again.'
          : 'Snapshot could not be saved in this browser. Your current draft is still open.',
      )
      return null
    }

    if (activeLeadId) {
      updateLeadList(
        leads.map((lead) =>
          lead.id === activeLeadId
            ? {
                ...lead,
                linkedSnapshotId: snapshot.id,
                status: lead.status === 'Not reviewed' ? 'Snapshot made' : lead.status,
              }
            : lead,
        ),
      )
    }

    const hasIntakeContent = Boolean(
      intake.identity.businessName.trim()
      || intake.identity.websiteUrlRaw.trim()
      || intake.website.pageText.trim()
      || intake.draft,
    )
    if (hasIntakeContent) {
      const linkedIntake: BusinessIntakePayload = {
        ...intake,
        linkedLeadId: intake.linkedLeadId || activeLeadId || undefined,
        linkedSnapshotId: snapshot.id,
        updatedAt: new Date().toISOString(),
      }
      try {
        const nextIntakes = saveIntakeDraft(linkedIntake)
        setSavedIntakes(nextIntakes)
        setIntake(
          nextIntakes.find((saved) => saved.id === linkedIntake.id) || linkedIntake,
        )
        setIntakeStorageMessage('Intake saved and linked to this snapshot.')
      } catch {
        setIntakeStorageMessage(
          'Snapshot saved, but its intake association could not be stored.',
        )
      }
    }

    return snapshot
  }

  function requestProposal(snapshot: SavedSnapshot, lead?: Lead) {
    setProposalCreationRequest({ nonce: Date.now(), snapshot, lead })
  }

  function handleCreateProposal() {
    const snapshot = handleSaveSnapshot()
    if (!snapshot) return
    requestProposal(snapshot, activeLead || undefined)
  }

  function handleLoadSnapshot(snapshot: SavedSnapshot) {
    setForm({
      businessName: snapshot.businessName,
      websiteUrl: snapshot.websiteUrl,
      city: snapshot.city,
      niche: snapshot.niche,
      mainService: snapshot.mainService,
      notes: snapshot.notes,
      weakness: snapshot.weakness,
      competitorNote: snapshot.competitorNote || '',
      competitorUrl1: snapshot.competitorUrl1 || '',
      competitorUrl2: snapshot.competitorUrl2 || '',
      tone: normalizeToneValue(snapshot.tone),
      ctaStyle: snapshot.ctaStyle,
    })
    setBranding(snapshot.branding ?? defaultBranding)
    setReportOffer({
      offerMode: snapshot.offerMode,
      fixedPrice: snapshot.fixedPrice,
      currency: snapshot.currency,
      customInvestmentText: snapshot.customInvestmentText,
      ctaHeadline: snapshot.ctaHeadline,
      ctaBody: snapshot.ctaBody,
      ctaLabel: snapshot.ctaLabel,
      ctaContactLine: snapshot.ctaContactLine,
      bookingUrl: snapshot.bookingUrl,
    })
    setScores(normalizeScores(snapshot.scores))
    setFoundationDraft(refreshGrowthFoundation(normalizeScores(snapshot.scores), snapshot))
    setHasUnsavedProgress(false)
    setLoadedId(snapshot.id)
    const associatedIntake = savedIntakes.find(
      (saved) => saved.linkedSnapshotId === snapshot.id,
    )
    if (associatedIntake) {
      setIntake(associatedIntake)
      if (associatedIntake.linkedLeadId) setActiveLeadId(associatedIntake.linkedLeadId)
      setIntakeStorageMessage('Associated intake resumed with this snapshot.')
    } else {
      setIntake((current) => ({ ...current, appliedAt: undefined }))
      setIntakeStorageMessage('No saved intake is associated with this snapshot.')
    }
    setStorageMessage(
      'Loaded ' + snapshot.evidenceItems.length + ' evidence item'
        + (snapshot.evidenceItems.length === 1 ? '.' : 's.'),
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDeleteSnapshot(snapshotId: string) {
    setSavedSnapshots(deleteSnapshot(snapshotId))
    if (loadedId === snapshotId) {
      setLoadedId(null)
    }
  }

  function handleNewSnapshot() {
    setForm(emptyForm)
    setBranding(defaultBranding)
    setReportOffer(defaultReportOffer)
    setScores(emptyScores)
    setFoundationDraft(createGrowthFoundation(emptyScores))
    setIntake(createEmptyBusinessIntake())
    setIntakeStorageMessage('Started a new intake for the new snapshot.')
    setLoadedId(null)
    setHasUnsavedProgress(false)
    setStorageMessage('Started a new snapshot. Evidence from the previous snapshot was not reused.')
    setActiveLeadId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmitLead() {
    const existingLead = editingLeadId ? leads.find((lead) => lead.id === editingLeadId) : null
    const nextLead = createLead({
      ...leadDraft,
      id: existingLead?.id,
      createdAt: existingLead?.createdAt,
    })

    if (editingLeadId) {
      updateLeadList(leads.map((lead) => (lead.id === editingLeadId ? nextLead : lead)))
    } else {
      setLeads(saveLead(nextLead))
    }

    setLeadDraft(emptyLeadInput)
    setEditingLeadId(null)
  }

  function handleEditLead(lead: Lead) {
    setLeadDraft({
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      city: lead.city,
      niche: lead.niche,
      mainService: lead.mainService,
      phone: lead.phone,
      email: lead.email,
      contactFormUrl: lead.contactFormUrl,
      leadSource: lead.leadSource,
      priority: lead.priority,
      researchNotes: lead.researchNotes,
      suggestedAngle: lead.suggestedAngle,
      status: lead.status,
      lastContactedAt: lead.lastContactedAt,
      linkedSnapshotId: lead.linkedSnapshotId,
      lastContactRoute: lead.lastContactRoute,
      nextFollowUpDate: lead.nextFollowUpDate,
      outreachActivity: lead.outreachActivity,
    })
    setEditingLeadId(lead.id)
  }

  function handleDeleteLead(leadId: string) {
    updateLeadList(leads.filter((lead) => lead.id !== leadId))
    if (editingLeadId === leadId) {
      setEditingLeadId(null)
      setLeadDraft(emptyLeadInput)
    }
    if (activeLeadId === leadId) {
      setActiveLeadId(null)
    }
  }

  function handleUseLead(lead: Lead) {
    setForm((current) => ({
      ...current,
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      city: lead.city,
      niche: lead.niche,
      mainService: lead.mainService,
      notes: lead.researchNotes,
      weakness: lead.suggestedAngle,
    }))
    setActiveLeadId(lead.id)
    window.setTimeout(() => {
      document.getElementById('operator-workspace')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function handleLeadStatus(leadId: string, status: LeadStatus) {
    updateLeadList(leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)))
  }

  function handleMarkSent(leadId: string) {
    updateLeadList(
      leads.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: 'Sent', lastContactedAt: new Date().toISOString() }
          : lead,
      ),
    )
  }

  function leadIntake(leadId: string) {
    return savedIntakes
      .filter((saved) => saved.linkedLeadId === leadId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  }

  function formFromLeadAndIntake(
    lead?: Lead,
    sourceIntake?: BusinessIntakePayload,
  ): SnapshotForm {
    const identity = sourceIntake?.identity
    return {
      ...emptyForm,
      businessName: identity?.businessName || lead?.businessName || '',
      websiteUrl: identity?.websiteUrlNormalized || identity?.websiteUrlRaw || lead?.websiteUrl || '',
      city: identity?.city || lead?.city || '',
      niche: identity?.niche || lead?.niche || '',
      mainService: identity?.primaryService || lead?.mainService || '',
      notes: lead?.researchNotes || '',
      weakness: lead?.suggestedAngle || '',
    }
  }

  function intakeFromLead(lead?: Lead) {
    const next = createEmptyBusinessIntake({ linkedLeadId: lead?.id })
    if (!lead) return next
    const normalizedWebsite = normalizeWebsiteUrl(lead.websiteUrl)
    return {
      ...next,
      identity: {
        ...next.identity,
        businessName: lead.businessName,
        websiteUrlRaw: lead.websiteUrl,
        websiteUrlNormalized: normalizedWebsite.valid ? normalizedWebsite.normalized : '',
        city: lead.city,
        niche: lead.niche,
        primaryService: lead.mainService,
        phone: lead.phone,
        email: lead.email,
        contactFormUrl: lead.contactFormUrl,
      },
    }
  }

  function cloneFastLaneIntake(
    sourceIntake: BusinessIntakePayload,
    leadId?: string,
  ): BusinessIntakePayload {
    const now = new Date().toISOString()
    return {
      ...sourceIntake,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      linkedLeadId: leadId || sourceIntake.linkedLeadId,
      linkedSnapshotId: undefined,
      appliedAt: undefined,
      observationClassifications: { ...sourceIntake.observationClassifications },
      observationEvidenceLinks: {},
      competitorContext: {
        ...sourceIntake.competitorContext,
        competitors: sourceIntake.competitorContext.competitors.map(
          (competitor) => ({ ...competitor }),
        ) as BusinessIntakePayload['competitorContext']['competitors'],
      },
    }
  }

  function handleFastLaneActivateSource(
    source: FastLaneSource,
    fresh: boolean,
    session?: FastLaneSession,
  ) {
    const selectedLead = (session?.leadId
      ? leads.find((lead) => lead.id === session.leadId)
      : undefined)
      || (source.type === 'lead' ? leads.find((lead) => lead.id === source.id) : undefined)
    const selectedIntake = (session?.intakeId
      ? savedIntakes.find((saved) => saved.id === session.intakeId)
      : undefined)
      || (source.type === 'intake'
        ? savedIntakes.find((saved) => saved.id === source.id)
        : selectedLead ? leadIntake(selectedLead.id) : undefined)
    const selectedSnapshot = (session?.snapshotId
      ? savedSnapshots.find((snapshot) => snapshot.id === session.snapshotId)
      : undefined)
      || (source.type === 'snapshot'
        ? savedSnapshots.find((snapshot) => snapshot.id === source.id)
        : savedSnapshots.find((snapshot) =>
            snapshot.id === selectedLead?.linkedSnapshotId
            || snapshot.id === selectedIntake?.linkedSnapshotId,
          ))
    const associatedLead = selectedLead
      || leads.find((lead) => lead.id === selectedIntake?.linkedLeadId)
      || leads.find((lead) => lead.linkedSnapshotId === selectedSnapshot?.id)

    if (selectedSnapshot) {
      handleLoadSnapshot(selectedSnapshot)
      if (associatedLead) setActiveLeadId(associatedLead.id)
      if (fresh && !session?.snapshotId) {
        setLoadedId(null)
        setIntake(selectedIntake
          ? session?.intakeId
            ? selectedIntake
            : cloneFastLaneIntake(selectedIntake, associatedLead?.id)
          : intakeFromLead(associatedLead))
        setStorageMessage('New Fast Lane version opened in memory. Save Snapshot creates the new version.')
      }
      return
    }

    const nextIntake = fresh && selectedIntake && !session?.intakeId
      ? cloneFastLaneIntake(selectedIntake, associatedLead?.id)
      : selectedIntake || intakeFromLead(associatedLead)
    setForm(formFromLeadAndIntake(associatedLead, nextIntake))
    setBranding(defaultBranding)
    setReportOffer(defaultReportOffer)
    setScores(emptyScores)
    setFoundationDraft(createGrowthFoundation(emptyScores))
    setIntake(nextIntake)
    setLoadedId(null)
    setHasUnsavedProgress(false)
    setActiveLeadId(associatedLead?.id || null)
    setStorageMessage(
      fresh
        ? 'New Fast Lane version opened. Existing records remain unchanged.'
        : associatedLead || selectedIntake
          ? 'Fast Lane source loaded without creating a duplicate.'
          : 'Blank Fast Lane workflow opened.',
    )
  }

  function handleFastLaneSaveLead(
    draft: FastLaneSession['leadDraft'],
    leadId?: string,
  ) {
    const existing = leadId ? leads.find((lead) => lead.id === leadId) : undefined
    const nextLead = createLead({
      ...emptyLeadInput,
      ...(existing || {}),
      ...draft,
      id: existing?.id,
      createdAt: existing?.createdAt,
    })
    updateLeadList([nextLead, ...leads.filter((lead) => lead.id !== nextLead.id)])
    setActiveLeadId(nextLead.id)
    if (!loadedId) {
      setForm((current) => ({
        ...current,
        businessName: nextLead.businessName,
        websiteUrl: nextLead.websiteUrl,
        city: nextLead.city,
        niche: nextLead.niche,
        mainService: nextLead.mainService,
      }))
    }
    return nextLead
  }

  function handleFastLaneMarkSent(input: FastLaneMarkSentInput) {
    const existing = input.leadId
      ? leads.find((lead) => lead.id === input.leadId)
      : undefined
    const outreachEntry = {
      id: crypto.randomUUID(),
      type: 'Outreach sent' as const,
      occurredAt: input.contactedAt,
      contactRoute: input.route,
      followUpDate: input.followUpDate,
      includedSnapshot: true,
      includedProposal: input.proposalIncluded,
    }
    const followUpEntry = input.followUpDate ? [{
      id: crypto.randomUUID(),
      type: 'Follow-up scheduled' as const,
      occurredAt: input.contactedAt,
      contactRoute: input.route,
      followUpDate: input.followUpDate,
      includedSnapshot: true,
      includedProposal: input.proposalIncluded,
    }] : []
    const nextLead = createLead({
      ...emptyLeadInput,
      ...(existing || {}),
      ...input.leadDraft,
      id: existing?.id,
      createdAt: existing?.createdAt,
      status: 'Sent',
      lastContactedAt: input.contactedAt,
      lastContactRoute: input.route,
      nextFollowUpDate: input.followUpDate || '',
      linkedSnapshotId: input.snapshotId,
      outreachActivity: [
        ...(existing?.outreachActivity || []),
        outreachEntry,
        ...followUpEntry,
      ].slice(-50),
    })
    updateLeadList([nextLead, ...leads.filter((lead) => lead.id !== nextLead.id)])
    setActiveLeadId(nextLead.id)
    return nextLead
  }

  function openProposalFromFastLane(proposalId: string, print = false) {
    setProposalFocusRequest({ nonce: Date.now(), proposalId, print })
  }

  function handleParseImport() {
    setImportPreview(parseLeadTable(importText))
  }

  function handleToggleImportLead(importId: string) {
    setImportPreview((current) =>
      current.map((lead) =>
        lead.importId === importId ? { ...lead, selected: !lead.selected } : lead,
      ),
    )
  }

  function handleImportLeads() {
    const selectedLeads = importPreview.filter((lead) => lead.selected).map(createLead)
    if (selectedLeads.length === 0) return

    updateLeadList([...selectedLeads, ...leads])
    setImportPreview([])
    setImportText('')
  }

  function loadContestDemo(startTour: 'if-new' | 'always' = 'if-new') {
    try {
      const existingDemo = getContestDemoData()
      const data = existingDemo
        ? refreshContestDemoClientCopy(existingDemo)
        : installContestDemo()
      const nextLeads = loadLeads()
      const nextIntakes = loadIntakeDrafts()
      const nextSnapshots = loadSnapshots()
      setLeads(nextLeads)
      setSavedIntakes(nextIntakes)
      setSavedSnapshots(nextSnapshots)
      handleLoadSnapshot(
        nextSnapshots.find((snapshot) => snapshot.id === data.snapshot.id) || data.snapshot,
      )
      setIntake(nextIntakes.find((saved) => saved.id === data.intake.id) || data.intake)
      setActiveLeadId(data.lead.id)
      setStatusFilter('All')
      setPriorityFilter('All')
      setNicheFilter('All')
      setLeadSearch('')
      setIntakeStorageMessage('Starter Workspace intake loaded with reviewed deterministic draft inputs.')
      setContestDemoInstalled(true)
      setContestDataRevision((current) => current + 1)
      setFastLaneLaunchRequest({ nonce: Date.now(), leadId: data.lead.id })
      setContestDemoMessage(
        existingDemo
          ? 'Starter Workspace resumed from its existing browser-local progress. Use Reset Starter Workspace to restore the original reviewed state.'
          : 'Starter Workspace loaded: the reviewed Snapshot, live roadmap, ready proposal, and Send Kit are linked under stable records.',
      )
      if (startTour === 'always' || !isDemoTourDismissed()) {
        setDemoTourRestartNonce((current) => current + 1)
      }
    } catch (error) {
      setContestDemoMessage(
        isStorageQuotaError(error)
          ? 'Starter Workspace could not be loaded because browser storage is full. Remove a large screenshot or old local record, then try again.'
          : 'Starter Workspace could not be loaded. Existing operator data was left in place; refresh and try again.',
      )
    }
  }

  function handleResetContestDemo() {
    if (!window.confirm('Restore the Starter Workspace to its original state? Its linked records will be replaced; every other lead, Snapshot, evidence item, proposal, and session will remain.')) return
    try {
      const data = resetContestDemo()
      const nextLeads = loadLeads()
      const nextIntakes = loadIntakeDrafts()
      const nextSnapshots = loadSnapshots()
      setLeads(nextLeads)
      setSavedIntakes(nextIntakes)
      setSavedSnapshots(nextSnapshots)
      handleLoadSnapshot(
        nextSnapshots.find((snapshot) => snapshot.id === data.snapshot.id) || data.snapshot,
      )
      setIntake(nextIntakes.find((saved) => saved.id === data.intake.id) || data.intake)
      setActiveLeadId(data.lead.id)
      setStatusFilter('All')
      setPriorityFilter('All')
      setNicheFilter('All')
      setLeadSearch('')
      setIntakeStorageMessage('Starter Workspace intake restored with its reviewed deterministic draft.')
      setProposalCreationRequest(undefined)
      setProposalFocusRequest(undefined)
      setFastLaneLaunchRequest({ nonce: Date.now(), leadId: data.lead.id })
      setContestDemoInstalled(true)
      if (isDemoTourDismissed()) {
        setDemoTourRestartNonce(0)
      } else {
        setDemoTourRestartNonce((current) => current + 1)
      }
      setContestDataRevision((current) => current + 1)
      setContestDemoMessage('Starter Workspace restored to its original reviewed state. All other browser records were left unchanged.')
    } catch {
      setContestDemoMessage('Starter Workspace reset could not finish. All other browser records were left unchanged; refresh and try again.')
    }
  }

  function handleRestartDemoTour() {
    clearDemoTourDismissal()
    if (!contestDemoInstalled) {
      loadContestDemo('always')
      return
    }
    setDemoTourRestartNonce((current) => current + 1)
  }

  const handleDemoTourNavigate = useCallback((step: DemoTourStep) => {
    if (step.title === 'Proposal') {
      setProposalFocusRequest({
        nonce: Date.now(),
        proposalId: contestDemoIds.proposal,
      })
    }
    if (step.title === 'Send Kit') {
      const leadId = leads.find((lead) => lead.id === contestDemoIds.lead)?.id
        || activeLeadId
        || leads[0]?.id
      if (leadId) {
        setFastLaneLaunchRequest({ nonce: Date.now(), leadId, step: 6 })
      }
    }
  }, [activeLeadId, leads])

  return (
    <main className="app-shell">
      <OperatorHeader
        totalScore={totalScore}
        rating={rating}
        demoInstalled={contestDemoInstalled}
        demoMessage={contestDemoMessage}
        onLoadDemo={() => loadContestDemo('if-new')}
        onResetDemo={handleResetContestDemo}
        onRestartTour={handleRestartDemoTour}
      />

      <DemoTour
        key={`contest-tour-${contestDataRevision}-${demoTourRestartNonce}`}
        openInitially={demoTourRestartNonce > 0}
        onNavigate={handleDemoTourNavigate}
      />

      <FastLane
        key={`fast-lane-${contestDataRevision}`}
        leads={leads}
        savedIntakes={savedIntakes}
        savedSnapshots={proposalSnapshots}
        intake={intake}
        form={form}
        scores={scores}
        reportOffer={reportOffer}
        actions={growthFoundation.recommendedActions}
        evidenceItems={growthFoundation.evidenceItems}
        strengths={growthFoundation.strengths}
        visibilityLeaks={growthFoundation.visibilityLeaks}
        outputs={outputs}
        totalScore={totalScore}
        horoscope={horoscope.archetype}
        growthStage={growthFoundation.currentArchetype}
        highestOpportunity={reportStory.featuredOpportunity.title}
        reportReadiness={reportReadiness}
        loadedSnapshotId={loadedId}
        launchRequest={fastLaneLaunchRequest}
        onActivateSource={handleFastLaneActivateSource}
        onChangeIntake={updateIntakeDraft}
        onSaveIntake={handleSaveIntake}
        onApplyDraft={handleApplyDraft}
        onSaveLead={handleFastLaneSaveLead}
        onSaveSnapshot={handleSaveSnapshot}
        onCreateEvidence={createBlankIntakeEvidence}
        onOpenEvidence={openEvidenceManager}
        onProposalSaved={openProposalFromFastLane}
        onMarkOutreachSent={handleFastLaneMarkSent}
        onPrintReport={printReport}
      />

      <section className="lead-cockpit screen-only" id="lead-queue" aria-label="Lead queue">
        <div className="lead-hero panel">
          <div>
            <p className="section-kicker">Outreach cockpit</p>
            <h2>Lead Queue</h2>
            <p>
              Paste lead lists, queue prospects, load one into the snapshot generator, then mark
              the outreach step without leaving the page.
            </p>
          </div>
          <div className="lead-metrics" aria-label="Lead metrics">
            <Metric label="Leads" value={leadStats.total} />
            <Metric label="Sent" value={leadStats.sent} />
            <Metric label="Replies" value={leadStats.replies} />
            <Metric label="Paid" value={leadStats.paid} />
          </div>
        </div>

        <div className="lead-tools-grid">
          <section className="panel lead-form-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Manual entry</p>
                <h2>{editingLeadId ? 'Edit Lead' : 'Add Lead'}</h2>
              </div>
              <Plus size={18} aria-hidden="true" />
            </div>

            <LeadEditor draft={leadDraft} onChange={updateLeadDraft} />

            <div className="button-row">
              <button className="primary-button" type="button" onClick={handleSubmitLead}>
                <Save size={18} aria-hidden="true" />
                {editingLeadId ? 'Update lead' : 'Add lead'}
              </button>
              {editingLeadId && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setEditingLeadId(null)
                    setLeadDraft(emptyLeadInput)
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </section>

          <section className="panel import-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Paste import</p>
                <h2>CSV, TSV, or Markdown Table</h2>
              </div>
              <Upload size={18} aria-hidden="true" />
            </div>

            <TextArea
              label="Paste lead table"
              value={importText}
              onChange={setImportText}
              placeholder="Business, Website, City, Niche, Service, Phone, Email, Contact Form, Notes, Angle, Priority"
            />

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={handleParseImport}>
                Preview import
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleImportLeads}
                disabled={importPreview.every((lead) => !lead.selected)}
              >
                Import selected
              </button>
            </div>

            {importPreview.length > 0 && (
              <div className="import-preview">
                {importPreview.map((lead) => (
                  <label className="import-row" key={lead.importId}>
                    <input
                      type="checkbox"
                      checked={lead.selected}
                      onChange={() => handleToggleImportLead(lead.importId)}
                    />
                    <span>
                      <strong>{lead.businessName || 'Untitled business'}</strong>
                      <small>
                        {lead.city || 'No city'} | {lead.niche || 'No niche'} | {lead.priority}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="panel queue-panel">
          <div className="section-heading queue-heading">
            <div>
              <p className="section-kicker">Queue</p>
              <h2>
                <ListChecks size={18} aria-hidden="true" />
                {filteredLeads.length} visible leads
              </h2>
            </div>
            <div className="export-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => downloadCsv('snapshot-studio-leads.csv', leads)}
              >
                <Download size={18} aria-hidden="true" />
                Export all
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => downloadCsv('snapshot-studio-filtered-leads.csv', filteredLeads)}
              >
                <Download size={18} aria-hidden="true" />
                Export filtered
              </button>
            </div>
          </div>

          <div className="lead-filters">
            <label className="search-field">
              <span>
                <Search size={16} aria-hidden="true" />
                Search
              </span>
              <input
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder="Business, city, or niche"
              />
            </label>
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as LeadStatus | 'All')}
              options={['All', ...leadStatuses].map((status) => [status, status])}
            />
            <SelectField
              label="Priority"
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as LeadPriority | 'All')}
              options={['All', ...leadPriorities].map((priority) => [priority, priority])}
            />
            <SelectField
              label="Niche"
              value={nicheFilter}
              onChange={setNicheFilter}
              options={['All', ...nicheOptions].map((niche) => [niche, niche])}
            />
          </div>

          {activeLead && (
            <div className="active-lead-note">
              <Filter size={16} aria-hidden="true" />
              Current snapshot lead: <strong>{activeLead.businessName || 'Untitled business'}</strong>
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <p className="empty-state">
              {leads.length === 0
                ? 'No leads yet. Add one manually, import a list, or load the Starter Workspace to see the complete workflow.'
                : 'No leads match these filters. Clear the search or broaden a filter to return to the queue.'}
            </p>
          ) : (
            <div className="lead-list">
              {filteredLeads.map((lead) => (
                <article className="lead-card" key={lead.id}>
                  <div className="lead-card-main">
                    <div>
                      <div className="lead-title-row">
                        <h3>{lead.businessName || 'Untitled business'}</h3>
                        <span className={`priority-pill ${lead.priority.toLowerCase()}`}>
                          {lead.priority}
                        </span>
                      </div>
                      <p>
                        {lead.city || 'No city'} | {lead.niche || 'No niche'} |{' '}
                        {lead.mainService || 'No service'}
                      </p>
                      {(lead.websiteUrl || lead.email || lead.phone) && (
                        <div className="lead-contact-line">
                          {lead.websiteUrl && <span>{lead.websiteUrl}</span>}
                          {lead.email && <span>{lead.email}</span>}
                          {lead.phone && <span>{lead.phone}</span>}
                        </div>
                      )}
                    </div>
                    <SelectField
                      label="Status"
                      value={lead.status}
                      onChange={(value) => handleLeadStatus(lead.id, value as LeadStatus)}
                      options={leadStatuses.map((status) => [status, status])}
                    />
                  </div>

                  {(lead.researchNotes || lead.suggestedAngle) && (
                    <div className="lead-notes">
                      {lead.researchNotes && <p>{lead.researchNotes}</p>}
                      {lead.suggestedAngle && <p>{lead.suggestedAngle}</p>}
                    </div>
                  )}

                  <div className="lead-card-footer">
                    <div>
                      {lead.lastContactedAt ? (
                        <span>Last contacted {formatDate(lead.lastContactedAt)}</span>
                      ) : (
                        <span>Not contacted yet</span>
                      )}
                      {lead.linkedSnapshotId && <span>Snapshot linked</span>}
                    </div>
                    <div className="lead-actions">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => handleUseLead(lead)}
                      >
                        Use for snapshot
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setFastLaneLaunchRequest({ nonce: Date.now(), leadId: lead.id })}
                      >
                        Fast Lane
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleMarkSent(lead.id)}
                      >
                        Mark sent today
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Edit ${lead.businessName || 'lead'}`}
                        title="Edit lead"
                        onClick={() => handleEditLead(lead)}
                      >
                        <Pencil size={17} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        aria-label={`Delete ${lead.businessName || 'lead'}`}
                        title="Delete lead"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <OperatorWorkspace
        intake={intake}
        savedIntakes={savedIntakes}
        activeLead={activeLead}
        currentForm={form}
        currentScores={scores}
        currentStrengths={growthFoundation.strengths}
        currentVisibilityLeaks={growthFoundation.visibilityLeaks}
        currentReportOffer={reportOffer}
        evidenceItems={growthFoundation.evidenceItems}
        storageMessage={intakeStorageMessage}
        onChange={updateIntakeDraft}
        onSave={handleSaveIntake}
        onResume={handleResumeIntake}
        onClear={handleClearIntake}
        onUseLeadDetails={handleUseLeadDetailsForIntake}
        onApply={handleApplyDraft}
        onConvertObservation={createObservationEvidence}
        onCreateBlankEvidence={createBlankIntakeEvidence}
        onOpenEvidenceManager={openEvidenceManager}
        onUpdateEvidenceSentiment={updateWorkspaceEvidenceSentiment}
      />

      <section className="workspace screen-only" id="audit-profile-workspace">
        <div className="panel form-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Business Archetype</p>
              <h2>Audit Profile</h2>
            </div>
            <button className="ghost-button" type="button" onClick={handleNewSnapshot}>
              New
            </button>
          </div>

          <div className="field-grid">
            <TextInput
              label="Business name"
              value={form.businessName}
              onChange={(value) => updateField('businessName', value)}
            />
            <TextInput
              label="Website URL"
              inputMode="url"
              value={form.websiteUrl}
              onChange={(value) => updateField('websiteUrl', value)}
            />
            <TextInput
              label="City"
              value={form.city}
              onChange={(value) => updateField('city', value)}
            />
            <TextInput
              label="Niche"
              value={form.niche}
              onChange={(value) => updateField('niche', value)}
            />
            <TextInput
              label="Primary service"
              value={form.mainService}
              onChange={(value) => updateField('mainService', value)}
            />
            <TextInput
              label="Competitor URL 1 optional"
              inputMode="url"
              value={form.competitorUrl1}
              onChange={(value) => updateField('competitorUrl1', value)}
            />
            <TextInput
              label="Competitor URL 2 optional"
              inputMode="url"
              value={form.competitorUrl2}
              onChange={(value) => updateField('competitorUrl2', value)}
            />
          </div>

          <div className="notes-grid">
            <TextArea
              label="Strength notes from website"
              value={form.notes}
              onChange={(value) => updateField('notes', value)}
            />
            <TextArea
              label="Weakness or missed opportunity"
              value={form.weakness}
              onChange={(value) => updateField('weakness', value)}
            />
          </div>

          <TextArea
            label="Competitor comparison note"
            value={form.competitorNote}
            onChange={(value) => updateField('competitorNote', value)}
          />

          <div className="control-row single-control">
            <SelectField
              label="Tone"
              value={form.tone}
              onChange={(value) => updateField('tone', value as Tone)}
              options={[
                ['fun', 'Fun'],
                ['professional', 'Professional'],
                ['spicy', 'Spicy'],
                ['premium', 'Premium'],
              ]}
            />
          </div>
        </div>

        <aside className="side-stack">
          <section className="panel score-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Assessment</p>
                <h2>Business Archetype Score</h2>
              </div>
              <span className={`rating-badge ${rating.toLowerCase().replace(' ', '-')}`}>
                {rating}
              </span>
            </div>

            <div className="total-score">
              <span>{totalScore}</span>
              <p>out of 100</p>
            </div>

            <div className="score-list">
              {scoreKeys.map((key) => (
                <label className="score-control" key={key}>
                  <span>
                    {scoreLabels[key]}
                    <strong>{scores[key]}</strong>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={scores[key]}
                    onChange={(event) => updateScore(key, Number(event.target.value))}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="panel branding-panel">
            <div className="section-heading compact-heading">
              <div>
                <p className="section-kicker">Report branding</p>
                <h2>Prepared By</h2>
              </div>
              <Briefcase size={18} aria-hidden="true" />
            </div>
            <TextInput
              label="Prepared by name"
              value={branding.preparedBy}
              onChange={(value) => updateBranding('preparedBy', value)}
            />
            <TextInput
              label="Brand name"
              value={branding.brandName}
              onChange={(value) => updateBranding('brandName', value)}
            />
            <TextInput
              label="Header contact line (optional)"
              value={branding.contactLine}
              onChange={(value) => updateBranding('contactLine', value)}
            />
          </section>

          <section className="panel branding-panel offer-settings-panel">
            <div className="section-heading compact-heading">
              <div>
                <p className="section-kicker">Client next step</p>
                <h2>Offer & CTA</h2>
              </div>
            </div>
            <SelectField
              label="Offer mode"
              value={reportOffer.offerMode}
              onChange={(value) => updateReportOffer('offerMode', value as OfferMode)}
              options={[
                ['Conversation', 'Conversation'],
                ['Fixed Price', 'Fixed Price'],
                ['Custom Estimate', 'Custom Estimate'],
                ['Hide Pricing', 'Hide Pricing'],
              ]}
            />
            {reportOffer.offerMode === 'Fixed Price' && (
              <div className="field-grid">
                <TextInput
                  label="Fixed price"
                  value={reportOffer.fixedPrice}
                  onChange={(value) => updateReportOffer('fixedPrice', value)}
                />
                <TextInput
                  label="Currency"
                  value={reportOffer.currency}
                  onChange={(value) => updateReportOffer('currency', value)}
                />
              </div>
            )}
            {reportOffer.offerMode === 'Custom Estimate' && (
              <TextInput
                label="Custom investment text (optional)"
                value={reportOffer.customInvestmentText}
                placeholder="Custom estimate after evidence review."
                onChange={(value) => updateReportOffer('customInvestmentText', value)}
              />
            )}
            <TextInput
              label="CTA headline"
              value={reportOffer.ctaHeadline}
              onChange={(value) => updateReportOffer('ctaHeadline', value)}
            />
            <TextArea
              label="CTA body"
              value={reportOffer.ctaBody}
              onChange={(value) => updateReportOffer('ctaBody', value)}
            />
            <TextInput
              label="CTA label"
              value={reportOffer.ctaLabel}
              onChange={(value) => updateReportOffer('ctaLabel', value)}
            />
            <TextInput
              label="CTA contact line"
              value={reportOffer.ctaContactLine}
              placeholder="Email or phone"
              onChange={(value) => updateReportOffer('ctaContactLine', value)}
            />
            <TextInput
              label="Booking URL (optional)"
              inputMode="url"
              value={reportOffer.bookingUrl}
              onChange={(value) => updateReportOffer('bookingUrl', value)}
            />
          </section>

          <div className="sticky-actions">
            <button className="primary-button" type="button" onClick={handleSaveSnapshot}>
              <Save size={18} aria-hidden="true" />
              Save snapshot
            </button>
            <button className="secondary-button" type="button" onClick={copyAllOutputs}>
              <Copy size={18} aria-hidden="true" />
              {copiedKey === 'all' ? 'Copied all' : 'Copy all outputs'}
            </button>
            {storageMessage && <p className="storage-message" role="status">{storageMessage}</p>}
          </div>
        </aside>
      </section>

      <ActionControlCenter
        actions={growthFoundation.recommendedActions}
        evidenceItems={growthFoundation.evidenceItems}
        history={growthFoundation.actionStatusHistory}
        sprint={roadmap.sprint}
        hasUnsavedProgress={hasUnsavedProgress}
        onStatusChange={updateActionStatus}
        onStartNext={startNextAction}
        onCompleteNext={completeNextAction}
        onResetAll={resetActionStatuses}
        onCompleteSprintPhase={completeSprintPhase}
      />

      <EvidenceManager
        evidenceItems={growthFoundation.evidenceItems}
        actions={growthFoundation.recommendedActions}
        includeIncompleteEvidence={growthFoundation.includeIncompleteEvidence}
        onChange={updateEvidenceLayer}
        onIncludeIncompleteChange={updateIncludeIncompleteEvidence}
        onViewActionEvidence={viewActionEvidence}
      />

      <section className="report-section" id="client-report-preview" aria-label="Client-facing report preview">
        <div className="report-toolbar screen-only">
          <div>
            <p className="section-kicker">Client preview</p>
            <h2>Business Archetype Preview</h2>
          </div>
          <ReportReadiness readiness={reportReadiness} />
          <div className="report-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void copyText('report', reportText)}
            >
              <Copy size={18} aria-hidden="true" />
              {copiedKey === 'report' ? 'Copied report' : 'Copy full report'}
            </button>
            <button className="secondary-button" type="button" onClick={handleCreateProposal}>
              <FilePlus2 size={18} aria-hidden="true" />
              Create proposal
            </button>
            <button className="primary-button" type="button" onClick={printReport}>
              <Printer size={18} aria-hidden="true" />
              Print / Save PDF
            </button>
          </div>
          {interactionMessage && <p className="interaction-message" role="status">{interactionMessage}</p>}
        </div>

        <article className="report-shell">
          <section className="report-page share-page report-share-hero report-cover-group" aria-label="Share-ready Business Archetype result">
            <div className="share-page-topline">
              <p className="report-brand">
                {valueOrFallback(branding.brandName, defaultBranding.brandName)}
              </p>
              <span>{reportDate}</span>
            </div>

            <section className="share-card" aria-label="Screenshot-ready share card">
              <div className="share-card-media">
                <img src={horoscope.archetypeImagePath} alt={`${horoscope.archetype} archetype`} />
              </div>
              <div className="share-card-copy">
                <p className="share-card-kicker">Business Archetype</p>
                <div className="share-card-business">
                  <strong>{getDisplayBusinessName(form)}</strong>
                  <small>
                    {getMarketLabel(form)}
                  </small>
                </div>
                <div className="share-card-result">
                  <div>
                    <span>Business Archetype</span>
                    <h3>{horoscope.archetype}</h3>
                  </div>
                  <div className="share-card-score" aria-label={`Report score ${totalScore} out of 100`}>
                    <strong>{totalScore}</strong>
                    <small>/100</small>
                  </div>
                </div>
                <p className="share-card-diagnosis">{horoscope.shareSummary}</p>
                <dl className="share-card-archetype-details">
                  <div><dt>Biggest strength</dt><dd>{horoscope.biggestStrength}</dd></div>
                  <div><dt>Blind spot</dt><dd>{horoscope.blindSpot}</dd></div>
                  <div><dt>Fastest win</dt><dd>{horoscope.fastestWin}</dd></div>
                </dl>
                <em>{horoscope.shareCta}</em>
              </div>
            </section>

            <div className="report-meta">
              <span>
                <Briefcase size={16} aria-hidden="true" />
                Prepared by {valueOrFallback(branding.preparedBy, defaultBranding.preparedBy)}
              </span>
              <span>
                <CalendarDays size={16} aria-hidden="true" />
                {reportDate}
              </span>
              {branding.contactLine.trim() && <span>{branding.contactLine}</span>}
            </div>

            <div className="share-card-actions screen-only" aria-label="Outreach copy actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => void copyText('text', outputs.text)}
              >
                <MessageSquare size={17} aria-hidden="true" />
                {copiedKey === 'text' ? 'Copied text' : 'Copy outreach text'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => void copyText('email', outputs.email)}
              >
                <Send size={17} aria-hidden="true" />
                {copiedKey === 'email' ? 'Copied email' : 'Copy short email'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => void copyText('shareable', outputs.shareable)}
              >
                <Clipboard size={17} aria-hidden="true" />
                {copiedKey === 'shareable' ? 'Copied caption' : 'Copy share caption'}
              </button>
            </div>
          </section>

          <ExecutiveSummaryReport
            summary={executiveSummary}
            scores={visualDiagnostics.scores}
            evidence={visualDiagnostics.evidence}
          />
          <StrategicAssetsReport assets={reportStory.strategicAssets} />
          <BiggestOpportunityReport
            opportunity={reportStory.featuredOpportunity}
            matrix={visualDiagnostics.opportunityMatrix}
          />

          <ProgressJourneyReport
            model={progressJourney}
            timeline={visualDiagnostics.momentumTimeline}
          />
          <SprintPlan phases={visualDiagnostics.sprintPhases} />
          <AuthorityRoadmap weeks={visualDiagnostics.monthWeeks} />
          {reportEvidence.length > 0 && (
            <EvidenceReport
              evidenceItems={reportEvidence}
              actions={growthFoundation.recommendedActions}
            />
          )}
          <ImplementationPathsReport offer={reportOffer} />
          <PoweredByFooter preliminary={reportEvidence.length === 0} />
        </article>
      </section>

      <section className="outputs-grid screen-only" aria-label="Generated outputs">
        {outputLabels.map(({ key, title, icon: Icon }) => (
          <article className="panel output-card" key={key}>
            <div className="section-heading">
              <h2>
                <Icon size={18} aria-hidden="true" />
                {title}
              </h2>
              <button
                className="icon-button"
                type="button"
                aria-label={`Copy ${title}`}
                title={`Copy ${title}`}
                onClick={() => void copyText(key, outputs[key])}
              >
                <Copy size={17} aria-hidden="true" />
              </button>
            </div>
            <pre>{outputs[key]}</pre>
            {key === 'text' && (
              <p className="character-count">{outputs.text.length} characters</p>
            )}
            {copiedKey === key && <p className="copy-status">Copied</p>}
          </article>
        ))}
      </section>

      <section className="panel saved-panel screen-only">
        <div className="section-heading">
          <h2>Saved Snapshots</h2>
          <span>{savedSnapshots.length}</span>
        </div>

        {savedSnapshots.length === 0 ? (
          <p className="empty-state">
            No saved Snapshots yet. Review a lead, confirm the assessment, and choose Save Snapshot; records stay in this browser.
          </p>
        ) : (
          <div className="saved-list">
            {savedSnapshots.map((snapshot) => (
              <article className="saved-item" key={snapshot.id}>
                <button type="button" onClick={() => handleLoadSnapshot(snapshot)}>
                  <strong>{snapshot.businessName || 'Untitled business'}</strong>
                  <span>
                    {snapshot.city || 'No city'} - {snapshot.niche || 'No industry'}
                  </span>
                  <small>
                    {new Date(snapshot.createdAt).toLocaleString()} · {snapshot.evidenceItems.length}{' '}
                    evidence item{snapshot.evidenceItems.length === 1 ? '' : 's'}
                  </small>
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Create proposal for ${snapshot.businessName || 'snapshot'}`}
                  title="Create proposal"
                  onClick={() => requestProposal(
                    snapshot,
                    leads.find((lead) => lead.linkedSnapshotId === snapshot.id),
                  )}
                >
                  <FilePlus2 size={17} aria-hidden="true" />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  aria-label={`Delete ${snapshot.businessName || 'snapshot'}`}
                  title="Delete snapshot"
                  onClick={() => handleDeleteSnapshot(snapshot.id)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <ProposalWorkspace
        key={`proposal-workspace-${contestDataRevision}`}
        snapshots={proposalSnapshots}
        creationRequest={proposalCreationRequest}
        focusRequest={proposalFocusRequest}
      />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function LeadEditor({
  draft,
  onChange,
}: {
  draft: LeadInput
  onChange: <K extends keyof LeadInput>(field: K, value: LeadInput[K]) => void
}) {
  return (
    <div>
      <div className="field-grid">
        <TextInput
          label="Business name"
          value={draft.businessName}
          onChange={(value) => onChange('businessName', value)}
        />
        <TextInput
          label="Website URL"
          inputMode="url"
          value={draft.websiteUrl}
          onChange={(value) => onChange('websiteUrl', value)}
        />
        <TextInput label="City" value={draft.city} onChange={(value) => onChange('city', value)} />
        <TextInput
          label="Niche"
          value={draft.niche}
          onChange={(value) => onChange('niche', value)}
        />
        <TextInput
          label="Primary service"
          value={draft.mainService}
          onChange={(value) => onChange('mainService', value)}
        />
        <TextInput
          label="Phone"
          value={draft.phone}
          onChange={(value) => onChange('phone', value)}
        />
        <TextInput
          label="Email"
          value={draft.email}
          onChange={(value) => onChange('email', value)}
        />
        <TextInput
          label="Contact form URL"
          inputMode="url"
          value={draft.contactFormUrl}
          onChange={(value) => onChange('contactFormUrl', value)}
        />
        <TextInput
          label="Lead source"
          value={draft.leadSource}
          onChange={(value) => onChange('leadSource', value)}
        />
        <SelectField
          label="Priority"
          value={draft.priority}
          onChange={(value) => onChange('priority', value as LeadPriority)}
          options={leadPriorities.map((priority) => [priority, priority])}
        />
        <SelectField
          label="Status"
          value={draft.status}
          onChange={(value) => onChange('status', value as LeadStatus)}
          options={leadStatuses.map((status) => [status, status])}
        />
      </div>
      <div className="notes-grid">
        <TextArea
          label="Research notes"
          value={draft.researchNotes}
          onChange={(value) => onChange('researchNotes', value)}
        />
        <TextArea
          label="Suggested angle"
          value={draft.suggestedAngle}
          onChange={(value) => onChange('suggestedAngle', value)}
        />
      </div>
    </div>
  )
}

function TextInput({
  label,
  value,
  inputMode,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  inputMode?: 'url' | 'text'
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

export default App
