"use strict";
/**
 * Mock Protobuf Implementation for NSP Protocol
 * In production, this is compiled from shared.proto
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSPProtobuf = void 0;
exports.NSPProtobuf = {
    encode(type, payload) {
        // Simple JSON-to-Buffer for test simulation
        return Buffer.from(JSON.stringify({ __type: type, ...payload }));
    },
    decode(type, data) {
        try {
            const decoded = JSON.parse(data.toString());
            if (decoded.__type !== type)
                throw new Error('MISMATCH_TYPE');
            return decoded;
        }
        catch {
            throw new Error('DECODE_FAIL');
        }
    }
};
