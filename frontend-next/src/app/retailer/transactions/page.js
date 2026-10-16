"use client";

import React, { useState, useEffect, useMemo } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import TablePagination from "@/components/retailer/TablePagination";
import { TableSkeletonRows, TransactionsPageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import {
  Factory,
  Warehouse,
  Search,
  Eye,
  Trash2,
  Printer,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Phone,
  User,
  Package,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const PAGE_SIZE = 7;

export default function RetailerTransactionsPage() {
  const { userId, userName } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Tab: 'manufacturer' | 'wholesaler'
  const [activeSection, setActiveSection] = useState("manufacturer");

  // Transaction datasets
  const [manufacturerTransactions, setManufacturerTransactions] = useState([]);
  const [wholesalerTransactions, setWholesalerTransactions] = useState([]);
  const [manufacturerUsers, setManufacturerUsers] = useState({});
  const [wholesalerUsers, setWholesalerUsers] = useState({});

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected for Details Modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Printing state
  const [isPrinting, setIsPrinting] = useState(false);

  // Notifications
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage("");
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage("");
  };

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 8000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 8000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // Fetch all necessary data on mount & when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [mUsersRes, wUsersRes, mTxRes, wTxRes] = await Promise.all([
          fetch(`${API_BASE}/get_manufacturer_users`),
          fetch(`${API_BASE}/get_wholesaler_users`),
          fetch(`${API_BASE}/get_all_transactions_retailer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }),
          fetch(`${API_BASE}/get_all_transactions_for_retailer_to_wholesaler`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }),
        ]);

        if (mUsersRes.ok) {
          const mUsers = await mUsersRes.json();
          setManufacturerUsers(mUsers || {});
        }

        if (wUsersRes.ok) {
          const wUsers = await wUsersRes.json();
          setWholesalerUsers(wUsers || {});
        }

        if (mTxRes.ok) {
          const mTx = await mTxRes.json();
          setManufacturerTransactions(Array.isArray(mTx) ? mTx : []);
        }

        if (wTxRes.ok) {
          const wTx = await wTxRes.json();
          setWholesalerTransactions(Array.isArray(wTx) ? wTx : []);
        }
      } catch (err) {
        console.error("Error loading transactions:", err);
        showError("Failed to fetch procurement shipment records from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  // Lookup supplier name
  const getUserName = (tx) => {
    if (!tx) return "Unknown";
    try {
      if (activeSection === "manufacturer") {
        if (tx.manu_id && manufacturerUsers) {
          const entry = Object.entries(manufacturerUsers).find(
            ([_, id]) => String(id) === String(tx.manu_id)
          );
          return entry ? entry[0] : `Manufacturer #${tx.manu_id}`;
        }
      } else {
        if (tx.whole_id && wholesalerUsers) {
          const entry = Object.entries(wholesalerUsers).find(
            ([_, id]) => String(id) === String(tx.whole_id)
          );
          return entry ? entry[0] : `Wholesaler #${tx.whole_id}`;
        }
      }
      return "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const calculateTotalQuantity = (orderDetails) => {
    if (!Array.isArray(orderDetails)) return 0;
    return orderDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  // Delete Action
  const handleDelete = async () => {
    if (!deleteTarget) return;

    const { order_id, section } = deleteTarget;
    const url =
      section === "manufacturer"
        ? `${API_BASE}/delete_transaction/${order_id}`
        : `${API_BASE}/delete_transaction_retailer_to_wholesaler/${order_id}`;

    setIsDeleting(true);
    try {
      const response = await fetch(url, { method: "DELETE" });

      if (response.ok) {
        if (section === "manufacturer") {
          setManufacturerTransactions((prev) => prev.filter((t) => t.order_id !== order_id));
        } else {
          setWholesalerTransactions((prev) => prev.filter((t) => t.order_id !== order_id));
        }

        if (selectedTransaction && selectedTransaction.order_id === order_id) {
          setSelectedTransaction(null);
        }

        showSuccess(`Order #${order_id} deleted successfully from records.`);
      } else {
        const err = await response.json().catch(() => ({}));
        showError(`Failed to delete order: ${err.message || err.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      showError(`Network error while deleting order #${order_id}.`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filtered dataset
  const activeDataset = activeSection === "manufacturer" ? manufacturerTransactions : wholesalerTransactions;

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return activeDataset;
    const q = searchQuery.toLowerCase();

    return activeDataset.filter((t) => {
      const cName = (t.customer_name || "").toLowerCase();
      const orderId = (t.order_id || "").toString().toLowerCase();
      const phone = (t.phone_num || "").toLowerCase();
      const supplier = getUserName(t).toLowerCase();
      const status = (t.status || "").toLowerCase();
      const date = (t.datetime || "").toLowerCase();

      return (
        cName.includes(q) ||
        orderId.includes(q) ||
        phone.includes(q) ||
        supplier.includes(q) ||
        status.includes(q) ||
        date.includes(q)
      );
    });
  }, [activeDataset, searchQuery, activeSection, manufacturerUsers, wholesalerUsers]);

  // Paginated dataset
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  // Print PDF Invoice for Selected Transaction
  const handlePrint = async (tx = selectedTransaction) => {
    if (!tx) return;

    setIsPrinting(true);
    try {
      const doc = new jsPDF();
      const supplierName = getUserName(tx);

      // Header Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 25);
      doc.text("NIRVANA SMART CHAIN", 20, 22);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 110, 120);
      doc.text("Shipment Transaction Statement", 20, 29);

      // Meta Box
      doc.setDrawColor(230, 230, 235);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(20, 36, 170, 42, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 50);

      doc.setFont("helvetica", "bold");
      doc.text("Order ID:", 25, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`ORDER#${tx.order_id}`, 60, 45);

      doc.setFont("helvetica", "bold");
      doc.text("Retailer Node:", 25, 52);
      doc.setFont("helvetica", "normal");
      doc.text(String(tx.customer_name || "N/A"), 60, 52);

      doc.setFont("helvetica", "bold");
      doc.text("Phone Number:", 25, 59);
      doc.setFont("helvetica", "normal");
      doc.text(String(tx.phone_num || "N/A"), 60, 59);

      doc.setFont("helvetica", "bold");
      doc.text(activeSection === "manufacturer" ? "Manufacturer:" : "Wholesaler:", 25, 66);
      doc.setFont("helvetica", "normal");
      doc.text(supplierName, 60, 66);

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 25, 73);
      doc.setFont("helvetica", "normal");
      doc.text(String(tx.datetime || "N/A"), 60, 73);

      // Products Table
      const orderDetails = Array.isArray(tx.order_details) ? tx.order_details : [];
      const tableRows = orderDetails.map((prod, idx) => [
        idx + 1,
        prod.product_name || "Pharmaceutical Item",
        prod.quantity || 1,
        `Rs. ${Number(prod.price_per_unit || 0).toFixed(2)}`,
        `Rs. ${Number(prod.total_price || 0).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 86,
        head: [["#", "Product Formulation", "Quantity", "Price per Unit", "Line Total (INR)"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [17, 18, 24],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 70 },
          2: { cellWidth: 24, halign: "center" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 32, halign: "right" },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 12;

      // Summary
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 25);
      doc.text(
        `Total Amount: Rs. ${Number(tx.total || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        120,
        finalY
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 110);
      doc.text(`Payment Status: ${(tx.status || "unpaid").toUpperCase()}`, 120, finalY + 6);

      doc.save(`transaction-ORDER-${tx.order_id}.pdf`);
      showSuccess(`PDF statement for ORDER#${tx.order_id} generated successfully!`);
    } catch (err) {
      console.error("PDF generation error:", err);
      showError("Failed to generate PDF document.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <RetailerLayout
      title="My Shipments"
      subtitle="Track, inspect, and manage procurement shipments placed to Manufacturers and Wholesalers with full itemization and PDF printouts."
      badge="Shipments & Ledger"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/retailer/addtransaction"
            className={`inline-flex items-center gap-2 h-9 sm:h-10 px-5 sm:px-6 rounded-full text-xs sm:text-[14px] font-semibold transition-all shadow-sm cursor-pointer ${
              isLight
                ? "bg-neutral-900 hover:bg-black text-white"
                : "bg-white hover:bg-neutral-200 text-black"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order Shipment</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Floating Top Alert Banners */}
        {errorMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 break-words ${
              isLight
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-rose-950/40 text-rose-200 border-rose-900/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Notification / Reason</span>
                <span className="font-normal opacity-90 leading-relaxed block">{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer p-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-2 shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between text-xs sm:text-sm font-medium animate-in fade-in duration-300 break-words ${
              isLight
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-emerald-950/40 text-emerald-200 border-emerald-900/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold block">Operation Succeeded</span>
                <span className="font-normal opacity-90 leading-relaxed block">{successMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-500 hover:text-emerald-700 text-xs cursor-pointer p-1 rounded-lg hover:bg-emerald-500/10 transition-colors ml-2 shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Header Toolbar: Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Channel Tabs */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-neutral-100 dark:bg-[#14151e] border border-neutral-200 dark:border-neutral-800 shadow-sm w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveSection("manufacturer");
                setCurrentPage(1);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                activeSection === "manufacturer"
                  ? isLight
                    ? "bg-neutral-900 hover:bg-black text-white shadow-sm"
                    : "bg-white hover:bg-neutral-200 text-black shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-black bg-transparent"
                  : "text-neutral-400 hover:text-white bg-transparent"
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Shipments to Manufacturer ({manufacturerTransactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection("wholesaler");
                setCurrentPage(1);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                activeSection === "wholesaler"
                  ? isLight
                    ? "bg-neutral-900 hover:bg-black text-white shadow-sm"
                    : "bg-white hover:bg-neutral-200 text-black shadow-sm"
                  : isLight
                  ? "text-neutral-600 hover:text-black bg-transparent"
                  : "text-neutral-400 hover:text-white bg-transparent"
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Shipments to Wholesaler ({wholesalerTransactions.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by order ID, customer, date..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-full border text-xs sm:text-sm transition-all outline-none ${
                isLight
                  ? "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 shadow-xs"
                  : "bg-[#13141b] border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-600"
              }`}
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Main Transactions Table */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0c0d11] border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.6)]"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr
                  className={`border-b text-xs font-semibold ${
                    isLight
                      ? "border-neutral-200 text-neutral-600 bg-neutral-50/80"
                      : "border-neutral-800 text-neutral-300 bg-[#121318]"
                  }`}
                >
                  <th className="py-3.5 px-4 font-mono">Order ID</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">
                    {activeSection === "manufacturer" ? "Manufacturer" : "Wholesaler"}
                  </th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Total Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/70 font-sans">
                {loading ? (
                  <TableSkeletonRows columns={9} rows={5} isLight={isLight} />
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-neutral-400 text-xs sm:text-sm">
                      {searchQuery
                        ? "No matching shipment transactions found."
                        : `No shipment orders recorded with ${
                            activeSection === "manufacturer" ? "Manufacturers" : "Wholesalers"
                          }. Click 'Order Shipment' to create one.`}
                    </td>
                  </tr>
                ) : (
                      paginatedTransactions.map((tx) => {
                        const supplierName = getUserName(tx);
                        const statusLower = (tx.status || "").toLowerCase();
                        const isPaid = statusLower === "paid" || statusLower === "completed";

                        return (
                          <tr
                            key={tx.order_id}
                            className={`transition-colors ${
                              isLight ? "hover:bg-neutral-50/60" : "hover:bg-[#151620]/60"
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                              ORDER#{tx.order_id}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-neutral-800 dark:text-neutral-200">
                              {tx.customer_name || userName || "Dispensary"}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                              {tx.phone_num || "N/A"}
                            </td>
                            <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 text-xs">
                              {tx.datetime || "N/A"}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-neutral-800 dark:text-neutral-200">
                              {supplierName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                              {calculateTotalQuantity(tx.order_details)} pcs
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900 dark:text-white">
                              Rs. {Number(tx.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  isPaid
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {tx.status || "unpaid"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTransaction(tx)}
                                  title="View order details"
                                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                                    isLight
                                      ? "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-xs"
                                      : "bg-[#181a24] hover:bg-[#222432] border-neutral-700 text-neutral-300"
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      order_id: tx.order_id,
                                      section: activeSection,
                                    })
                                  }
                                  title="Delete order record"
                                  className="p-2 rounded-full text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

              {/* Table Pagination */}
              {!loading && filteredTransactions.length > PAGE_SIZE && (
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                  <TablePagination
                    currentPage={currentPage}
                    totalItems={filteredTransactions.length}
                    itemsPerPage={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                    isLight={isLight}
                  />
                </div>
              )}
            </div>

        {/* 3. Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`w-full max-w-2xl rounded-2xl border p-6 sm:p-7 space-y-6 shadow-2xl transition-all ${
                isLight ? "bg-white border-neutral-300 text-neutral-900" : "bg-[#0d0e12] border-neutral-800 text-white"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="font-editorial text-xl font-light">
                    Shipment Statement #{selectedTransaction.order_id}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Detailed line items and order consignment parameters
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Metadata Grid */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl border text-xs ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#14151e] border-neutral-800"
                }`}
              >
                <div>
                  <span className="text-neutral-400">Customer Node: </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {selectedTransaction.customer_name || userName}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Phone Number: </span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {selectedTransaction.phone_num || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Date & Timestamp: </span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {selectedTransaction.datetime || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">
                    {activeSection === "manufacturer" ? "Manufacturer: " : "Wholesaler: "}
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {getUserName(selectedTransaction)}
                  </span>
                </div>
              </div>

              {/* Products Table inside Modal */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Consignment Line Items
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr
                        className={`border-b font-semibold ${
                          isLight
                            ? "border-neutral-200 text-neutral-600 bg-neutral-100/70"
                            : "border-neutral-800 text-neutral-300 bg-[#14151e]"
                        }`}
                      >
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80 font-sans">
                      {Array.isArray(selectedTransaction.order_details) &&
                      selectedTransaction.order_details.length > 0 ? (
                        selectedTransaction.order_details.map((item, idx) => (
                          <tr key={idx} className={isLight ? "hover:bg-neutral-50" : "hover:bg-[#161722]"}>
                            <td className="py-2.5 px-3 font-medium text-neutral-800 dark:text-neutral-200">
                              {item.product_name || `Product #${item.product_id}`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              Rs. {Number(item.price_per_unit || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold">
                              Rs. {Number(item.total_price || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-neutral-400">
                            No product details found for this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total & Status */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-neutral-400">Status: </span>
                  <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                    {selectedTransaction.status || "unpaid"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Total Purchase Value</div>
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    Rs.{" "}
                    {Number(selectedTransaction.total || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedTransaction)}
                  disabled={isPrinting}
                  className={`h-9 sm:h-10 px-5 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                    isLight
                      ? "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800 shadow-xs"
                      : "bg-[#181a24] hover:bg-[#222432] border-neutral-700 text-neutral-200"
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className={`h-9 sm:h-10 px-6 rounded-full text-xs sm:text-[13px] font-semibold transition-all shadow-sm cursor-pointer ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Delete Confirmation Dialog */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl transition-all ${
                isLight ? "bg-white border-neutral-300 text-neutral-900" : "bg-[#0d0e12] border-neutral-800 text-white"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-editorial text-xl font-light">Delete Shipment Record?</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Are you sure you want to delete order{" "}
                  <span className="font-mono font-semibold">ORDER#{deleteTarget.order_id}</span>? This action will
                  remove the record and order items permanently.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className={`h-9 sm:h-10 px-6 rounded-full text-xs sm:text-[13px] font-semibold border transition-all cursor-pointer shadow-sm ${
                    isLight
                      ? "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800 shadow-xs"
                      : "bg-[#181a24] hover:bg-[#222432] border-neutral-700 text-neutral-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-9 sm:h-10 px-6 rounded-full text-xs sm:text-[13px] font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RetailerLayout>
  );
}
