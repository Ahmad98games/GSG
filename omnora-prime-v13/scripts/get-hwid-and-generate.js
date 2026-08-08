const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

function wmicQuery(q) {
  try {
    const o = execSync(q, { timeout: 5000, windowsHide: true, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
    for (const line of o.split('\n')) {
      const t = line.trim();
      const eqIdx = t.indexOf('=');
      if (eqIdx !== -1) {
        const val = t.slice(eqIdx + 1).trim();
        if (val && val.toLowerCase() !== 'to be filled by o.e.m.' && val.toLowerCase() !== 'none' && val !== '0') return val;
      }
    }
  } catch {}
  try {
    let psCmd = '';
    if (q.includes('csproduct')) psCmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"';
    else if (q.includes('baseboard')) psCmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"';
    else if (q.includes('cpu')) psCmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).ProcessorId"';
    if (psCmd) {
      const val = execSync(psCmd, { timeout: 5000, windowsHide: true, encoding: 'utf8' }).trim();
      if (val) return val;
    }
  } catch {}
  return '';
}

function getPrimaryMAC() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    if (/loopback|virtual|vmware|vbox/i.test(name)) continue;
    for (const i of (ifaces[name] || [])) {
      if (!i.internal && i.mac && i.mac !== '00:00:00:00:00:00') return i.mac.toLowerCase();
    }
  }
  return '';
}

const uuid = wmicQuery('wmic csproduct get UUID /value');
const mb   = wmicQuery('wmic baseboard get SerialNumber /value');
const cpu  = wmicQuery('wmic cpu get ProcessorId /value');
const mac  = getPrimaryMAC();
const host = os.hostname();
const parts = [uuid, mb, cpu, mac, host].filter(Boolean);
if (parts.length < 2) parts.push(os.arch(), os.platform());
const hwid = crypto.createHash('sha256').update(parts.join('|')).digest('hex');

console.log('Components:');
console.log('  UUID:', uuid || '(empty)');
console.log('  Motherboard:', mb || '(empty)');
console.log('  CPU:', cpu || '(empty)');
console.log('  MAC:', mac || '(empty)');
console.log('  Hostname:', host);
console.log('');
console.log('HWID:', hwid);

// Now generate the license
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`;

function b64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const issuedAt = Date.now();
const expiresAt = issuedAt + 365 * 24 * 60 * 60 * 1000;

const payload = {
  version: 2,
  tier: 'elite',
  hwid,
  businessId: 'ahmad2384-business-id',
  email: 'ahmad2384@gmail.com',
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
};

const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
const signer = crypto.createSign('SHA256');
signer.update(payloadB64, 'utf8');
const sigB64 = b64urlEncode(signer.sign(PRIVATE_KEY));
const licenseKey = `NOXIS-ELITE.${payloadB64}.${sigB64}`;

console.log('');
console.log('════════════════════════════════════');
console.log('      NOXIS ELITE LICENSE KEY       ');
console.log('════════════════════════════════════');
console.log('Email:   ahmad2384@gmail.com');
console.log('Tier:    ELITE');
console.log('Expires:', new Date(expiresAt).toISOString().split('T')[0]);
console.log('');
console.log(licenseKey);
console.log('════════════════════════════════════');
