import { describe, it, expect } from 'vitest';
import { IndustrialCalculationService } from './IndustrialCalculationService';
import type { Consumption } from './IndustrialCalculationService';

describe('IndustrialCalculationService', () => {
  describe('calculateNetMaterialRequirement', () => {
    it('should calculate net requirement correctly with wastage', () => {
      const consumption: Consumption = {
        materialId: 'mat-1',
        quantityPerUnit: 2.5,
        wastagePercent: 10,
      };
      const result = IndustrialCalculationService.calculateNetMaterialRequirement(100, consumption);
      // (100 * 2.5) = 250
      // 250 * 0.1 = 25
      // 250 + 25 = 275
      expect(result).toBe(275);
    });

    it('should handle zero wastage', () => {
      const consumption: Consumption = {
        materialId: 'mat-2',
        quantityPerUnit: 1.2,
        wastagePercent: 0,
      };
      const result = IndustrialCalculationService.calculateNetMaterialRequirement(50, consumption);
      expect(result).toBe(60);
    });
  });

  describe('reconcileKarigarChalan', () => {
    it('should return perfect status when within variance', () => {
      const result = IndustrialCalculationService.reconcileKarigarChalan(100, 40, 2.5, 0);
      // Expected = 40 * 2.5 = 100
      // Variance = 100 - 100 = 0
      expect(result.status).toBe('perfect');
      expect(result.variance).toBe(0);
    });

    it('should return loss status when issued/received ratio is insufficient', () => {
      const result = IndustrialCalculationService.reconcileKarigarChalan(90, 40, 2.5, 0);
      // Expected = 100
      // Variance = 90 - 100 = -10
      expect(result.status).toBe('loss');
      expect(result.variance).toBe(-10);
    });

    it('should return excess status when there is significant leftover', () => {
      const result = IndustrialCalculationService.reconcileKarigarChalan(110, 40, 2.5, 0);
      // Expected = 100
      // Variance = 10
      expect(result.status).toBe('excess');
    });
  });

  describe('generateCostingMatrix', () => {
    it('should calculate total cost and recommendation accurately', () => {
      const materials = [
        { cost: 10, qty: 5 }, // 50
        { cost: 2, qty: 10 }, // 20
      ];
      const result = IndustrialCalculationService.generateCostingMatrix(materials, 30, 10);
      // Material = 70
      // Labor = 30
      // Overhead = 10
      // Total = 110
      // Rec = 110 * 1.4 = 154
      expect(result.totalCostPerUnit).toBe(110);
      expect(result.marketPriceRecommendation).toBe(154);
    });
  });
});
