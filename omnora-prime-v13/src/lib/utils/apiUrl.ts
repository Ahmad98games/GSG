export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const base = window.location.origin
    // window.location.origin in Electron is
    // http://127.0.0.1:PORT — use it directly
    return `${base}${path}`
  }
  // Server-side rendering / Node.js fallback
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}${path}`
}
