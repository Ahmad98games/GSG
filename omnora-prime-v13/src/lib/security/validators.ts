export function isValidEmail(
  email: string
): boolean {
  if (!email || typeof email !== 'string')
    return false
  if (email.length > 254) return false
  // No special chars that indicate XSS
  if (/[<>'";&]/.test(email)) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (!local || !domain) return false
  if (local.length > 64) return false
  if (!domain.includes('.')) return false
  if (domain.length < 3) return false
  return true
}

export function isValidPhone(
  phone: string
): boolean {
  if (!phone || typeof phone !== 'string')
    return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 &&
    digits.length <= 15
}

export function isValidLicenseKeyFormat(
  key: string
): boolean {
  if (!key || typeof key !== 'string')
    return false
  if (key.length !== 14) return false
  const parts = key.split('-')
  if (parts.length !== 3) return false
  return parts.every(p =>
    p.length === 4 &&
    /^[A-Z0-9]+$/.test(p)
  )
}

export function sanitizeText(
  input: string,
  maxLength = 500
): string {
  if (!input || typeof input !== 'string')
    return ''
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim()
}

export function isValidAmount(
  amount: number
): boolean {
  return typeof amount === 'number' &&
    isFinite(amount) &&
    amount >= 0 &&
    amount <= 999_999_999
}
