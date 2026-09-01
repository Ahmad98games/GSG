/**
 * Karigar Grade System
 * Industry-standard skill, wage tier, and quality classification for artisans & textile workers.
 */

export interface KarigarGradeConfig {
  value: 'MASTER' | 'A' | 'B' | 'C';
  label: string;
  shortLabel: string;
  titleUrdu: string;
  description: string;
  tier: string;
  color: 'amber' | 'emerald' | 'blue' | 'purple';
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  rateMultiplier: number;
  expectedYieldPct: number;
  suitableStages: string[];
}

export const KARIGAR_GRADES: readonly KarigarGradeConfig[] = [
  {
    value: 'MASTER',
    label: 'Master (Ustaad)',
    shortLabel: 'Master',
    titleUrdu: 'استاد / ماسٹر',
    description: 'Master craftsman, pattern maker & production supervisor. Handles complex cutting, sampling & supervision.',
    tier: 'Supervisor / Master',
    color: 'amber',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    rateMultiplier: 1.25,
    expectedYieldPct: 98,
    suitableStages: ['Cutting', 'Pattern Making', 'Complex Embroidery', 'Master Sampling', 'Quality Audit']
  },
  {
    value: 'A',
    label: 'Grade A (Expert)',
    shortLabel: 'Grade A',
    titleUrdu: 'گریڈ اے (ماہر)',
    description: 'Senior expert artisan with high precision stitching and minimal defect rates. High-end retail & bridal production.',
    tier: 'Senior Expert',
    color: 'emerald',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    rateMultiplier: 1.10,
    expectedYieldPct: 92,
    suitableStages: ['Fine Stitching', 'Handwork / Zari', 'Bridal Assembly', 'Finishing & Inspection']
  },
  {
    value: 'B',
    label: 'Grade B (Intermediate)',
    shortLabel: 'Grade B',
    titleUrdu: 'گریڈ بی (ہنرمند)',
    description: 'Skilled standard artisan for steady commercial production line work with dependable output.',
    tier: 'Intermediate Skilled',
    color: 'blue',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    rateMultiplier: 1.00,
    expectedYieldPct: 85,
    suitableStages: ['Standard Stitching', 'Overlock', 'Flatlock', 'General Assembly']
  },
  {
    value: 'C',
    label: 'Grade C (Apprentice)',
    shortLabel: 'Grade C',
    titleUrdu: 'گریڈ سی (شاگرد)',
    description: 'Junior apprentice / shagird in training. Handles secondary assembly, thread trimming, fusing, and packaging.',
    tier: 'Apprentice / Trainee',
    color: 'purple',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
    rateMultiplier: 0.85,
    expectedYieldPct: 75,
    suitableStages: ['Thread Trimming', 'Fusing & Ironing', 'Button Stitching', 'Packing']
  }
] as const;

export type KarigarGradeValue = (typeof KARIGAR_GRADES)[number]['value'];

/**
 * Normalizes any legacy or custom grade string to the canonical KarigarGradeConfig
 */
export function getGradeInfo(grade?: string | null): KarigarGradeConfig {
  const norm = (grade || '').toUpperCase().trim();
  if (norm === 'MASTER' || norm.includes('USTAAD') || norm.includes('MASTER')) {
    return KARIGAR_GRADES[0];
  }
  if (norm === 'A' || norm.includes('EXPERT') || norm.includes('GRADE A')) {
    return KARIGAR_GRADES[1];
  }
  if (norm === 'B' || norm.includes('INTERMEDIATE') || norm.includes('GRADE B')) {
    return KARIGAR_GRADES[2];
  }
  if (norm === 'C' || norm.includes('APPRENTICE') || norm.includes('SHAGIRD') || norm.includes('GRADE C')) {
    return KARIGAR_GRADES[3];
  }
  // Default to Grade B
  return KARIGAR_GRADES[2];
}
