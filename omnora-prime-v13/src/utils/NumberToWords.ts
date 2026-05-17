/**
 * Noxis v13.0 — Financial Utility
 * Converts numeric amounts to words (English/Urdu context).
 * Supports Lakhs/Crores and Millions/Billions numbering systems.
 */

const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertChunk(num: number): string {
  let str = "";
  if (num >= 100) {
    str += units[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 10 && num <= 19) {
    str += teens[num - 10];
  } else {
    const tenPart = tens[Math.floor(num / 10)];
    const unitPart = units[num % 10];
    str += tenPart + (tenPart && unitPart ? " " : "") + unitPart;
  }
  return str.trim();
}

export function numberToWords(num: number, currencyCode: string = "USD"): string {
  if (num === 0) return `Zero ${currencyCode} Only`;
  
  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);
  
  let result = "";
  let remaining = wholePart;

  const southAsianCurrencies = ['PKR', 'INR', 'BDT', 'LKR', 'NPR'];
  const useLakhSystem = southAsianCurrencies.includes(currencyCode.toUpperCase());

  if (useLakhSystem) {
    // Lakh/Crore System
    if (remaining >= 10000000) {
      const crores = Math.floor(remaining / 10000000);
      result += convertChunk(crores) + " Crore ";
      remaining %= 10000000;
    }
    if (remaining >= 100000) {
      const lakhs = Math.floor(remaining / 100000);
      result += convertChunk(lakhs) + " Lakh ";
      remaining %= 100000;
    }
    if (remaining >= 1000) {
      const thousands = Math.floor(remaining / 1000);
      result += convertChunk(thousands) + " Thousand ";
      remaining %= 1000;
    }
  } else {
    // International System (Millions/Billions)
    if (remaining >= 1000000000) {
      const billions = Math.floor(remaining / 1000000000);
      result += convertChunk(billions) + " Billion ";
      remaining %= 1000000000;
    }
    if (remaining >= 1000000) {
      const millions = Math.floor(remaining / 1000000);
      result += convertChunk(millions) + " Million ";
      remaining %= 1000000;
    }
    if (remaining >= 1000) {
      const thousands = Math.floor(remaining / 1000);
      result += convertChunk(thousands) + " Thousand ";
      remaining %= 1000;
    }
  }

  // Hundreds/Units
  if (remaining > 0) {
    result += convertChunk(remaining);
  }

  result = `${currencyCode} ${result.trim()}`;

  if (decimalPart > 0) {
    const subUnit = useLakhSystem ? "Paisa" : "Cents";
    result += ` and ${convertChunk(decimalPart)} ${subUnit}`;
  }

  return `${result} Only`.replace(/\s+/g, " ");
}
