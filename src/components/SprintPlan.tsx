import { CalendarCheck2 } from 'lucide-react'
import type { ConsultingRoadmap } from '../lib/roadmap'
import './RoadmapReport.css'

export function SprintPlan({
  sprint,
}: {
  sprint: ConsultingRoadmap['sprint']
}) {
  return (
    <section className="report-page roadmap-page sprint-plan-page" aria-label="Three Day Visibility Sprint">
      <div className="report-page-heading">
        <p className="section-kicker">Fast, sequenced implementation</p>
        <h2>Three Day Visibility Sprint</h2>
        <p>
          Three distinct moves: clarify the offer, support the decision with proof,
          then publish an authority asset.
        </p>
      </div>

      <div className="sprint-day-grid">
        {sprint.map((day) => (
          <article className="sprint-day-card" key={day.day}>
            <div className="sprint-day-heading">
              <span>Day {day.day}</span>
              <CalendarCheck2 size={18} aria-hidden="true" />
            </div>
            <h3>{day.headline}</h3>
            <p>{day.description}</p>
            <dl className="roadmap-detail-list">
              <div>
                <dt>Deliverable</dt>
                <dd>{day.deliverable}</dd>
              </div>
              <div>
                <dt>Why it matters</dt>
                <dd>{day.whyItMatters}</dd>
              </div>
              <div>
                <dt>Estimated effort</dt>
                <dd>{day.estimatedEffort}</dd>
              </div>
              <div>
                <dt>Expected business effect</dt>
                <dd>{day.expectedBusinessEffect}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
