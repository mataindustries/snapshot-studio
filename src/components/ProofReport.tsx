import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import type {
  ProofAction,
  ProofEvidence,
  ProofReportModel,
  ProofReportValidation,
} from '../lib/proofLoop'
import './ProofReport.css'

export function ProofReportWorkspace({
  model,
  validation,
}: {
  model: ProofReportModel
  validation: ProofReportValidation
}) {
  function printProofReport() {
    if (!validation.valid || typeof window.print !== 'function') return
    document.body.classList.add('printing-proof-report')
    const cleanUp = () => document.body.classList.remove('printing-proof-report')
    window.addEventListener('afterprint', cleanUp, { once: true })
    window.print()
    window.setTimeout(cleanUp, 60_000)
  }

  return (
    <section
      className="proof-report-workspace screen-only"
      id="proof-report-workspace"
      aria-labelledby="proof-report-workspace-title"
    >
      <div className="panel proof-report-controls">
        <div>
          <p className="section-kicker">Customer-facing closeout</p>
          <h2 id="proof-report-workspace-title">UpgradeOS Proof Report</h2>
          <p>
            A concise proof-of-work view derived from the linked baseline, accepted scope,
            canonical actions, and Evidence Manager records.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={printProofReport}
          disabled={!validation.valid}
        >
          <Printer size={17} aria-hidden="true" />
          Print Proof Report
        </button>
      </div>

      {!validation.valid && (
        <div className="proof-report-validation" role="status">
          <AlertTriangle size={19} aria-hidden="true" />
          <div>
            <strong>Proof Report needs review</strong>
            <ul>
              {validation.issues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        </div>
      )}

      <ProofReportDocument model={model} />
    </section>
  )
}

export function ProofReportDocument({ model }: { model: ProofReportModel }) {
  return (
    <article className="proof-report-document" aria-label="UpgradeOS Proof Report preview">
      <header className="proof-report-coverline">
        <div>
          <span>Snapshot Studio</span>
          <small>Powered by UpgradeOS</small>
        </div>
        <strong>Proof Report</strong>
      </header>

      <section className="proof-report-intro">
        <p className="proof-report-kicker">Implementation verification</p>
        <h1>{model.businessName}</h1>
        <p>{model.marketLabel}</p>
        <dl>
          <div><dt>Engagement</dt><dd>{model.engagementTitle}</dd></div>
          <div><dt>Scope record</dt><dd>{model.engagementStatus}</dd></div>
          <div><dt>Baseline Snapshot</dt><dd>{model.baselineDate}</dd></div>
          <div><dt>Follow-Up Snapshot</dt><dd>{model.followUpDate}</dd></div>
        </dl>
      </section>

      <section className="proof-report-section proof-scope-section">
        <header>
          <span>01</span>
          <div><small>Approved implementation</small><h2>Scope reviewed</h2></div>
        </header>
        {model.approvedScope.length > 0 ? (
          <ul>{model.approvedScope.map((item) => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>Approved scope is not yet recorded.</p>
        )}
      </section>

      <section className="proof-report-section proof-completed-section">
        <header>
          <span>02</span>
          <div><small>Completed work and evidence</small><h2>What changed</h2></div>
        </header>
        {model.completedActions.length > 0 ? (
          <div className="proof-action-list">
            {model.completedActions.map((action, index) => (
              <ProofActionCard key={`${action.title}-${index}`} action={action} />
            ))}
          </div>
        ) : (
          <p className="proof-empty-state">No completed canonical actions are recorded.</p>
        )}
      </section>

      <section className="proof-report-section proof-open-section">
        <header>
          <span>03</span>
          <div><small>Open record</small><h2>Still incomplete or unverified</h2></div>
        </header>
        {model.incompleteOrUnverified.length > 0 ? (
          <ul>{model.incompleteOrUnverified.map((item) => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>No incomplete or unverified scope items are recorded.</p>
        )}
      </section>

      <section className="proof-next-action">
        <ArrowRight size={22} aria-hidden="true" />
        <div>
          <small>Recommended next action</small>
          <h2>{model.nextAction}</h2>
          <p>Review date: <strong>{model.reviewDate}</strong></p>
        </div>
      </section>

      <aside className="proof-claim-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <p>{model.claimNote}</p>
      </aside>

      <footer>
        <strong>Snapshot Studio</strong>
        <span>Proof of observable implementation · Powered by UpgradeOS</span>
      </footer>
    </article>
  )
}

function ProofActionCard({ action }: { action: ProofAction }) {
  return (
    <article className="proof-action-card">
      <header>
        <div>
          <small>{action.category}</small>
          <h3>{action.title}</h3>
        </div>
        <span className={action.verificationStatus.toLocaleLowerCase().replaceAll(' ', '-')}>
          {action.verificationStatus === 'Verified'
            ? <CheckCircle2 size={15} aria-hidden="true" />
            : <AlertTriangle size={15} aria-hidden="true" />}
          {action.verificationStatus}
        </span>
      </header>

      <dl className="proof-implementation-details">
        <div><dt>Implementation note</dt><dd>{action.implementationNote}</dd></div>
        <div><dt>Completion date</dt><dd>{action.completionDate}</dd></div>
      </dl>

      <div className="proof-evidence-comparison">
        <EvidenceColumn title="Baseline evidence" items={action.baselineEvidence} timing="baseline" />
        <EvidenceColumn title="After evidence" items={action.afterEvidence} timing="after" />
      </div>

      <dl className="proof-verification-details">
        <div><dt>Verification method</dt><dd>{action.verificationMethod}</dd></div>
        <div><dt>{action.outcomeLabel}</dt><dd>{action.outcomeNote}</dd></div>
      </dl>
    </article>
  )
}

function EvidenceColumn({
  title,
  items,
  timing,
}: {
  title: string
  items: ProofEvidence[]
  timing: 'baseline' | 'after'
}) {
  return (
    <section className={`proof-evidence-column ${timing}`}>
      <h4>{title}</h4>
      {items.length > 0 ? items.slice(0, 2).map((item, index) => (
        <article key={`${item.title}-${index}`}>
          {item.screenshotDataUrl && index === 0 && (
            <img
              src={item.screenshotDataUrl}
              alt={item.screenshotAltText || item.title}
            />
          )}
          <strong>{item.title}</strong>
          <p>{item.observation}</p>
          <small>{item.sourceLabel}</small>
        </article>
      )) : <p>Not yet verified.</p>}
    </section>
  )
}
