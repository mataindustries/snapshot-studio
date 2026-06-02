import { useMemo, useState } from 'react'
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  Clipboard,
  Copy,
  FileText,
  MessageSquare,
  Printer,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import './App.css'
import { emptyScores, getRatingLabel, getTotalScore, scoreLabels } from './lib/scoring'
import { deleteSnapshot, loadSnapshots, saveSnapshot } from './lib/storage'
import { generateOutputs } from './templates/snapshotTemplates'
import type {
  BrandingFields,
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

const defaultBranding: BrandingFields = {
  preparedBy: 'Sergio',
  brandName: 'Snapshot Studio',
  contactLine: '',
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

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
}

function getReportRating(totalScore: number) {
  if (totalScore >= 21) return 'Strong visibility base'
  if (totalScore >= 16) return 'Solid visibility base'
  if (totalScore >= 11) return 'Visibility opportunity'
  return 'Foundation stage'
}

function getRecommendedSteps(form: SnapshotForm) {
  const city = valueOrFallback(form.city, 'the target city')
  const mainService = valueOrFallback(form.mainService, 'the main service')
  const niche = valueOrFallback(form.niche, 'local business')

  return [
    `Clarify the ${mainService} offer and primary service area near the top of the page.`,
    `Add trust proof, service-area context, and answers to the questions a ${niche} buyer would check before contacting the business.`,
    `Turn the fastest improvement into a short 30-day cleanup plan for ${city}.`,
  ]
}

function buildReportText({
  form,
  branding,
  totalScore,
  reportRating,
  reportDate,
}: {
  form: SnapshotForm
  branding: BrandingFields
  totalScore: number
  reportRating: string
  reportDate: string
}) {
  const businessName = valueOrFallback(form.businessName, 'Business name')
  const city = valueOrFallback(form.city, 'City')
  const niche = valueOrFallback(form.niche, 'Niche')
  const notes = valueOrFallback(
    form.notes,
    'The current site gives a basic public-facing explanation of the business.',
  )
  const weakness = valueOrFallback(
    form.weakness,
    'The biggest limitation appears to be clarity around the offer, service area, trust proof, or next step.',
  )
  const mainService = valueOrFallback(form.mainService, 'the primary service')
  const preparedBy = valueOrFallback(branding.preparedBy, defaultBranding.preparedBy)
  const brandName = valueOrFallback(branding.brandName, defaultBranding.brandName)
  const contactLine = branding.contactLine.trim()
  const nextSteps = getRecommendedSteps(form).map((step) => `- ${step}`).join('\n')
  const contact = contactLine ? `\n${contactLine}` : ''

  return `AI Search Visibility Snapshot

Business: ${businessName}
Market: ${city} - ${niche}
Prepared by: ${preparedBy}, ${brandName}${contact}
Date: ${reportDate}
Score: ${totalScore}/25 - ${reportRating}

What is clear
${notes}

What may be limiting visibility
${weakness}

Fastest improvement
Tighten the public-facing page around ${mainService}, ${city}, visible proof, and the questions prospects are likely to ask before reaching out.

Recommended next steps
${nextSteps}

Paid report offer
A paid AI Search Readiness PDF can expand this snapshot into screenshots, prioritized fixes, and a plain-language 30-day action plan.

Footer note
This snapshot is based on a quick public-facing review and is not a full technical SEO audit.`
}

function App() {
  const [form, setForm] = useState<SnapshotForm>(emptyForm)
  const [branding, setBranding] = useState<BrandingFields>(defaultBranding)
  const [scores, setScores] = useState<Scores>(emptyScores)
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() => loadSnapshots())
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const totalScore = useMemo(() => getTotalScore(scores), [scores])
  const rating = getRatingLabel(totalScore)
  const reportRating = getReportRating(totalScore)
  const reportDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )
  const outputs = useMemo(
    () => generateOutputs(form, totalScore, rating),
    [form, rating, totalScore],
  )
  const reportText = useMemo(
    () => buildReportText({ form, branding, totalScore, reportRating, reportDate }),
    [branding, form, reportDate, reportRating, totalScore],
  )
  const recommendedSteps = useMemo(() => getRecommendedSteps(form), [form])

  function updateField<K extends keyof SnapshotForm>(field: K, value: SnapshotForm[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateBranding<K extends keyof BrandingFields>(field: K, value: BrandingFields[K]) {
    setBranding((current) => ({ ...current, [field]: value }))
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
      branding,
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
    setBranding(snapshot.branding ?? defaultBranding)
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
    setBranding(defaultBranding)
    setScores(emptyScores)
    setLoadedId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="app-shell">
      <header className="topbar screen-only">
        <div>
          <p className="eyebrow">Internal consulting workspace</p>
          <h1>Snapshot Studio</h1>
          <p className="topbar-copy">
            Build a quick AI search visibility snapshot, outreach copy, and a polished report
            preview from one lightweight workflow.
          </p>
        </div>
        <div className="score-pill" aria-label={`Score ${totalScore} out of 25, ${rating}`}>
          <span>Readiness score</span>
          <strong>{totalScore}/25</strong>
          <small>{rating}</small>
        </div>
      </header>

      <section className="workspace screen-only">
        <div className="panel form-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Snapshot inputs</p>
              <h2>Business Profile</h2>
            </div>
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

          <div className="notes-grid">
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
          </div>

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

        <aside className="side-stack">
          <section className="panel score-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Assessment</p>
                <h2>Visibility Score</h2>
              </div>
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
          </section>

          <section className="panel branding-panel">
            <div className="section-heading compact-heading">
              <div>
                <p className="section-kicker">Report branding</p>
                <h2>Prepared By</h2>
              </div>
              <Briefcase size={18} aria-hidden="true" />
            </div>
            <TextInput
              label="Prepared by name"
              value={branding.preparedBy}
              onChange={(value) => updateBranding('preparedBy', value)}
            />
            <TextInput
              label="Brand name"
              value={branding.brandName}
              onChange={(value) => updateBranding('brandName', value)}
            />
            <TextInput
              label="Optional contact line"
              value={branding.contactLine}
              onChange={(value) => updateBranding('contactLine', value)}
            />
          </section>

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

      <section className="report-section" aria-label="Client-facing report preview">
        <div className="report-toolbar screen-only">
          <div>
            <p className="section-kicker">Client preview</p>
            <h2>One-Page Report Preview</h2>
          </div>
          <div className="report-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void copyText('report', reportText)}
            >
              <Copy size={18} aria-hidden="true" />
              {copiedKey === 'report' ? 'Copied report' : 'Copy report text'}
            </button>
            <button className="primary-button" type="button" onClick={() => window.print()}>
              <Printer size={18} aria-hidden="true" />
              Print / Save PDF
            </button>
          </div>
        </div>

        <article className="report-shell">
          <header className="report-header">
            <div>
              <p className="report-brand">{valueOrFallback(branding.brandName, defaultBranding.brandName)}</p>
              <h2>AI Search Visibility Snapshot</h2>
              <p>
                {valueOrFallback(form.businessName, 'Business name')} |{' '}
                {valueOrFallback(form.city, 'City')} | {valueOrFallback(form.niche, 'Niche')}
              </p>
            </div>
            <div className="report-score" aria-label={`Report score ${totalScore} out of 25`}>
              <span>{totalScore}/25</span>
              <strong>{reportRating}</strong>
            </div>
          </header>

          <div className="report-meta">
            <span>
              <Briefcase size={16} aria-hidden="true" />
              Prepared by {valueOrFallback(branding.preparedBy, defaultBranding.preparedBy)}
            </span>
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              {reportDate}
            </span>
            {branding.contactLine.trim() && <span>{branding.contactLine}</span>}
          </div>

          <div className="report-grid">
            <ReportBlock
              title="What is clear"
              text={valueOrFallback(
                form.notes,
                'The current site gives a basic public-facing explanation of the business.',
              )}
            />
            <ReportBlock
              title="What may be limiting visibility"
              text={valueOrFallback(
                form.weakness,
                'The biggest limitation appears to be clarity around the offer, service area, trust proof, or next step.',
              )}
            />
            <ReportBlock
              title="Fastest improvement"
              text={`Tighten the public-facing page around ${valueOrFallback(
                form.mainService,
                'the primary service',
              )}, ${valueOrFallback(
                form.city,
                'the target city',
              )}, visible proof, and the questions prospects are likely to ask before reaching out.`}
            />
          </div>

          <section className="report-next">
            <div>
              <h3>Recommended next steps</h3>
              <ul>
                {recommendedSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="offer-box">
              <h3>Paid report offer</h3>
              <p>
                A paid AI Search Readiness PDF can expand this snapshot into screenshots,
                prioritized fixes, and a plain-language 30-day action plan.
              </p>
            </div>
          </section>

          <footer className="report-footer">
            <BarChart3 size={16} aria-hidden="true" />
            This snapshot is based on a quick public-facing review and is not a full technical
            SEO audit.
          </footer>
        </article>
      </section>

      <section className="outputs-grid screen-only" aria-label="Generated outputs">
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

      <section className="panel saved-panel screen-only">
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

function ReportBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="report-block">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
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
