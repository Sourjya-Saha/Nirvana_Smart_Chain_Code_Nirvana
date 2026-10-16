"use client";

import React from "react";
import RetailerLayout from "@/components/RetailerLayout";
import { RetailerDashboardSkeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";

export default function RetailerLoading() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <RetailerLayout
      title="Loading Pharmacy Console..."
      subtitle="Fetching on-chain records, current inventory, and verified store analytics..."
      badge="Pharmacy"
    >
      <RetailerDashboardSkeleton isLight={isLight} />
    </RetailerLayout>
  );
}
