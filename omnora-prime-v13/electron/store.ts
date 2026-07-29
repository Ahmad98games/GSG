import ElectronStore from 'electron-store'
import * as crypto from 'crypto'
import * as os from 'os'

// Generate a machine-specific encryption key
// This means the store is tied to this PC
// Even if someone copies the store file,
// they cannot read it on another machine
function getMachineKey(): string {
  const machineId = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model || '',
    process.env.USERNAME || process.env.USER || '',
  ].join('|')

  return crypto
    .createHash('sha256')
    .update(machineId)
    .digest('hex')
    .slice(0, 32)
}

// Schema defines all persisted values
interface StoreSchema {
  // Auth
  supabaseAccessToken: string
  supabaseRefreshToken: string
  supabaseTokenExpiry: number
  userEmail: string
  userId: string
  businessId: string

  // App lock
  appLockEnabled: boolean
  appLockPin: string // SHA-256 hashed
  appLockTimeout: number // minutes

  // Session resume
  lastRoute: string
  lastScrollPositions: Record<string, number>
  lastFormDrafts: Record<string, any>
  lastActiveAt: number

  // Setup
  setupComplete: boolean
  onboardingStep: number

  // Preferences
  sidebarCollapsed: boolean
  theme: string
  autoStartConfigured: boolean
  lastSyncAt: number
  autoStartEnabled: boolean

  // HWID fingerprinting
  hwid_cached: string
  hwid_mismatch_count: number

  // Trial engine
  trial_ntp_start: number        // UTC ms from Cloudflare NTP on first run
  trial_elapsed_ms: number       // monotonic accumulated runtime ms
  trial_mono_checkpoint: number  // hrtime snapshot saved at last checkpoint

  // License
  license_payload: string        // JSON-stringified LicensePayload, encrypted by store

  // Power-cut recovery
  exit_flag: string              // 'running' | 'clean'
}

const store: any = new (ElectronStore as any)({
  projectName: 'noxis-hub',
  name: 'noxis-secure',
  encryptionKey: getMachineKey(),
  clearInvalidConfig: true,
  defaults: {
    supabaseAccessToken: '',
    supabaseRefreshToken: '',
    supabaseTokenExpiry: 0,
    userEmail: '',
    userId: '',
    businessId: '',
    appLockEnabled: false,
    appLockPin: '',
    appLockTimeout: 5,
    lastRoute: '/dashboard',
    lastScrollPositions: {},
    lastFormDrafts: {},
    lastActiveAt: 0,
    setupComplete: false,
    onboardingStep: 0,
    sidebarCollapsed: false,
    theme: 'dark',
    autoStartConfigured: false,
    lastSyncAt: 0,
    autoStartEnabled: true,
    // HWID
    hwid_cached: '',
    hwid_mismatch_count: 0,
    // Trial
    trial_ntp_start: 0,
    trial_elapsed_ms: 0,
    trial_mono_checkpoint: 0,
    // License
    license_payload: '',
    // Power-cut
    exit_flag: 'clean',
  },
})

export default store

// ── TYPED HELPERS ──

export function saveSession(session: {
  accessToken: string
  refreshToken: string
  expiresAt: number
  email: string
  userId: string
}) {
  store.set('supabaseAccessToken', session.accessToken)
  store.set('supabaseRefreshToken', session.refreshToken)
  store.set('supabaseTokenExpiry', session.expiresAt)
  store.set('userEmail', session.email)
  store.set('userId', session.userId)
}

export function clearSession() {
  store.delete('supabaseAccessToken')
  store.delete('supabaseRefreshToken')
  store.delete('supabaseTokenExpiry')
  store.delete('userEmail')
  store.delete('userId')
}

export function getSession() {
  const token = store.get('supabaseAccessToken')
  const refresh = store.get('supabaseRefreshToken')
  const expiry = store.get('supabaseTokenExpiry')
  const email = store.get('userEmail')
  const userId = store.get('userId')

  if (!token || !refresh) return null

  return {
    accessToken: token,
    refreshToken: refresh,
    expiresAt: expiry,
    email,
    userId,
    isExpired: Date.now() / 1000 > expiry,
  }
}

export function savePinHash(pinHash: string) {
  store.set('appLockPin', pinHash)
}

export function getPinHash(): string {
  return store.get('appLockPin') || ''
}

export function isAppLockEnabled(): boolean {
  return store.get('appLockEnabled') || false
}

export function setAppLockEnabled(enabled: boolean) {
  store.set('appLockEnabled', enabled)
}

export function getLockTimeout(): number {
  return store.get('appLockTimeout') || 5
}

export function setLockTimeout(minutes: number) {
  store.set('appLockTimeout', minutes)
}

export function saveLastRoute(route: string) {
  if (
    route.includes('/login') ||
    route.includes('/setup') ||
    route.includes('/lock')
  ) return
  store.set('lastRoute', route)
}

export function getLastRoute(): string {
  return store.get('lastRoute') || '/dashboard'
}

export function saveLastActive() {
  store.set('lastActiveAt', Date.now())
}

export function getLastActive(): number {
  return store.get('lastActiveAt') || 0
}

export function saveFormDraft(key: string, data: any) {
  const drafts = store.get('lastFormDrafts') || {}
  drafts[key] = { data, savedAt: Date.now() }
  store.set('lastFormDrafts', drafts)
}

export function getFormDraft(key: string): any | null {
  const drafts = store.get('lastFormDrafts') || {}
  const draft = drafts[key]
  if (!draft) return null
  // Drafts expire after 24 hours
  if (Date.now() - draft.savedAt > 86400000) {
    return null
  }
  return draft.data
}

export function clearFormDraft(key: string) {
  const drafts = store.get('lastFormDrafts') || {}
  delete drafts[key]
  store.set('lastFormDrafts', drafts)
}

export function saveScrollPosition(route: string, position: number) {
  const positions = store.get('lastScrollPositions') || {}
  positions[route] = position
  store.set('lastScrollPositions', positions)
}

export function getScrollPosition(route: string): number {
  const positions = store.get('lastScrollPositions') || {}
  return positions[route] || 0
}

export function getLastSyncAt(): number {
  return store.get('lastSyncAt') || 0
}

export function setLastSyncAt(ts: number): void {
  store.set('lastSyncAt', ts)
}

export function getAutoStartEnabled(): boolean {
  return store.get('autoStartEnabled') ?? true
}

export function setAutoStartEnabled(enabled: boolean): void {
  store.set('autoStartEnabled', enabled)
}

// ── HWID ──

export function getCachedHWID(): string {
  return store.get('hwid_cached') || ''
}

export function setCachedHWID(hwid: string): void {
  store.set('hwid_cached', hwid)
}

export function getHWIDMismatchCount(): number {
  return store.get('hwid_mismatch_count') || 0
}

export function incrementHWIDMismatch(): number {
  const n = getHWIDMismatchCount() + 1
  store.set('hwid_mismatch_count', n)
  return n
}

export function resetHWIDMismatch(): void {
  store.set('hwid_mismatch_count', 0)
}

// ── TRIAL ENGINE ──

export function getTrialNtpStart(): number {
  return store.get('trial_ntp_start') || 0
}

export function setTrialNtpStart(ts: number): void {
  store.set('trial_ntp_start', ts)
}

export function getTrialElapsedMs(): number {
  return store.get('trial_elapsed_ms') || 0
}

export function setTrialElapsedMs(ms: number): void {
  store.set('trial_elapsed_ms', ms)
}

export function getTrialMonoCheckpoint(): number {
  return store.get('trial_mono_checkpoint') || 0
}

export function setTrialMonoCheckpoint(ts: number): void {
  store.set('trial_mono_checkpoint', ts)
}

// ── LICENSE PAYLOAD ──

export function getLicensePayload(): string {
  return store.get('license_payload') || ''
}

export function setLicensePayload(json: string): void {
  store.set('license_payload', json)
}

export function clearLicensePayload(): void {
  store.set('license_payload', '')
}

// ── EXIT FLAG (power-cut detection) ──

export function getExitFlag(): string {
  return store.get('exit_flag') || 'clean'
}

export function setExitFlag(flag: 'running' | 'clean'): void {
  store.set('exit_flag', flag)
}
