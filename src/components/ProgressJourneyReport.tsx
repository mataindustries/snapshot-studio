import { Compass, Flag, MoveUpRight } from 'lucide-react'
import type { ProgressJourneyModel } from '../lib/progressJourney'
import type { MomentumStageDiagnostic } from '../lib/visualDiagnostics'
import { MomentumTimeline } from './MomentumTimeline'
import './ProgressJourneyReport.css'

export function ProgressJourneyReport({
  model,
  timeline,
}: {
  model: ProgressJourneyModel
  timeline: MomentumStageDiagnostic[]
}) {
  return (
    <section className="report-page progress-page report-action-group" aria-label="Progress and growth stage journey">
      <div className="report-page-heading progress-page-heading">
        <p className="section-kicker">A practical path forward</p>
        <h2>Your Growth Path</h2>
        <p>
          The Snapshot separates today’s assessed position from projected planning states,
          then reserves measurable progress for a verified follow-up Snapshot.
        </p>
      </div>

      <MomentumTimeline stages={timeline} />

      <section className="progress-summary" aria-labelledby="progress-summary-title">
        <div className="progress-section-heading">
          <div>
            <p className="progress-label">Progress summary</p>
            <h3 id="progress-summary-title">Momentum you can measure</h3>
          </div>
          <Flag size={20} aria-hidden="true" />
        </div>
        <div className="progress-stat-grid">
          <ProgressStat label="Current Position" value={`${model.currentScore}/100`} />
          <ProgressStat
            label="Projected planning range"
            value={`${model.targetScoreLow}–${model.targetScoreHigh}/100`}
          />
          <ProgressStat label="Progress So Far" value={model.completeCount.toString()} />
          <ProgressStat label="Next Milestones" value={model.remainingCount.toString()} />
        </div>
        <div className="next-action-callout">
          <MoveUpRight size={18} aria-hidden="true" />
          <span>
            <small>Next milestone</small>
            <strong>{model.nextRecommendedAction}</strong>
          </span>
        </div>
      </section>

      <aside className="planning-estimate-note">
        <Compass size={18} aria-hidden="true" />
        <p>
          <strong>Planning note.</strong> {model.planningEstimateDisclaimer}{' '}
          {model.verificationNote}
        </p>
      </aside>
    </section>
  )
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="progress-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
