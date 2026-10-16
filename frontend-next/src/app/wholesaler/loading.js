"use client";

import React from "react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";

export default function WholesalerLoading() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <WholesalerLayout
      title="Loading Depot Console..."
      subtitle="Validating inbound consignments, cold-chain custody, and stock reservations..."
      badge="Wholesaler Depot"
    >
      <RoleDashboardSkeleton isLight={isLight} />
    </WholesalerLayout>
  );
}
