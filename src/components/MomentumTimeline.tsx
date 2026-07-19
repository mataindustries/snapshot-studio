import type { MomentumStageDiagnostic } from '../lib/visualDiagnostics'
import './VisualDiagnostics.css'

export function MomentumTimeline({
  stages,
}: {
  stages: MomentumStageDiagnostic[]
}) {
  return (
    <section className="momentum-timeline" aria-labelledby="momentum-timeline-title">
      <header className="diagnostic-heading">
        <div>
          <span>From plan to proof</span>
          <h3 id="momentum-timeline-title">Growth Momentum Timeline</h3>
        </div>
        <p>Projected stages remain planning states until a follow-up Snapshot verifies them.</p>
      </header>

      <ol className="momentum-stage-list">
        {stages.map((stage) => (
          <li className={`momentum-stage ${stage.state}`} key={stage.order}>
            <div className="momentum-stage-marker" aria-hidden="true">
              {stage.order}
            </div>
            <article>
              <header>
                <div>
                  <span>{stage.stateLabel}</span>
                  <h4>{stage.title}</h4>
                </div>
                <strong className="momentum-status">{stage.statusLabel}</strong>
              </header>
              <div className="momentum-stage-position">
                <strong>{stage.growthStage}</strong>
                <span>{stage.scoreContext}</span>
              </div>
              <dl>
                <div>
                  <dt>What changes</dt>
                  <dd>{stage.whatChanges}</dd>
                </div>
                <div>
                  <dt>Must be verified</dt>
                  <dd>{stage.verification}</dd>
                </div>
              </dl>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
