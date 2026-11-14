"use client";

import React, { Profiler } from "react";

export function RenderProfiler({
  id = "App",
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>;
  }

  return (
    <Profiler
      id={id}
      onRender={(profilerId, phase, duration) => {
        if (duration > 16) {
          // 16ms = 60fps threshold
          console.warn(`[RENDER] ${profilerId} ${phase} ${duration.toFixed(1)}ms`);
        }
      }}
    >
      {children}
    </Profiler>
  );
}

export default RenderProfiler;

