/**
 * Noxis RSA-2048 License Key Generator (Omnora Labs internal tool)
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/generate-license.ts \
 *     --tier pro \
 *     --hwid <target_hwid> \
 *     --business-id <uuid> \
 *     --days 365 \
 *     --max-devices 10
 *
 * Output: NOXIS-PRO-<BASE64URL_PAYLOAD>-<BASE64URL_SIGNATURE>
 *
 * KEEP THIS FILE SECURE — the private key must never be committed to a public repo.
 * The private key is the matching key to the public key embedded in licenseVerifier.ts.
 */

import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'

// ── Embedded Private Key ──────────────────────────────────────────────────────
// Generated 2026-07-29 for Noxis Hub licensing.
// This script must NEVER be shipped with the application binary.
const NOXIS_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCR0zncdBztxIFn
9Z/zOGkcuiw5oWtQJPyVFSFW6QFznY1dPRtCZ9CsPVVbIQWeoyYqEi4Px0exKyvW
h0CYx9fm6yrI1osV2PfXOtfCwwAgswfikmaWhF8svPQKUrUKun52RHBIt63W3HcI
HKy+HkxDyEEpHXxUzY6e751e8Lh8J4lW8zETN9FdvOLdq+9307ZONqc/2cl6514v
jjpetyPrNtcMakGBQBi4XI0rj9mki46PaAjuE40X/sEV2spZFUOV/nyI7Hd1KEE8
zipSBInoNe5bp10LewPSFSPqw7vPBIuOO1xr7pckWWQX5UhE+Yf2dkDiDlt95NZa
L5Ge2o97AgMBAAECggEAQknaOiAgTGdxCfCKqtYgVho9Y19A+Jgvp5eI5ciay9M5
gUJ3Y0rs/XcOF5RdyRzSCvrjrHGC4gNFdMpb73ec6hBKDS0V4bMVCuZpUVQyeSrZ
MUIq105KM3yblRu+x6c6OIno3u18XTkv9OSQFAaS1ZcxI78PFz+wDwjOqWtU+b6R
hof+ofZZ94Hkne1snPrz5TGMGblNpxRWdmHNqzgDL/Z3C+ovz6x7dZZTVgPxcEt3
M32dnRYTvC0JG6BCGW7SYOzJmTU8/+PIjKYwlfSMhgA+BxFPbDxflPozOCdLW1UC
9fFlhsnx3E3iHn+Py1zZNfNi+4p5aQjF8yrFMYk86QKBgQDF0dwS/YU1GLWTVqTL
J5X7P0ApuV2QUZL9P+wGcGK+n07tcwHq9uHidaahVw4j0X/yNSduEeCaU9c+bYhU
yJsc3L8NeWJaM7Vf+dbi3sHffE+/dKRvZ2xKk2MMORI2syLFLCo4UFTUbFsjiqTq
Baq1eylCrq5amZ4wA8lY2+xJ2QKBgQC8tpyl3BTWl4gcYy5+TzAbg6Tmqul7EjkU
Ale7D5VO9YXdm9H5jmZh/6b7m7rfJF3WdYukk8DtuE1cP9ydzuxukoR4YUGuf6j4
LPCb3xfv2loco7Utq+41hNnrb9T0DYHDIG82ujUKRnbEIBaHxQO9X+EleuvRNFgw
NZOEVJebcwKBgFAhcScUIMhgSPT07O4KC/vpJCGCn77c/FCvevkkvyr+NyeCJa26
8ccc5zGFpQmnTE+dbmpsvXFmMtNr5QSK+iIX3SAlIkztkzPcbUoa96eCoH8qTY1+
9GPFDiMeXx1fNN9vw25qQ+KEPerIt4LAZuT6jb0gKyox/dzvO7lN5IoJAoGBAIX6
H7yhQyoW6ss8nwWNstnV3HznWlvF1EAgaaikp5wnM6LhvXEvaACrQCHhrgo+B2D6
kumE/LPI5SNZM4fWIIVgACx23+rDN3L6dNg0ywm+O7uZfkeuiK/2YcCE5Otfq4Cc
xlhUWtOwsyEKpvQ9KyqHp5C0dDdSskmHv/NzGy+BAoGAK/ipDZpRMGHzq1k6VdBk
zGdgu9IT2oyogy9axMmISM9zczC4si+NzCcacpbOQT0qa6CVilNa88rtm9gNAZC2
cUmM3g7R/6voB4HcaoCCsghrglujQDSrzjqeY432UfeLLbnWUQaSFIVM5a/6eb6s
hDdU60GuhSFG6dhp2FRcCvM=
-----END PRIVATE KEY-----`

// ── B64URL helpers ────────────────────────────────────────────────────────────

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Arg parser ────────────────────────────────────────────────────────────────

function getArg(flag: string, fallback = ''): string {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const tier        = getArg('--tier', 'pro') as 'lite' | 'pro' | 'elite'
  const hwid        = getArg('--hwid')
  const businessId  = getArg('--business-id', crypto.randomUUID())
  const days        = parseInt(getArg('--days', '365'), 10)
  const maxDevices  = parseInt(getArg('--max-devices', '10'), 10)
  const maxBranches = parseInt(getArg('--max-branches', '3'), 10)
  const maxCameras  = parseInt(getArg('--max-cameras', '4'), 10)
  const lifetime    = process.argv.includes('--lifetime')

  if (!hwid) {
    console.error('ERROR: --hwid is required.')
    console.error('Get it from the Settings page: electronAPI.license.getHWID()')
    process.exit(1)
  }

  const validTiers = ['lite', 'pro', 'elite']
  if (!validTiers.includes(tier)) {
    console.error(`ERROR: --tier must be one of: ${validTiers.join(', ')}`)
    process.exit(1)
  }

  const issuedAt  = Date.now()
  const expiresAt = lifetime ? 0 : issuedAt + days * 24 * 60 * 60 * 1000

  const TIER_FEATURES: Record<string, string[]> = {
    lite:  ['pos','inventory','invoices','recurring_invoices','parties','khata','cloud_sync','mobile_pairing','reports_basic','purchase_orders','audit_log'],
    pro:   ['pos','inventory','invoices','recurring_invoices','parties','khata','cloud_sync','mobile_pairing','mobile_multi_device','cctv','reports_basic','reports_advanced','branches','payroll','purchase_orders','audit_log'],
    elite: ['pos','inventory','invoices','recurring_invoices','parties','khata','cloud_sync','mobile_pairing','mobile_multi_device','cctv','cctv_multi_cam','foresight_ai','reports_basic','reports_advanced','branches','multi_branch','payroll','purchase_orders','audit_log','beta_updates'],
  }

  const payloadObj = {
    version: 2,
    tier,
    hwid,
    businessId,
    issuedAt,
    expiresAt,
    maxDevices,
    maxBranches,
    maxCameras,
    features: TIER_FEATURES[tier] || [],
  }

  const payloadJson = JSON.stringify(payloadObj)
  const payloadB64  = b64urlEncode(Buffer.from(payloadJson, 'utf8'))

  // Sign the BASE64URL payload string
  const signer = crypto.createSign('SHA256')
  signer.update(payloadB64, 'utf8')
  const sigBuf = signer.sign(NOXIS_PRIVATE_KEY)
  const sigB64 = b64urlEncode(sigBuf)

  const licenseKey = `NOXIS-${tier.toUpperCase()}.${payloadB64}.${sigB64}`

  console.log('\n+--------------------------------------+')
  console.log('|    NOXIS LICENSE KEY GENERATED       |')
  console.log('+--------------------------------------+\n')
  console.log(`Tier:        ${tier.toUpperCase()}`)
  console.log(`Business ID: ${businessId}`)
  console.log(`HWID:        ${hwid}`)
  console.log(`Issued:      ${new Date(issuedAt).toISOString()}`)
  console.log(`Expires:     ${expiresAt === 0 ? 'LIFETIME' : new Date(expiresAt).toISOString()}`)
  console.log(`Max Devices: ${maxDevices}`)
  console.log(`\nLICENSE KEY:\n`)
  console.log(licenseKey)
  console.log()

  const outPath = path.join(process.cwd(), `noxis-license-${tier}-${Date.now()}.txt`)
  fs.writeFileSync(outPath, `${licenseKey}\n`, 'utf8')
  console.log(`Saved to: ${outPath}`)
}

main()
