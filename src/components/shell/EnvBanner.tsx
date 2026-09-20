"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export function EnvBanner() {
  const isEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

  if (isEmulator) {
    return null;
  }

  return (
    <div className="w-full h-8 bg-crimson text-on-ink flex items-center justify-center gap-2 text-xs font-bold tracking-wide shadow-xs shrink-0 select-none z-50">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>PRODUCTION — changes are live.</span>
    </div>
  );
}
