import {
  CheckCircle2,
  Map,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

const workflowSteps = ['Lead', 'Snapshot', 'Roadmap', 'Proposal', 'Outreach']
const valuePoints = [
  'Structured operator review',
  'Premium client deliverables',
  'One workflow from lead to follow-up',
]

export function OperatorHeader({
  totalScore,
  rating,
  demoInstalled,
  demoMessage,
  onLoadDemo,
  onResetDemo,
  onRestartTour,
}: {
  totalScore: number
  rating: string
  demoInstalled: boolean
  demoMessage: string
  onLoadDemo: () => void
  onResetDemo: () => void
  onRestartTour: () => void
}) {
  return (
    <header className="topbar operator-header screen-only" id="operator-header">
      <div className="operator-header-main">
        <p className="eyebrow"><Sparkles size={14} /> Snapshot Studio powered by UpgradeOS</p>
        <h1>Turn a local-business lead into a client-ready growth plan.</h1>
        <p className="topbar-copy">
          UpgradeOS keeps research, operator review, a premium Snapshot, prioritized roadmap,
          proposal, outreach, and follow-up in one controlled workflow.
        </p>

        <nav className="operator-workflow" aria-label="Snapshot Studio workflow">
          <ol>
            {workflowSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </nav>

        <ul className="operator-value-list" aria-label="Workflow value">
          {valuePoints.map((point) => (
            <li key={point}><CheckCircle2 size={16} aria-hidden="true" /> {point}</li>
          ))}
        </ul>

        <section className="contest-demo-controls" aria-labelledby="contest-demo-title">
          <div>
            <span>Judge-ready walkthrough</span>
            <strong id="contest-demo-title">Contest Demo</strong>
            <small>Fictional data · stable records · safe to reset</small>
          </div>
          <div className="contest-demo-actions">
            <button className="primary-button" type="button" onClick={onLoadDemo}>
              <Play size={17} aria-hidden="true" /> Load Contest Demo
            </button>
            <button className="secondary-button" type="button" onClick={onRestartTour}>
              <Map size={17} aria-hidden="true" /> Restart tour
            </button>
            <button
              className="ghost-button"
              type="button"
              disabled={!demoInstalled}
              onClick={onResetDemo}
            >
              <RotateCcw size={17} aria-hidden="true" /> Reset Contest Demo
            </button>
          </div>
          {demoMessage && <p role="status">{demoMessage}</p>}
        </section>
      </div>

      <div className="score-pill" aria-label={`Score ${totalScore} out of 100, ${rating}`}>
        <span>Current open Snapshot</span>
        <strong>{totalScore}/100</strong>
        <small>{rating}</small>
      </div>
    </header>
  )
}
