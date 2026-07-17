import type {
  EvidenceSentiment,
  WebsiteExtractionObservation,
  WebsiteExtractionResult,
  WebsiteObservationKind,
} from '../types'
import { createStableId } from './evidence'

export type NormalizedWebsiteUrl = {
  raw: string
  normalized: string
  changed: boolean
  valid: boolean
  removedTrackingParameters: string[]
  warning?: string
}

export type IntakeParserContext = {
  serviceTerms?: string[]
  locationTerms?: string[]
}

export const knownTrackingParameters = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
] as const

const trackingParameterSet = new Set<string>(knownTrackingParameters)

function cleanSnippet(value: string) {
  return value
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[•*–—-]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[|•]+$/, '')
    .trim()
}

function unique(values: string[], limit = 12) {
  const seen = new Set<string>()
  const output: string[] = []

  values.forEach((value) => {
    const cleaned = cleanSnippet(value)
    const key = cleaned.toLocaleLowerCase()
    if (!cleaned || seen.has(key) || output.length >= limit) return
    seen.add(key)
    output.push(cleaned)
  })

  return output
}

function plainText(value: string) {
  return value
    .replace(/<\/(?:h[1-6]|p|div|li|section|article|header|footer|nav)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function isLikelyHeading(line: string) {
  const cleaned = cleanSnippet(line)
  if (cleaned.length < 3 || cleaned.length > 100) return false
  if (cleaned.endsWith('?')) return true
  if (/[.!]$/.test(cleaned) || cleaned.split(/\s+/).length > 12) return false
  if (/^#{1,6}\s/.test(line.trim())) return true

  const words = cleaned.split(/\s+/)
  const titleWords = words.filter((word) => /^[A-Z0-9][A-Za-z0-9&'/-]*$/.test(word))
  const upperLetters = cleaned.replace(/[^A-Z]/g, '').length
  const allLetters = cleaned.replace(/[^A-Za-z]/g, '').length
  return titleWords.length >= Math.ceil(words.length * 0.55)
    || (allLetters >= 3 && upperLetters / allLetters >= 0.7)
}

function includesTerm(value: string, terms: string[]) {
  const normalized = value.toLocaleLowerCase()
  return terms.some((term) => {
    const needle = term.trim().toLocaleLowerCase()
    return needle.length >= 2 && normalized.includes(needle)
  })
}

function observationSentiment(kind: WebsiteObservationKind): EvidenceSentiment {
  return kind === 'Trust phrase' ? 'Strength' : 'Neutral'
}

function buildObservations(
  groups: Array<[WebsiteObservationKind, string[]]>,
): WebsiteExtractionObservation[] {
  return groups.flatMap(([kind, values]) =>
    values.map((text) => ({
      id: createStableId('intake-observation', [kind, text.toLocaleLowerCase()]),
      kind,
      text,
      sourceField: 'pageText' as const,
      suggestedSentiment: observationSentiment(kind),
    })),
  )
}

export function normalizeWebsiteUrl(rawValue: string): NormalizedWebsiteUrl {
  const raw = rawValue
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return {
      raw,
      normalized: '',
      changed: raw !== '',
      valid: false,
      removedTrackingParameters: [],
    }
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : 'https://' + trimmed.replace(/^\/\//, '')

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        raw,
        normalized: trimmed,
        changed: trimmed !== raw,
        valid: false,
        removedTrackingParameters: [],
        warning: 'Use an http or https website URL.',
      }
    }

    const removedTrackingParameters: string[] = []
    Array.from(url.searchParams.keys()).forEach((parameter) => {
      if (!trackingParameterSet.has(parameter.toLocaleLowerCase())) return
      removedTrackingParameters.push(parameter)
      url.searchParams.delete(parameter)
    })

    url.hostname = url.hostname.toLocaleLowerCase()
    let normalized = url.toString()
    if (url.pathname === '/' && !url.search && !url.hash) {
      normalized = normalized.replace(/\/$/, '')
    }

    return {
      raw,
      normalized,
      changed: normalized !== raw,
      valid: true,
      removedTrackingParameters,
    }
  } catch {
    return {
      raw,
      normalized: trimmed,
      changed: trimmed !== raw,
      valid: false,
      removedTrackingParameters: [],
      warning: 'This URL could not be normalized. Review it before applying.',
    }
  }
}

export function parseWebsiteText(
  value: string,
  context: IntakeParserContext = {},
): WebsiteExtractionResult {
  const htmlHeadings = Array.from(
    value.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    (match) => cleanSnippet(plainText(match[1])),
  )
  const text = plainText(value)
  const lines = text
    .split(/\r?\n/)
    .map(cleanSnippet)
    .filter((line) => line.length >= 2 && line.length <= 240)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(cleanSnippet)
    .filter((sentence) => sentence.length >= 4 && sentence.length <= 180)
  const snippets = unique([...lines, ...sentences], 120)
  const serviceTerms = (context.serviceTerms ?? []).filter(Boolean)
  const locationTerms = (context.locationTerms ?? []).filter(Boolean)

  const headings = unique([
    ...htmlHeadings,
    ...lines.filter((line) => isLikelyHeading(line)),
  ])
  const questionHeadings = unique(
    snippets.filter((line) =>
      line.endsWith('?')
      || /^(?:who|what|when|where|why|how|do|does|can|is|are|will|should)\b/i.test(line),
    ),
  )
  const callsToAction = unique(
    snippets.filter((line) =>
      line.length <= 110
      && /\b(?:call|contact|book|schedule|request|start|get (?:a |your )?(?:quote|estimate|consultation)|learn more|see services|check availability|send (?:a )?message|visit us|apply now)\b/i.test(line),
    ),
  )
  const servicePhrases = unique(
    snippets.filter((line) =>
      includesTerm(line, serviceTerms)
      || /\b(?:services?|repair|installation|replacement|maintenance|consultation|treatment|care|solutions?|remodeling|cleaning|inspection|design|coaching|therapy|landscaping|roofing|plumbing|electrical|dental|legal|accounting)\b/i.test(line),
    ),
  )
  const locationPhrases = unique(
    snippets.filter((line) =>
      includesTerm(line, locationTerms)
      || /\b(?:serving|service areas?|located in|locally owned|nearby|local|visit us|directions)\b/i.test(line)
      || /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(line),
    ),
  )
  const trustPhrases = unique(
    snippets.filter((line) =>
      /\b(?:reviews?|rated|stars?|testimonial|licensed|insured|certified|accredited|award(?:-winning)?|years? (?:of )?experience|family[- ]owned|locally owned|guarantee|warranty|financing|trusted|credential|before and after|satisfaction)\b/i.test(line),
    ),
  )

  const contactMatches = [
    ...Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi), (match) => match[0]),
    ...Array.from(text.matchAll(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g), (match) => match[0]),
    ...Array.from(text.matchAll(/https?:\/\/[^\s)\]}>,]+/gi), (match) => match[0]),
    ...lines.filter((line) =>
      /\b\d{1,6}\s+[A-Za-z0-9.' -]+\s(?:street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln|way|court|ct)\b/i.test(line),
    ),
  ]
  const contactDetails = unique(contactMatches)
  const observations = buildObservations([
    ['Heading', headings],
    ['Call to action', callsToAction],
    ['Service phrase', servicePhrases],
    ['Location phrase', locationPhrases],
    ['Trust phrase', trustPhrases],
    ['Question heading', questionHeadings],
    ['Contact detail', contactDetails],
  ])

  return {
    disclosure: 'Draft extraction — review required.',
    sourceLabel: 'Operator-pasted page text',
    headings,
    callsToAction,
    servicePhrases,
    locationPhrases,
    trustPhrases,
    questionHeadings,
    contactDetails,
    observations,
  }
}
