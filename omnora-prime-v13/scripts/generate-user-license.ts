import * as crypto from 'crypto'

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

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generateLicenseKey(email: string, tier: 'elite' | 'pro' | 'lite') {
  const issuedAt = Date.now()
  const expiresAt = issuedAt + 365 * 24 * 60 * 60 * 1000 // 1 full year from now

  const payloadObj = {
    version: 2,
    tier,
    hwid: 'AHMAD-PC-FACTORY',
    businessId: 'ahmad2384-business-id',
    email,
    issuedAt,
    expiresAt,
    maxDevices: 50,
    maxBranches: 10,
    maxCameras: 20,
    features: [
      'pos', 'inventory', 'invoices', 'recurring_invoices', 'parties', 'khata',
      'cloud_sync', 'mobile_pairing', 'mobile_multi_device', 'cctv', 'cctv_multi_cam',
      'foresight_ai', 'reports_basic', 'reports_advanced', 'branches', 'multi_branch',
      'payroll', 'purchase_orders', 'audit_log', 'beta_updates'
    ]
  }

  const payloadJson = JSON.stringify(payloadObj)
  const payloadB64 = b64urlEncode(Buffer.from(payloadJson, 'utf8'))

  const signer = crypto.createSign('SHA256')
  signer.update(payloadB64, 'utf8')
  const sigBuf = signer.sign(NOXIS_PRIVATE_KEY)
  const sigB64 = b64urlEncode(sigBuf)

  return `NOXIS-${tier.toUpperCase()}.${payloadB64}.${sigB64}`
}

console.log('--- NOXIS FRESH LICENSE KEY ---')
console.log('User Email: ahmad2384@gmail.com')
console.log('Tier: ELITE (1 Year Full Access)')
console.log('Key:', generateLicenseKey('ahmad2384@gmail.com', 'elite'))
