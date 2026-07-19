import { CalendarCheck2 } from 'lucide-react'
import type { ConsultingRoadmap } from '../lib/roadmap'
import './RoadmapReport.css'
import './RoadmapReportPolish.css'

export function SprintPlan({
  sprint,
}: {
  sprint: ConsultingRoadmap['sprint']
}) {
  return (
    <section className="report-page roadmap-page sprint-plan-page report-action-group" aria-label="48-Hour Visibility Sprint">
      <div className="report-page-heading">
        <p className="section-kicker">Focused implementation</p>
        <h2>48-Hour Visibility Sprint</h2>
        <p>
          Two focused work windows turn the clearest customer friction into visible progress,
          then confirm the improved path works on desktop and mobile.
        </p>
      </div>

      <div className="sprint-day-grid">
        {sprint.map((phase) => (
          <article className="sprint-day-card" key={phase.window}>
            <div className="sprint-day-heading">
              <span>{phase.window}</span>
              <CalendarCheck2 size={18} aria-hidden="true" />
            </div>
            <h3>{phase.headline}</h3>
            <p>{phase.description}</p>
            <dl className="roadmap-detail-list">
              <div>
                <dt>Deliverable</dt>
                <dd>{phase.deliverable}</dd>
              </div>
              <div>
                <dt>Decision impact</dt>
                <dd>{phase.whyItMatters}</dd>
              </div>
              <div>
                <dt>Estimated effort</dt>
                <dd>{phase.estimatedEffort}</dd>
              </div>
              <div>
                <dt>Expected gain</dt>
                <dd>{phase.expectedBusinessEffect}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
