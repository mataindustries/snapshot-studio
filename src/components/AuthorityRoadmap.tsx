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
    <section className="report-page roadmap-page authority-roadmap-page report-roadmap-group" aria-label="30-Day Local Authority Blueprint">
      <div className="report-page-heading">
        <p className="section-kicker">A sequenced month of progress</p>
        <h2>30-Day Local Authority Blueprint</h2>
        <p>
          Four practical weeks, each with a defined goal, completion milestone, and
          observable success signal.
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
                <dt>Recommended work</dt>
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
          <strong>Why this sequence works</strong>
          <small>
            Clarity makes proof easier to evaluate. Proof supports authority. Authority
            gives people and AI systems better information to understand and share.
          </small>
        </span>
        <ArrowRight size={19} aria-hidden="true" />
      </aside>
    </section>
  )
}
