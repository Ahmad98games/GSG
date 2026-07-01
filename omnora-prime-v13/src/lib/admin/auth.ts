const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'fallback_secret_for_noxis_admin_panel'

function toBase64Url(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return decodeURIComponent(escape(atob(base64)))
}

async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  )
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateToken(ip: string): Promise<string> {
  const nonceArray = new Uint8Array(16)
  crypto.getRandomValues(nonceArray)
  const nonce = Array.from(nonceArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const payload = JSON.stringify({
    ip,
    issued: Date.now(),
    expires: Date.now() + 8 * 60 * 60 * 1000,
    nonce,
  })

  const signature = await sign(payload, TOKEN_SECRET)
  return toBase64Url(JSON.stringify({ payload, signature }))
}

export async function verifyToken(
  token: string,
  ip: string
): Promise<boolean> {
  try {
    const decoded = fromBase64Url(token)
    const { payload, signature } = JSON.parse(decoded)
    const expected = await sign(payload, TOKEN_SECRET)
    if (expected !== signature) return false

    const data = JSON.parse(payload)
    if (Date.now() > data.expires) return false

    return true
  } catch {
    return false
  }
}
