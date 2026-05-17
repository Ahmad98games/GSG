"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimation } from "framer-motion";

export function useRowHighlight(value: unknown) {
  const controls = useAnimation();
  const prevValue = useRef(value);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    if (JSON.stringify(prevValue.current) !== JSON.stringify(value)) {
      controls.start({
        backgroundColor: ["rgba(0, 112, 243, 0)", "rgba(0, 112, 243, 0.15)", "rgba(0, 112, 243, 0)"],
        transition: { duration: 1, ease: "easeOut" }
      });
      prevValue.current = value;
    }
  }, [value, controls, isFirstRender]);

  return controls;
}
