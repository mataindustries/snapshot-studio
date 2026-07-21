const processNotePatterns = [
  /\bentered manually\b/i,
  /\bmanually entered\b/i,
  /\bguided review\b/i,
  /\boperator[- ]entered\b/i,
  /\boperator[- ]supplied\b/i,
  /\bsupplied (?:information|material|website|page|content|details?)\b/i,
  /\bentered (?:for|during) (?:the )?review\b/i,
  /\bintake (?:identifies|records|supplies|includes)\b/i,
  /\bsupplied during review\b/i,
  /\bassessment record\b/i,
  /\bdemo process\b/i,
  /\breview workflow\b/i,
  /\bintake process\b/i,
] as const

export function isClientFacingStrength(value: string) {
  const candidate = value.trim()
  return Boolean(candidate)
    && !processNotePatterns.some((pattern) => pattern.test(candidate))
}

export function filterClientFacingStrengths(values: readonly string[]) {
  return values
    .map((value) => value.trim())
    .filter(isClientFacingStrength)
}
