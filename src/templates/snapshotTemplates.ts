import type { CtaStyle, SnapshotForm, SnapshotOutputs, Tone } from '../types'

type NicheGroup = 'contractor' | 'medSpa' | 'attorney' | 'generic'

type TemplateContext = {
  businessName: string
  city: string
  nicheLabel: string
  audienceLabel: string
  mainService: string
  notes: string
  weakness: string
  competitorNote: string
  nichePainPoints: string
  reportBullets: string[]
}

const directCta: Record<CtaStyle, string> = {
  'ask-permission': 'Worth sending it over?',
  'send-snapshot': 'I included the short version below.',
  'book-call': 'Open to a quick call if you want to walk through the easiest fixes.',
}

const permissionCta: Record<CtaStyle, string> = {
  'ask-permission': 'Would you like me to send it over?',
  'send-snapshot': 'I can send the short version if useful.',
  'book-call': 'If useful, I can also walk through it on a quick call.',
}

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
}

function normalizeNiche(niche: string): NicheGroup {
  const normalized = niche.toLowerCase()

  if (
    normalized.includes('adu') ||
    normalized.includes('contractor') ||
    normalized.includes('remodel') ||
    normalized.includes('roofer') ||
    normalized.includes('hvac') ||
    normalized.includes('plumb') ||
    normalized.includes('electric') ||
    normalized.includes('builder')
  ) {
    return 'contractor'
  }

  if (
    normalized.includes('med spa') ||
    normalized.includes('medspa') ||
    normalized.includes('aesthetic') ||
    normalized.includes('inject') ||
    normalized.includes('skin')
  ) {
    return 'medSpa'
  }

  if (
    normalized.includes('attorney') ||
    normalized.includes('law') ||
    normalized.includes('lawyer') ||
    normalized.includes('legal')
  ) {
    return 'attorney'
  }

  return 'generic'
}

export function getNicheLabel(niche: string) {
  const explicitNiche = niche.trim()
  if (explicitNiche) return explicitNiche
  return 'local business'
}

export function getAudienceLabel(niche: string) {
  const nicheGroup = normalizeNiche(niche)

  if (nicheGroup === 'contractor') return 'homeowners'
  if (nicheGroup === 'medSpa') return 'prospective patients'
  if (nicheGroup === 'attorney') return 'prospective clients'
  return 'local customers'
}

export function getNichePainPoints(niche: string) {
  const nicheGroup = normalizeNiche(niche)

  if (nicheGroup === 'contractor') {
    return 'homeowner follow-up, service pages, permit/process clarity, and local proof'
  }

  if (nicheGroup === 'medSpa') {
    return 'treatment pages, trust signals, FAQs, before/after proof, and local service clarity'
  }

  if (nicheGroup === 'attorney') {
    return 'practice-area pages, trust signals, local visibility, FAQs, and a clear consultation path'
  }

  return 'service clarity, trust proof, local coverage, and customer questions'
}

export function getNicheReportBullets(niche: string, mainService: string) {
  const service = valueOrFallback(mainService, 'the main service')
  const nicheGroup = normalizeNiche(niche)

  if (nicheGroup === 'contractor') {
    return [
      'Homeowner follow-up points that should be easier to find',
      `Service-page gaps around ${service}`,
      'Permit, process, timeline, and service-area clarity',
      'Local proof and project examples worth highlighting',
      'A 30-day cleanup list ordered by impact',
    ]
  }

  if (nicheGroup === 'medSpa') {
    return [
      `Treatment-page clarity for ${service}`,
      'Trust signals, provider proof, and safety cues',
      'FAQ topics prospective patients are likely to check first',
      'Before/after proof and local service clarity',
      'A 30-day cleanup list ordered by impact',
    ]
  }

  if (nicheGroup === 'attorney') {
    return [
      `Practice-area clarity around ${service}`,
      'Trust signals, credentials, and local relevance',
      'FAQ topics prospective clients are likely to ask',
      'Consultation path and next-step clarity',
      'A 30-day cleanup list ordered by impact',
    ]
  }

  return [
    `Service clarity around ${service}`,
    'Trust proof and local coverage gaps',
    'Customer questions that should be answered sooner',
    'Simple page-structure improvements',
    'A 30-day cleanup list ordered by impact',
  ]
}

export function getToneIntro(tone: Tone, businessName: string, nicheLabel: string) {
  if (tone === 'expert') {
    return `I reviewed ${businessName} as a ${nicheLabel} and noticed a few practical visibility items.`
  }

  if (tone === 'blunt') {
    return `I took a quick look at ${businessName}. A few visibility gaps stood out.`
  }

  return `I took a quick look at ${businessName} and noticed a few practical visibility items.`
}

function getClosing(tone: Tone) {
  if (tone === 'expert') {
    return 'The goal is simple: make the business easier to understand, trust, and contact.'
  }

  if (tone === 'blunt') {
    return 'This is mostly a clarity fix, not a rebuild.'
  }

  return 'Small clarity updates would likely make the page more useful for people reviewing options.'
}

function buildContext(form: SnapshotForm): TemplateContext {
  const nicheLabel = getNicheLabel(form.niche)
  const mainService = valueOrFallback(form.mainService, 'the main service')

  return {
    businessName: valueOrFallback(form.businessName, 'the business'),
    city: valueOrFallback(form.city, 'your service area'),
    nicheLabel,
    audienceLabel: getAudienceLabel(form.niche),
    mainService,
    notes: valueOrFallback(
      form.notes,
      'The site gives a visitor a basic sense of what the business does.',
    ),
    weakness: valueOrFallback(
      form.weakness,
      'The main opportunity is making the service, location, and trust signals easier to spot quickly.',
    ),
    competitorNote: form.competitorNote.trim(),
    nichePainPoints: getNichePainPoints(form.niche),
    reportBullets: getNicheReportBullets(form.niche, mainService),
  }
}

function buildSnapshot(
  context: TemplateContext,
  tone: Tone,
  totalScore: number,
  rating: string,
) {
  const competitorLine = context.competitorNote
    ? `\n\nCompetitor note: ${context.competitorNote}`
    : ''

  return `${context.businessName} - Visibility Snapshot

Score: ${totalScore}/25 (${rating})

1. What is clear
${context.notes}

2. What may be costing visibility
${context.weakness} For a ${context.nicheLabel} in ${context.city}, this can make it harder for ${context.audienceLabel} to quickly understand the offer and next step.${competitorLine}

3. Fastest fix
Tighten the page around ${context.mainService}, ${context.city}, visible trust proof, and the questions ${context.audienceLabel} usually ask before reaching out. Add or improve the details that support ${context.nichePainPoints}.

${getClosing(tone)}`
}

function buildEmail(
  form: SnapshotForm,
  context: TemplateContext,
  totalScore: number,
  rating: string,
) {
  const intro = getToneIntro(form.tone, context.businessName, context.nicheLabel)

  if (form.ctaStyle === 'send-snapshot') {
    return `Hi ${context.businessName} team,

${intro}

I scored the page ${totalScore}/25 (${rating}) for basic visibility clarity. What looks clear: ${context.notes}

The main gap I noticed: ${context.weakness}

Fastest fix: tighten the page around ${context.mainService}, ${context.city}, trust proof, and a few common customer questions.

${directCta[form.ctaStyle]}`
  }

  return `Hi ${context.businessName} team,

${intro}

I noticed one quick opportunity: ${context.weakness}

I put together a short 3-point visibility snapshot for ${context.mainService} in ${context.city}. ${permissionCta[form.ctaStyle]}`
}

function trimToSmsLength(message: string) {
  if (message.length <= 280) return message
  return `${message.slice(0, 276).trimEnd()}...`
}

function buildText(
  form: SnapshotForm,
  context: TemplateContext,
  totalScore: number,
  rating: string,
) {
  if (form.ctaStyle === 'send-snapshot') {
    return trimToSmsLength(
      `Hi, I reviewed ${context.businessName} for visibility clarity. Quick score: ${totalScore}/25 (${rating}). Main gap: ${context.weakness} I can send the short snapshot if useful.`,
    )
  }

  return trimToSmsLength(
    `Hi, I took a quick look at ${context.businessName}. I noticed one visibility gap around ${context.mainService} in ${context.city}. Worth sending over a short 3-point snapshot?`,
  )
}

function buildFollowUp(context: TemplateContext) {
  return `Thanks for replying.

The main thing I would focus on is making ${context.mainService}, ${context.city}, proof, and the next step easier to see quickly. That would give ${context.audienceLabel} a clearer path before they contact you.

I can turn this into a clean one-page PDF with screenshots and a 30-day fix list if useful.`
}

function buildUpsell(context: TemplateContext) {
  const bullets = context.reportBullets.map((bullet) => `- ${bullet}`).join('\n')

  return `Paid AI Search Readiness PDF

For ${context.businessName}, I can prepare a concise $197 PDF that covers:

${bullets}

The report is written in plain language so it can be used by the owner, manager, marketing lead, or whoever updates the site.`
}

export function generateOutputs(
  form: SnapshotForm,
  totalScore: number,
  rating: string,
): SnapshotOutputs {
  const context = buildContext(form)

  return {
    snapshot: buildSnapshot(context, form.tone, totalScore, rating),
    email: buildEmail(form, context, totalScore, rating),
    text: buildText(form, context, totalScore, rating),
    followUp: buildFollowUp(context),
    upsell: buildUpsell(context),
  }
}
