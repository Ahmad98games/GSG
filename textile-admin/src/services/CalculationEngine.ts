/**
 * Gold She Industrial Calculation Engine v2.1
 * Sovereign Edition: PKR Standard & Set-Wise Wholesale Logic.
 */

export interface FormulaConfig {
  shrinkagePercent: number; // Dhulayi ke baad kapra kam hona
  wastageBuffer: number;    // Cutting mein zaya hone wala kapra
  panaEfficiency: number;   // Kapray ki width (Arz) ka asar
}

export interface WholesalePricing {
  basePrice: number;
  quantitySets: number;
  discountTier: number; // e.g., 5 for 5%, 10 for 10%
}

export class CalculationEngine {
  private static readonly DEFAULT_CONFIG: FormulaConfig = {
    shrinkagePercent: 6.5, // Standard PKR Industrial
    wastageBuffer: 4.0,    // Standard Cutting Buffer
    panaEfficiency: 1.0,   // Standard 60" Pana
  };

  /**
   * Precise Rounding: PKR (Rs.) mein 2 decimal se zyada ghalti nuksaan hai.
   */
  public static round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * FABRIC ESTIMATOR: Karigar ko kitna kapra dena hai?
   * Logic: Base + Shrinkage + Wastage / Pana
   */
  public static calculateFabricRequirement(
    baseGaz: number,
    config: FormulaConfig = this.DEFAULT_CONFIG
  ): number {
    const withShrinkage = baseGaz * (1 + config.shrinkagePercent / 100);
    const withWastage = withShrinkage * (1 + config.wastageBuffer / 100);
    const adjustedForPana = withWastage / config.panaEfficiency;
    
    return this.round(adjustedForPana);
  }

  /**
   * SET-WISE WHOLESALE PRICING: 
   * Automatic bulk discount logic for PKR transactions.
   */
  public static calculateWholesaleTotal(pricing: WholesalePricing): number {
    const subtotal = pricing.basePrice * pricing.quantitySets;
    const discountAmount = subtotal * (pricing.discountTier / 100);
    
    return this.round(subtotal - discountAmount);
  }

  /**
   * KARIGAR LEDGER: 
   * Debit = (Quantity * Rate) - Advance Payment
   */
  public static calculateKarigarSettlement(
    quantity: number,
    rate: number,
    advance: number = 0
  ): number {
    const grossTotal = quantity * rate;
    const netPayable = grossTotal - advance;
    
    return this.round(netPayable);
  }

  /**
   * PROFIT AUDIT: 
   * Real-time margin check after all industrial losses.
   */
  /**
   * PROFIT AUDIT: 
   * Real-time margin check after all industrial losses.
   */
  public static calculateNetMargin(
    salePrice: number,
    totalCost: number,
    isWholesale: boolean = true // Variable fixed and used below
  ): { margin: number; percent: number; label: string } {
    const margin = salePrice - totalCost;
    const percent = (margin / salePrice) * 100;
    
    // Using the variable to define the context of the audit
    const label = isWholesale ? "WHOLESALE_AUDIT" : "RETAIL_AUDIT";
    
    return {
      margin: this.round(margin),
      percent: this.round(percent),
      label: label // Now the variable is officially read and used
    };
  }
}
