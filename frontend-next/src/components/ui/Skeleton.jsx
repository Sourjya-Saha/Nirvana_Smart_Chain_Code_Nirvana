"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

/**
 * Hook to dynamically resolve theme state (falling back to ThemeContext if isLight prop is omitted)
 */
export function useIsLight(propIsLight) {
  try {
    const { theme } = useTheme();
    if (propIsLight !== undefined && propIsLight !== null) {
      return Boolean(propIsLight);
    }
    return theme === "light";
  } catch {
    return Boolean(propIsLight);
  }
}

/**
 * Base Shimmer Skeleton Element
 */
export function Skeleton({ className, isLight: isLightProp, ...props }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div
      className={cn(
        "shimmer-mask rounded-md",
        isLight ? "bg-neutral-200/90" : "bg-neutral-800/70",
        className
      )}
      {...props}
    />
  );
}

/**
 * Metric / Stat Card Skeleton
 */
export function StatCardSkeleton({ isLight: isLightProp, className }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div
      className={cn(
        "border rounded-2xl p-5 space-y-3 transition-colors",
        isLight
          ? "bg-white border-neutral-200 shadow-sm"
          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton isLight={isLight} className="h-3.5 w-24 rounded" />
        <Skeleton isLight={isLight} className="w-5 h-5 rounded-full" />
      </div>
      <Skeleton isLight={isLight} className="h-8 w-28 rounded-lg my-1" />
      <div className="flex items-center gap-2">
        <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
        <Skeleton isLight={isLight} className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

/**
 * Table Rows Skeleton (renders <tr> elements for inside <tbody>)
 */
export function TableSkeletonRows({ columns = 6, rows = 6, isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  const widths = ["w-32", "w-24", "w-28", "w-16", "w-20", "w-16"];

  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={rIdx}
          className={`border-b transition-colors ${
            isLight
              ? "border-neutral-100 hover:bg-neutral-50/50"
              : "border-neutral-800/50 hover:bg-white/[0.02]"
          }`}
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="py-4 px-4">
              {cIdx === 0 ? (
                <div className="flex items-center gap-2.5">
                  <Skeleton isLight={isLight} className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton isLight={isLight} className="h-3.5 w-28 rounded" />
                    <Skeleton isLight={isLight} className="h-2.5 w-16 rounded" />
                  </div>
                </div>
              ) : cIdx === columns - 1 ? (
                <div className="flex justify-end">
                  <Skeleton isLight={isLight} className="h-7 w-16 rounded-full" />
                </div>
              ) : (
                <Skeleton
                  isLight={isLight}
                  className={cn("h-3 rounded", widths[cIdx % widths.length])}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Full Table Container Card Skeleton (with search, headers, rows, and pagination)
 */
export function TableCardSkeleton({
  columns = 6,
  rows = 6,
  isLight: isLightProp,
  headers = ["Item / Drug Name", "Category", "Batch ID", "Quantity", "Price", "Action"],
}) {
  const isLight = useIsLight(isLightProp);
  return (
    <div
      className={`border rounded-2xl p-5 sm:p-6 space-y-5 ${
        isLight
          ? "bg-white border-neutral-200 shadow-sm"
          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
      }`}
    >
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton isLight={isLight} className="h-5 w-44 rounded-md" />
          <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton isLight={isLight} className="h-9 w-48 sm:w-64 rounded-full" />
          <Skeleton isLight={isLight} className="h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200/50 dark:border-neutral-800/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              className={`border-b ${
                isLight
                  ? "bg-neutral-50/80 border-neutral-200 text-neutral-500"
                  : "bg-[#14151a] border-neutral-800 text-neutral-400"
              }`}
            >
              {headers.slice(0, columns).map((h, i) => (
                <th key={i} className="py-3 px-4 font-medium text-xs">
                  <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/50"}`}>
            <TableSkeletonRows columns={columns} rows={rows} isLight={isLight} />
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Skeleton isLight={isLight} className="h-3 w-36 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
          <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
          <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
          <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Daily Sales Activity Chart Card Skeleton
 */
export function DailySalesChartSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  // Simulated bar heights
  const barHeights = [25, 40, 60, 30, 75, 45, 90, 65, 35, 80, 50, 70, 40, 85, 95, 60, 30, 45, 70, 55];

  return (
    <div
      className={`border rounded-2xl p-5 sm:p-6 space-y-6 ${
        isLight
          ? "bg-white border-neutral-200 shadow-sm"
          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
      }`}
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton isLight={isLight} className="h-5 w-44 rounded-md" />
            <Skeleton isLight={isLight} className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton isLight={isLight} className="h-9 w-28 rounded-full" />
          <Skeleton isLight={isLight} className="h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* Monthly Summary Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14151a] border-neutral-800/80"
        }`}
      >
        <div className="space-y-1">
          <Skeleton isLight={isLight} className="h-2.5 w-24 rounded" />
          <Skeleton isLight={isLight} className="h-7 w-36 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton isLight={isLight} className="h-7 w-28 rounded-full" />
          <Skeleton isLight={isLight} className="h-7 w-24 rounded-full" />
        </div>
      </div>

      {/* Simulated Wave / Bar Graph Canvas */}
      <div className="h-64 sm:h-72 w-full flex items-end gap-2 sm:gap-3 px-2 pt-8 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        {barHeights.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
            <Skeleton
              isLight={isLight}
              className="w-full rounded-t-md"
              style={{ height: `${h}%` }}
            />
            <Skeleton isLight={isLight} className="h-2 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Warehouse / Inventory Rack Card Skeleton
 */
export function WarehouseCardSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all ${
        isLight
          ? "bg-white border-neutral-200 shadow-sm"
          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <Skeleton isLight={isLight} className="h-5 w-20 rounded-md" />
        <Skeleton isLight={isLight} className="h-5 w-14 rounded-md" />
      </div>

      <div
        className={`h-36 rounded-xl border flex items-center justify-center p-3 ${
          isLight ? "bg-white border-neutral-100" : "bg-[#14151a] border-neutral-800/60"
        }`}
      >
        <Skeleton isLight={isLight} className="w-20 h-20 rounded-xl" />
      </div>

      <div className="space-y-1.5 pt-1">
        <Skeleton isLight={isLight} className="h-4 w-36 rounded" />
        <Skeleton isLight={isLight} className="h-3 w-48 rounded" />
      </div>

      <div
        className={`flex items-center justify-between pt-3 border-t text-xs ${
          isLight ? "border-neutral-100" : "border-neutral-800/80"
        }`}
      >
        <Skeleton isLight={isLight} className="h-3.5 w-16 rounded" />
        <Skeleton isLight={isLight} className="h-3.5 w-24 rounded" />
      </div>
    </div>
  );
}

/**
 * Dedicated Warehouse Page Skeleton (Matches exact UI of /retailer/warehouse)
 */
export function WarehousePageSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* 1. Top Command & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton isLight={isLight} className="h-10 w-full sm:max-w-md rounded-full" />
        <Skeleton isLight={isLight} className="h-10 w-36 rounded-full" />
      </div>

      {/* 2. Hero Banner Skeleton */}
      <div
        className={`relative rounded-3xl p-6 sm:p-10 lg:p-12 border overflow-hidden transition-all ${
          isLight
            ? "bg-white border-neutral-200/90 shadow-sm"
            : "bg-[#0d0e14] border-neutral-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        }`}
      >
        <div className="max-w-2xl space-y-5">
          <Skeleton isLight={isLight} className="h-6 w-36 rounded-full" />
          <div className="space-y-2">
            <Skeleton isLight={isLight} className="h-10 sm:h-12 w-4/5 rounded-xl" />
            <Skeleton isLight={isLight} className="h-4 w-full rounded" />
            <Skeleton isLight={isLight} className="h-4 w-3/5 rounded" />
          </div>

          {/* 3 Real Stats Pill Box */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border grid grid-cols-3 gap-3 ${
              isLight
                ? "bg-neutral-50/80 border-neutral-200"
                : "bg-[#14151e]/80 border-neutral-800"
            }`}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5 text-center sm:text-left">
                <Skeleton isLight={isLight} className="h-7 w-16 rounded-md mx-auto sm:mx-0" />
                <Skeleton isLight={isLight} className="h-3 w-20 rounded mx-auto sm:mx-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Featured Categories Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-200/70 dark:border-neutral-800/80 pb-3">
          <div className="space-y-1.5">
            <Skeleton isLight={isLight} className="h-5 w-48 rounded" />
            <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-8 w-36 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-5 space-y-3.5 ${
                isLight
                  ? "bg-white border-neutral-200 shadow-sm"
                  : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <Skeleton isLight={isLight} className="w-9 h-9 rounded-xl" />
                <Skeleton isLight={isLight} className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton isLight={isLight} className="h-4 w-32 rounded" />
              <Skeleton isLight={isLight} className="h-3 w-40 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Shelves & Catalog Grid Skeleton */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/70 dark:border-neutral-800/80 pb-3">
          <div className="space-y-1.5">
            <Skeleton isLight={isLight} className="h-6 w-60 rounded" />
            <Skeleton isLight={isLight} className="h-3.5 w-72 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-4 w-28 rounded" />
        </div>

        {/* Shelf bay pill tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} isLight={isLight} className="h-9 w-24 rounded-full shrink-0" />
          ))}
        </div>

        {/* Product Catalog Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <WarehouseCardSkeleton key={i} isLight={isLight} />
          ))}
        </div>
      </div>

      {/* 5. Full-width Operations Banner Skeleton */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 ${
          isLight
            ? "bg-white border-neutral-200 shadow-sm"
            : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        <div className="space-y-2 max-w-xl">
          <Skeleton isLight={isLight} className="h-3 w-36 rounded" />
          <Skeleton isLight={isLight} className="h-6 w-72 rounded" />
          <Skeleton isLight={isLight} className="h-3.5 w-full rounded" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Skeleton isLight={isLight} className="h-9 w-36 rounded-full" />
          <Skeleton isLight={isLight} className="h-9 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Backward compatibility alias for WarehouseSkeletonGrid
 */
export function WarehouseSkeletonGrid({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return <WarehousePageSkeleton isLight={isLight} />;
}

/**
 * Dedicated Products Page Skeleton (Matches exact UI of /retailer/products)
 */
export function ProductsPageSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 3 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCardSkeleton isLight={isLight} />
        <StatCardSkeleton isLight={isLight} />
        <StatCardSkeleton isLight={isLight} />
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Skeleton isLight={isLight} className="h-10 w-full sm:max-w-md rounded-xl" />
        <div className="flex items-center gap-3 justify-end">
          <Skeleton isLight={isLight} className="h-9 w-24 rounded-full" />
          <Skeleton isLight={isLight} className="h-9 w-36 rounded-full" />
        </div>
      </div>

      {/* 11-Column Products Table Card */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
          isLight
            ? "bg-white border-neutral-200 shadow-sm"
            : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <div className="space-y-1">
            <Skeleton isLight={isLight} className="h-5 w-44 rounded" />
            <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-5 w-28 rounded-full" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  isLight
                    ? "border-neutral-200 bg-neutral-50/60 text-neutral-500"
                    : "border-neutral-800 bg-[#14151a] text-neutral-400"
                }`}
              >
                {[
                  "Item #",
                  "Product Name",
                  "Shelf",
                  "Exp Date",
                  "UOM",
                  "Stock",
                  "Price",
                  "Category",
                  "Batch ID",
                  "Status",
                  "Actions",
                ].map((_, i) => (
                  <th key={i} className="py-3 px-3 font-semibold text-xs">
                    <Skeleton isLight={isLight} className="h-3 w-12 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
              <TableSkeletonRows columns={11} rows={6} isLight={isLight} />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Skeleton isLight={isLight} className="h-3 w-36 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dedicated Orders Page Skeleton (Matches exact UI of /retailer/orders)
 */
export function OrdersPageSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton isLight={isLight} className="h-10 w-full sm:max-w-md rounded-xl" />
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Skeleton isLight={isLight} className="h-9 w-28 rounded-full" />
          <Skeleton isLight={isLight} className="h-9 w-32 rounded-full" />
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCardSkeleton isLight={isLight} />
        <StatCardSkeleton isLight={isLight} />
        <StatCardSkeleton isLight={isLight} />
        <StatCardSkeleton isLight={isLight} />
      </div>

      {/* Orders Table Container */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
          isLight
            ? "bg-white border-neutral-200 shadow-sm"
            : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <div className="space-y-1">
            <Skeleton isLight={isLight} className="h-5 w-40 rounded" />
            <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-5 w-24 rounded-full" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  isLight
                    ? "border-neutral-200 bg-neutral-50/60 text-neutral-500"
                    : "border-neutral-800 bg-[#14151a] text-neutral-400"
                }`}
              >
                {[
                  "Order ID",
                  "Customer Name",
                  "Date & Time",
                  "Contact Phone",
                  "Total Bill",
                  "Status",
                  "Actions",
                ].map((_, i) => (
                  <th key={i} className="py-3 px-4 font-semibold text-xs">
                    <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-900/80"}`}>
              <TableSkeletonRows columns={7} rows={6} isLight={isLight} />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Skeleton isLight={isLight} className="h-3 w-36 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dedicated Shipments Page Skeleton (Matches exact UI of /retailer/shipment)
 */
export function ShipmentsPageSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Smart Contract Registry Header Card */}
      <div
        className={`border rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight
            ? "bg-white border-neutral-200 shadow-sm"
            : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton isLight={isLight} className="w-4 h-4 rounded" />
            <Skeleton isLight={isLight} className="h-5 w-48 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
        </div>
        <Skeleton isLight={isLight} className="h-9 w-36 rounded-full" />
      </div>

      {/* Shipments Table Container Card */}
      <div
        className={`border rounded-2xl p-6 sm:p-7 space-y-6 ${
          isLight
            ? "bg-white border-neutral-200 shadow-sm"
            : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4">
          <div className="space-y-1">
            <Skeleton isLight={isLight} className="h-5 w-44 rounded" />
            <Skeleton isLight={isLight} className="h-3 w-56 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-8 w-48 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  isLight
                    ? "border-neutral-200 bg-neutral-50/60 text-neutral-500"
                    : "border-neutral-800 bg-[#14151a] text-neutral-400"
                }`}
              >
                {[
                  "Cart ID",
                  "Date",
                  "Manufacturer",
                  "Wholesaler Hub",
                  "Status",
                  "Actions",
                ].map((_, i) => (
                  <th key={i} className="py-3 px-3 font-semibold text-xs">
                    <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
              <TableSkeletonRows columns={6} rows={6} isLight={isLight} />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Skeleton isLight={isLight} className="h-3 w-36 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dedicated Transactions Page Skeleton (Matches exact UI of /retailer/transactions)
 */
export function TransactionsPageSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Search & Total Recorded Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton isLight={isLight} className="h-10 w-full sm:max-w-md rounded-xl" />
        <Skeleton isLight={isLight} className="h-8 w-32 rounded-xl" />
      </div>

      {/* Transactions Table Card */}
      <div
        className={`border rounded-2xl p-6 sm:p-7 space-y-6 ${
          isLight
            ? "bg-white border-neutral-200 shadow-sm"
            : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <div className="space-y-1">
            <Skeleton isLight={isLight} className="h-5 w-48 rounded" />
            <Skeleton isLight={isLight} className="h-3 w-64 rounded" />
          </div>
          <Skeleton isLight={isLight} className="h-5 w-24 rounded-full" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  isLight
                    ? "border-neutral-200 bg-neutral-50/60 text-neutral-500"
                    : "border-neutral-800 bg-[#14151a] text-neutral-400"
                }`}
              >
                {[
                  "Order ID",
                  "Supplier / Manufacturer",
                  "Direction",
                  "Date & Time",
                  "Status",
                  "Actions",
                ].map((_, i) => (
                  <th key={i} className="py-3 px-3 font-semibold text-xs">
                    <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
              <TableSkeletonRows columns={6} rows={6} isLight={isLight} />
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Skeleton isLight={isLight} className="h-3 w-36 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-8 rounded-full" />
            <Skeleton isLight={isLight} className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Complete Retailer Dashboard Skeleton
 */
export function RetailerDashboardSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} isLight={isLight} />
        ))}
      </div>

      {/* Daily Sales Graph Section */}
      <DailySalesChartSkeleton isLight={isLight} />

      {/* Two Column Grid: Stock Distribution + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`border rounded-2xl p-6 space-y-4 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <div className="flex justify-between items-center">
            <Skeleton isLight={isLight} className="h-5 w-40 rounded" />
            <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton isLight={isLight} className="h-3 w-32 rounded" />
                  <Skeleton isLight={isLight} className="h-3 w-12 rounded" />
                </div>
                <Skeleton isLight={isLight} className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-6 space-y-4 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <div className="flex justify-between items-center">
            <Skeleton isLight={isLight} className="h-5 w-40 rounded" />
            <Skeleton isLight={isLight} className="h-4 w-12 rounded-full" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isLight ? "border-neutral-200 bg-neutral-50/50" : "border-neutral-800 bg-[#16171d]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Skeleton isLight={isLight} className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton isLight={isLight} className="h-3.5 w-36 rounded" />
                    <Skeleton isLight={isLight} className="h-2.5 w-24 rounded" />
                  </div>
                </div>
                <Skeleton isLight={isLight} className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Prescription Orders Table */}
      <TableCardSkeleton
        columns={6}
        rows={6}
        isLight={isLight}
        headers={["Order ID", "Customer / Buyer", "Prescription", "Items", "Amount", "Status"]}
      />
    </div>
  );
}

/**
 * Complete Retailer Details Skeleton
 */
export function RetailerDetailsSkeleton({ isLight: isLightProp }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 6 Metric Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} isLight={isLight} />
        ))}
      </div>

      {/* Daily Sales Activity Chart */}
      <DailySalesChartSkeleton isLight={isLight} />

      {/* Top Selling Products Table */}
      <TableCardSkeleton
        columns={5}
        rows={6}
        isLight={isLight}
        headers={["Product Name", "Units Sold", "Total Revenue", "Performance", "Action"]}
      />

      {/* Order Values & Statistics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`border rounded-2xl p-6 space-y-4 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <Skeleton isLight={isLight} className="h-5 w-48 rounded" />
          <div className="h-48 flex items-end gap-4 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <Skeleton isLight={isLight} className="w-full rounded-t-md" style={{ height: `${(i + 1) * 22}%` }} />
                <Skeleton isLight={isLight} className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-6 space-y-4 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <Skeleton isLight={isLight} className="h-5 w-48 rounded" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60">
                <Skeleton isLight={isLight} className="h-4 w-32 rounded" />
                <Skeleton isLight={isLight} className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Table Page Skeleton (Products, Orders, Shipments, Transactions)
 */
export function GenericTablePageSkeleton({
  isLight: isLightProp,
  columns = 6,
  rows = 6,
  headers,
}) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <TableCardSkeleton
        columns={columns}
        rows={rows}
        isLight={isLight}
        headers={headers}
      />
    </div>
  );
}

/**
 * Stakeholder Dashboard Generic Skeleton
 */
export function RoleDashboardSkeleton({ isLight: isLightProp, roleName }) {
  const isLight = useIsLight(isLightProp);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} isLight={isLight} />
        ))}
      </div>

      <DailySalesChartSkeleton isLight={isLight} />

      <TableCardSkeleton
        columns={7}
        rows={6}
        isLight={isLight}
        headers={["Cart ID", "Wholesaler", "Retailer", "Date", "Manufacturer", "Status", "Actions"]}
      />
    </div>
  );
}
