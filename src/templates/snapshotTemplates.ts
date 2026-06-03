import type { ScoreKey, Scores, SnapshotForm, SnapshotOutputs, Tone } from '../types'

type Archetype =
  | 'The Hidden Gem'
  | 'The Local Legend'
  | 'The Sleeping Giant'
  | 'The Invisible Expert'
  | 'The Trust Magnet'
  | 'The Wandering Generalist'
  | 'The AI Blind Spot'
  | 'The Competitor Snack'

type BusinessHoroscope = {
  archetype: Archetype
  archetypeSummary: string
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

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
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

function buildArchetypeSummary(form: SnapshotForm, archetype: Archetype, scores: Scores, totalScore: number) {
  const businessName = valueOrFallback(form.businessName, 'This business')
  const city = valueOrFallback(form.city, 'its market')
  const service = valueOrFallback(form.mainService, 'its core service')

  const profiles: Record<Archetype, string> = {
    'The Hidden Gem': `${businessName} already has signs of a business people could trust, but too much of that value is hidden from searchers and first-time visitors. The outreach angle is simple: make the best proof and ${city} relevance impossible to miss.`,
    'The Local Legend': `${businessName} has category-leader potential because visibility and competitor position are both carrying weight. The next move is not a rebuild; it is protecting the lead with sharper proof, cleaner CTAs, and a clearer reason to choose ${service}.`,
    'The Sleeping Giant': `${businessName} has useful business substance, but the site is leaving money in the handoff from visitor to inquiry. This is a strong fix-plan prospect because better CTAs, process copy, and mobile flow can change the outcome quickly.`,
    'The Invisible Expert': `${businessName} may know the work, but the site is not broadcasting that expertise loudly enough for buyers in ${city}. This archetype needs clearer service pages, stronger local language, and answer-style sections that make expertise visible.`,
    'The Trust Magnet': `${businessName} has credibility to work with. The best opportunity is turning that trust into action by placing proof closer to forms, phone numbers, pricing/process cues, and the first step.`,
    'The Wandering Generalist': `${businessName} is giving visitors too many broad signals and too few sharp ones. The outreach-worthy opportunity is to pick a buyer, a service, and a local promise so the site feels easier to choose.`,
    'The AI Blind Spot': `${businessName} may be understandable to a person who already knows the company, but AI/search systems need cleaner answers. The fix is plain-language service, location, FAQ, and proof sections that can be summarized confidently.`,
    'The Competitor Snack': `${businessName} is vulnerable in side-by-side comparison. That does not mean the business is weak; it means competitors may be making the decision feel easier with clearer proof, offers, process, or local fit.`,
  }

  return `${profiles[archetype]} Current read: ${totalScore}/100, with the biggest pressure coming from ${scoreNames[getLowestScore(scores)]}.`
}

function scoreRead(score: number) {
  if (score >= 16) return 'Strong'
  if (score >= 11) return 'Workable'
  if (score >= 7) return 'Thin'
  return 'At risk'
}

function buildScoreExplanations(form: SnapshotForm, scores: Scores) {
  const city = valueOrFallback(form.city, 'the local market')
  const industry = valueOrFallback(form.niche, 'the category')
  const service = valueOrFallback(form.mainService, 'the primary service')

  const map: Record<ScoreKey, string> = {
    visibility: `Visibility measures whether a ready buyer can quickly connect the site to ${industry}, ${service}, and ${city}.`,
    trust: `Trust measures whether reviews, credentials, examples, guarantees, team/process cues, or results are close enough to the decision point.`,
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
  const businessName = valueOrFallback(form.businessName, 'The business')
  const city = valueOrFallback(form.city, 'the local market')
  const industry = valueOrFallback(form.niche, 'its industry')
  const service = valueOrFallback(form.mainService, 'its core offer')

  const strengthMap: Record<ScoreKey, string> = {
    visibility: `${businessName} has enough public-facing signal to start competing for ${industry} searches in ${city}.`,
    trust: `Trust is already a workable asset: proof, reviews, credentials, or credibility cues can be turned into faster buyer confidence.`,
    conversion: `The site has a path toward inquiries; sharpening the ask around ${service} can turn more visitors into calls.`,
    aiSearchReadiness: `There is a base for AI/search engines to understand who the business helps, where it operates, and what it offers.`,
    competitorPosition: `The business is not starting from zero against nearby alternatives; clearer positioning can make the comparison easier to win.`,
  }

  const scoredStrengths = getHighestScores(scores).map((key) => strengthMap[key])
  const note = form.notes.trim()

  if (!note) return scoredStrengths
  return [note, ...scoredStrengths].slice(0, 3)
}

function buildWeaknesses(form: SnapshotForm, scores: Scores) {
  const city = valueOrFallback(form.city, 'the target city')
  const industry = valueOrFallback(form.niche, 'the market')
  const service = valueOrFallback(form.mainService, 'the main service')

  const weaknessMap: Record<ScoreKey, string> = {
    visibility: `Searchers may not immediately see the strongest ${industry} and ${city} signals, which can suppress calls from ready buyers.`,
    trust: `Decision-making proof is too quiet; visitors need reviews, outcomes, credentials, guarantees, or examples before they feel safe reaching out.`,
    conversion: `The next step is not doing enough work. Calls, forms, and service-page CTAs should make the decision feel obvious.`,
    aiSearchReadiness: `AI and search systems may struggle to summarize the business cleanly because services, locations, FAQs, and proof are not explicit enough.`,
    competitorPosition: `Competitors may look easier to choose if they explain ${service}, pricing/process cues, proof, or local relevance more clearly.`,
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
  const city = valueOrFallback(form.city, 'the local market')
  const service = valueOrFallback(form.mainService, 'the main service')

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
  const service = valueOrFallback(form.mainService, 'the highest-value service')
  const city = valueOrFallback(form.city, 'the local market')

  const map: Record<ScoreKey, string> = {
    visibility: `Create or tighten a dedicated ${service} page for ${city} so high-intent visitors and search systems can connect the business to the exact need.`,
    trust: `Move the best proof near the decision point: reviews, before/after examples, credentials, guarantees, or real customer outcomes.`,
    conversion: `Turn the primary CTA into a decision helper: what happens after they call, how fast they hear back, and why the first step is easy.`,
    aiSearchReadiness: `Add plain-language FAQs, service schema-friendly structure, and answer-style sections that AI/search tools can quote confidently.`,
    competitorPosition: `Spell out why this business is the safer or easier choice versus nearby alternatives, using proof instead of broad claims.`,
  }

  return map[lowest]
}

function buildFixPlan(form: SnapshotForm, scores: Scores) {
  const service = valueOrFallback(form.mainService, 'primary service')
  const city = valueOrFallback(form.city, 'service city')
  const weakest = scoreNames[getLowestScore(scores)]

  return [
    `Day 1: Rewrite the top section so ${service}, ${city}, proof, and the call/request action are visible immediately.`,
    'Day 2: Add three trust assets near the CTA: reviews, credentials, project examples, guarantees, financing, awards, or real results.',
    `Day 3: Build or improve one focused ${service} page with process, service area, FAQs, and who it is best for.`,
    'Day 4: Add answer-style FAQ sections for the questions buyers ask before contacting the business.',
    'Day 5: Compare the strongest competitor page and add one proof point or differentiator they make clearer.',
    'Day 6: Clean up buttons, forms, phone visibility, and page flow so the next step feels low-friction on mobile.',
    `Day 7: Review ${weakest} again and publish the smallest fix that would make a buyer choose faster.`,
  ]
}

export function buildBusinessHoroscope(
  form: SnapshotForm,
  scores: Scores,
  totalScore: number,
): BusinessHoroscope {
  const businessName = valueOrFallback(form.businessName, 'Business name')
  const city = valueOrFallback(form.city, 'City')
  const industry = valueOrFallback(form.niche, 'Industry')
  const archetype = getDigitalZodiac(scores, totalScore)
  const missedOpportunity = buildMissedOpportunity(form, scores)
  const competitorSummary = buildCompetitorSummary(form, scores)
  const tone = normalizeTone(form.tone)

  return {
    archetype,
    archetypeSummary: buildArchetypeSummary(form, archetype, scores, totalScore),
    scoreExplanations: buildScoreExplanations(form, scores),
    strengths: buildStrengths(form, scores),
    weaknesses: buildWeaknesses(form, scores),
    competitorSummary,
    missedOpportunity,
    fixPlan: buildFixPlan(form, scores),
    outreachSummary: `${businessName} scored ${totalScore}/100 and came through as ${archetype}. The useful opportunity is specific: help ${industry} buyers in ${city} understand the offer faster, trust the page sooner, compare it with less doubt, and take the next step from a phone.`,
    cta: `A paid competitor snapshot or 7-day fix plan would turn this quick read into screenshots, side-by-side competitor notes, and the first copy/page updates to make this easier to choose.`,
    premiumUpsell:
      tone === 'premium'
        ? `Soft next step: a paid competitor snapshot with screenshots, positioning notes, AI/search readiness gaps, and a calm 7-day fix plan for the highest-leverage pages.`
        : `Soft next step: a $297 competitor snapshot or 7-day fix plan with screenshots, competitor receipts, service-page copy fixes, and the first updates most likely to create easier customer decisions.`,
  }
}

function buildSnapshot(form: SnapshotForm, scores: Scores, totalScore: number) {
  const report = buildBusinessHoroscope(form, scores, totalScore)
  const businessName = valueOrFallback(form.businessName, 'Business name')
  const websiteUrl = valueOrFallback(form.websiteUrl, 'Website URL')
  const city = valueOrFallback(form.city, 'City')
  const industry = valueOrFallback(form.niche, 'Industry')
  const tone = toneLine[normalizeTone(form.tone)]
  const categoryScores = (Object.keys(scores) as ScoreKey[])
    .map((key) => `- ${scoreNames[key]}: ${scores[key]}/20`)
    .join('\n')

  return `Business Horoscope: ${businessName}
Website: ${websiteUrl}
Market: ${city} - ${industry}
Tone: ${tone}

1. Business Digital Zodiac archetype
${report.archetype}
${report.archetypeSummary}

2. Overall score
${totalScore}/100

3. Category scores
${categoryScores}

Score explanations
${formatList(report.scoreExplanations)}

4. 3 strengths
${formatList(report.strengths)}

5. 3 weaknesses
${formatList(report.weaknesses)}

6. Competitor comparison summary
${report.competitorSummary}

7. Biggest missed opportunity
${report.missedOpportunity}

8. 7-day fix plan
${formatList(report.fixPlan)}

9. Outreach-ready summary
${report.outreachSummary}

10. CTA section
${report.cta}

${report.premiumUpsell}`
}

function buildText(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = valueOrFallback(form.businessName, 'your business')
  const service = valueOrFallback(form.mainService, 'your main service')
  const message = `Hi, I made a quick Business Horoscope for ${businessName}: ${totalScore}/100, ${archetype}. The main fix is making ${service} easier to trust and request from a phone. Want me to send it over?`

  return message.length <= 280 ? message : `${message.slice(0, 276).trimEnd()}...`
}

function buildEmail(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = valueOrFallback(form.businessName, 'your business')
  const industry = valueOrFallback(form.niche, 'your industry')
  const city = valueOrFallback(form.city, 'your city')
  const service = valueOrFallback(form.mainService, 'your main service')

  return `Subject: Quick website read for ${businessName}

Hi ${businessName} team,

I made a quick Business Horoscope for your website. It scored ${totalScore}/100 and came through as ${archetype}.

The useful part is not generic SEO. I looked at whether ${industry} buyers in ${city} can quickly understand ${service}, trust the business, compare it with alternatives, and take the next step from a phone.

The biggest opportunity is making the proof, service fit, and call/request path easier to choose.

Want me to send the one-page version?`
}

function buildShareable(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = valueOrFallback(form.businessName, 'This business')
  const city = valueOrFallback(form.city, 'its market')
  const industry = valueOrFallback(form.niche, 'its industry')

  return `${businessName} scored ${totalScore}/100 in its Business Horoscope and came through as ${archetype}. The fastest win is making ${industry} buyers in ${city} understand the offer faster, trust it sooner, compare it more clearly, and contact the business from a phone without second-guessing the next step.`
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
