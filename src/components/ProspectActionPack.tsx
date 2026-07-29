import { useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  Send,
  X,
} from 'lucide-react'
import type { Lead, LeadContactRoute, LeadStatus } from '../types'
import type { ProspectActionPackModel } from '../lib/prospectActionPack'
import {
  getRevenueContactActions,
  getRevenueFollowUpDefaults,
} from '../lib/revenueWorkflow'

const outcomeOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'Replied', label: 'Reply recorded' },
  { value: 'Call booked', label: 'Call booked' },
  { value: 'Proposal sent', label: 'Proposal sent' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' },
  { value: 'Not now', label: 'Not now' },
]

function routeFor(kind: ReturnType<typeof getRevenueContactActions>[number]['kind']): LeadContactRoute {
  if (kind === 'email') return 'Email'
  if (kind === 'contact-form') return 'Contact Form'
  if (kind === 'call') return 'Phone Notes'
  return 'Contact Form'
}

function CopyBlock({
  label,
  text,
  onCopy,
}: {
  label: string
  text: string
  onCopy: (text: string, label: string) => void
}) {
  return (
    <article className="action-pack-copy-block">
      <header><strong>{label}</strong><span>{text.length} characters</span></header>
      <textarea aria-label={label} value={text} readOnly rows={label === '15-minute discovery structure' ? 7 : 6} />
      <button type="button" onClick={() => onCopy(text, label)}><Copy size={16} aria-hidden="true" /> Copy</button>
    </article>
  )
}

export function ProspectActionPack({
  lead,
  model,
  hasProposal,
  onClose,
  onCopy,
  onMarkContacted,
  onRecordOutcome,
  onOpenSendKit,
  onOpenProposal,
}: {
  lead: Lead
  model: ProspectActionPackModel
  hasProposal: boolean
  onClose: () => void
  onCopy: (text: string, label: string) => void
  onMarkContacted: (route: LeadContactRoute, followUpDate: string) => void
  onRecordOutcome: (status: LeadStatus, followUpDate: string) => void
  onOpenSendKit: () => void
  onOpenProposal: () => void
}) {
  const contacts = useMemo(() => getRevenueContactActions(lead), [lead])
  const routeOptions = Array.from(new Set(contacts.map((contact) => routeFor(contact.kind))))
  const defaults = getRevenueFollowUpDefaults()
  const [route, setRoute] = useState<LeadContactRoute | ''>(
    lead.lastContactRoute && routeOptions.includes(lead.lastContactRoute)
      ? lead.lastContactRoute
      : routeOptions[0] || '',
  )
  const [outcome, setOutcome] = useState<LeadStatus>('Replied')
  const [followUpDate, setFollowUpDate] = useState(lead.nextFollowUpDate || defaults.first)

  return (
    <section className="prospect-action-pack screen-only" role="dialog" aria-modal="true" aria-labelledby="prospect-action-pack-title">
      <div className="prospect-action-pack-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="prospect-action-pack-panel">
        <header className="prospect-action-pack-header">
          <div>
            <p className="section-kicker">Source-aware outreach workspace</p>
            <h2 id="prospect-action-pack-title">Prospect Action Pack</h2>
            <p>{model.businessName}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close Prospect Action Pack" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="action-pack-next">
          <span>Next recommended action</span>
          <strong>{model.nextRecommendedAction}</strong>
        </div>

        <section className="action-pack-section">
          <h3>Why this prospect is worth contacting</h3>
          <p>{model.contactRationale}</p>
          {model.missingInformation.length > 0 && (
            <p className="action-pack-warning">Missing before personalization: {model.missingInformation.join(', ')}.</p>
          )}
          {model.operatorNote && <p className="action-pack-warning">{model.operatorNote}</p>}
        </section>

        <section className="action-pack-section">
          <div className="action-pack-section-heading"><h3>Source-linked evidence to verify</h3><span>{model.verifiedEvidence.length}</span></div>
          {model.verifiedEvidence.length === 0 ? (
            <p className="action-pack-missing">No source-linked evidence is ready for outreach. Keep the message permission-based until a public source is verified.</p>
          ) : (
            <ul className="action-pack-evidence-list">
              {model.verifiedEvidence.map((evidence) => (
                <li key={evidence.id}>
                  <strong>{evidence.title}</strong>
                  <p>{evidence.observation}</p>
                  <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Open {evidence.sourceLabel} <ExternalLink size={14} /></a>
                </li>
              ))}
            </ul>
          )}
          <small>{model.evidenceNotice}</small>
        </section>

        <section className="action-pack-section action-pack-sample">
          <div><span>Best matching sample</span><strong>{model.sample.businessName}</strong><small>{model.sample.label} · fictional sample data</small></div>
          <a href={model.sample.href} target="_blank" rel="noreferrer"><FileText size={17} /> View manual</a>
        </section>

        <section className="action-pack-section">
          <h3>Recommended outreach angle</h3>
          <p>{model.outreachAngle}</p>
        </section>

        <section className="action-pack-copy-grid">
          <CopyBlock label="Email subject" text={model.emailSubject} onCopy={onCopy} />
          <CopyBlock label="First email" text={model.firstEmail} onCopy={onCopy} />
          <CopyBlock label="Follow-up email" text={model.followUpEmail} onCopy={onCopy} />
          <CopyBlock label="LinkedIn message" text={model.linkedInMessage} onCopy={onCopy} />
          <CopyBlock label="Voicemail" text={model.voicemail} onCopy={onCopy} />
          <CopyBlock label="Short call opener" text={model.callOpener} onCopy={onCopy} />
          <CopyBlock label="15-minute discovery structure" text={model.discoveryCall.join('\n')} onCopy={onCopy} />
        </section>

        <section className="action-pack-section action-pack-pilot">
          <div><span>Proposal starter</span><h3>{model.proposalStarter.title}</h3><strong>{model.proposalStarter.investment}</strong></div>
          <div className="action-pack-pilot-grid">
            <div><h4>Included</h4><ul>{model.proposalStarter.includes.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h4>Not included</h4><ul>{model.proposalStarter.excludes.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <p>{model.proposalStarter.distinction}</p>
        </section>

        <section className="action-pack-section action-pack-contact-actions">
          <h3>Recorded contact actions</h3>
          {contacts.length === 0 ? <p className="action-pack-missing">No valid email, phone, website, or contact form is recorded.</p> : (
            <div>{contacts.map((contact) => (
              <a key={contact.kind} href={contact.href} target={contact.kind === 'website' || contact.kind === 'contact-form' ? '_blank' : undefined} rel={contact.kind === 'website' || contact.kind === 'contact-form' ? 'noreferrer' : undefined}>
                {contact.kind === 'email' ? <Mail size={16} /> : contact.kind === 'call' ? <Phone size={16} /> : <ExternalLink size={16} />} {contact.label}
              </a>
            ))}</div>
          )}
        </section>

        <section className="action-pack-section action-pack-progress">
          <h3>Record the next move</h3>
          <div className="action-pack-progress-grid">
            <label><span>Contact route</span><select value={route} onChange={(event) => setRoute(event.target.value as LeadContactRoute | '')}><option value="">No recorded route</option>{routeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Outcome</span><select value={outcome} onChange={(event) => setOutcome(event.target.value as LeadStatus)}>{outcomeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span>Next action date</span><input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
          </div>
          <div className="action-pack-date-presets"><button type="button" onClick={() => setFollowUpDate(defaults.first)}><CalendarClock size={15} /> +2 business days</button><button type="button" onClick={() => setFollowUpDate(defaults.second)}><CalendarClock size={15} /> +5 business days</button></div>
          <div className="action-pack-progress-buttons">
            <button type="button" disabled={!route} onClick={() => route && onMarkContacted(route, followUpDate)}><Send size={17} /> Mark contacted</button>
            <button type="button" onClick={() => onRecordOutcome(outcome, followUpDate)}><CheckCircle2 size={17} /> Record outcome</button>
          </div>
        </section>

        <footer className="action-pack-footer">
          <button type="button" onClick={onOpenSendKit}>Open Send Kit</button>
          <button type="button" disabled={!hasProposal} onClick={onOpenProposal}>Open proposal</button>
          <button type="button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </section>
  )
}
