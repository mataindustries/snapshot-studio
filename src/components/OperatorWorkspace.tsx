import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Link2,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import type {
  BusinessIdentityIntake,
  BusinessIntakePayload,
  DraftAnalysisResult,
  EvidenceItem,
  EvidenceSentiment,
  Lead,
  PublicProfileIntake,
  ReportOfferFields,
  ScoreKey,
  Scores,
  SnapshotForm,
  WebsiteContentIntake,
  WebsiteExtractionObservation,
} from '../types'
import {
  createDeterministicDraft,
  getSuggestionMidpoint,
  isDraftCurrent,
} from '../lib/draftAnalysis'
import { getIntakeReadiness, intakeStepTitles } from '../lib/intakeReadiness'
import { normalizeWebsiteUrl, parseWebsiteText } from '../lib/intakeParser'
import { scoreLabels } from '../lib/scoring'
import './OperatorWorkspace.css'

export type DraftApplication = {
  formPatch?: Partial<SnapshotForm>
  scorePatch?: Partial<Scores>
  strengths?: string[]
  visibilityLeaks?: string[]
  reportOfferPatch?: Partial<ReportOfferFields>
  outreachAngle?: string
}

type OperatorWorkspaceProps = {
  intake: BusinessIntakePayload
  savedIntakes: BusinessIntakePayload[]
  activeLead: Lead | null
  currentForm: SnapshotForm
  currentScores: Scores
  currentStrengths: string[]
  currentVisibilityLeaks: string[]
  currentReportOffer: ReportOfferFields
  evidenceItems: EvidenceItem[]
  storageMessage: string
  onChange: (intake: BusinessIntakePayload) => void
  onSave: () => void
  onResume: (intakeId: string) => void
  onClear: () => void
  onUseLeadDetails: () => void
  onApply: (application: DraftApplication) => void
  onConvertObservation: (
    observation: WebsiteExtractionObservation,
    sentiment: EvidenceSentiment,
    caption?: string,
  ) => string
  onCreateBlankEvidence: () => string
  onOpenEvidenceManager: (evidenceId?: string) => void
  onUpdateEvidenceSentiment: (evidenceId: string, sentiment: EvidenceSentiment) => void
}

const scoreKeys = Object.keys(scoreLabels) as ScoreKey[]

function splitTerms(value: string) {
  return value
    .split(/[\n,;|]/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function formatSavedIntake(intake: BusinessIntakePayload) {
  const name = intake.identity.businessName.trim() || 'Untitled intake'
  return name + ' · ' + new Date(intake.updatedAt).toLocaleString()
}

export function OperatorWorkspace({
  intake,
  savedIntakes,
  activeLead,
  currentForm,
  currentScores,
  currentStrengths,
  currentVisibilityLeaks,
  currentReportOffer,
  evidenceItems,
  storageMessage,
  onChange,
  onSave,
  onResume,
  onClear,
  onUseLeadDetails,
  onApply,
  onConvertObservation,
  onCreateBlankEvidence,
  onOpenEvidenceManager,
  onUpdateEvidenceSentiment,
}: OperatorWorkspaceProps) {
  const [clearPending, setClearPending] = useState(false)
  const [resumeId, setResumeId] = useState(savedIntakes[0]?.id || '')
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const extraction = useMemo(
    () => parseWebsiteText(intake.website.pageText, {
      serviceTerms: [
        intake.identity.primaryService,
        ...splitTerms(intake.identity.secondaryServices),
        intake.identity.niche,
      ],
      locationTerms: [
        intake.identity.city,
        ...splitTerms(intake.identity.serviceAreas),
      ],
    }),
    [
      intake.identity.city,
      intake.identity.niche,
      intake.identity.primaryService,
      intake.identity.secondaryServices,
      intake.identity.serviceAreas,
      intake.website.pageText,
    ],
  )
  const readiness = useMemo(
    () => getIntakeReadiness(intake, extraction, evidenceItems.length),
    [evidenceItems.length, extraction, intake],
  )
  const draftCurrent = isDraftCurrent(intake, extraction)
  const currentStep = Math.min(7, Math.max(1, intake.currentStep))
  const stepReadiness = readiness.steps[currentStep - 1]

  function updateIntake(next: BusinessIntakePayload) {
    onChange({
      ...next,
      updatedAt: new Date().toISOString(),
    })
    setWorkspaceMessage('Unsaved intake changes.')
  }

  function updateStep(step: number) {
    updateIntake({
      ...intake,
      currentStep: Math.min(7, Math.max(1, step)),
    })
    document.getElementById('operator-workspace')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function updateIdentity<K extends keyof BusinessIdentityIntake>(
    field: K,
    value: BusinessIdentityIntake[K],
  ) {
    const identity = { ...intake.identity, [field]: value }
    if (field === 'websiteUrlRaw') {
      identity.websiteUrlNormalized = normalizeWebsiteUrl(String(value)).normalized
    }
    updateIntake({ ...intake, identity })
  }

  function updateWebsite<K extends keyof WebsiteContentIntake>(
    field: K,
    value: WebsiteContentIntake[K],
  ) {
    updateIntake({
      ...intake,
      website: { ...intake.website, [field]: value },
    })
  }

  function updatePublicProfile<K extends keyof PublicProfileIntake>(
    field: K,
    value: PublicProfileIntake[K],
  ) {
    updateIntake({
      ...intake,
      publicProfile: { ...intake.publicProfile, [field]: value },
    })
  }

  function updateCompetitor(
    index: 0 | 1,
    field: 'name' | 'url' | 'notes',
    value: string,
  ) {
    const competitors = intake.competitorContext.competitors.map(
      (competitor, competitorIndex) =>
        competitorIndex === index ? { ...competitor, [field]: value } : competitor,
    ) as BusinessIntakePayload['competitorContext']['competitors']
    updateIntake({
      ...intake,
      competitorContext: { ...intake.competitorContext, competitors },
    })
  }

  function updateDraft(draft: DraftAnalysisResult) {
    updateIntake({ ...intake, draft })
  }

  function generateDraft() {
    updateIntake({
      ...intake,
      draft: createDeterministicDraft(intake, extraction),
    })
    setWorkspaceMessage('Deterministic draft created from supplied inputs.')
  }

  function applyDraft(application: DraftApplication) {
    onApply(application)
    updateIntake({
      ...intake,
      appliedAt: new Date().toISOString(),
    })
    setWorkspaceMessage('Selected draft values applied to the existing Snapshot.')
  }

  function setObservationSentiment(
    observationId: string,
    sentiment: EvidenceSentiment,
  ) {
    const evidenceId = intake.observationEvidenceLinks[observationId]
    updateIntake({
      ...intake,
      observationClassifications: {
        ...intake.observationClassifications,
        [observationId]: sentiment,
      },
    })
    if (evidenceId) onUpdateEvidenceSentiment(evidenceId, sentiment)
  }

  function convertObservation(observation: WebsiteExtractionObservation) {
    const sentiment = intake.observationClassifications[observation.id]
      || observation.suggestedSentiment
    const caption = intake.draft?.suggestedEvidenceCaptions.find(
      (item) => item.observationId === observation.id,
    )?.caption
    const evidenceId = onConvertObservation(observation, sentiment, caption)
    updateIntake({
      ...intake,
      observationEvidenceLinks: {
        ...intake.observationEvidenceLinks,
        [observation.id]: evidenceId,
      },
    })
    setWorkspaceMessage('Observation converted to an Evidence Manager draft.')
  }

  function attachIntakeScreenshot() {
    const evidenceId = onCreateBlankEvidence()
    onOpenEvidenceManager(evidenceId)
    setWorkspaceMessage('Evidence draft created. Attach the screenshot in Evidence Manager.')
  }

  const normalizedWebsite = normalizeWebsiteUrl(intake.identity.websiteUrlRaw)

  return (
    <section
      className="operator-workspace panel screen-only"
      id="operator-workspace"
      aria-labelledby="operator-workspace-title"
    >
      <header className="operator-workspace-header">
        <div>
          <p className="section-kicker">Phase 5A operator flow</p>
          <h2 id="operator-workspace-title">Intake and Draft Analysis</h2>
          <p>
            Collect reviewed business details, build a transparent draft, then apply only what
            you approve to the existing Audit Profile.
          </p>
        </div>
        <div className="operator-ready-card">
          <span>Step {currentStep} of 7</span>
          <strong>{readiness.draftReady ? 'Draft ready' : 'Inputs needed'}</strong>
          <small>
            {readiness.missingRequired.length === 0
              ? readiness.completedSteps + ' of 7 steps complete'
              : readiness.missingRequired.length + ' required item'
                + (readiness.missingRequired.length === 1 ? '' : 's') + ' remaining'}
          </small>
        </div>
      </header>

      <div className="operator-progress" aria-label="Intake progress">
        <span style={{ width: String((readiness.completedSteps / 7) * 100) + '%' }} />
      </div>
      {readiness.missingRequired.length > 0 && (
        <p className="operator-required-remains">
          Still required: {readiness.missingRequired.join(', ')}.
        </p>
      )}

      <nav className="operator-step-nav" aria-label="Operator intake steps">
        {readiness.steps.map((step) => (
          <button
            className={
              'operator-step-button'
              + (step.number === currentStep ? ' current' : '')
              + (step.complete ? ' complete' : '')
            }
            type="button"
            key={step.id}
            onClick={() => updateStep(step.number)}
            aria-current={step.number === currentStep ? 'step' : undefined}
          >
            <span>{step.complete ? <Check size={14} aria-hidden="true" /> : step.number}</span>
            <small>{step.title}</small>
          </button>
        ))}
      </nav>

      <section className="operator-save-row" aria-label="Intake draft storage">
        <button className="primary-button" type="button" onClick={onSave}>
          <Save size={17} aria-hidden="true" />
          Save intake
        </button>
        <div className="operator-resume-control">
          <label htmlFor="resume-intake">Resume intake</label>
          <select
            id="resume-intake"
            value={savedIntakes.some((saved) => saved.id === resumeId) ? resumeId : ''}
            disabled={savedIntakes.length === 0}
            onChange={(event) => setResumeId(event.target.value)}
          >
            <option value="">Choose saved intake</option>
            {savedIntakes.map((saved) => (
              <option value={saved.id} key={saved.id}>
                {formatSavedIntake(saved)}
              </option>
            ))}
          </select>
          <button
            className="secondary-button"
            type="button"
            disabled={!resumeId}
            onClick={() => {
              onResume(resumeId)
              setWorkspaceMessage('Saved intake resumed.')
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Resume
          </button>
        </div>
        {clearPending ? (
          <div className="operator-clear-confirm" role="status">
            <p>Clear this intake and remove its saved copy? Snapshot and evidence data stay intact.</p>
            <button
              className="danger-button"
              type="button"
              onClick={() => {
                onClear()
                setClearPending(false)
                setResumeId('')
                setWorkspaceMessage('Intake cleared.')
              }}
            >
              Confirm clear intake
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setClearPending(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="text-danger-button"
            type="button"
            onClick={() => setClearPending(true)}
          >
            <Trash2 size={16} aria-hidden="true" />
            Clear intake
          </button>
        )}
      </section>

      {(storageMessage || workspaceMessage) && (
        <p className="operator-status" role="status">{storageMessage || workspaceMessage}</p>
      )}

      <div className="operator-current-step">
        <div className="operator-step-heading">
          <div>
            <span>Step {currentStep}</span>
            <h3>{intakeStepTitles[currentStep - 1]}</h3>
          </div>
          <div className={'step-requirement ' + (stepReadiness.required ? 'required' : 'optional')}>
            <strong>{stepReadiness.required ? 'Required' : 'Optional'}</strong>
            <small>{stepReadiness.requirement}</small>
          </div>
        </div>

        {currentStep === 1 && (
          <BusinessIdentityStep
            intake={intake}
            activeLead={activeLead}
            normalizedWebsite={normalizedWebsite}
            onUpdate={updateIdentity}
            onUseLeadDetails={onUseLeadDetails}
          />
        )}
        {currentStep === 2 && (
          <WebsiteIntakeStep
            intake={intake}
            extraction={extraction}
            onUpdate={updateWebsite}
          />
        )}
        {currentStep === 3 && (
          <PublicProfileStep
            intake={intake}
            onUpdate={updatePublicProfile}
          />
        )}
        {currentStep === 4 && (
          <CompetitorStep
            intake={intake}
            onUpdateCompetitor={updateCompetitor}
            onUpdateComparison={(value) => updateIntake({
              ...intake,
              competitorContext: {
                ...intake.competitorContext,
                comparisonNotes: value,
              },
            })}
          />
        )}
        {currentStep === 5 && (
          <EvidenceHandoffStep
            intake={intake}
            extraction={extraction}
            evidenceItems={evidenceItems}
            onSentimentChange={setObservationSentiment}
            onConvert={convertObservation}
            onAttachScreenshot={attachIntakeScreenshot}
            onOpenManager={onOpenEvidenceManager}
          />
        )}
        {currentStep === 6 && (
          <DraftAnalysisStep
            intake={intake}
            readiness={readiness}
            draftCurrent={draftCurrent}
            onGenerate={generateDraft}
            onDraftChange={updateDraft}
          />
        )}
        {currentStep === 7 && (
          <ReviewAndApplyStep
            key={intake.draft?.generatedAt || 'no-draft'}
            intake={intake}
            draftCurrent={draftCurrent}
            currentForm={currentForm}
            currentScores={currentScores}
            currentStrengths={currentStrengths}
            currentVisibilityLeaks={currentVisibilityLeaks}
            currentReportOffer={currentReportOffer}
            activeLead={activeLead}
            onApply={applyDraft}
            onEditDraft={() => updateStep(6)}
          />
        )}
      </div>

      <footer className="operator-mobile-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={currentStep === 1}
          onClick={() => updateStep(currentStep - 1)}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Previous
        </button>
        {currentStep < 7 ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => updateStep(currentStep + 1)}
          >
            Next
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onSave}>
            <Save size={17} aria-hidden="true" />
            Save intake
          </button>
        )}
      </footer>
    </section>
  )
}

function BusinessIdentityStep({
  intake,
  activeLead,
  normalizedWebsite,
  onUpdate,
  onUseLeadDetails,
}: {
  intake: BusinessIntakePayload
  activeLead: Lead | null
  normalizedWebsite: ReturnType<typeof normalizeWebsiteUrl>
  onUpdate: <K extends keyof BusinessIdentityIntake>(
    field: K,
    value: BusinessIdentityIntake[K],
  ) => void
  onUseLeadDetails: () => void
}) {
  const identity = intake.identity

  return (
    <div className="operator-step-content">
      <div className="operator-callout">
        <div>
          <strong>Selected Lead Queue item</strong>
          <p>
            {activeLead
              ? activeLead.businessName + ' is ready to copy into this intake.'
              : 'Choose “Use for snapshot” on a Lead Queue item first.'}
          </p>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={!activeLead}
          onClick={onUseLeadDetails}
        >
          Use lead details
        </button>
      </div>

      <div className="operator-field-grid">
        <IntakeInput
          label="Business name"
          value={identity.businessName}
          onChange={(value) => onUpdate('businessName', value)}
        />
        <IntakeInput
          label="Website URL"
          required
          inputMode="url"
          value={identity.websiteUrlRaw}
          onChange={(value) => onUpdate('websiteUrlRaw', value)}
        />
        <IntakeInput
          label="City"
          required
          value={identity.city}
          onChange={(value) => onUpdate('city', value)}
        />
        <IntakeInput
          label="Niche"
          value={identity.niche}
          onChange={(value) => onUpdate('niche', value)}
        />
        <IntakeInput
          label="Primary service"
          required
          value={identity.primaryService}
          onChange={(value) => onUpdate('primaryService', value)}
        />
        <IntakeTextArea
          label="Secondary services"
          rows={3}
          placeholder="One per line or comma-separated"
          value={identity.secondaryServices}
          onChange={(value) => onUpdate('secondaryServices', value)}
        />
      </div>

      {identity.websiteUrlRaw && (
        <div className={'normalized-url-card ' + (normalizedWebsite.valid ? 'valid' : 'warning')}>
          <Link2 size={18} aria-hidden="true" />
          <div>
            <strong>Normalized URL</strong>
            <code>{normalizedWebsite.normalized || 'Review URL'}</code>
            <small>
              The raw value above is preserved. Whitespace, a missing protocol, and known tracking
              parameters are cleaned only in this displayed version.
            </small>
            {normalizedWebsite.removedTrackingParameters.length > 0 && (
              <small>
                Removed: {normalizedWebsite.removedTrackingParameters.join(', ')}
              </small>
            )}
            {normalizedWebsite.warning && <small>{normalizedWebsite.warning}</small>}
          </div>
        </div>
      )}

      <details className="operator-details" open>
        <summary>Contact and conversion details</summary>
        <div className="operator-field-grid">
          <IntakeInput
            label="Phone"
            inputMode="tel"
            value={identity.phone}
            onChange={(value) => onUpdate('phone', value)}
          />
          <IntakeInput
            label="Email"
            inputMode="email"
            value={identity.email}
            onChange={(value) => onUpdate('email', value)}
          />
          <IntakeInput
            label="Contact form URL"
            inputMode="url"
            value={identity.contactFormUrl}
            onChange={(value) => onUpdate('contactFormUrl', value)}
          />
          <IntakeInput
            label="Booking URL"
            inputMode="url"
            value={identity.bookingUrl}
            onChange={(value) => onUpdate('bookingUrl', value)}
          />
        </div>
      </details>

      <details className="operator-details">
        <summary>Business context and positioning</summary>
        <div className="operator-field-grid">
          <IntakeInput
            label="Business age or founding year"
            value={identity.businessAgeOrFoundingYear}
            onChange={(value) => onUpdate('businessAgeOrFoundingYear', value)}
          />
          <IntakeInput
            label="Owner or family-owned note"
            value={identity.ownerFamilyNote}
            onChange={(value) => onUpdate('ownerFamilyNote', value)}
          />
          <IntakeTextArea
            label="Service areas"
            rows={3}
            value={identity.serviceAreas}
            onChange={(value) => onUpdate('serviceAreas', value)}
          />
          <IntakeTextArea
            label="Differentiators"
            rows={3}
            value={identity.differentiators}
            onChange={(value) => onUpdate('differentiators', value)}
          />
        </div>
      </details>
    </div>
  )
}

function WebsiteIntakeStep({
  intake,
  extraction,
  onUpdate,
}: {
  intake: BusinessIntakePayload
  extraction: ReturnType<typeof parseWebsiteText>
  onUpdate: <K extends keyof WebsiteContentIntake>(
    field: K,
    value: WebsiteContentIntake[K],
  ) => void
}) {
  const website = intake.website

  return (
    <div className="operator-step-content">
      <div className="scanner-boundary-card">
        <FileCheck2 size={20} aria-hidden="true" />
        <div>
          <strong>Manual URL intake</strong>
          <p>
            Paste the page text or public details you reviewed. Automatic site retrieval will
            require a future connected scanner.
          </p>
          <small>
            This workspace does not fetch, visit, or verify the entered URL.
          </small>
        </div>
      </div>

      <IntakeTextArea
        label="Paste page text"
        required
        rows={12}
        placeholder="Paste the visible homepage or page text you reviewed."
        value={website.pageText}
        onChange={(value) => onUpdate('pageText', value)}
      />

      <ExtractionSummary extraction={extraction} />

      <details className="operator-details" open>
        <summary>Structured homepage fields</summary>
        <div className="operator-field-grid">
          <IntakeInput
            label="Homepage title"
            value={website.homepageTitle}
            onChange={(value) => onUpdate('homepageTitle', value)}
          />
          <IntakeTextArea
            label="Meta description"
            rows={3}
            value={website.metaDescription}
            onChange={(value) => onUpdate('metaDescription', value)}
          />
          <IntakeInput
            label="Hero headline"
            value={website.heroHeadline}
            onChange={(value) => onUpdate('heroHeadline', value)}
          />
          <IntakeTextArea
            label="Hero support copy"
            rows={3}
            value={website.heroSupportCopy}
            onChange={(value) => onUpdate('heroSupportCopy', value)}
          />
          <IntakeInput
            label="Primary CTA"
            value={website.primaryCta}
            onChange={(value) => onUpdate('primaryCta', value)}
          />
          <IntakeTextArea
            label="Homepage body text"
            rows={5}
            value={website.homepageBodyText}
            onChange={(value) => onUpdate('homepageBodyText', value)}
          />
        </div>
      </details>

      <details className="operator-details">
        <summary>Services, proof, questions, and business detail</summary>
        <div className="operator-field-grid">
          <IntakeTextArea
            label="Services listed"
            value={website.servicesListed}
            onChange={(value) => onUpdate('servicesListed', value)}
          />
          <IntakeTextArea
            label="Trust or review copy"
            value={website.trustReviewCopy}
            onChange={(value) => onUpdate('trustReviewCopy', value)}
          />
          <IntakeTextArea
            label="FAQ text"
            value={website.faqText}
            onChange={(value) => onUpdate('faqText', value)}
          />
          <IntakeTextArea
            label="About or team copy"
            value={website.aboutTeamCopy}
            onChange={(value) => onUpdate('aboutTeamCopy', value)}
          />
          <IntakeTextArea
            label="Footer or contact details"
            value={website.footerContactDetails}
            onChange={(value) => onUpdate('footerContactDetails', value)}
          />
        </div>
      </details>
    </div>
  )
}

function ExtractionSummary({
  extraction,
}: {
  extraction: ReturnType<typeof parseWebsiteText>
}) {
  const groups = [
    ['Headings', extraction.headings],
    ['Calls to action', extraction.callsToAction],
    ['Service phrases', extraction.servicePhrases],
    ['Location phrases', extraction.locationPhrases],
    ['Trust phrases', extraction.trustPhrases],
    ['Question headings', extraction.questionHeadings],
    ['Contact details', extraction.contactDetails],
  ] as const
  const total = groups.reduce((sum, [, items]) => sum + items.length, 0)

  return (
    <section className="extraction-card" aria-labelledby="extraction-title">
      <div>
        <span className="draft-label">{extraction.disclosure}</span>
        <h4 id="extraction-title">Local text parser</h4>
        <p>
          Pattern matches from operator-pasted text only. Nothing here confirms that a detail is
          current or appears on a live website.
        </p>
      </div>
      {total === 0 ? (
        <p className="operator-empty">Paste page text to see local pattern extraction.</p>
      ) : (
        <div className="extraction-groups">
          {groups.map(([label, items]) => (
            <details key={label} open={items.length > 0}>
              <summary>{label} <span>{items.length}</span></summary>
              {items.length > 0 ? (
                <ul>
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p>Nothing likely was extracted.</p>
              )}
            </details>
          ))}
        </div>
      )}
    </section>
  )
}

function PublicProfileStep({
  intake,
  onUpdate,
}: {
  intake: BusinessIntakePayload
  onUpdate: <K extends keyof PublicProfileIntake>(
    field: K,
    value: PublicProfileIntake[K],
  ) => void
}) {
  const profile = intake.publicProfile

  return (
    <div className="operator-step-content">
      <div className="operator-callout">
        <div>
          <strong>Manual public observations</strong>
          <p>Every field is optional. Enter only details you reviewed; the app does not retrieve them.</p>
        </div>
      </div>

      <details className="operator-details" open>
        <summary>Google and profile completeness</summary>
        <div className="operator-field-grid">
          <IntakeInput
            label="Google rating"
            inputMode="decimal"
            value={profile.googleRating}
            onChange={(value) => onUpdate('googleRating', value)}
          />
          <IntakeInput
            label="Review count"
            inputMode="numeric"
            value={profile.reviewCount}
            onChange={(value) => onUpdate('reviewCount', value)}
          />
          <IntakeInput
            label="Latest review recency"
            placeholder="Example: 2 weeks ago"
            value={profile.latestReviewRecency}
            onChange={(value) => onUpdate('latestReviewRecency', value)}
          />
          <IntakeTextArea
            label="Profile completeness notes"
            value={profile.profileCompletenessNotes}
            onChange={(value) => onUpdate('profileCompletenessNotes', value)}
          />
          <IntakeTextArea
            label="Categories"
            value={profile.categories}
            onChange={(value) => onUpdate('categories', value)}
          />
          <IntakeTextArea
            label="Hours"
            value={profile.hours}
            onChange={(value) => onUpdate('hours', value)}
          />
          <IntakeTextArea
            label="Photos"
            value={profile.photos}
            onChange={(value) => onUpdate('photos', value)}
          />
          <IntakeTextArea
            label="Social profiles"
            value={profile.socialProfiles}
            onChange={(value) => onUpdate('socialProfiles', value)}
          />
        </div>
      </details>

      <details className="operator-details">
        <summary>Trust, availability, and access</summary>
        <div className="operator-field-grid">
          <IntakeTextArea
            label="Credentials"
            value={profile.credentials}
            onChange={(value) => onUpdate('credentials', value)}
          />
          <IntakeTextArea
            label="Awards"
            value={profile.awards}
            onChange={(value) => onUpdate('awards', value)}
          />
          <IntakeTextArea
            label="Financing"
            value={profile.financing}
            onChange={(value) => onUpdate('financing', value)}
          />
          <IntakeTextArea
            label="Guarantees"
            value={profile.guarantees}
            onChange={(value) => onUpdate('guarantees', value)}
          />
          <IntakeTextArea
            label="Emergency availability"
            value={profile.emergencyAvailability}
            onChange={(value) => onUpdate('emergencyAvailability', value)}
          />
          <IntakeTextArea
            label="Accessibility or language support"
            value={profile.accessibilityLanguageSupport}
            onChange={(value) => onUpdate('accessibilityLanguageSupport', value)}
          />
        </div>
      </details>
    </div>
  )
}

function CompetitorStep({
  intake,
  onUpdateCompetitor,
  onUpdateComparison,
}: {
  intake: BusinessIntakePayload
  onUpdateCompetitor: (
    index: 0 | 1,
    field: 'name' | 'url' | 'notes',
    value: string,
  ) => void
  onUpdateComparison: (value: string) => void
}) {
  return (
    <div className="operator-step-content">
      <div className="competitor-intake-grid">
        {intake.competitorContext.competitors.map((competitor, index) => (
          <section className="competitor-intake-card" key={index}>
            <span>Competitor {index + 1}</span>
            <IntakeInput
              label="Business name"
              value={competitor.name}
              onChange={(value) => onUpdateCompetitor(index as 0 | 1, 'name', value)}
            />
            <IntakeInput
              label="URL"
              inputMode="url"
              value={competitor.url}
              onChange={(value) => onUpdateCompetitor(index as 0 | 1, 'url', value)}
            />
            <IntakeTextArea
              label="Manual notes"
              placeholder="Offer clarity, proof, CTA, service depth, or positioning."
              value={competitor.notes}
              onChange={(value) => onUpdateCompetitor(index as 0 | 1, 'notes', value)}
            />
          </section>
        ))}
      </div>
      <IntakeTextArea
        label="Overall competitor comparison notes"
        rows={6}
        value={intake.competitorContext.comparisonNotes}
        onChange={onUpdateComparison}
      />
      <p className="operator-inline-note">
        These notes are operator-provided context. The draft engine does not fetch or compare
        competitor websites.
      </p>
    </div>
  )
}

function EvidenceHandoffStep({
  intake,
  extraction,
  evidenceItems,
  onSentimentChange,
  onConvert,
  onAttachScreenshot,
  onOpenManager,
}: {
  intake: BusinessIntakePayload
  extraction: ReturnType<typeof parseWebsiteText>
  evidenceItems: EvidenceItem[]
  onSentimentChange: (observationId: string, sentiment: EvidenceSentiment) => void
  onConvert: (observation: WebsiteExtractionObservation) => void
  onAttachScreenshot: () => void
  onOpenManager: (evidenceId?: string) => void
}) {
  const visibleObservations = extraction.observations.slice(0, 24)

  return (
    <div className="operator-step-content">
      <div className="evidence-handoff-summary">
        <div>
          <strong>{evidenceItems.length} Evidence Manager item{evidenceItems.length === 1 ? '' : 's'}</strong>
          <p>
            Screenshots stay in the existing Evidence Manager and its browser-local image
            pipeline. This intake stores links only.
          </p>
        </div>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={onAttachScreenshot}>
            <FileCheck2 size={17} aria-hidden="true" />
            Attach intake screenshot
          </button>
          <button className="secondary-button" type="button" onClick={() => onOpenManager()}>
            Open Evidence Manager
          </button>
        </div>
      </div>

      <section className="observation-review" aria-labelledby="observation-review-title">
        <div>
          <span className="draft-label">{extraction.disclosure}</span>
          <h4 id="observation-review-title">Connect extracted observations</h4>
          <p>
            Classify an extracted phrase, convert it to an evidence draft, then review and attach
            proof in the Evidence Manager.
          </p>
        </div>
        {visibleObservations.length === 0 ? (
          <p className="operator-empty">No parser observations yet. Add pasted page text in step 2.</p>
        ) : (
          <div className="observation-list">
            {visibleObservations.map((observation) => {
              const evidenceId = intake.observationEvidenceLinks[observation.id]
              const evidenceExists = evidenceItems.some((item) => item.id === evidenceId)
              const sentiment = intake.observationClassifications[observation.id]
                || observation.suggestedSentiment
              return (
                <article className="observation-card" key={observation.id}>
                  <div>
                    <span>{observation.kind}</span>
                    <p>{observation.text}</p>
                  </div>
                  <label>
                    <span>Classification</span>
                    <select
                      value={sentiment}
                      onChange={(event) => onSentimentChange(
                        observation.id,
                        event.target.value as EvidenceSentiment,
                      )}
                    >
                      <option value="Strength">Strength</option>
                      <option value="Opportunity">Opportunity</option>
                      <option value="Neutral">Neutral</option>
                    </select>
                  </label>
                  {evidenceExists ? (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onOpenManager(evidenceId)}
                    >
                      <Link2 size={16} aria-hidden="true" />
                      Edit linked evidence
                    </button>
                  ) : (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onConvert(observation)}
                    >
                      Convert to evidence
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
        {extraction.observations.length > visibleObservations.length && (
          <p className="operator-inline-note">
            Showing the first {visibleObservations.length} of {extraction.observations.length}
            extracted phrases. Refine the pasted text to narrow the review list.
          </p>
        )}
      </section>
    </div>
  )
}


function DraftAnalysisStep({
  intake,
  readiness,
  draftCurrent,
  onGenerate,
  onDraftChange,
}: {
  intake: BusinessIntakePayload
  readiness: ReturnType<typeof getIntakeReadiness>
  draftCurrent: boolean
  onGenerate: () => void
  onDraftChange: (draft: DraftAnalysisResult) => void
}) {
  const draft = intake.draft

  function updateDraft(patch: Partial<DraftAnalysisResult>) {
    if (!draft) return
    onDraftChange({ ...draft, ...patch })
  }

  function updateScoreSuggestion(
    key: ScoreKey,
    field: 'minimum' | 'maximum' | 'explanation',
    value: number | string,
  ) {
    if (!draft) return
    const current = draft.scoreSuggestions[key]
    const numericValue = Math.min(20, Math.max(0, Number(value)))
    const next = {
      ...current,
      explanation: field === 'explanation' ? String(value) : current.explanation,
      minimum: field === 'minimum'
        ? Math.min(numericValue, current.maximum)
        : current.minimum,
      maximum: field === 'maximum'
        ? Math.max(numericValue, current.minimum)
        : current.maximum,
    }
    updateDraft({
      scoreSuggestions: {
        ...draft.scoreSuggestions,
        [key]: next,
      },
    })
  }

  return (
    <div className="operator-step-content">
      {!readiness.draftReady && (
        <div className="operator-warning-card">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <strong>Required intake is incomplete</strong>
            <p>Add {readiness.missingRequired.join(', ')} before generating a draft.</p>
          </div>
        </div>
      )}

      <div className="draft-action-bar">
        <div>
          <strong>Deterministic draft assistant</strong>
          <p>
            Transparent rules use only supplied fields and pasted text. No external AI, fetch,
            browser automation, or website verification is involved.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={!readiness.draftReady}
          onClick={onGenerate}
        >
          <ClipboardCheck size={17} aria-hidden="true" />
          {draft ? 'Refresh deterministic draft' : 'Generate deterministic draft'}
        </button>
      </div>

      {draft && !draftCurrent && (
        <div className="operator-warning-card compact">
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>Draft inputs changed</strong>
            <p>Refresh the deterministic draft before applying its suggestions.</p>
          </div>
        </div>
      )}

      {!draft ? (
        <p className="operator-empty">
          Complete the required intake, then generate the editable draft assessment.
        </p>
      ) : (
        <div className={'draft-editor ' + (!draftCurrent ? 'stale' : '')}>
          <div className="draft-editor-heading">
            <div>
              <span className="draft-label">Draft — review required</span>
              <h4>Editable assessment</h4>
              <p>{draft.disclosure}</p>
            </div>
            <span className={'confidence-pill ' + draft.confidence.toLocaleLowerCase()}>
              {draft.confidence} confidence
            </span>
          </div>

          <section className="draft-section">
            <h5>Strength notes</h5>
            <div className="draft-list-editor">
              {draft.suggestedStrengthNotes.map((note, index) => (
                <IntakeTextArea
                  label={'Suggested strength ' + (index + 1)}
                  rows={3}
                  value={note}
                  key={index}
                  onChange={(value) => updateDraft({
                    suggestedStrengthNotes: draft.suggestedStrengthNotes.map(
                      (current, currentIndex) => currentIndex === index ? value : current,
                    ),
                  })}
                />
              ))}
            </div>
          </section>

          <section className="draft-section">
            <h5>Opportunity and recommendation</h5>
            <IntakeTextArea
              label="Suggested missed opportunity"
              value={draft.suggestedMissedOpportunity}
              onChange={(value) => updateDraft({ suggestedMissedOpportunity: value })}
            />
            <IntakeTextArea
              label="Suggested primary opportunity"
              value={draft.suggestedPrimaryOpportunity}
              onChange={(value) => updateDraft({ suggestedPrimaryOpportunity: value })}
            />
            <IntakeInput
              label="Suggested recommendation subject"
              value={draft.suggestedRecommendationSubject}
              onChange={(value) => updateDraft({ suggestedRecommendationSubject: value })}
            />
          </section>

          <section className="draft-section">
            <div className="draft-section-heading">
              <div>
                <h5>Suggested score ranges</h5>
                <p>Ranges are planning suggestions. The operator chooses every final score.</p>
              </div>
            </div>
            <div className="draft-score-grid">
              {scoreKeys.map((key) => {
                const suggestion = draft.scoreSuggestions[key]
                return (
                  <article className="draft-score-card" key={key}>
                    <div>
                      <strong>{scoreLabels[key]}</strong>
                      <span className={'confidence-pill ' + suggestion.confidence.toLocaleLowerCase()}>
                        {suggestion.confidence}
                      </span>
                    </div>
                    <div className="range-editor">
                      <IntakeInput
                        label="Suggested minimum"
                        inputMode="numeric"
                        value={String(suggestion.minimum)}
                        onChange={(value) => updateScoreSuggestion(key, 'minimum', Number(value))}
                      />
                      <IntakeInput
                        label="Suggested maximum"
                        inputMode="numeric"
                        value={String(suggestion.maximum)}
                        onChange={(value) => updateScoreSuggestion(key, 'maximum', Number(value))}
                      />
                    </div>
                    <IntakeTextArea
                      label="Explanation"
                      rows={4}
                      value={suggestion.explanation}
                      onChange={(value) => updateScoreSuggestion(key, 'explanation', value)}
                    />
                    <details>
                      <summary>Evidence and input basis</summary>
                      <ul>
                        {suggestion.basis.map((basis) => <li key={basis}>{basis}</li>)}
                      </ul>
                    </details>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="draft-section">
            <h5>Business Horoscope candidates</h5>
            <p className="operator-inline-note">
              Candidates follow suggested score scenarios. Final scores still control the report.
            </p>
            <div className="draft-list-editor">
              {draft.suggestedBusinessHoroscopeCandidates.map((candidate, index) => (
                <div className="draft-pair-editor" key={index}>
                  <IntakeInput
                    label={'Candidate ' + (index + 1)}
                    value={candidate.name}
                    onChange={(value) => updateDraft({
                      suggestedBusinessHoroscopeCandidates:
                        draft.suggestedBusinessHoroscopeCandidates.map(
                          (current, currentIndex) =>
                            currentIndex === index ? { ...current, name: value } : current,
                        ),
                    })}
                  />
                  <IntakeTextArea
                    label="Basis"
                    rows={3}
                    value={candidate.basis}
                    onChange={(value) => updateDraft({
                      suggestedBusinessHoroscopeCandidates:
                        draft.suggestedBusinessHoroscopeCandidates.map(
                          (current, currentIndex) =>
                            currentIndex === index ? { ...current, basis: value } : current,
                        ),
                    })}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="draft-section">
            <h5>Three Strategic Assets</h5>
            <div className="draft-list-editor">
              {draft.suggestedStrategicAssets.map((asset, index) => (
                <div className="draft-pair-editor" key={index}>
                  <IntakeInput
                    label={'Strategic Asset ' + (index + 1)}
                    value={asset.title}
                    onChange={(value) => updateDraft({
                      suggestedStrategicAssets: draft.suggestedStrategicAssets.map(
                        (current, currentIndex) =>
                          currentIndex === index ? { ...current, title: value } : current,
                      ),
                    })}
                  />
                  <IntakeTextArea
                    label="Input basis"
                    rows={3}
                    value={asset.basis}
                    onChange={(value) => updateDraft({
                      suggestedStrategicAssets: draft.suggestedStrategicAssets.map(
                        (current, currentIndex) =>
                          currentIndex === index ? { ...current, basis: value } : current,
                      ),
                    })}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="draft-section">
            <h5>Suggested evidence captions</h5>
            {draft.suggestedEvidenceCaptions.length === 0 ? (
              <p className="operator-empty">Add pasted page text to generate caption suggestions.</p>
            ) : (
              <div className="draft-list-editor">
                {draft.suggestedEvidenceCaptions.map((caption, index) => (
                  <div className="draft-pair-editor" key={caption.observationId || index}>
                    <IntakeTextArea
                      label={'Evidence caption ' + (index + 1)}
                      rows={3}
                      value={caption.caption}
                      onChange={(value) => updateDraft({
                        suggestedEvidenceCaptions: draft.suggestedEvidenceCaptions.map(
                          (current, currentIndex) =>
                            currentIndex === index ? { ...current, caption: value } : current,
                        ),
                      })}
                    />
                    <p>{caption.basis}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="draft-section">
            <h5>Suggested outreach angle</h5>
            <IntakeTextArea
              label="Outreach angle"
              rows={4}
              value={draft.suggestedOutreachAngle}
              onChange={(value) => updateDraft({ suggestedOutreachAngle: value })}
            />
          </section>

          <section className="draft-warning-list">
            <h5>Confidence and missing-information warnings</h5>
            <ul>
              {[...draft.warnings, ...draft.missingInformation].map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

type ReviewKey =
  | 'businessName'
  | 'websiteUrl'
  | 'city'
  | 'niche'
  | 'recommendationSubject'
  | 'contact'
  | 'bookingUrl'
  | 'strengthNotes'
  | 'missedOpportunity'
  | 'competitors'
  | 'strategicAssets'
  | 'primaryOpportunity'
  | 'outreachAngle'
  | 'scores'

type ReviewRow = {
  key: ReviewKey
  label: string
  current: string
  draft: string
  canApply: boolean
}

const reviewKeyOrder: ReviewKey[] = [
  'businessName',
  'websiteUrl',
  'city',
  'niche',
  'recommendationSubject',
  'contact',
  'bookingUrl',
  'strengthNotes',
  'missedOpportunity',
  'competitors',
  'strategicAssets',
  'primaryOpportunity',
  'outreachAngle',
  'scores',
]

function displayValue(value: string) {
  return value.trim() || 'Not set'
}

function formatScoreRanges(draft: DraftAnalysisResult) {
  return scoreKeys.map((key) => {
    const suggestion = draft.scoreSuggestions[key]
    return scoreLabels[key] + ': ' + suggestion.minimum + '–' + suggestion.maximum
  }).join('\n')
}

function ReviewAndApplyStep({
  intake,
  draftCurrent,
  currentForm,
  currentScores,
  currentStrengths,
  currentVisibilityLeaks,
  currentReportOffer,
  activeLead,
  onApply,
  onEditDraft,
}: {
  intake: BusinessIntakePayload
  draftCurrent: boolean
  currentForm: SnapshotForm
  currentScores: Scores
  currentStrengths: string[]
  currentVisibilityLeaks: string[]
  currentReportOffer: ReportOfferFields
  activeLead: Lead | null
  onApply: (application: DraftApplication) => void
  onEditDraft: () => void
}) {
  const draft = intake.draft
  const [selectedKeys, setSelectedKeys] = useState<Set<ReviewKey>>(
    () => new Set(reviewKeyOrder.filter((key) => key !== 'outreachAngle' || Boolean(activeLead))),
  )
  const [rejectedKeys, setRejectedKeys] = useState<Set<ReviewKey>>(() => new Set())
  const [appliedKeys, setAppliedKeys] = useState<Set<ReviewKey>>(() => new Set())
  const [scoreReviewOpen, setScoreReviewOpen] = useState(false)
  const [selectedScoreKeys, setSelectedScoreKeys] = useState<Set<ScoreKey>>(
    () => new Set(scoreKeys),
  )
  const [scoreChoices, setScoreChoices] = useState<Scores>(() =>
    scoreKeys.reduce((choices, key) => {
      choices[key] = draft ? getSuggestionMidpoint(draft.scoreSuggestions[key]) : currentScores[key]
      return choices
    }, { ...currentScores }),
  )
  const [pendingApplication, setPendingApplication] = useState<{
    application: DraftApplication
    keys: ReviewKey[]
    label: string
  } | null>(null)
  const [reviewMessage, setReviewMessage] = useState('')

  if (!draft) {
    return (
      <div className="operator-step-content">
        <p className="operator-empty">Generate a draft in step 6 before reviewing values.</p>
        <button className="primary-button" type="button" onClick={onEditDraft}>
          Go to Draft Analysis
        </button>
      </div>
    )
  }
  const approvedDraft = draft

  const normalizedBusinessUrl = normalizeWebsiteUrl(intake.identity.websiteUrlRaw)
  const normalizedCompetitorUrls = intake.competitorContext.competitors.map((competitor) => {
    const normalized = normalizeWebsiteUrl(competitor.url)
    return normalized.valid ? normalized.normalized : competitor.url.trim()
  })
  const contactDraft = [intake.identity.email, intake.identity.phone]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' · ')
  const competitorDraft = [
    ...normalizedCompetitorUrls.filter(Boolean),
    intake.competitorContext.comparisonNotes.trim(),
  ].filter(Boolean).join('\n')
  const reviewRows: ReviewRow[] = [
    {
      key: 'businessName',
      label: 'Business name',
      current: displayValue(currentForm.businessName),
      draft: displayValue(intake.identity.businessName),
      canApply: true,
    },
    {
      key: 'websiteUrl',
      label: 'Normalized website URL',
      current: displayValue(currentForm.websiteUrl),
      draft: displayValue(normalizedBusinessUrl.normalized),
      canApply: normalizedBusinessUrl.valid,
    },
    {
      key: 'city',
      label: 'City',
      current: displayValue(currentForm.city),
      draft: displayValue(intake.identity.city),
      canApply: true,
    },
    {
      key: 'niche',
      label: 'Niche',
      current: displayValue(currentForm.niche),
      draft: displayValue(intake.identity.niche),
      canApply: Boolean(intake.identity.niche.trim()),
    },
    {
      key: 'recommendationSubject',
      label: 'Primary service / recommendation subject',
      current: displayValue(currentForm.mainService),
      draft: displayValue(draft.suggestedRecommendationSubject),
      canApply: true,
    },
    {
      key: 'contact',
      label: 'CTA contact line',
      current: displayValue(currentReportOffer.ctaContactLine),
      draft: displayValue(contactDraft),
      canApply: Boolean(contactDraft),
    },
    {
      key: 'bookingUrl',
      label: 'Booking URL',
      current: displayValue(currentReportOffer.bookingUrl),
      draft: displayValue(intake.identity.bookingUrl),
      canApply: Boolean(intake.identity.bookingUrl.trim()),
    },
    {
      key: 'strengthNotes',
      label: 'Strength notes',
      current: displayValue(currentForm.notes),
      draft: displayValue(draft.suggestedStrengthNotes.join(' ')),
      canApply: draft.suggestedStrengthNotes.some((note) => note.trim()),
    },
    {
      key: 'missedOpportunity',
      label: 'Missed opportunity',
      current: displayValue(currentForm.weakness),
      draft: displayValue(draft.suggestedMissedOpportunity),
      canApply: true,
    },
    {
      key: 'competitors',
      label: 'Competitor context',
      current: displayValue([
        currentForm.competitorUrl1,
        currentForm.competitorUrl2,
        currentForm.competitorNote,
      ].filter(Boolean).join('\n')),
      draft: displayValue(competitorDraft),
      canApply: Boolean(competitorDraft),
    },
    {
      key: 'strategicAssets',
      label: 'Strategic Assets',
      current: displayValue(currentStrengths.join('\n')),
      draft: displayValue(draft.suggestedStrategicAssets.map((asset) => asset.title).join('\n')),
      canApply: true,
    },
    {
      key: 'primaryOpportunity',
      label: 'Primary opportunity context',
      current: displayValue(currentVisibilityLeaks.join('\n')),
      draft: displayValue(draft.suggestedPrimaryOpportunity),
      canApply: true,
    },
    {
      key: 'outreachAngle',
      label: 'Lead Queue outreach angle',
      current: activeLead
        ? displayValue(activeLead.suggestedAngle)
        : 'No selected Lead Queue item',
      draft: displayValue(draft.suggestedOutreachAngle),
      canApply: Boolean(activeLead),
    },
    {
      key: 'scores',
      label: 'Category scores',
      current: scoreKeys.map((key) => scoreLabels[key] + ': ' + currentScores[key]).join('\n'),
      draft: formatScoreRanges(draft),
      canApply: true,
    },
  ]

  function addFormPatch(
    application: DraftApplication,
    patch: Partial<SnapshotForm>,
  ) {
    application.formPatch = { ...application.formPatch, ...patch }
  }

  function buildApplication(keys: ReviewKey[], scorePatch?: Partial<Scores>) {
    const application: DraftApplication = {}
    keys.forEach((key) => {
      if (key === 'businessName') {
        addFormPatch(application, { businessName: intake.identity.businessName })
      } else if (key === 'websiteUrl') {
        addFormPatch(application, { websiteUrl: normalizedBusinessUrl.normalized })
      } else if (key === 'city') {
        addFormPatch(application, { city: intake.identity.city })
      } else if (key === 'niche') {
        addFormPatch(application, { niche: intake.identity.niche })
      } else if (key === 'recommendationSubject') {
        addFormPatch(application, { mainService: approvedDraft.suggestedRecommendationSubject })
      } else if (key === 'contact') {
        application.reportOfferPatch = {
          ...application.reportOfferPatch,
          ctaContactLine: contactDraft,
        }
      } else if (key === 'bookingUrl') {
        application.reportOfferPatch = {
          ...application.reportOfferPatch,
          bookingUrl: intake.identity.bookingUrl,
        }
      } else if (key === 'strengthNotes') {
        addFormPatch(application, { notes: approvedDraft.suggestedStrengthNotes.join(' ') })
      } else if (key === 'missedOpportunity') {
        addFormPatch(application, { weakness: approvedDraft.suggestedMissedOpportunity })
      } else if (key === 'competitors') {
        addFormPatch(application, {
          competitorUrl1: normalizedCompetitorUrls[0],
          competitorUrl2: normalizedCompetitorUrls[1],
          competitorNote: intake.competitorContext.comparisonNotes
            || intake.competitorContext.competitors
              .map((competitor) => competitor.notes.trim())
              .filter(Boolean)
              .join(' '),
        })
      } else if (key === 'strategicAssets') {
        application.strengths = approvedDraft.suggestedStrategicAssets
          .map((asset) => asset.title.trim())
          .filter(Boolean)
      } else if (key === 'primaryOpportunity') {
        application.visibilityLeaks = [approvedDraft.suggestedPrimaryOpportunity].filter(Boolean)
      } else if (key === 'outreachAngle') {
        application.outreachAngle = approvedDraft.suggestedOutreachAngle
      } else if (key === 'scores') {
        application.scorePatch = scorePatch || scoreChoices
      }
    })
    return application
  }

  function completeApplication(
    application: DraftApplication,
    keys: ReviewKey[],
    label: string,
  ) {
    onApply(application)
    setAppliedKeys((current) => new Set([...current, ...keys]))
    setRejectedKeys((current) => {
      const next = new Set(current)
      keys.forEach((key) => next.delete(key))
      return next
    })
    setReviewMessage(label)
  }

  function requestApplication(
    keys: ReviewKey[],
    label: string,
    scorePatch?: Partial<Scores>,
  ) {
    const applicable = keys.filter(
      (key) => reviewRows.find((row) => row.key === key)?.canApply,
    )
    if (applicable.length === 0) return
    const application = buildApplication(applicable, scorePatch)
    if (application.scorePatch) {
      setPendingApplication({ application, keys: applicable, label })
      return
    }
    completeApplication(application, applicable, label)
  }

  function rejectKey(key: ReviewKey) {
    setRejectedKeys((current) => new Set([...current, key]))
    setSelectedKeys((current) => {
      const next = new Set(current)
      next.delete(key)
      return next
    })
    setReviewMessage('Suggestion rejected; current Snapshot value was kept.')
  }

  function toggleSelected(key: ReviewKey) {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setRejectedKeys((current) => {
      const next = new Set(current)
      next.delete(key)
      return next
    })
  }

  function midpointPatch() {
    return scoreKeys.reduce<Partial<Scores>>((scores, key) => {
      scores[key] = getSuggestionMidpoint(approvedDraft.scoreSuggestions[key])
      return scores
    }, {})
  }

  function reviewedScorePatch() {
    return scoreKeys.reduce<Partial<Scores>>((scores, key) => {
      if (selectedScoreKeys.has(key)) scores[key] = scoreChoices[key]
      return scores
    }, {})
  }

  return (
    <div className="operator-step-content">
      {!draftCurrent && (
        <div className="operator-warning-card">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <strong>Draft is stale</strong>
            <p>Return to Draft Analysis and refresh it before applying values.</p>
          </div>
        </div>
      )}

      <div className="review-toolbar">
        <div>
          <span className="draft-label">Draft comparison — review required</span>
          <h4>Current Snapshot vs generated draft</h4>
          <p>
            Apply one value, choose several, reject a suggestion, or return to edit the draft.
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onEditDraft}>
          Edit draft
        </button>
      </div>

      <section className="score-application-panel" aria-labelledby="score-application-title">
        <div>
          <h5 id="score-application-title">Score suggestions</h5>
          <p>
            Suggested ranges never set scores silently. Every score change requires confirmation.
          </p>
        </div>
        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            disabled={!draftCurrent}
            onClick={() => requestApplication(
              ['scores'],
              'Midpoint score suggestions applied after confirmation.',
              midpointPatch(),
            )}
          >
            Apply midpoint suggestions
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setScoreReviewOpen((open) => !open)}
          >
            Review each score
          </button>
        </div>

        {scoreReviewOpen && (
          <div className="score-review-list">
            {scoreKeys.map((key) => {
              const suggestion = draft.scoreSuggestions[key]
              return (
                <article key={key}>
                  <label className="score-review-check">
                    <input
                      type="checkbox"
                      checked={selectedScoreKeys.has(key)}
                      onChange={() => setSelectedScoreKeys((current) => {
                        const next = new Set(current)
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                        return next
                      })}
                    />
                    <span>
                      <strong>{scoreLabels[key]}</strong>
                      <small>
                        Suggested {suggestion.minimum}–{suggestion.maximum} · {suggestion.confidence}
                      </small>
                    </span>
                  </label>
                  <label className="final-score-field">
                    <span>Operator final score</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scoreChoices[key]}
                      onChange={(event) => setScoreChoices((current) => ({
                        ...current,
                        [key]: Math.min(20, Math.max(0, Number(event.target.value))),
                      }))}
                    />
                  </label>
                  <p>{suggestion.explanation}</p>
                  <details>
                    <summary>Evidence and input basis</summary>
                    <ul>
                      {suggestion.basis.map((basis) => <li key={basis}>{basis}</li>)}
                    </ul>
                  </details>
                </article>
              )
            })}
            <button
              className="primary-button"
              type="button"
              disabled={!draftCurrent || selectedScoreKeys.size === 0}
              onClick={() => requestApplication(
                ['scores'],
                'Reviewed final scores applied after confirmation.',
                reviewedScorePatch(),
              )}
            >
              Apply reviewed scores
            </button>
          </div>
        )}
      </section>

      <div className="review-comparison-list">
        {reviewRows.map((row) => {
          const rejected = rejectedKeys.has(row.key)
          const applied = appliedKeys.has(row.key)
          return (
            <article
              className={
                'review-comparison-row'
                + (rejected ? ' rejected' : '')
                + (applied ? ' applied' : '')
              }
              key={row.key}
            >
              <label className="review-select">
                <input
                  type="checkbox"
                  checked={selectedKeys.has(row.key)}
                  disabled={!row.canApply || !draftCurrent}
                  onChange={() => toggleSelected(row.key)}
                />
                <span>{row.label}</span>
              </label>
              <ReviewValue label="Current Snapshot" value={row.current} />
              <ReviewValue label="Generated draft" value={row.draft} draft />
              <div className="review-row-actions">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!row.canApply || !draftCurrent}
                  onClick={() => requestApplication(
                    [row.key],
                    row.label + ' applied to the existing Snapshot.',
                  )}
                >
                  {applied ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
                  Apply
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={applied}
                  onClick={() => rejectKey(row.key)}
                >
                  Reject
                </button>
              </div>
              {!row.canApply && (
                <small className="review-row-note">
                  Select a Lead Queue item or add the required value before applying.
                </small>
              )}
            </article>
          )
        })}
      </div>

      <div className="review-apply-selected">
        <div>
          <strong>{selectedKeys.size} suggestion{selectedKeys.size === 1 ? '' : 's'} selected</strong>
          <p>Manual scores are still protected by a confirmation step.</p>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={!draftCurrent || selectedKeys.size === 0}
          onClick={() => requestApplication(
            Array.from(selectedKeys).filter((key) => !rejectedKeys.has(key)),
            'Selected draft values applied to the existing Snapshot.',
          )}
        >
          Apply selected
        </button>
      </div>

      {pendingApplication && (
        <div className="score-confirmation" role="alert">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <strong>Confirm score replacement</strong>
            <p>
              This will replace the selected current score values. Other selected draft fields
              will apply at the same time.
            </p>
            <div className="score-confirmation-grid">
              {Object.entries(pendingApplication.application.scorePatch || {}).map(
                ([key, value]) => (
                  <span key={key}>
                    {scoreLabels[key as ScoreKey]}: {currentScores[key as ScoreKey]} → {value}
                  </span>
                ),
              )}
            </div>
            <div className="button-row">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  completeApplication(
                    pendingApplication.application,
                    pendingApplication.keys,
                    pendingApplication.label,
                  )
                  setPendingApplication(null)
                }}
              >
                Confirm and apply
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setPendingApplication(null)}
              >
                Keep current scores
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewMessage && <p className="operator-status" role="status">{reviewMessage}</p>}
    </div>
  )
}

function ReviewValue({
  label,
  value,
  draft = false,
}: {
  label: string
  value: string
  draft?: boolean
}) {
  return (
    <div className={'review-value ' + (draft ? 'draft' : 'current')}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  )
}

function IntakeInput({
  label,
  value,
  required = false,
  inputMode,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  required?: boolean
  inputMode?: 'text' | 'url' | 'email' | 'tel' | 'numeric' | 'decimal'
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="operator-field">
      <span>
        {label}
        {required && <em>Required</em>}
      </span>
      <input
        required={required}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function IntakeTextArea({
  label,
  value,
  required = false,
  rows = 4,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  required?: boolean
  rows?: number
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="operator-field">
      <span>
        {label}
        {required && <em>Required</em>}
      </span>
      <textarea
        required={required}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
