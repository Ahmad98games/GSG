/**
 * Mock Protobuf Implementation for NSP Protocol
 * In production, this is compiled from shared.proto
 */

export const NSPProtobuf = {
  encode(type: string, payload: any): Buffer {
    // Simple JSON-to-Buffer for test simulation
    return Buffer.from(JSON.stringify({ __type: type, ...payload }));
  },

  decode(type: string, data: Buffer): any {
    try {
      const decoded = JSON.parse(data.toString());
      if (decoded.__type !== type) throw new Error('MISMATCH_TYPE');
      return decoded;
    } catch {
      throw new Error('DECODE_FAIL');
    }
  }
};

