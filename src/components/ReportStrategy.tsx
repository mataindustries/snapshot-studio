import { ArrowUpRight, Gem, Lightbulb } from 'lucide-react'
import type { ExecutiveSummary, FeaturedOpportunity, StrategicAsset } from '../lib/reportStory'
import type {
  EvidenceDiagnostic,
  OpportunityMatrixDiagnostic,
  ScoreDiagnostic,
} from '../lib/visualDiagnostics'
import {
  EvidenceTrustIndicator,
  ExecutiveScoreStrip,
} from './ExecutiveScoreStrip'
import { OpportunityMatrix } from './OpportunityMatrix'
import './ReportStrategy.css'

export function ExecutiveSummaryReport({
  summary,
  scores,
  evidence,
}: {
  summary: ExecutiveSummary
  scores: ScoreDiagnostic[]
  evidence: EvidenceDiagnostic
}) {
  const details = [
    ['Current Position', summary.currentPosition],
    ['Largest Opportunity', summary.largestOpportunity],
    ['Fastest Win', summary.fastestWin],
    ['Long-term Goal', summary.longTermGoal],
    ['Estimated Effort', summary.estimatedEffort],
    ['Expected Outcome', summary.expectedOutcome],
  ]

  return (
    <section
      className="report-page executive-summary-page report-overview-group"
      aria-labelledby="executive-summary-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">Executive summary</p>
        <h2 id="executive-summary-title">Business Snapshot</h2>
        <p>{summary.businessSnapshot}</p>
      </div>

      <dl className="executive-summary-grid">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <ExecutiveScoreStrip scores={scores} />
      <EvidenceTrustIndicator diagnostic={evidence} />
    </section>
  )
}

export function StrategicAssetsReport({ assets }: { assets: StrategicAsset[] }) {
  return (
    <section
      className="report-page strategic-assets-page report-overview-group"
      aria-labelledby="strategic-assets-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">What is already working</p>
        <h2 id="strategic-assets-title">What You're Already Winning</h2>
        <p>
          These strengths give the plan a head start. The next move is to put each one
          where it can shape a customer decision.
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
                  <dt>Customer impact</dt>
                  <dd>{asset.whyItMatters}</dd>
                </div>
                <div>
                  <dt>Best next use</dt>
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
  matrix,
}: {
  opportunity: FeaturedOpportunity
  matrix: OpportunityMatrixDiagnostic
}) {
  return (
    <section
      className="report-page opportunity-page report-overview-group"
      aria-labelledby="biggest-opportunity-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">The move to lead with</p>
        <h2 id="biggest-opportunity-title">The Highest-Leverage Improvement</h2>
        <p>
          This is the improvement most likely to create momentum now and make later
          work more valuable.
        </p>
      </div>

      <article className="opportunity-spotlight">
        <header className="opportunity-heading">
          <div>
            <span>Priority move</span>
            <h3>{opportunity.title}</h3>
          </div>
          <Lightbulb size={27} aria-hidden="true" />
        </header>

        <div className="opportunity-detail-grid">
          <OpportunityDetail
            label="What customers experience"
            text={opportunity.currentSituation}
          />
          <OpportunityDetail label="Business consequence" text={opportunity.whyItMatters} />
          <OpportunityDetail
            label="First move"
            text={opportunity.recommendedFirstMove}
            featured
          />
          <OpportunityDetail
            label="Likely upside"
            text={opportunity.potentialBusinessBenefit}
          />
        </div>

        {opportunity.evidenceTitle && (
          <p className="opportunity-evidence-line">
            <ArrowUpRight size={16} aria-hidden="true" />
            Evidence used: {opportunity.evidenceTitle}
          </p>
        )}
      </article>

      <OpportunityMatrix matrix={matrix} />
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
