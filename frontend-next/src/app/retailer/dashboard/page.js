"use client";

import React, { useState, useEffect, useMemo } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Layers,
  Warehouse,
  IndianRupee,
  ClipboardList,
  AlertOctagon,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
} from "lucide-react";

import MonthlySalesTrendChart from "@/components/retailer/MonthlySalesTrendChart";
import CategorySalesChart from "@/components/retailer/CategorySalesChart";
import TransactionMetricCharts from "@/components/retailer/TransactionMetricCharts";
import NotificationsDropdown from "@/components/retailer/NotificationsDropdown";
import ShipmentOrderDialog from "@/components/retailer/ShipmentOrderDialog";
import ProductPreviewModal from "@/components/retailer/ProductPreviewModal";
import TablePagination from "@/components/retailer/TablePagination";
import { RetailerDashboardSkeleton } from "@/components/ui/Skeleton";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const TOP_COLORS = [
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

export default function RetailerDashboardPage() {
  const { userId, userName } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();
  const topColors = TOP_COLORS;

  const [productsData, setProductsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog & Notification states
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [stockAlertsPage, setStockAlertsPage] = useState(1);
  const STOCK_ALERTS_PAGE_SIZE = 6;

  // Month and Year selectors for daily sales graph
  const [selectedMonth, setSelectedMonth] = useState(9); // October
  const [selectedYear, setSelectedYear] = useState(2024);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

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

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Transactions
        const txRes = await fetch(`${API_BASE}/get_all_transactions_retailer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (txRes.ok) {
          const txJson = await txRes.json();
          setTransactionsData(Array.isArray(txJson) ? txJson : []);
        } else {
          setTransactionsData([]);
        }

        // 2. Products
        const prodRes = await fetch(`${API_BASE}/getProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProductsData(Array.isArray(prodJson) ? prodJson : []);
        } else {
          setProductsData([]);
        }

        // 3. Orders
        const ordRes = await fetch(`${API_BASE}/getAllOrders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (ordRes.ok) {
          const ordJson = await ordRes.json();
          setOrdersData(Array.isArray(ordJson) ? ordJson : []);
        } else {
          setOrdersData([]);
        }
      } catch (err) {
        console.error("Error fetching retailer dashboard data:", err);
        setTransactionsData([]);
        setProductsData([]);
        setOrdersData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle restock order flow
  const handleOrderShipment = (product) => {
    setSelectedProduct(product);
    setShowOrderDialog(true);
  };

  const handleOrderConfirm = (navigationState) => {
    router.push("/retailer/addtransaction");
  };

  // Stock alerts (out of stock = 0, low stock < 10)
  const stockAlerts = productsData
    .map((product) => {
      const rawQty = Number(product.quantity_of_uom ?? product.quantity ?? 0);
      const unitLabel = product.uom_name || "units";

      if (rawQty === 0) {
        return {
          message: `${product.name} is completely out of stock!`,
          type: "out-of-stock",
          product,
        };
      } else if (rawQty < 10) {
        return {
          message: `${product.name} reserves running critically low (${rawQty.toLocaleString("en-IN")} ${unitLabel} left)!`,
          type: "low-stock",
          product,
        };
      }
      return null;
    })
    .filter(Boolean);

  const paginatedStockAlerts = useMemo(() => {
    return stockAlerts.slice(
      (stockAlertsPage - 1) * STOCK_ALERTS_PAGE_SIZE,
      stockAlertsPage * STOCK_ALERTS_PAGE_SIZE
    );
  }, [stockAlerts, stockAlertsPage]);

  // Calculations
  const productCategories = [...new Set(productsData.map((p) => p.category || "General"))];
  const totalInventoryValue = productsData.reduce(
    (acc, p) => acc + (Number(p.price_per_unit || p.price || 0) * Number(p.quantity_of_uom ?? p.quantity ?? 0)),
    0
  );
  const outOfStockProducts = productsData.filter((p) => (p.quantity_of_uom ?? p.quantity ?? 0) === 0).length;

  // Shelves
  const shelvesSet = new Set();
  productsData.forEach((p) => {
    if (p.shelf_num) shelvesSet.add(p.shelf_num);
  });
  const numberOfWarehouses = shelvesSet.size;

  // Orders status counts
  let paidOrdersCount = 0;
  let unpaidOrdersCount = 0;
  ordersData.forEach((o) => {
    if ((o.status || "").toLowerCase() === "paid") paidOrdersCount++;
    else unpaidOrdersCount++;
  });
  const numberOfOrders = ordersData.length;
  const ordersPlaced = paidOrdersCount;
  const unpaidOrders = unpaidOrdersCount;

  // Transaction metrics
  const totalTransactions = transactionsData.length;
  const totalTransactionValue = transactionsData.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  const averageTransactionValue = totalTransactions > 0 ? totalTransactionValue / totalTransactions : 0;
  const successfulTransactions = transactionsData.filter((t) => (t.status || "").toLowerCase() === "paid").length;
  const failedTransactions = totalTransactions - successfulTransactions;

  // Revenue & MoM percent change
  const totalRevenue = ordersData.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const revenueChartData = ordersData.map((o) => {
    const d = parseOrderDate(o.datetime);
    return {
      date: d ? d.toLocaleDateString() : "—",
      amount: Number(o.total) || 0,
    };
  });

  // Daily sales data for chosen year and month strictly from API orders
  const dailySalesData = useMemo(() => {
    const salesByDay = {};

    if (Array.isArray(ordersData)) {
      ordersData.forEach((order) => {
        const d = parseOrderDate(order.datetime);
        if (!d) return;

        if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
          const day = d.getDate();
          salesByDay[day] = (salesByDay[day] || 0) + (Number(order.total) || 0);
        }
      });
    }

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        date: day,
        total: Number((salesByDay[day] || 0).toFixed(2)),
      });
    }
    return result;
  }, [ordersData, selectedMonth, selectedYear]);

  const monthlyTotal = useMemo(() => {
    return Number(dailySalesData.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  }, [dailySalesData]);

  const maxDaySales = useMemo(() => {
    return Math.max(...dailySalesData.map((i) => i.total), 0);
  }, [dailySalesData]);

  // Top 10 Selling Products
  const calculateTotalSalesByProduct = () => {
    const map = {};
    ordersData.forEach((order) => {
      if (Array.isArray(order.order_details)) {
        order.order_details.forEach((item) => {
          const name = item.product_name || "Unknown Product";
          map[name] = (map[name] || 0) + (Number(item.total_price) || 0);
        });
      }
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const top10Products = calculateTotalSalesByProduct();

  return (
    <RetailerLayout
      title="Pharmacy Dashboard"
      subtitle="Track your medicines, customer orders, daily sales, and stock reorders in one place."
      badge="Statistics"
      actions={
        <NotificationsDropdown
          userId={userId}
          initialOrders={ordersData}
          initialTransactions={transactionsData}
        />
      }
    >
      {loading ? (
        <RetailerDashboardSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-8">
        {/* 12 Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total Medicines */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Total Medicines
              </span>
              <Package className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {productsData.length}
            </div>
            <p className="text-[11px] text-neutral-500">Medicines in store</p>
          </div>

          {/* 2. Total Orders */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Total Orders
              </span>
              <ShoppingCart className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {numberOfOrders}
            </div>
            <p className="text-[11px] text-neutral-500">Customer orders received</p>
          </div>

          {/* 3. Medicine Categories */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Categories
              </span>
              <Layers className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {productCategories.length}
            </div>
            <p className="text-[11px] text-neutral-500">Types of medicines</p>
          </div>

          {/* 4. Medicine Shelves */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Medicine Shelves
              </span>
              <Warehouse className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {numberOfWarehouses}
            </div>
            <p className="text-[11px] text-neutral-500">Shelves in store</p>
          </div>

          {/* 5. Total Stock Value */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Total Stock Value
              </span>
              <IndianRupee className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{totalInventoryValue.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </div>
            <p className="text-[11px] text-neutral-500">Total value of stock</p>
          </div>

          {/* 6. Paid Orders */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Paid Orders
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {ordersPlaced}
            </div>
            <p className="text-[11px] text-neutral-500">Completed and paid</p>
          </div>

          {/* 7. Unpaid Orders */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Unpaid Orders
              </span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {unpaidOrders}
            </div>
            <p className="text-[11px] text-neutral-500">Awaiting customer payment</p>
          </div>

          {/* 8. Out of Stock */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Out of Stock
              </span>
              <AlertOctagon className="w-4 h-4 text-red-500" />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {outOfStockProducts}
            </div>
            <p className="text-[11px] text-neutral-500">Medicines with 0 stock</p>
          </div>

          {/* 9. Total Sales */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2 col-span-2 sm:col-span-1`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Total Sales
              </span>
              <TrendingUp className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="w-full h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <Line type="monotone" dataKey="amount" stroke={isLight ? "#171717" : "#ffffff"} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 10. Total Purchases */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Total Purchases
              </span>
              <ClipboardList className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{totalTransactionValue.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-neutral-500">Total spent on restock</p>
          </div>

          {/* 11. Stock Purchases */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Stock Purchases
              </span>
              <CheckCircle2 className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {totalTransactions}
            </div>
            <p className="text-[11px] text-neutral-500">Orders placed to suppliers</p>
          </div>

          {/* 12. Purchase Status */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Purchase Status
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-3xl font-light text-emerald-400">{successfulTransactions}</span>
              <span className="text-xs text-neutral-500">/</span>
              <span className="font-editorial text-2xl font-light text-rose-400">{failedTransactions} unpaid</span>
            </div>
            <p className="text-[11px] text-neutral-500">Paid vs unpaid stock orders</p>
          </div>
        </div>

        {/* Stock Alerts Section with Order Shipment Dialog Trigger */}
        {stockAlerts.length > 0 && (
          <div
            className={`${
              isLight
                ? "bg-white border-neutral-200"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            } border rounded-2xl p-6 sm:p-7 space-y-4`}
          >
            <div className={`flex items-center justify-between border-b ${isLight ? "border-neutral-200" : "border-neutral-800/80"} pb-3`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Low Stock & Out of Stock Alerts
                </h3>
              </div>
              <span className="text-xs text-neutral-400">{stockAlerts.length} Medicines needing attention</span>
            </div>

            <div className="space-y-3">
              {paginatedStockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => setHoveredProduct(alert.product)}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isLight
                      ? "bg-neutral-50 hover:bg-neutral-100/80 border-neutral-200 text-neutral-900"
                      : "bg-[#13141a] hover:bg-[#181a24] border-neutral-800 text-neutral-100"
                  }`}
                  title="Click to view medicine details"
                >
                  <div className="flex items-center gap-3">
                    {alert.type === "out-of-stock" ? (
                      <AlertOctagon className="w-5 h-5 shrink-0 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-400" />
                    )}
                    <div>
                      <div className={`font-medium text-sm ${isLight ? "text-neutral-900" : "text-white"}`}>{alert.message}</div>
                      <div className="text-xs text-neutral-400">
                        Medicine ID: <span className={`${isLight ? "text-neutral-800 font-semibold" : "text-neutral-200 font-semibold"}`}>{alert.product.product_id ?? alert.product.id ?? "N/A"}</span> &bull; Shelf: <span className={isLight ? "text-neutral-800 font-medium" : "text-neutral-200 font-medium"}>{alert.product.shelf_num ? (String(alert.product.shelf_num).toLowerCase().includes("shelf") ? alert.product.shelf_num : `Shelf ${alert.product.shelf_num}`) : "Dispensary Storage"}</span> {alert.product.category ? <>&bull; Category: <span className={isLight ? "text-neutral-800 font-medium" : "text-neutral-200 font-medium"}>{alert.product.category}</span></> : null}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderShipment(alert.product);
                    }}
                    className={`h-9 px-5 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm shrink-0 cursor-pointer ${
                      isLight
                        ? "bg-neutral-900 hover:bg-black text-white"
                        : "bg-white hover:bg-neutral-200 text-black"
                    }`}
                  >
                    Reorder Stock
                  </button>
                </div>
              ))}
            </div>

            {stockAlerts.length > STOCK_ALERTS_PAGE_SIZE && (
              <TablePagination
                currentPage={stockAlertsPage}
                totalItems={stockAlerts.length}
                pageSize={STOCK_ALERTS_PAGE_SIZE}
                onPageChange={setStockAlertsPage}
                isLight={isLight}
              />
            )}
          </div>
        )}

        {/* Charts Row 1: Monthly Sales Trend & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlySalesTrendChart ordersData={ordersData} />
          <CategorySalesChart productsData={productsData} />
        </div>

        {/* Charts Row 2: Transaction Metrics & Daily Sales Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionMetricCharts
            totalTransactions={totalTransactions}
            totalTransactionValue={totalTransactionValue}
            averageTransactionValue={averageTransactionValue}
            successfulTransactions={successfulTransactions}
            failedTransactions={failedTransactions}
          />

          {/* Daily Sales Bar Chart with Month & Year Selectors */}
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
                <p className="text-xs text-neutral-400">Interactive revenue distribution for {months[selectedMonth]} {selectedYear}</p>
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
                  {months.map((m, idx) => (
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
        </div>

        {/* Charts Row 3: Top 10 Selling Products Donut */}
        <div
          className={`${
            isLight
              ? "bg-white border-neutral-200"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          } border rounded-2xl p-6 sm:p-8 space-y-6`}
        >
          <div className="space-y-1 border-b border-neutral-800/80 pb-4">
            <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              Top Selling Medicines
            </h3>
            <p className="text-xs text-neutral-400">Your best-selling medicines ranked by total sales</p>
          </div>

          {top10Products.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No sales activity recorded yet to rank best-selling medicines.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={top10Products}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {top10Products.map((_, index) => (
                        <Cell key={`top-${index}`} fill={topColors[index % topColors.length]} />
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

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.96px] text-neutral-400 mb-2">
                  Best Sellers List
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {top10Products.map((p, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${
                        isLight
                          ? "bg-neutral-50 border-neutral-200"
                          : "bg-[#13141a] border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: topColors[idx % topColors.length] }}
                        />
                        <span className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>{p.name}</span>
                      </div>
                      <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                        ₹{p.value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Restock Order Requisition Dialog */}
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
          onAction={handleOrderShipment}
          actionLabel="Reorder stock"
        />
      )}
    </RetailerLayout>
  );
}
