import { ArrowUpRight, Gem, Lightbulb } from 'lucide-react'
import type { FeaturedOpportunity, StrategicAsset } from '../lib/reportStory'
import './ReportStrategy.css'

export function StrategicAssetsReport({ assets }: { assets: StrategicAsset[] }) {
  return (
    <section
      className="report-page strategic-assets-page report-overview-group"
      aria-labelledby="strategic-assets-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">What is already working</p>
        <h2 id="strategic-assets-title">Strategic Assets</h2>
        <p>
          These are the strongest foundations in the current Snapshot. Each can be used
          to make the next round of improvements more credible and more effective.
        </p>
      </div>

      <ol className="strategic-asset-grid">
        {assets.map((asset, index) => (
          <li key={asset.title}>
            <article className="strategic-asset-card">
              <header>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <Gem size={18} aria-hidden="true" />
              </header>
              <h3>{asset.title}</h3>
              <small className="strategic-asset-source">{asset.sourceLabel}</small>
              <p>{asset.explanation}</p>
              <dl>
                <div>
                  <dt>Why this matters</dt>
                  <dd>{asset.whyItMatters}</dd>
                </div>
                <div>
                  <dt>How to leverage it</dt>
                  <dd>{asset.leverage}</dd>
                </div>
              </dl>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function BiggestOpportunityReport({
  opportunity,
}: {
  opportunity: FeaturedOpportunity
}) {
  return (
    <section
      className="report-page opportunity-page report-overview-group"
      aria-labelledby="biggest-opportunity-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">The move to lead with</p>
        <h2 id="biggest-opportunity-title">Biggest Opportunity</h2>
        <p>
          One focused improvement is more useful than a long list of disconnected ideas.
          This is the recommended place to begin.
        </p>
      </div>

      <article className="opportunity-spotlight">
        <header className="opportunity-heading">
          <div>
            <span>Featured opportunity</span>
            <h3>{opportunity.title}</h3>
          </div>
          <Lightbulb size={27} aria-hidden="true" />
        </header>

        <div className="opportunity-detail-grid">
          <OpportunityDetail
            label="Current situation"
            text={opportunity.currentSituation}
          />
          <OpportunityDetail label="Why it matters" text={opportunity.whyItMatters} />
          <OpportunityDetail
            label="Recommended first move"
            text={opportunity.recommendedFirstMove}
            featured
          />
          <OpportunityDetail
            label="Potential business benefit"
            text={opportunity.potentialBusinessBenefit}
          />
        </div>

        {opportunity.evidenceTitle && (
          <p className="opportunity-evidence-line">
            <ArrowUpRight size={16} aria-hidden="true" />
            Supported by: {opportunity.evidenceTitle}
          </p>
        )}
      </article>
    </section>
  )
}

function OpportunityDetail({
  label,
  text,
  featured = false,
}: {
  label: string
  text: string
  featured?: boolean
}) {
  return (
    <section className={`opportunity-detail ${featured ? 'featured' : ''}`}>
      <span>{label}</span>
      <p>{text}</p>
    </section>
  )
}
