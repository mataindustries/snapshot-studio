import { ArrowRight, CheckCircle2, GitBranch, Target } from 'lucide-react'
import type { ConsultingRoadmap } from '../lib/roadmap'
import './RoadmapReport.css'

export function AuthorityRoadmap({
  roadmap,
}: {
  roadmap: ConsultingRoadmap
}) {
  const titleById = new Map(
    roadmap.businessOutcomes.map((action) => [action.id, action.title]),
  )

  return (
    <section className="report-page roadmap-page authority-roadmap-page" aria-label="30 Day Local Authority Plan">
      <div className="report-page-heading">
        <p className="section-kicker">Implementation roadmap</p>
        <h2>30 Day Local Authority Plan</h2>
        <p>
          Four practical weeks with a defined goal, completion milestone, and observable
          success signal.
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

      <section className="roadmap-subsection" aria-labelledby="priority-matrix-title">
        <div className="roadmap-subheading">
          <div>
            <p className="progress-label">Smart prioritization</p>
            <h3 id="priority-matrix-title">Priority Matrix</h3>
          </div>
          <Target size={20} aria-hidden="true" />
        </div>
        <div className="priority-table-wrap">
          <table className="priority-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Action</th>
                <th>Impact</th>
                <th>Effort</th>
                <th>Priority</th>
                <th>Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {roadmap.priorityMatrix.map((action) => (
                <tr key={action.id}>
                  <td>{action.recommendedOrder}</td>
                  <td>
                    <strong>{action.title}</strong>
                    <small>{action.category} · {action.estimatedHours}h estimate</small>
                  </td>
                  <td>{action.estimatedImpact}</td>
                  <td>{action.estimatedEffort}</td>
                  <td>{action.priorityScore}/100</td>
                  <td>{action.opportunityScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="roadmap-two-column">
        <section className="roadmap-subsection" aria-labelledby="dependencies-title">
          <div className="roadmap-subheading">
            <div>
              <p className="progress-label">Recommended order</p>
              <h3 id="dependencies-title">Dependencies</h3>
            </div>
            <GitBranch size={19} aria-hidden="true" />
          </div>
          <ol className="dependency-list">
            {roadmap.dependencies.map((action) => (
              <li key={action.id}>
                <strong>{action.title}</strong>
                {action.blockedBy.length > 0 && (
                  <span>
                    Blocked by {action.blockedBy
                      .map((id) => titleById.get(id))
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
                {action.unlocks.length > 0 && (
                  <span className="unlock-line">
                    <ArrowRight size={14} aria-hidden="true" />
                    Unlocks {action.unlocks
                      .map((id) => titleById.get(id))
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="roadmap-subsection" aria-labelledby="business-outcomes-title">
          <div className="roadmap-subheading">
            <div>
              <p className="progress-label">Why the owner should care</p>
              <h3 id="business-outcomes-title">Business Outcomes</h3>
            </div>
            <CheckCircle2 size={19} aria-hidden="true" />
          </div>
          <ul className="outcome-list">
            {roadmap.businessOutcomes.map((action) => (
              <li key={action.id}>
                <strong>{action.title}</strong>
                <span>{action.expectedOutcome}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
