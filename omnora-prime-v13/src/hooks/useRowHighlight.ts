"use client";

import { useEffect, useRef } from "react";
import { useAnimation } from "framer-motion";

export function useRowHighlight(value: unknown) {
  const controls = useAnimation();
  const prevValue = useRef(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (JSON.stringify(prevValue.current) !== JSON.stringify(value)) {
      controls.start({
        backgroundColor: ["rgba(0, 112, 243, 0)", "rgba(0, 112, 243, 0.15)", "rgba(0, 112, 243, 0)"],
        transition: { duration: 1, ease: "easeOut" }
      });
      prevValue.current = value;
    }
  }, [value, controls]);

  return controls;
}
