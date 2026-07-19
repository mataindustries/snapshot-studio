import { AlertTriangle, Check, Circle } from 'lucide-react'
import type { FastLaneSession, FastLaneStep } from '../types/fastLane'
import { fastLaneSteps } from '../types/fastLane'
import type { FastLaneStepReadiness } from '../lib/fastLaneReadiness'

export function FastLaneProgress({
  session,
  readiness,
  saveLabel,
  onStepChange,
}: {
  session: FastLaneSession
  readiness: FastLaneStepReadiness[]
  saveLabel: string
  onStepChange: (step: FastLaneStep) => void
}) {
  const warningCount = readiness.reduce(
    (count, step) => count + (step.state === 'Blocked' || step.state === 'Needs review' ? 1 : 0),
    0,
  )

  return (
    <header className="fast-lane-progress">
      <div className="fast-lane-progress-meta">
        <div>
          <span>Step {session.currentStep} of 6</span>
          <strong>{fastLaneSteps[session.currentStep - 1]}</strong>
        </div>
        <div aria-live="polite">
          {warningCount > 0 && <span><AlertTriangle size={15} /> {warningCount} to review</span>}
          <span>{saveLabel}</span>
        </div>
      </div>
      <nav aria-label="Fast Lane steps">
        {fastLaneSteps.map((title, index) => {
          const step = (index + 1) as FastLaneStep
          const completed = session.completedSteps.includes(step)
          const current = session.currentStep === step
          const stepReadiness = readiness[index]
          return (
            <button
              className={`${current ? 'is-current' : ''} ${completed ? 'is-complete' : ''}`}
              type="button"
              key={title}
              onClick={() => onStepChange(step)}
              aria-current={current ? 'step' : undefined}
              aria-label={`${step}. ${title}: ${stepReadiness.label}`}
            >
              <span>{completed ? <Check size={14} /> : <Circle size={11} />}</span>
              <small>{title}</small>
              <em>{stepReadiness.label}</em>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
