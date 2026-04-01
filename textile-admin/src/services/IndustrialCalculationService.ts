export interface ProductionCost {
  materialCost: number;
  laborCost: number;
  overhead: number;
  totalCostPerUnit: number;
  marketPriceRecommendation: number;
}

export interface ConsumptionBreakdown {
  kameez: number;
  shalwar: number;
  dupatta: number;
  total: number;
}

export class IndustrialCalculationService {
  /**
   * Industrial Standard: Consumption Matrix (Gaz per Size)
   * This would typically be fetched from Supabase, but we define the core logic here.
   */
  static getGarmentSizeBreakdown(size: number): ConsumptionBreakdown {
    // Base logic for Anarkali Wholesale standard
    // Sizes typically range from 24 (kids) to 50 (extra large)
    const multiplier = size / 32; // Normalize around size 32
    
    const kameez = Number((2.25 * multiplier).toFixed(2));
    const shalwar = Number((2.00 * multiplier).toFixed(2));
    const dupatta = Number((2.25 * multiplier).toFixed(2));
    
    return {
      kameez,
      shalwar,
      dupatta,
      total: Number((kameez + shalwar + dupatta).toFixed(2))
    };
  }

  /**
   * Calculates the exact material requirements for a Job Order.
   * Net = (Total Consumption) + Wastage
   */
  static calculateNetMaterialRequirement(
    baseConsumption: number,
    wastagePercent: number
  ): number {
    const wastage = baseConsumption * (wastagePercent / 100);
    return Number((baseConsumption + wastage).toFixed(2));
  }

  /**
   * Reconciles Karigar Chalan - checking for missing raw materials or over-consumption.
   */
  static reconcileKarigarChalan(
    issuedQty: number,
    receivedFinished: number,
    consumptionPerUnit: number,
    allowedWastageBase: number
  ): { variance: number; status: 'loss' | 'perfect' | 'excess' } {
    const expectedConsumption = receivedFinished * consumptionPerUnit;
    const allowedWastage = expectedConsumption * (allowedWastageBase / 100);
    const variance = issuedQty - (expectedConsumption + allowedWastage);

    if (variance < 0) return { variance, status: 'loss' };
    if (variance > 0.05) return { variance, status: 'excess' };
    return { variance, status: 'perfect' };
  }

  /**
   * Complex Costing Matrix: Material + Labor (Karigar) + Transport + Polish
   */
  static generateCostingMatrix(
    materials: Array<{ cost: number; qty: number }>,
    karigarRate: number,
    fixedOverhead: number = 0
  ): ProductionCost {
    const materialCost = materials.reduce((acc, m) => acc + m.cost * m.qty, 0);
    const laborCost = karigarRate;
    const totalCost = materialCost + laborCost + fixedOverhead;

    return {
      materialCost: Number(materialCost.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      overhead: fixedOverhead,
      totalCostPerUnit: Number(totalCost.toFixed(2)),
      marketPriceRecommendation: Number((totalCost * 1.4).toFixed(2)), // 40% Standard Margin
    };
  }

  static async reconcilePartyLedger(
    partyId: string,
    transactions: Array<{ amount: number; type: 'debit' | 'credit' }>
  ): Promise<number> {
    if (!partyId) throw new Error("Party ID is required for reconciliation");
    
    return transactions.reduce((balance, tx) => {
      return tx.type === 'credit' ? balance + tx.amount : balance - tx.amount;
    }, 0);
  }
}
