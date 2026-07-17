import type { ScoreKey, Scores, SnapshotForm, SnapshotOutputs, Tone } from '../types'
import {
  getClientFacingCategoryLabel,
  getDisplayBusinessName,
  getDisplayCity,
  getRecommendationSubject,
  hasClientFacingValue,
} from '../lib/reportDisplay'

type Archetype =
  | 'The Hidden Gem'
  | 'The Local Legend'
  | 'The Sleeping Giant'
  | 'The Invisible Expert'
  | 'The Trust Magnet'
  | 'The Wandering Generalist'
  | 'The AI Blind Spot'
  | 'The Competitor Snack'

type ArchetypeArtworkKey =
  | 'hiddengem'
  | 'locallegend'
  | 'sleepinggiant'
  | 'invisibleexpert'
  | 'trustmagnet'
  | 'wanderinggeneralist'
  | 'aiblindspot'
  | 'competitorsnack'

type BusinessHoroscope = {
  archetype: Archetype
  archetypeSummary: string
  archetypeImagePath: string
  shareSummary: string
  shareCta: string
  scoreExplanations: string[]
  strengths: string[]
  weaknesses: string[]
  competitorSummary: string
  missedOpportunity: string
  fixPlan: string[]
  outreachSummary: string
  cta: string
  premiumUpsell: string
}

const scoreNames: Record<ScoreKey, string> = {
  visibility: 'Visibility',
  trust: 'Trust',
  conversion: 'Conversion',
  aiSearchReadiness: 'AI Search Readiness',
  competitorPosition: 'Competitor Position',
}

const toneLine: Record<Tone, string> = {
  fun: 'playful but useful',
  professional: 'clear and business-focused',
  spicy: 'direct, punchy, and a little spicy',
  premium: 'polished, strategic, and calm',
  friendly: 'playful but useful',
  expert: 'clear and business-focused',
  blunt: 'direct, punchy, and a little spicy',
}

function normalizeTone(tone: Tone): Tone {
  if (tone === 'friendly') return 'fun'
  if (tone === 'expert') return 'professional'
  if (tone === 'blunt') return 'spicy'
  return tone
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n')
}

function formatUrlLabel(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = parsed.hostname.replace(/^www\./, '')
    const path = parsed.pathname.replace(/\/$/, '')
    return path && path !== '/' ? `${host}${path}` : host
  } catch {
    return trimmed.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
  }
}

function isPatientIndustry(form: SnapshotForm) {
  const signal = `${form.niche} ${form.mainService}`.toLowerCase()
  return /dental|dentist|orthodont|periodont|endodont|implant|veneers|teeth|medical|clinic|patient/.test(signal)
}

function getAudiencePhrase(form: SnapshotForm, style: 'local-first' | 'in-city' = 'in-city') {
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const hasCity = hasClientFacingValue(form.city)
  const hasCategory = hasClientFacingValue(form.mainService) || hasClientFacingValue(form.niche)

  if (isPatientIndustry(form)) {
    if (!hasCity) return 'local patients'
    return style === 'local-first' ? `${city} patients` : `patients in ${city}`
  }

  if (!hasCategory) return hasCity ? 'buyers in ' + city : 'local buyers'
  if (!hasCity) return industry.toLowerCase() + ' buyers in the local market'
  return style === 'local-first' ? `${city} ${industry.toLowerCase()} buyers` : `${industry.toLowerCase()} buyers in ${city}`
}

function getLowestScore(scores: Scores) {
  return (Object.keys(scores) as ScoreKey[]).reduce((lowest, key) =>
    scores[key] < scores[lowest] ? key : lowest,
  'visibility')
}

function getHighestScores(scores: Scores) {
  return (Object.keys(scores) as ScoreKey[])
    .sort((left, right) => scores[right] - scores[left])
    .slice(0, 3)
}

export function getDigitalZodiac(scores: Scores, totalScore: number): Archetype {
  const lowest = getLowestScore(scores)

  if (scores.competitorPosition <= 6) return 'The Competitor Snack'
  if (scores.aiSearchReadiness <= 7) return 'The AI Blind Spot'
  if (scores.visibility <= 7 && scores.trust >= 13) return 'The Hidden Gem'
  if (scores.visibility <= 8) return 'The Invisible Expert'
  if (scores.trust >= 17) return 'The Trust Magnet'
  if (scores.visibility >= 16 && scores.competitorPosition >= 15 && totalScore >= 78) {
    return 'The Local Legend'
  }
  if (scores.conversion <= 9 || lowest === 'conversion') return 'The Sleeping Giant'
  return 'The Wandering Generalist'
}

const archetypeArtworkKeys = {
  'The Hidden Gem': 'hiddengem',
  'The Local Legend': 'locallegend',
  'The Sleeping Giant': 'sleepinggiant',
  'The Invisible Expert': 'invisibleexpert',
  'The Trust Magnet': 'trustmagnet',
  'The Wandering Generalist': 'wanderinggeneralist',
  'The AI Blind Spot': 'aiblindspot',
  'The Competitor Snack': 'competitorsnack',
} as const satisfies Record<Archetype, ArchetypeArtworkKey>

const archetypeArtworkPaths = {
  hiddengem: '/archetypes/hidden-gem.png',
  locallegend: '/archetypes/local-legend.png',
  sleepinggiant: '/archetypes/sleeping-giant.png',
  invisibleexpert: '/archetypes/invisible-expert.png',
  trustmagnet: '/archetypes/trust-magnet.png',
  wanderinggeneralist: '/archetypes/wandering-generalist.png',
  aiblindspot: '/archetypes/ai-blind-spot.png',
  competitorsnack: '/archetypes/competitor-snack.png',
} as const satisfies Record<ArchetypeArtworkKey, string>

const knownArchetypeArtworkKeys = new Set<ArchetypeArtworkKey>(
  Object.values(archetypeArtworkKeys),
)
const fallbackArchetypeArtworkPath = archetypeArtworkPaths.wanderinggeneralist

function normalizeArchetypeArtworkKey(identity: string) {
  return identity
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^the/, '')
}

export function getArchetypeImagePath(archetype: string) {
  const artworkKey = normalizeArchetypeArtworkKey(archetype)

  if (knownArchetypeArtworkKeys.has(artworkKey as ArchetypeArtworkKey)) {
    return archetypeArtworkPaths[artworkKey as ArchetypeArtworkKey]
  }

  return fallbackArchetypeArtworkPath
}

function buildShareSummary(form: SnapshotForm, archetype: Archetype) {
  const localAudience = getAudiencePhrase(form, 'local-first')
  const service = getRecommendationSubject(form)

  const summaries: Record<Archetype, string> = {
    'The Hidden Gem': `A useful trust foundation is present, but ${localAudience} may not see it early enough.`,
    'The Local Legend': 'A credible local presence with room to make proof and next steps easier to evaluate.',
    'The Sleeping Giant': 'Useful business value is present, but the inquiry path still creates avoidable friction.',
    'The Invisible Expert': `The expertise is credible; the ${service} story needs to be easier to recognize.`,
    'The Trust Magnet': 'The site has credibility, and the next step can be made more explicit.',
    'The Wandering Generalist': 'The offer needs a clearer focus so buyers understand why it fits their need.',
    'The AI Blind Spot': 'Service, location, and proof need clearer structure for people and AI systems.',
    'The Competitor Snack': 'Nearby alternatives may currently make the customer decision feel more straightforward.',
  }

  return summaries[archetype]
}

function buildArchetypeSummary(form: SnapshotForm, archetype: Archetype, scores: Scores, totalScore: number) {
  const businessName = getDisplayBusinessName(form)
  const city = getDisplayCity(form)
  const service = getRecommendationSubject(form)

  const profiles: Record<Archetype, string> = {
    'The Hidden Gem': `${businessName} already shows signs of a business people could trust, but that value is not yet prominent enough for first-time visitors. The priority is to bring the strongest proof and ${city} relevance closer to the first interaction.`,
    'The Local Legend': `${businessName} has a strong public-facing foundation. The next move is focused refinement: clearer proof, a more explicit contact path, and a supportable reason to choose ${service}.`,
    'The Sleeping Giant': `${businessName} has useful business substance, but the handoff from visitor to inquiry creates conversion friction. Clearer next-step language, process detail, and mobile flow can improve decision confidence.`,
    'The Invisible Expert': `${businessName} has expertise that is not yet visible enough to ${getAudiencePhrase(form)}. Clearer service pages, local context, and direct answers can turn that knowledge into stronger local authority.`,
    'The Trust Magnet': `${businessName} has credibility to work with. The practical opportunity is to place relevant proof closer to forms, phone numbers, process cues, and the first step.`,
    'The Wandering Generalist': `${businessName} presents several broad signals without one clear focus. Making the primary audience, service, and local promise explicit will make the offer easier to evaluate.`,
    'The AI Blind Spot': `${businessName} may be understandable to someone who already knows the company, but AI systems need more explicit facts. Plain-language service, location, FAQ, and proof sections will reduce ambiguity.`,
    'The Competitor Snack': `${businessName} faces conversion friction in a side-by-side comparison. Nearby alternatives may feel easier to choose when their proof, offer, process, or local fit is more explicit.`,
  }

  return `${profiles[archetype]} Current assessment: ${totalScore}/100, with the primary improvement pressure in ${scoreNames[getLowestScore(scores)]}.`
}

function scoreRead(score: number) {
  if (score >= 16) return 'Strong'
  if (score >= 11) return 'Workable'
  if (score >= 7) return 'Thin'
  return 'At risk'
}

function buildScoreExplanations(form: SnapshotForm, scores: Scores) {
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const service = getRecommendationSubject(form)

  const map: Record<ScoreKey, string> = {
    visibility: `Visibility measures whether a ready buyer can quickly connect the site to ${industry}, ${service}, and ${city}.`,
    trust: `Trust measures whether reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes are close enough to the decision point.`,
    conversion: `Conversion measures whether the phone/form/request path tells visitors what to do next and why the first step is low-friction.`,
    aiSearchReadiness: `AI Search Readiness measures whether services, locations, FAQs, and proof are written plainly enough for search and AI summaries.`,
    competitorPosition: `Competitor Position measures whether the site gives a clearer reason to choose this business over nearby alternatives.`,
  }

  return (Object.keys(scores) as ScoreKey[]).map((key) => {
    const read = scoreRead(scores[key])
    return `${scoreNames[key]}: ${scores[key]}/20 (${read}) - ${map[key]}`
  })
}

function buildStrengths(form: SnapshotForm, scores: Scores) {
  const businessName = getDisplayBusinessName(form)
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const service = getRecommendationSubject(form)

  const strengthMap: Record<ScoreKey, string> = {
    visibility: `${businessName} already gives buyers a way to connect ${industry}, ${service}, and ${city} without starting from a blank page.`,
    trust: `There are credibility cues worth using harder: reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes.`,
    conversion: `The site has an inquiry path to build on; a clearer phone/form ask around ${service} could turn more visits into conversations.`,
    aiSearchReadiness: `The business has enough service and location signal to shape stronger AI/search answers with cleaner page structure.`,
    competitorPosition: `The business has a defensible position; the next win is making its best proof easier to compare at a glance.`,
  }

  const scoredStrengths = getHighestScores(scores).map((key) => strengthMap[key])
  const note = form.notes.trim()

  if (!note) return scoredStrengths
  return [note, ...scoredStrengths].slice(0, 3)
}

function buildWeaknesses(form: SnapshotForm, scores: Scores) {
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const service = getRecommendationSubject(form)

  const weaknessMap: Record<ScoreKey, string> = {
    visibility: `The page may not say ${industry}, ${service}, and ${city} quickly enough for a ready buyer scanning on a phone.`,
    trust: `The proof is not close enough to the decision. Reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes should sit near the CTA, not buried.`,
    conversion: `The call/request path needs a cleaner promise: what happens next, how fast they respond, and why reaching out is low-risk.`,
    aiSearchReadiness: `Search and AI summaries may miss the business because services, locations, FAQs, and proof are not written as clear answers.`,
    competitorPosition: `A competitor can win the click if they explain ${service}, process, proof, pricing cues, or local fit more clearly.`,
  }

  const scoredWeaknesses = (Object.keys(scores) as ScoreKey[])
    .sort((left, right) => scores[left] - scores[right])
    .slice(0, 3)
    .map((key) => weaknessMap[key])
  const note = form.weakness.trim()

  if (!note) return scoredWeaknesses
  return [note, ...scoredWeaknesses].slice(0, 3)
}

function buildCompetitorSummary(form: SnapshotForm, scores: Scores) {
  const competitors = [form.competitorUrl1, form.competitorUrl2]
    .map(formatUrlLabel)
    .filter(Boolean)
  const note = form.competitorNote.trim()
  const city = getDisplayCity(form)
  const service = getRecommendationSubject(form)

  if (competitors.length > 0) {
    const position =
      scores.competitorPosition >= 16
        ? `is already credible in the comparison, so the win is to make its strongest proof easier to spot than ${competitors.join(' and ')}.`
        : scores.competitorPosition >= 10
          ? `is in a winnable middle position, but the page needs a sharper why-us reason before a visitor opens ${competitors.join(' or ')} in another tab.`
          : `is exposed in the comparison; ${competitors.join(' and ')} may feel easier to choose if they show clearer proof, process, pricing cues, or local relevance.`
    const manualNote = note ? ` Manual comparison note: ${note}` : ''
    return `Against ${competitors.join(' and ')}, this business ${position} The practical fix is to put ${service} fit, proof, and the next step above the fold on mobile.${manualNote}`
  }

  return `No competitor URLs were added, so this reads as a market-position check. In ${city}, the site still has to answer the comparison question: why this business, why this service, and why contact now?${note ? ` Manual comparison note: ${note}` : ''}`
}

function buildMissedOpportunity(form: SnapshotForm, scores: Scores) {
  const lowest = getLowestScore(scores)
  const service = getRecommendationSubject(form)
  const city = getDisplayCity(form)

  const map: Record<ScoreKey, string> = {
    visibility: `Create or tighten a dedicated ${service} page for ${city} so high-intent visitors and search systems can connect the business to the exact need.`,
    trust: `Move the best proof near the decision point: reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes.`,
    conversion: `Turn the primary CTA into a decision helper: what happens after they call, how fast they hear back, and why the first step is easy.`,
    aiSearchReadiness: 'Add plain-language FAQs and clearly labeled service, location, process, and proof sections that reduce ambiguity for people and AI systems.',
    competitorPosition: `Spell out why this business is the safer or easier choice versus nearby alternatives, using proof instead of broad claims.`,
  }

  return map[lowest]
}

function buildFixPlan(form: SnapshotForm) {
  const service = getRecommendationSubject(form)
  const city = getDisplayCity(form)

  return [
    `Hours 0–24: Review the evidence and clarify the first screen around ${service}, ${city}, credible proof, and one next step.`,
    'Hours 24–48: Implement the highest-priority trust or contact-path improvement, then check it on desktop and mobile.',
  ]
}

export function buildBusinessHoroscope(
  form: SnapshotForm,
  scores: Scores,
  totalScore: number,
): BusinessHoroscope {
  const businessName = getDisplayBusinessName(form)
  const archetype = getDigitalZodiac(scores, totalScore)
  const missedOpportunity = buildMissedOpportunity(form, scores)
  const competitorSummary = buildCompetitorSummary(form, scores)

  return {
    archetype,
    archetypeSummary: buildArchetypeSummary(form, archetype, scores, totalScore),
    archetypeImagePath: getArchetypeImagePath(archetype),
    shareSummary: buildShareSummary(form, archetype),
    shareCta: 'Want me to send the 3 fixes I’d make first?',
    scoreExplanations: buildScoreExplanations(form, scores),
    strengths: buildStrengths(form, scores),
    weaknesses: buildWeaknesses(form, scores),
    competitorSummary,
    missedOpportunity,
    fixPlan: buildFixPlan(form),
    outreachSummary: `${businessName} scored ${totalScore}/100 and came through as ${archetype}. The practical opportunity is to help ${getAudiencePhrase(form)} understand the offer faster, evaluate relevant proof, compare with confidence, and complete the next step on a phone.`,
    cta: 'A useful next conversation would confirm the first implementation move, the evidence behind it, and who will own the work.',
    premiumUpsell: 'Optional implementation path: a screenshot-backed 48-Hour Visibility Sprint focused on the highest-priority improvements. Scope and investment can be tailored before the report is shared.',
  }
}

function buildSnapshot(form: SnapshotForm, scores: Scores, totalScore: number) {
  const report = buildBusinessHoroscope(form, scores, totalScore)
  const businessName = getDisplayBusinessName(form)
  const websiteLine = form.websiteUrl.trim() ? "\nWebsite: " + form.websiteUrl.trim() : ""
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const tone = toneLine[normalizeTone(form.tone)]
  const categoryScores = (Object.keys(scores) as ScoreKey[])
    .map((key) => `- ${scoreNames[key]}: ${scores[key]}/20`)
    .join('\n')

  return `Business Horoscope: ${businessName}${websiteLine}
Market: ${city} | ${industry}
Tone: ${tone}

1. Business Horoscope
${report.archetype}
Image: ${report.archetypeImagePath}
${report.archetypeSummary}

2. Overall score
${totalScore}/100

3. Category scores
${categoryScores}

Score explanations
${formatList(report.scoreExplanations)}

4. Strategic assets
${formatList(report.strengths)}

5. Priority observations
${formatList(report.weaknesses)}

6. Competitor comparison summary
${report.competitorSummary}

7. Biggest opportunity
${report.missedOpportunity}

8. 48-Hour Visibility Sprint
${formatList(report.fixPlan)}

9. Outreach-ready summary
${report.outreachSummary}

10. Implementation conversation
${report.cta}

Share card
Image: ${report.archetypeImagePath}
Business Horoscope: ${report.archetype}
Summary: ${report.shareSummary}
Score: ${totalScore}/100
CTA: ${report.shareCta}

${report.premiumUpsell}`
}

function buildText(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = getDisplayBusinessName(form)
  const shareSummary = buildShareSummary(form, archetype)
  const message = `Hi, I made a quick website snapshot for ${businessName}: ${totalScore}/100, ${archetype}. ${shareSummary} Want me to send the 3 fixes I’d make first?`

  return message.length <= 280 ? message : `${message.slice(0, 276).trimEnd()}...`
}

function buildEmail(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = getDisplayBusinessName(form)
  const service = getRecommendationSubject(form)
  const shareSummary = buildShareSummary(form, archetype)

  return `Subject: Quick website snapshot for ${businessName}

Hi ${businessName} team,

I made a quick Business Horoscope snapshot for your website. It scored ${totalScore}/100 and came through as ${archetype}.

The short version: ${shareSummary}

I looked at whether ${getAudiencePhrase(form)} can quickly understand ${service}, trust the business, compare it with alternatives, and reach out from a phone.

Want me to send the 3 fixes I’d make first?`
}

function buildShareable(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = getDisplayBusinessName(form)
  const imagePath = getArchetypeImagePath(archetype)
  const shareSummary = buildShareSummary(form, archetype)

  return `Business Horoscope snapshot for ${businessName}: ${totalScore}/100, ${archetype}. ${shareSummary} Fastest win: make the offer, proof, comparison, and phone CTA easier for ${getAudiencePhrase(form)}. Want me to send the 3 fixes I’d make first? Image: ${imagePath}`
}

export function generateOutputs(
  form: SnapshotForm,
  scores: Scores,
  totalScore: number,
): SnapshotOutputs {
  const report = buildBusinessHoroscope(form, scores, totalScore)

  return {
    snapshot: buildSnapshot(form, scores, totalScore),
    email: buildEmail(form, totalScore, report.archetype),
    text: buildText(form, totalScore, report.archetype),
    shareable: buildShareable(form, totalScore, report.archetype),
    upsell: report.premiumUpsell,
  }
}
