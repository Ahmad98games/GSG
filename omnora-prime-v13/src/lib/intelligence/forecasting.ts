
import { Decimal } from 'decimal.js';

export interface ConsumptionHistory {
  date: string;
  qty: number;
}

/**
 * Predictive Inventory Forecasting Engine
 * Calculates estimated depletion date and burn rate per day using linear regression.
 */
export function calculateStockForecast(
  currentQty: number,
  history: ConsumptionHistory[],
  daysToAnalyze = 90
) {
  if (history.length < 2) {
    return {
      burnRate: 0,
      daysRemaining: Infinity,
      depletionDate: null,
      confidence: 0
    };
  }

  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filter to the analysis window
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToAnalyze);
  
  const windowHistory = sortedHistory.filter(h => new Date(h.date) >= cutoff);

  if (windowHistory.length < 2) {
    return {
      burnRate: 0,
      daysRemaining: Infinity,
      depletionDate: null,
      confidence: 0
    };
  }

  // Linear Regression Logic (y = mx + b)
  // x = days from today (0, -1, -2...)
  // y = quantity consumed
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  const n = windowHistory.length;

  const now = new Date().getTime();
  const dayMs = 86400000;

  windowHistory.forEach(h => {
    const x = (new Date(h.date).getTime() - now) / dayMs; // negative values
    const y = h.qty;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  // Calculate slope (burn rate per day)
  // m = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = (n * sumXX) - (sumX * sumX);
  
  // Average burn rate
  const totalConsumed = windowHistory.reduce((acc, h) => acc + h.qty, 0);
  const firstDate = new Date(windowHistory[windowHistory.length - 1].date).getTime();
  const dateDiffDays = Math.max(1, (now - firstDate) / dayMs);
  const averageBurnRate = totalConsumed / dateDiffDays;

  // Use average burn rate for simplicity and stability in industrial contexts
  // (Linear regression on sparse daily logs can be jittery)
  const burnRate = averageBurnRate;

  if (burnRate <= 0) {
    return {
      burnRate: 0,
      daysRemaining: Infinity,
      depletionDate: null,
      confidence: 1
    };
  }

  const daysRemaining = Math.floor(currentQty / burnRate);
  const depletionDate = new Date();
  depletionDate.setDate(depletionDate.getDate() + daysRemaining);

  // Confidence based on data density
  const confidence = Math.min(1, n / (daysToAnalyze / 3)); // 1 record every 3 days is 100% confidence

  return {
    burnRate,
    daysRemaining,
    depletionDate,
    confidence
  };
}
