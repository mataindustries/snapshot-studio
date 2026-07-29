import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  Gauge,
  ImagePlus,
  Mail,
  MessageSquare,
  Phone,
  Printer,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from 'lucide-react'
import type {
  BusinessIntakePayload,
  EvidenceItem,
  Lead,
  LeadPriority,
  LeadStatus,
  RecommendedAction,
  SavedSnapshot,
  ScoreKey,
  Scores,
  SnapshotForm,
} from '../types'
import type { FastLaneSession, SendKitBlockId } from '../types/fastLane'
import type { Proposal, ProposalType } from '../types/proposal'
import type { DraftApplicationChange } from '../lib/draftApplication'
import type { FastLaneStepReadiness } from '../lib/fastLaneReadiness'
import type { ReportReadinessResult } from '../lib/reportReadiness'
import type { ProposalReadiness } from '../lib/proposalReadiness'
import type { SendKitBlock } from '../lib/sendKit'
import { actionStatusClass, getBlockingActions } from '../lib/actionProgress'
import { normalizeWebsiteUrl } from '../lib/intakeParser'
import { isEvidenceReportReady } from '../lib/evidence'
import { leadStatuses } from '../lib/leads'
import { scoreLabels } from '../lib/scoring'

const scoreKeys = Object.keys(scoreLabels) as ScoreKey[]
const proposalTypes: ProposalType[] = [
  '48-Hour Visibility Sprint',
  'Custom Implementation',
  '30-Day Local Authority Buildout',
]

function StepHeading({ id, number, title, copy, readiness }: {
  id: string
  number: number
  title: string
  copy: string
  readiness: FastLaneStepReadiness
}) {
  return (
    <header className="fast-lane-step-heading">
      <div>
        <span>Step {number}</span>
        <h3 id={id}>{title}</h3>
        <p>{copy}</p>
      </div>
      <span className={`fast-lane-readiness is-${readiness.state.toLowerCase().replaceAll(' ', '-')}`}>
        {readiness.label}
      </span>
    </header>
  )
}

function Field({ label, value, onChange, type = 'text', inputMode }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'url' | 'email' | 'tel' | 'numeric' | 'decimal'
}) {
  return (
    <label className="fast-lane-field">
      <span>{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function FastLaneLeadStep({
  session,
  leads,
  readiness,
  onLeadChange,
  onChooseLead,
  onSaveLead,
  onOpenWorkspace,
}: {
  session: FastLaneSession
  leads: Lead[]
  readiness: FastLaneStepReadiness
  onLeadChange: (values: Partial<FastLaneSession['leadDraft']>) => void
  onChooseLead: (lead: Lead) => void
  onSaveLead: () => void
  onOpenWorkspace: () => void
}) {
  const draft = session.leadDraft
  const normalizedUrl = normalizeWebsiteUrl(draft.websiteUrl)
  const linked = session.leadId ? leads.find((lead) => lead.id === session.leadId) : undefined

  return (
    <section className="fast-lane-step" aria-labelledby="fast-lane-lead-title">
      <StepHeading
        id="fast-lane-lead-title"
        number={1}
        title="Lead"
        copy="Confirm only the business and contact details needed to begin."
        readiness={readiness}
      />

      <div className="fast-lane-source-row">
        <label className="fast-lane-field">
          <span>Choose existing lead</span>
          <select
            value={session.leadId || ''}
            onChange={(event) => {
              const lead = leads.find((item) => item.id === event.target.value)
              if (lead) onChooseLead(lead)
            }}
          >
            <option value="">Blank lead</option>
            {leads.map((lead) => (
              <option value={lead.id} key={lead.id}>
                {lead.businessName || 'Untitled lead'} · {lead.city || 'No city'}
              </option>
            ))}
          </select>
        </label>
        <div>
          <strong>{linked ? 'Updating existing lead' : 'New lead draft'}</strong>
          <small>{linked ? 'Stable lead ID will be reused.' : 'No lead is created until you save it.'}</small>
        </div>
      </div>

      <div className="fast-lane-field-grid">
        <Field label="Business name" value={draft.businessName} onChange={(businessName) => onLeadChange({ businessName })} />
        <Field label="Website URL" inputMode="url" value={draft.websiteUrl} onChange={(websiteUrl) => onLeadChange({ websiteUrl })} />
        <Field label="City" value={draft.city} onChange={(city) => onLeadChange({ city })} />
        <Field label="Niche" value={draft.niche} onChange={(niche) => onLeadChange({ niche })} />
        <Field label="Primary service" value={draft.mainService} onChange={(mainService) => onLeadChange({ mainService })} />
        <Field label="Email optional" type="email" inputMode="email" value={draft.email} onChange={(email) => onLeadChange({ email })} />
        <Field label="Phone optional" inputMode="tel" value={draft.phone} onChange={(phone) => onLeadChange({ phone })} />
        <Field label="Contact form URL optional" inputMode="url" value={draft.contactFormUrl} onChange={(contactFormUrl) => onLeadChange({ contactFormUrl })} />
        <label className="fast-lane-field">
          <span>Priority</span>
          <select value={draft.priority} onChange={(event) => onLeadChange({ priority: event.target.value as LeadPriority })}>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </label>
        <label className="fast-lane-field">
          <span>Lead status</span>
          <select value={draft.status} onChange={(event) => onLeadChange({ status: event.target.value as LeadStatus })}>
            {leadStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>

      {draft.websiteUrl && (
        <p className={`fast-lane-inline-note ${normalizedUrl.valid ? 'is-good' : 'is-warning'}`}>
          <strong>Normalized URL:</strong> {normalizedUrl.normalized || 'Review the entered URL.'}
          {normalizedUrl.warning && <span>{normalizedUrl.warning}</span>}
        </p>
      )}
      {readiness.warnings.map((warning) => <p className="fast-lane-warning" key={warning}><AlertTriangle size={16} />{warning}</p>)}
      <div className="fast-lane-step-actions">
        <button className="primary-button" type="button" onClick={onSaveLead}><Save size={17} />{linked ? 'Update existing lead' : 'Save new lead'}</button>
        <button className="ghost-button" type="button" onClick={onOpenWorkspace}>Open Lead Queue <ExternalLink size={15} /></button>
      </div>
    </section>
  )
}

export function FastLaneResearchStep({
  intake,
  readiness,
  evidenceCount,
  onChange,
  onAttachScreenshot,
  onOpenWorkspace,
}: {
  intake: BusinessIntakePayload
  readiness: FastLaneStepReadiness
  evidenceCount: number
  onChange: (intake: BusinessIntakePayload) => void
  onAttachScreenshot: () => void
  onOpenWorkspace: () => void
}) {
  function patchWebsite(values: Partial<BusinessIntakePayload['website']>) {
    onChange({ ...intake, website: { ...intake.website, ...values }, updatedAt: new Date().toISOString() })
  }
  function patchIdentity(values: Partial<BusinessIntakePayload['identity']>) {
    onChange({ ...intake, identity: { ...intake.identity, ...values }, updatedAt: new Date().toISOString() })
  }
  function patchProfile(values: Partial<BusinessIntakePayload['publicProfile']>) {
    onChange({ ...intake, publicProfile: { ...intake.publicProfile, ...values }, updatedAt: new Date().toISOString() })
  }
  function focus(id: string) {
    document.getElementById(id)?.focus()
  }

  return (
    <section className="fast-lane-step" aria-labelledby="fast-lane-research-title">
      <StepHeading
        id="fast-lane-research-title"
        number={2}
        title="Research"
        copy="Add the material you reviewed. The draft never visits or verifies a website."
        readiness={readiness}
      />
      <div className="fast-lane-disclosure"><FileCheck2 size={19} /><strong>Draft analysis uses only the information entered here.</strong></div>
      <div className="fast-lane-quick-actions" aria-label="Research shortcuts">
        <button type="button" onClick={() => focus('fast-lane-page-text')}>Paste homepage text</button>
        <button type="button" onClick={() => focus('fast-lane-profile-notes')}>Add Google profile notes</button>
        <button type="button" onClick={() => focus('fast-lane-competitor-note')}>Add one competitor</button>
        <button type="button" onClick={onAttachScreenshot}><ImagePlus size={16} /> Attach screenshot</button>
        <button type="button" onClick={() => focus('fast-lane-research-next')}>Skip for now</button>
      </div>
      <label className="fast-lane-field fast-lane-large-text">
        <span>Paste website or profile text</span>
        <textarea
          id="fast-lane-page-text"
          rows={9}
          value={intake.website.pageText}
          placeholder="Paste visible homepage text, a public-profile description, or notes from a source you reviewed."
          onChange={(event) => patchWebsite({ pageText: event.target.value })}
        />
      </label>
      <div className="fast-lane-field-grid">
        <Field label="Homepage headline optional" value={intake.website.heroHeadline} onChange={(heroHeadline) => patchWebsite({ heroHeadline })} />
        <Field label="Primary CTA optional" value={intake.website.primaryCta} onChange={(primaryCta) => patchWebsite({ primaryCta })} />
        <Field label="Public rating optional" inputMode="decimal" value={intake.publicProfile.googleRating} onChange={(googleRating) => patchProfile({ googleRating })} />
        <Field label="Review count optional" inputMode="numeric" value={intake.publicProfile.reviewCount} onChange={(reviewCount) => patchProfile({ reviewCount })} />
        <label className="fast-lane-field">
          <span>One strength note</span>
          <textarea rows={3} value={intake.identity.differentiators} onChange={(event) => patchIdentity({ differentiators: event.target.value })} />
        </label>
        <label className="fast-lane-field">
          <span>One missed opportunity</span>
          <textarea id="fast-lane-profile-notes" rows={3} value={intake.publicProfile.profileCompletenessNotes} onChange={(event) => patchProfile({ profileCompletenessNotes: event.target.value })} />
        </label>
        <label className="fast-lane-field fast-lane-span-two">
          <span>Competitor note optional</span>
          <textarea
            id="fast-lane-competitor-note"
            rows={3}
            value={intake.competitorContext.competitors[0].notes}
            onChange={(event) => onChange({
              ...intake,
              competitorContext: {
                ...intake.competitorContext,
                competitors: [
                  { ...intake.competitorContext.competitors[0], notes: event.target.value },
                  intake.competitorContext.competitors[1],
                ],
              },
              updatedAt: new Date().toISOString(),
            })}
          />
        </label>
      </div>
      <div className="fast-lane-evidence-handoff">
        <div><strong>{evidenceCount} evidence item{evidenceCount === 1 ? '' : 's'} linked to the open Snapshot</strong><small>Screenshots remain in Evidence Manager; Fast Lane keeps IDs only.</small></div>
        <button className="secondary-button" type="button" onClick={onAttachScreenshot}><ImagePlus size={17} /> Screenshot / evidence handoff</button>
      </div>
      <div className="fast-lane-step-actions" id="fast-lane-research-next">
        <button className="ghost-button" type="button" onClick={onOpenWorkspace}>Open full intake workspace <ExternalLink size={15} /></button>
      </div>
    </section>
  )
}

export function FastLaneDraftStep({
  intake,
  scores,
  readiness,
  changes,
  includeScores,
  onIncludeScoresChange,
  onGenerate,
  onApply,
  onReviewScores,
  onEditDraft,
  onOpenWorkspace,
}: {
  intake: BusinessIntakePayload
  scores: Scores
  readiness: FastLaneStepReadiness
  changes: DraftApplicationChange[]
  includeScores: boolean
  onIncludeScoresChange: (value: boolean) => void
  onGenerate: () => void
  onApply: () => void
  onReviewScores: () => void
  onEditDraft: () => void
  onOpenWorkspace: () => void
}) {
  const draft = intake.draft
  return (
    <section className="fast-lane-step" aria-labelledby="fast-lane-draft-title">
      <StepHeading id="fast-lane-draft-title" number={3} title="Recommended Draft" copy="Review the concise recommendation first; the full comparison remains available." readiness={readiness} />
      {!draft ? (
        <div className="fast-lane-empty-state">
          <Sparkles size={28} />
          <h4>Generate the existing deterministic draft</h4>
          <p>Only entered intake material is used. Sparse inputs create wider ranges and visible warnings.</p>
          <button className="primary-button" type="button" onClick={onGenerate}>Generate draft</button>
        </div>
      ) : (
        <>
          <div className="fast-lane-draft-grid">
            <article className="fast-lane-score-ranges">
              <span>Suggested score ranges</span>
              {scoreKeys.map((key) => (
                <div key={key}>
                  <strong>{scoreLabels[key]}</strong>
                  <span>{draft.scoreSuggestions[key].minimum}–{draft.scoreSuggestions[key].maximum}</span>
                  <small>Current {scores[key]}/20 · {draft.scoreSuggestions[key].confidence} confidence</small>
                </div>
              ))}
            </article>
            <article><span>Suggested strengths</span><ul>{draft.suggestedStrengthNotes.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article><span>Highest-leverage opportunity</span><strong>{draft.suggestedPrimaryOpportunity}</strong><p>{draft.suggestedMissedOpportunity}</p></article>
            <article><span>Recommendation subject</span><strong>{draft.suggestedRecommendationSubject}</strong></article>
            <article><span>Three Strategic Assets</span><ol>{draft.suggestedStrategicAssets.slice(0, 3).map((asset) => <li key={asset.title}>{asset.title}</li>)}</ol></article>
            <article><span>Outreach angle</span><p>{draft.suggestedOutreachAngle}</p></article>
          </div>
          {(draft.warnings.length > 0 || draft.missingInformation.length > 0) && (
            <details className="fast-lane-details" open>
              <summary><AlertTriangle size={16} /> Missing-information warnings</summary>
              <ul>{[...draft.warnings, ...draft.missingInformation].map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </details>
          )}
          <section className="fast-lane-change-review" aria-label="Recommended draft changes">
            <div>
              <h4>What will change — and what stays protected</h4>
              <p>Existing manual values marked “Retained” will not be replaced.</p>
            </div>
            <label className="fast-lane-score-confirm-toggle">
              <input type="checkbox" checked={includeScores} onChange={(event) => onIncludeScoresChange(event.target.checked)} />
              <span><strong>Replace scores with suggested midpoints</strong><small>Requires confirmation. Leave off to keep every current score.</small></span>
            </label>
            <div className="fast-lane-change-list">
              {changes.map((change) => (
                <div key={`${change.label}-${change.to}`}>
                  <strong>{change.label}</strong>
                  <span>{change.from} → {change.to}</span>
                  {change.protected && <em>Retained</em>}
                </div>
              ))}
            </div>
          </section>
          <div className="fast-lane-step-actions">
            <button className="primary-button" type="button" onClick={onApply}><ClipboardCheck size={17} /> Use recommended draft</button>
            <button className="secondary-button" type="button" onClick={onReviewScores}><Gauge size={17} /> Review scores</button>
            <button className="secondary-button" type="button" onClick={onEditDraft}>Edit draft</button>
            <button className="ghost-button" type="button" onClick={onOpenWorkspace}>Open full intake workspace <ExternalLink size={15} /></button>
          </div>
        </>
      )}
    </section>
  )
}

export function FastLaneSnapshotStep({
  snapshot,
  form,
  totalScore,
  horoscope,
  growthStage,
  highestOpportunity,
  reportReadiness,
  evidenceItems,
  actions,
  readiness,
  onSave,
  onUsePreliminary,
  onPreview,
  onPrint,
  onOpenAudit,
  onOpenActions,
  onReturnDraft,
}: {
  snapshot?: SavedSnapshot
  form: SnapshotForm
  totalScore: number
  horoscope: string
  growthStage: string
  highestOpportunity: string
  reportReadiness: ReportReadinessResult
  evidenceItems: EvidenceItem[]
  actions: RecommendedAction[]
  readiness: FastLaneStepReadiness
  onSave: () => void
  onUsePreliminary: () => void
  onPreview: () => void
  onPrint: () => void
  onOpenAudit: () => void
  onOpenActions: () => void
  onReturnDraft: () => void
}) {
  const completed = actions.filter((action) => action.status === 'Completed').length
  const screenshotCount = evidenceItems.filter((item) => item.screenshotDataUrl).length
  const reportReadyEvidenceCount = evidenceItems.filter(isEvidenceReportReady).length
  return (
    <section className="fast-lane-step" aria-labelledby="fast-lane-snapshot-title">
      <StepHeading id="fast-lane-snapshot-title" number={4} title="Snapshot" copy="Review the client-facing result without leaving the operator flow." readiness={readiness} />
      <article className="fast-lane-snapshot-card">
        <div className="fast-lane-snapshot-score"><span>Current Position</span><strong>{totalScore}<small>/100</small></strong><em>{snapshot ? 'Saved Snapshot' : 'Unsaved review'}</em></div>
        <dl>
          <div><dt>Business</dt><dd>{form.businessName || 'Business name needed'}{form.city ? ` · ${form.city}` : ''}</dd></div>
          <div><dt>Business Archetype</dt><dd>{horoscope}</dd></div>
          <div><dt>Growth Stage</dt><dd>{growthStage}</dd></div>
          <div><dt>Highest-leverage improvement</dt><dd>{highestOpportunity}</dd></div>
          <div><dt>Report readiness</dt><dd>{reportReadiness.state}</dd></div>
          <div><dt>Evidence status</dt><dd>{reportReadyEvidenceCount ? `${reportReadyEvidenceCount} report-ready · ${screenshotCount} screenshots` : 'Preliminary — no report-ready evidence'}</dd></div>
          <div><dt>Action progress</dt><dd>{completed}/{actions.length} completed</dd></div>
        </dl>
      </article>
      {reportReadiness.warnings.length > 0 && (
        <details className="fast-lane-details">
          <summary><AlertTriangle size={16} /> {reportReadiness.warnings.length} readiness note{reportReadiness.warnings.length === 1 ? '' : 's'}</summary>
          <ul>{reportReadiness.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      )}
      {!evidenceItems.length && !snapshot && (
        <button className="fast-lane-preliminary-button" type="button" onClick={onUsePreliminary}>
          <FileText size={18} /><span><strong>Save and continue as a preliminary Snapshot</strong><small>Missing evidence remains clearly labeled; no website truth is inferred.</small></span>
        </button>
      )}
      <div className="fast-lane-step-actions">
        <button className="primary-button" type="button" onClick={onSave}><Save size={17} /> Save Snapshot</button>
        <button className="secondary-button" type="button" onClick={onPreview}>Preview report</button>
        <button className="secondary-button" type="button" onClick={onPrint}><Printer size={17} /> Print / Save PDF</button>
        <button className="ghost-button" type="button" onClick={onOpenAudit}>Open full Audit Profile <ExternalLink size={15} /></button>
        <button className="ghost-button" type="button" onClick={onOpenActions}>Open Action Control Center <ExternalLink size={15} /></button>
        <button className="ghost-button" type="button" onClick={onReturnDraft}><ArrowLeft size={15} /> Return to draft</button>
      </div>
    </section>
  )
}

export function FastLaneProposalStep({
  snapshot,
  proposal,
  proposalReadiness,
  readiness,
  onCreate,
  onChange,
  onUseRecommended,
  onSave,
  onPreview,
  onPrint,
  onOpenWorkspace,
  onSkip,
}: {
  snapshot?: SavedSnapshot
  proposal?: Proposal
  proposalReadiness?: ProposalReadiness
  readiness: FastLaneStepReadiness
  onCreate: () => void
  onChange: (proposal: Proposal) => void
  onUseRecommended: (type: ProposalType) => void
  onSave: () => void
  onPreview: () => void
  onPrint: () => void
  onOpenWorkspace: () => void
  onSkip: () => void
}) {
  if (!proposal) {
    return (
      <section className="fast-lane-step" aria-labelledby="fast-lane-proposal-title">
        <StepHeading id="fast-lane-proposal-title" number={5} title="Proposal" copy="Create the existing proposal with strong defaults, or skip it and continue." readiness={readiness} />
        <div className="fast-lane-empty-state">
          <FileText size={28} /><h4>{snapshot ? 'Build a proposal from this Snapshot' : 'Save the Snapshot first'}</h4>
          <p>Completed and deferred actions are excluded from the recommended scope. In-progress actions keep their visible status.</p>
          <div className="fast-lane-step-actions">
            <button className="primary-button" type="button" disabled={!snapshot} onClick={onCreate}>Create recommended proposal</button>
            <button className="secondary-button" type="button" onClick={onSkip}>Skip proposal</button>
          </div>
        </div>
      </section>
    )
  }

  const selected = new Set(proposal.selectedActionIds)
  const actions = snapshot?.recommendedActions || []
  const patch = <K extends keyof Proposal>(key: K, value: Proposal[K]) => onChange({ ...proposal, [key]: value })
  function toggleAction(actionId: string) {
    const next = new Set(selected)
    if (next.has(actionId)) next.delete(actionId)
    else next.add(actionId)
    patch('selectedActionIds', Array.from(next))
  }

  return (
    <section className="fast-lane-step" aria-labelledby="fast-lane-proposal-title">
      <StepHeading id="fast-lane-proposal-title" number={5} title="Proposal" copy="Confirm scope, timing, investment, and the client next step." readiness={readiness} />
      <div className="fast-lane-field-grid">
        <label className="fast-lane-field">
          <span>Proposal type</span>
          <select value={proposal.proposalType} onChange={(event) => onUseRecommended(event.target.value as ProposalType)}>
            {proposalTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <Field label="Proposal title" value={proposal.proposalTitle} onChange={(proposalTitle) => patch('proposalTitle', proposalTitle)} />
        <Field label="Timeline" value={proposal.timeline} onChange={(timeline) => patch('timeline', timeline)} />
        <label className="fast-lane-field">
          <span>Investment mode</span>
          <select value={proposal.investmentMode} onChange={(event) => patch('investmentMode', event.target.value as Proposal['investmentMode'])}>
            <option>Fixed Price</option><option>Custom Estimate</option><option>Hide Pricing</option>
          </select>
        </label>
        {proposal.investmentMode === 'Fixed Price' && <Field label="Fixed price" inputMode="decimal" value={proposal.fixedPrice || ''} onChange={(fixedPrice) => patch('fixedPrice', fixedPrice || undefined)} />}
        {proposal.investmentMode === 'Fixed Price' && <Field label="Currency" value={proposal.currency} onChange={(currency) => patch('currency', currency)} />}
        {proposal.investmentMode === 'Custom Estimate' && <Field label="Custom estimate" value={proposal.customInvestmentText || ''} onChange={(customInvestmentText) => patch('customInvestmentText', customInvestmentText || undefined)} />}
        {proposal.investmentMode !== 'Hide Pricing' && <Field label="Payment terms" value={proposal.paymentTerms} onChange={(paymentTerms) => patch('paymentTerms', paymentTerms)} />}
        <Field label="Contact / CTA" value={proposal.contactLine} onChange={(contactLine) => patch('contactLine', contactLine)} />
        <Field label="CTA label" value={proposal.ctaLabel} onChange={(ctaLabel) => patch('ctaLabel', ctaLabel)} />
      </div>
      <section className="fast-lane-scope" aria-labelledby="fast-lane-scope-title">
        <div><h4 id="fast-lane-scope-title">Recommended scope</h4><span>{selected.size} selected</span></div>
        {actions.map((action) => {
          const blockers = getBlockingActions(action, actions)
          return (
            <label className={selected.has(action.id) ? 'is-selected' : ''} key={action.id}>
              <input type="checkbox" checked={selected.has(action.id)} onChange={() => toggleAction(action.id)} />
              <span><strong>{action.title}</strong><small>{action.category} · {action.estimatedEffort} effort</small><small>{action.description}</small></span>
              <em className={`proposal-action-status ${actionStatusClass(action.status)}`}>{action.status}</em>
              {blockers.length > 0 && <small className="fast-lane-dependency">Dependency: {blockers.map((item) => item.title).join(', ')}</small>}
            </label>
          )
        })}
      </section>
      <section className="fast-lane-deliverables" aria-labelledby="fast-lane-deliverables-title">
        <div>
          <h4 id="fast-lane-deliverables-title">Deliverables</h4>
          <span>{selected.size + proposal.customDeliverables.length} in the current setup</span>
        </div>
        <ul>
          {actions.filter((action) => selected.has(action.id)).map((action) => (
            <li key={action.id}>
              <strong>{action.title}</strong>
              <span>{action.description}</span>
            </li>
          ))}
          {proposal.customDeliverables.map((deliverable) => (
            <li key={deliverable.id}>
              <strong>{deliverable.title}</strong>
              <span>{deliverable.description}</span>
            </li>
          ))}
        </ul>
        {selected.size + proposal.customDeliverables.length === 0 && (
          <p>Select at least one action or add a custom deliverable in the full Proposal Workspace.</p>
        )}
      </section>
      {proposalReadiness && proposalReadiness.warnings.length > 0 && (
        <details className="fast-lane-details">
          <summary><AlertTriangle size={16} /> {proposalReadiness.state}</summary>
          <ul>{proposalReadiness.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      )}
      <div className="fast-lane-step-actions">
        <button className="secondary-button" type="button" onClick={() => onUseRecommended(proposal.proposalType)}>Use recommended scope</button>
        <button className="primary-button" type="button" onClick={onSave}><Save size={17} /> Save proposal</button>
        <button className="secondary-button" type="button" onClick={onPreview}>Preview proposal</button>
        <button className="secondary-button" type="button" onClick={onPrint}><Printer size={17} /> Print / Save PDF</button>
        <button className="ghost-button" type="button" onClick={onOpenWorkspace}>Open full Proposal Workspace <ExternalLink size={15} /></button>
        <button className="ghost-button" type="button" onClick={onSkip}>Skip proposal</button>
      </div>
    </section>
  )
}

function routeIcon(route: string) {
  if (route === 'Email') return <Mail size={16} />
  if (route === 'Contact Form') return <FileText size={16} />
  if (route === 'Text') return <MessageSquare size={16} />
  return <Phone size={16} />
}

export function FastLaneSendKitStep({
  session,
  blocks,
  readiness,
  snapshot,
  proposal,
  onRouteChange,
  onEditBlock,
  onResetBlock,
  onCopyBlock,
  onPrintReport,
  onPrintProposal,
  onMarkSent,
  onFollowUpChange,
  onNoFollowUpChange,
  onProposalIncludedChange,
}: {
  session: FastLaneSession
  blocks: SendKitBlock[]
  readiness: FastLaneStepReadiness
  snapshot?: SavedSnapshot
  proposal?: Proposal
  onRouteChange: (route: FastLaneSession['selectedContactRoute']) => void
  onEditBlock: (id: SendKitBlockId, value: string) => void
  onResetBlock: (id: SendKitBlockId) => void
  onCopyBlock: (block: SendKitBlock) => void
  onPrintReport: () => void
  onPrintProposal: () => void
  onMarkSent: () => void
  onFollowUpChange: (value: string) => void
  onNoFollowUpChange: (value: boolean) => void
  onProposalIncludedChange: (value: boolean) => void
}) {
  const routes = [
    session.leadDraft.email ? 'Email' : '',
    session.leadDraft.contactFormUrl ? 'Contact Form' : '',
    session.leadDraft.phone ? 'Text' : '',
    session.leadDraft.phone ? 'Phone Notes' : '',
  ].filter(Boolean) as NonNullable<FastLaneSession['selectedContactRoute']>[]
  const visibleIds: Record<NonNullable<FastLaneSession['selectedContactRoute']>, SendKitBlockId[]> = {
    Email: ['miniSnapshot', 'reportEmail', 'proposalEmail', 'firstFollowUp'],
    'Contact Form': ['miniSnapshot', 'contactForm', 'firstFollowUp'],
    Text: ['miniSnapshot', 'textMessage', 'firstFollowUp'],
    'Phone Notes': ['miniSnapshot', 'phoneNotes', 'firstFollowUp'],
  }
  const visibleBlocks = session.selectedContactRoute
    ? blocks.filter((block) =>
        visibleIds[session.selectedContactRoute!].includes(block.id)
        || block.id === 'proposalEmail',
      )
    : blocks

  return (
    <section className="fast-lane-step" id="fast-lane-send-kit" aria-labelledby="fast-lane-send-title">
      <StepHeading id="fast-lane-send-title" number={6} title="Send Kit" copy="Copy, personalize, and confirm delivery. Nothing is sent automatically." readiness={readiness} />
      {session.preliminarySnapshot && <p className="fast-lane-preliminary-label"><AlertTriangle size={16} /> Preliminary outreach — evidence can be added during implementation planning.</p>}
      <nav className="fast-lane-route-tabs" aria-label="Contact route">
        {routes.map((route) => (
          <button className={session.selectedContactRoute === route ? 'is-active' : ''} type="button" key={route} onClick={() => onRouteChange(route)}>
            {routeIcon(route)} {route}
          </button>
        ))}
      </nav>
      {routes.length === 0 && <p className="fast-lane-warning"><AlertTriangle size={16} />Add an email, contact-form URL, or phone number in the Lead step.</p>}
      <div className="fast-lane-copy-list">
        {visibleBlocks.map((block) => {
          const edited = Object.prototype.hasOwnProperty.call(session.sendKitEdits, block.id)
          const value = session.sendKitEdits[block.id] ?? block.text
          return (
            <article key={block.id}>
              <header><div><strong>{block.label}</strong>{edited && <span>Edited</span>}</div>{block.showCharacterCount && <small>{value.length} characters</small>}</header>
              <textarea aria-label={block.label} rows={block.id === 'textMessage' ? 4 : 8} value={value} onChange={(event) => onEditBlock(block.id, event.target.value)} />
              <div>
                <button className="primary-button" type="button" onClick={() => onCopyBlock({ ...block, text: value })}><Copy size={16} /> Copy</button>
                <button className="ghost-button" type="button" disabled={!edited} onClick={() => onResetBlock(block.id)}><RotateCcw size={15} /> Reset generated version</button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="fast-lane-pdf-actions">
        <button type="button" onClick={onPrintReport}><Printer size={18} /><span><strong>Report PDF action</strong><small>Open Print / Save PDF</small></span></button>
        {proposal && <button type="button" onClick={onPrintProposal}><Printer size={18} /><span><strong>Proposal PDF action</strong><small>Open proposal print view</small></span></button>}
      </div>
      <section className="fast-lane-send-confirm" aria-labelledby="fast-lane-mark-sent-title">
        <div><span>Final confirmation</span><h4 id="fast-lane-mark-sent-title">Mark outreach sent</h4><p>Copying text or opening a PDF never changes status.</p></div>
        <dl>
          <div><dt>Business</dt><dd>{session.leadDraft.businessName || 'Business name needed'}</dd></div>
          <div><dt>Contact route</dt><dd>{session.selectedContactRoute || 'Choose a route'}</dd></div>
          <div><dt>Included</dt><dd>Snapshot{proposal && session.proposalIncluded ? ' + proposal' : ''}</dd></div>
          <div><dt>Snapshot status</dt><dd>{snapshot ? 'Saved' : 'Not saved'}</dd></div>
          <div><dt>Proposal status</dt><dd>{proposal ? proposal.proposalStatus : 'Skipped'}</dd></div>
        </dl>
        {proposal && (
          <label className="fast-lane-check-row"><input type="checkbox" checked={session.proposalIncluded} onChange={(event) => onProposalIncludedChange(event.target.checked)} /><span>Confirm the proposal was included</span></label>
        )}
        <div className="fast-lane-follow-up">
          <Field label="Next follow-up date" type="date" value={session.followUpDate} onChange={onFollowUpChange} />
          <label className="fast-lane-check-row"><input type="checkbox" checked={session.noFollowUp} onChange={(event) => onNoFollowUpChange(event.target.checked)} /><span>No follow-up scheduled</span></label>
        </div>
        <button className="fast-lane-mark-sent-button" type="button" disabled={readiness.state === 'Blocked' || !session.selectedContactRoute} onClick={onMarkSent}><Send size={19} /> Mark outreach sent</button>
      </section>
      {session.activity.length > 0 && (
        <details className="fast-lane-activity">
          <summary><CheckCircle2 size={16} /> Recent Fast Lane activity</summary>
          <ol>{[...session.activity].reverse().slice(0, 8).map((item) => <li key={item.id}><span>{item.type}</span><time>{new Date(item.occurredAt).toLocaleString()}</time></li>)}</ol>
        </details>
      )}
    </section>
  )
}
