import { useState } from 'react'
import { FileCheck2, Plus, Trash2 } from 'lucide-react'
import {
  createEvidenceItem,
  getEvidenceForAction,
  removeActionAndLinks,
  removeDanglingEvidenceLinks,
  removeEvidenceAndLinks,
  setEvidenceActionLink,
} from '../lib/evidence'
import type { EvidenceItem, RecommendedAction } from '../types'
import { EvidenceCard } from './EvidenceCard'
import './EvidenceManager.css'

type EvidenceManagerProps = {
  evidenceItems: EvidenceItem[]
  actions: RecommendedAction[]
  includeIncompleteEvidence: boolean
  onChange: (evidenceItems: EvidenceItem[], actions: RecommendedAction[]) => void
  onIncludeIncompleteChange: (include: boolean) => void
  onViewActionEvidence: (actionId: string) => void
}

export function EvidenceManager({
  evidenceItems,
  actions,
  includeIncompleteEvidence,
  onChange,
  onIncludeIncompleteChange,
  onViewActionEvidence,
}: EvidenceManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [clearPending, setClearPending] = useState(false)
  const [actionDeletePending, setActionDeletePending] = useState<string | null>(null)

  function addEvidence() {
    const item = createEvidenceItem()
    onChange([...evidenceItems, item], actions)
    setExpandedId(item.id)
  }

  function updateEvidence(item: EvidenceItem) {
    onChange(
      evidenceItems.map((current) => current.id === item.id ? item : current),
      actions,
    )
  }

  function deleteEvidence(evidenceId: string) {
    const next = removeEvidenceAndLinks(evidenceItems, actions, evidenceId)
    onChange(next.evidenceItems, next.actions)
    setExpandedId((current) => current === evidenceId ? null : current)
  }

  function moveEvidence(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= evidenceItems.length) return

    const reordered = [...evidenceItems]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, moved)
    onChange(reordered, actions)
  }

  function linkAction(evidenceId: string, actionId: string, linked: boolean) {
    const next = setEvidenceActionLink(evidenceItems, actions, evidenceId, actionId, linked)
    onChange(next.evidenceItems, next.actions)
  }

  function clearEvidence() {
    const next = removeDanglingEvidenceLinks([], actions)
    onChange([], next.actions)
    setExpandedId(null)
    setClearPending(false)
  }

  function deleteAction(actionId: string) {
    const next = removeActionAndLinks(evidenceItems, actions, actionId)
    onChange(next.evidenceItems, next.actions)
    setActionDeletePending(null)
  }

  return (
    <section className="panel evidence-manager screen-only" aria-labelledby="evidence-manager-title">
      <div className="section-heading evidence-manager-heading">
        <div>
          <p className="section-kicker">Observable proof</p>
          <h2 id="evidence-manager-title">
            <FileCheck2 size={19} aria-hidden="true" />
            Evidence Manager
          </h2>
          <p>
            Add public-facing observations, attach optimized screenshots, and connect each item
            to the recommendation it supports.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={addEvidence}>
          <Plus size={18} aria-hidden="true" />
          Add evidence
        </button>
      </div>

      <div className="evidence-storage-note">
        <strong>Browser-local evidence</strong>
        <span>Screenshots are stored only in this browser for now.</span>
      </div>

      <section className="recommendation-link-panel" aria-labelledby="recommendation-plan-title">
        <div>
          <p className="section-kicker">Recommendation plan</p>
          <h3 id="recommendation-plan-title">Evidence support by action</h3>
        </div>
        <div className="recommendation-action-list">
          {actions.map((action) => {
            const evidenceCount = getEvidenceForAction(action.id, evidenceItems).length
            const deletePending = actionDeletePending === action.id

            return (
              <article className="recommendation-action-row" key={action.id}>
                <div>
                  <strong>{action.title}</strong>
                  <span>
                    {evidenceCount} evidence item{evidenceCount === 1 ? '' : 's'} linked
                  </span>
                </div>
                <div className="recommendation-row-actions">
                  {evidenceCount > 0 && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onViewActionEvidence(action.id)}
                    >
                      View evidence
                    </button>
                  )}
                  {deletePending ? (
                    <>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => deleteAction(action.id)}
                      >
                        Confirm remove
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setActionDeletePending(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-danger-button"
                      type="button"
                      disabled={actions.length <= 1}
                      title={actions.length <= 1 ? 'Keep at least one recommended action' : undefined}
                      onClick={() => setActionDeletePending(action.id)}
                    >
                      Remove action
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <label className="report-incomplete-toggle">
        <input
          type="checkbox"
          checked={includeIncompleteEvidence}
          onChange={(event) => onIncludeIncompleteChange(event.target.checked)}
        />
        <span>
          <strong>Include incomplete evidence in report</strong>
          <small>Off by default. Incomplete drafts remain saved even when hidden from the report.</small>
        </span>
      </label>

      {evidenceItems.length === 0 ? (
        <div className="evidence-empty-state">
          <FileCheck2 size={30} aria-hidden="true" />
          <p>
            No evidence has been added yet. Add a screenshot-backed observation to make this
            report more concrete.
          </p>
          <button className="primary-button" type="button" onClick={addEvidence}>
            <Plus size={18} aria-hidden="true" />
            Add first evidence item
          </button>
        </div>
      ) : (
        <>
          <div className="evidence-editor-list">
            {evidenceItems.map((item, index) => (
              <EvidenceCard
                key={item.id}
                item={item}
                index={index}
                total={evidenceItems.length}
                actions={actions}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId((current) => current === item.id ? null : item.id)}
                onUpdate={updateEvidence}
                onDelete={() => deleteEvidence(item.id)}
                onMove={(direction) => moveEvidence(index, direction)}
                onLinkAction={(actionId, linked) => linkAction(item.id, actionId, linked)}
              />
            ))}
          </div>

          <div className="clear-evidence-row">
            {clearPending ? (
              <div className="inline-confirm" role="status">
                <p>Clear all evidence and remove every evidence-to-action link?</p>
                <div className="button-row">
                  <button className="danger-button" type="button" onClick={clearEvidence}>
                    Clear all evidence
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setClearPending(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="danger-button" type="button" onClick={() => setClearPending(true)}>
                <Trash2 size={17} aria-hidden="true" />
                Clear all evidence
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
