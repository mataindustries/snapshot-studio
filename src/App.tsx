import { useMemo, useState } from 'react'
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  Clipboard,
  Copy,
  Download,
  FileText,
  Filter,
  ListChecks,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react'
import './App.css'
import { emptyScores, getRatingLabel, getTotalScore, scoreLabels } from './lib/scoring'
import { deleteSnapshot, loadSnapshots, saveSnapshot } from './lib/storage'
import {
  createLead,
  deleteLead,
  emptyLeadInput,
  leadPriorities,
  leadStatuses,
  leadsToCsv,
  loadLeads,
  parseLeadTable,
  persistLeads,
  saveLead,
  type LeadInput,
  type ParsedLead,
} from './lib/leads'
import { generateOutputs } from './templates/snapshotTemplates'
import type {
  BrandingFields,
  CtaStyle,
  Lead,
  LeadPriority,
  LeadStatus,
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

function formatDate(value: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function downloadCsv(filename: string, leads: Lead[]) {
  const blob = new Blob([leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function App() {
  const [form, setForm] = useState<SnapshotForm>(emptyForm)
  const [branding, setBranding] = useState<BrandingFields>(defaultBranding)
  const [scores, setScores] = useState<Scores>(emptyScores)
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() => loadSnapshots())
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads())
  const [leadDraft, setLeadDraft] = useState<LeadInput>(emptyLeadInput)
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState<ParsedLead[]>([])
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'All'>('All')
  const [nicheFilter, setNicheFilter] = useState('All')
  const [leadSearch, setLeadSearch] = useState('')
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
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
  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeLeadId) ?? null,
    [activeLeadId, leads],
  )
  const nicheOptions = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.niche).filter(Boolean))).sort(),
    [leads],
  )
  const filteredLeads = useMemo(() => {
    const query = leadSearch.trim().toLowerCase()

    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter
      const matchesNiche = nicheFilter === 'All' || lead.niche === nicheFilter
      const searchable = `${lead.businessName} ${lead.city} ${lead.niche}`.toLowerCase()
      return matchesStatus && matchesPriority && matchesNiche && searchable.includes(query)
    })
  }, [leadSearch, leads, nicheFilter, priorityFilter, statusFilter])
  const leadStats = useMemo(
    () => ({
      total: leads.length,
      sent: leads.filter((lead) => lead.status === 'Sent').length,
      replies: leads.filter((lead) => lead.status === 'Replied' || lead.status === 'Call booked').length,
      paid: leads.filter((lead) => lead.status === 'Paid').length,
    }),
    [leads],
  )

  function updateField<K extends keyof SnapshotForm>(field: K, value: SnapshotForm[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateBranding<K extends keyof BrandingFields>(field: K, value: BrandingFields[K]) {
    setBranding((current) => ({ ...current, [field]: value }))
  }

  function updateScore(field: ScoreKey, value: number) {
    setScores((current) => ({ ...current, [field]: value }))
  }

  function updateLeadDraft<K extends keyof LeadInput>(field: K, value: LeadInput[K]) {
    setLeadDraft((current) => ({ ...current, [field]: value }))
  }

  function updateLeadList(nextLeads: Lead[]) {
    setLeads(persistLeads(nextLeads))
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

    if (activeLeadId) {
      updateLeadList(
        leads.map((lead) =>
          lead.id === activeLeadId
            ? {
                ...lead,
                linkedSnapshotId: snapshot.id,
                status: lead.status === 'Not reviewed' ? 'Snapshot made' : lead.status,
              }
            : lead,
        ),
      )
    }
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
    setActiveLeadId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmitLead() {
    const existingLead = editingLeadId ? leads.find((lead) => lead.id === editingLeadId) : null
    const nextLead = createLead({
      ...leadDraft,
      id: existingLead?.id,
      createdAt: existingLead?.createdAt,
    })

    if (editingLeadId) {
      updateLeadList(leads.map((lead) => (lead.id === editingLeadId ? nextLead : lead)))
    } else {
      setLeads(saveLead(nextLead))
    }

    setLeadDraft(emptyLeadInput)
    setEditingLeadId(null)
  }

  function handleEditLead(lead: Lead) {
    setLeadDraft({
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      city: lead.city,
      niche: lead.niche,
      mainService: lead.mainService,
      phone: lead.phone,
      email: lead.email,
      contactFormUrl: lead.contactFormUrl,
      leadSource: lead.leadSource,
      priority: lead.priority,
      researchNotes: lead.researchNotes,
      suggestedAngle: lead.suggestedAngle,
      status: lead.status,
      lastContactedAt: lead.lastContactedAt,
      linkedSnapshotId: lead.linkedSnapshotId,
    })
    setEditingLeadId(lead.id)
  }

  function handleDeleteLead(leadId: string) {
    setLeads(deleteLead(leadId))
    if (editingLeadId === leadId) {
      setEditingLeadId(null)
      setLeadDraft(emptyLeadInput)
    }
    if (activeLeadId === leadId) {
      setActiveLeadId(null)
    }
  }

  function handleUseLead(lead: Lead) {
    setForm((current) => ({
      ...current,
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      city: lead.city,
      niche: lead.niche,
      mainService: lead.mainService,
      notes: lead.researchNotes,
      weakness: lead.suggestedAngle,
    }))
    setActiveLeadId(lead.id)
    window.setTimeout(() => {
      document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function handleLeadStatus(leadId: string, status: LeadStatus) {
    updateLeadList(leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)))
  }

  function handleMarkSent(leadId: string) {
    updateLeadList(
      leads.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: 'Sent', lastContactedAt: new Date().toISOString() }
          : lead,
      ),
    )
  }

  function handleParseImport() {
    setImportPreview(parseLeadTable(importText))
  }

  function handleToggleImportLead(importId: string) {
    setImportPreview((current) =>
      current.map((lead) =>
        lead.importId === importId ? { ...lead, selected: !lead.selected } : lead,
      ),
    )
  }

  function handleImportLeads() {
    const selectedLeads = importPreview.filter((lead) => lead.selected).map(createLead)
    if (selectedLeads.length === 0) return

    updateLeadList([...selectedLeads, ...leads])
    setImportPreview([])
    setImportText('')
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

      <section className="lead-cockpit screen-only" aria-label="Lead queue">
        <div className="lead-hero panel">
          <div>
            <p className="section-kicker">Outreach cockpit</p>
            <h2>Lead Queue</h2>
            <p>
              Paste lead lists, queue prospects, load one into the snapshot generator, then mark
              the outreach step without leaving the page.
            </p>
          </div>
          <div className="lead-metrics" aria-label="Lead metrics">
            <Metric label="Leads" value={leadStats.total} />
            <Metric label="Sent" value={leadStats.sent} />
            <Metric label="Replies" value={leadStats.replies} />
            <Metric label="Paid" value={leadStats.paid} />
          </div>
        </div>

        <div className="lead-tools-grid">
          <section className="panel lead-form-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Manual entry</p>
                <h2>{editingLeadId ? 'Edit Lead' : 'Add Lead'}</h2>
              </div>
              <Plus size={18} aria-hidden="true" />
            </div>

            <LeadEditor draft={leadDraft} onChange={updateLeadDraft} />

            <div className="button-row">
              <button className="primary-button" type="button" onClick={handleSubmitLead}>
                <Save size={18} aria-hidden="true" />
                {editingLeadId ? 'Update lead' : 'Add lead'}
              </button>
              {editingLeadId && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setEditingLeadId(null)
                    setLeadDraft(emptyLeadInput)
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </section>

          <section className="panel import-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Paste import</p>
                <h2>CSV, TSV, or Markdown Table</h2>
              </div>
              <Upload size={18} aria-hidden="true" />
            </div>

            <TextArea
              label="Paste lead table"
              value={importText}
              onChange={setImportText}
              placeholder="Business, Website, City, Niche, Service, Phone, Email, Contact Form, Notes, Angle, Priority"
            />

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={handleParseImport}>
                Preview import
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleImportLeads}
                disabled={importPreview.every((lead) => !lead.selected)}
              >
                Import selected
              </button>
            </div>

            {importPreview.length > 0 && (
              <div className="import-preview">
                {importPreview.map((lead) => (
                  <label className="import-row" key={lead.importId}>
                    <input
                      type="checkbox"
                      checked={lead.selected}
                      onChange={() => handleToggleImportLead(lead.importId)}
                    />
                    <span>
                      <strong>{lead.businessName || 'Untitled business'}</strong>
                      <small>
                        {lead.city || 'No city'} | {lead.niche || 'No niche'} | {lead.priority}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="panel queue-panel">
          <div className="section-heading queue-heading">
            <div>
              <p className="section-kicker">Queue</p>
              <h2>
                <ListChecks size={18} aria-hidden="true" />
                {filteredLeads.length} visible leads
              </h2>
            </div>
            <div className="export-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => downloadCsv('snapshot-studio-leads.csv', leads)}
              >
                <Download size={18} aria-hidden="true" />
                Export all
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => downloadCsv('snapshot-studio-filtered-leads.csv', filteredLeads)}
              >
                <Download size={18} aria-hidden="true" />
                Export filtered
              </button>
            </div>
          </div>

          <div className="lead-filters">
            <label className="search-field">
              <span>
                <Search size={16} aria-hidden="true" />
                Search
              </span>
              <input
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder="Business, city, or niche"
              />
            </label>
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as LeadStatus | 'All')}
              options={['All', ...leadStatuses].map((status) => [status, status])}
            />
            <SelectField
              label="Priority"
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as LeadPriority | 'All')}
              options={['All', ...leadPriorities].map((priority) => [priority, priority])}
            />
            <SelectField
              label="Niche"
              value={nicheFilter}
              onChange={setNicheFilter}
              options={['All', ...nicheOptions].map((niche) => [niche, niche])}
            />
          </div>

          {activeLead && (
            <div className="active-lead-note">
              <Filter size={16} aria-hidden="true" />
              Current snapshot lead: <strong>{activeLead.businessName || 'Untitled business'}</strong>
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <p className="empty-state">No leads match the current filters.</p>
          ) : (
            <div className="lead-list">
              {filteredLeads.map((lead) => (
                <article className="lead-card" key={lead.id}>
                  <div className="lead-card-main">
                    <div>
                      <div className="lead-title-row">
                        <h3>{lead.businessName || 'Untitled business'}</h3>
                        <span className={`priority-pill ${lead.priority.toLowerCase()}`}>
                          {lead.priority}
                        </span>
                      </div>
                      <p>
                        {lead.city || 'No city'} | {lead.niche || 'No niche'} |{' '}
                        {lead.mainService || 'No service'}
                      </p>
                      {(lead.websiteUrl || lead.email || lead.phone) && (
                        <div className="lead-contact-line">
                          {lead.websiteUrl && <span>{lead.websiteUrl}</span>}
                          {lead.email && <span>{lead.email}</span>}
                          {lead.phone && <span>{lead.phone}</span>}
                        </div>
                      )}
                    </div>
                    <SelectField
                      label="Status"
                      value={lead.status}
                      onChange={(value) => handleLeadStatus(lead.id, value as LeadStatus)}
                      options={leadStatuses.map((status) => [status, status])}
                    />
                  </div>

                  {(lead.researchNotes || lead.suggestedAngle) && (
                    <div className="lead-notes">
                      {lead.researchNotes && <p>{lead.researchNotes}</p>}
                      {lead.suggestedAngle && <p>{lead.suggestedAngle}</p>}
                    </div>
                  )}

                  <div className="lead-card-footer">
                    <div>
                      {lead.lastContactedAt ? (
                        <span>Last contacted {formatDate(lead.lastContactedAt)}</span>
                      ) : (
                        <span>Not contacted yet</span>
                      )}
                      {lead.linkedSnapshotId && <span>Snapshot linked</span>}
                    </div>
                    <div className="lead-actions">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => handleUseLead(lead)}
                      >
                        Use for snapshot
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleMarkSent(lead.id)}
                      >
                        Mark sent today
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Edit ${lead.businessName || 'lead'}`}
                        title="Edit lead"
                        onClick={() => handleEditLead(lead)}
                      >
                        <Pencil size={17} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        aria-label={`Delete ${lead.businessName || 'lead'}`}
                        title="Delete lead"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

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
              <p className="report-brand">
                {valueOrFallback(branding.brandName, defaultBranding.brandName)}
              </p>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function LeadEditor({
  draft,
  onChange,
}: {
  draft: LeadInput
  onChange: <K extends keyof LeadInput>(field: K, value: LeadInput[K]) => void
}) {
  return (
    <div>
      <div className="field-grid">
        <TextInput
          label="Business name"
          value={draft.businessName}
          onChange={(value) => onChange('businessName', value)}
        />
        <TextInput
          label="Website URL"
          inputMode="url"
          value={draft.websiteUrl}
          onChange={(value) => onChange('websiteUrl', value)}
        />
        <TextInput label="City" value={draft.city} onChange={(value) => onChange('city', value)} />
        <TextInput
          label="Niche"
          value={draft.niche}
          onChange={(value) => onChange('niche', value)}
        />
        <TextInput
          label="Main service"
          value={draft.mainService}
          onChange={(value) => onChange('mainService', value)}
        />
        <TextInput
          label="Phone"
          value={draft.phone}
          onChange={(value) => onChange('phone', value)}
        />
        <TextInput
          label="Email"
          value={draft.email}
          onChange={(value) => onChange('email', value)}
        />
        <TextInput
          label="Contact form URL"
          inputMode="url"
          value={draft.contactFormUrl}
          onChange={(value) => onChange('contactFormUrl', value)}
        />
        <TextInput
          label="Lead source"
          value={draft.leadSource}
          onChange={(value) => onChange('leadSource', value)}
        />
        <SelectField
          label="Priority"
          value={draft.priority}
          onChange={(value) => onChange('priority', value as LeadPriority)}
          options={leadPriorities.map((priority) => [priority, priority])}
        />
        <SelectField
          label="Status"
          value={draft.status}
          onChange={(value) => onChange('status', value as LeadStatus)}
          options={leadStatuses.map((status) => [status, status])}
        />
      </div>
      <div className="notes-grid">
        <TextArea
          label="Research notes"
          value={draft.researchNotes}
          onChange={(value) => onChange('researchNotes', value)}
        />
        <TextArea
          label="Suggested angle"
          value={draft.suggestedAngle}
          onChange={(value) => onChange('suggestedAngle', value)}
        />
      </div>
    </div>
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
  placeholder,
  onChange,
}: {
  label: string
  value: string
  inputMode?: 'url' | 'text'
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({
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
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
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
