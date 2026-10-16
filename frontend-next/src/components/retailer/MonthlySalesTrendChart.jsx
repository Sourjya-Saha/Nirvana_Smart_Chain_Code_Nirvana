"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const CustomTooltip = ({ active, payload, isLight }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pos = data.percentageChange >= 0;
    return (
      <div
        className={`p-3 rounded-xl border text-xs shadow-xl ${
          isLight
            ? "bg-white border-neutral-200 text-neutral-900"
            : "bg-[#0d0e12] border-neutral-800 text-white"
        }`}
      >
        <div className="font-semibold text-neutral-400">
          {data.month} {data.year}
        </div>
        <div className={`text-base font-semibold mt-1 ${isLight ? "text-neutral-900" : "text-white"}`}>
          ₹{data.total.toLocaleString("en-IN")}
        </div>
        <div className="mt-0.5 font-medium flex items-center gap-1 text-neutral-400">
          {pos ? "+" : ""}
          {data.percentageChange}% vs last month
        </div>
      </div>
    );
  }
  return null;
};

export default function MonthlySalesTrendChart({ ordersData = [] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [mounted, setMounted] = useState(false);

  const activeOrders = ordersData || [];

  // Extract years deterministically from order timestamps
  const availableYears = [
    ...new Set([
      2024,
      2025,
      2026,
      ...activeOrders
        .map((order) => {
          if (!order.datetime) return null;
          const ts = Date.parse(order.datetime);
          return isNaN(ts) ? null : new Date(ts).getFullYear();
        })
        .filter(Boolean),
    ]),
  ].sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(2025);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Calculate monthly totals for the selected year
  const monthlyTotals = Array(12).fill(0);
  activeOrders.forEach((order) => {
    if (!order.datetime) return;
    const ts = Date.parse(order.datetime);
    if (isNaN(ts)) return;
    const d = new Date(ts);
    if (d.getFullYear() === selectedYear) {
      monthlyTotals[d.getMonth()] += Number(order.total) || 0;
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const salesData = monthNames.map((month, idx) => ({
    month,
    year: selectedYear,
    total: monthlyTotals[idx],
  }));

  // MoM percentage calculation
  const dataWithChanges = salesData.map((item, index) => {
    if (index === 0) return { ...item, percentageChange: 0 };
    const prev = salesData[index - 1];
    const percentageChange =
      prev.total > 0 ? (((item.total - prev.total) / prev.total) * 100).toFixed(1) : 0;
    return { ...item, percentageChange: Number(percentageChange) };
  });

  // Latest active month
  const activeMonths = dataWithChanges.filter((d) => d.total > 0);
  const latestItem = activeMonths[activeMonths.length - 1] || dataWithChanges[dataWithChanges.length - 1];
  const latestChange = latestItem?.percentageChange || 0;
  const isPositive = latestChange >= 0;

  return (
    <div
      className={`${
        isLight
          ? "bg-white border-neutral-200"
          : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
      } border rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div className="space-y-1">
          <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
            Monthly Sales Trend
          </h3>
          <p className="text-xs text-neutral-400">Revenue velocity and month-over-month dispensary performance</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
            <span className="whitespace-nowrap">
              Trending {isPositive ? "up" : "down"} {Math.abs(latestChange)}%
            </span>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-normal outline-none transition-all cursor-pointer ${
              isLight
                ? "bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-neutral-400"
                : "bg-[#13141a] border-neutral-800 text-neutral-200 hover:border-neutral-700"
            }`}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className={isLight ? "bg-white text-neutral-900" : "bg-[#13141a] text-white"}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80 min-h-[280px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataWithChanges} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isLight ? "#737373" : "#a3a3a3", fontSize: 11, fontFamily: "inherit" }}
              />
              <YAxis
                hide={true}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip isLight={isLight} />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#salesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
            Loading charts...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/80">
        <span>January – December {selectedYear}</span>
        <span className={isLight ? "text-neutral-700 font-medium" : "text-neutral-300 font-medium"}>
          Sales Records
        </span>
      </div>
    </div>
  );
}
