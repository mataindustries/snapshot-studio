import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  History,
  Play,
  RotateCcw,
} from 'lucide-react'
import type {
  ActionStatusChange,
  EvidenceItem,
  RecommendedAction,
  RecommendedActionStatus,
} from '../types'
import type { ConsultingRoadmap } from '../lib/roadmap'
import {
  actionStatusClass,
  actionStatusOptions,
  getBlockingActions,
  getNextMilestone,
  orderActionsByRecommendation,
} from '../lib/actionProgress'
import { getEvidenceForAction } from '../lib/evidence'
import './ActionControlCenter.css'

function formatChangedAt(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function ActionControlCenter({
  actions,
  evidenceItems,
  history,
  sprint,
  hasUnsavedProgress,
  onStatusChange,
  onStartNext,
  onCompleteNext,
  onResetAll,
  onCompleteSprintPhase,
}: {
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
  history: ActionStatusChange[]
  sprint: ConsultingRoadmap['sprint']
  hasUnsavedProgress: boolean
  onStatusChange: (actionId: string, status: RecommendedActionStatus) => void
  onStartNext: () => void
  onCompleteNext: () => void
  onResetAll: () => void
  onCompleteSprintPhase: (phaseNumber: 1 | 2) => void
}) {
  const orderedActions = orderActionsByRecommendation(actions)
  const actionById = new Map(actions.map((action) => [action.id, action]))
  const nextAction = getNextMilestone(actions)
  const allCompleted = actions.length > 0
    && actions.every((action) => action.status === 'Completed')
  const recentHistory = [...history].reverse().slice(0, 10)
  const sprintStepCanComplete = (phaseNumber: 1 | 2) => {
    const phase = sprint.find((item) => item.day === phaseNumber)
    return phase?.actionIds.some(
      (id) => {
        const action = actionById.get(id)
        return Boolean(action && action.status !== 'Completed')
      },
    ) ?? false
  }

  return (
    <section
      className="action-control-center screen-only"
      aria-labelledby="action-control-center-title"
    >
      <header className="action-control-header">
        <div>
          <p className="section-kicker">Operator progress controls</p>
          <h2 id="action-control-center-title">Action Control Center</h2>
          <p>
            Update the canonical plan here. The client preview responds immediately;
            Save Snapshot keeps progress and activity after refresh.
          </p>
        </div>
        <div className="action-progress-summary" aria-live="polite">
          <strong>
            {actions.filter((action) => action.status === 'Completed').length}/{actions.length}
          </strong>
          <span>actions completed</span>
          {hasUnsavedProgress && (
            <em role="status">Unsaved progress changes</em>
          )}
        </div>
      </header>

      <section className="quick-status-panel" aria-labelledby="quick-status-title">
        <div>
          <span>Next unblocked milestone</span>
          <h3 id="quick-status-title">
            {allCompleted
              ? 'Implementation plan complete — generate a follow-up Snapshot.'
              : nextAction?.title
                ?? 'No active milestone — review deferred actions and dependencies.'}
          </h3>
        </div>
        <div className="quick-status-actions">
          <button
            type="button"
            onClick={onStartNext}
            disabled={!nextAction || nextAction.status === 'In Progress'}
          >
            <Play size={18} aria-hidden="true" />
            Start next action
          </button>
          <button type="button" onClick={onCompleteNext} disabled={!nextAction}>
            <CheckCircle2 size={18} aria-hidden="true" />
            Mark next action complete
          </button>
          <button
            type="button"
            onClick={() => onCompleteSprintPhase(1)}
            disabled={!sprintStepCanComplete(1)}
          >
            <CheckCheck size={18} aria-hidden="true" />
            Complete sprint step 1
          </button>
          <button
            type="button"
            onClick={() => onCompleteSprintPhase(2)}
            disabled={!sprintStepCanComplete(2)}
          >
            <CheckCheck size={18} aria-hidden="true" />
            Complete sprint step 2
          </button>
          <button className="reset-status-button" type="button" onClick={onResetAll}>
            <RotateCcw size={18} aria-hidden="true" />
            Reset all statuses
          </button>
        </div>
        <small>
          Sprint shortcuts update only the actions assigned to that displayed step.
          Dependencies are never completed automatically.
        </small>
      </section>

      {orderedActions.length === 0 ? (
        <p className="action-control-empty">
          Generate recommendations to begin tracking implementation progress.
        </p>
      ) : (
        <div className="action-control-list">
          {orderedActions.map((action) => {
            const blockers = getBlockingActions(action, actions)
            const evidenceCount = getEvidenceForAction(action.id, evidenceItems).length
            return (
              <article className="action-control-card" key={action.id}>
                <div className="action-control-card-heading">
                  <div>
                    <span>Action {action.recommendedOrder}</span>
                    <h3>{action.title}</h3>
                  </div>
                  <span className={`action-status-pill ${actionStatusClass(action.status)}`}>
                    {action.status}
                  </span>
                </div>

                <dl className="action-control-meta">
                  <div><dt>Category</dt><dd>{action.category}</dd></div>
                  <div><dt>Priority</dt><dd>{action.priority}</dd></div>
                  <div><dt>Effort</dt><dd>{action.estimatedEffort}</dd></div>
                  <div>
                    <dt>Linked evidence</dt>
                    <dd>{evidenceCount}</dd>
                  </div>
                </dl>

                {blockers.length > 0 && (
                  <div className="action-dependency-warning" role="note">
                    <AlertTriangle size={18} aria-hidden="true" />
                    <span>
                      <strong>Dependency unfinished</strong>
                      <small>
                        {blockers.map((blocker) =>
                          `${blocker.title} (${blocker.status})`,
                        ).join('; ')}
                      </small>
                    </span>
                  </div>
                )}

                <label className="action-status-control">
                  <span>Current status</span>
                  <select
                    value={action.status}
                    onChange={(event) => onStatusChange(
                      action.id,
                      event.target.value as RecommendedActionStatus,
                    )}
                  >
                    {actionStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </article>
            )
          })}
        </div>
      )}

      <section className="action-activity-panel" aria-labelledby="action-activity-title">
        <header>
          <History size={19} aria-hidden="true" />
          <div>
            <span>Operator only</span>
            <h3 id="action-activity-title">Recent activity</h3>
          </div>
          <small>
            Showing {recentHistory.length} · {Math.min(history.length, 50)}/50 retained
          </small>
        </header>
        {recentHistory.length === 0 ? (
          <p>No action status changes recorded yet.</p>
        ) : (
          <ol>
            {recentHistory.map((entry, index) => {
              const action = actionById.get(entry.actionId)
              return (
                <li key={`${entry.actionId}-${entry.changedAt}-${index}`}>
                  <strong>{action?.title ?? 'Previous canonical action'}</strong>
                  <span>{entry.previousStatus} → {entry.newStatus}</span>
                  <time dateTime={entry.changedAt}>{formatChangedAt(entry.changedAt)}</time>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </section>
  )
}
