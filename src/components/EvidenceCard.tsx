import { useState } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from 'lucide-react'
import {
  EvidenceImageError,
  evidenceSentiments,
  evidenceTypes,
  isEvidenceReportReady,
  optimizeScreenshot,
} from '../lib/evidence'
import type { EvidenceItem, EvidenceSentiment, EvidenceType, RecommendedAction } from '../types'

type EvidenceCardProps = {
  item: EvidenceItem
  index: number
  total: number
  actions: RecommendedAction[]
  expanded: boolean
  onToggle: () => void
  onUpdate: (item: EvidenceItem) => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
  onLinkAction: (actionId: string, linked: boolean) => void
}

export function EvidenceCard({
  item,
  index,
  total,
  actions,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onMove,
  onLinkAction,
}: EvidenceCardProps) {
  const [deletePending, setDeletePending] = useState(false)
  const [pendingReplacement, setPendingReplacement] = useState<File | null>(null)
  const [imageMessage, setImageMessage] = useState('')
  const [processingImage, setProcessingImage] = useState(false)
  const reportReady = isEvidenceReportReady(item)
  const linkedActions = actions.filter((action) => item.linkedActionIds.includes(action.id))

  function updateField<K extends keyof EvidenceItem>(field: K, value: EvidenceItem[K]) {
    onUpdate({ ...item, [field]: value, updatedAt: new Date().toISOString() })
  }

  async function processImage(file: File) {
    setProcessingImage(true)
    setImageMessage('Optimizing screenshot for browser storage…')

    try {
      const optimized = await optimizeScreenshot(file)
      onUpdate({
        ...item,
        screenshotDataUrl: optimized.dataUrl,
        screenshotFileName: optimized.fileName,
        screenshotAltText: item.screenshotAltText
          || `Screenshot supporting ${item.title || 'this observation'}`,
        updatedAt: new Date().toISOString(),
      })
      const originalKb = Math.round(optimized.originalBytes / 1024)
      const optimizedKb = Math.round(optimized.optimizedBytes / 1024)
      setImageMessage(
        `Screenshot optimized from ${originalKb.toLocaleString()} KB to ${optimizedKb.toLocaleString()} KB.`,
      )
    } catch (error) {
      setImageMessage(
        error instanceof EvidenceImageError
          ? error.message
          : 'Image could not be processed. Try a different file.',
      )
    } finally {
      setProcessingImage(false)
      setPendingReplacement(null)
    }
  }

  function chooseImage(file: File | undefined) {
    if (!file) return
    if (item.screenshotDataUrl) {
      setPendingReplacement(file)
      setImageMessage('')
      return
    }
    void processImage(file)
  }

  function removeScreenshot() {
    onUpdate({
      ...item,
      screenshotDataUrl: undefined,
      screenshotFileName: undefined,
      screenshotAltText: undefined,
      updatedAt: new Date().toISOString(),
    })
    setImageMessage('Screenshot removed from this evidence item.')
  }

  return (
    <article className="evidence-editor-card" id={`evidence-manager-item-${item.id}`}>
      <div className="evidence-card-summary">
        <button
          className="evidence-expand-button"
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <span className="evidence-number">Evidence {index + 1}</span>
          <span>
            <strong>{item.title.trim() || 'Untitled observation'}</strong>
            <small>{item.evidenceType}</small>
          </span>
          {expanded ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
        </button>
        <span className={`evidence-readiness ${reportReady ? 'complete' : 'incomplete'}`}>
          {reportReady ? 'Complete' : 'Needs details'}
        </span>
      </div>

      {linkedActions.length > 0 && (
        <p className="linked-action-summary">
          Supports: {linkedActions.map((action) => action.title).join(' · ')}
        </p>
      )}

      {expanded && (
        <div className="evidence-editor-body">
          <div className="evidence-editor-grid">
            <EvidenceInput
              label="Short title"
              value={item.title}
              onChange={(value) => updateField('title', value)}
            />
            <EvidenceSelect
              label="Evidence type"
              value={item.evidenceType}
              onChange={(value) => updateField('evidenceType', value)}
            />
            <EvidenceSentimentSelect
              label="Observation classification"
              value={item.sentiment}
              onChange={(value) => updateField('sentiment', value)}
            />
            <EvidenceInput
              label="Source URL"
              inputMode="url"
              value={item.sourceUrl}
              onChange={(value) => updateField('sourceUrl', value)}
            />
            <EvidenceInput
              label="Page or location label"
              value={item.pageLabel}
              placeholder="Homepage hero, profile services, booking step"
              onChange={(value) => updateField('pageLabel', value)}
            />
          </div>

          <div className="evidence-editor-grid">
            <EvidenceTextArea
              label="What was observed"
              value={item.observation}
              onChange={(value) => updateField('observation', value)}
            />
            <EvidenceTextArea
              label="Why it matters"
              value={item.whyItMatters}
              onChange={(value) => updateField('whyItMatters', value)}
            />
            <EvidenceTextArea
              label="Recommended change"
              value={item.recommendedChange}
              onChange={(value) => updateField('recommendedChange', value)}
            />
            <EvidenceTextArea
              label="Expected outcome (optional)"
              value={item.expectedOutcome}
              onChange={(value) => updateField('expectedOutcome', value)}
            />
          </div>

          <section className="screenshot-editor" aria-label="Evidence screenshot">
            <div className="screenshot-editor-heading">
              <div>
                <strong>Screenshot proof</strong>
                <p>Screenshots are stored only in this browser for now.</p>
              </div>
              <label className="file-button">
                <ImagePlus size={18} aria-hidden="true" />
                {item.screenshotDataUrl ? 'Replace screenshot' : 'Upload screenshot'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={processingImage}
                  onChange={(event) => {
                    chooseImage(event.target.files?.[0])
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            </div>

            {pendingReplacement && (
              <div className="inline-confirm" role="status">
                <p>
                  Replace the current screenshot with <strong>{pendingReplacement.name}</strong>?
                  The current image will be removed from this unsaved draft.
                </p>
                <div className="button-row">
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => void processImage(pendingReplacement)}
                  >
                    Replace image
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setPendingReplacement(null)}
                  >
                    Keep current image
                  </button>
                </div>
              </div>
            )}

            {item.screenshotDataUrl && (
              <figure className="screenshot-preview">
                <img
                  src={item.screenshotDataUrl}
                  alt={item.screenshotAltText || item.title || 'Evidence screenshot preview'}
                />
                <figcaption>{item.screenshotFileName || 'Optimized screenshot'}</figcaption>
              </figure>
            )}

            {imageMessage && (
              <p className="image-message" role="status">{imageMessage}</p>
            )}

            {item.screenshotDataUrl && (
              <>
                <EvidenceInput
                  label="Screenshot alt text"
                  value={item.screenshotAltText || ''}
                  placeholder="Describe what a client should notice"
                  onChange={(value) => updateField('screenshotAltText', value || undefined)}
                />
                <button className="secondary-button remove-image-button" type="button" onClick={removeScreenshot}>
                  Remove screenshot
                </button>
              </>
            )}
          </section>

          <div className="evidence-editor-grid">
            <EvidenceInput
              label="Annotation label (optional)"
              value={item.annotationLabel || ''}
              placeholder="CTA is below the fold"
              onChange={(value) => updateField('annotationLabel', value || undefined)}
            />
            <EvidenceInput
              label="Before caption (optional)"
              value={item.beforeCaption || ''}
              placeholder="What is visible now"
              onChange={(value) => updateField('beforeCaption', value || undefined)}
            />
            <EvidenceTextArea
              label="Proposed-after caption (optional)"
              value={item.proposedAfterCaption || ''}
              placeholder="Describe the recommended direction; do not imply it is already complete"
              onChange={(value) => updateField('proposedAfterCaption', value || undefined)}
            />
          </div>

          <fieldset className="action-link-fieldset">
            <legend>Link to recommended actions</legend>
            {actions.length === 0 ? (
              <p>No recommended actions are available.</p>
            ) : (
              <div className="action-link-list">
                {actions.map((action) => (
                  <label key={action.id}>
                    <input
                      type="checkbox"
                      checked={item.linkedActionIds.includes(action.id)}
                      onChange={(event) => onLinkAction(action.id, event.target.checked)}
                    />
                    <span>{action.title}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="evidence-card-actions">
            <div className="reorder-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={index === 0}
                onClick={() => onMove(-1)}
              >
                Move up
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={index === total - 1}
                onClick={() => onMove(1)}
              >
                Move down
              </button>
            </div>
            {deletePending ? (
              <div className="inline-confirm compact" role="status">
                <p>Delete this evidence item and remove its action links?</p>
                <div className="button-row">
                  <button className="danger-button" type="button" onClick={onDelete}>
                    Confirm delete
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setDeletePending(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="danger-button" type="button" onClick={() => setDeletePending(true)}>
                <Trash2 size={17} aria-hidden="true" />
                Delete evidence
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

function EvidenceInput({
  label,
  value,
  placeholder,
  inputMode,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  inputMode?: 'text' | 'url'
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function EvidenceTextArea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function EvidenceSentimentSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: EvidenceSentiment
  onChange: (value: EvidenceSentiment) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as EvidenceSentiment)}>
        {evidenceSentiments.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function EvidenceSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: EvidenceType
  onChange: (value: EvidenceType) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as EvidenceType)}>
        {evidenceTypes.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}
