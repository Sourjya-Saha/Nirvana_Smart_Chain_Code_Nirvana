"use client";

import React from "react";
import DistributorLayout from "@/components/DistributorLayout";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";

export default function DistributorLoading() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <DistributorLayout
      title="Loading Logistics Console..."
      subtitle="Connecting to carrier network, route telemetry, and cold-chain monitoring..."
      badge="Distributor Logistics"
    >
      <RoleDashboardSkeleton isLight={isLight} />
    </DistributorLayout>
  );
}
