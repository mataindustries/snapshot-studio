import { ArrowRight, CalendarClock, ExternalLink, Mail, Phone, Target } from 'lucide-react'
import type { RevenueAction, RevenueFunnelSnapshot } from '../lib/revenueWorkflow'

function ContactIcon({ kind }: { kind: RevenueAction['contactActions'][number]['kind'] }) {
  if (kind === 'email') return <Mail size={16} aria-hidden="true" />
  if (kind === 'call') return <Phone size={16} aria-hidden="true" />
  return <ExternalLink size={16} aria-hidden="true" />
}

export function TodaysRevenueMission({
  actions,
  funnel,
  onOpenActionPack,
}: {
  actions: RevenueAction[]
  funnel: RevenueFunnelSnapshot
  onOpenActionPack: (leadId: string) => void
}) {
  return (
    <section className="revenue-mission panel screen-only" aria-labelledby="revenue-mission-title">
      <header className="revenue-mission-header">
        <div>
          <p className="section-kicker">Phone-first distribution</p>
          <h2 id="revenue-mission-title"><Target size={20} aria-hidden="true" /> Today’s Revenue Mission</h2>
          <p>Work the highest-value follow-ups and handoffs already recorded in the Lead Queue. Every action should be completed, advanced, or rescheduled.</p>
        </div>
        <strong>{actions.length}<span>prioritized actions</span></strong>
      </header>

      <div className="revenue-funnel" aria-label="Current local funnel">
        <span><strong>{funnel.researched}</strong> Researched</span>
        <span><strong>{funnel.contacted}</strong> Contacted</span>
        <span><strong>{funnel.replied}</strong> Replied</span>
        <span><strong>{funnel.calls}</strong> Calls</span>
        <span><strong>{funnel.proposals}</strong> Proposals</span>
        <span><strong>{funnel.won}</strong> Won</span>
      </div>

      {actions.length === 0 ? (
        <p className="empty-state">No revenue actions are due. Add or research a lead, or schedule the next follow-up on an existing conversation.</p>
      ) : (
        <ol className="revenue-action-list">
          {actions.map((action, index) => (
            <li key={action.id} className={action.isOverdue ? 'is-overdue' : ''}>
              <div className="revenue-action-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="revenue-action-copy">
                <div><span>{action.kind}</span><span>{action.priority} priority</span></div>
                <h3>{action.title}</h3>
                <p>{action.reason}</p>
                {action.dueDate && (
                  <small><CalendarClock size={14} aria-hidden="true" /> {action.isOverdue ? 'Overdue · ' : 'Next action · '}{action.dueDate}</small>
                )}
              </div>
              <div className="revenue-action-controls">
                <div aria-label={`Recorded contact actions for ${action.businessName}`}>
                  {action.contactActions.map((contact) => (
                    <a
                      key={contact.kind}
                      href={contact.href}
                      target={contact.kind === 'website' || contact.kind === 'contact-form' ? '_blank' : undefined}
                      rel={contact.kind === 'website' || contact.kind === 'contact-form' ? 'noreferrer' : undefined}
                    >
                      <ContactIcon kind={contact.kind} /> {contact.label}
                    </a>
                  ))}
                </div>
                <button className="primary-button" type="button" onClick={() => onOpenActionPack(action.leadId)}>
                  Action Pack <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
