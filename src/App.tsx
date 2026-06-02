import { useMemo, useState } from 'react'
import {
  Clipboard,
  Copy,
  FileText,
  MessageSquare,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import './App.css'
import { emptyScores, getRatingLabel, getTotalScore, scoreLabels } from './lib/scoring'
import { deleteSnapshot, loadSnapshots, saveSnapshot } from './lib/storage'
import { generateOutputs } from './templates/snapshotTemplates'
import type {
  CtaStyle,
  SavedSnapshot,
  ScoreKey,
  Scores,
  SnapshotForm,
  SnapshotOutputs,
  Tone,
} from './types'

const emptyForm: SnapshotForm = {
  businessName: '',
  websiteUrl: '',
  city: '',
  niche: '',
  mainService: '',
  notes: '',
  weakness: '',
  competitorNote: '',
  tone: 'friendly',
  ctaStyle: 'ask-permission',
}

const outputLabels: Array<{
  key: keyof SnapshotOutputs
  title: string
  icon: typeof FileText
}> = [
  { key: 'snapshot', title: 'Snapshot', icon: FileText },
  { key: 'email', title: 'Email / contact form', icon: Send },
  { key: 'text', title: 'Text message', icon: MessageSquare },
  { key: 'followUp', title: 'Reply follow-up', icon: Clipboard },
  { key: 'upsell', title: 'Paid report offer', icon: FileText },
]

const scoreKeys = Object.keys(scoreLabels) as ScoreKey[]

function App() {
  const [form, setForm] = useState<SnapshotForm>(emptyForm)
  const [scores, setScores] = useState<Scores>(emptyScores)
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() => loadSnapshots())
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const totalScore = useMemo(() => getTotalScore(scores), [scores])
  const rating = getRatingLabel(totalScore)
  const outputs = useMemo(
    () => generateOutputs(form, totalScore, rating),
    [form, rating, totalScore],
  )

  function updateField<K extends keyof SnapshotForm>(field: K, value: SnapshotForm[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateScore(field: ScoreKey, value: number) {
    setScores((current) => ({ ...current, [field]: value }))
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedKey(label)
    window.setTimeout(() => setCopiedKey(null), 1600)
  }

  function copyAllOutputs() {
    const allOutputs = outputLabels
      .map(({ key, title }) => `${title}\n\n${outputs[key]}`)
      .join('\n\n---\n\n')

    void copyText('all', allOutputs)
  }

  function handleSaveSnapshot() {
    const now = new Date().toISOString()
    const snapshot: SavedSnapshot = {
      ...form,
      id: loadedId ?? crypto.randomUUID(),
      createdAt: now,
      scores,
      outputs,
    }

    setSavedSnapshots(saveSnapshot(snapshot))
    setLoadedId(snapshot.id)
  }

  function handleLoadSnapshot(snapshot: SavedSnapshot) {
    setForm({
      businessName: snapshot.businessName,
      websiteUrl: snapshot.websiteUrl,
      city: snapshot.city,
      niche: snapshot.niche,
      mainService: snapshot.mainService,
      notes: snapshot.notes,
      weakness: snapshot.weakness,
      competitorNote: snapshot.competitorNote,
      tone: snapshot.tone,
      ctaStyle: snapshot.ctaStyle,
    })
    setScores(snapshot.scores)
    setLoadedId(snapshot.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDeleteSnapshot(snapshotId: string) {
    setSavedSnapshots(deleteSnapshot(snapshotId))
    if (loadedId === snapshotId) {
      setLoadedId(null)
    }
  }

  function handleNewSnapshot() {
    setForm(emptyForm)
    setScores(emptyScores)
    setLoadedId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Internal outreach tool</p>
          <h1>Snapshot Studio</h1>
        </div>
        <div className="score-pill" aria-label={`Score ${totalScore} out of 25, ${rating}`}>
          <strong>{totalScore}/25</strong>
          <span>{rating}</span>
        </div>
      </header>

      <section className="workspace">
        <div className="panel form-panel">
          <div className="section-heading">
            <h2>Business Details</h2>
            <button className="ghost-button" type="button" onClick={handleNewSnapshot}>
              New
            </button>
          </div>

          <div className="field-grid">
            <TextInput
              label="Business name"
              value={form.businessName}
              onChange={(value) => updateField('businessName', value)}
            />
            <TextInput
              label="Website URL"
              inputMode="url"
              value={form.websiteUrl}
              onChange={(value) => updateField('websiteUrl', value)}
            />
            <TextInput
              label="City"
              value={form.city}
              onChange={(value) => updateField('city', value)}
            />
            <TextInput
              label="Niche"
              value={form.niche}
              onChange={(value) => updateField('niche', value)}
            />
            <TextInput
              label="Main service"
              value={form.mainService}
              onChange={(value) => updateField('mainService', value)}
            />
          </div>

          <TextArea
            label="Notes from website"
            value={form.notes}
            onChange={(value) => updateField('notes', value)}
          />
          <TextArea
            label="Obvious weakness"
            value={form.weakness}
            onChange={(value) => updateField('weakness', value)}
          />
          <TextArea
            label="Optional competitor note"
            value={form.competitorNote}
            onChange={(value) => updateField('competitorNote', value)}
          />

          <div className="control-row">
            <SelectField
              label="Tone"
              value={form.tone}
              onChange={(value) => updateField('tone', value as Tone)}
              options={[
                ['friendly', 'Friendly'],
                ['expert', 'Expert'],
                ['blunt', 'Blunt'],
              ]}
            />
            <SelectField
              label="CTA"
              value={form.ctaStyle}
              onChange={(value) => updateField('ctaStyle', value as CtaStyle)}
              options={[
                ['ask-permission', 'Ask permission'],
                ['send-snapshot', 'Send snapshot'],
                ['book-call', 'Book call'],
              ]}
            />
          </div>
        </div>

        <aside className="panel score-panel">
          <div className="section-heading">
            <h2>Visibility Score</h2>
            <span className={`rating-badge ${rating.toLowerCase().replace(' ', '-')}`}>
              {rating}
            </span>
          </div>

          <div className="total-score">
            <span>{totalScore}</span>
            <p>out of 25</p>
          </div>

          <div className="score-list">
            {scoreKeys.map((key) => (
              <label className="score-control" key={key}>
                <span>
                  {scoreLabels[key]}
                  <strong>{scores[key]}</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={scores[key]}
                  onChange={(event) => updateScore(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>

          <div className="sticky-actions">
            <button className="primary-button" type="button" onClick={handleSaveSnapshot}>
              <Save size={18} aria-hidden="true" />
              Save snapshot
            </button>
            <button className="secondary-button" type="button" onClick={copyAllOutputs}>
              <Copy size={18} aria-hidden="true" />
              {copiedKey === 'all' ? 'Copied all' : 'Copy all outputs'}
            </button>
          </div>
        </aside>
      </section>

      <section className="outputs-grid" aria-label="Generated outputs">
        {outputLabels.map(({ key, title, icon: Icon }) => (
          <article className="panel output-card" key={key}>
            <div className="section-heading">
              <h2>
                <Icon size={18} aria-hidden="true" />
                {title}
              </h2>
              <button
                className="icon-button"
                type="button"
                aria-label={`Copy ${title}`}
                title={`Copy ${title}`}
                onClick={() => void copyText(key, outputs[key])}
              >
                <Copy size={17} aria-hidden="true" />
              </button>
            </div>
            <pre>{outputs[key]}</pre>
            {key === 'text' && (
              <p className="character-count">{outputs.text.length} characters</p>
            )}
            {copiedKey === key && <p className="copy-status">Copied</p>}
          </article>
        ))}
      </section>

      <section className="panel saved-panel">
        <div className="section-heading">
          <h2>Saved Snapshots</h2>
          <span>{savedSnapshots.length}</span>
        </div>

        {savedSnapshots.length === 0 ? (
          <p className="empty-state">Saved snapshots will appear here.</p>
        ) : (
          <div className="saved-list">
            {savedSnapshots.map((snapshot) => (
              <article className="saved-item" key={snapshot.id}>
                <button type="button" onClick={() => handleLoadSnapshot(snapshot)}>
                  <strong>{snapshot.businessName || 'Untitled business'}</strong>
                  <span>
                    {snapshot.city || 'No city'} - {snapshot.niche || 'No niche'}
                  </span>
                  <small>{new Date(snapshot.createdAt).toLocaleString()}</small>
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  aria-label={`Delete ${snapshot.businessName || 'snapshot'}`}
                  title="Delete snapshot"
                  onClick={() => handleDeleteSnapshot(snapshot.id)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function TextInput({
  label,
  value,
  inputMode,
  onChange,
}: {
  label: string
  value: string
  inputMode?: 'url' | 'text'
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

export default App
