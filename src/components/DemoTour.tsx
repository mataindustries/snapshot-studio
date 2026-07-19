import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  clearDemoTourDismissal,
  demoTourSteps,
  rememberDemoTourDismissal,
  type DemoTourStep,
} from '../lib/demoTour'

export function DemoTour({
  openInitially,
  onNavigate,
}: {
  openInitially: boolean
  onNavigate: (step: DemoTourStep) => void
}) {
  const [open, setOpen] = useState(openInitially)
  const [stepIndex, setStepIndex] = useState(0)
  const step = demoTourSteps[stepIndex]

  useEffect(() => {
    if (!open) return
    onNavigate(step)
    const timer = window.setTimeout(() => {
      const target = document.getElementById(step.targetId)
      if (!target) return
      target.classList.add('contest-tour-target')
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, step.title === 'Send Kit' ? 160 : 40)
    return () => {
      window.clearTimeout(timer)
      document.getElementById(step.targetId)?.classList.remove('contest-tour-target')
    }
  }, [onNavigate, open, step])

  function closeTour() {
    rememberDemoTourDismissal()
    setOpen(false)
  }

  function restartTour() {
    clearDemoTourDismissal()
    setStepIndex(0)
    setOpen(true)
  }

  function nextStep() {
    if (stepIndex === demoTourSteps.length - 1) {
      closeTour()
      return
    }
    setStepIndex((current) => current + 1)
  }

  if (!open) return null

  return (
    <aside className="demo-tour screen-only" aria-live="polite" aria-label="Contest Demo tour">
      <header>
        <span>Demo tour · {stepIndex + 1}/{demoTourSteps.length}</span>
        <button type="button" aria-label="Skip tour" title="Skip tour" onClick={closeTour}>
          <X size={17} aria-hidden="true" />
        </button>
      </header>
      <div>
        <strong>{step.title}</strong>
        <p>{step.copy}</p>
      </div>
      <ol aria-label="Tour progress">
        {demoTourSteps.map((item, index) => (
          <li className={index === stepIndex ? 'is-current' : index < stepIndex ? 'is-complete' : ''} key={item.title}>
            <span>{index + 1}</span><small>{item.title}</small>
          </li>
        ))}
      </ol>
      <footer>
        <button className="tour-text-button" type="button" onClick={closeTour}>Skip</button>
        <button className="tour-text-button" type="button" onClick={restartTour}>
          <RotateCcw size={15} aria-hidden="true" /> Restart
        </button>
        <span />
        <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => current - 1)}>
          <ArrowLeft size={16} aria-hidden="true" /> Previous
        </button>
        <button className="tour-next-button" type="button" onClick={nextStep}>
          {stepIndex === demoTourSteps.length - 1 ? 'Finish' : 'Next'}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </footer>
    </aside>
  )
}
