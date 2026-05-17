/**
 * Noxis v13.0 — Security Utilities
 * In-memory sliding window rate limiter.
 */

const rateLimitMap = new Map<string, number[]>();

// Cleanup interval: Every 5 minutes, purge expired entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    // Keep only timestamps from the last 10 minutes to be safe
    const validTimestamps = timestamps.filter(t => now - t < 600_000);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validTimestamps);
    }
  }
}, 300_000);

/**
 * checkRateLimit
 * @returns true if allowed, false if rate limited.
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];

  // Filter timestamps within the sliding window
  timestamps = timestamps.filter(t => now - t < windowMs);

  if (timestamps.length >= limit) {
    return false;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

