"use client";

import React, { useState, useEffect, useMemo } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import TablePagination from "@/components/retailer/TablePagination";
import { TableSkeletonRows, OrdersPageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Printer,
  Pencil,
  Check,
} from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const PAGE_SIZE = 7;

export default function RetailerOrdersPage() {
  const { userId, userName } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Data states
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4500);
  };

  // Fetch orders and products
  useEffect(() => {
    if (!userId) return;

    const fetchOrdersAndProducts = async () => {
      setLoading(true);
      try {
        const [ordersRes, prodsRes] = await Promise.all([
          fetch(`${API_BASE}/getAllOrders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }),
          fetch(`${API_BASE}/getProducts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) setOrders(ordersData);
        }

        if (prodsRes.ok) {
          const prodsData = await prodsRes.json();
          if (Array.isArray(prodsData)) setProducts(prodsData);
        }
      } catch (err) {
        console.error("Orders fetch error:", err);
        showError("Failed to fetch orders or products from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersAndProducts();
  }, [userId]);

  // Filtered orders by search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter((o) => {
      const name = String(o.customer_name || "").toLowerCase();
      const phone = String(o.phone_num || "").toLowerCase();
      const id = String(o.order_id || "").toLowerCase();
      const status = String(o.status || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q) || status.includes(q);
    });
  }, [orders, searchTerm]);

  // Paginated list
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  // Stats
  const paidCount = useMemo(
    () => orders.filter((o) => (o.status || "").toLowerCase() === "paid").length,
    [orders]
  );
  const unpaidCount = useMemo(
    () => orders.filter((o) => (o.status || "").toLowerCase() !== "paid").length,
    [orders]
  );
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    [orders]
  );

  // ----------------------------------------------------
  // Edit Order Logic
  // ----------------------------------------------------
  const handleOpenEdit = (order) => {
    const details = (order.order_details || []).map((detail) => ({
      product_id: detail.product_id,
      product_name: detail.product_name || "Medication",
      price_per_unit: Number(detail.price_per_unit || 0),
      quantity: Number(detail.quantity || 1),
    }));

    setEditingOrder({
      order_id: order.order_id,
      customer_name: order.customer_name || "",
      phone_num: order.phone_num || "",
      datetime: order.datetime || new Date().toISOString(),
      status: order.status || "unpaid",
      products: details.length > 0 ? details : [],
    });
  };

  const handleEditQuantityChange = (idx, newQuantity) => {
    const item = editingOrder?.products?.[idx];
    if (!item) return;

    const prod = products.find((p) => p.product_id === Number(item.product_id));
    const availableStock = prod ? Number(prod.quantity_of_uom ?? prod.quantity ?? 0) : 9999;
    const requested = Number(newQuantity);

    if (isNaN(requested) || requested < 1) {
      setEditingOrder((prev) => {
        const updated = [...prev.products];
        updated[idx] = { ...updated[idx], quantity: 1 };
        return { ...prev, products: updated };
      });
      return;
    }

    if (requested > availableStock) {
      showError(`Cannot exceed available inventory (${availableStock} units) for "${item.product_name}".`);
      setEditingOrder((prev) => {
        const updated = [...prev.products];
        updated[idx] = { ...updated[idx], quantity: availableStock > 0 ? availableStock : 1 };
        return { ...prev, products: updated };
      });
      return;
    }

    setEditingOrder((prev) => {
      const updated = [...prev.products];
      updated[idx] = { ...updated[idx], quantity: requested };
      return { ...prev, products: updated };
    });
  };

  const handleEditProductSelect = (idx, selectedProductId) => {
    const prod = products.find((p) => p.product_id === Number(selectedProductId));
    if (!prod) return;

    const availableStock = Number(prod.quantity_of_uom ?? prod.quantity ?? 0);

    setEditingOrder((prev) => {
      const updated = [...prev.products];
      const currentQty = updated[idx]?.quantity || 1;
      const safeQty = Math.min(currentQty, availableStock > 0 ? availableStock : 1);
      updated[idx] = {
        ...updated[idx],
        product_id: prod.product_id,
        product_name: prod.name,
        price_per_unit: Number(prod.price_per_unit || 0),
        quantity: safeQty,
      };
      return { ...prev, products: updated };
    });
  };

  const handleAddProductRow = () => {
    if (products.length === 0) {
      showError("No products available to add.");
      return;
    }
    const defaultProd = products[0];
    const availableStock = Number(defaultProd.quantity_of_uom ?? defaultProd.quantity ?? 0);
    if (availableStock <= 0) {
      showError(`"${defaultProd.name}" is currently out of stock.`);
      return;
    }

    setEditingOrder((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          product_id: defaultProd.product_id,
          product_name: defaultProd.name,
          price_per_unit: Number(defaultProd.price_per_unit || 0),
          quantity: 1,
        },
      ],
    }));
  };

  const handleRemoveProductRow = (idx) => {
    setEditingOrder((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx),
    }));
  };

  const editingTotal = useMemo(() => {
    if (!editingOrder?.products) return 0;
    return editingOrder.products.reduce(
      (sum, p) => sum + Number(p.price_per_unit || 0) * Number(p.quantity || 1),
      0
    );
  }, [editingOrder]);

  const handleSaveOrder = async (statusOverride = null) => {
    if (!editingOrder) return;
    if (!editingOrder.customer_name.trim()) {
      showError("Customer name is required.");
      return;
    }
    if (!editingOrder.phone_num.trim()) {
      showError("Contact phone number is required.");
      return;
    }
    if (editingOrder.products.length === 0) {
      showError("Order must include at least one medication.");
      return;
    }

    // Validate that no item exceeds available inventory
    for (const item of editingOrder.products) {
      const prod = products.find((p) => p.product_id === Number(item.product_id));
      const availableStock = prod ? Number(prod.quantity_of_uom ?? prod.quantity ?? 0) : 9999;
      if (item.quantity > availableStock) {
        showError(`Cannot save order: "${item.product_name}" exceeds available stock (${availableStock} units left).`);
        return;
      }
    }

    setIsSubmitting(true);
    const finalStatus = statusOverride || editingOrder.status;

    const payload = {
      order_id: editingOrder.order_id,
      customer_name: editingOrder.customer_name,
      phone_num: editingOrder.phone_num,
      datetime: editingOrder.datetime,
      status: finalStatus,
      total: editingTotal,
      order_details: editingOrder.products.map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        price_per_unit: p.price_per_unit,
        quantity: p.quantity,
      })),
    };

    try {
      const response = await fetch(`${API_BASE}/updateOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.order_id === editingOrder.order_id
              ? {
                  ...o,
                  customer_name: payload.customer_name,
                  phone_num: payload.phone_num,
                  status: payload.status,
                  total: payload.total,
                  order_details: payload.order_details,
                }
              : o
          )
        );
        setEditingOrder(null);
        showSuccess(
          finalStatus === "paid" ? "Order marked as Paid and recorded." : "Order successfully updated."
        );
      } else {
        const err = await response.json();
        showError(err.error || "Failed to update order on server.");
      }
    } catch (err) {
      console.error("Save error:", err);
      showError("Network error while updating order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Pay Now Directly from Table
  // ----------------------------------------------------
  const handleDirectPay = async (order) => {
    const payload = {
      order_id: order.order_id,
      customer_name: order.customer_name,
      phone_num: order.phone_num,
      datetime: order.datetime,
      status: "paid",
      total: order.total,
      order_details: (order.order_details || []).map((d) => ({
        product_id: d.product_id,
        quantity: d.quantity,
      })),
    };

    try {
      const response = await fetch(`${API_BASE}/updateOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.order_id === order.order_id ? { ...o, status: "paid" } : o))
        );
        showSuccess(`Order #ORD-${order.order_id} marked as Paid.`);
      } else {
        showError("Failed to update payment status.");
      }
    } catch (err) {
      showError("Network error updating payment status.");
    }
  };

  // ----------------------------------------------------
  // Delete Order Logic
  // ----------------------------------------------------
  const confirmDeleteOrder = async () => {
    if (!deleteTargetId) return;
    try {
      const response = await fetch(`${API_BASE}/delete_order/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOrders((prev) => prev.filter((o) => o.order_id !== deleteTargetId));
        showSuccess(`Order #ORD-${deleteTargetId} permanently deleted.`);
      } else {
        showError("Failed to delete order from database.");
      }
    } catch (err) {
      showError("Network error deleting order.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  // ----------------------------------------------------
  // Generate & Download PDF Invoice with QR Code
  // ----------------------------------------------------
  const handlePrintInvoice = async (order) => {
    try {
      const doc = new jsPDF();
      const storeName = userName || "Maa Tara Store";

      // Header Banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 40, "F");

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(storeName.toUpperCase(), 15, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(190, 200, 220);
      doc.text("Clinical Dispensary & Pharmaceutical Ledger Invoice", 15, 28);
      doc.text(`Invoice Generated: ${new Date().toLocaleDateString("en-IN")}`, 15, 34);

      // Customer & Order Metadata
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CUSTOMER DETAILS", 15, 52);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text(`Patient / Customer: ${order.customer_name || "Walk-in Patient"}`, 15, 60);
      doc.text(`Contact Phone: ${order.phone_num || "N/A"}`, 15, 66);
      doc.text(`Order ID: #ORD-${order.order_id}`, 15, 72);
      doc.text(
        `Disbursement Date: ${
          order.datetime ? new Date(order.datetime).toLocaleString("en-IN") : "N/A"
        }`,
        15,
        78
      );
      doc.text(
        `Fulfillment Status: ${(order.status || "unpaid").toUpperCase()}`,
        15,
        84
      );

      // Generate Scannable QR Code
      const qrData = `STORE: ${storeName}\nORDER: #ORD-${order.order_id}\nCUSTOMER: ${order.customer_name}\nTOTAL: Rs. ${Number(
        order.total || 0
      ).toFixed(2)}\nSTATUS: ${order.status}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
      doc.addImage(qrDataUrl, "PNG", 145, 48, 48, 48);

      // Table Header
      let y = 105;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 5, 180, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      doc.text("ITEM / FORMULATION", 20, y + 1);
      doc.text("QTY", 105, y + 1);
      doc.text("PRICE / UNIT", 130, y + 1);
      doc.text("LINE TOTAL", 165, y + 1);

      doc.setDrawColor(203, 213, 225);
      doc.line(15, y + 6, 195, y + 6);

      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const items = order.products || order.order_details || [];
      items.forEach((p, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const qty = Number(p.quantity || 1);
        const rate = Number(p.price_per_unit || 0);
        const lineTotal = qty * rate;

        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y - 5, 180, 9, "F");
        }

        doc.setTextColor(30, 41, 59);
        doc.text(p.product_name || `Product #${p.product_id}`, 20, y);
        doc.text(String(qty), 105, y);
        doc.text(`Rs. ${rate.toFixed(2)}`, 130, y);
        doc.text(`Rs. ${lineTotal.toFixed(2)}`, 165, y);

        y += 9;
      });

      // Divider & Totals
      y += 6;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, 195, y);

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(`GRAND TOTAL: Rs. ${Number(order.total || editingTotal || 0).toFixed(2)}`, 15, y);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for your dispensary order. Please retain this invoice for your health records.", 15, y + 12);

      doc.save(`Invoice_ORD_${order.order_id}.pdf`);
      showSuccess(`Invoice for Order #ORD-${order.order_id} downloaded.`);
    } catch (err) {
      console.error("PDF generation error:", err);
      showError("Failed to generate PDF invoice.");
    }
  };

  return (
    <RetailerLayout
      title="Orders Management"
      subtitle="Complete ledger of patient prescriptions, retail disbursements, and transaction records."
      badge="Order Ledger"
    >
      {loading ? (
        <OrdersPageSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-6">
        {/* Top Action Bar (Matching Add Product clean buttons) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer name, order id, or phone..."
              className={`w-full h-10 pl-10 pr-4 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                isLight
                  ? "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black"
                  : "bg-[#101116] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600"
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/retailer/warehouse"
              className={`inline-flex items-center text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
                isLight
                  ? "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300 shadow-sm"
                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-300 border-neutral-800"
              }`}
            >
              Storage Kiosk
            </Link>

            <Link
              href="/retailer/addorders"
              className={`inline-flex items-center text-xs font-semibold px-5 py-2 rounded-full border transition-all shadow-sm ${
                isLight
                  ? "bg-neutral-900 hover:bg-black text-white border-neutral-900"
                  : "bg-white hover:bg-neutral-200 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              }`}
            >
              + Create Order
            </Link>
          </div>
        </div>

        {/* Toasts */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="cursor-pointer hover:underline">
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="cursor-pointer hover:underline">
              ✕
            </button>
          </div>
        )}

        {/* 1. TOP STATS ROW (Matching Product Catalog & SKUs Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Total Orders */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Total Orders</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight
                    ? "bg-neutral-100 border-neutral-200 text-neutral-700"
                    : "bg-[#181920] border-neutral-700/60 text-neutral-300"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-editorial text-3xl sm:text-4xl font-light ${
                isLight ? "text-neutral-900" : "text-white"
              }`}
            >
              {orders.length}
            </div>
            <p className="text-xs text-neutral-500">Recorded prescriptions</p>
          </div>

          {/* 2. Settled (Paid) */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Settled (Paid)</span>
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
              {paidCount}
            </div>
            <p className="text-xs text-neutral-500">Paid disbursements</p>
          </div>

          {/* 3. Pending (Unpaid) */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Pending (Unpaid)</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight
                    ? "bg-amber-50/80 border-amber-200 text-amber-600"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-editorial text-3xl sm:text-4xl font-light ${
                unpaidCount > 0
                  ? "text-amber-500"
                  : isLight
                  ? "text-neutral-900"
                  : "text-white"
              }`}
            >
              {unpaidCount}
            </div>
            <p className="text-xs text-neutral-500">Awaiting settlement</p>
          </div>

          {/* 4. Dispensary Revenue */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Dispensary Revenue</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight
                    ? "bg-purple-50/80 border-purple-200 text-purple-600"
                    : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                }`}
              >
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-editorial text-3xl sm:text-4xl font-light ${
                isLight ? "text-neutral-900" : "text-white"
              }`}
            >
              ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-neutral-500">Gross prescription value</p>
          </div>
        </div>

        {/* 2. ORDERS TABLE (Add Product Clean Theme) */}
        <div
          className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/80">
            <div className="space-y-1">
              <h2 className={`font-editorial text-xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
                Dispensary Prescription Ledger
              </h2>
              <p className="text-xs text-neutral-400">
                Verified records of medicinal dispensations, fulfillment statuses, and invoices.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 font-medium shrink-0 self-start sm:self-auto">
              {filteredOrders.length} {filteredOrders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead
                className={`border-b ${
                  isLight
                    ? "bg-neutral-50/80 border-neutral-200 text-neutral-500"
                    : "bg-[#14151a] text-neutral-400 border-neutral-800"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Order ID</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Customer / Patient</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Contact Phone</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Total Bill</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}
              >
                {loading ? (
                  <TableSkeletonRows columns={7} rows={6} isLight={isLight} />
                ) : filteredOrders.length > 0 ? (
                  paginatedOrders.map((o) => {
                    const isPaid = (o.status || "").toLowerCase() === "paid";
                    return (
                      <tr
                        key={o.order_id}
                        className={`${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-white/[0.03]"
                        } transition-colors`}
                      >
                        {/* Order ID */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isLight
                                ? "bg-neutral-100 text-neutral-800 border border-neutral-200"
                                : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                            }`}
                          >
                            #ORD-{o.order_id}
                          </span>
                        </td>

                        {/* Customer */}
                        <td
                          className={`py-3.5 px-4 font-medium ${
                            isLight ? "text-neutral-900" : "text-white"
                          }`}
                        >
                          {o.customer_name || "Walk-in Patient"}
                        </td>

                        {/* Date */}
                        <td
                          className={`py-3.5 px-4 text-xs ${
                            isLight ? "text-neutral-600" : "text-neutral-400"
                          }`}
                        >
                          {o.datetime
                            ? new Date(o.datetime).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>

                        {/* Phone */}
                        <td
                          className={`py-3.5 px-4 text-xs ${
                            isLight ? "text-neutral-600" : "text-neutral-400"
                          }`}
                        >
                          {o.phone_num || "—"}
                        </td>

                        {/* Total */}
                        <td
                          className={`py-3.5 px-4 font-semibold text-sm ${
                            isLight ? "text-neutral-900" : "text-white"
                          }`}
                        >
                          ₹{Number(o.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleDirectPay(o)}
                                className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                  isLight
                                    ? "bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border-neutral-200 hover:border-emerald-200"
                                    : "bg-[#14151a] hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border-neutral-800 hover:border-emerald-500/30"
                                }`}
                                title="Mark as Paid"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handlePrintInvoice(o)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="Print Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(o)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="Edit Order"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(o.order_id)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border-neutral-200 hover:border-rose-200"
                                  : "bg-[#14151a] hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border-neutral-800 hover:border-rose-500/30"
                              }`}
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 text-center text-xs text-neutral-400 space-y-1"
                    >
                      <div>No customer orders match your query.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            isLight={isLight}
          />
        </div>
      </div>
      )}

        {/* 3. EDIT ORDER MODAL (Add Product Theme) */}
        {editingOrder && (
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setEditingOrder(null)}
          >
            <div
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 sm:p-8 space-y-6 ${
                isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#0f1118] border-neutral-800 text-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="space-y-1 border-b border-neutral-200/60 dark:border-neutral-800/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                    Edit Prescription Order #ORD-{editingOrder.order_id}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Modify patient details, item quantities, and status.
                  </p>
                </div>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="text-neutral-400 hover:text-white cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Patient Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingOrder.customer_name}
                    onChange={(e) =>
                      setEditingOrder((prev) => ({ ...prev, customer_name: e.target.value }))
                    }
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                        : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingOrder.phone_num}
                    onChange={(e) =>
                      setEditingOrder((prev) => ({ ...prev, phone_num: e.target.value }))
                    }
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                        : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Payment Status
                  </label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) =>
                      setEditingOrder((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-white border-neutral-300 text-neutral-900 focus:border-black"
                        : "bg-[#101116] border-neutral-800 text-white focus:border-neutral-600"
                    }`}
                  >
                    <option value="unpaid">Unpaid / Pending</option>
                    <option value="paid">Paid / Settled</option>
                  </select>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-400">
                    Order Items ({editingOrder.products.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddProductRow}
                    className="text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editingOrder.products.map((item, idx) => {
                    const lineTotal = Number(item.price_per_unit || 0) * Number(item.quantity || 1);
                    const prod = products.find((p) => p.product_id === Number(item.product_id));
                    const availableStock = prod ? Number(prod.quantity_of_uom ?? prod.quantity ?? 0) : 9999;
                    const isAtMax = item.quantity >= availableStock;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center gap-3 ${
                          isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#141622] border-neutral-800"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleEditProductSelect(idx, e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                              isLight
                                ? "bg-white border-neutral-300 text-neutral-900"
                                : "bg-[#1a1c2c] border-neutral-700 text-white"
                            }`}
                          >
                            {products.map((p) => (
                              <option key={p.product_id} value={p.product_id}>
                                {p.name} (₹{Number(p.price_per_unit || 0).toFixed(2)}) &bull; Stock: {p.quantity_of_uom ?? 0}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            max={availableStock}
                            value={item.quantity}
                            onChange={(e) => handleEditQuantityChange(idx, e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg text-xs text-center border outline-none ${
                              isLight
                                ? "bg-white border-neutral-300 text-neutral-900"
                                : "bg-[#1a1c2c] border-neutral-700 text-white"
                            }`}
                          />
                          <div className={`text-[10px] text-center mt-0.5 ${isAtMax ? "text-amber-500 font-semibold" : "text-neutral-400"}`}>
                            Max: {availableStock}
                          </div>
                        </div>

                        <div className="text-xs text-neutral-400 w-24 text-right">
                          ₹{Number(item.price_per_unit || 0).toFixed(2)}
                        </div>

                        <div className="text-xs font-semibold text-emerald-500 w-24 text-right">
                          ₹{lineTotal.toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProductRow(idx)}
                          className="text-neutral-400 hover:text-rose-500 cursor-pointer p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isLight ? "bg-neutral-50 border-neutral-200" : "bg-[#131520] border-neutral-800"
                }`}
              >
                <div>
                  <span className="text-xs text-neutral-400">Total Order Amount</span>
                  <div className="text-xl font-bold text-emerald-500 mt-0.5">
                    ₹{editingTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintInvoice(editingOrder)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isLight
                      ? "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                      : "bg-[#1c1e2e] border-neutral-700 text-neutral-200 hover:bg-white/5"
                  }`}
                >
                  Print Invoice
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer ${
                    isLight
                      ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                      : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  Cancel
                </button>

                {editingOrder.status !== "paid" && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSaveOrder("paid")}
                    className="px-5 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition-all"
                  >
                    {isSubmitting ? "Processing..." : "Pay & Settle"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveOrder()}
                  className={`px-6 py-2 rounded-full text-xs font-semibold cursor-pointer shadow-md transition-all ${
                    isLight
                      ? "bg-neutral-900 hover:bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. DELETE CONFIRMATION MODAL */}
        {deleteTargetId && (
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setDeleteTargetId(null)}
          >
            <div
              className={`relative w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4 ${
                isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#0f1118] border-neutral-800 text-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h4 className="font-semibold text-base">Delete Order #ORD-{deleteTargetId}?</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  This will permanently remove the order and its line items from your records.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    isLight
                      ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                      : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteOrder}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
    </RetailerLayout>
  );
}
