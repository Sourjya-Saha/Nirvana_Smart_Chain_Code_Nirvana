"use client";

import React, { useState, useEffect, useMemo } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ShipmentOrderDialog from "@/components/retailer/ShipmentOrderDialog";
import TablePagination from "@/components/retailer/TablePagination";
import ProductPreviewModal from "@/components/retailer/ProductPreviewModal";
import { RetailerDetailsSkeleton } from "@/components/ui/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  Package,
  Layers,
  IndianRupee,
  Search,
  Truck,
  ArrowUpRight,
  Calendar,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Robust date parsing for order timestamps (supports standard MySQL datetime strings)
const parseOrderDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === "string") {
    const normalized = dateVal.replace(" ", "T");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
    const d2 = new Date(Date.parse(dateVal));
    if (!isNaN(d2.getTime())) return d2;
  }
  const d3 = new Date(dateVal);
  if (!isNaN(d3.getTime())) return d3;
  return null;
};

export default function RetailerDetailsPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [productsData, setProductsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(9); // October
  const [selectedYear, setSelectedYear] = useState(2024);
  const [topSearch, setTopSearch] = useState("");
  const [restockSearch, setRestockSearch] = useState("");
  const [topProductsPage, setTopProductsPage] = useState(1);
  const [restockPage, setRestockPage] = useState(1);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  // Dynamically compute available years based on ordersData from API
  const availableYears = useMemo(() => {
    const yearsSet = new Set([2024, 2025, 2026]);
    if (Array.isArray(ordersData)) {
      ordersData.forEach((order) => {
        const d = parseOrderDate(order.datetime);
        if (d && !isNaN(d.getFullYear())) {
          yearsSet.add(d.getFullYear());
        }
      });
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [ordersData]);

  // If initial year has no orders but ordersData has orders in another year (e.g. 2024), default to that year and month
  useEffect(() => {
    if (Array.isArray(ordersData) && ordersData.length > 0) {
      const hasOrdersInSelectedYear = ordersData.some((o) => {
        const d = parseOrderDate(o.datetime);
        return d && d.getFullYear() === selectedYear;
      });

      if (!hasOrdersInSelectedYear) {
        const yearsWithOrders = ordersData
          .map((o) => {
            const d = parseOrderDate(o.datetime);
            return d ? d.getFullYear() : null;
          })
          .filter(Boolean)
          .sort((a, b) => b - a);

        if (yearsWithOrders.length > 0) {
          const targetYear = yearsWithOrders[0];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedYear(targetYear);
          const latestOrder = ordersData.find((o) => {
            const d = parseOrderDate(o.datetime);
            return d && d.getFullYear() === targetYear;
          });
          if (latestOrder) {
            const d = parseOrderDate(latestOrder.datetime);
            if (d && !isNaN(d.getMonth())) {
              setSelectedMonth(d.getMonth());
            }
          }
        }
      }
    }
  }, [ordersData]);

  // Reorder dialog state
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        let prods = [];
        let ords = [];

        if (userId) {
          try {
            const [prodRes, ordRes] = await Promise.all([
              fetch(`${API_BASE}/getProducts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
              }),
              fetch(`${API_BASE}/getAllOrders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
              }),
            ]);

            if (prodRes.ok) {
              const pData = await prodRes.json();
              if (Array.isArray(pData)) prods = pData;
            }
            if (ordRes.ok) {
              const oData = await ordRes.json();
              if (Array.isArray(oData)) ords = oData;
            }
          } catch (e) {
            console.error("Backend API fetch error in details:", e);
          }
        }

        setProductsData(prods);
        setOrdersData(ords);
      } catch (err) {
        console.error("Error loading store details:", err);
        setProductsData([]);
        setOrdersData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Top Selling Products calculation
  const topSellingProducts = useMemo(() => {
    const map = {};

    if (ordersData && ordersData.length > 0) {
      ordersData.forEach((order) => {
        if (order.order_details && Array.isArray(order.order_details)) {
          order.order_details.forEach((item) => {
            const pName = item.product_name || "Prescription Medicine";
            const qty = Number(item.quantity) || 1;
            const price = Number(item.total_price) || 0;

            if (!map[pName]) {
              map[pName] = { totalSales: 0, quantitySold: 0 };
            }
            map[pName].totalSales += price;
            map[pName].quantitySold += qty;
          });
        }
      });
    }

    return Object.entries(map)
      .map(([name, data]) => {
        const found = productsData.find((p) => p.name === name);
        return {
          id: found?.product_id ?? found?.id ?? "N/A",
          name,
          category: found?.category || "General",
          price_per_unit: found?.price_per_unit || 0,
          quantity_of_uom: found?.quantity_of_uom ?? found?.quantity ?? 0,
          shelf_num: found?.shelf_num || null,
          picture: found?.picture_of_the_prod || null,
          totalSales: data.totalSales,
          quantitySold: data.quantitySold,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [ordersData, productsData]);

  // Products to Restock (quantity < 10)
  const restockProducts = useMemo(() => {
    return productsData.filter((p) => {
      const qty = Number(p.quantity_of_uom ?? p.quantity ?? 0);
      return qty < 10;
    });
  }, [productsData]);

  // Order Values Statistics calculation
  const orderStats = useMemo(() => {
    if (!ordersData || ordersData.length === 0) {
      return { average: 0, highest: 0, lowest: 0, median: 0, totalOrders: 0, totalRevenue: 0 };
    }

    const values = ordersData.map((o) => Number(o.total) || 0);
    const totalRevenue = values.reduce((sum, v) => sum + v, 0);
    const average = totalRevenue / values.length || 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const highest = Math.max(...values, 0);
    const lowest = Math.min(...values, 0);

    return {
      average: Math.round(average),
      highest,
      lowest,
      median: Math.round(median),
      totalOrders: ordersData.length,
      totalRevenue,
    };
  }, [ordersData]);

  // Order values bar chart dataset
  const orderValuesBarData = useMemo(() => {
    return [
      { name: "Average Order", value: orderStats.average },
      { name: "Highest Order", value: orderStats.highest },
      { name: "Lowest Order", value: orderStats.lowest },
      { name: "Median Order", value: orderStats.median },
    ];
  }, [orderStats]);

  // Daily Sales calculation for selected year and month
  const dailySalesData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dayMap = {};

    for (let d = 1; d <= daysInMonth; d++) {
      dayMap[d] = 0;
    }

    if (ordersData && ordersData.length > 0) {
      ordersData.forEach((order) => {
        try {
          const date = parseOrderDate(order.datetime);
          if (date && date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
            const day = date.getDate();
            if (dayMap[day] !== undefined) {
              dayMap[day] += Number(order.total) || 0;
            }
          }
        } catch (e) {
          console.warn("Date parse note:", e);
        }
      });
    }

    return Object.entries(dayMap).map(([day, total]) => ({
      date: Number(day),
      total: Number(total.toFixed(2)),
    }));
  }, [ordersData, selectedMonth, selectedYear]);

  const monthlyTotal = useMemo(() => {
    return Number(dailySalesData.reduce((sum, d) => sum + d.total, 0).toFixed(2));
  }, [dailySalesData]);

  const maxDaySales = useMemo(() => {
    return Math.max(...dailySalesData.map((d) => d.total), 0);
  }, [dailySalesData]);

  // Filtered Top Selling Products
  const filteredTopProducts = useMemo(() => {
    if (!topSearch.trim()) return topSellingProducts;
    const q = topSearch.toLowerCase();
    return topSellingProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [topSellingProducts, topSearch]);

  // Filtered Restock Products
  const filteredRestockProducts = useMemo(() => {
    if (!restockSearch.trim()) return restockProducts;
    const q = restockSearch.toLowerCase();
    return restockProducts.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [restockProducts, restockSearch]);

  const PAGE_SIZE = 6;

  const paginatedTopProducts = useMemo(() => {
    const start = (topProductsPage - 1) * PAGE_SIZE;
    return filteredTopProducts.slice(start, start + PAGE_SIZE);
  }, [filteredTopProducts, topProductsPage]);

  const paginatedRestockProducts = useMemo(() => {
    const start = (restockPage - 1) * PAGE_SIZE;
    return filteredRestockProducts.slice(start, start + PAGE_SIZE);
  }, [filteredRestockProducts, restockPage]);

  // Top 5 Products Donut breakdown
  const donutData = useMemo(() => {
    return topSellingProducts.slice(0, 5).map((p) => ({
      name: p.name,
      value: p.totalSales,
    }));
  }, [topSellingProducts]);

  const donutColors = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Purple
    "#ec4899", // Pink
  ];

  const handleOpenReorder = (prod) => {
    setSelectedProduct(prod);
    setShowOrderDialog(true);
  };

  const handleOrderConfirm = (orderPayload) => {
    setReorderSuccessMsg(`Restock order confirmed for ${orderPayload.preSelectedProduct?.name || selectedProduct?.name}!`);
    setTimeout(() => setReorderSuccessMsg(""), 6000);
  };

  return (
    <RetailerLayout
      title="Sales & Restock Insights"
      subtitle="Analyze your best-selling medicines, restock thresholds, daily customer sales, and order statistics."
      badge="Store Insights"
    >
      {loading ? (
        <RetailerDetailsSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-8">
        {/* Success Alert Banner */}
        {reorderSuccessMsg && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-300 ${
              isLight
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-black border-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reorderSuccessMsg}</span>
            </div>
            <button onClick={() => setReorderSuccessMsg("")} className="underline text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* 6 Metric Cards Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. Total Revenue */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-4 space-y-1.5`}
          >
            <span className="text-[10px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Total Revenue
            </span>
            <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{orderStats.totalRevenue.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-neutral-500">Gross customer sales</p>
          </div>

          {/* 2. Total Orders */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-4 space-y-1.5`}
          >
            <span className="text-[10px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Total Orders
            </span>
            <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {orderStats.totalOrders}
            </div>
            <p className="text-[11px] text-neutral-500">Orders completed</p>
          </div>

          {/* 3. Average Order */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-4 space-y-1.5`}
          >
            <span className="text-[10px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Average Order
            </span>
            <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{orderStats.average.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-neutral-500">Per transaction avg</p>
          </div>

          {/* 4. Highest Order */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-4 space-y-1.5`}
          >
            <span className="text-[10px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Highest Order
            </span>
            <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{orderStats.highest.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-neutral-500">Peak customer bill</p>
          </div>

          {/* 5. Median Order */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-4 space-y-1.5`}
          >
            <span className="text-[10px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Median Order
            </span>
            <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{orderStats.median.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-neutral-500">Middle baseline order</p>
          </div>

          {/* 6. Needs Restock */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-4 space-y-1.5`}
          >
            <span className="text-[10px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
              Low Stock Items
            </span>
            <div className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {restockProducts.length}
            </div>
            <p className="text-[11px] text-neutral-500">&lt; 10 units in stock</p>
          </div>
        </div>

        {/* Section 1: Top Selling Medicines Table */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-7 space-y-5`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div className="space-y-1">
              <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Top Selling Medicines
              </h3>
              <p className="text-xs text-neutral-400">Your highest-earning pharmaceutical products ranked by customer demand</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search medicine or category..."
                value={topSearch}
                onChange={(e) => {
                  setTopSearch(e.target.value);
                  setTopProductsPage(1);
                }}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-400"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-700"
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isLight ? "bg-neutral-50/80 border-neutral-200 text-neutral-500" : "bg-[#14151a] text-neutral-400 border-neutral-800"}`}>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Rank</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Medicine</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Category</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Price</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Sold Units</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filteredTopProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No medicines matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedTopProducts.map((p, idx) => {
                    const rank = (topProductsPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr
                        key={p.id || idx}
                        onClick={() => setHoveredProduct(p)}
                        className={`transition-colors cursor-pointer ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-white/[0.03]"
                        }`}
                        title="Click to view medicine details"
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold ${
                              rank === 1
                                ? isLight
                                  ? "bg-neutral-900 text-white"
                                  : "bg-white text-black"
                                : isLight
                                ? "bg-neutral-100 text-neutral-700"
                                : "bg-[#181a22] text-neutral-300"
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-3">
                            {p.picture ? (
                              <img
                                src={`data:image/jpeg;base64,${p.picture}`}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover border border-neutral-700/60 shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${
                                  isLight
                                    ? "bg-neutral-100 border-neutral-200 text-neutral-600"
                                    : "bg-[#181a22] border-neutral-800 text-neutral-300"
                                }`}
                              >
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>{p.name}</div>
                              <div className="text-[11px] text-neutral-400">
                                ID: {p.id} &bull; Shelf: {p.shelf_num}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                : "bg-[#16171d] text-neutral-300 border-neutral-800"
                            }`}
                          >
                            {p.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium">₹{p.price_per_unit}</td>
                        <td className="py-3.5 px-4 text-right font-medium">{p.quantitySold} units</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-sm">
                          ₹{Number(p.totalSales).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={topProductsPage}
            totalItems={filteredTopProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setTopProductsPage}
            isLight={isLight}
          />
        </div>

        {/* Section 2: Products to Restock (Low Stock Alert) */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-7 space-y-5`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${isLight ? "text-neutral-700" : "text-neutral-300"}`} />
                <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Medicines Needing Restock
                </h3>
              </div>
              <p className="text-xs text-neutral-400">Inventory items below the safety threshold (&lt; 10 units in dispensary stock)</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search restock list..."
                value={restockSearch}
                onChange={(e) => {
                  setRestockSearch(e.target.value);
                  setRestockPage(1);
                }}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-400"
                    : "bg-[#13141a] border-neutral-800 text-white focus:border-neutral-700"
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isLight ? "bg-neutral-50/80 border-neutral-200 text-neutral-500" : "bg-[#14151a] text-neutral-400 border-neutral-800"}`}>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Medicine</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Category</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Location</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Unit Price</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Current Stock</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {filteredRestockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      All medicines are well-stocked. No restock needed!
                    </td>
                  </tr>
                ) : (
                  paginatedRestockProducts.map((p, idx) => {
                    const rawQty = Number(p.quantity_of_uom ?? p.quantity ?? 0);
                    const unitLabel = p.uom_name || "units";
                    return (
                      <tr
                        key={p.id || idx}
                        onClick={() => setHoveredProduct(p)}
                        className={`transition-colors cursor-pointer ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-white/[0.03]"
                        }`}
                        title="Click to view medicine details"
                      >
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-3">
                            {p.picture_of_the_prod ? (
                              <img
                                src={`data:image/jpeg;base64,${p.picture_of_the_prod}`}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover border border-neutral-700/60 shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${
                                  isLight
                                    ? "bg-neutral-100 border-neutral-200 text-neutral-600"
                                    : "bg-[#181a22] border-neutral-800 text-neutral-300"
                                }`}
                              >
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>{p.name}</div>
                              <div className="text-[11px] text-neutral-400">
                                ID: {p.product_id ?? p.id ?? "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                : "bg-[#16171d] text-neutral-300 border-neutral-800"
                            }`}
                          >
                            {p.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                          {p.shelf_num ? `Shelf ${p.shelf_num}` : "Storage"}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium">₹{p.price_per_unit}</td>

                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                              rawQty === 0
                                ? isLight
                                  ? "bg-neutral-900 text-white border-neutral-900"
                                  : "bg-white text-black border-white"
                                : isLight
                                ? "bg-neutral-200 text-neutral-800 border-neutral-300"
                                : "bg-[#22242e] text-neutral-200 border-neutral-700"
                            }`}
                          >
                            {rawQty === 0 ? (
                              <AlertOctagon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            )}
                            {rawQty === 0 ? 0 : rawQty.toLocaleString("en-IN")} {unitLabel}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReorder(p);
                            }}
                            className={`h-8 px-4 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                              isLight
                                ? "bg-neutral-900 hover:bg-black text-white"
                                : "bg-white hover:bg-neutral-200 text-black"
                            }`}
                          >
                            Reorder
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={restockPage}
            totalItems={filteredRestockProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setRestockPage}
            isLight={isLight}
          />
        </div>

        {/* Section 3: Interactive Daily Sales Chart & Order Values Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Bar Chart */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-7 space-y-6 flex flex-col justify-between`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
              <div className="space-y-1">
                <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Daily Sales Activity
                </h3>
                <p className="text-xs text-neutral-400">Interactive revenue distribution for {MONTHS[selectedMonth]} {selectedYear}</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-right mr-1">
                  <div className="text-[11px] text-neutral-400">Month Total</div>
                  <div className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    ₹{monthlyTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Month Selector */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-normal outline-none transition-all cursor-pointer ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-neutral-400"
                      : "bg-[#13141a] border-neutral-800 text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx} className={isLight ? "bg-white text-neutral-900" : "bg-[#13141a] text-white"}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Year Selector */}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isLight ? "#737373" : "#a3a3a3", fontSize: 10, fontFamily: "inherit" }}
                  />
                  <YAxis hide={true} domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "#0d0e12",
                      border: isLight ? "1px solid #e5e5e5" : "1px solid #262626",
                      color: isLight ? "#171717" : "#ffffff",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/60">
              <span>Day 1st – {dailySalesData.length}th</span>
              <span className={isLight ? "text-neutral-800 font-semibold" : "text-neutral-200 font-semibold"}>
                Peak Day: ₹{maxDaySales.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Order Values Statistics Bar Chart */}
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-7 space-y-6 flex flex-col justify-between`}
          >
            <div className="space-y-1 border-b border-neutral-800/80 pb-4">
              <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Order Values Statistics
              </h3>
              <p className="text-xs text-neutral-400">Statistical spread of customer purchase basket sizes</p>
            </div>

            <div className="w-full h-72 sm:h-80 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderValuesBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isLight ? "#737373" : "#a3a3a3", fontSize: 11, fontFamily: "inherit" }}
                  />
                  <YAxis hide={true} domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "#0d0e12",
                      border: isLight ? "1px solid #e5e5e5" : "1px solid #262626",
                      color: isLight ? "#171717" : "#ffffff",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {orderValuesBarData.map((_, index) => (
                      <Cell
                        key={`val-bar-${index}`}
                        fill={donutColors[index % donutColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/80">
              <span>Total: {orderStats.totalOrders} Orders</span>
              <span className={isLight ? "text-neutral-800 font-semibold" : "text-neutral-200 font-semibold"}>
                Average: ₹{orderStats.average.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Top 5 Best Sellers Revenue Share Donut */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-7 space-y-6`}
        >
          <div className="space-y-1 border-b border-neutral-800/80 pb-4">
            <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              Revenue Distribution of Best Sellers
            </h3>
            <p className="text-xs text-neutral-400">Share of sales generated across your top 5 medicines</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="transparent"
                  >
                    {donutData.map((_, index) => (
                      <Cell key={`donut-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "#0d0e12",
                      border: isLight ? "1px solid #e5e5e5" : "1px solid #262626",
                      color: isLight ? "#171717" : "#ffffff",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400">
                Top Revenue Contributors
              </div>
              <div className="space-y-2">
                {donutData.map((p, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-xs p-3 rounded-xl border ${
                      isLight
                        ? "bg-neutral-50 border-neutral-200"
                        : "bg-[#13141a] border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: donutColors[idx % donutColors.length] }}
                      />
                      <span className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>
                        {p.name}
                      </span>
                    </div>
                    <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                      ₹{p.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Reorder Dialog Modal */}
      {showOrderDialog && (
        <ShipmentOrderDialog
          product={selectedProduct}
          isOpen={showOrderDialog}
          onClose={() => setShowOrderDialog(false)}
          onConfirm={handleOrderConfirm}
        />
      )}

      {/* Product Hover Preview Pop-up Modal with Blur Background */}
      {hoveredProduct && (
        <ProductPreviewModal
          product={hoveredProduct}
          onClose={() => setHoveredProduct(null)}
          isLight={isLight}
          onAction={handleOpenReorder}
          actionLabel="Reorder stock"
        />
      )}
    </RetailerLayout>
  );
}
