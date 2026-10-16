"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";

export default function RootLoading() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-200 ${
        isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-black text-white"
      }`}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Brand Pill */}
        <div className="flex justify-center">
          <Skeleton isLight={isLight} className="h-6 w-36 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton isLight={isLight} className="h-9 w-64 mx-auto rounded-lg" />
          <Skeleton isLight={isLight} className="h-4 w-80 mx-auto rounded" />
        </div>

        {/* Shimmer Card Placeholder */}
        <div
          className={`border rounded-2xl p-6 space-y-4 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <Skeleton isLight={isLight} className="h-4 w-3/4 mx-auto rounded" />
          <Skeleton isLight={isLight} className="h-10 w-full rounded-xl" />
          <Skeleton isLight={isLight} className="h-10 w-full rounded-xl" />
          <div className="pt-2">
            <Skeleton isLight={isLight} className="h-10 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
