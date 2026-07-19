import { ArrowRight, Target } from 'lucide-react'
import type { RecommendedActionStatus } from '../types'
import type { MonthWeekDiagnostic } from '../lib/visualDiagnostics'
import './RoadmapReport.css'
import './RoadmapReportPolish.css'
import './VisualDiagnostics.css'

function statusClass(status: RecommendedActionStatus) {
  return status.toLocaleLowerCase().replace(/\s+/g, '-')
}

export function AuthorityRoadmap({
  weeks,
}: {
  weeks: MonthWeekDiagnostic[]
}) {
  return (
    <section className="report-page roadmap-page authority-roadmap-page report-roadmap-group" aria-label="Your First Month of Momentum">
      <div className="report-page-heading">
        <p className="section-kicker">A connected month of progress</p>
        <h2>Your First Month of Momentum</h2>
        <p>
          Each week builds on the last: clarify the offer, strengthen trust, demonstrate
          authority, then make the business easier for people and AI systems to understand.
        </p>
      </div>

      <ol className="month-momentum-list">
        {weeks.map((week) => (
          <li key={week.week}>
            <article className="month-week-card">
              <div className="month-week-topline">
                <div className="month-week-id">
                  <span className="month-week-number" aria-hidden="true">{week.week}</span>
                  <span>Week {week.week}</span>
                </div>
                <span
                  className={`action-status-indicator ${statusClass(week.status)}`}
                  aria-label={`Week ${week.week} status: ${week.status}`}
                >
                  {week.status}
                </span>
              </div>

              <h3>{week.theme}</h3>
              <p className="month-week-objective">{week.objective}</p>

              <dl className="month-week-details">
                <div>
                  <dt>Key work</dt>
                  <dd>
                    <ul>
                      {week.keyWork.map((work) => <li key={work}>{work}</li>)}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Effort</dt>
                  <dd>{week.estimatedEffort}</dd>
                </div>
                <div>
                  <dt>Milestone</dt>
                  <dd>{week.milestone}</dd>
                </div>
                <div>
                  <dt>Success signal</dt>
                  <dd>{week.successSignal}</dd>
                </div>
              </dl>
            </article>
          </li>
        ))}
      </ol>

      <aside className="blueprint-sequence-note">
        <Target size={20} aria-hidden="true" />
        <span>
          <strong>How momentum compounds</strong>
          <small>
            Clear positioning makes proof easier to trust. Strong proof gives expertise
            weight. Together, they create a business story customers and AI systems can understand.
          </small>
        </span>
        <ArrowRight size={19} aria-hidden="true" />
      </aside>
    </section>
  )
}
