import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  FilePlus2,
  Mail,
  Pencil,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
} from 'lucide-react'
import type { Lead, SavedSnapshot } from '../types'
import type { Proposal, ProposalStatus, ProposalType } from '../types/proposal'
import { createProposalFromSnapshot, duplicateProposal } from '../lib/proposalBuilder'
import { createProposalEmail, createProposalFollowUp } from '../lib/proposalCopy'
import { getProposalReadiness } from '../lib/proposalReadiness'
import { deleteProposal, loadProposals, saveProposal } from '../lib/proposalStorage'
import { ProposalEditor } from './ProposalEditor'
import { ProposalReport } from './ProposalReport'
import './Proposal.css'

export type ProposalCreationRequest = {
  nonce: number
  snapshot: SavedSnapshot
  lead?: Lead
}

const pipelineStatuses: ProposalStatus[] = ['Draft', 'Ready', 'Sent', 'Accepted', 'Declined']
const proposalTypes: ProposalType[] = [
  '48-Hour Visibility Sprint',
  'Custom Implementation',
  '30-Day Local Authority Buildout',
]

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

export function ProposalWorkspace({ snapshots, creationRequest }: {
  snapshots: SavedSnapshot[]
  creationRequest?: ProposalCreationRequest
}) {
  const [proposals, setProposals] = useState<Proposal[]>(() => loadProposals())
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null)
  const [pendingSource, setPendingSource] = useState<ProposalCreationRequest | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>('All')
  const [typeFilter, setTypeFilter] = useState<ProposalType | 'All'>('All')
  const [message, setMessage] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [followUp, setFollowUp] = useState('')
  const handledCreationNonce = useRef<number | undefined>(undefined)
  const activeProposalRef = useRef<Proposal | null>(null)
  const snapshotRef = useRef<SavedSnapshot | undefined>(undefined)

  const snapshot = activeProposal
    ? snapshots.find((item) => item.id === activeProposal.snapshotId)
    : undefined
  const readiness = activeProposal ? getProposalReadiness(activeProposal, snapshot) : null
  useEffect(() => {
    activeProposalRef.current = activeProposal
    snapshotRef.current = snapshot
  }, [activeProposal, snapshot])


  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return proposals.filter((proposal) =>
      (statusFilter === 'All' || proposal.proposalStatus === statusFilter)
      && (typeFilter === 'All' || proposal.proposalType === typeFilter)
      && `${proposal.clientBusinessName} ${proposal.proposalTitle}`.toLowerCase().includes(query),
    )
  }, [proposals, search, statusFilter, typeFilter])

  useEffect(() => {
    if (!creationRequest || handledCreationNonce.current === creationRequest.nonce) return
    handledCreationNonce.current = creationRequest.nonce
    const timer = window.setTimeout(() => {
      const existing = proposals.filter((proposal) => proposal.snapshotId === creationRequest.snapshot.id)
      if (existing.length > 0) {
        setPendingSource(creationRequest)
        setMessage('A proposal already exists for this Snapshot. Choose how to continue.')
      } else {
        const proposal = createProposalFromSnapshot(
          creationRequest.snapshot,
          '48-Hour Visibility Sprint',
          creationRequest.lead,
        )
        setActiveProposal(proposal)
        setPendingSource(null)
        setMessage('Proposal draft created from the current Snapshot. Save when ready.')
      }
      document.getElementById('proposal-workspace')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [creationRequest, proposals])

  const emailIdentity = activeProposal
    ? `${activeProposal.id}|${activeProposal.proposalType}|${activeProposal.clientBusinessName}|${snapshot?.id || 'missing'}`
    : 'closed'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const proposal = activeProposalRef.current
      if (!proposal) return
      const copy = createProposalEmail(proposal, snapshotRef.current)
      setEmailSubject(copy.subject)
      setEmailBody(copy.body)
      setFollowUp(createProposalFollowUp(proposal))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [emailIdentity])

  function persist(proposal: Proposal, successMessage = 'Proposal saved in this browser.') {
    try {
      const next = saveProposal(proposal)
      const saved = next.find((item) => item.id === proposal.id) || proposal
      setProposals(next)
      setActiveProposal(saved)
      setMessage(successMessage)
    } catch {
      setMessage('Proposal could not be saved. The open draft is still available in this tab.')
    }
  }

  function setStatus(proposal: Proposal, status: ProposalStatus) {
    persist({ ...proposal, proposalStatus: status }, `Proposal marked ${status}.`)
  }

  function chooseExisting(mode: 'resume' | 'duplicate' | 'fresh') {
    if (!pendingSource) return
    const existing = proposals.find((proposal) => proposal.snapshotId === pendingSource.snapshot.id)
    if (mode === 'resume' && existing) setActiveProposal(existing)
    if (mode === 'duplicate' && existing) setActiveProposal(duplicateProposal(existing))
    if (mode === 'fresh' || (mode !== 'resume' && !existing)) {
      setActiveProposal(createProposalFromSnapshot(
        pendingSource.snapshot,
        '48-Hour Visibility Sprint',
        pendingSource.lead,
      ))
    }
    setPendingSource(null)
    setMessage(mode === 'resume' ? 'Existing proposal resumed.' : 'New unsaved proposal draft opened.')
  }

  function removeProposal(proposal: Proposal) {
    if (!window.confirm(`Delete the proposal for ${proposal.clientBusinessName || 'this business'}? The Snapshot, evidence, lead, and intake will remain.`)) return
    setProposals(deleteProposal(proposal.id))
    if (activeProposal?.id === proposal.id) setActiveProposal(null)
    setMessage('Proposal deleted. Its linked records were not changed.')
  }

  function printProposal() {
    document.body.classList.add('printing-proposal')
    const cleanUp = () => document.body.classList.remove('printing-proposal')
    window.addEventListener('afterprint', cleanUp, { once: true })
    window.print()
    window.setTimeout(cleanUp, 60_000)
  }

  return (
    <section className="proposal-workspace screen-only" id="proposal-workspace" aria-label="Proposal workspace">
      <div className="proposal-workspace-hero panel">
        <div>
          <p className="section-kicker">Approved Snapshot to implementation</p>
          <h2>Proposal Workspace</h2>
          <p>Build, review, print, and track client-ready scopes without changing the approved Snapshot plan.</p>
        </div>
        <div className="proposal-pipeline" aria-label="Proposal pipeline counts">
          {pipelineStatuses.map((status) => (
            <div key={status}><strong>{proposals.filter((item) => item.proposalStatus === status).length}</strong><span>{status}</span></div>
          ))}
        </div>
      </div>

      {pendingSource && (
        <div className="proposal-conflict panel" role="dialog" aria-label="Existing proposal found">
          <div><strong>Proposal already linked</strong><p>Choose whether to continue the existing proposal or open a separate draft.</p></div>
          <div className="proposal-button-row">
            <button className="primary-button" type="button" onClick={() => chooseExisting('resume')}>Resume proposal</button>
            <button className="secondary-button" type="button" onClick={() => chooseExisting('duplicate')}>Duplicate proposal</button>
            <button className="ghost-button" type="button" onClick={() => chooseExisting('fresh')}>Start fresh</button>
          </div>
        </div>
      )}

      <div className="proposal-workspace-grid">
        <aside className="panel proposal-list-panel">
          <div className="section-heading"><h3>Proposals</h3><span>{proposals.length}</span></div>
          <div className="proposal-filters">
            <label><Search size={16} /><input aria-label="Search proposals by business" placeholder="Search business" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select aria-label="Filter proposals by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | 'All')}><option>All</option>{pipelineStatuses.map((status) => <option key={status}>{status}</option>)}<option>Viewed</option><option>Expired</option></select>
            <select aria-label="Filter proposals by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ProposalType | 'All')}><option>All</option>{proposalTypes.map((type) => <option key={type}>{type}</option>)}</select>
          </div>
          {filtered.length === 0 ? <p className="empty-state">No proposals match this view.</p> : (
            <div className="proposal-list">
              {filtered.map((proposal) => {
                const linked = snapshots.some((item) => item.id === proposal.snapshotId)
                return (
                  <article key={proposal.id} className={activeProposal?.id === proposal.id ? 'is-active' : ''}>
                    <button type="button" onClick={() => setActiveProposal(proposal)}>
                      <strong>{proposal.clientBusinessName || 'Untitled business'}</strong>
                      <span>{proposal.proposalType}</span>
                      <small>{proposal.proposalStatus} · {new Date(proposal.updatedAt).toLocaleDateString()}</small>
                      {!linked && <em>Linked Snapshot unavailable</em>}
                    </button>
                    <div>
                      <button className="icon-button" type="button" title="Resume proposal" aria-label="Resume proposal" onClick={() => setActiveProposal(proposal)}><Pencil size={16} /></button>
                      <button className="icon-button" type="button" title="Duplicate proposal" aria-label="Duplicate proposal" onClick={() => setActiveProposal(duplicateProposal(proposal))}><Copy size={16} /></button>
                      <button className="icon-button danger" type="button" title="Delete proposal" aria-label="Delete proposal" onClick={() => removeProposal(proposal)}><Trash2 size={16} /></button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </aside>

        <div className="proposal-main-column">
          {!activeProposal ? (
            <div className="panel proposal-empty-editor">
              <FilePlus2 size={28} />
              <h3>Create a proposal from the current Snapshot</h3>
              <p>Use the “Create proposal” action in the Snapshot preview. Existing proposals remain available in the list.</p>
            </div>
          ) : (
            <>
              <div className="panel proposal-editor-toolbar">
                <div>
                  <p className="section-kicker">Editing proposal</p>
                  <h3>{activeProposal.clientBusinessName || 'Untitled proposal'}</h3>
                  <span className={`proposal-readiness proposal-readiness-${readiness?.state.toLowerCase().replaceAll(' ', '-')}`}>{readiness?.state}</span>
                </div>
                <div className="proposal-button-row">
                  <button className="primary-button" type="button" onClick={() => persist(activeProposal)}><Save size={16} /> Save proposal</button>
                  <button className="secondary-button" type="button" onClick={() => setActiveProposal(duplicateProposal(activeProposal))}><Copy size={16} /> Duplicate</button>
                  <button className="secondary-button" type="button" onClick={() => setStatus(activeProposal, 'Sent')}><Send size={16} /> Mark Sent</button>
                  <button className="secondary-button" type="button" onClick={() => setStatus(activeProposal, 'Accepted')}><CheckCircle2 size={16} /> Mark Accepted</button>
                  <button className="ghost-button" type="button" onClick={() => setStatus(activeProposal, 'Declined')}>Mark Declined</button>
                </div>
              </div>
              {message && <p className="proposal-message" role="status">{message}</p>}
              {readiness && readiness.warnings.length > 0 && (
                <div className="proposal-readiness-panel panel"><strong>{readiness.state}</strong><ul>{readiness.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><small>Warnings do not block preview or export.</small></div>
              )}
              <ProposalEditor proposal={activeProposal} snapshot={snapshot} onChange={setActiveProposal} />

              <section className="panel proposal-email-editor">
                <div className="proposal-editor-heading"><div><span>Delivery copy</span><h3>Proposal email</h3></div><Mail size={18} /></div>
                <label className="field"><span>Subject</span><input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} /></label>
                <label className="field"><span>Email body</span><textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} /></label>
                <button className="secondary-button" type="button" onClick={() => void copyToClipboard(`Subject: ${emailSubject}\n\n${emailBody}`).then(() => setMessage('Proposal email copied.'))}><Copy size={16} /> Copy proposal email</button>
                <label className="field"><span>Follow-up for Sent proposals</span><textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} /></label>
                <button className="ghost-button" type="button" onClick={() => void copyToClipboard(followUp).then(() => setMessage('Follow-up message copied.'))}>Copy follow-up</button>
              </section>

              <div className="proposal-preview-toolbar panel" id="proposal-preview">
                <div><p className="section-kicker">Client view</p><h3>Review proposal</h3></div>
                <button className="primary-button" type="button" onClick={printProposal}><Printer size={17} /> Print / Save PDF</button>
              </div>
              <ProposalReport proposal={activeProposal} snapshot={snapshot} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

