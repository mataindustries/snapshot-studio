import { Plus, Trash2 } from 'lucide-react'
import type { SavedSnapshot } from '../types'
import type {
  InvestmentMode,
  Proposal,
  ProposalDeliverable,
  ProposalType,
} from '../types/proposal'
import { getEvidenceForAction, isEvidenceReportReady } from '../lib/evidence'
import { rebuildProposalType } from '../lib/proposalBuilder'
import './Proposal.css'

function LinesField({ label, value, onChange }: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value.join('\n')}
        onChange={(event) => onChange(event.target.value.split('\n'))}
      />
    </label>
  )
}

export function ProposalEditor({ proposal, snapshot, onChange }: {
  proposal: Proposal
  snapshot?: SavedSnapshot
  onChange: (proposal: Proposal) => void
}) {
  const patch = <K extends keyof Proposal>(key: K, value: Proposal[K]) => {
    onChange({ ...proposal, [key]: value })
  }
  const selected = new Set(proposal.selectedActionIds)
  const actions = snapshot?.recommendedActions ?? []

  function toggleAction(actionId: string) {
    const next = new Set(proposal.selectedActionIds)
    if (next.has(actionId)) next.delete(actionId)
    else next.add(actionId)
    patch('selectedActionIds', Array.from(next))
  }

  function updateType(value: ProposalType) {
    onChange(snapshot ? rebuildProposalType(proposal, snapshot, value) : { ...proposal, proposalType: value })
  }

  function addCustomDeliverable() {
    const item: ProposalDeliverable = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      whyItMatters: '',
      completionDefinition: '',
      linkedEvidenceIds: [],
    }
    patch('customDeliverables', [...proposal.customDeliverables, item])
  }

  function updateDeliverable(id: string, values: Partial<ProposalDeliverable>) {
    patch('customDeliverables', proposal.customDeliverables.map((item) =>
      item.id === id ? { ...item, ...values } : item,
    ))
  }

  return (
    <div className="proposal-editor">
      <section className="proposal-editor-section">
        <div className="proposal-editor-heading">
          <div><span>Step 1</span><h3>Proposal details</h3></div>
        </div>
        <div className="proposal-editor-grid">
          <label className="field"><span>Proposal type</span><select value={proposal.proposalType} onChange={(event) => updateType(event.target.value as ProposalType)}><option>48-Hour Visibility Sprint</option><option>Custom Implementation</option><option>30-Day Local Authority Buildout</option></select></label>
          <label className="field"><span>Proposal status</span><select value={proposal.proposalStatus} onChange={(event) => patch('proposalStatus', event.target.value as Proposal['proposalStatus'])}><option>Draft</option><option>Ready</option><option>Sent</option><option>Viewed</option><option>Accepted</option><option>Declined</option><option>Expired</option></select></label>
          <label className="field proposal-span-two"><span>Proposal title</span><input value={proposal.proposalTitle} onChange={(event) => patch('proposalTitle', event.target.value)} /></label>
          <label className="field"><span>Business name</span><input value={proposal.clientBusinessName} onChange={(event) => patch('clientBusinessName', event.target.value)} /></label>
          <label className="field"><span>Primary service</span><input value={proposal.snapshotContext.primaryService} onChange={(event) => patch('snapshotContext', { ...proposal.snapshotContext, primaryService: event.target.value })} /></label>
          <label className="field"><span>City / market</span><input value={proposal.snapshotContext.city} onChange={(event) => patch('snapshotContext', { ...proposal.snapshotContext, city: event.target.value })} /></label>
          <label className="field"><span>Contact name (optional)</span><input value={proposal.clientContactName || ''} onChange={(event) => patch('clientContactName', event.target.value || undefined)} /></label>
          <label className="field"><span>Client email (optional)</span><input type="email" value={proposal.clientEmail || ''} onChange={(event) => patch('clientEmail', event.target.value || undefined)} /></label>
          <label className="field"><span>Client phone (optional)</span><input value={proposal.clientPhone || ''} onChange={(event) => patch('clientPhone', event.target.value || undefined)} /></label>
          <label className="field"><span>Prepared by</span><input value={proposal.preparedBy} onChange={(event) => patch('preparedBy', event.target.value)} /></label>
          <label className="field"><span>Brand name</span><input value={proposal.brandName} onChange={(event) => patch('brandName', event.target.value)} /></label>
          <label className="field proposal-span-two"><span>Contact line</span><input value={proposal.contactLine} onChange={(event) => patch('contactLine', event.target.value)} /></label>
          <label className="field proposal-span-two"><span>Proposal summary</span><textarea value={proposal.proposalSummary} onChange={(event) => patch('proposalSummary', event.target.value)} /></label>
        </div>
      </section>

      <section className="proposal-editor-section">
        <div className="proposal-editor-heading"><div><span>Step 2</span><h3>Select scope</h3></div><small>{selected.size} included</small></div>
        {!snapshot && <p className="proposal-warning">The linked Snapshot is unavailable. Existing action references are preserved, but scope details cannot be edited.</p>}
        <div className="proposal-action-list">
          {actions.map((action) => {
            const evidenceCount = getEvidenceForAction(action.id, snapshot?.evidenceItems ?? [])
              .filter(isEvidenceReportReady).length
            const missingDependencies = action.blockedBy.filter((id) => !selected.has(id))
            return (
              <article className={`proposal-action-card ${selected.has(action.id) ? 'is-selected' : ''}`} key={action.id}>
                <label className="proposal-action-toggle">
                  <input type="checkbox" checked={selected.has(action.id)} onChange={() => toggleAction(action.id)} />
                  <span>{selected.has(action.id) ? 'Included' : 'Excluded'}</span>
                </label>
                <div className="proposal-card-topline"><span>{action.category}</span><small>{action.estimatedEffort} effort · {evidenceCount} evidence</small></div>
                <h4>{action.title}</h4>
                <p>{action.reason}</p>
                <dl>
                  <div><dt>Deliverable</dt><dd>{action.description}</dd></div>
                  <div><dt>Expected effect</dt><dd>{action.businessValue}</dd></div>
                </dl>
                {missingDependencies.length > 0 && <p className="proposal-dependency">Dependency warning: {missingDependencies.length} prerequisite action{missingDependencies.length === 1 ? ' is' : 's are'} excluded.</p>}
              </article>
            )
          })}
        </div>
      </section>

      <section className="proposal-editor-section">
        <div className="proposal-editor-heading"><div><span>Step 3</span><h3>Custom deliverables</h3></div><button className="secondary-button" type="button" onClick={addCustomDeliverable}><Plus size={16} /> Add deliverable</button></div>
        {proposal.customDeliverables.map((item) => (
          <article className="proposal-custom-editor" key={item.id}>
            <button className="icon-button danger" type="button" aria-label="Delete custom deliverable" onClick={() => patch('customDeliverables', proposal.customDeliverables.filter((candidate) => candidate.id !== item.id))}><Trash2 size={16} /></button>
            <label className="field"><span>Deliverable title</span><input value={item.title} onChange={(event) => updateDeliverable(item.id, { title: event.target.value })} /></label>
            <label className="field"><span>What will be created or changed</span><textarea value={item.description} onChange={(event) => updateDeliverable(item.id, { description: event.target.value })} /></label>
            <label className="field"><span>Why it matters</span><textarea value={item.whyItMatters} onChange={(event) => updateDeliverable(item.id, { whyItMatters: event.target.value })} /></label>
            <label className="field"><span>Completion definition</span><textarea value={item.completionDefinition} onChange={(event) => updateDeliverable(item.id, { completionDefinition: event.target.value })} /></label>
            {snapshot && snapshot.evidenceItems.filter(isEvidenceReportReady).length > 0 && (
              <fieldset className="proposal-evidence-picker">
                <legend>Optional linked evidence</legend>
                {snapshot.evidenceItems.filter(isEvidenceReportReady).map((evidence) => (
                  <label key={evidence.id}>
                    <input
                      type="checkbox"
                      checked={item.linkedEvidenceIds.includes(evidence.id)}
                      onChange={(event) => updateDeliverable(item.id, {
                        linkedEvidenceIds: event.target.checked
                          ? [...item.linkedEvidenceIds, evidence.id]
                          : item.linkedEvidenceIds.filter((id) => id !== evidence.id),
                      })}
                    />
                    <span>{evidence.title}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </article>
        ))}
      </section>

      <section className="proposal-editor-section">
        <div className="proposal-editor-heading"><div><span>Step 4</span><h3>Timeline and investment</h3></div></div>
        <label className="field"><span>Timeline summary</span><input value={proposal.timeline} onChange={(event) => patch('timeline', event.target.value)} /></label>
        <label className="field"><span>Start window (optional)</span><input value={proposal.startWindow || ''} onChange={(event) => patch('startWindow', event.target.value || undefined)} placeholder="Example: Week of August 10" /></label>
        <div className="proposal-milestone-editors">
          {proposal.milestones.map((milestone) => (
            <div key={milestone.id}>
              <input aria-label="Milestone label" value={milestone.label} onChange={(event) => patch('milestones', proposal.milestones.map((item) => item.id === milestone.id ? { ...item, label: event.target.value } : item))} />
              <textarea aria-label="Milestone details" value={milestone.details} onChange={(event) => patch('milestones', proposal.milestones.map((item) => item.id === milestone.id ? { ...item, details: event.target.value } : item))} />
            </div>
          ))}
        </div>
        <div className="proposal-editor-grid">
          <label className="field"><span>Investment</span><select value={proposal.investmentMode} onChange={(event) => patch('investmentMode', event.target.value as InvestmentMode)}><option>Fixed Price</option><option>Custom Estimate</option><option>Hide Pricing</option></select></label>
          {proposal.investmentMode === 'Fixed Price' && <><label className="field"><span>Fixed price</span><input inputMode="decimal" value={proposal.fixedPrice || ''} onChange={(event) => patch('fixedPrice', event.target.value || undefined)} /></label><label className="field"><span>Currency</span><input value={proposal.currency} onChange={(event) => patch('currency', event.target.value)} /></label></>}
          {proposal.investmentMode === 'Custom Estimate' && <label className="field proposal-span-two"><span>Custom estimate text</span><textarea value={proposal.customInvestmentText || ''} onChange={(event) => patch('customInvestmentText', event.target.value || undefined)} /></label>}
          {proposal.investmentMode !== 'Hide Pricing' && <label className="field proposal-span-two"><span>Payment terms</span><input list="proposal-payment-terms" value={proposal.paymentTerms} onChange={(event) => patch('paymentTerms', event.target.value)} /><datalist id="proposal-payment-terms"><option value="50% to begin, 50% at completion" /><option value="Payment due before work begins" /><option value="Due upon completion" /></datalist></label>}
        </div>
      </section>

      <section className="proposal-editor-section">
        <div className="proposal-editor-heading"><div><span>Step 5</span><h3>Practical terms and next step</h3></div></div>
        <div className="proposal-editor-grid">
          <LinesField label="Assumptions (one per line)" value={proposal.assumptions} onChange={(value) => patch('assumptions', value)} />
          <LinesField label="Exclusions (one per line)" value={proposal.exclusions} onChange={(value) => patch('exclusions', value)} />
          <LinesField label="Client responsibilities (one per line)" value={proposal.clientResponsibilities} onChange={(value) => patch('clientResponsibilities', value)} />
          <label className="field"><span>Operator notes (not printed)</span><textarea value={proposal.notes || ''} onChange={(event) => patch('notes', event.target.value || undefined)} /></label>
          <label className="field"><span>Next-step headline</span><input value={proposal.nextStepHeadline} onChange={(event) => patch('nextStepHeadline', event.target.value)} /></label>
          <label className="field"><span>CTA label</span><input value={proposal.ctaLabel} onChange={(event) => patch('ctaLabel', event.target.value)} /></label>
          <label className="field proposal-span-two"><span>Next-step body</span><textarea value={proposal.nextStepBody} onChange={(event) => patch('nextStepBody', event.target.value)} /></label>
          <label className="field"><span>Booking URL (optional)</span><input type="url" value={proposal.bookingUrl || ''} onChange={(event) => patch('bookingUrl', event.target.value || undefined)} /></label>
          <label className="field"><span>Expiration date (optional)</span><input type="date" value={proposal.expirationDate || ''} onChange={(event) => patch('expirationDate', event.target.value || undefined)} /></label>
        </div>
      </section>
    </div>
  )
}

