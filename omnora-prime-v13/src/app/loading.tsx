"use client";

import React from "react";
import { NoxisLogoLoader } from "@/components/ui/NoxisLogoLoader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full bg-[#070809]">
      <NoxisLogoLoader label="Loading Module..." fullScreen={false} />
    </div>
  );
}
