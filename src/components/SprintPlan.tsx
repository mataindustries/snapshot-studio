import type { RecommendedActionStatus } from '../types'
import type { SprintPhaseDiagnostic } from '../lib/visualDiagnostics'
import './RoadmapReport.css'
import './RoadmapReportPolish.css'
import './VisualDiagnostics.css'

function statusClass(status: RecommendedActionStatus) {
  return status.toLocaleLowerCase().replace(/\s+/g, '-')
}

export function SprintPlan({
  phases,
}: {
  phases: SprintPhaseDiagnostic[]
}) {
  return (
    <section className="report-page roadmap-page sprint-plan-page report-action-group" aria-label="48-Hour Visibility Sprint">
      <div className="report-page-heading">
        <p className="section-kicker">Focused implementation</p>
        <h2>48-Hour Visibility Sprint</h2>
        <p>
          Two focused work windows turn the highest-priority actions into clear deliverables,
          with effort, expected gain, and current completion status visible at a glance.
        </p>
      </div>

      <ol className="sprint-visual-list">
        {phases.map((phase) => (
          <li key={phase.phaseNumber}>
            <article className={`sprint-phase-card ${statusClass(phase.status)}`}>
              <div className="sprint-phase-topline">
                <div className="sprint-phase-id">
                  <span className="sprint-phase-number" aria-hidden="true">
                    {phase.phaseNumber}
                  </span>
                  <span>{phase.window}</span>
                </div>
                <span
                  className={`action-status-indicator ${statusClass(phase.status)}`}
                  aria-label={`Phase status: ${phase.status}`}
                >
                  {phase.status}
                </span>
              </div>

              <h3>{phase.mainAction}</h3>
              <p>{phase.description}</p>

              <dl className="sprint-visual-details">
                <div>
                  <dt>Deliverable</dt>
                  <dd>{phase.deliverable}</dd>
                </div>
                <div>
                  <dt>Effort</dt>
                  <dd>{phase.estimatedEffort}</dd>
                </div>
                <div>
                  <dt>Expected gain</dt>
                  <dd>{phase.expectedGain}</dd>
                </div>
              </dl>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
