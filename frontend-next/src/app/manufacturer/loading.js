"use client";

import React from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";

export default function ManufacturerLoading() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <ManufacturerLayout
      title="Loading Production Console..."
      subtitle="Verifying cryptographic batches, chemical synthesis ledger, and consignment telemetry..."
      badge="Manufacturer Node"
    >
      <RoleDashboardSkeleton isLight={isLight} />
    </ManufacturerLayout>
  );
}
