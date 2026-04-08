/**
 * Industrial Calculation Service v2.1
 * Core mathematics engine for textile manufacturing (PKR Optimized)
 */



export interface ShrinkageCalculation {
  originalGaz: number;
  shrinkagePercent: number;
  netGaz: number;
  shrinkageLoss: number;
}

export interface ConsumptionBreakdown {
  garmentType: string;
  sizeNumber: number;
  quantity: number;
  kameezGazPerUnit: number;
  shalwarGazPerUnit: number;
  dupattaGazPerUnit: number;
  laceGazPerUnit: number;
  subtotalGazPerUnit: number;
  wastagePercent: number;
  wastageGaz: number;
  finalRequiredGaz: number;
}

export interface SizeProtocol {
  size: number;
  kameez: number;
  shalwar: number;
  dupatta: number;
  lace: number;
}

export interface PricingCalculation {
  mode: 'wholesale' | 'retail';
  costPerUnit: number;
  quantity: number;
  marginPercent: number;
  basePrice: number;
  bulkDiscount: number;
  finalPrice: number;
  unitPrice: number;
}

export class IndustrialCalculationService {
  private static readonly DEFAULT_PROTOCOLS = [
    { size: 24, kameez: 1.5, shalwar: 1.2, dupatta: 1.8, lace: 0.3 },
    { size: 28, kameez: 1.8, shalwar: 1.4, dupatta: 2.0, lace: 0.4 },
    { size: 32, kameez: 2.2, shalwar: 1.8, dupatta: 2.2, lace: 0.5 },
    { size: 36, kameez: 2.5, shalwar: 2.2, dupatta: 2.5, lace: 0.6 },
    { size: 40, kameez: 2.8, shalwar: 2.4, dupatta: 2.5, lace: 0.7 },
    { size: 44, kameez: 3.0, shalwar: 2.6, dupatta: 2.5, lace: 0.8 },
    { size: 48, kameez: 3.2, shalwar: 2.8, dupatta: 2.5, lace: 1.0 },
  ];

  /**
   * Industrial Math Engine: Size-based Breakdown
   * Returns the fabric breakdown for a specific industrial size.
   */
  static getGarmentSizeBreakdown(size: number): { kameez: number; shalwar: number; dupatta: number; total: number } {
    // Find closest protocol if exact size not found
    const protocol = this.DEFAULT_PROTOCOLS.find(p => p.size >= size) || this.DEFAULT_PROTOCOLS[this.DEFAULT_PROTOCOLS.length - 1];
    
    const total = protocol.kameez + protocol.shalwar + protocol.dupatta;
    
    return {
      kameez: protocol.kameez,
      shalwar: protocol.shalwar,
      dupatta: protocol.dupatta,
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Calculate net material requirement including wastage buffer.
   */
  static calculateNetMaterialRequirement(baseGaz: number, wastagePercent: number = 5): number {
    const total = baseGaz * (1 + wastagePercent / 100);
    return parseFloat(total.toFixed(2));
  }

  static getAllProtocols(): SizeProtocol[] {
    return this.DEFAULT_PROTOCOLS;
  }

  /**
   * Calculate fabric shrinkage after dyeing/washing
   * Industry standard: 5-8% (default 6.5%)
   */
  static calculateShrinkage(
    originalGaz: number,
    shrinkagePercent: number = 6.5
  ): ShrinkageCalculation {
    if (originalGaz < 0) {
      throw new Error('Original Gaz must be positive');
    }
    if (shrinkagePercent < 0 || shrinkagePercent > 20) {
      throw new Error('Shrinkage percent must be between 0-20%');
    }

    const shrinkageLoss = originalGaz * (shrinkagePercent / 100);
    const netGaz = originalGaz - shrinkageLoss;

    return {
      originalGaz: parseFloat(originalGaz.toFixed(2)),
      shrinkagePercent: parseFloat(shrinkagePercent.toFixed(2)),
      netGaz: parseFloat(netGaz.toFixed(2)),
      shrinkageLoss: parseFloat(shrinkageLoss.toFixed(2)),
    };
  }

  /**
   * Calculate fabric consumption for a garment order
   * Includes automatic wastage calculation
   */
  static calculateConsumption(params: {
    garmentType: string;
    sizeNumber: number;
    quantity: number;
    kameezGazPerUnit: number;
    shalwarGazPerUnit: number;
    dupattaGazPerUnit: number;
    laceGazPerUnit: number;
    wastagePercent?: number;
  }): ConsumptionBreakdown {
    const wastagePercent = params.wastagePercent || 4.0; // Industry standard: 4%

    const subtotalGazPerUnit =
      params.kameezGazPerUnit +
      params.shalwarGazPerUnit +
      params.dupattaGazPerUnit +
      params.laceGazPerUnit;

    const subtotalGaz = subtotalGazPerUnit * params.quantity;
    const wastageGaz = subtotalGaz * (wastagePercent / 100);
    const finalRequiredGaz = subtotalGaz + wastageGaz;

    return {
      garmentType: params.garmentType,
      sizeNumber: params.sizeNumber,
      quantity: params.quantity,
      kameezGazPerUnit: parseFloat(params.kameezGazPerUnit.toFixed(2)),
      shalwarGazPerUnit: parseFloat(params.shalwarGazPerUnit.toFixed(2)),
      dupattaGazPerUnit: parseFloat(params.dupattaGazPerUnit.toFixed(2)),
      laceGazPerUnit: parseFloat(params.laceGazPerUnit.toFixed(2)),
      subtotalGazPerUnit: parseFloat(subtotalGazPerUnit.toFixed(2)),
      wastagePercent: parseFloat(wastagePercent.toFixed(2)),
      wastageGaz: parseFloat(wastageGaz.toFixed(2)),
      finalRequiredGaz: parseFloat(finalRequiredGaz.toFixed(2)),
    };
  }

  /**
   * Calculate wholesale vs retail pricing with PKR bulk discounts
   */
  static calculatePricing(params: {
    mode: 'wholesale' | 'retail';
    costPerUnit: number;
    quantity: number;
    wholesaleMargin?: number; // Default: 25%
    retailMargin?: number; // Default: 50%
  }): PricingCalculation {
    const wholesaleMargin = params.wholesaleMargin || 25;
    const retailMargin = params.retailMargin || 50;

    const marginPercent = params.mode === 'wholesale' ? wholesaleMargin : retailMargin;
    const unitPrice = params.costPerUnit * (1 + marginPercent / 100);
    const basePrice = unitPrice * params.quantity;

    // Bulk discount tiers (wholesale only)
    let bulkDiscountPercent = 0;
    if (params.mode === 'wholesale') {
      if (params.quantity >= 100) {
        bulkDiscountPercent = 10; // 10% discount for 100+ units
      } else if (params.quantity >= 50) {
        bulkDiscountPercent = 5; // 5% discount for 50+ units
      }
    }

    const bulkDiscount = basePrice * (bulkDiscountPercent / 100);
    const finalPrice = basePrice - bulkDiscount;

    return {
      mode: params.mode,
      costPerUnit: parseFloat(params.costPerUnit.toFixed(2)),
      quantity: params.quantity,
      marginPercent: parseFloat(marginPercent.toFixed(2)),
      basePrice: parseFloat(basePrice.toFixed(2)),
      bulkDiscount: parseFloat(bulkDiscount.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      unitPrice: parseFloat(unitPrice.toFixed(2)),
    };
  }

  /**
   * Log calculation to audit trail
   */
  static async logCalculation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    params: {
      calculationType: string;
      inputData: Record<string, unknown>;
      outputData: Record<string, unknown>;
      formulaUsed: string;
      batchId?: string;
      jobOrderId?: string;
    }
  ): Promise<void> {
    try {
      await supabase.from('calculation_logs').insert({
        calculation_type: params.calculationType,
        input_data: params.inputData,
        output_data: params.outputData,
        formula_used: params.formulaUsed,
        batch_id: params.batchId,
        job_order_id: params.jobOrderId,
      });
    } catch (error) {
      console.error('Failed to log calculation:', error);
    }
  }
}
