import * as crypto from 'crypto'
import * as os from 'os'

/**
 * Derives a consistent 256-bit encryption key for the local SQLite database.
 * The key is hardware-locked to the machine and user-specific.
 */
export function deriveDbKey(userId: string): string {
  // Machine fingerprint using hostname and CPU model
  const machineId = [
    os.hostname(),
    os.cpus()[0]?.model || '',
    process.env.COMPUTERNAME || '',
  ].join('|')
  
  // Create SHA256 hash of the combined identifiers
  return crypto.createHash('sha256')
    .update(userId + '|' + machineId)
    .digest('hex')
    .slice(0, 64) // 32 bytes = 256 bit key in hex representation
}
