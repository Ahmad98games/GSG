/**
 * Gold She Analytics Engine v4.1
 * Pure mathematical functions for high-density industrial reporting.
 * Sovereign Edition: PKR Standard & Buffered Yield Logic.
 */

export interface SovereignProfitConfig {
  revenue: number;
  fabricCost: number;
  laborCost: number;
  wastagePercent: number; // e.g., 4 for 4%
}

export class AnalyticsEngine {
  /**
   * Precise Rounding: PKR (Rs.) mein 2 decimal se zyada ghalti nuksaan hai.
   */
  public static round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculates net sovereign profit after all industrial buffers.
   * Logic: Profit = Revenue - (Fabric + Labor + Wastage)
   */
  public static calculateNetProfit(config: SovereignProfitConfig): number {
    const rawCost = config.fabricCost + config.laborCost;
    const wastageBuffer = rawCost * (config.wastagePercent / 100);
    const totalCost = rawCost + wastageBuffer;
    
    return this.round(config.revenue - totalCost);
  }

  /**
   * INDUSTRIAL YIELD Engine v4.1: Convert Gaz to Suits with strict buffers.
   * Logic: Sub shrinkage (6.5%) if not pre-shrunk, then wastage (4%), then floor by 2.75.
   */
  public static calculateIndustrialYield(inputGaz: number, isPreShrunk: boolean = false): { suits: number; remnant: number } {
    const ratePerSuit = 2.75;
    // Apply 6.5% Shrinkage only if NOT Pre-Shrunk
    const afterShrinkage = isPreShrunk ? inputGaz : inputGaz * (1 - 0.065);
    // Apply 4% generic Wastage buffer
    const afterWastage = afterShrinkage * (1 - 0.04);
    
    const suits = Math.floor(afterWastage / ratePerSuit);
    const totalUsed = suits * ratePerSuit;
    const remnant = this.round(afterWastage - totalUsed);

    return { suits, remnant };
  }

  /**
   * Suit count to Gaz requirement converter (Simplified).
   */
  public static suitsToGaz(suits: number): number {
    return this.round(suits * 2.75);
  }

  /**
   * Fuzzy Search Parser for Attributes.
   * Extracts colors and protocols from search strings.
   */
  public static parseSmartSearch(query: string): { color: string | null; protocol: number | null; term: string } {
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) return { color: null, protocol: null, term: '' };

    // Common set protocols: 4, 5, 6, 8
    const protocolMatch = queryLower.match(/\b(4|5|6|8)\b/);
    const protocol = protocolMatch ? parseInt(protocolMatch[0]) : null;

    // Remove protocol number from query to isolate color/term
    const termWithColor = queryLower.replace(/\b(4|5|6|8)\b/g, '').trim();

    // Desi Color list (expandable)
    const knownColors = ['falsa', 'zinc', 'angoori', 'jamuni', 'white', 'black', 'navy', 'grey'];
    const foundColor = knownColors.find(c => termWithColor.includes(c));

    return {
      color: foundColor || null,
      protocol: protocol,
      term: termWithColor.replace(foundColor || '', '').trim()
    };
  }

  /**
   * --- 9. OPERATIONAL VELOCITY (Friday Protocol) ---
   */
  public static isHeavyRushMode(): boolean {
    const today = new Date().getDay();
    return today === 5; // Friday
  }
}
