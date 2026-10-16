"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "@/context/ThemeContext";

const CATEGORY_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#6366f1", // Indigo
  "#ef4444", // Rose
];

export default function CategorySalesChart({ productsData = [] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [mounted, setMounted] = useState(false);
  const colors = CATEGORY_COLORS;

  useEffect(() => {
    setMounted(true);
  }, []);

  const categoryMap = {};
  if (productsData && productsData.length > 0) {
    productsData.forEach((p) => {
      const cat = p.category || p.category_name || "General Formulations";
      const qty = Number(p.quantity_of_uom ?? p.quantity ?? 0);
      categoryMap[cat] = (categoryMap[cat] || 0) + qty;
    });
  }

  const chartData =
    Object.keys(categoryMap).length > 0
      ? Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
      : [];

  const totalUnits = chartData.reduce((acc, c) => acc + c.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = totalUnits > 0 ? ((data.value / totalUnits) * 100).toFixed(1) : 0;
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-xl ${
            isLight
              ? "bg-white border-neutral-200 text-neutral-900"
              : "bg-[#0d0e12] border-neutral-800 text-white"
          }`}
        >
          <div className="font-semibold">{data.name}</div>
          <div className={`text-base font-semibold mt-1 ${isLight ? "text-neutral-900" : "text-white"}`}>
            {Number(data.value).toLocaleString()} Units
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">{pct}% of total stock</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`${
        isLight
          ? "bg-white border-neutral-200"
          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
      } border rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between`}
    >
      <div className="space-y-1 border-b border-neutral-800/80 pb-4">
        <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
          Stock by Category
        </h3>
        <p className="text-xs text-neutral-400">Total quantity of medicines in each category</p>
      </div>

      <div className="w-full h-72 sm:h-80 min-h-[280px] flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-xs text-neutral-400 text-center">
            No medicine categories registered in store yet.
          </div>
        ) : mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={108}
                paddingAngle={3}
                dataKey="value"
                stroke="transparent"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className={`text-[11px] ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    {value}
                  </span>
                )}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-xs text-neutral-500">
            Loading categories...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/80">
        <span>Total Categories: {chartData.length}</span>
        <span className={isLight ? "text-neutral-900 font-semibold" : "text-white font-semibold"}>
          {totalUnits.toLocaleString()} units
        </span>
      </div>
    </div>
  );
}
