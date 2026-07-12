import { randomBytes } from 'crypto'

// In-memory nonce store
const usedNonces = new Set<string>()
const nonceExpiry = new Map<string, number>()

// Clean up expired nonces every 5 minutes
const noncePrunerInterval = setInterval(() => {
  const now = Date.now()
  nonceExpiry.forEach((expiry, nonce) => {
    if (now > expiry) {
      usedNonces.delete(nonce)
      nonceExpiry.delete(nonce)
    }
  })
}, 5 * 60 * 1000)

if (noncePrunerInterval && typeof noncePrunerInterval.unref === 'function') {
  noncePrunerInterval.unref()
}

export function generateNonce(): string {
  return randomBytes(16).toString('hex')
}

export function consumeNonce(
  nonce: string
): boolean {
  if (!nonce || typeof nonce !== 'string' || nonce.length !== 32) {
    return false
  }

  if (usedNonces.has(nonce)) {
    // REPLAY DETECTED
    return false
  }

  usedNonces.add(nonce)
  // Nonce expires after 5 minutes
  nonceExpiry.set(
    nonce,
    Date.now() + 5 * 60 * 1000
  )
  return true
}
