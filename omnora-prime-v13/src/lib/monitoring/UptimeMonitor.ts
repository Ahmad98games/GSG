// src/lib/monitoring/UptimeMonitor.ts
import { env } from '../env';
import { logger } from '../logger';

/**
 * NOXIS Uptime Heartbeat
 * Ensures the monitoring service knows the Hub is alive.
 */
export class UptimeMonitor {
  private static interval: NodeJS.Timeout | null = null;

  static start() {
    if (!env.UPTIME_MONITOR_URL) {
      logger.warn("Uptime monitor URL not set. Heartbeat disabled.");
      return;
    }

    logger.info("Uptime monitor started.");
    
    // Initial ping
    this.ping();

    // Ping every 5 minutes
    this.interval = setInterval(() => this.ping(), 5 * 60 * 1000);
  }

  private static async ping() {
    try {
      const response = await fetch(env.UPTIME_MONITOR_URL!);
      if (!response.ok) {
        throw new Error(`Heartbeat failed with status: ${response.status}`);
      }
    } catch (error: any) {
      logger.error({ error: error.message }, "Uptime monitor heartbeat error");
    }
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

