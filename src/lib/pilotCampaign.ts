export type PilotIndustry = 'hvac' | 'dental' | 'med-spa' | 'roofing' | 'tree-service' | 'general'
export type PilotCampaign = 'founding-client' | 'direct-outreach' | 'referral' | 'sample'

export type PilotSample = {
  industry: PilotIndustry
  label: string
  businessName: string
  category: string
  href: string
}

export type PilotContext = {
  campaign: PilotCampaign
  industry: PilotIndustry
  sample: PilotSample
}

export const pilotSamples: PilotSample[] = [
  {
    industry: 'hvac',
    label: 'Residential HVAC sample',
    businessName: 'Summit Comfort Heating & Air',
    category: 'Residential HVAC',
    href: '/sample-manuals/summit-comfort-heating-air-business-operating-manual.pdf',
  },
  {
    industry: 'dental',
    label: 'Dental sample',
    businessName: 'Arroyo Dental Arts',
    category: 'Family and restorative dentistry',
    href: '/sample-manuals/arroyo-dental-arts-business-operating-manual.pdf',
  },
  {
    industry: 'med-spa',
    label: 'Medical spa sample',
    businessName: 'Maison Luma Aesthetics',
    category: 'Medical spa',
    href: '/sample-manuals/maison-luma-aesthetics-business-operating-manual.pdf',
  },
  {
    industry: 'roofing',
    label: 'Residential roofing sample',
    businessName: 'Foothill Shield Roofing',
    category: 'Residential roofing',
    href: '/sample-manuals/foothill-shield-roofing-business-operating-manual.pdf',
  },
  {
    industry: 'tree-service',
    label: 'Tree service sample',
    businessName: 'Canopy & Stone Tree Care',
    category: 'Tree service',
    href: '/sample-manuals/canopy-stone-tree-care-business-operating-manual.pdf',
  },
  {
    industry: 'general',
    label: 'Business Operating Manual sample',
    businessName: 'Harbor & Pine Heating Co.',
    category: 'Residential HVAC',
    href: '/sample-operating-manual.pdf',
  },
]

const campaigns = new Set<PilotCampaign>([
  'founding-client',
  'direct-outreach',
  'referral',
  'sample',
])
const industries = new Set<PilotIndustry>([
  'hvac',
  'dental',
  'med-spa',
  'roofing',
  'tree-service',
  'general',
])

function normalizedCategory(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

export function matchPilotIndustry(category: string, service = ''): PilotIndustry {
  const source = normalizedCategory(`${category} ${service}`)
  if (/\bdental\b|\bdentist\b|\bdentistry\b|\borthodont|\boral\b/.test(source)) return 'dental'
  if (/med spa|medical spa|aesthetic|injectable/.test(source)) return 'med-spa'
  if (/roof/.test(source)) return 'roofing'
  if (/tree|arbor|landscap/.test(source)) return 'tree-service'
  if (/hvac|heating|air conditioning|furnace/.test(source)) return 'hvac'
  return 'general'
}

export function getPilotSample(industry: PilotIndustry) {
  return pilotSamples.find((sample) => sample.industry === industry)
    ?? pilotSamples[pilotSamples.length - 1]
}

export function getBestSampleManual(category: string, service = '') {
  return getPilotSample(matchPilotIndustry(category, service))
}

export function parsePilotContext(search: string): PilotContext {
  const params = new URLSearchParams(search)
  const rawCampaign = params.get('campaign') || ''
  const rawIndustry = params.get('industry') || ''
  const campaign = campaigns.has(rawCampaign as PilotCampaign)
    ? rawCampaign as PilotCampaign
    : 'founding-client'
  const industry = industries.has(rawIndustry as PilotIndustry)
    ? rawIndustry as PilotIndustry
    : 'general'
  return { campaign, industry, sample: getPilotSample(industry) }
}

export function addPilotQuery(urlValue: string, context: Pick<PilotContext, 'campaign' | 'industry'>) {
  try {
    const url = new URL(urlValue)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    url.searchParams.set('campaign', context.campaign)
    url.searchParams.set('industry', context.industry)
    return url.toString()
  } catch {
    return ''
  }
}
