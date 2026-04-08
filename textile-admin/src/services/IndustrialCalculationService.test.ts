import { describe, it, expect } from 'vitest';
import { IndustrialCalculationService } from './IndustrialCalculationService';

describe('IndustrialCalculationService', () => {
  describe('calculateShrinkage', () => {
    it('should calculate shrinkage correctly with default 6.5%', () => {
      const result = IndustrialCalculationService.calculateShrinkage(100);
      
      expect(result.originalGaz).toBe(100);
      expect(result.shrinkagePercent).toBe(6.5);
      expect(result.shrinkageLoss).toBe(6.5);
      expect(result.netGaz).toBe(93.5);
    });

    it('should calculate shrinkage with custom percentage', () => {
      const result = IndustrialCalculationService.calculateShrinkage(100, 8.0);
      
      expect(result.shrinkagePercent).toBe(8.0);
      expect(result.shrinkageLoss).toBe(8.0);
      expect(result.netGaz).toBe(92.0);
    });

    it('should throw error for invalid shrinkage percentage', () => {
      expect(() => {
        IndustrialCalculationService.calculateShrinkage(100, -1);
      }).toThrow('Shrinkage percent must be between 0-20%');

      expect(() => {
        IndustrialCalculationService.calculateShrinkage(100, 25);
      }).toThrow('Shrinkage percent must be between 0-20%');
    });

    it('should handle decimal values correctly for PKR precision', () => {
      const result = IndustrialCalculationService.calculateShrinkage(123.45, 6.5);
      
      expect(result.originalGaz).toBe(123.45);
      expect(result.shrinkageLoss).toBe(8.02); // 123.45 * 0.065 = 8.02425, rounded to 8.02
      expect(result.netGaz).toBe(115.43); // 123.45 - 8.02 = 115.43
    });
  });

  describe('calculateConsumption', () => {
    it('should calculate total fabric requirement with 4% wastage', () => {
      const result = IndustrialCalculationService.calculateConsumption({
        garmentType: 'Kids Suit 3-Piece',
        sizeNumber: 32,
        quantity: 10,
        kameezGazPerUnit: 2.5,
        shalwarGazPerUnit: 1.8,
        dupattaGazPerUnit: 2.2,
        laceGazPerUnit: 0.5,
      });

      expect(result.subtotalGazPerUnit).toBe(7.0); // 2.5 + 1.8 + 2.2 + 0.5
      expect(result.wastagePercent).toBe(4.0);
      expect(result.wastageGaz).toBe(2.8); // 70 * 0.04
      expect(result.finalRequiredGaz).toBe(72.8); // 70 + 2.8
    });

    it('should handle custom wastage percentage', () => {
      const result = IndustrialCalculationService.calculateConsumption({
        garmentType: 'Ladies Suit',
        sizeNumber: 38,
        quantity: 5,
        kameezGazPerUnit: 3.0,
        shalwarGazPerUnit: 2.0,
        dupattaGazPerUnit: 2.5,
        laceGazPerUnit: 0.8,
        wastagePercent: 5.0,
      });

      const subtotal = (3.0 + 2.0 + 2.5 + 0.8) * 5; // 41.5
      const wastage = subtotal * 0.05; // 2.075
      
      expect(result.wastagePercent).toBe(5.0);
      expect(result.finalRequiredGaz).toBe(parseFloat((subtotal + wastage).toFixed(2)));
    });
  });

  describe('calculatePricing', () => {
    it('should calculate wholesale pricing in PKR with no bulk discount', () => {
      const result = IndustrialCalculationService.calculatePricing({
        mode: 'wholesale',
        costPerUnit: 1000,
        quantity: 10,
      });

      expect(result.mode).toBe('wholesale');
      expect(result.marginPercent).toBe(25);
      expect(result.unitPrice).toBe(1250); // 1000 * 1.25
      expect(result.basePrice).toBe(12500); // 1250 * 10
      expect(result.bulkDiscount).toBe(0);
      expect(result.finalPrice).toBe(12500);
    });

    it('should apply 5% PKR bulk discount for 50+ units', () => {
      const result = IndustrialCalculationService.calculatePricing({
        mode: 'wholesale',
        costPerUnit: 1000,
        quantity: 50,
      });

      expect(result.bulkDiscount).toBe(3125);
      expect(result.finalPrice).toBe(59375); // 62,500 - 3,125
    });

    it('should apply 10% PKR bulk discount for 100+ units', () => {
      const result = IndustrialCalculationService.calculatePricing({
        mode: 'wholesale',
        costPerUnit: 1000,
        quantity: 100,
      });

      expect(result.bulkDiscount).toBe(12500);
      expect(result.finalPrice).toBe(112500); // 125,000 - 12,500
    });

    it('should calculate retail pricing with 50% margin and no bulk discount', () => {
      const result = IndustrialCalculationService.calculatePricing({
        mode: 'retail',
        costPerUnit: 1000,
        quantity: 100,
      });

      expect(result.mode).toBe('retail');
      expect(result.marginPercent).toBe(50);
      expect(result.unitPrice).toBe(1500); // 1000 * 1.5
      expect(result.basePrice).toBe(150000); // 1500 * 100
      expect(result.bulkDiscount).toBe(0); // No bulk discount for retail
      expect(result.finalPrice).toBe(150000);
    });
  });
});
