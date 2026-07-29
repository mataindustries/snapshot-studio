import './pilot.css'
import { addPilotQuery, parsePilotContext, pilotSamples, type PilotIndustry } from './lib/pilotCampaign'
import { getRenderableReportConfiguration } from './lib/reportConfig'
import { recordRevenueEvent } from './lib/revenueEvents'
import { reportConfiguration } from './lib/runtimeReportConfig'

function requiredElement<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Missing pilot element: ${id}`)
  return element as T
}

const context = parsePilotContext(window.location.search)
const config = getRenderableReportConfiguration(reportConfiguration)
const industrySelect = requiredElement<HTMLSelectElement>('industrySelect')
const sampleBusiness = requiredElement<HTMLElement>('sampleBusiness')
const sampleCategory = requiredElement<HTMLElement>('sampleCategory')
const sampleView = requiredElement<HTMLAnchorElement>('sampleView')
const sampleDownload = requiredElement<HTMLAnchorElement>('sampleDownload')
const pilotCta = requiredElement<HTMLAnchorElement>('pilotCta')
const pilotCtaFallback = requiredElement<HTMLElement>('pilotCtaFallback')
const pilotBottomCta = requiredElement<HTMLElement>('pilotBottomCta')

pilotSamples
  .filter((sample) => sample.industry !== 'general')
  .forEach((sample) => {
    const option = document.createElement('option')
    option.value = sample.industry
    option.textContent = sample.category
    option.selected = sample.industry === context.industry
    industrySelect.append(option)
  })

if (context.industry === 'general') industrySelect.value = 'hvac'

sampleBusiness.textContent = context.sample.businessName
sampleCategory.textContent = context.sample.category
sampleView.href = context.sample.href
sampleDownload.href = context.sample.href

sampleView.addEventListener('click', () => {
  recordRevenueEvent({
    type: 'Sample viewed',
    campaign: context.campaign,
    industry: context.industry,
  })
})
sampleDownload.addEventListener('click', () => {
  recordRevenueEvent({
    type: 'Sample downloaded',
    campaign: context.campaign,
    industry: context.industry,
  })
})

industrySelect.addEventListener('change', () => {
  const params = new URLSearchParams()
  params.set('campaign', context.campaign)
  params.set('industry', industrySelect.value as PilotIndustry)
  window.location.assign(`/pilot/?${params.toString()}`)
})

const consultationUrl = config.CONSULTATION_URL
  ? addPilotQuery(config.CONSULTATION_URL, context)
  : ''
const emailHref = config.CONTACT_EMAIL
  ? `mailto:${config.CONTACT_EMAIL}?subject=${encodeURIComponent('$297 UpgradeOS founding-client pilot')}`
  : ''
const ctaHref = consultationUrl || emailHref

if (ctaHref) {
  pilotCta.href = ctaHref
  pilotCta.hidden = false
  if (consultationUrl) {
    pilotCta.target = '_blank'
    pilotCta.rel = 'noreferrer'
  }
  const bottomLink = pilotCta.cloneNode(true) as HTMLAnchorElement
  bottomLink.id = 'pilotBottomLink'
  bottomLink.textContent = 'Request the founding-client pilot'
  pilotBottomCta.append(bottomLink)
  ;[pilotCta, bottomLink].forEach((link) => link.addEventListener('click', () => {
    recordRevenueEvent({
      type: 'Pilot CTA clicked',
      campaign: context.campaign,
      industry: context.industry,
    })
  }))
} else {
  pilotCtaFallback.hidden = false
  const fallback = document.createElement('p')
  fallback.className = 'pilot-fallback'
  fallback.textContent = 'Reply to the person who shared this page and ask for the $297 founding-client pilot.'
  pilotBottomCta.append(fallback)
}
