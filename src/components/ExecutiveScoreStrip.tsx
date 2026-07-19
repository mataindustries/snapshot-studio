import type { EvidenceDiagnostic, ScoreDiagnostic } from '../lib/visualDiagnostics'
import './VisualDiagnostics.css'

function displayScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1)
}

export function ExecutiveScoreStrip({ scores }: { scores: ScoreDiagnostic[] }) {
  return (
    <section className="executive-score-strip" aria-labelledby="executive-score-strip-title">
      <header className="diagnostic-heading">
        <div>
          <span>Five-part assessment</span>
          <h3 id="executive-score-strip-title">Where the foundation stands</h3>
        </div>
        <p>Existing 0–20 scores, normalized for faster comparison.</p>
      </header>

      <ul className="score-diagnostic-list">
        {scores.map((score) => (
          <li key={score.key}>
            <div className="score-diagnostic-topline">
              <span>{score.label}</span>
              <strong>{displayScore(score.score)}/20</strong>
            </div>
            <div
              className="score-diagnostic-meter"
              role="meter"
              aria-label={`${score.label}: ${score.percentage}% — ${score.status}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score.percentage}
            >
              <span style={{ width: `${score.percentage}%` }} />
            </div>
            <div className="score-diagnostic-result">
              <span>{score.percentage}%</span>
              <strong>{score.status}</strong>
            </div>
          </li>
        ))}
      </ul>

      <small className="diagnostic-method-note">
        Status bands: 0–39 Foundation · 40–64 Developing · 65–84 Strong · 85–100 Leading.
      </small>
    </section>
  )
}

export function EvidenceTrustIndicator({
  diagnostic,
}: {
  diagnostic: EvidenceDiagnostic
}) {
  if (diagnostic.mode === 'preliminary') {
    return (
      <aside className="evidence-trust-indicator preliminary" aria-label="Evidence coverage">
        <span className="evidence-status-marker" aria-hidden="true">i</span>
        <div>
          <strong>Evidence status</strong>
          <p>{diagnostic.message}</p>
        </div>
      </aside>
    )
  }

  const coverageLabel = `${diagnostic.coveredRecommendationCount} of ${diagnostic.eligibleRecommendationCount} recommendations have report-ready evidence`

  return (
    <section className="evidence-trust-indicator documented" aria-labelledby="evidence-trust-title">
      <header>
        <div>
          <span>Evidence coverage</span>
          <h3 id="evidence-trust-title">What is documented now</h3>
        </div>
        <strong aria-label={coverageLabel}>
          {diagnostic.coveredRecommendationCount}/{diagnostic.eligibleRecommendationCount}
          <small> recommendations</small>
        </strong>
      </header>
      <dl>
        <div>
          <dt>Documented observations</dt>
          <dd>{diagnostic.documentedObservationCount}</dd>
        </div>
        <div>
          <dt>Screenshot-backed recommendations</dt>
          <dd>{diagnostic.screenshotBackedRecommendationCount}</dd>
        </div>
        <div>
          <dt>Awaiting proof</dt>
          <dd>{diagnostic.awaitingProofCount}</dd>
        </div>
      </dl>
      <small>Counts use report-ready evidence and explicit recommendation links only.</small>
    </section>
  )
}
