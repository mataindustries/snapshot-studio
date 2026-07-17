import { ArrowDown, Compass, Flag, MoveUpRight } from 'lucide-react'
import './ProgressJourneyReport.css'
import type { ProgressJourneyModel } from '../lib/progressJourney'

export function ProgressJourneyReport({ model }: { model: ProgressJourneyModel }) {
  const nextLabel = model.isMaintainingTopLevel
    ? `${model.nextGrowthStage} · maintenance focus`
    : model.nextGrowthStage

  return (
    <section className="report-page progress-page" aria-label="Progress and growth stage journey">
      <div className="report-page-heading progress-page-heading">
        <p className="section-kicker">A practical path forward</p>
        <h2>Current → Next Level</h2>
        <p>
          The Snapshot turns the current position into a measured sequence: strengthen
          the next level first, then build toward durable local authority.
        </p>
      </div>

      <section className="premium-journey-card" aria-label="Current to long-term growth stage path">
        <JourneyStage
          label="Current Growth Stage"
          title={model.currentGrowthStage}
          detail={`${model.currentScore}/100 current score`}
          description={model.currentPositionMeaning}
        />
        <ArrowDown className="journey-arrow" size={22} aria-hidden="true" />
        <JourneyStage
          label="Next Growth Stage"
          title={nextLabel}
          detail={`${model.targetScoreLow}–${model.targetScoreHigh}/100 projected planning range`}
          description={model.nextLevelMeaning}
          highlighted
        />
        <ArrowDown className="journey-arrow" size={22} aria-hidden="true" />
        <JourneyStage
          label="Long-Term Growth Goal"
          title={model.longTermGrowthGoal}
          detail="Built through verified, sequenced improvements"
          description={model.longTermGrowthGoalMeaning}
          goal
        />
      </section>

      <section className="progress-summary" aria-labelledby="progress-summary-title">
        <div className="progress-section-heading">
          <div>
            <p className="progress-label">Progress summary</p>
            <h3 id="progress-summary-title">Measured actions, clear next step</h3>
          </div>
          <Flag size={20} aria-hidden="true" />
        </div>
        <div className="progress-stat-grid">
          <ProgressStat label="Current score" value={`${model.currentScore}/100`} />
          <ProgressStat
            label="Projected planning range"
            value={`${model.targetScoreLow}–${model.targetScoreHigh}/100`}
          />
          <ProgressStat label="Completed actions" value={model.completeCount.toString()} />
          <ProgressStat label="Remaining actions" value={model.remainingCount.toString()} />
        </div>
        <div className="next-action-callout">
          <MoveUpRight size={18} aria-hidden="true" />
          <span>
            <small>Next recommended action</small>
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

function JourneyStage({
  label,
  title,
  detail,
  description,
  highlighted = false,
  goal = false,
}: {
  label: string
  title: string
  detail: string
  description: string
  highlighted?: boolean
  goal?: boolean
}) {
  return (
    <article
      className={`journey-stage ${highlighted ? 'highlighted' : ''} ${goal ? 'goal' : ''}`}
    >
      <span>{label}</span>
      <h3>{title}</h3>
      <strong>{detail}</strong>
      <p>{description}</p>
    </article>
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
