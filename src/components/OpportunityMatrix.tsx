import type { OpportunityMatrixDiagnostic } from '../lib/visualDiagnostics'
import './VisualDiagnostics.css'

export function OpportunityMatrix({
  matrix,
}: {
  matrix: OpportunityMatrixDiagnostic
}) {
  return (
    <section className="opportunity-matrix" aria-labelledby="opportunity-matrix-title">
      <header className="diagnostic-heading">
        <div>
          <span>Priority at a glance</span>
          <h3 id="opportunity-matrix-title">Opportunity / Effort Matrix</h3>
        </div>
        <p>
          {matrix.actionCount} recommended action{matrix.actionCount === 1 ? '' : 's'} shown.
          {' '}{matrix.nextActionTitle
            ? 'The next action is outlined and labeled.'
            : 'All displayed actions are resolved.'}
        </p>
      </header>

      <div className="opportunity-matrix-layout">
        <div className="matrix-impact-axis" aria-hidden="true">
          <span>High</span>
          <strong>Business impact</strong>
          <span>Low</span>
        </div>

        <div className="matrix-zone-grid">
          {matrix.zones.map((zone) => (
            <section className={`matrix-zone ${zone.key}`} key={zone.key}>
              <header>
                <h4>{zone.label}</h4>
                <span>{zone.description}</span>
              </header>
              {zone.actions.length > 0 ? (
                <ul>
                  {zone.actions.map((action) => (
                    <li className={action.isNext ? 'is-next' : ''} key={action.id}>
                      {action.isNext && <strong>Next action</strong>}
                      <span title={action.title} aria-label={action.title}>{action.conciseTitle}</span>
                      <small>{action.status}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No action in this zone.</p>
              )}
            </section>
          ))}
        </div>

        <div className="matrix-effort-axis" aria-hidden="true">
          <span>Small effort</span>
          <strong>Estimated effort</strong>
          <span>Large effort</span>
        </div>
      </div>
    </section>
  )
}
