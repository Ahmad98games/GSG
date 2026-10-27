/**
 * ============================================================================
 * Noxis Hub — Autonomous LAN Peer Recovery & Mesh Discovery Engine
 * Target File: src/main/network/MeshAutoDiscovery.ts
 * ============================================================================
 * Solves dynamic DHCP router IP re-assignments on shopfloor networks without
 * requiring cashier/staff to manually look up or configure changed IP addresses.
 */

import * as dgram from 'dgram';
import * as os from 'os';
import { EventEmitter } from 'events';

export const BEACON_PORT = 7448;
export const DEFAULT_HUB_SERVICE_PORT = 7447;
export const BEACON_INTERVAL_MS = 5000;
export const BEACON_MAGIC = 'noxis-hub';

export interface HubBeaconPayload {
  service: string;
  port: number;
  host: string;
  version: string;
  businessId?: string;
  businessName?: string;
  timestamp: number;
}

export interface HubBeaconOptions {
  servicePort?: number;
  version?: string;
  businessId?: string;
  businessName?: string;
  broadcastIntervalMs?: number;
}

/**
 * ============================================================================
 * 1. HUB BEACON BROADCASTER (Runs on the PC Hub)
 * ============================================================================
 * Periodically broadcasts the Hub's active IP across the local subnet.
 */
export class HubBeaconBroadcaster extends EventEmitter {
  private socket: dgram.Socket | null = null;
  private timer: NodeJS.Timeout | null = null;
  private readonly servicePort: number;
  private readonly version: string;
  private readonly businessId?: string;
  private readonly businessName?: string;
  private readonly intervalMs: number;

  constructor(options?: HubBeaconOptions) {
    super();
    this.servicePort = options?.servicePort ?? DEFAULT_HUB_SERVICE_PORT;
    this.version = options?.version ?? '15.0.1';
    this.businessId = options?.businessId;
    this.businessName = options?.businessName;
    this.intervalMs = options?.broadcastIntervalMs ?? BEACON_INTERVAL_MS;
  }

  public start(): void {
    if (this.socket) return;

    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.on('error', (err) => {
      console.warn('[HubBeaconBroadcaster] Socket error:', err.message);
      this.closeSocket();
    });

    this.socket.bind(() => {
      try {
        this.socket?.setBroadcast(true);
        console.log(`[HubBeaconBroadcaster] Broadcast beacon active on UDP :${BEACON_PORT}`);
        this.broadcastPulse();
      } catch (err: any) {
        console.error('[HubBeaconBroadcaster] Failed to enable broadcast mode:', err.message);
      }
    });

    this.timer = setInterval(() => {
      this.broadcastPulse();
    }, this.intervalMs);
  }

  /**
   * Dispatches the discovery beacon with current real-time IPv4 address.
   */
  private broadcastPulse(): void {
    if (!this.socket) return;

    const currentIp = this.getPrimaryLocalIPv4();
    if (!currentIp) {
      console.warn('[HubBeaconBroadcaster] No active LAN IPv4 interface found for broadcast.');
      return;
    }

    const payload: HubBeaconPayload = {
      service: BEACON_MAGIC,
      port: this.servicePort,
      host: currentIp,
      version: this.version,
      businessId: this.businessId,
      businessName: this.businessName,
      timestamp: Date.now(),
    };

    const message = Buffer.from(JSON.stringify(payload));

    // Broadcast to global subnet
    this.socket.send(message, 0, message.length, BEACON_PORT, '255.255.255.255', (err) => {
      if (err) {
        console.warn('[HubBeaconBroadcaster] UDP broadcast send error:', err.message);
      }
    });
  }

  /**
   * Resolves the machine's primary non-internal IPv4 address.
   */
  public getPrimaryLocalIPv4(): string | null {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;

      for (const alias of iface) {
        // Skip loopback, virtual interfaces, and non-IPv4
        if (alias.family === 'IPv4' && !alias.internal) {
          if (!name.toLowerCase().includes('virtual') && !name.toLowerCase().includes('vethernet')) {
            return alias.address;
          }
        }
      }
    }

    // Fallback: pick any external IPv4 if specific filtered one not found
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }

    return null;
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.closeSocket();
  }

  private closeSocket(): void {
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = null;
    }
  }
}

/**
 * ============================================================================
 * 2. MOBILE / TERMINAL DISCOVERY CLIENT (Runs on Mobile & Workstations)
 * ============================================================================
 * Listens for Hub UDP broadcast packets when connection is lost and updates route.
 */
export class ClientMeshAutoDiscovery extends EventEmitter {
  private socket: dgram.Socket | null = null;
  private isListening = false;
  private currentHubIP: string | null = null;
  private currentHubPort: number = DEFAULT_HUB_SERVICE_PORT;

  constructor(initialHubIP?: string) {
    super();
    this.currentHubIP = initialHubIP ?? null;
  }

  /**
   * Activates discovery listening when WebSocket or HTTP heartbeat drops.
   */
  public startDiscoveryListener(): void {
    if (this.isListening) return;
    this.isListening = true;

    try {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.socket.on('error', (err) => {
        console.warn('[ClientMeshAutoDiscovery] Listener error:', err.message);
        this.stopDiscoveryListener();
      });

      this.socket.on('message', (msg, rinfo) => {
        this.handleIncomingBeacon(msg, rinfo.address);
      });

      this.socket.bind(BEACON_PORT, '0.0.0.0', () => {
        console.log(`[ClientMeshAutoDiscovery] Listening for PC Hub beacon on port ${BEACON_PORT}...`);
      });
    } catch (err: any) {
      console.error('[ClientMeshAutoDiscovery] Failed to bind discovery listener:', err.message);
      this.isListening = false;
    }
  }

  /**
   * Parses beacon and emits route update if IP changed.
   */
  private handleIncomingBeacon(rawBuffer: Buffer, senderIp: string): void {
    try {
      const payload: HubBeaconPayload = JSON.parse(rawBuffer.toString('utf8'));

      if (payload.service !== BEACON_MAGIC) {
        return; // Ignore unrelated broadcast traffic
      }

      const discoveredIp = payload.host || senderIp;
      const discoveredPort = payload.port || DEFAULT_HUB_SERVICE_PORT;

      // Has Hub IP changed from previous known route?
      const ipChanged = discoveredIp !== this.currentHubIP;
      const portChanged = discoveredPort !== this.currentHubPort;

      if (ipChanged || portChanged) {
        console.log(`[ClientMeshAutoDiscovery] HUB ROUTE RECOVERED: ${this.currentHubIP} -> ${discoveredIp}:${discoveredPort}`);
        this.currentHubIP = discoveredIp;
        this.currentHubPort = discoveredPort;

        this.emit('hub:discovered', {
          host: discoveredIp,
          port: discoveredPort,
          version: payload.version,
          businessId: payload.businessId,
          businessName: payload.businessName,
          timestamp: payload.timestamp,
        });

        // Once re-discovered and connected, listener can be idled to save mobile battery
        this.emit('route:updated', {
          endpoint: `http://${discoveredIp}:${discoveredPort}`,
          wsEndpoint: `ws://${discoveredIp}:${discoveredPort}`,
        });
      }
    } catch {
      // Ignore invalid or malformed broadcast packets
    }
  }

  public stopDiscoveryListener(): void {
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = null;
    }
    this.isListening = false;
  }

  public getCurrentHubRoute(): { host: string | null; port: number } {
    return {
      host: this.currentHubIP,
      port: this.currentHubPort,
    };
  }
}
