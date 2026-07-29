# UpgradeOS Distribution Runbook

This runbook is for the browser-local revenue workflow in Snapshot Studio. It uses the existing Lead Queue, Fast Lane, Snapshot, Proposal Workspace, and Send Kit. It does not write to production D1, send messages, or collect cross-device analytics.

## Campaign boundary

The current front-door offer is the **$297 founding-client assessment pilot**:

- reviewed Business Operating Manual;
- Business Archetype and five-part assessment;
- three prioritized Upgrade Missions;
- 60–90 day operating roadmap;
- delivery and review conversation.

Implementation, ongoing marketing, paid media, and guaranteed outcomes are not included. Larger implementation proposals remain separate and retain their own scope and pricing.

## The 15-minute morning workflow

### Minutes 0–3 — Open Today’s Revenue Mission

1. Open the Lead Queue.
2. Read the six funnel counts: researched, contacted, replied, calls, proposals, and won.
3. Scan the prioritized actions. Overdue follow-ups, active replies, booked calls, and sent proposals rise above new research.
4. Do not add more prospects until the due follow-ups have an outcome or a new date.

### Minutes 3–8 — Select today’s prospects

Work from the top of Today’s Revenue Mission. Aim for approximately ten actions, but do not pad the list with low-confidence outreach.

A prospect is ready for personalized outreach only when the record has:

- a business name;
- a valid contact route;
- one source-backed reason to contact, or an explicitly permission-based message that makes no business-specific claim;
- the relevant sample manual;
- a clear next action.

Research notes are operator context, not verified facts. Reopen each linked source before using a specific observation.

### Minutes 8–13 — Use the Prospect Action Pack

1. Open **Action Pack** from Today’s Revenue Mission or the lead card.
2. Read **Why this prospect is worth contacting**.
3. Open every source link used in the message. If there is no source-linked evidence, keep the outreach permission-based.
4. Open the matching fictional sample manual and confirm the category is relevant.
5. Copy the best channel message.
6. Recheck the recorded email, phone, website, or contact form, then use that action.
7. Copying text never changes pipeline status.
8. After sending, select the actual route, choose the next action date, and press **Mark contacted**.

### Minutes 13–15 — Record outcomes

Use only outcomes that happened:

- **Replied** — a response was received;
- **Call booked** — a date or time was agreed;
- **Proposal sent** — an existing saved proposal was actually delivered;
- **Won** — the prospect agreed to proceed;
- **Lost** — the prospect declined;
- **Not now** — the opportunity remains valid but timing is wrong.

Use **+2 business days** after initial outreach and **+5 business days** for a later follow-up as practical defaults. Edit either date when the conversation gives a better commitment. Never mark a proposal sent because it was opened, copied, or printed.

## 15-minute discovery call

Use the structure in the Action Pack:

1. **0–2 minutes:** confirm the owner’s immediate operating priority.
2. **2–6 minutes:** understand how prospects discover, evaluate, and contact the business.
3. **6–10 minutes:** discuss one source-backed constraint, or state that more verification is required.
4. **10–13 minutes:** explain the $297 assessment pilot and its exclusions.
5. **13–15 minutes:** confirm fit, timing, decision-maker, and one explicit next action.

The goal is a decision, not a long consultation.

## Follow-up rhythm

- First outreach: schedule the next action for two business days later unless the prospect gives another date.
- First follow-up: use the saved follow-up message; do not resend the opening pitch.
- Proposal: schedule a specific next action, commonly five business days later.
- Reply or call: follow the prospect’s stated timing.
- Not now: record the date the operator intends to revisit.
- Lost: close the loop. Do not keep it in the daily queue.

There are no background reminders. Today’s Revenue Mission reads the saved next-action dates each time the app opens.

## Numbers that matter

Use the local funnel as an operational check, not as a performance claim:

- researched prospects with usable records;
- outreach actually sent;
- replies received;
- calls booked;
- proposals actually sent;
- wins.

Sample views, downloads, and pilot CTA clicks are instrumented without names, emails, phones, source URLs, or message content. In this static build those events remain on the visitor’s browser; they are not a cross-device analytics system.

## Definition of a successful distribution day

A day is successful when:

- every prioritized action was completed, advanced, or rescheduled with an accurate next date;
- every due follow-up was handled;
- every reply, booked call, sent proposal, win, loss, or not-now outcome was recorded;
- no outreach used an unverified fact as though it were proven;
- tomorrow’s queue already reflects the next commitments.

Volume is secondary. A smaller accurate loop is more valuable than a larger queue full of unverified personalization.

## Public pilot link

Local preview:

```text
http://localhost:4173/pilot/?campaign=founding-client&industry=hvac
```

Allowed `industry` values are `hvac`, `dental`, `med-spa`, `roofing`, and `tree-service`. Allowed `campaign` values are `founding-client`, `direct-outreach`, `referral`, and `sample`. Other values fall back safely. Do not put business names, contact details, research notes, evidence, or outreach content in the URL.

The public booking or contact action renders only when a valid `VITE_UPGRADEOS_CONSULTATION_URL` or `VITE_UPGRADEOS_CONTACT_EMAIL` is explicitly configured. Otherwise the page tells the prospect to reply to the person who shared it.
