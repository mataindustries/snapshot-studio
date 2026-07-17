import { ExternalLink, Link2 } from 'lucide-react'
import {
  getActionsForEvidence,
  getEvidenceSummary,
} from '../lib/evidence'
import type { EvidenceItem, RecommendedAction } from '../types'
import './EvidenceReport.css'
import './EvidenceReportPolish.css'

export function EvidenceReport({
  evidenceItems,
  actions,
}: {
  evidenceItems: EvidenceItem[]
  actions: RecommendedAction[]
}) {
  if (evidenceItems.length === 0) return null

  const summary = getEvidenceSummary(evidenceItems, actions)
  const categoryText = formatCategoryList(summary.categories)

  return (
    <section
      className="report-page evidence-report-page report-evidence-group"
      id="report-evidence"
      aria-labelledby="evidence-report-title"
    >
      <div className="report-page-heading evidence-report-heading">
        <p className="section-kicker">Documented rationale</p>
        <h2 id="evidence-report-title">Evidence Behind Every Recommendation</h2>
        <p>
          Each documented observation connects the current public-facing experience to
          a practical recommendation. This is a focused review, not an exhaustive technical audit.
        </p>
      </div>

      <div className="evidence-summary-strip" aria-label="Evidence review summary">
        <EvidenceStat label="Evidence items reviewed" value={summary.itemCount.toString()} />
        <EvidenceStat label="Screenshots included" value={summary.screenshotCount.toString()} />
        <EvidenceStat
          label="Recommendations linked"
          value={summary.supportedActionCount.toString()}
        />
        <EvidenceStat label="Sources sampled" value={categoryText || 'Public-facing review'} wide />
      </div>

      <p className="evidence-sample-line">
        {summary.itemCount} evidence item{summary.itemCount === 1 ? '' : 's'} reviewed across{' '}
        {categoryText || 'public-facing sources'}.
      </p>

      <div className="client-evidence-list">
        {evidenceItems.map((item, index) => (
          <ClientEvidenceCard
            key={item.id}
            item={item}
            number={index + 1}
            actions={actions}
          />
        ))}
      </div>
    </section>
  )
}

function ClientEvidenceCard({
  item,
  number,
  actions,
}: {
  item: EvidenceItem
  number: number
  actions: RecommendedAction[]
}) {
  const linkedActions = getActionsForEvidence(item, actions)
  const showComparison = Boolean(item.beforeCaption && item.proposedAfterCaption)

  return (
    <article className="client-evidence-card" id={`evidence-${item.id}`}>
      <header className="client-evidence-header">
        <span>Evidence {number}</span>
        <div>
          <h3>{item.title || 'Primary observation'}</h3>
          <small>{item.evidenceType}</small>
        </div>
      </header>

      {item.screenshotDataUrl && (
        <figure className="client-evidence-figure">
          <div className="client-evidence-image">
            <img
              src={item.screenshotDataUrl}
              alt={item.screenshotAltText || item.title || 'Evidence screenshot'}
            />
            {item.annotationLabel && <span>{item.annotationLabel}</span>}
          </div>
          {(item.beforeCaption || item.pageLabel) && (
            <figcaption>{item.beforeCaption || item.pageLabel}</figcaption>
          )}
        </figure>
      )}

      {(item.pageLabel || item.sourceUrl) && (
        <div className="client-evidence-source">
          <ExternalLink size={14} aria-hidden="true" />
          <span>
            {item.pageLabel && <strong>{item.pageLabel}</strong>}
            {item.sourceUrl && <small>{item.sourceUrl}</small>}
          </span>
        </div>
      )}

      <div className="client-evidence-findings">
        <EvidenceFinding label="What we observed" text={item.observation} />
        <EvidenceFinding label="Why it matters" text={item.whyItMatters} />
        <EvidenceFinding label="Recommended move" text={item.recommendedChange} accent />
        {item.expectedOutcome && (
          <EvidenceFinding label="Potential business effect" text={item.expectedOutcome} />
        )}
      </div>

      {showComparison && (
        <div className="evidence-direction-comparison">
          <div>
            <span>Observed now</span>
            <p>{item.beforeCaption}</p>
          </div>
          <div>
            <span>Recommended direction</span>
            <p>{item.proposedAfterCaption}</p>
            <small>Proposed concept — not yet implemented</small>
          </div>
        </div>
      )}

      {linkedActions.length > 0 && (
        <div className="client-evidence-links">
          <Link2 size={15} aria-hidden="true" />
          <span>
            <small>Supports</small>
            <strong>{linkedActions.map((action) => action.title).join(' · ')}</strong>
          </span>
        </div>
      )}
    </article>
  )
}

function EvidenceFinding({
  label,
  text,
  accent = false,
}: {
  label: string
  text: string
  accent?: boolean
}) {
  return (
    <section className={`evidence-finding ${accent ? 'accent' : ''}`}>
      <span>{label}</span>
      <p>{text || 'Details not provided.'}</p>
    </section>
  )
}

function EvidenceStat({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={`evidence-stat ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatCategoryList(categories: string[]) {
  if (categories.length <= 1) return categories[0] || ''
  if (categories.length === 2) return categories.join(' and ')
  return `${categories.slice(0, -1).join(', ')}, and ${categories.at(-1)}`
}
