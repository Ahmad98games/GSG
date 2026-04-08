/**
 * Gold She Industrial Protocol v6.0
 * Standardized constants for QR-centric ecosystem routing.
 * Synchronized with PC-side src/lib/protocols.ts
 */
export const GS_PROTOCOL = {
  // Authentication Guard
  AUTH: 'GS-NODE-AUTH',
  
  // Batch Management
  BATCH: 'GS-BATCH',
  
  // Retail / Suit Identity 
  SUIT: 'GS-SUIT',

  // Handshake Protocol (Phase 7)
  LINK: 'GS-NODE-LINK',

  // Forensic Audit (Phase 8)
  JOB: 'GS-JOB',
};

export type GSProtocolType = 'AUTH' | 'BATCH' | 'SUIT' | 'LINK' | 'AUDIT' | 'UNKNOWN';

export const parseProtocol = (decodedText: string): { type: GSProtocolType; payload: string | null } => {
  if (!decodedText) return { type: 'UNKNOWN', payload: null };
  
  const [protocol, payload] = decodedText.split(':');
  
  if (protocol === GS_PROTOCOL.AUTH) return { type: 'AUTH', payload };
  if (protocol === GS_PROTOCOL.BATCH) return { type: 'BATCH', payload };
  if (protocol === GS_PROTOCOL.SUIT) return { type: 'SUIT', payload };
  if (protocol === GS_PROTOCOL.JOB) return { type: 'AUDIT', payload };
  if (protocol === GS_PROTOCOL.LINK || protocol === 'GS-BATCH-LINK') return { type: 'LINK', payload };
  
  return { type: 'UNKNOWN', payload: null };
};
