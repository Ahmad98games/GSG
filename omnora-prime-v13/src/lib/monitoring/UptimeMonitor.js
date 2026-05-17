"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UptimeMonitor = void 0;
// src/lib/monitoring/UptimeMonitor.ts
const env_1 = require("../env");
const logger_1 = require("../logger");
/**
 * NOXIS Uptime Heartbeat
 * Ensures the monitoring service knows the Hub is alive.
 */
class UptimeMonitor {
    static interval = null;
    static start() {
        if (!env_1.env.UPTIME_MONITOR_URL) {
            logger_1.logger.warn("Uptime monitor URL not set. Heartbeat disabled.");
            return;
        }
        logger_1.logger.info("Uptime monitor started.");
        // Initial ping
        this.ping();
        // Ping every 5 minutes
        this.interval = setInterval(() => this.ping(), 5 * 60 * 1000);
    }
    static async ping() {
        try {
            const response = await fetch(env_1.env.UPTIME_MONITOR_URL);
            if (!response.ok) {
                throw new Error(`Heartbeat failed with status: ${response.status}`);
            }
        }
        catch (error) {
            logger_1.logger.error({ error: error.message }, "Uptime monitor heartbeat error");
        }
    }
    static stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
exports.UptimeMonitor = UptimeMonitor;
