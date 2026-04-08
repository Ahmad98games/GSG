/**
 * Gold She Industrial Protocol v6.0
 * Standardized constants for QR-centric ecosystem routing.
 */
export const GS_PROTOCOL = {
  // Authentication Guard
  AUTH: 'GS-NODE-AUTH',
  
  // Batch Management
  BATCH: 'GS-BATCH',
  
  // Retail / Suit Identity 
  SUIT: 'GS-SUIT',
};

export type GSProtocolType = keyof typeof GS_PROTOCOL;

export const parseProtocol = (decodedText: string) => {
  const [protocol, payload] = decodedText.split(':');
  
  if (protocol === GS_PROTOCOL.AUTH) return { type: 'AUTH', payload };
  if (protocol === GS_PROTOCOL.BATCH) return { type: 'BATCH', payload };
  if (protocol === GS_PROTOCOL.SUIT) return { type: 'SUIT', payload };
  
  return { type: 'UNKNOWN', payload: null };
};
