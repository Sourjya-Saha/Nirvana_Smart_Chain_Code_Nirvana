"use client";

import React, { useState, useEffect, useMemo } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import CardTransactionRegistry from "@/contracts/CardTransactionRegistry.json";
import contractConfig from "@/contracts/contractAddress.json";
import axios from "axios";
import {
  Boxes,
  ShoppingCart,
  IndianRupee,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Navigation,
  Loader2,
  Calendar,
  Wallet,
  ShieldCheck,
  Search,
  ExternalLink,
  Package,
  Layers,
  Warehouse,
  ArrowUpRight,
  TrendingUp,
  ClipboardList,
  AlertOctagon,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import MonthlySalesTrendChart from "@/components/retailer/MonthlySalesTrendChart";
import CategorySalesChart from "@/components/retailer/CategorySalesChart";
import TransactionMetricCharts from "@/components/retailer/TransactionMetricCharts";
import ProductPreviewModal from "@/components/retailer/ProductPreviewModal";
import ManufacturerNotificationsDropdown from "@/components/manufacturer/ManufacturerNotificationsDropdown";
import { RoleDashboardSkeleton } from "@/components/ui/Skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS || contractConfig.registryAddress;

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


const formatStatusDisplay = (status) => {
  if (!status) return "Pending";
  switch (String(status).toUpperCase()) {
    case "PENDING":
      return "Pending";
    case "IN_TRANSIT_WHOLESALER":
      return "In Transit Wholesaler";
    case "WHOLESALER_RECEIVED":
      return "Wholesaler Received";
    case "IN_TRANSIT_RETAILER":
      return "In Transit Retailer";
    case "DELIVERED":
      return "Delivered";
    default:
      return String(status)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
};

const getStatusBadgeClass = (status) => {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    case "IN_TRANSIT_WHOLESALER":
    case "IN_TRANSIT_RETAILER":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "WHOLESALER_RECEIVED":
      return "bg-purple-500/10 text-purple-500 border-purple-500/30";
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    default:
      return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
  }
};

const isEmptyAddress = (address) => {
  if (!address) return true;
  const trimmed = address.trim();
  return trimmed === "" || trimmed === "                                          ";
};

export default function ManufacturerDashboard() {
  const { userId, userName } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();
  const topColors = TOP_COLORS;

  // Core Data State
  const [productsData, setProductsData] = useState([]);
  const [cartData, setCartData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // on-chain consignments
  const [contract, setContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI & Interactive State
  const [trackingLoadingId, setTrackingLoadingId] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [consignmentSearch, setConsignmentSearch] = useState("");

  // Month & Year Selector for Daily Activity Graph
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Dynamic available years based on order timestamps
  const availableYears = useMemo(() => {
    const yearsSet = new Set([2024, 2025, 2026]);
    if (Array.isArray(transactionsData)) {
      transactionsData.forEach((order) => {
        const d = parseOrderDate(order.datetime || order.date_time);
        if (d && !isNaN(d.getFullYear())) {
          yearsSet.add(d.getFullYear());
        }
      });
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactionsData]);

  // Connect Web3 & Contract
  useEffect(() => {
    const initContract = async () => {
      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            const addr = ethers.getAddress(accounts[0]);
            setWalletAddress(addr);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(addr);
            const registry = new ethers.Contract(
              REGISTRY_ADDRESS,
              CardTransactionRegistry.abi,
              signer
            );
            setContract(registry);
          }
        } catch (e) {
          console.warn("Metamask silent connect notice:", e);
        }
      }
    };
    initContract();
  }, []);

  // Fetch On-chain Transactions
  const fetchContractTransactions = async () => {
    if (contract && walletAddress) {
      try {
        const [cardIds, strhash, statuses] = await contract.getAllTransactions();
        const formatted = [];
        for (let i = 0; i < cardIds.length; i++) {
          const raw = strhash[i] || "";
          const manu = raw.slice(0, 42).trim();
          if (manu.toLowerCase() === walletAddress.toLowerCase()) {
            formatted.push({
              cardId: cardIds[i],
              receiverAddressM: manu,
              receiverAddressW: raw.slice(42, 84).trim(),
              receiverAddressR: raw.slice(84, 126).trim(),
              date: raw.slice(126, 136).trim(),
              status: statuses[i] || "PENDING",
            });
          }
        }
        setAllTransactions(formatted);
      } catch (err) {
        console.error("Contract transactions fetch error:", err);
      }
    }
  };

  useEffect(() => {
    if (contract && walletAddress) {
      fetchContractTransactions();
    }
  }, [contract, walletAddress]);

  // Fetch Backend Products, Carts & Combined Orders
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [prodRes, cartRes, txRes, wholeTxRes] = await Promise.all([
          axios.post(`${API_BASE}/getProductsManu`, { user_id: userId }).catch(() => ({ data: [] })),
          axios.post(`${API_BASE}/getCartsManu`, { user_id: userId }).catch(() => ({ data: [] })),
          axios.post(`${API_BASE}/get_all_transactions_manu`, { manu_id: userId }).catch(() => ({ data: [] })),
          axios.post(`${API_BASE}/get_all_transactions_whole_for_manu`, { manu_id: userId }).catch(() => ({ data: [] })),
        ]);

        const prods = Array.isArray(prodRes.data) ? prodRes.data : [];
        const carts = Array.isArray(cartRes.data) ? cartRes.data : [];
        const txs = Array.isArray(txRes.data) ? txRes.data : [];
        const wholeTxs = Array.isArray(wholeTxRes.data) ? wholeTxRes.data : [];

        setProductsData(prods);
        setCartData(carts);

        // Normalized orders from Retailers + Wholesalers
        const combinedOrders = [
          ...txs.map((t) => ({
            ...t,
            partnerType: "Retailer",
            datetime: t.datetime || t.date_time,
            total: Number(t.total) || 0,
            customer_name: t.customer_name || "Retailer Store",
          })),
          ...wholeTxs.map((t) => ({
            ...t,
            partnerType: "Wholesaler",
            datetime: t.datetime || t.date_time,
            total: Number(t.total) || 0,
            customer_name: t.customer_name || "Wholesale Depot",
          })),
        ].sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0));

        setTransactionsData(combinedOrders);
      } catch (error) {
        console.error("Dashboard backend fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  // Telemetry Metrics
  const totalProducts = productsData.length;
  const totalCarts = cartData.length;

  const totalInventoryValue = useMemo(() => {
    return productsData.reduce((acc, p) => {
      return acc + (Number(p.price_per_unit || 0) * Number(p.quantity_of_uom || 0));
    }, 0);
  }, [productsData]);

  const statusCounts = useMemo(() => {
    return allTransactions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
  }, [allTransactions]);

  const inTransitCount = useMemo(() => {
    return (statusCounts["IN_TRANSIT_WHOLESALER"] || 0) + (statusCounts["IN_TRANSIT_RETAILER"] || 0);
  }, [statusCounts]);

  const financialMetrics = useMemo(() => {
    if (!transactionsData || transactionsData.length === 0) {
      return { total: 0, val: 0, avg: 0, paid: 0, unpaid: 0 };
    }
    const total = transactionsData.length;
    const val = transactionsData.reduce((s, t) => s + (parseFloat(t.total) || 0), 0);
    const avg = total > 0 ? val / total : 0;
    const paid = transactionsData.filter((t) => (t.status || "").toLowerCase() === "paid").length;
    const unpaid = total - paid;
    return { total, val, avg, paid, unpaid };
  }, [transactionsData]);

  // Revenue trend line chart data (cloned from retailer dashboard)
  const revenueChartData = useMemo(() => {
    if (!Array.isArray(transactionsData)) return [];
    return transactionsData.map((o) => {
      const d = parseOrderDate(o.datetime);
      return {
        date: d ? d.toLocaleDateString() : "-",
        amount: Number(o.total) || 0,
      };
    });
  }, [transactionsData]);

  // Product categories list
  const productCategories = useMemo(() => {
    return [...new Set(productsData.map((p) => p.category).filter(Boolean))];
  }, [productsData]);

  // Out of stock count
  const outOfStockProducts = useMemo(() => {
    return productsData.filter((p) => Number(p.quantity_of_uom || 0) <= 0).length;
  }, [productsData]);

  // Daily Sales Bar Chart Data
  const dailySalesData = useMemo(() => {
    const salesByDay = {};

    if (Array.isArray(transactionsData)) {
      transactionsData.forEach((order) => {
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
  }, [transactionsData, selectedMonth, selectedYear]);

  const monthlyTotal = useMemo(() => {
    return Number(dailySalesData.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  }, [dailySalesData]);

  const maxDaySales = useMemo(() => {
    return Math.max(...dailySalesData.map((i) => i.total), 0);
  }, [dailySalesData]);

  // Top Selling Manufactured Medicines
  const top10Products = useMemo(() => {
    const map = {};
    transactionsData.forEach((order) => {
      if (Array.isArray(order.order_details)) {
        order.order_details.forEach((item) => {
          const name = item.product_name || "Formulation Batch";
          map[name] = (map[name] || 0) + (Number(item.total_price) || 0);
        });
      }
    });

    const entries = Object.entries(map).map(([name, value]) => ({ name, value }));
    if (entries.length === 0) {
      // Fallback to highest inventory value products
      return productsData
        .slice(0, 6)
        .map((p) => ({
          name: p.name || "Drug Formulation",
          value: Number(p.price_per_unit || 0) * Number(p.quantity_of_uom || 0),
        }))
        .sort((a, b) => b.value - a.value);
    }
    return entries.sort((a, b) => b.value - a.value).slice(0, 10);
  }, [transactionsData, productsData]);


  // Live GPS Telematics Navigation
  const handleLiveTracking = async (shipment) => {
    const cardId = shipment.cardId;
    setTrackingLoadingId(cardId);

    const mAddr = isEmptyAddress(shipment.receiverAddressM) ? "" : shipment.receiverAddressM;
    const wAddr = isEmptyAddress(shipment.receiverAddressW) ? "" : shipment.receiverAddressW;
    const rAddr = isEmptyAddress(shipment.receiverAddressR) ? "" : shipment.receiverAddressR;

    let startCoord = "";
    let checkpointCoord = "";
    let destCoord = "";

    try {
      const response = await axios.post(`${API_BASE}/get_lats_longs`, null, {
        params: {
          cart_id: cardId,
          manufacturer_address: mAddr,
          wholesaler_address: wAddr,
          retailer_address: rAddr,
        },
      });

      if (response.status === 200 && response.data) {
        const d = response.data;
        if (d.manufacturer?.manufacturer_lat && d.manufacturer?.manufacturer_long) {
          startCoord = `${d.manufacturer.manufacturer_lat}, ${d.manufacturer.manufacturer_long}`;
        }
        if (d.wholesaler?.wholesaler_lat && d.wholesaler?.wholesaler_long) {
          checkpointCoord = `${d.wholesaler.wholesaler_lat}, ${d.wholesaler.wholesaler_long}`;
        }
        if (d.retailer?.retailer_lat && d.retailer?.retailer_long) {
          destCoord = `${d.retailer.retailer_lat}, ${d.retailer.retailer_long}`;
        }
      }
    } catch (e) {
      console.warn("Could not pre-fetch exact lat/long coords:", e);
    }

    const params = new URLSearchParams({
      cartId: cardId,
      userId: userId || "",
      userRole: "manufacturer",
    });

    if (mAddr) params.set("mAddr", mAddr);
    if (wAddr) params.set("wAddr", wAddr);
    if (rAddr) params.set("rAddr", rAddr);
    if (startCoord) params.set("start", startCoord);
    if (checkpointCoord) params.set("checkpoint", checkpointCoord);
    if (destCoord) params.set("dest", destCoord);

    router.push(`/geolocation?${params.toString()}`);
  };

  // Filtered Consignments
  const filteredConsignments = useMemo(() => {
    if (!consignmentSearch.trim()) return allTransactions;
    const q = consignmentSearch.toLowerCase();
    return allTransactions.filter(
      (c) =>
        (c.cardId || "").toLowerCase().includes(q) ||
        (c.receiverAddressW || "").toLowerCase().includes(q) ||
        (c.receiverAddressR || "").toLowerCase().includes(q) ||
        (c.status || "").toLowerCase().includes(q) ||
        (c.date || "").toLowerCase().includes(q)
    );
  }, [allTransactions, consignmentSearch]);

  if (loading) {
    return (
      <ManufacturerLayout
        title="Loading Dashboard..."
        subtitle="Loading your medicine stock, orders, and shipments..."
        badge="Loading..."
      >
        <RoleDashboardSkeleton isLight={isLight} roleName="Manufacturer" />
      </ManufacturerLayout>
    );
  }

  return (
    <ManufacturerLayout
      title={`Manufacturer Dashboard — ${userName || "Manufacturer"}`}
      subtitle="Track your medicines, orders, shipments, and live deliveries in real time."
      badge="Manufacturing Facility"
      actions={
        <div className="flex items-center gap-2.5">
          {/* Notification Panel Trigger */}
          <ManufacturerNotificationsDropdown
            userId={userId}
            orders={transactionsData}
            products={productsData}
            consignments={allTransactions}
          />
        </div>
      }
    >
      <div className="space-y-8">
        {/* ============================================================== */}
        {/* 1. 12 PRIMARY METRIC CARDS (CLONED FROM RETAILER DASHBOARD UI) */}
        {/* ============================================================== */}
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
              {totalProducts}
            </div>
            <p className="text-[11px] text-neutral-500">Medicines in production</p>
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
              {financialMetrics.total}
            </div>
            <p className="text-[11px] text-neutral-500">Distributor & buyer orders</p>
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
            <p className="text-[11px] text-neutral-500">Pharmaceutical classes</p>
          </div>

          {/* 4. Dispatched Carts */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Dispatched Carts
              </span>
              <Boxes className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {totalCarts}
            </div>
            <p className="text-[11px] text-neutral-500">Bundled consignments</p>
          </div>

          {/* 5. Inventory Worth */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Inventory Value
              </span>
              <IndianRupee className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{totalInventoryValue.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </div>
            <p className="text-[11px] text-neutral-500">Facility warehouse stock</p>
          </div>

          {/* 6. Delivered Consignments */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Delivered
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {statusCounts["DELIVERED"] || 0}
            </div>
            <p className="text-[11px] text-neutral-500">Handover verified on-chain</p>
          </div>

          {/* 7. In Transit Consignments */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                In Transit
              </span>
              <Truck className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {inTransitCount}
            </div>
            <p className="text-[11px] text-neutral-500">En route to destination</p>
          </div>

          {/* 8. Pending Dispatch */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Pending Dispatch
              </span>
              <Clock className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {statusCounts["PENDING"] || 0}
            </div>
            <p className="text-[11px] text-neutral-500">Awaiting courier pickup</p>
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
              ₹{financialMetrics.val.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </div>
            <div className="w-full h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <Line type="monotone" dataKey="amount" stroke={isLight ? "#171717" : "#ffffff"} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 10. Average Order Value */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Average Order
              </span>
              <ClipboardList className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              ₹{financialMetrics.avg.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </div>
            <p className="text-[11px] text-neutral-500">Average per order</p>
          </div>

          {/* 11. Paid Orders */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Cleared Orders
              </span>
              <CheckCircle2 className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} />
            </div>
            <div className={`font-editorial text-3xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {financialMetrics.paid}
            </div>
            <p className="text-[11px] text-neutral-500">Orders settled and cleared</p>
          </div>

          {/* 12. Order Status */}
          <div
            className={`${
              isLight ? "bg-white border-neutral-200" : "bg-[#0d0e12] border-neutral-800/90"
            } border rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.96px] uppercase text-neutral-400">
                Order Status
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-3xl font-light text-emerald-400">{financialMetrics.paid}</span>
              <span className="text-xs text-neutral-500">/</span>
              <span className="font-editorial text-2xl font-light text-rose-400">{financialMetrics.unpaid} pending</span>
            </div>
            <p className="text-[11px] text-neutral-500">Paid vs pending clearance</p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. CHARTS ROW 1: Monthly Sales Trend & Category Distribution   */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlySalesTrendChart ordersData={transactionsData} />
          <CategorySalesChart productsData={productsData} />
        </div>

        {/* ============================================================== */}
        {/* 3. ACTIVE CONSIGNMENT TRACKER TABLE & TRUCK PIPELINE VISUALIZER */}
        {/* ============================================================== */}
        <div
          className={`rounded-2xl border overflow-hidden transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-2xl"
          }`}
        >
          <div
            className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? "border-neutral-200" : "border-neutral-800/80"
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Live Shipment Tracker
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Track real-time shipment progress between manufacturer, wholesaler, and retailer.
              </p>
            </div>

            {/* Consignment Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by Cart ID or location..."
                value={consignmentSearch}
                onChange={(e) => setConsignmentSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-400"
                    : "bg-[#13141b] border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-700"
                }`}
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead
                className={`border-b text-xs font-semibold ${
                  isLight
                    ? "bg-neutral-50/80 text-neutral-600 border-neutral-200"
                    : "bg-neutral-900/40 text-neutral-300 border-neutral-800/80"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Cart ID</th>
                  <th className="py-3.5 px-4">Wholesaler</th>
                  <th className="py-3.5 px-4">Retailer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Manufacturer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? "divide-neutral-200/60" : "divide-neutral-800/50"
                }`}
              >
                {filteredConsignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Truck className="w-10 h-10 mx-auto text-neutral-600 mb-2 stroke-[1.5]" />
                      <p className={`font-semibold ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                        No consignments matching your criteria.
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Register a consignment under the On-Chain Ledger to activate real-time GPS telematics.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredConsignments.map((shipment) => {
                    const isLoadingTracking = trackingLoadingId === shipment.cardId;

                    return (
                      <tr
                        key={shipment.cardId}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-neutral-900/30"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                          #{shipment.cardId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-500">
                          {!isEmptyAddress(shipment.receiverAddressW)
                            ? `${shipment.receiverAddressW.substring(0, 8)}...${shipment.receiverAddressW.slice(-4)}`
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-500">
                          {!isEmptyAddress(shipment.receiverAddressR)
                            ? `${shipment.receiverAddressR.substring(0, 8)}...${shipment.receiverAddressR.slice(-4)}`
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                          {shipment.date}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-500">
                          {!isEmptyAddress(shipment.receiverAddressM)
                            ? `${shipment.receiverAddressM.substring(0, 8)}...${shipment.receiverAddressM.slice(-4)}`
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                              shipment.status
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {formatStatusDisplay(shipment.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleLiveTracking(shipment)}
                              disabled={isLoadingTracking}
                              className={`h-8 sm:h-9 px-3.5 sm:px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                                isLight
                                  ? "bg-neutral-900 hover:bg-black text-white"
                                  : "bg-white hover:bg-neutral-200 text-black"
                              }`}
                            >
                              {isLoadingTracking ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Navigation className="w-3.5 h-3.5" />
                              )}
                              <span>Live Tracking</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. CHARTS ROW 2: Transaction Metrics & Daily Activity Bar      */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionMetricCharts
            totalTransactions={financialMetrics.total}
            totalTransactionValue={financialMetrics.val}
            averageTransactionValue={financialMetrics.avg}
            successfulTransactions={financialMetrics.paid}
            failedTransactions={financialMetrics.unpaid}
          />

          {/* Daily Sales / Dispatch Bar Chart with Month & Year Selectors */}
          <div
            className={`border rounded-2xl p-6 sm:p-7 space-y-6 flex flex-col justify-between transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-4">
              <div className="space-y-1">
                <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                  Daily Sales & Orders
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Daily revenue for {months[selectedMonth]} {selectedYear}
                </p>
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
                  className={`px-3 py-1.5 rounded-xl border text-xs outline-none transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-xl border text-xs outline-none transition-all cursor-pointer ${
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

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800/60">
              <span>Day 1st – {dailySalesData.length}th</span>
              <span className={isLight ? "text-neutral-800 font-semibold" : "text-neutral-200 font-semibold"}>
                Peak Day: ₹{maxDaySales.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. CHARTS ROW 3: Top Manufactured & Sold Medicines Ranking    */}
        {/* ============================================================== */}
        <div
          className={`border rounded-2xl p-6 sm:p-8 space-y-6 transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <div className="space-y-1 border-b border-neutral-200 dark:border-neutral-800/80 pb-4">
            <h3 className={`font-editorial text-2xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              Top Selling Medicines
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Best-selling medicines ranked by total sales value
            </p>
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
                <div className="text-xs font-semibold text-neutral-400 mb-2">
                  Best Sellers List
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {top10Products.map((p, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-colors ${
                        isLight
                          ? "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                          : "bg-[#13141a] border-neutral-800 hover:bg-[#181a24]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: topColors[idx % topColors.length] }}
                        />
                        <span className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>{p.name}</span>
                      </div>
                      <span className={`font-semibold font-mono ${isLight ? "text-neutral-900" : "text-white"}`}>
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

      {/* Product Hover / Inspection Modal */}
      {hoveredProduct && (
        <ProductPreviewModal
          product={hoveredProduct}
          onClose={() => setHoveredProduct(null)}
          isLight={isLight}
          onAction={() => router.push("/manufacturer/addproducts")}
          actionLabel="View Products"
        />
      )}
    </ManufacturerLayout>
  );
}
