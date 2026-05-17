import { Decimal } from 'decimal.js';

// Configuration for industrial standards
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface Karigar {
  id: string;
  wage_type: 'piece_rate' | 'daily_wage' | 'monthly_salary';
  piece_rate?: number;
  daily_rate?: number;
  monthly_salary?: number;
  eobi_enrolled: boolean;
  sessi_enrolled: boolean;
}

export interface AttendanceLog {
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  overtime_hrs: number;
}

export interface ProductionLog {
  effective_earning: number;
  qty_produced: number;
}

export interface Advance {
  amount: number;
}

export const PayrollCalculator = {
  calculate: (
    karigar: Karigar,
    attendance: AttendanceLog[],
    production: ProductionLog[],
    advances: Advance[],
    config = { eobi_rate: 370, sessi_rate_pct: 0, overtime_multiplier: 1.5, working_days: 26 }
  ) => {
    const pieceRateEarning = production.reduce((sum, log) => sum.plus(log.effective_earning), new Decimal(0));
    
    const daysPresent = attendance.reduce((sum, log) => {
      if (log.status === 'present' || log.status === 'holiday' || log.status === 'leave') return sum.plus(1);
      if (log.status === 'half_day') return sum.plus(0.5);
      return sum;
    }, new Decimal(0));

    const daysAbsent = new Decimal(config.working_days).minus(daysPresent).toNumber();

    let dailyWageEarning = new Decimal(0);
    let monthlyBase = new Decimal(0);
    let overtimeEarning = new Decimal(0);

    if (karigar.wage_type === 'daily_wage' && karigar.daily_rate) {
      dailyWageEarning = daysPresent.times(karigar.daily_rate);
      const totalOvertimeHrs = attendance.reduce((sum, log) => sum.plus(log.overtime_hrs), new Decimal(0));
      const hourlyRate = new Decimal(karigar.daily_rate).div(8);
      overtimeEarning = totalOvertimeHrs.times(hourlyRate).times(config.overtime_multiplier);
    } else if (karigar.wage_type === 'monthly_salary' && karigar.monthly_salary) {
      // Pro-rated monthly salary
      monthlyBase = new Decimal(karigar.monthly_salary).times(daysPresent.div(config.working_days));
    }

    const grossEarning = pieceRateEarning.plus(dailyWageEarning).plus(monthlyBase).plus(overtimeEarning);

    // Advance Deduction (Capped at 50% of gross)
    const totalPendingAdvance = advances.reduce((sum, adv) => sum.plus(adv.amount), new Decimal(0));
    const advanceDeduction = Decimal.min(grossEarning.times(0.5), totalPendingAdvance);

    const eobiDeduction = karigar.eobi_enrolled ? new Decimal(config.eobi_rate) : new Decimal(0);
    const sessiDeduction = karigar.sessi_enrolled ? grossEarning.times(config.sessi_rate_pct).div(100) : new Decimal(0);

    const totalDeductions = advanceDeduction.plus(eobiDeduction).plus(sessiDeduction);
    const netPayable = Decimal.max(0, grossEarning.minus(totalDeductions));

    return {
      piece_rate_earning: pieceRateEarning.toNumber(),
      daily_wage_earning: dailyWageEarning.toNumber(),
      monthly_base: monthlyBase.toNumber(),
      overtime_earning: overtimeEarning.toNumber(),
      gross_earning: grossEarning.toNumber(),
      advance_deduction: advanceDeduction.toNumber(),
      eobi_deduction: eobiDeduction.toNumber(),
      sessi_deduction: sessiDeduction.toNumber(),
      total_deductions: totalDeductions.toNumber(),
      net_payable: netPayable.toNumber(),
      days_present: daysPresent.toNumber(),
      days_absent: Math.max(0, daysAbsent),
      total_units: production.reduce((sum, log) => sum + Number(log.qty_produced), 0)
    };
  }
};

