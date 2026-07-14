import { ArrowRight, Check, Flag, Sparkles } from 'lucide-react'
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
    <section className="report-page progress-page" aria-label="Progress motivation and archetype journey">
      <div className="report-page-heading progress-page-heading">
        <p className="section-kicker">A practical path forward</p>
        <h2>Your progress journey</h2>
        <p>
          You already have a starting point. These milestones turn the snapshot into an
          encouraging, achievable plan for the next stage.
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
            <h3 id="progress-summary-title">A focused plan you can track</h3>
          </div>
          <Flag size={20} aria-hidden="true" />
        </div>
        <div className="progress-stat-grid">
          <ProgressStat label="Recommended actions" value={model.actionCount.toString()} />
          <ProgressStat label="Complete" value={model.completeCount.toString()} />
          <ProgressStat label="Remaining" value={model.remainingCount.toString()} />
          <ProgressStat label="Estimated effort" value={model.estimatedEffort} />
          <ProgressStat
            className="priority-stat"
            label="Highest-priority action"
            value={model.highestPriorityAction}
          />
        </div>
      </section>

      <section className="milestones-section" aria-labelledby="milestones-title">
        <div className="progress-section-heading">
          <div>
            <p className="progress-label">Three Milestones</p>
            <h3 id="milestones-title">Build momentum in useful stages</h3>
          </div>
        </div>
        <div className="milestone-grid">
          {model.milestones.map((milestone, index) => (
            <article className="milestone-card" key={milestone.label}>
              <span>{index + 1}</span>
              <strong>{milestone.label}</strong>
              <p>{milestone.action}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="future-state" aria-labelledby="future-state-title">
        <div className="future-state-heading">
          <div>
            <p className="progress-label">Future State Preview</p>
            <h3 id="future-state-title">Your next snapshot could look like this</h3>
          </div>
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div className="future-state-grid">
          <div className="future-score-comparison">
            <div>
              <span>Current score</span>
              <strong>{model.currentScore}/100</strong>
            </div>
            <ArrowRight size={20} aria-hidden="true" />
            <div>
              <span>Target planning range</span>
              <strong>{model.targetScoreLow}–{model.targetScoreHigh}/100</strong>
              <small>Planning estimate</small>
            </div>
          </div>
          <div className="future-archetype-comparison">
            <span>{model.currentArchetype}</span>
            <ArrowRight size={16} aria-hidden="true" />
            <strong>{nextLabel}</strong>
          </div>
          <ul className="future-improvements">
            {model.futureImprovements.map((improvement) => (
              <li key={improvement}>{improvement}</li>
            ))}
          </ul>
        </div>
        <p className="planning-disclaimer">{model.planningEstimateDisclaimer}</p>
      </section>
    </section>
  )
}

function ProgressStat({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`progress-stat ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
