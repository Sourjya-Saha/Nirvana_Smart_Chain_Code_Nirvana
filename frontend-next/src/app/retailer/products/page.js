"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import RetailerLayout from "@/components/RetailerLayout";
import TablePagination from "@/components/retailer/TablePagination";
import { TableSkeletonRows, StatCardSkeleton, ProductsPageSkeleton } from "@/components/ui/Skeleton";
import { getProductImageUrl } from "@/lib/imageBlobUtils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  Printer,
  X,
  UploadCloud,
  Loader2,
  Warehouse,
  Calendar,
  Layers,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const PAGE_SIZE = 6;

function toSafeIsoDate(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const match = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function formatDisplayDate(val) {
  if (!val) return "—";
  const iso = toSafeIsoDate(val);
  if (iso) {
    const [y, m, d] = iso.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  }
  return String(val).slice(0, 10);
}

export default function RetailerProductsPage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const printTableRef = useRef(null);

  // UOMs list
  const [uoms, setUoms] = useState([
    { uom_id: 1, uom_name: "each" },
    { uom_id: 2, uom_name: "kg" },
    { uom_id: 3, uom_name: "ml" },
    { uom_id: 4, uom_name: "dozen" },
    { uom_id: 5, uom_name: "100 units" },
  ]);

  // Fetch UOMs
  useEffect(() => {
    const fetchUOMs = async () => {
      try {
        const res = await fetch(`${API_BASE}/getUOM`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setUoms(data);
          }
        }
      } catch (e) {
        console.warn("Could not fetch UOMs:", e);
      }
    };
    fetchUOMs();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/getProducts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } else {
        setErrorMessage("Failed to load products from server.");
      }
    } catch (err) {
      console.error("Products fetch error:", err);
      setErrorMessage("Could not connect to drug inventory server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Handle Edit modal opening
  const openEditModal = (p) => {
    const safeDate = toSafeIsoDate(p.exp_date);
    let matchedUomId = p.uom_id;
    if (!matchedUomId && p.uom_name && uoms.length > 0) {
      const found = uoms.find((u) => u.uom_name?.toLowerCase() === p.uom_name?.toLowerCase());
      if (found) matchedUomId = found.uom_id;
    }
    setEditingProduct(p);
    setEditFormData({
      product_id: p.product_id ?? p.id,
      name: p.name || p.product_name || "",
      category: p.category || "",
      exp_date: safeDate,
      price_per_unit: p.price_per_unit ?? p.price ?? "",
      quantity_of_uom: p.quantity_of_uom ?? p.quantity ?? p.stock ?? "",
      shelf_num: p.shelf_num || "",
      description: p.description || "",
      uom_id: matchedUomId || 1,
      newImageFile: null,
      newFileAttached: false,
    });
    setEditImagePreview(getProductImageUrl(p.picture_of_the_prod));
  };

  const closeEditModal = () => {
    if (editImagePreview && editImagePreview.startsWith("blob:") && editFormData.newFileAttached) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditingProduct(null);
    setEditFormData({});
    setEditImagePreview(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]:
        name === "price_per_unit" || name === "quantity_of_uom"
          ? value === ""
            ? ""
            : Number(value)
          : name === "uom_id"
          ? Number(value)
          : value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (editImagePreview && editImagePreview.startsWith("blob:") && editFormData.newFileAttached) {
        URL.revokeObjectURL(editImagePreview);
      }
      const blobUrl = URL.createObjectURL(file);
      setEditImagePreview(blobUrl);
      setEditFormData((prev) => ({
        ...prev,
        newImageFile: file,
        newFileAttached: true,
      }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name?.trim()) {
      setErrorMessage("Product name cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setErrorMessage("");

    try {
      const payload = {
        product_id: editFormData.product_id,
        name: editFormData.name.trim(),
        category: editFormData.category?.trim() || "Prescription Drug",
        exp_date: toSafeIsoDate(editFormData.exp_date),
        price_per_unit: Number(editFormData.price_per_unit) || 0,
        quantity_of_uom: Number(editFormData.quantity_of_uom) || 0,
        shelf_num: editFormData.shelf_num?.trim() || "A1",
        description: editFormData.description?.trim() || "",
        uom_id: Number(editFormData.uom_id) || 1,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      if (editFormData.newImageFile instanceof File) {
        formData.append("image", editFormData.newImageFile, editFormData.newImageFile.name || "edited_product.jpg");
      }

      const res = await fetch(`${API_BASE}/editProduct`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success !== false) {
          setSuccessMessage(`Product "${payload.name}" updated successfully!`);
          closeEditModal();
          fetchProducts();
        } else {
          setErrorMessage("Failed to update product on server.");
        }
      } else {
        setErrorMessage("Server returned error updating product.");
      }
    } catch (err) {
      setErrorMessage("Network error: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name || `SKU #${id}`}" from your inventory?`)) {
      return;
    }

    setIsDeletingId(id);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/deleteProduct/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success !== false) {
          setProducts((prev) => prev.filter((p) => (p.product_id ?? p.id) !== id));
          setSuccessMessage(`Product #${id} removed from inventory.`);
        } else {
          setErrorMessage(data.error || "Failed to delete product.");
        }
      } else {
        setErrorMessage("Failed to delete product from server.");
      }
    } catch (err) {
      setErrorMessage("Network error deleting product: " + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Print Table
  const handlePrint = () => {
    const tableElem = document.getElementById("printable-product-table");
    if (!tableElem) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Dispensary Inventory Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #ccc; background: #f4f4f5; font-size: 11px; text-transform: uppercase; }
            td { padding: 8px 12px; border-bottom: 1px solid #e4e4e7; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
            .in-stock { background: #dcfce7; color: #15803d; }
            .out-stock { background: #fee2e2; color: #b91c1c; }
          </style>
        </head>
        <body>
          <h1>Pharmacy Dispensary Inventory</h1>
          <p>Generated on ${new Date().toLocaleDateString("en-IN", { dateStyle: "full" })} | Node: ${userId || "Retailer"}</p>
          ${tableElem.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Filtered & Paginated
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter((p) => {
      const name = (p.name || p.product_name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const id = String(p.product_id ?? p.id ?? "").toLowerCase();
      const shelf = String(p.shelf_num || "").toLowerCase();
      return name.includes(term) || cat.includes(term) || id.includes(term) || shelf.includes(term);
    });
  }, [products, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Statistics
  const inStockCount = products.filter((p) => Number(p.quantity_of_uom ?? p.stock ?? 0) > 0).length;
  const outOfStockCount = products.filter((p) => Number(p.quantity_of_uom ?? p.stock ?? 0) === 0).length;

  return (
    <RetailerLayout
      title="Product Catalog & SKUs"
      subtitle="Manage dispensary pharmaceutical formulations, binary Blob photos, stock availability, and shelf locations."
      badge="Catalog & SKUs"
    >
      {loading ? (
        <ProductsPageSkeleton isLight={isLight} />
      ) : (
        <div className="space-y-6">
        {/* Toast Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* 3 Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* 1. Total Products */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Total Formulations
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700" : "bg-[#181920] border-neutral-700/60 text-neutral-300"
                }`}
              >
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-editorial text-3xl sm:text-4xl font-light ${isLight ? "text-neutral-900" : "text-white"}`}>
              {loading ? "—" : products.length}
            </div>
            <p className="text-xs text-neutral-500">Registered SKU inventory</p>
          </div>

          {/* 2. In Stock */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                In Stock & Dispensing
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
              {loading ? "—" : inStockCount}
            </div>
            <p className="text-xs text-neutral-500">Active dispensary items</p>
          </div>

          {/* 3. Out of Stock */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 space-y-2 transition-all ${
              isLight
                ? "bg-white border-neutral-200 shadow-sm"
                : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Depleted / Out of Stock
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? "bg-rose-50/80 border-rose-200 text-rose-600" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-light text-rose-500">
              {loading ? "—" : outOfStockCount}
            </div>
            <p className="text-xs text-neutral-500">Requires wholesale restock</p>
          </div>
        </div>

        {/* Main Table Card with Toolbar */}
        <div
          className={`border rounded-2xl p-5 sm:p-8 space-y-6 ${
            isLight
              ? "bg-white border-neutral-200 shadow-sm"
              : "bg-[#0d0e12] border-neutral-800/90 shadow-[0_12px_32px_rgba(0,0,0,0.7)]"
          }`}
        >
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? "text-neutral-400" : "text-neutral-500"}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search formulations by name, category, shelf, or SKU..."
                className={`w-full h-10 pl-10 pr-4 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                  isLight
                    ? "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white"
                    : "bg-[#14151a] border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:bg-[#181920]"
                }`}
              />
            </div>

            {/* Actions: Add Product + Print Table */}
            <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handlePrint}
                className={`h-10 px-4 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  isLight
                    ? "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300"
                    : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-200 border-neutral-800"
                }`}
                title="Print Inventory Table"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Table</span>
              </button>

              <Link
                href="/retailer/addproducts"
                className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${
                  isLight
                    ? "bg-neutral-900 hover:bg-black text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
            <table className="w-full text-left text-sm min-w-[840px]" id="printable-product-table">
              <thead
                className={`border-b ${
                  isLight
                    ? "bg-neutral-50/80 border-neutral-200 text-neutral-500"
                    : "bg-[#14151a] text-neutral-400 border-neutral-800"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">SKU ID</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Product Photo</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Medicine Formulation</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Category</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Expiry Date</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Price (₹)</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Stock</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">UOM</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Shelf</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-neutral-100" : "divide-neutral-800/60"}`}>
                {loading ? (
                  <TableSkeletonRows columns={11} rows={6} isLight={isLight} />
                ) : filteredProducts.length > 0 ? (
                  paginatedProducts.map((p) => {
                    const id = p.product_id ?? p.id ?? "—";
                    const qty = Number(p.quantity_of_uom ?? p.stock ?? p.quantity ?? 0);
                    const price = Number(p.price_per_unit ?? p.price ?? 0);
                    const isAvailable = qty > 0;
                    const imageUrl = getProductImageUrl(p.picture_of_the_prod);

                    return (
                      <tr
                        key={id}
                        onClick={() => setViewingProduct(p)}
                        className={`transition-colors cursor-pointer ${
                          isLight ? "hover:bg-neutral-50/80" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        {/* ID Chip */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                : "bg-[#181920] text-neutral-200 border-neutral-700/60"
                            }`}
                          >
                            #{id}
                          </span>
                        </td>

                        {/* Image Blob Thumbnail */}
                        <td className="py-3.5 px-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={p.name}
                              className="w-12 h-12 object-contain rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900 shadow-sm"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center border text-[10px] text-center px-1 ${
                                isLight
                                  ? "bg-neutral-100 border-neutral-200 text-neutral-400"
                                  : "bg-[#16171d] border-neutral-800 text-neutral-500"
                              }`}
                            >
                              No Photo
                            </div>
                          )}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className={`text-sm ${isLight ? "text-neutral-900" : "text-white"}`}>
                            {p.name || p.product_name || "—"}
                          </div>
                          {p.description && (
                            <div className="text-[11px] text-neutral-400 max-w-[200px] truncate">
                              {p.description}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className={`py-3.5 px-4 text-xs ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
                          {p.category || "General"}
                        </td>

                        {/* Expiry Date */}
                        <td className={`py-3.5 px-4 text-xs ${isLight ? "text-neutral-600" : "text-neutral-400"}`}>
                          {formatDisplayDate(p.exp_date)}
                        </td>

                        {/* Price */}
                        <td className={`py-3.5 px-4 text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Availability Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              isAvailable
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}
                          >
                            {isAvailable ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Available</span>
                              </>
                            ) : (
                              <>
                                <AlertOctagon className="w-3 h-3" />
                                <span>Out of Stock</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className={`py-3.5 px-4 text-xs font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>
                          {qty.toLocaleString("en-IN")}
                        </td>

                        {/* UOM */}
                        <td className="py-3.5 px-4 text-xs">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-700 border-neutral-200"
                                : "bg-[#16171d] text-neutral-300 border-neutral-800"
                            }`}
                          >
                            {p.uom_name || "each"}
                          </span>
                        </td>

                        {/* Shelf */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                              isLight
                                ? "bg-neutral-100 text-neutral-700 border-neutral-200"
                                : "bg-[#16171d] text-neutral-300 border-neutral-800"
                            }`}
                          >
                            {p.shelf_num || "A1"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => setViewingProduct(p)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="View Product Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200"
                                  : "bg-[#14151a] hover:bg-[#1a1b22] text-neutral-400 hover:text-white border-neutral-800"
                              }`}
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              disabled={isDeletingId === id}
                              onClick={() => handleDeleteProduct(id, p.name)}
                              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border-neutral-200 hover:border-rose-200"
                                  : "bg-[#14151a] hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border-neutral-800 hover:border-rose-500/30"
                              } ${isDeletingId === id ? "opacity-50 cursor-not-allowed" : ""}`}
                              title="Delete Product"
                            >
                              {isDeletingId === id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-xs text-neutral-400">
                      No matching pharmaceutical products found in inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            isLight={isLight}
          />
        </div>
      </div>
      )}

      {/* ======================================================== */}
      {/* 1. VIEW PRODUCT MODAL (Pop-up with blur background) */}
      {/* ======================================================== */}
      {viewingProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingProduct(null)}
        >
          <div
            className={`relative w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl transition-all ${
              isLight
                ? "bg-white border-neutral-200 text-neutral-900"
                : "bg-[#0f1016] border-neutral-800 text-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Clean product name without icon */}
            <div className="flex items-start justify-between p-6 border-b border-neutral-200/60 dark:border-neutral-800/80">
              <div className="space-y-1 pr-4 min-w-0">
                <h3 className="font-editorial text-2xl font-light leading-snug break-words">
                  {viewingProduct.name || viewingProduct.product_name || "Medicine SKU"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="font-medium text-neutral-300">
                    SKU #{viewingProduct.product_id ?? viewingProduct.id}
                  </span>
                  <span>&bull;</span>
                  <span>{viewingProduct.category || "General"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                    : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Product Photo Showcase */}
              <div
                className={`flex justify-center items-center p-5 rounded-2xl border transition-all ${
                  isLight
                    ? "bg-neutral-50/70 border-neutral-200"
                    : "bg-gradient-to-b from-[#14151f] to-[#0e0f16] border-neutral-800/80"
                }`}
              >
                {getProductImageUrl(viewingProduct.picture_of_the_prod) ? (
                  <img
                    src={getProductImageUrl(viewingProduct.picture_of_the_prod)}
                    alt={viewingProduct.name}
                    className="max-h-48 max-w-full object-contain rounded-xl drop-shadow-lg transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto text-neutral-500 opacity-60" />
                    <span>No image attached to this SKU</span>
                  </div>
                )}
              </div>

              {/* Data Grid: De-capitalized labels, generous spacing, no clipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* SKU Identifier */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    SKU Identifier
                  </span>
                  <span className="font-semibold text-sm block">
                    #{viewingProduct.product_id ?? viewingProduct.id}
                  </span>
                </div>

                {/* Therapeutic Category */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    Therapeutic Category
                  </span>
                  <span className="font-semibold text-sm block truncate">
                    {viewingProduct.category || "General"}
                  </span>
                </div>

                {/* Price per Unit */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    Price per Unit
                  </span>
                  <span className="font-semibold text-sm block">
                    ₹{Number(viewingProduct.price_per_unit ?? viewingProduct.price ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Stock Quantity */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    Stock Quantity
                  </span>
                  <span className="font-semibold text-sm block">
                    {Number(viewingProduct.quantity_of_uom ?? viewingProduct.stock ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Unit of Measurement (UOM) */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    Unit of Measurement (UOM)
                  </span>
                  <span className="font-semibold text-sm block">
                    {viewingProduct.uom_name || "each"}
                  </span>
                </div>

                {/* Shelf Location */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    Shelf Location
                  </span>
                  <span className="font-semibold text-sm block">
                    {viewingProduct.shelf_num || "A1"}
                  </span>
                </div>

                {/* Expiry Date (Safely formatted without clipping) */}
                <div
                  className={`p-3.5 rounded-2xl border min-w-0 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block mb-1">
                    Expiry Date
                  </span>
                  <span className="font-semibold text-sm block break-words">
                    {formatDisplayDate(viewingProduct.exp_date)}
                  </span>
                </div>
              </div>

              {/* Clinical Description */}
              {viewingProduct.description && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    isLight
                      ? "bg-neutral-50/70 border-neutral-200/80"
                      : "bg-[#14151e] border-neutral-800/80"
                  }`}
                >
                  <span className="text-xs font-medium text-neutral-400 block">
                    Clinical Description
                  </span>
                  <p className={`leading-relaxed ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                    {viewingProduct.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block">Dispensary Status</span>
                <span
                  className={`text-xs font-semibold ${
                    Number(viewingProduct.quantity_of_uom ?? viewingProduct.stock ?? 0) > 0
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }`}
                >
                  {Number(viewingProduct.quantity_of_uom ?? viewingProduct.stock ?? 0) > 0
                    ? "In Stock & Verified"
                    : "Depleted / Out of Stock"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className={`h-10 px-6 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  isLight ? "bg-neutral-900 hover:bg-black text-white" : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EDIT PRODUCT MODAL (Pop-up with blur background) */}
      {/* ======================================================== */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeEditModal}
        >
          <div
            className={`relative w-full max-w-xl rounded-3xl overflow-hidden border shadow-2xl transition-all ${
              isLight
                ? "bg-white border-neutral-200 text-neutral-900"
                : "bg-[#0f1016] border-neutral-800 text-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Clean title without colored icon */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200/60 dark:border-neutral-800/80">
              <div>
                <h3 className="font-editorial text-2xl font-light">Edit Medicine SKU</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Update pharmaceutical details or upload replacement product image blob.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                    : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Edit Form */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name || ""}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editFormData.category || ""}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Price per Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_per_unit"
                    value={editFormData.price_per_unit ?? ""}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity_of_uom"
                    value={editFormData.quantity_of_uom ?? ""}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Unit of Measurement (UOM)
                  </label>
                  <select
                    name="uom_id"
                    value={editFormData.uom_id ?? 1}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all cursor-pointer ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  >
                    {uoms.map((u) => (
                      <option key={u.uom_id} value={u.uom_id}>
                        {u.uom_name || `Unit #${u.uom_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    name="shelf_num"
                    value={editFormData.shelf_num || ""}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400 block">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="exp_date"
                    value={editFormData.exp_date || ""}
                    onChange={handleEditChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                      isLight
                        ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                        : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400 block">
                  Clinical Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={editFormData.description || ""}
                  onChange={handleEditChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none resize-none transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-black focus:bg-white"
                      : "bg-[#14151a] border-neutral-800 text-white focus:border-neutral-600 focus:bg-[#181920]"
                  }`}
                />
              </div>

              {/* Product Photo Upload / Replace */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80">
                <label className="text-xs font-medium text-neutral-400 block">
                  Update Product Photo (Blob File)
                </label>

                {editImagePreview && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-[#14151a]">
                    <img
                      src={editImagePreview}
                      alt="Current"
                      className="w-14 h-14 object-contain rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black shadow-sm"
                    />
                    <div className="text-xs text-neutral-400 flex-1">
                      {editFormData.newFileAttached ? "New image Blob selected" : "Current image from database"}
                    </div>
                  </div>
                )}

                <label
                  htmlFor="edit-image-file"
                  className={`border border-dashed rounded-2xl p-3.5 flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition-all ${
                    isLight
                      ? "border-neutral-300 hover:border-black hover:bg-neutral-50 text-neutral-700"
                      : "border-neutral-700 hover:border-neutral-500 hover:bg-[#14151a] text-neutral-300"
                  }`}
                >
                  <span>Choose replacement image file (Blob)</span>
                  <input
                    id="edit-image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className={`h-10 px-5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  isLight
                    ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                    : "border-neutral-700 text-neutral-300 hover:bg-[#14151a]"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className={`h-10 px-6 rounded-full text-xs font-semibold flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                  isLight ? "bg-neutral-900 text-white hover:bg-black" : "bg-white text-black hover:bg-neutral-200"
                } ${isSavingEdit ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RetailerLayout>
  );
}
