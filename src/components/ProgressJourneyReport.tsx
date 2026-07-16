import { ArrowRight, Check, Flag } from 'lucide-react'
import './ProgressJourneyReport.css'
import type { ProgressJourneyModel } from '../lib/progressJourney'

const statusLabels = {
  completed: 'Completed',
  current: 'Current level',
  next: 'Next level',
  future: 'Future level',
} as const

export function ProgressJourneyReport({ model }: { model: ProgressJourneyModel }) {
  const nextLabel = model.isMaintainingTopLevel
    ? `${model.nextArchetype} · maintenance focus`
    : model.nextArchetype

  return (
    <section className="report-page progress-page" aria-label="Progress and archetype journey">
      <div className="report-page-heading progress-page-heading">
        <p className="section-kicker">A practical path forward</p>
        <h2>Your progress journey</h2>
        <p>
          The roadmap starts from the current position and organizes each action into
          a trackable implementation sequence.
        </p>
      </div>

      <div className="position-grid">
        <article className="position-card current-position-card">
          <p className="progress-label">Current Position</p>
          <strong className="position-archetype">{model.currentArchetype}</strong>
          <span className="position-score">{model.currentScore}/100</span>
          <p>{model.currentPositionMeaning}</p>
        </article>

        <article className="position-card next-position-card">
          <p className="progress-label">Next Achievable Level</p>
          <strong className="position-archetype">{nextLabel}</strong>
          <span className="planning-score">
            {model.targetScoreLow}–{model.targetScoreHigh}/100 · planning estimate
          </span>
          <p>{model.nextLevelMeaning}</p>
        </article>
      </div>

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="progress-section-heading">
          <div>
            <p className="progress-label">Progress Journey</p>
            <h3 id="journey-title">From foundation to market leadership</h3>
          </div>
          <ArrowRight size={20} aria-hidden="true" />
        </div>
        <ol className="archetype-path">
          {model.levels.map((level, index) => (
            <li className={`archetype-level ${level.status}`} key={level.archetype}>
              <span className="level-marker" aria-hidden="true">
                {level.status === 'completed' ? <Check size={15} /> : index + 1}
              </span>
              <strong>{level.archetype}</strong>
              <small>{statusLabels[level.status]}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="progress-summary" aria-labelledby="progress-summary-title">
        <div className="progress-section-heading">
          <div>
            <p className="progress-label">Progress Summary</p>
            <h3 id="progress-summary-title">A plan designed for future reporting</h3>
          </div>
          <Flag size={20} aria-hidden="true" />
        </div>
        <div className="progress-stat-grid">
          <ProgressStat label="Recommended actions" value={model.actionCount.toString()} />
          <ProgressStat label="Completed" value={model.completeCount.toString()} />
          <ProgressStat label="Remaining" value={model.remainingCount.toString()} />
          <ProgressStat label="Largest action size" value={model.estimatedEffort} />
        </div>
        <p className="progress-plan-note">{model.planningEstimateDisclaimer}</p>
      </section>
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
