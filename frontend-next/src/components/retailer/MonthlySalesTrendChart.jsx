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
    const isZero = data.percentageChange === 0;

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
        {data.total > 0 && (
          <div className="mt-0.5 font-medium flex items-center gap-1">
            <span
              className={
                isZero
                  ? "text-neutral-400 font-semibold"
                  : pos
                  ? "text-emerald-400 font-semibold"
                  : "text-rose-400 font-semibold"
              }
            >
              {!isZero && (pos ? "+" : "")}
              {Math.abs(data.percentageChange) % 1 === 0
                ? data.percentageChange
                : Number(data.percentageChange).toFixed(1)}
              %
            </span>
            <span className="text-neutral-400">{data.comparisonLabel}</span>
          </div>
        )}
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
          const rawDate = order.datetime || order.date || order.created_at || order.order_date;
          if (!rawDate) return null;
          const ts = Date.parse(rawDate);
          return isNaN(ts) ? null : new Date(ts).getFullYear();
        })
        .filter(Boolean),
    ]),
  ].sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || new Date().getFullYear());
    }
  }, [availableYears, selectedYear]);

  // Calculate monthly totals for the selected year
  const monthlyTotals = Array(12).fill(0);
  activeOrders.forEach((order) => {
    const rawDate = order.datetime || order.date || order.created_at || order.order_date;
    if (!rawDate) return;
    const ts = Date.parse(rawDate);
    if (isNaN(ts)) return;
    const d = new Date(ts);
    if (d.getFullYear() === selectedYear) {
      const orderVal = Number(
        order.total ?? order.total_amount ?? order.total_price ?? order.amount ?? order.grand_total ?? 0
      );
      monthlyTotals[d.getMonth()] += orderVal;
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const salesData = monthNames.map((month, idx) => ({
    month,
    year: selectedYear,
    total: monthlyTotals[idx],
  }));

  // MoM & period-over-period percentage calculation
  const dataWithChanges = salesData.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        percentageChange: item.total > 0 ? 100 : 0,
        comparisonLabel: item.total > 0 ? "vs baseline" : "no sales",
      };
    }

    const prev = salesData[index - 1];

    // Case 1: Immediately preceding month had revenue
    if (prev.total > 0) {
      const change = Number((((item.total - prev.total) / prev.total) * 100).toFixed(1));
      return {
        ...item,
        percentageChange: change,
        comparisonLabel: `vs ${prev.month}`,
      };
    }

    // Case 2: Preceding month had 0, but current month has revenue
    if (item.total > 0) {
      // Look back for the most recent active sales month in the year
      let lastActive = null;
      for (let i = index - 1; i >= 0; i--) {
        if (salesData[i].total > 0) {
          lastActive = salesData[i];
          break;
        }
      }

      if (lastActive) {
        const change = Number((((item.total - lastActive.total) / lastActive.total) * 100).toFixed(1));
        return {
          ...item,
          percentageChange: change,
          comparisonLabel: `vs ${lastActive.month}`,
        };
      } else {
        return {
          ...item,
          percentageChange: 100,
          comparisonLabel: "vs baseline",
        };
      }
    }

    // Case 3: Both preceding and current months are 0
    return {
      ...item,
      percentageChange: 0,
      comparisonLabel: "no sales",
    };
  });

  // Calculate overall performance trend accurately
  const activeMonths = salesData.filter((d) => d.total > 0);
  let latestChange = 0;

  if (activeMonths.length >= 2) {
    // Compare the latest active month with sales to the preceding active month
    const latest = activeMonths[activeMonths.length - 1];
    const prevActive = activeMonths[activeMonths.length - 2];
    latestChange = Number((((latest.total - prevActive.total) / prevActive.total) * 100).toFixed(1));
  } else if (activeMonths.length === 1) {
    // Check if the prior year had recorded sales for a YoY benchmark
    const prevYearOrders = activeOrders.filter((order) => {
      const rawDate = order.datetime || order.date || order.created_at || order.order_date;
      if (!rawDate) return false;
      const ts = Date.parse(rawDate);
      return !isNaN(ts) && new Date(ts).getFullYear() === selectedYear - 1;
    });

    const prevYearTotal = prevYearOrders.reduce((sum, ord) => {
      return sum + Number(ord.total ?? ord.total_amount ?? ord.total_price ?? ord.amount ?? 0);
    }, 0);

    if (prevYearTotal > 0) {
      latestChange = Number((((activeMonths[0].total - prevYearTotal) / prevYearTotal) * 100).toFixed(1));
    } else {
      latestChange = 100;
    }
  } else {
    latestChange = 0;
  }

  const isPositive = latestChange >= 0;
  const formattedChange =
    Math.abs(latestChange) % 1 === 0
      ? Math.abs(latestChange).toString()
      : Math.abs(latestChange).toFixed(1);

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
              activeMonths.length === 0 || latestChange === 0
                ? isLight
                  ? "bg-neutral-100 text-neutral-600 border-neutral-200"
                  : "bg-neutral-800/80 text-neutral-400 border-neutral-700/60"
                : isPositive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {activeMonths.length === 0 ? (
              <span>No sales data</span>
            ) : latestChange === 0 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Stable (0%)</span>
              </>
            ) : (
              <>
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="whitespace-nowrap">
                  Trending {isPositive ? "up" : "down"} {formattedChange}%
                </span>
              </>
            )}
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
