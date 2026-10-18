/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import TablePagination from "@/components/retailer/TablePagination";
import ProductPreviewModal from "@/components/retailer/ProductPreviewModal";
import { TableSkeletonRows, StatCardSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getProductImageUrl } from "@/lib/imageBlobUtils";
import {
  ClipboardList,
  Search,
  ShoppingCart,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Calendar,
  Phone,
  User,
  Package,
  Boxes,
  Loader2,
  Store,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  IndianRupee,
  Clock,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const ITEMS_PER_PAGE = 7;

const generateCartId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function ManufacturerAllShipmentsPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();

  // Tab: 'retailer' | 'wholesaler'
  const [activeSection, setActiveSection] = useState("retailer");

  // Transactions
  const [retailerTransactions, setRetailerTransactions] = useState([]);
  const [wholesalerTransactions, setWholesalerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Cart
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [addingCartId, setAddingCartId] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [previewProduct, setPreviewProduct] = useState(null);

  // In-memory cache for user name lookups to prevent duplicate N+1 API calls
  const nameCacheRef = useRef({});

  // Toast
  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });
  const showToast = useCallback((text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "" }), 4500);
  }, []);

  const fetchRetailerName = useCallback(async (uId) => {
    if (!uId) return "Retailer";
    if (nameCacheRef.current[`ret_${uId}`]) return nameCacheRef.current[`ret_${uId}`];
    try {
      const res = await axios.post(`${API_BASE}/get_name_of_retailer_by_user_id`, {
        user_id: uId,
      });
      const name = res.data?.user_id || `Retailer #${uId}`;
      nameCacheRef.current[`ret_${uId}`] = name;
      return name;
    } catch {
      return `Retailer #${uId}`;
    }
  }, []);

  const fetchWholesalerName = useCallback(async (uId) => {
    if (!uId) return "Wholesaler";
    if (nameCacheRef.current[`who_${uId}`]) return nameCacheRef.current[`who_${uId}`];
    try {
      const res = await axios.post(`${API_BASE}/get_name_of_wholesaler_by_user_id`, {
        user_id: uId,
      });
      const name = res.data?.user_id || `Wholesaler #${uId}`;
      nameCacheRef.current[`who_${uId}`] = name;
      return name;
    } catch {
      return `Wholesaler #${uId}`;
    }
  }, []);

  const fetchAllShipments = useCallback(async () => {
    if (!userId) return;
    try {
      // 1. Fetch both retailer & wholesaler transactions concurrently
      const [retRes, wholeRes] = await Promise.all([
        axios.post(`${API_BASE}/get_all_transactions_manu`, { manu_id: userId }).catch(() => ({ data: [] })),
        axios.post(`${API_BASE}/get_all_transactions_whole_for_manu`, { manu_id: userId }).catch(() => ({ data: [] })),
      ]);

      const retData = Array.isArray(retRes.data) ? retRes.data : [];
      const wholeData = Array.isArray(wholeRes.data) ? wholeRes.data : [];

      // 2. Identify unique unseen user IDs that need name resolution (skip those with name already provided by backend JOIN)
      const missingRetailerIds = [
        ...new Set(
          retData
            .filter((tx) => !tx.retailer_name && !tx.retailerName && tx.user_id && !nameCacheRef.current[`ret_${tx.user_id}`])
            .map((tx) => tx.user_id)
        ),
      ];

      const missingWholesalerIds = [
        ...new Set(
          wholeData
            .filter((tx) => !tx.wholesaler_name && !tx.wholesalerName && tx.user_id && !nameCacheRef.current[`who_${tx.user_id}`])
            .map((tx) => tx.user_id)
        ),
      ];

      // 3. Resolve only unique IDs in parallel (drastically eliminates 60+ repeated requests)
      if (missingRetailerIds.length > 0) {
        await Promise.all(missingRetailerIds.map((id) => fetchRetailerName(id)));
      }
      if (missingWholesalerIds.length > 0) {
        await Promise.all(missingWholesalerIds.map((id) => fetchWholesalerName(id)));
      }

      // 4. Map transactions with instant cached or backend-joined names
      const retWithNames = retData.map((tx) => ({
        ...tx,
        retailerName:
          tx.retailer_name ||
          tx.retailerName ||
          nameCacheRef.current[`ret_${tx.user_id}`] ||
          tx.customer_name ||
          `Retailer #${tx.user_id || ""}`,
      }));
      setRetailerTransactions(retWithNames);

      const wholeWithNames = wholeData.map((tx) => ({
        ...tx,
        wholesalerName:
          tx.wholesaler_name ||
          tx.wholesalerName ||
          nameCacheRef.current[`who_${tx.user_id}`] ||
          tx.customer_name ||
          `Wholesaler #${tx.user_id || ""}`,
      }));
      setWholesalerTransactions(wholeWithNames);
    } catch (err) {
      console.error("Fetch shipments error:", err);
      showToast("Error retrieving shipment transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, fetchRetailerName, fetchWholesalerName, showToast]);

  useEffect(() => {
    let active = true;
    if (userId) {
      fetchAllShipments();
      axios
        .post(`${API_BASE}/getProductsManu`, { user_id: userId })
        .then((r) => {
          if (active) {
            setAvailableProducts(Array.isArray(r.data) ? r.data : []);
          }
        })
        .catch(() => {});
    } else {
      const timer = setTimeout(() => {
        if (active) setLoading(false);
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
    return () => {
      active = false;
    };
  }, [userId, fetchAllShipments]);

  const handleAddToCart = async (transaction) => {
    setAddingCartId(transaction.order_id);
    try {
      const cartId = generateCartId();

      const productsToAdd = (transaction.order_details || []).map((product) => ({
        product_id: product.product_id,
        quantity: product.quantity,
      }));

      const order_type = activeSection === "retailer" ? "retailer" : "wholesaler";

      await axios.post(`${API_BASE}/add_to_cart`, {
        cart_id: cartId,
        products: productsToAdd,
        user_id: userId,
        order_id: transaction.order_id,
        order_type: order_type,
      });

      showToast(`Cart #${cartId} created successfully! Available under Consignment Carts.`, "success");
    } catch (error) {
      console.error("Error creating cart:", error);
      showToast("Failed to create cart bundle. Please try again.", "error");
    } finally {
      setAddingCartId(null);
    }
  };

  const handlePrint = (transaction) => {
    if (!transaction) return;
    try {
      const doc = new jsPDF();
      const isRetail = activeSection === "retailer";
      const partnerName = isRetail ? transaction.retailerName : transaction.wholesalerName;

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, "F");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("NIRVANA SMARTCHAIN | CONSIGNMENT MANIFEST", 14, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225);
      doc.text(`Official Dispatch Note • Issued: ${new Date().toLocaleDateString()}`, 14, 28);

      // Metadata Grid
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`Order Reference: ORDER#${transaction.order_id}`, 14, 46);
      doc.text(`Buyer Sector: ${isRetail ? "Retail Pharmacy" : "Licensed Wholesaler"}`, 14, 53);
      doc.text(`Buyer Organization: ${partnerName || "Verified Entity"}`, 14, 60);
      doc.text(`Dispatch Date: ${transaction.datetime || "Pending"}`, 14, 67);

      doc.text(`Recipient Customer: ${transaction.customer_name || "N/A"}`, 120, 46);
      doc.text(`Contact Phone: ${transaction.phone_num || "N/A"}`, 120, 53);
      doc.text(`Payment Status: ${transaction.status || "Pending"}`, 120, 60);

      // Products Table
      const tableRows = (transaction.order_details || []).map((item, idx) => [
        idx + 1,
        item.product_name || `SKU #${item.product_id}`,
        item.quantity,
        `INR ${Number(item.price_per_unit || (transaction.total / item.quantity) || 0).toFixed(2)}`,
        `INR ${Number((item.price_per_unit || 0) * item.quantity).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 75,
        head: [["#", "Product Catalog Item", "Qty", "Unit Price", "Subtotal"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
      });

      const finalY = doc.lastAutoTable?.finalY || 120;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Grand Total: INR ${Number(transaction.total || 0).toFixed(2)}`, 14, finalY + 14);

      doc.save(`Order_${transaction.order_id}_Dispatch_Receipt.pdf`);
      showToast("PDF dispatch manifest exported successfully.", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("Failed to generate PDF document.", "error");
    }
  };

  // Current dataset & stats
  const currentDataset = activeSection === "retailer" ? retailerTransactions : wholesalerTransactions;
  const filteredDataset = useMemo(() => {
    if (!searchQuery.trim()) return currentDataset;
    const query = searchQuery.toLowerCase();
    return currentDataset.filter((tx) => {
      const name = activeSection === "retailer" ? tx.retailerName : tx.wholesalerName;
      return (
        name?.toLowerCase().includes(query) ||
        String(tx.order_id)?.includes(query) ||
        tx.customer_name?.toLowerCase().includes(query) ||
        tx.status?.toLowerCase().includes(query)
      );
    });
  }, [currentDataset, searchQuery, activeSection]);

  const totalPages = Math.max(1, Math.ceil(filteredDataset.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDataset.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDataset, currentPage]);

  // Metric Stats
  const totalOrdersCount = currentDataset.length;
  const paidOrdersCount = currentDataset.filter((tx) => tx.status?.toLowerCase() === "paid").length;
  const totalValueSum = currentDataset.reduce((sum, tx) => sum + Number(tx.total || 0), 0);

  return (
    <ManufacturerLayout
      title="Shipment Orders"
      subtitle="Fulfill wholesale and retail pharmaceutical requisitions, package carts, and export verified delivery bills."
      badge="Order Processing"
      actions={
        <Link
          href="/manufacturer/cart"
          className={`h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            isLight
              ? "bg-black hover:bg-neutral-800 text-white"
              : "bg-white hover:bg-neutral-200 text-black"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          View Carts
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage.text && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in ${
              toastMessage.type === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "error" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage({ text: "", type: "" })} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* 3 Stats Cards Row (matching Retailer Orders Page) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Total Orders */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Total Orders ({activeSection === "retailer" ? "Retail" : "Wholesale"})
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#181920] border-neutral-700/60 text-neutral-300"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-editorial text-3xl sm:text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {loading ? "—" : totalOrdersCount}
            </div>
            <p className="text-xs text-neutral-500">Recorded downstream requisitions</p>
          </div>

          {/* Card 2: Paid & Verified Orders */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Completed & Paid
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-600"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-light text-emerald-500">
              {loading ? "—" : paidOrdersCount}
            </div>
            <p className="text-xs text-neutral-500">Settled and ready for dispatch</p>
          </div>

          {/* Card 3: Total Gross Value */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Total Order Value
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#181920] border-neutral-700/60 text-neutral-300"
                }`}
              >
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-editorial text-3xl sm:text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {loading ? "—" : `₹${totalValueSum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-neutral-500">Cumulative invoice volume</p>
          </div>
        </div>

        {/* Main Container Card */}
        <div
          className={`rounded-2xl border p-5 sm:p-8 space-y-6 transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          {/* Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Segmented Section Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSection("retailer");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeSection === "retailer"
                    ? isLight
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-black border-white shadow-sm"
                    : isLight
                    ? "bg-white text-neutral-600 hover:text-black border-neutral-300"
                    : "bg-[#14161f] text-neutral-400 hover:text-white border-neutral-800"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Retailer Orders ({retailerTransactions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSection("wholesaler");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeSection === "wholesaler"
                    ? isLight
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-black border-white shadow-sm"
                    : isLight
                    ? "bg-white text-neutral-600 hover:text-black border-neutral-300"
                    : "bg-[#14161f] text-neutral-400 hover:text-white border-neutral-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Wholesaler Orders ({wholesalerTransactions.length})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isLight ? "text-neutral-400" : "text-neutral-500"
                }`}
              />
              <input
                type="text"
                placeholder={`Search ${activeSection} name, order ID...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white"
                    : "bg-[#14161f] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:bg-[#181920]"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
            <table className="w-full text-left text-xs sm:text-sm min-w-[840px]">
              <thead
                className={`border-b text-[10px] sm:text-[11px] font-semibold ${
                  isLight
                    ? "bg-neutral-50/80 text-neutral-500 border-neutral-200"
                    : "bg-[#14151a] text-neutral-400 border-neutral-800"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">
                    {activeSection === "retailer" ? "Retail Pharmacy" : "Wholesaler"}
                  </th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Total Quantity</th>
                  <th className="py-3.5 px-4">Total Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? "divide-neutral-100" : "divide-neutral-800/60"
                }`}
              >
                {loading ? (
                  <TableSkeletonRows rows={5} columns={9} isLight={isLight} />
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center">
                      <ClipboardList className="w-10 h-10 mx-auto text-neutral-400 mb-2 stroke-[1.5]" />
                      <p className={`font-semibold ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                        {searchQuery
                          ? `No orders match "${searchQuery}"`
                          : `No active ${activeSection} orders recorded.`}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        New orders placed by downstream entities will populate this ledger in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const partnerName =
                      activeSection === "retailer" ? tx.retailerName : tx.wholesalerName;
                    const totalUnits = (tx.order_details || []).reduce(
                      (s, p) => s + (p.quantity || 0),
                      0
                    );
                    const isPaid = tx.status?.toLowerCase() === "paid";

                    return (
                      <tr
                        key={tx.order_id}
                        className={`transition-colors ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                : "bg-[#181920] text-neutral-200 border-neutral-700/60"
                            }`}
                          >
                            #{tx.order_id}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>
                          {partnerName || "Verified Stakeholder"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-400 whitespace-nowrap">
                          {tx.datetime || "N/A"}
                        </td>
                        <td className={`py-3.5 px-4 text-xs ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                          {tx.customer_name || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-neutral-400">
                          {tx.phone_num || "N/A"}
                        </td>
                        <td className={`py-3.5 px-4 text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          {totalUnits} units
                        </td>
                        <td className={`py-3.5 px-4 text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          ₹{Number(tx.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPaid ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {tx.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(tx)}
                              disabled={addingCartId === tx.order_id}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                isLight
                                  ? "bg-neutral-900 hover:bg-black text-white border-black"
                                  : "bg-white hover:bg-neutral-200 text-black border-white"
                              } ${addingCartId === tx.order_id ? "opacity-60 cursor-not-allowed" : ""}`}
                              title="Package into Cart"
                            >
                              {addingCartId === tx.order_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                              )}
                              <span>Add Cart</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(tx)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="Inspect Order"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrint(tx)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="Print PDF Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
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

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredDataset.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            isLight={isLight}
          />
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedTransaction(null)}>
          <div
            className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] ${
              isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#0f1016] border-neutral-800 text-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 border-b border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-neutral-400">
                  Shipment Order Manifest
                </span>
                <h3 className="font-editorial text-2xl font-light mt-0.5">
                  Order #{selectedTransaction.order_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                    : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-neutral-50/70 border-neutral-200/80" : "bg-[#14151e] border-neutral-800/80"}`}>
                  <span className="text-xs font-medium text-neutral-400 block mb-1">Buyer Partner</span>
                  <span className="font-semibold text-sm block">
                    {activeSection === "retailer" ? selectedTransaction.retailerName : selectedTransaction.wholesalerName}
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-neutral-50/70 border-neutral-200/80" : "bg-[#14151e] border-neutral-800/80"}`}>
                  <span className="text-xs font-medium text-neutral-400 block mb-1">Date & Time</span>
                  <span className="font-semibold text-sm block">
                    {selectedTransaction.datetime || "N/A"}
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-neutral-50/70 border-neutral-200/80" : "bg-[#14151e] border-neutral-800/80"}`}>
                  <span className="text-xs font-medium text-neutral-400 block mb-1">Customer Name</span>
                  <span className="font-semibold text-sm block">
                    {selectedTransaction.customer_name || "N/A"}
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-neutral-50/70 border-neutral-200/80" : "bg-[#14151e] border-neutral-800/80"}`}>
                  <span className="text-xs font-medium text-neutral-400 block mb-1">Contact Phone</span>
                  <span className="font-semibold text-sm block font-mono">
                    {selectedTransaction.phone_num || "N/A"}
                  </span>
                </div>
              </div>

              {/* Rich Product Details Section (Matching Cart View & ProductPreviewModal) */}
              {(() => {
                const normalizedItems = (selectedTransaction.order_details || []).map((detail, idx) => {
                  const pId = detail.product_id;
                  const matched = availableProducts.find(
                    (p) =>
                      String(p.product_id ?? p.id) === String(pId) ||
                      String(p.name).toLowerCase() === String(detail.product_name).toLowerCase()
                  );
                  const name = detail.product_name || matched?.name || `Product #${pId || idx + 1}`;
                  const qty = Number(detail.quantity || 1);
                  const price = Number(
                    detail.price_per_unit ||
                    matched?.price_per_unit ||
                    (qty > 0 && selectedTransaction.total ? Number(selectedTransaction.total) / qty : 0)
                  );
                  const subtotal = Number(detail.total_price || (price * qty) || 0);

                  const category = matched?.category || "General Medicine";
                  const shelf = matched?.shelf_num
                    ? String(matched.shelf_num).toLowerCase().startsWith("shelf")
                      ? matched.shelf_num
                      : `Shelf ${matched.shelf_num}`
                    : matched?.shelf
                    ? `Shelf ${matched.shelf}`
                    : "Ambient Storage";
                  const imageSource = matched?.picture_of_the_prod || matched?.picture || matched?.image || null;
                  const expDate = matched?.exp_date
                    ? String(matched.exp_date).slice(0, 10)
                    : matched?.expDate || matched?.expiry_date || null;
                  const unitLabel = matched?.uom_name || matched?.unit_measurement || matched?.unit || "units";
                  const inStock = Number(matched?.quantity_of_uom ?? 0);
                  const description =
                    matched?.description ||
                    `${name} is a high-grade ${category.toLowerCase()} formulation curated for clinical safety and efficacy. Verified on-chain across the smart distribution registry.`;

                  return {
                    id: pId || matched?.product_id || matched?.id || idx + 1,
                    name,
                    category,
                    description,
                    shelf,
                    expDate,
                    image: imageSource,
                    price,
                    quantity: qty,
                    unitLabel,
                    inStock,
                    subtotal,
                    rawProduct: matched
                      ? {
                          ...matched,
                          product_id: matched.product_id ?? matched.id ?? pId,
                          name,
                          category,
                          shelf_num: shelf,
                          picture_of_the_prod: imageSource,
                          exp_date: expDate,
                          uom_name: unitLabel,
                          price_per_unit: price,
                          quantity: qty,
                          description,
                        }
                      : {
                          product_id: pId || idx + 1,
                          id: pId || idx + 1,
                          name,
                          category,
                          shelf_num: shelf,
                          picture: imageSource,
                          picture_of_the_prod: imageSource,
                          exp_date: expDate,
                          uom_name: unitLabel,
                          price_per_unit: price,
                          quantity: qty,
                          description,
                        },
                  };
                });

                const totalQuantity = normalizedItems.reduce((acc, i) => acc + i.quantity, 0);

                return (
                  <>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-400">
                          Consignment Line Items
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {normalizedItems.length} {normalizedItems.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {totalQuantity.toLocaleString("en-IN")} total units
                      </span>
                    </div>

                    <div className="space-y-4">
                      {normalizedItems.map((item, idx) => {
                        const imageUrl = getProductImageUrl(item.image);
                        return (
                          <div
                            key={idx}
                            className={`rounded-2xl border overflow-hidden transition-all ${
                              isLight
                                ? "bg-white border-neutral-200 shadow-sm"
                                : "bg-[#141620] border-neutral-800/90 shadow-md"
                            }`}
                          >
                            {/* Image Presentation Area (Matching ProductPreviewModal & Cart View) */}
                            <div
                              className={`relative w-full flex flex-col justify-between p-4 ${
                                isLight
                                  ? "bg-neutral-50/70 border-b border-neutral-200/60"
                                  : "bg-gradient-to-b from-[#181a24] to-[#12131b] border-b border-neutral-800/80"
                              }`}
                            >
                              <div className="w-full flex items-center justify-between mb-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                    isLight
                                      ? "bg-white text-neutral-800 border-neutral-200"
                                      : "bg-[#1f212d] text-neutral-200 border-neutral-700/60"
                                  }`}
                                >
                                  {item.category}
                                </span>

                                <span className="px-3 py-1 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  {item.quantity.toLocaleString("en-IN")} {item.unitLabel} in order
                                </span>
                              </div>

                              {/* Centered Image Presentation Area */}
                              <div className="w-full h-40 flex items-center justify-center py-2">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.name}
                                    className="max-h-36 max-w-[240px] object-contain drop-shadow-xl rounded-xl transition-transform duration-300 hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                                    <div
                                      className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                                        isLight
                                          ? "bg-white border-neutral-200 text-neutral-600"
                                          : "bg-[#1f212d] border-neutral-700/60 text-emerald-400"
                                      }`}
                                    >
                                      <Package className="w-8 h-8" />
                                    </div>
                                    <span className="text-[11px] font-normal text-neutral-400">
                                      Verified On-Chain Inventory
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Product Details Content Sheet */}
                            <div className="p-5 space-y-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="font-editorial text-2xl font-light leading-snug">
                                    {item.name}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewProduct(item.rawProduct)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                                      isLight
                                        ? "border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                                        : "border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                                    }`}
                                    title="Expand full product specs"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Full specs</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                      isLight
                                        ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                        : "bg-[#181a22] text-neutral-300 border-neutral-800"
                                    }`}
                                  >
                                    {item.category}
                                  </span>
                                  <span>&bull;</span>
                                  <span className="font-mono">ID: #{item.id}</span>
                                  <span>&bull;</span>
                                  <span>{item.shelf}</span>
                                  {item.expDate && (
                                    <>
                                      <span>&bull;</span>
                                      <span>Exp: {item.expDate}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Description block */}
                              <div className="space-y-1 pt-1">
                                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
                                  Description
                                </div>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
                                  {item.description}
                                </p>
                              </div>

                              {/* Pricing & Units Breakdown */}
                              <div
                                className={`p-3.5 rounded-xl border grid grid-cols-3 gap-3 text-center ${
                                  isLight
                                    ? "bg-neutral-50/80 border-neutral-200"
                                    : "bg-[#111218] border-neutral-800/80"
                                }`}
                              >
                                <div>
                                  <span className="block text-[11px] text-neutral-400 font-medium">Quantity</span>
                                  <span className={`text-xs sm:text-sm font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                                    {item.quantity.toLocaleString("en-IN")} {item.unitLabel}
                                  </span>
                                </div>

                                <div className="border-x border-neutral-200/60 dark:border-neutral-800/60">
                                  <span className="block text-[11px] text-neutral-400 font-medium">Price / Unit</span>
                                  <span className={`text-xs sm:text-sm font-semibold ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                                    ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div>
                                  <span className="block text-[11px] text-neutral-400 font-medium">Item Subtotal</span>
                                  <span className={`text-xs sm:text-sm font-bold ${isLight ? "text-neutral-900" : "text-emerald-400"}`}>
                                    ₹{item.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
                  isLight ? "bg-neutral-50/70 border-neutral-200/80" : "bg-[#14151e] border-neutral-800/80"
                }`}
              >
                <span className="text-xs font-medium text-neutral-400">Total Order Value</span>
                <span className="font-editorial text-2xl font-light text-neutral-900 dark:text-white">
                  ₹{Number(selectedTransaction.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div
              className="p-5 border-t border-neutral-200/60 dark:border-neutral-800/80 flex justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => handlePrint(selectedTransaction)}
                className={`px-5 py-2.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight ? "border-neutral-300 text-neutral-800 hover:border-black bg-white" : "border-neutral-700 text-neutral-300 hover:border-white bg-[#14151a]"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                Print Manifest
              </button>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  isLight ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          isLight={isLight}
          onAction={null}
        />
      )}
    </ManufacturerLayout>
  );
}
