// src/lib/monitoring/CrashReporter.ts
import * as Sentry from "@sentry/nextjs";
import { env } from "../env";

/**
 * Noxis Hub Reporting & Forensic Intelligence
 * Wraps Sentry with industrial-specific context tags.
 */
export class CrashReporter {
  static init() {
    if (!env.SENTRY_DSN) return;

    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });

    // Add global industrial context
    Sentry.setTag("hub_version", "v13.0");
    Sentry.setTag("platform", process.env.NEXT_PUBLIC_PLATFORM || "web");
  }

  static setBusinessContext(businessId: string, businessName: string) {
    Sentry.setTag("business_id", businessId);
    Sentry.setContext("business", {
      id: businessId,
      name: businessName,
    });
  }

  static addNSPBreadcrumb(event: string, data: any) {
    Sentry.addBreadcrumb({
      category: "nsp",
      message: `Event: ${event}`,
      data: data,
      level: "info",
    });
  }

  static captureException(error: Error, context?: any) {
    Sentry.captureException(error, {
      extra: context
    });
  }
}

