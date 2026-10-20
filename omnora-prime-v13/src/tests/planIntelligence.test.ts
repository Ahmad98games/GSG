import { describe, it, expect } from 'vitest';
import {
  analyzePlanIntelligence,
  detectBillingCycle,
  buildAdminPlanEndedNotificationPayload,
  buildWhatsAppRenewalUrl,
} from '@/lib/license/planIntelligence';

describe('Plan Intelligence Engine', () => {
  it('correctly detects a Monthly subscription and its active timespan', () => {
    const now = Date.now();
    const issuedAt = now - 10 * 24 * 60 * 60 * 1000; // 10 days ago
    const expiresAt = now + 20 * 24 * 60 * 60 * 1000; // 20 days left (30 day total)

    const result = analyzePlanIntelligence({
      tier: 'pro',
      customerName: 'Tariq Textiles',
      businessId: 'bus-1234',
      issuedAt,
      expiresAt,
    });

    expect(result.tier).toBe('pro');
    expect(result.effectiveTier).toBe('pro');
    expect(result.billingCycle).toBe('monthly');
    expect(result.billingCycleLabel).toBe('Monthly Subscription');
    expect(result.timespan.totalTimespanDays).toBe(30);
    expect(result.timespan.daysActive).toBe(10);
    expect(result.timespan.daysRemaining).toBe(20);
    expect(result.isExpired).toBe(false);
    expect(result.isDeactivated).toBe(false);
    expect(result.status).toBe('active');
  });

  it('correctly detects an Annual / Yearly plan and its timespan', () => {
    const now = Date.now();
    const issuedAt = now - 65 * 24 * 60 * 60 * 1000; // 65 days ago
    const expiresAt = now + 300 * 24 * 60 * 60 * 1000; // 300 days left (365 days total)

    const result = analyzePlanIntelligence({
      tier: 'elite',
      customerName: 'Al-Madina Fabrics',
      issuedAt,
      expiresAt,
    });

    expect(result.tier).toBe('elite');
    expect(result.billingCycle).toBe('yearly');
    expect(result.billingCycleLabel).toBe('Annual Subscription');
    expect(result.timespan.totalTimespanDays).toBe(365);
    expect(result.timespan.daysActive).toBe(65);
    expect(result.timespan.daysRemaining).toBe(300);
    expect(result.isExpired).toBe(false);
  });

  it('automatically deactivates software and drops tier to free when monthly plan timespan finishes', () => {
    const now = Date.now();
    const issuedAt = now - 35 * 24 * 60 * 60 * 1000; // 35 days ago
    const expiresAt = now - 5 * 24 * 60 * 60 * 1000;  // expired 5 days ago

    const result = analyzePlanIntelligence({
      tier: 'pro',
      customerName: 'Chaudhry Weaving',
      businessId: 'bus-expired-01',
      issuedAt,
      expiresAt,
    });

    expect(result.tier).toBe('pro');
    expect(result.effectiveTier).toBe('free'); // Automatically downgraded to Free Forever mode
    expect(result.isExpired).toBe(true);
    expect(result.isDeactivated).toBe(true);
    expect(result.status).toBe('expired_deactivated');
    expect(result.deactivationReason).toContain('paused premium cloud');
    expect(result.timespan.percentElapsed).toBe(100);

    // Verifies upgrade proposal is generated
    expect(result.upgradeProposal.recommendedCycle).toBe('yearly');
    expect(result.upgradeProposal.discountPct).toBe(25);
  });

  it('generates proper admin notification payload when plan ends', () => {
    const now = Date.now();
    const issuedAt = now - 30 * 24 * 60 * 60 * 1000;
    const expiresAt = now - 1000;

    const plan = analyzePlanIntelligence({
      tier: 'lite',
      customerName: 'Khan Sons POS',
      customerPhone: '03001234567',
      issuedAt,
      expiresAt,
    });

    const payload = buildAdminPlanEndedNotificationPayload(plan);
    expect(payload.event).toBe('plan_ended');
    expect(payload.customerName).toBe('Khan Sons POS');
    expect(payload.customerPhone).toBe('03001234567');
    expect(payload.tier).toBe('lite');
    expect(payload.billingCycle).toBe('monthly');
    expect(payload.message).toContain('User plan ended');
  });

  it('builds direct WhatsApp renewal URL with pre-filled plan details', () => {
    const plan = analyzePlanIntelligence({
      tier: 'pro',
      customerName: 'Lahore Silk Mill',
      expiresAt: Date.now() - 1000,
    });

    const url = buildWhatsAppRenewalUrl(plan.upgradeProposal);
    expect(url).toContain('https://wa.me/923264742678');
    expect(url).toContain('Lahore%20Silk%20Mill');
    expect(url).toContain('Pro');
  });
});
