import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  FilePlus2,
  History,
  ImagePlus,
  Play,
  RotateCcw,
} from 'lucide-react'
import type {
  ActionStatusChange,
  EvidenceItem,
  EvidenceTiming,
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
import {
  getEvidenceForAction,
  getEvidenceForActionByTiming,
} from '../lib/evidence'
import {
  getVerificationReadiness,
  normalizeVerificationStatus,
  verificationStatusOptions,
  type ActionVerificationPatch,
} from '../lib/implementationVerification'
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
  message,
  onStatusChange,
  onVerificationChange,
  onAddAfterEvidence,
  onViewActionEvidence,
  onStartNext,
  onCompleteNext,
  onResetAll,
  onCompleteSprintPhase,
  onCreateFollowUp,
  followUpDisabledReason,
}: {
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
  history: ActionStatusChange[]
  sprint: ConsultingRoadmap['sprint']
  hasUnsavedProgress: boolean
  message?: string
  onStatusChange: (actionId: string, status: RecommendedActionStatus) => void
  onVerificationChange: (actionId: string, patch: ActionVerificationPatch) => void
  onAddAfterEvidence: (actionId: string) => void
  onViewActionEvidence: (actionId: string, timing?: EvidenceTiming) => void
  onStartNext: () => void
  onCompleteNext: () => void
  onResetAll: () => void
  onCompleteSprintPhase: (phaseNumber: 1 | 2) => void
  onCreateFollowUp?: () => void
  followUpDisabledReason?: string
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
      id="action-control-center"
      aria-labelledby="action-control-center-title"
    >
      <header className="action-control-header">
        <div>
          <p className="section-kicker">Operator progress controls</p>
          <h2 id="action-control-center-title">Action Control Center</h2>
          <p>
            {onCreateFollowUp
              ? 'Update the canonical plan here. Create a Follow-Up Snapshot to preserve the loaded Snapshot as the baseline and store implementation progress separately.'
              : 'Update the canonical plan here. The client preview responds immediately; Save Snapshot keeps progress and activity after refresh.'}
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

      {message && <p className="action-control-message" role="status">{message}</p>}

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
          {onCreateFollowUp && (
            <button
              type="button"
              onClick={onCreateFollowUp}
              disabled={Boolean(followUpDisabledReason)}
              title={followUpDisabledReason}
            >
              <FilePlus2 size={18} aria-hidden="true" />
              Create Follow-Up Snapshot
            </button>
          )}
        </div>
        <small>
          Sprint shortcuts update only the actions assigned to that displayed step.
          Dependencies are never completed automatically.
        </small>
      </section>

      {orderedActions.length === 0 ? (
        <p className="action-control-empty">
          No canonical actions yet. Complete the business details and scores to generate the
          implementation plan, then return here to track progress.
        </p>
      ) : (
        <div className="action-control-list">
          {orderedActions.map((action) => {
            const blockers = getBlockingActions(action, actions)
            const evidenceCount = getEvidenceForAction(action.id, evidenceItems).length
            const baselineEvidenceCount = getEvidenceForActionByTiming(
              action.id,
              evidenceItems,
              'Baseline',
            ).length
            const afterEvidenceCount = getEvidenceForActionByTiming(
              action.id,
              evidenceItems,
              'After',
            ).length
            const verificationStatus = normalizeVerificationStatus(
              action.verificationStatus,
            )
            const verificationReadiness = getVerificationReadiness(action, evidenceItems)
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
                    <dd>
                      {evidenceCount} · {baselineEvidenceCount} baseline · {afterEvidenceCount} after
                    </dd>
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

                <details
                  className="action-verification-panel"
                  open={action.status === 'Completed' ? true : undefined}
                >
                  <summary>
                    <span>Completion & verification</span>
                    <em className={verificationStatus.toLocaleLowerCase().replaceAll(' ', '-')}>
                      {verificationStatus}
                    </em>
                  </summary>
                  <div className="action-verification-body">
                    <label>
                      <span>Implementation note</span>
                      <textarea
                        rows={3}
                        value={action.implementationNote || ''}
                        placeholder="Record only the work that was actually implemented."
                        onChange={(event) => onVerificationChange(action.id, {
                          implementationNote: event.target.value,
                        })}
                      />
                    </label>

                    <div className="action-verification-grid">
                      <label>
                        <span>Completion date</span>
                        <input
                          type="date"
                          value={action.completionDate || ''}
                          onChange={(event) => onVerificationChange(action.id, {
                            completionDate: event.target.value,
                          })}
                        />
                      </label>
                      <label>
                        <span>Verification status</span>
                        <select
                          value={verificationStatus}
                          onChange={(event) => onVerificationChange(action.id, {
                            verificationStatus: event.target.value as RecommendedAction['verificationStatus'],
                          })}
                        >
                          {verificationStatusOptions.map((status) => (
                            <option
                              key={status}
                              value={status}
                              disabled={status === 'Verified' && !verificationReadiness.ready}
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="action-evidence-state" aria-label="Linked implementation evidence">
                      <div className="baseline">
                        <strong>{baselineEvidenceCount}</strong>
                        <span>Baseline evidence</span>
                      </div>
                      <div className="after">
                        <strong>{afterEvidenceCount}</strong>
                        <span>After evidence</span>
                      </div>
                    </div>

                    <div className="action-evidence-buttons">
                      <button type="button" onClick={() => onAddAfterEvidence(action.id)}>
                        <ImagePlus size={17} aria-hidden="true" />
                        Add after evidence
                      </button>
                      {baselineEvidenceCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onViewActionEvidence(action.id, 'Baseline')}
                        >
                          View baseline
                        </button>
                      )}
                      {afterEvidenceCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onViewActionEvidence(action.id, 'After')}
                        >
                          View after
                        </button>
                      )}
                    </div>

                    <label>
                      <span>Verification method</span>
                      <textarea
                        rows={3}
                        value={action.verificationMethod || ''}
                        placeholder="Example: Review the live page on phone and desktop and compare it with dated baseline evidence."
                        onChange={(event) => onVerificationChange(action.id, {
                          verificationMethod: event.target.value,
                        })}
                      />
                    </label>

                    <label>
                      <span>Conservative outcome note</span>
                      <textarea
                        rows={3}
                        value={action.outcomeNote || ''}
                        placeholder="Describe only the observable result. Use Not yet verified when business impact is unknown."
                        onChange={(event) => onVerificationChange(action.id, {
                          outcomeNote: event.target.value,
                        })}
                      />
                    </label>

                    <small>
                      Verified requires a Completed action, a recorded method, and at least one
                      linked after-state observation or screenshot. It does not verify rankings,
                      leads, bookings, conversion, or revenue.
                    </small>
                  </div>
                </details>
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
