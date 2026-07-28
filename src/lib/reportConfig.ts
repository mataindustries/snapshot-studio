export type ReportConfiguration = {
  CONTACT_EMAIL: string
  CONSULTATION_URL: string
  BRAND_URL: string
}

export type ReportConfigurationSource = Partial<Record<
  | 'VITE_UPGRADEOS_CONTACT_EMAIL'
  | 'VITE_UPGRADEOS_CONSULTATION_URL'
  | 'VITE_UPGRADEOS_BRAND_URL',
  unknown
>>

function configuredString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizedHostname(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split('.')
  if (
    parts.length !== 4
    || parts.some((part) => !/^\d{1,3}$/.test(part))
  ) {
    return false
  }

  const octets = parts.map(Number)
  if (octets.some((part) => part < 0 || part > 255)) return true
  const [first, second] = octets
  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
}

function isDevelopmentHostname(hostname: string) {
  const normalized = normalizedHostname(hostname)
  if (
    normalized === 'localhost'
    || normalized === 'host.docker.internal'
    || normalized === '::1'
    || normalized === '0:0:0:0:0:0:0:1'
    || isPrivateIpv4(normalized)
  ) {
    return true
  }

  return [
    '.localhost',
    '.local',
    '.test',
    '.invalid',
    '.example',
    '.internal',
    '.lan',
  ].some((suffix) => normalized.endsWith(suffix))
}

function isSourceCodeHostname(hostname: string) {
  const normalized = normalizedHostname(hostname)
  return [
    'github.com',
    'github.io',
    'githubusercontent.com',
    'gitlab.com',
    'bitbucket.org',
    'npmjs.com',
    'npmjs.org',
    'unpkg.com',
  ].some((domain) => normalized === domain || normalized.endsWith(`.${domain}`))
}

export function isValidHttpUrl(value: string) {
  if (!value.trim()) return false

  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && Boolean(url.hostname)
      && !isDevelopmentHostname(url.hostname)
      && !isSourceCodeHostname(url.hostname)
  } catch {
    return false
  }
}

export function isValidContactEmail(value: string) {
  const trimmed = value.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  const match = trimmed.match(/^([^@]+)@([^@]+)$/)
  if (!match) return false
  const domain = normalizedHostname(match[2])
  return domain.includes('.') && !isDevelopmentHostname(domain)
}

export function resolveReportConfiguration(
  source: ReportConfigurationSource,
): ReportConfiguration {
  return {
    CONTACT_EMAIL: configuredString(source.VITE_UPGRADEOS_CONTACT_EMAIL),
    CONSULTATION_URL: configuredString(source.VITE_UPGRADEOS_CONSULTATION_URL),
    BRAND_URL: configuredString(source.VITE_UPGRADEOS_BRAND_URL),
  }
}

export function getRenderableReportConfiguration(
  configuration: ReportConfiguration,
): ReportConfiguration {
  return {
    CONTACT_EMAIL: isValidContactEmail(configuration.CONTACT_EMAIL)
      ? configuration.CONTACT_EMAIL
      : '',
    CONSULTATION_URL: isValidHttpUrl(configuration.CONSULTATION_URL)
      ? configuration.CONSULTATION_URL
      : '',
    BRAND_URL: isValidHttpUrl(configuration.BRAND_URL)
      ? configuration.BRAND_URL
      : '',
  }
}
