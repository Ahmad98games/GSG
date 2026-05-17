"use client";

import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Decimal } from "decimal.js";
import { PersonaEngine } from "@/lib/persona/PersonaEngine";

interface AnimatedNumberProps {
  value: Decimal | number | string;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({ value, duration = 0.6, className }: AnimatedNumberProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value instanceof Decimal ? value.toNumber() : value);
  const count = useMotionValue(numValue);
  const rounded = useTransform(count, (latest) => PersonaEngine.fmt(latest));

  const prevValue = useRef(numValue);

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
