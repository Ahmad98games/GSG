export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from === to) return 1
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`
    )
    const data = await res.json()
    return data.rates[to] || 1
  } catch {
    // Fallback to last stored rate
    return 1
  }
}
