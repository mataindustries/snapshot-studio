import { resolveReportConfiguration } from './reportConfig'

export const reportConfiguration = resolveReportConfiguration({
  VITE_UPGRADEOS_CONTACT_EMAIL: import.meta.env.VITE_UPGRADEOS_CONTACT_EMAIL,
  VITE_UPGRADEOS_CONSULTATION_URL: import.meta.env.VITE_UPGRADEOS_CONSULTATION_URL,
  VITE_UPGRADEOS_BRAND_URL: import.meta.env.VITE_UPGRADEOS_BRAND_URL,
})
