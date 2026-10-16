"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

const METRIC_COLORS = [
  "#3b82f6", // Total Orders - Blue
  "#10b981", // Total Spent - Emerald
  "#8b5cf6", // Avg Order - Purple
  "#06b6d4", // Paid Orders - Cyan
  "#f59e0b", // Unpaid Orders - Amber
];

export default function TransactionMetricCharts({
  totalTransactions = 0,
  totalTransactionValue = 0,
  averageTransactionValue = 0,
  successfulTransactions = 0,
  failedTransactions = 0,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [mounted, setMounted] = useState(false);
  const barColors = METRIC_COLORS;

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: "Total Orders", value: totalTransactions, unit: "orders" },
    { name: "Total Spent", value: totalTransactionValue, unit: "₹" },
    { name: "Avg Order", value: Math.round(averageTransactionValue), unit: "₹" },
    { name: "Paid Orders", value: successfulTransactions, unit: "orders" },
    { name: "Unpaid Orders", value: failedTransactions, unit: "orders" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-xl ${
            isLight
              ? "bg-white border-neutral-200 text-neutral-900"
              : "bg-[#0d0e12] border-neutral-800 text-white"
          }`}
        >
          <div className="font-semibold text-neutral-400">{item.name}</div>
          <div className={`text-base font-semibold mt-1 ${isLight ? "text-neutral-900" : "text-white"}`}>
            {item.unit === "₹" ? `₹${Number(item.value).toLocaleString("en-IN")}` : `${item.value} Orders`}
          </div>
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
          Purchases & Orders Overview
        </h3>
        <p className="text-xs text-neutral-400">Breakdown of stock purchases, spend, and payment status</p>
      </div>

      <div className="w-full h-72 sm:h-80 min-h-[280px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isLight ? "#737373" : "#a3a3a3", fontSize: 11, fontFamily: "inherit" }}
              />
              <YAxis
                hide={true}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
            Loading metrics...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/80">
        <span>Payment Status</span>
        <span className={isLight ? "text-neutral-800 font-semibold" : "text-neutral-200 font-semibold"}>
          <span className="text-emerald-500 font-bold">{successfulTransactions} Paid</span> &bull; <span className="text-rose-500 font-bold">{failedTransactions} Unpaid</span>
        </span>
      </div>
    </div>
  );
}
