"use client";

import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Decimal } from "decimal.js";
import { PersonaEngine } from "@/lib/persona/PersonaEngine";

interface AnimatedNumberProps {
  value: Decimal | number | string;
  duration?: number;
  className?: string;
  isCurrency?: boolean;
}

export default function AnimatedNumber({ value, duration = 0.6, className, isCurrency = true }: AnimatedNumberProps) {
  const parseVal = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (v instanceof Decimal) return v.toNumber();
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    return 0;
  };

  const numValue = parseVal(value);
  const count = useMotionValue(numValue);
  const rounded = useTransform(count, (latest) => {
    if (isNaN(latest)) return "0";
    return isCurrency ? PersonaEngine.fmt(latest) : Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    const controls = animate(count, numValue, {
      duration: duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [numValue, count, duration]);

  return (
    <motion.span className={className}>
      {rounded}
    </motion.span>
  );
}
