import type { Lead, LeadPriority, LeadStatus } from '../types'

const leadStorageKey = 'snapshot-studio:leads'

export const leadPriorities: LeadPriority[] = ['High', 'Medium', 'Low']

export const leadStatuses: LeadStatus[] = [
  'Not reviewed',
  'Snapshot made',
  'Sent',
  'Replied',
  'Call booked',
  'Paid',
  'Not interested',
]

export type LeadInput = Omit<Lead, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: string
}

export type ParsedLead = LeadInput & {
  importId: string
  selected: boolean
}

export const emptyLeadInput: LeadInput = {
  businessName: '',
  websiteUrl: '',
  city: '',
  niche: '',
  mainService: '',
  phone: '',
  email: '',
  contactFormUrl: '',
  leadSource: '',
  priority: 'Medium',
  researchNotes: '',
  suggestedAngle: '',
  status: 'Not reviewed',
  lastContactedAt: '',
}

function safelyParseLeads(value: string | null): Lead[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(normalizeStoredLead) : []
  } catch {
    return []
  }
}

function normalizeStoredLead(value: Partial<Lead>): Lead {
  return {
    id: value.id || crypto.randomUUID(),
    createdAt: value.createdAt || new Date().toISOString(),
    businessName: value.businessName || '',
    websiteUrl: value.websiteUrl || '',
    city: value.city || '',
    niche: value.niche || '',
    mainService: value.mainService || '',
    phone: value.phone || '',
    email: value.email || '',
    contactFormUrl: value.contactFormUrl || '',
    leadSource: value.leadSource || '',
    priority: normalizePriority(value.priority),
    researchNotes: value.researchNotes || '',
    suggestedAngle: value.suggestedAngle || '',
    status: normalizeStatus(value.status),
    lastContactedAt: value.lastContactedAt || '',
    linkedSnapshotId: value.linkedSnapshotId,
  }
}

export function createLead(input: LeadInput): Lead {
  return normalizeStoredLead({
    ...input,
    id: input.id || crypto.randomUUID(),
    createdAt: input.createdAt || new Date().toISOString(),
  })
}

export function loadLeads(): Lead[] {
  return safelyParseLeads(localStorage.getItem(leadStorageKey))
}

export function persistLeads(leads: Lead[]) {
  localStorage.setItem(leadStorageKey, JSON.stringify(leads))
  return leads
}

export function saveLead(lead: Lead): Lead[] {
  const leads = loadLeads()
  const nextLeads = [lead, ...leads.filter((saved) => saved.id !== lead.id)]
  return persistLeads(nextLeads)
}

export function deleteLead(leadId: string): Lead[] {
  return persistLeads(loadLeads().filter((lead) => lead.id !== leadId))
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizePriority(value: unknown): LeadPriority {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized.startsWith('h')) return 'High'
  if (normalized.startsWith('l')) return 'Low'
  return 'Medium'
}

function normalizeStatus(value: unknown): LeadStatus {
  const normalized = String(value || '').trim().toLowerCase()
  const match = leadStatuses.find((status) => status.toLowerCase() === normalized)
  return match || 'Not reviewed'
}

function splitCsvLine(line: string, delimiter: ',' | '\t') {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell.trim())
  return cells
}

function parseDelimitedRows(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const delimiter: ',' | '\t' = lines[0]?.includes('\t') ? '\t' : ','
  return lines.map((line) => splitCsvLine(line, delimiter))
}

function parseMarkdownRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('|'))
    .map((line) => line.replace(/^\|/, '').replace(/\|$/, ''))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell)))
}

function mapHeader(header: string): keyof LeadInput | null {
  const key = normalizeKey(header)
  const map: Record<string, keyof LeadInput> = {
    business: 'businessName',
    businessname: 'businessName',
    company: 'businessName',
    name: 'businessName',
    website: 'websiteUrl',
    websiteurl: 'websiteUrl',
    url: 'websiteUrl',
    site: 'websiteUrl',
    city: 'city',
    market: 'city',
    location: 'city',
    niche: 'niche',
    category: 'niche',
    industry: 'niche',
    service: 'mainService',
    mainservice: 'mainService',
    primaryservice: 'mainService',
    phone: 'phone',
    email: 'email',
    contactform: 'contactFormUrl',
    contactformurl: 'contactFormUrl',
    form: 'contactFormUrl',
    source: 'leadSource',
    leadsource: 'leadSource',
    notes: 'researchNotes',
    researchnotes: 'researchNotes',
    research: 'researchNotes',
    angle: 'suggestedAngle',
    suggestedangle: 'suggestedAngle',
    priority: 'priority',
    status: 'status',
    lastcontacted: 'lastContactedAt',
    lastcontactedat: 'lastContactedAt',
  }

  return map[key] || null
}

export function parseLeadTable(text: string): ParsedLead[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const rows = trimmed.includes('|') ? parseMarkdownRows(trimmed) : parseDelimitedRows(trimmed)
  if (rows.length < 2) return []

  const headers = rows[0].map(mapHeader)
  return rows
    .slice(1)
    .map((row, index) => {
      const nextLead: LeadInput = { ...emptyLeadInput }

      row.forEach((cell, cellIndex) => {
        const mappedKey = headers[cellIndex]
        if (!mappedKey) return

        if (mappedKey === 'priority') {
          nextLead.priority = normalizePriority(cell)
        } else if (mappedKey === 'status') {
          nextLead.status = normalizeStatus(cell)
        } else {
          nextLead[mappedKey] = cell
        }
      })

      return {
        ...nextLead,
        importId: `${Date.now()}-${index}`,
        selected: Boolean(nextLead.businessName || nextLead.websiteUrl),
      }
    })
    .filter((lead) => lead.businessName || lead.websiteUrl)
}

function csvEscape(value: string | undefined) {
  const normalized = value || ''
  if (!/[",\n\r]/.test(normalized)) return normalized
  return `"${normalized.replace(/"/g, '""')}"`
}

export function leadsToCsv(leads: Lead[]) {
  const headers = [
    'Business Name',
    'Website URL',
    'City',
    'Niche',
    'Main Service',
    'Phone',
    'Email',
    'Contact Form URL',
    'Lead Source',
    'Priority',
    'Research Notes',
    'Suggested Angle',
    'Status',
    'Last Contacted At',
    'Linked Snapshot ID',
    'Created At',
  ]

  const rows = leads.map((lead) => [
    lead.businessName,
    lead.websiteUrl,
    lead.city,
    lead.niche,
    lead.mainService,
    lead.phone,
    lead.email,
    lead.contactFormUrl,
    lead.leadSource,
    lead.priority,
    lead.researchNotes,
    lead.suggestedAngle,
    lead.status,
    lead.lastContactedAt,
    lead.linkedSnapshotId || '',
    lead.createdAt,
  ])

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}
