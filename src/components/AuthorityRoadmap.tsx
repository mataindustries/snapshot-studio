import { ArrowRight, Target } from 'lucide-react'
import type { ConsultingRoadmap } from '../lib/roadmap'
import './RoadmapReport.css'
import './RoadmapReportPolish.css'

export function AuthorityRoadmap({
  roadmap,
}: {
  roadmap: ConsultingRoadmap
}) {
  return (
    <section className="report-page roadmap-page authority-roadmap-page report-roadmap-group" aria-label="Your First Month of Momentum">
      <div className="report-page-heading">
        <p className="section-kicker">A sequenced month of progress</p>
        <h2>Your First Month of Momentum</h2>
        <p>
          Each week builds on the last: first make the offer clear, then strengthen trust,
          demonstrate expertise, and make those facts easier to understand.
        </p>
      </div>

      <div className="authority-week-grid">
        {roadmap.weeks.map((week) => (
          <article className="authority-week-card" key={week.week}>
            <div className="authority-week-heading">
              <span>Week {week.week}</span>
              <strong>{week.theme}</strong>
            </div>
            <p className="week-goal">{week.goal}</p>
            <dl className="roadmap-detail-list compact">
              <div>
                <dt>Priority work</dt>
                <dd>
                  <ul>
                    {week.recommendedWork.map((work) => <li key={work}>{work}</li>)}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>Estimated effort</dt>
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
        ))}
      </div>

      <aside className="blueprint-sequence-note">
        <Target size={20} aria-hidden="true" />
        <span>
          <strong>How momentum compounds</strong>
          <small>
            Clear positioning makes proof easier to trust. Strong proof gives your expertise
            weight. Together, they create a business story customers and AI systems can understand.
          </small>
        </span>
        <ArrowRight size={19} aria-hidden="true" />
      </aside>
    </section>
  )
}
