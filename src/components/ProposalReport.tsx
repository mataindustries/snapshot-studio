import type { EvidenceItem, RecommendedAction, SavedSnapshot } from '../types'
import type { Proposal, ProposalDeliverable } from '../types/proposal'
import { isEvidenceReportReady } from '../lib/evidence'
import { actionToDeliverable } from '../lib/proposalBuilder'
import { actionStatusClass } from '../lib/actionProgress'
import './Proposal.css'

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatInvestment(proposal: Proposal) {
  const amount = Number(proposal.fixedPrice)
  if (!(amount > 0)) return ''
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: proposal.currency.trim() || 'USD',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)
  } catch {
    return `${proposal.currency.trim() || 'USD'} ${amount.toLocaleString()}`
  }
}

function selectedActions(proposal: Proposal, snapshot?: SavedSnapshot) {
  const selected = new Set(proposal.selectedActionIds)
  return snapshot?.recommendedActions.filter((action) => selected.has(action.id)) ?? []
}

function deliverables(proposal: Proposal, snapshot?: SavedSnapshot) {
  const actionItems = selectedActions(proposal, snapshot).map((action) =>
    actionToDeliverable(action, snapshot ?? {
      mainService: proposal.snapshotContext.primaryService,
      city: proposal.snapshotContext.city,
    }),
  )
  return [...actionItems, ...proposal.customDeliverables]
}

function evidenceForScope(proposal: Proposal, snapshot?: SavedSnapshot) {
  if (!snapshot) return []
  const actionIds = new Set(proposal.selectedActionIds)
  const customEvidenceIds = new Set(
    proposal.customDeliverables.flatMap((deliverable) => deliverable.linkedEvidenceIds),
  )
  return snapshot.evidenceItems.filter((item) =>
    isEvidenceReportReady(item)
    && (item.linkedActionIds.some((id) => actionIds.has(id)) || customEvidenceIds.has(item.id)),
  )
}

function DeliverableCard({ item, action }: {
  item: ProposalDeliverable
  action?: RecommendedAction
}) {
  return (
    <article className="proposal-deliverable-card">
      <div className="proposal-card-topline">
        <span>{action?.category || 'Custom deliverable'}</span>
        {action && (
          <span className={`proposal-action-status ${actionStatusClass(action.status)}`}>
            {action.status}
          </span>
        )}
      </div>
      {action && <small className="proposal-action-facts">{action.estimatedEffort} effort</small>}
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <dl>
        <div>
          <dt>Business case</dt>
          <dd>{item.whyItMatters}</dd>
        </div>
        <div>
          <dt>Complete when</dt>
          <dd>{item.completionDefinition}</dd>
        </div>
        {action && (
          <div>
            <dt>Linked recommendation</dt>
            <dd>{action.title}</dd>
          </div>
        )}
      </dl>
    </article>
  )
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <article className="proposal-evidence-card">
      {item.screenshotDataUrl && (
        <img
          src={item.screenshotDataUrl}
          alt={item.screenshotAltText || item.title}
        />
      )}
      <div>
        <span>{item.evidenceType} · {item.pageLabel || 'Reviewed source'}</span>
        <h3>{item.title}</h3>
        <p>{item.observation}</p>
        <strong>{item.whyItMatters}</strong>
      </div>
    </article>
  )
}

export function ProposalReport({ proposal, snapshot }: {
  proposal: Proposal
  snapshot?: SavedSnapshot
}) {
  const actions = selectedActions(proposal, snapshot)
  const items = deliverables(proposal, snapshot)
  const evidence = evidenceForScope(proposal, snapshot)
  const actionById = new Map(actions.map((action) => [action.id, action]))
  const investment = formatInvestment(proposal)
  const nextStepHeadline = proposal.nextStepHeadline === 'Ready to begin the sprint?'
    ? 'Ready to turn this plan into visible progress?'
    : proposal.nextStepHeadline
  const nextStepBody = proposal.nextStepBody === 'Confirm the scope, preferred start window, and website access so implementation can begin.'
    ? 'Confirm the scope, preferred start window, and website access. After implementation, a new Snapshot will verify progress and identify the next milestone.'
    : proposal.nextStepBody
  const ctaLabel = proposal.ctaLabel === 'Approve the scope'
    ? 'Start the highest-impact work'
    : proposal.ctaLabel
  const showInvestment = proposal.investmentMode === 'Fixed Price'
    ? Boolean(investment)
    : proposal.investmentMode === 'Custom Estimate'
      ? Boolean(proposal.customInvestmentText?.trim())
      : false

  return (
    <article className="proposal-report" aria-label="Client proposal preview">
      <section className="proposal-page proposal-cover">
        <div className="proposal-cover-brand">
          <strong>{proposal.brandName || 'Snapshot Studio'}</strong>
          <span>Powered by UpgradeOS</span>
        </div>
        <div className="proposal-cover-copy">
          <p className="proposal-kicker">Client proposal</p>
          <h1>{proposal.proposalTitle || 'Implementation Proposal'}</h1>
          <p className="proposal-subtitle">{proposal.proposalSummary}</p>
        </div>
        <div className="proposal-cover-client">
          <span>Prepared for</span>
          <h2>{proposal.clientBusinessName || 'Client business'}</h2>
          <p>
            {[proposal.snapshotContext.primaryService, proposal.snapshotContext.city]
              .filter(Boolean).join(' · ')}
          </p>
        </div>
        <dl className="proposal-cover-meta">
          <div><dt>Proposal type</dt><dd>{proposal.proposalType}</dd></div>
          <div><dt>Prepared by</dt><dd>{proposal.preparedBy || proposal.brandName}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(proposal.createdAt)}</dd></div>
          {proposal.startWindow && <div><dt>Preferred start</dt><dd>{proposal.startWindow}</dd></div>}
        </dl>
      </section>

      <section className="proposal-page proposal-body-page">
        <section className="proposal-section proposal-opportunity">
          <p className="proposal-kicker">The highest-leverage opportunity</p>
          <h2>{proposal.snapshotContext.biggestOpportunityTitle || 'A focused implementation opportunity'}</h2>
          <div className="proposal-context-grid">
            <div><span>Business Horoscope</span><strong>{proposal.snapshotContext.horoscopeName}</strong></div>
            <div><span>Growth Stage</span><strong>{proposal.snapshotContext.growthStage}</strong></div>
            <div><span>Current Position</span><strong>{proposal.snapshotContext.currentScore}/100</strong></div>
            <div><span>Planning range</span><strong>{proposal.snapshotContext.targetScoreLow}–{proposal.snapshotContext.targetScoreHigh}</strong></div>
          </div>
          <p>{proposal.snapshotContext.biggestOpportunitySummary || proposal.proposalSummary}</p>
          <p className="proposal-callout">This scope starts with the changes most likely to reduce customer hesitation and create visible momentum.</p>
        </section>

        <section className="proposal-section">
          <p className="proposal-kicker">Recommended scope</p>
          <h2>Focused work, tied to the approved plan</h2>
          <ol className="proposal-scope-list">
            {actions.map((action) => (
              <li key={action.id}>
                <div className="proposal-scope-heading">
                  <strong>{action.title}</strong>
                  <span className={`proposal-action-status ${actionStatusClass(action.status)}`}>
                    {action.status}
                  </span>
                </div>
                <span>{action.reason}</span>
              </li>
            ))}
            {proposal.customDeliverables.map((item) => (
              <li key={item.id}><strong>{item.title}</strong><span>{item.whyItMatters}</span></li>
            ))}
          </ol>
        </section>

        <section className="proposal-section proposal-deliverables">
          <p className="proposal-kicker">Deliverables</p>
          <h2>What will be completed</h2>
          <div className="proposal-deliverable-list">
            {items.map((item) => (
              <DeliverableCard
                key={item.id}
                item={item}
                action={item.linkedActionId ? actionById.get(item.linkedActionId) : undefined}
              />
            ))}
          </div>
        </section>
      </section>

      <section className="proposal-page proposal-body-page">
        <section className="proposal-section">
          <p className="proposal-kicker">Timeline</p>
          <h2>{proposal.timeline}</h2>
          <div className="proposal-milestones">
            {proposal.milestones.map((milestone) => (
              <article key={milestone.id}>
                <h3>{milestone.label}</h3>
                <p>{milestone.details}</p>
              </article>
            ))}
          </div>
          <p className="proposal-fine-print">Timeline depends on timely client access and approvals. Exact dates apply only when entered above.</p>
        </section>

        <section className="proposal-section">
          <p className="proposal-kicker">Evidence and rationale</p>
          <h2>The business case for this scope</h2>
          {evidence.length > 0 ? (
            <div className="proposal-evidence-list">
              {evidence.map((item) => <EvidenceCard key={item.id} item={item} />)}
            </div>
          ) : (
            <p>{proposal.snapshotContext.biggestOpportunitySummary || 'The selected scope follows the approved recommendation order, with clarity and trust improvements completed before broader authority work.'}</p>
          )}
        </section>

        {showInvestment && (
          <section className="proposal-section proposal-investment">
            <p className="proposal-kicker">Investment</p>
            <h2>{proposal.investmentMode === 'Fixed Price' ? investment : proposal.customInvestmentText}</h2>
            {proposal.paymentTerms.trim() && <p>{proposal.paymentTerms}</p>}
          </section>
        )}

        <section className="proposal-section proposal-practical-grid">
          <div>
            <p className="proposal-kicker">Assumptions</p>
            <ul>{proposal.assumptions.filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <p className="proposal-kicker">Exclusions</p>
            <ul>{proposal.exclusions.filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>

        <section className="proposal-section">
          <p className="proposal-kicker">Client responsibilities</p>
          <ul className="proposal-responsibilities">
            {proposal.clientResponsibilities.filter(Boolean).map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="proposal-legal-note">This proposal is a project scope summary and is not a substitute for a formal legal agreement where one is required.</p>
        </section>

        <section className="proposal-section proposal-next-step">
          <p className="proposal-kicker">Next step</p>
          <h2>{nextStepHeadline}</h2>
          <p>{nextStepBody}</p>
          <strong className="proposal-cta">{ctaLabel}</strong>
          {proposal.contactLine.trim() && <p>{proposal.contactLine}</p>}
          {proposal.bookingUrl?.trim() && <p className="proposal-print-url">{proposal.bookingUrl}</p>}
          {proposal.expirationDate && <small>Proposal valid through {formatDate(proposal.expirationDate)}.</small>}
        </section>
      </section>

      <footer className="proposal-footer">
        <strong>Snapshot Studio</strong>
        <span>Powered by UpgradeOS</span>
      </footer>
    </article>
  )
}
