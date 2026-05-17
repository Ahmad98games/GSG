"use client";

import React from "react";
import { Decimal } from "decimal.js";
import { PersonaEngine } from "@/lib/persona/PersonaEngine";
import { cn } from "@/lib/utils";

interface FinancialAmountProps {
  value: Decimal | number | string | null | undefined;
  currency?: string;
  showSign?: boolean;
  size?: "sm" | "md" | "lg";
  isQuantity?: boolean;
  unit?: string;
  className?: string;
  useGold?: boolean;
}

export default function FinancialAmount({
  value,
  currency,
  showSign = false,
  size = "md",
  isQuantity = false,
  unit,
  className,
  useGold = true
}: FinancialAmountProps) {
  if (value === null || value === undefined) return <span className="text-gray-600 font-mono">---</span>;

  let num: Decimal;
  try {
    num = new Decimal(value);
  } catch (e) {
    return <span className="text-gray-600 font-mono">---</span>;
  }

  const isNegative = num.isNegative();
  const isZero = num.isZero();

  const formatted = isQuantity
    ? `${num.toFixed(unit === 'meter' || unit === 'kg' ? 4 : 2)} ${unit || ''}`
    : PersonaEngine.fmt(num, currency);

  const sizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-base",
  };

  const colorClass = isNegative
    ? "text-[#EF4444]"
    : isZero
    ? "text-gray-600"
    : useGold
    ? "text-[#C5A059]"
    : "text-white";

  return (
    <div className={cn("font-mono text-right", sizeClasses[size], colorClass, className)}>
      {showSign && !isNegative && !isZero && "+"}
      {formatted}
    </div>
  );
}
