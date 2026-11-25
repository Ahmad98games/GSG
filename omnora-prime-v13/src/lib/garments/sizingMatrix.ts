/**
 * Garment Sizing Matrix (Sizes 14 to 44)
 * Strictly scoped for Garments & Textile Business Modes.
 */

export const GARMENT_SIZES = [
  14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44,
] as const;

export type GarmentSize = (typeof GARMENT_SIZES)[number];
export type SizeGroup = 'infant' | 'kids' | 'teen' | 'adult';

export interface SizeMetadata {
  size: GarmentSize;
  ageOrFitLabel: string;
  shortFit: string;
  group: SizeGroup;
}

export interface SizeVariant {
  id: string;
  parentProductId: string;
  size: GarmentSize;
  ageOrFitLabel: string;
  color?: string;
  sku: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stockQty: number;
}

export interface GarmentParentProduct {
  id: string;
  business_id?: string;
  name: string;
  sku_code: string;
  category?: string;
  unit?: string;
  has_size_matrix: boolean;
  variants: SizeVariant[];
  qty_on_hand: number;
  cost_price: number;
  sale_price: number;
}

export const SIZE_METADATA_MAP: Record<GarmentSize, SizeMetadata> = {
  14: { size: 14, ageOrFitLabel: 'Infant (6–12m)', shortFit: '6–12m', group: 'infant' },
  16: { size: 16, ageOrFitLabel: 'Toddler (1–1.5y)', shortFit: '1–1.5y', group: 'infant' },
  18: { size: 18, ageOrFitLabel: 'Toddler (1.5–2y)', shortFit: '1.5–2y', group: 'infant' },
  20: { size: 20, ageOrFitLabel: 'Toddler (2–3y)', shortFit: '2–3y', group: 'infant' },
  22: { size: 22, ageOrFitLabel: 'Kids (4–5y)', shortFit: '4–5y', group: 'kids' },
  24: { size: 24, ageOrFitLabel: 'Kids (5–6y)', shortFit: '5–6y', group: 'kids' },
  26: { size: 26, ageOrFitLabel: 'Kids (7–8y)', shortFit: '7–8y', group: 'kids' },
  28: { size: 28, ageOrFitLabel: 'Kids (8–9y)', shortFit: '8–9y', group: 'kids' },
  30: { size: 30, ageOrFitLabel: 'Kids (10–11y)', shortFit: '10–11y', group: 'kids' },
  32: { size: 32, ageOrFitLabel: 'Kids (11–12y)', shortFit: '11–12y', group: 'kids' },
  34: { size: 34, ageOrFitLabel: 'Teen / Junior (13–14y)', shortFit: '13–14y', group: 'teen' },
  36: { size: 36, ageOrFitLabel: 'Teen / Junior (15–16y)', shortFit: '15–16y', group: 'teen' },
  38: { size: 38, ageOrFitLabel: 'Adult Small (S)', shortFit: 'Adult S', group: 'adult' },
  40: { size: 40, ageOrFitLabel: 'Adult Medium (M)', shortFit: 'Adult M', group: 'adult' },
  42: { size: 42, ageOrFitLabel: 'Adult Large (L)', shortFit: 'Adult L', group: 'adult' },
  44: { size: 44, ageOrFitLabel: 'Adult XL / XXL', shortFit: 'Adult XL', group: 'adult' },
};

export interface SizePreset {
  id: 'infant' | 'kids' | 'teen' | 'adult' | 'full';
  label: string;
  rangeLabel: string;
  sizes: readonly GarmentSize[];
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'infant', label: 'Infant Set', rangeLabel: '14–20', sizes: [14, 16, 18, 20] },
  { id: 'kids', label: 'Kids Set', rangeLabel: '22–32', sizes: [22, 24, 26, 28, 30, 32] },
  { id: 'teen', label: 'Teen Set', rangeLabel: '34–36', sizes: [34, 36] },
  { id: 'adult', label: 'Adult Set', rangeLabel: '38–44', sizes: [38, 40, 42, 44] },
  { id: 'full', label: 'Full Range', rangeLabel: '14–44', sizes: GARMENT_SIZES },
];

export function getSizeMetadata(size: number): SizeMetadata {
  const normalized = Number(size) as GarmentSize;
  return (
    SIZE_METADATA_MAP[normalized] || {
      size: normalized,
      ageOrFitLabel: `Size ${size}`,
      shortFit: `Sz ${size}`,
      group: normalized <= 20 ? 'infant' : normalized <= 32 ? 'kids' : normalized <= 36 ? 'teen' : 'adult',
    }
  );
}

/**
 * Determines whether Garment Sizing Matrix features should be active.
 * Scoped strictly to Garments and Textile business categories/modes.
 */
export function isGarmentSizingMode(
  industryKey?: string | null,
  businessMode?: string | null
): boolean {
  const ind = String(industryKey || '').trim().toLowerCase();
  const mode = String(businessMode || '').trim().toLowerCase();
  if (ind === 'garment' || ind === 'garments' || ind === 'textile') return true;
  if (mode === 'garment' || mode === 'garments' || mode === 'textile') return true;
  return false;
}

/**
 * Normalizes a parent SKU code and generates a clean variant SKU e.g. ART405-24.
 */
export function generateVariantSku(parentSkuCode: string, size: number, color?: string): string {
  const base = (parentSkuCode || 'ART')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12) || 'ART';
  const colorPart = color
    ? '-' + color.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 4)
    : '';
  return `${base}-${size}${colorPart}`;
}

/**
 * Generates a deterministic, thermal-scanner-friendly numeric barcode for a size variant.
 */
export function generateVariantBarcode(parentSkuCode: string, size: number, seedOffset = 0): string {
  const cleaned = (parentSkuCode || '405').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = (hash * 31 + cleaned.charCodeAt(i)) % 1000000;
  }
  const mid = String((hash + seedOffset) % 1000000).padStart(6, '0');
  const sz = String(size).padStart(2, '0');
  // 12-digit numeric barcode with prefix 89 (apparel internal)
  return `89${mid}${sz}01`;
}

export function createSizeVariant(
  parentProductId: string,
  parentSkuCode: string,
  size: GarmentSize,
  defaults?: {
    costPrice?: number;
    salePrice?: number;
    stockQty?: number;
    color?: string;
  }
): SizeVariant {
  const meta = getSizeMetadata(size);
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `var_${parentProductId}_${size}_${Date.now()}`;
  return {
    id,
    parentProductId,
    size,
    ageOrFitLabel: meta.ageOrFitLabel,
    color: defaults?.color || '',
    sku: generateVariantSku(parentSkuCode, size, defaults?.color),
    barcode: generateVariantBarcode(parentSkuCode, size),
    costPrice: Number(defaults?.costPrice ?? 0),
    salePrice: Number(defaults?.salePrice ?? 0),
    stockQty: Number(defaults?.stockQty ?? 0),
  };
}

export function parseSizeVariants(raw: any): SizeVariant[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((v: any) => v && typeof v.size !== 'undefined')
      .map((v: any) => {
        const sizeNum = Number(v.size) as GarmentSize;
        const meta = getSizeMetadata(sizeNum);
        return {
          id: String(v.id || `var_${sizeNum}`),
          parentProductId: String(v.parentProductId || v.parent_product_id || ''),
          size: sizeNum,
          ageOrFitLabel: String(v.ageOrFitLabel || meta.ageOrFitLabel),
          color: v.color ? String(v.color) : '',
          sku: String(v.sku || ''),
          barcode: String(v.barcode || ''),
          costPrice: Number(v.costPrice ?? v.cost_price ?? 0) || 0,
          salePrice: Number(v.salePrice ?? v.sale_price ?? 0) || 0,
          stockQty: Number(v.stockQty ?? v.stock_qty ?? 0) || 0,
        };
      })
      .sort((a, b) => a.size - b.size);
  } catch {
    return [];
  }
}

export function computeParentTotals(variants: SizeVariant[], reorderLevel = 5) {
  if (!variants || variants.length === 0) {
    return {
      totalStock: 0,
      minSalePrice: 0,
      maxSalePrice: 0,
      avgCostPrice: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }
  let totalStock = 0;
  let minSalePrice = Infinity;
  let maxSalePrice = 0;
  let costSum = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const v of variants) {
    const qty = Number(v.stockQty || 0);
    const sale = Number(v.salePrice || 0);
    const cost = Number(v.costPrice || 0);
    totalStock += qty;
    if (sale > 0 && sale < minSalePrice) minSalePrice = sale;
    if (sale > maxSalePrice) maxSalePrice = sale;
    costSum += cost;
    if (qty <= 0) outOfStockCount++;
    else if (qty <= reorderLevel) lowStockCount++;
  }

  return {
    totalStock,
    minSalePrice: minSalePrice === Infinity ? 0 : minSalePrice,
    maxSalePrice,
    avgCostPrice: Math.round(costSum / variants.length),
    lowStockCount,
    outOfStockCount,
  };
}
